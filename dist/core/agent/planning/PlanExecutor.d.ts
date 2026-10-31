import type { AgentRunContext } from '../contracts.js';
import type { Planner } from './Planner.js';
import type { PlanReviewer } from './PlanReviewer.js';
import type { Plan } from './plan.types.js';
export interface PlanExecutorOptions {
    planner: Planner;
    /** If provided, self-correction is enabled after each step */
    reviewer?: PlanReviewer;
    /** Max retries per step */
    maxStepRetries?: number;
    /** Storage key prefix; defaults to "plan:" */
    storagePrefix?: string;
}
/**
 * Executes a Plan created by a Planner.
 *
 * Lifecycle:
 *  1. planner.createPlan → structured Plan object
 *  2. Persist plan to storage (planId queryable by check_plan_progress)
 *  3. For each pending step (topological order):
 *     a. Set status=running, persist
 *     b. Execute step (LLM call or tool call based on toolHint)
 *     c. Set status=done/failed, persist
 *     d. Emit plan:step:end audit event (Chaite.emit job:progress)
 *     e. Optional: reviewer.review → if shouldRevise, replace pending steps
 *  4. Set plan.status=done/failed, persist
 *  5. Return final output
 */
export declare class PlanExecutor {
    private readonly opts;
    private readonly storagePrefix;
    constructor(opts: PlanExecutorOptions);
    execute(goal: string, ctx: AgentRunContext, jobId?: string): Promise<{
        plan: Plan;
        output: string;
    }>;
    private runPendingSteps;
    private getNextReady;
    private executeStep;
    getPlan(planId: string, ctx: AgentRunContext): Promise<Plan | null>;
    private savePlan;
}
