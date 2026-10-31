import * as crypto from 'node:crypto';
const JOB_STORAGE_PREFIX = 'job:';
/**
 * BackgroundJobManager manages the full lifecycle of background jobs:
 *   create → queue → run → complete/fail → emit events
 *
 * Consumers (e.g. karin-plugin-chaite) listen to Chaite EventEmitter:
 *   chaite.on('job:complete', (payload: JobCompletePayload) => { ... send QQ message })
 *   chaite.on('job:progress', (payload: JobProgressPayload) => { ... update status })
 *
 * System tools (spawn_background_task, check_job_status) interact with this manager
 * via ChaiteContext.getChaite().getBackgroundJobManager().
 */
export class BackgroundJobManager {
    constructor(opts) {
        this.opts = opts;
        this.runningCount = 0;
        this.queue = [];
        this.maxConcurrent = opts.maxConcurrent ?? 3;
    }
    /**
     * Create a job and schedule it for execution.
     * @returns jobId
     */
    async createAndRun(spec, executor) {
        const jobId = crypto.randomUUID();
        const now = Date.now();
        const job = {
            id: jobId,
            description: spec.description,
            userId: spec.userId,
            groupId: spec.groupId,
            skillName: spec.skillName,
            conversationId: spec.conversationId,
            status: 'queued',
            createdAt: now,
            updatedAt: now,
        };
        await this.opts.storage.setItem(JOB_STORAGE_PREFIX + jobId, job);
        this.opts.eventEmitter.emit('job:queued', { jobId, userId: spec.userId, groupId: spec.groupId });
        const effectiveExecutor = executor ?? this.makeDefaultExecutor(spec);
        // Schedule without blocking the caller
        setImmediate(() => this.schedule(job, effectiveExecutor));
        return jobId;
    }
    async getJob(jobId) {
        return this.opts.storage.getItem(JOB_STORAGE_PREFIX + jobId);
    }
    async listJobs(userId) {
        const all = await this.opts.storage.listItems();
        return userId ? all.filter(j => j.userId === userId) : all;
    }
    schedule(job, executor) {
        if (this.runningCount >= this.maxConcurrent) {
            this.queue.push({ job, executor });
            this.opts.logger.info(`[BackgroundJobManager] Job ${job.id} queued (${this.queue.length} waiting)`);
            return;
        }
        this.start(job, executor);
    }
    start(job, executor) {
        this.runningCount++;
        const onProgress = (progress) => {
            const payload = { jobId: job.id, ...progress };
            this.opts.eventEmitter.emit('job:progress', payload);
        };
        const run = async () => {
            job.status = 'running';
            job.updatedAt = Date.now();
            await this.opts.storage.setItem(JOB_STORAGE_PREFIX + job.id, job);
            this.opts.eventEmitter.emit('job:start', {
                jobId: job.id,
                userId: job.userId,
                groupId: job.groupId,
            });
            this.opts.logger.info(`[BackgroundJobManager] Job ${job.id} started: "${job.description}"`);
            let result;
            let error;
            try {
                result = await executor(job.id, onProgress);
                job.status = 'done';
                job.result = result;
            }
            catch (err) {
                error = err instanceof Error ? err.message : String(err);
                job.status = 'failed';
                job.error = error;
                this.opts.logger.error(`[BackgroundJobManager] Job ${job.id} failed: ${error}`);
            }
            job.updatedAt = Date.now();
            await this.opts.storage.setItem(JOB_STORAGE_PREFIX + job.id, job);
            const eventName = job.status === 'done' ? 'job:complete' : 'job:failed';
            const payload = {
                jobId: job.id,
                userId: job.userId,
                groupId: job.groupId,
                status: job.status,
                result: job.result,
                error: job.error,
                planId: job.planId,
            };
            this.opts.eventEmitter.emit(eventName, payload);
            this.opts.logger.info(`[BackgroundJobManager] Job ${job.id} ${job.status}`);
            this.runningCount--;
            this.drainQueue();
        };
        // Run asynchronously, do not await
        run().catch((err) => {
            this.opts.logger.error(`[BackgroundJobManager] Unexpected error in job ${job.id}: ${String(err)}`);
            this.runningCount--;
            this.drainQueue();
        });
    }
    drainQueue() {
        if (this.queue.length > 0 && this.runningCount < this.maxConcurrent) {
            const next = this.queue.shift();
            this.start(next.job, next.executor);
        }
    }
    /**
     * Default executor used when createAndRun is called without an explicit executor
     * (e.g. from the spawn_background_task tool).
     * Subclasses or factory patterns can override this to inject plan/workflow execution.
     */
    makeDefaultExecutor(spec) {
        // This will be replaced with proper plan/LLM execution once AgentRunContext is wired.
        // A thin default that logs the payload — callers should provide a real executor.
        return async (jobId, _onProgress) => {
            this.opts.logger.info(`[BackgroundJobManager] Default executor for job ${jobId}: "${spec.description}"`);
            return `Job "${spec.description}" was queued but no executor was provided.`;
        };
    }
    /**
     * Build an executor that runs a full agent pipeline for a given goal.
     * Called by the Chaite composition root after wiring ctx.
     */
    buildAgentExecutor(makeRunContext, planExecutor) {
        return async (jobId, onProgress) => {
            const ctx = makeRunContext(jobId);
            if (planExecutor) {
                const job = await this.getJob(jobId);
                const goal = (job?.description) ?? 'execute task';
                // Wire progress → job:progress event via onProgress
                const origEmit = ctx.emitAudit;
                ctx.emitAudit = (event) => {
                    origEmit?.(event);
                    if (event.type === 'job:progress' && event.data) {
                        onProgress({
                            userId: job?.userId ?? '',
                            groupId: job?.groupId,
                            planId: event.planId,
                            stepIndex: event.data.doneSteps,
                            stepTotal: event.data.totalSteps,
                            stepTitle: event.data.currentStep?.title,
                        });
                    }
                };
                const { output, plan } = await planExecutor.execute(goal, ctx, jobId);
                // Update job's planId
                const storedJob = await this.getJob(jobId);
                if (storedJob) {
                    storedJob.planId = plan.id;
                    await this.opts.storage.setItem(JOB_STORAGE_PREFIX + jobId, storedJob);
                }
                return output;
            }
            // Fallback: simple single-turn LLM call
            const job = await this.getJob(jobId);
            const goal = job?.description ?? 'execute task';
            const resp = await ctx.sendMessage(goal);
            return resp.contents?.map(c => ('text' in c ? c.text : '')).join('') ?? '';
        };
    }
}
