import type { Tool, Parameter } from '../../types/tools.js';
import type { ChaiteContext } from '../../types/common.js';
import type { ToolExecutor, ToolSchema } from '../contracts.js';
/**
 * Wraps a remote tool schema (from MCP or any ToolExecutor) as an in-process Tool.
 *
 * This allows local and remote tools to coexist in the same tool list.
 * AbstractClient.fullfillTools() creates these proxies for each tool
 * discovered via toolExecutor.listAvailableTools(), then adds them to this.tools.
 * The execution loop then uniformly calls tool.run() for every tool —
 * no if/else branching needed.
 */
export declare class McpToolProxy implements Tool {
    private readonly executor;
    private readonly execCtxBuilder;
    readonly name: string;
    readonly type: "function";
    readonly function: {
        name: string;
        description: string;
        parameters: Parameter;
    };
    constructor(schema: ToolSchema, executor: ToolExecutor, execCtxBuilder: () => import('../contracts.js').ExecutionContext);
    run(args: Record<string, unknown>, _context?: ChaiteContext): Promise<string>;
}
