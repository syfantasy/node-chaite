import type { AgentRunContext } from '../contracts.js'
import type { WorkflowDefinition, WorkflowRunResult } from './workflow.types.js'

/**
 * Abstract interface for workflow engines.
 * Implementations can vary in how they interpret the workflow definition
 * (e.g. simple sequential, async DAG, remote orchestrator).
 */
export interface WorkflowEngine {
  run(workflow: WorkflowDefinition, ctx: AgentRunContext): Promise<WorkflowRunResult>
}
