import type EventEmitter from 'node:events';
import type { BasicStorage } from '../../types/storage.js';
import type { ILogger } from '../../types/common.js';
import type { AgentRunContext, BackgroundJobSpec, IBackgroundJobManager } from '../contracts.js';
import type { BackgroundJob, JobProgressPayload } from './job.types.js';
export interface BackgroundJobManagerOptions {
    storage: BasicStorage<BackgroundJob>;
    eventEmitter: EventEmitter;
    logger: ILogger;
    /** Max concurrent running jobs. Default: 3 */
    maxConcurrent?: number;
}
/**
 * JobExecutorFn is the actual async work of a job.
 * It receives the jobId and an onProgress callback to emit intermediate updates.
 * It should return the final output string.
 */
export type JobExecutorFn = (jobId: string, onProgress: (progress: Omit<JobProgressPayload, 'jobId'>) => void) => Promise<string>;
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
export declare class BackgroundJobManager implements IBackgroundJobManager {
    private readonly opts;
    private runningCount;
    private readonly maxConcurrent;
    private readonly queue;
    constructor(opts: BackgroundJobManagerOptions);
    /**
     * Create a job and schedule it for execution.
     * @returns jobId
     */
    createAndRun(spec: BackgroundJobSpec, executor?: JobExecutorFn): Promise<string>;
    getJob(jobId: string): Promise<BackgroundJob | null>;
    listJobs(userId?: string): Promise<BackgroundJob[]>;
    private schedule;
    private start;
    private drainQueue;
    /**
     * Default executor used when createAndRun is called without an explicit executor
     * (e.g. from the spawn_background_task tool).
     * Subclasses or factory patterns can override this to inject plan/workflow execution.
     */
    private makeDefaultExecutor;
    /**
     * Build an executor that runs a full agent pipeline for a given goal.
     * Called by the Chaite composition root after wiring ctx.
     */
    buildAgentExecutor(makeRunContext: (jobId: string) => AgentRunContext, planExecutor?: import('../planning/PlanExecutor.js').PlanExecutor): JobExecutorFn;
}
