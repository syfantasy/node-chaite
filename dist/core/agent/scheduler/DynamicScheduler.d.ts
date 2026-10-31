import type EventEmitter from 'node:events';
import type { BasicStorage } from '../../types/storage.js';
import type { ILogger } from '../../types/common.js';
import type { AgentRunContext } from '../contracts.js';
export interface ScheduledTask {
    id: string;
    description: string;
    /** ISO datetime string OR cron expression (e.g. "0 17 * * *") */
    schedule: string;
    /** If true, task cancels itself after first execution */
    oneShot: boolean;
    userId: string;
    groupId?: string;
    /** The agent goal to run when the task fires */
    goal: string;
    /**
     * Optional: name of a Skill whose workflow/plan to execute at fire time.
     * When set, the task routes directly to that skill's executionMode
     * instead of relying on keyword matching from the goal string.
     */
    skillName?: string;
    status: 'active' | 'cancelled' | 'done';
    createdAt: number;
    /** Timestamp of last execution */
    lastFiredAt?: number;
    /** Next scheduled execution (ISO string, for display) */
    nextFireAt?: string;
}
export interface DynamicSchedulerOptions {
    storage: BasicStorage<ScheduledTask>;
    eventEmitter: EventEmitter;
    logger: ILogger;
    /** Called when a task fires — runs the agent and returns output */
    runAgent: (task: ScheduledTask, ctx: AgentRunContext) => Promise<string>;
    /**
     * Build a run context for a scheduled task execution.
     * Implementations MUST forward task.skillName to buildAgentRunContext({ skillName: task.skillName })
     * so that skills with executionMode=workflow|plan are correctly routed.
     *
     * Example:
     *   buildRunContext: (task) => chaite.buildAgentRunContext({
     *     skillName: task.skillName,
     *     userId: task.userId,
     *     groupId: task.groupId,
     *   })
     */
    buildRunContext: (task: ScheduledTask) => AgentRunContext;
}
/**
 * DynamicScheduler allows programmatic (LLM-driven) creation of scheduled tasks.
 *
 * Unlike the static CronTrigger (which requires a developer to write a .js file),
 * DynamicScheduler tasks are created at runtime via the schedule_task tool and
 * persisted in storage so they can be restored after restarts.
 *
 * At fire time:
 *   1. Build AgentRunContext
 *   2. Call runAgent(task, ctx) → the agent fetches data and returns output
 *   3. Emit 'job:complete' with the output → consumed by QQ plugin → sends message
 */
export declare class DynamicScheduler {
    private readonly opts;
    private jobs;
    constructor(opts: DynamicSchedulerOptions);
    /**
     * Schedule a new task. Returns the task id.
     * @param schedule ISO datetime OR cron expression
     * @param goal Agent goal to run when the task fires
     * @param oneShot If true, runs once and cancels
     */
    scheduleTask(params: {
        schedule: string;
        goal: string;
        description: string;
        oneShot: boolean;
        userId: string;
        groupId?: string;
        skillName?: string;
    }): Promise<ScheduledTask>;
    cancelTask(taskId: string): Promise<boolean>;
    getTask(taskId: string): Promise<ScheduledTask | null>;
    listTasks(userId?: string): Promise<ScheduledTask[]>;
    /**
     * Restore all active tasks from storage on startup.
     * Should be called once during initialization.
     */
    restoreFromStorage(): Promise<void>;
    private createJob;
    private fire;
    private isIsoDatetime;
}
