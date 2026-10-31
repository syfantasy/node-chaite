import * as crypto from 'node:crypto';
/**
 * Ephemeral, conversation-scoped MCP capability grants.
 * They deliberately contain only tool names: schemas are fetched from the
 * cached server manifest only after the LLM has selected matching MCP tools.
 */
export class McpCapabilityManager {
    constructor(servers, ttlMs = 30 * 60 * 1000, maxToolsPerServer = 5) {
        this.servers = servers;
        this.ttlMs = ttlMs;
        this.maxToolsPerServer = maxToolsPerServer;
        this.active = new Map();
        this.drafts = new Map();
    }
    async activate(context, serverRef, toolNames) {
        const manager = this.servers();
        if (!manager)
            throw new Error('MCP server manager is not configured');
        const candidates = await manager.listEnabled();
        const server = candidates.find(item => item.id === serverRef || item.name === serverRef);
        if (!server)
            throw new Error(`MCP server "${serverRef}" is not enabled or does not exist`);
        const manifest = server.tools ?? [];
        if (manifest.length === 0)
            throw new Error(`MCP server "${server.name}" has no cached tools. Test it in the panel first.`);
        const selected = [...new Set(toolNames)].slice(0, this.maxToolsPerServer);
        if (selected.length === 0)
            throw new Error('Choose at least one MCP tool to activate');
        const unknown = selected.filter(name => !manifest.some(tool => tool.name === name));
        if (unknown.length)
            throw new Error(`Unknown MCP tools: ${unknown.join(', ')}`);
        const scope = this.scope(context);
        const current = this.getActive(context).filter(item => item.server.id !== server.id);
        const capability = { server, toolNames: selected, expiresAt: Date.now() + this.ttlMs };
        this.active.set(scope, [...current, capability]);
        return capability;
    }
    getActive(context) {
        const scope = this.scope(context);
        const capabilities = (this.active.get(scope) ?? []).filter(item => item.expiresAt > Date.now());
        if (capabilities.length)
            this.active.set(scope, capabilities);
        else
            this.active.delete(scope);
        return capabilities;
    }
    clear(context) { this.active.delete(this.scope(context)); }
    createDraft(config) {
        const id = crypto.randomUUID().slice(0, 8);
        const expiresAt = Date.now() + 10 * 60 * 1000;
        this.drafts.set(id, { config, expiresAt });
        return { id, expiresAt };
    }
    takeDraft(id) {
        const draft = this.drafts.get(id);
        this.drafts.delete(id);
        return draft && draft.expiresAt > Date.now() ? draft.config : null;
    }
    scope(context) {
        const event = context.getEvent();
        const options = context.getOptions();
        return [
            event?.sender?.user_id ?? 'unknown',
            event?.group?.group_id ?? 'private',
            options?.conversationId ?? 'new',
            context.presetId ?? 'default',
        ].join(':');
    }
}
