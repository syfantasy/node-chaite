import * as crypto from 'node:crypto';
/**
 * Wraps a remote tool schema (from MCP or any ToolExecutor) as an in-process Tool.
 *
 * This allows local and remote tools to coexist in the same tool list.
 * AbstractClient.fullfillTools() creates these proxies for each tool
 * discovered via toolExecutor.listAvailableTools(), then adds them to this.tools.
 * The execution loop then uniformly calls tool.run() for every tool —
 * no if/else branching needed.
 */
export class McpToolProxy {
    constructor(schema, executor, execCtxBuilder) {
        this.executor = executor;
        this.execCtxBuilder = execCtxBuilder;
        this.type = 'function';
        this.name = schema.name;
        this.function = {
            name: schema.name,
            description: (schema.description ?? ''),
            parameters: schema.schema ?? {
                type: 'object',
                properties: {},
                required: [],
            },
        };
    }
    async run(args, _context) {
        const result = await this.executor.execute({ id: crypto.randomUUID(), name: this.name, arguments: args }, this.execCtxBuilder());
        if (!result.ok) {
            throw new Error(result.error?.message ?? `MCP tool "${this.name}" failed`);
        }
        return result.outputText;
    }
}
