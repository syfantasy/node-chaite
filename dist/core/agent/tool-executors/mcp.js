import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
/**
 * Official SDK-backed MCP executor. A connection is created lazily and then
 * reused for the lifetime of a chat client, including local stdio servers.
 */
export class McpToolExecutor {
    constructor(config, fallback) {
        this.config = config;
        this.fallback = fallback;
        this.toolCache = null;
    }
    async execute(call, ctx) {
        try {
            const client = await this.connect();
            const result = await withTimeout(client.callTool({ name: call.name, arguments: call.arguments }), ctx.timeoutMs ?? this.config.timeoutMs ?? 15_000);
            const contents = result.content ?? [];
            const outputText = contents
                .map(content => content.type === 'text' ? content.text ?? '' : JSON.stringify(content))
                .join('\n')
                .trim();
            if (result.isError) {
                return { id: call.id, name: call.name, ok: false, outputText, error: { kind: 'FATAL', message: outputText || `MCP tool "${call.name}" failed` } };
            }
            return { id: call.id, name: call.name, ok: true, outputText };
        }
        catch (error) {
            if (this.fallback)
                return this.fallback.execute(call, ctx);
            return { id: call.id, name: call.name, ok: false, outputText: '', error: { kind: 'RETRYABLE', message: error instanceof Error ? error.message : String(error), cause: error } };
        }
    }
    async listAvailableTools(_ctx) {
        if (this.toolCache)
            return this.toolCache;
        const client = await this.connect();
        const result = await withTimeout(client.listTools(), this.config.timeoutMs ?? 10_000);
        this.toolCache = result.tools.map(tool => ({ name: tool.name, description: tool.description, schema: tool.inputSchema }));
        return this.toolCache;
    }
    async close() {
        this.toolCache = null;
        this.connecting = undefined;
        const transport = this.transport;
        this.client = undefined;
        this.transport = undefined;
        await transport?.close();
    }
    async connect() {
        if (this.client)
            return this.client;
        if (!this.connecting) {
            this.connecting = (async () => {
                const client = new Client({ name: 'chaite', version: '1.0.0' });
                const transport = this.createTransport();
                await client.connect(transport);
                this.client = client;
                this.transport = transport;
                return client;
            })().catch(error => {
                this.connecting = undefined;
                throw error;
            });
        }
        return this.connecting;
    }
    createTransport() {
        const transport = this.config.transport ?? 'streamable-http';
        if (transport === 'stdio') {
            if (!this.config.command?.trim())
                throw new Error('MCP stdio server requires a command');
            return new StdioClientTransport({
                command: this.config.command,
                args: this.config.args ?? [],
                env: this.config.env,
                cwd: this.config.cwd,
                stderr: 'pipe',
            });
        }
        const url = this.config.url ?? this.config.baseUrl;
        if (!url?.trim())
            throw new Error('MCP HTTP/SSE server requires a URL');
        const headers = { ...(this.config.headers ?? {}) };
        if (this.config.authHeader && !headers.Authorization)
            headers.Authorization = this.config.authHeader;
        const requestInit = { headers };
        return transport === 'sse'
            ? new SSEClientTransport(new URL(url), { requestInit })
            : new StreamableHTTPClientTransport(new URL(url), { requestInit });
    }
}
function withTimeout(promise, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`MCP request timeout after ${timeoutMs}ms`)), timeoutMs);
        promise.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
    });
}
