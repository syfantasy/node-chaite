/**
 * Default fallback executor: runs tools in-process via tool.run().
 * Used when no remote/sandbox executor is configured.
 */
export class LocalToolExecutor {
    constructor(getTools) {
        this.getTools = getTools;
    }
    async execute(call, _ctx) {
        const tool = this.getTools().find(t => t.function.name === call.name);
        if (!tool) {
            return {
                id: call.id,
                name: call.name,
                ok: false,
                outputText: '',
                error: {
                    kind: 'FATAL',
                    message: `Tool "${call.name}" not found in local registry`,
                },
            };
        }
        try {
            const raw = await tool.run(call.arguments);
            const outputText = typeof raw === 'string' ? raw : JSON.stringify(raw);
            return { id: call.id, name: call.name, ok: true, outputText };
        }
        catch (err) {
            return {
                id: call.id,
                name: call.name,
                ok: false,
                outputText: '',
                error: {
                    kind: 'RETRYABLE',
                    message: err instanceof Error ? err.message : String(err),
                    cause: err,
                },
            };
        }
    }
    listAvailableTools(_ctx) {
        return Promise.resolve(this.getTools().map(t => ({
            name: t.function.name,
            description: t.function.description,
            schema: t.function.parameters,
        })));
    }
}
