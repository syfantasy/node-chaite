import type { AgentRunContext } from '../contracts.js';
import type { Plan, PlanStep } from './plan.types.js';
export interface ReviewResult {
    /** Whether the remaining plan should be revised */
    shouldRevise: boolean;
    /** Replacement for remaining pending steps; undefined = keep as-is */
    revisedSteps?: PlanStep[];
    reason?: string;
}
/**
 * Abstract PlanReviewer interface.
 * Called after each step completes to decide whether to revise the remaining plan.
 */
export interface PlanReviewer {
    review(plan: Plan, completedStepId: string, ctx: AgentRunContext): Promise<ReviewResult>;
}
/**
 * LLM-based plan reviewer.
 * Asks the LLM whether the remaining steps should be revised given what was learned.
 * Only triggers if the step result is significantly unexpected.
 */
export declare class LlmPlanReviewer implements PlanReviewer {
    private readonly model?;
    constructor(model?: string);
    review(plan: Plan, completedStepId: string, ctx: AgentRunContext): Promise<ReviewResult>;
}
/**
 * No-op reviewer that never revises.
 * Use when you want deterministic execution without LLM-based self-correction.
 */
export declare class NoopPlanReviewer implements PlanReviewer {
    review(_plan: Plan, _completedStepId: string, _ctx: AgentRunContext): Promise<ReviewResult>;
}
