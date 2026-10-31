import type { AgentToolCall, ExecutionContext, ToolExecutor, ToolResult, ToolSchema } from '../contracts.js';
import type { Tool } from '../../types/tools.js';
/**
 * Default fallback executor: runs tools in-process via tool.run().
 * Used when no remote/sandbox executor is configured.
 */
export declare class LocalToolExecutor implements ToolExecutor {
    private readonly getTools;
    constructor(getTools: () => Tool[]);
    execute(call: AgentToolCall, _ctx: ExecutionContext): Promise<ToolResult>;
    listAvailableTools(_ctx: ExecutionContext): Promise<ToolSchema[]>;
}
