import type { AgentRunContext } from '../contracts.js';
import type { WorkflowEngine } from './WorkflowEngine.js';
import type { WorkflowDefinition, WorkflowRunResult } from './workflow.types.js';
/**
 * Lightweight workflow runner.
 * Supports: sequential, conditional branching, parallel (Promise.all),
 * background jobs, plan steps, and nested sub-workflows.
 */
export declare class SimpleWorkflowRunner implements WorkflowEngine {
    run(workflow: WorkflowDefinition, ctx: AgentRunContext): Promise<WorkflowRunResult>;
    private runSteps;
    private runStep;
    private interpolate;
    private executeStep;
}
