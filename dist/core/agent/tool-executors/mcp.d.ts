import type { McpServerConfig } from '../mcp/McpServerConfig.js';
import type { AgentToolCall, ExecutionContext, ToolExecutor, ToolResult, ToolSchema } from '../contracts.js';
/**
 * Official SDK-backed MCP executor. A connection is created lazily and then
 * reused for the lifetime of a chat client, including local stdio servers.
 */
export declare class McpToolExecutor implements ToolExecutor {
    private readonly config;
    private readonly fallback?;
    private client?;
    private transport?;
    private connecting?;
    private toolCache;
    constructor(config: McpServerConfig, fallback?: ToolExecutor);
    execute(call: AgentToolCall, ctx: ExecutionContext): Promise<ToolResult>;
    listAvailableTools(_ctx: ExecutionContext): Promise<ToolSchema[]>;
    close(): Promise<void>;
    private connect;
    private createTransport;
}
