import type { AgentRunContext } from '../contracts.js';
import type { Plan } from './plan.types.js';
/**
 * Abstract Planner interface.
 * Takes a goal and returns a structured Plan (not yet executed).
 */
export interface Planner {
    createPlan(goal: string, ctx: AgentRunContext): Promise<Plan>;
}
/**
 * Default LLM-based planner.
 * Asks the LLM to produce a JSON plan with structured steps.
 * If the LLM output cannot be parsed as structured JSON, falls back to
 * a single-step plan with a direct LLM call.
 */
export declare class LlmPlanner implements Planner {
    private readonly planningModel?;
    constructor(planningModel?: string);
    createPlan(goal: string, ctx: AgentRunContext): Promise<Plan>;
    private parsePlanJson;
}
