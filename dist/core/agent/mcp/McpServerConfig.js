import * as crypto from 'node:crypto';
/**
 * Manager for MCP server configurations.
 * CRUD over BasicStorage — no cloud sharing (configs contain private credentials).
 *
 * These configs are used by Chaite.buildToolExecutor() to create McpToolExecutors
 * and attach them to channels at startup.
 */
export class McpServerManager {
    constructor(storage) {
        this.storage = storage;
    }
    async add(config) {
        const now = Date.now();
        const full = {
            ...config,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        };
        await this.storage.setItem(full.id, full);
        return full;
    }
    async update(id, patch) {
        const existing = await this.storage.getItem(id);
        if (!existing)
            return null;
        const updated = { ...existing, ...patch, id, updatedAt: Date.now() };
        await this.storage.setItem(id, updated);
        return updated;
    }
    async delete(id) {
        await this.storage.removeItem(id);
    }
    async get(id) {
        return this.storage.getItem(id);
    }
    async list() {
        return this.storage.listItems();
    }
    async listEnabled() {
        const all = await this.list();
        return all.filter(c => c.enabled);
    }
    async listEnabledForToolGroups(toolGroupIds) {
        const selected = new Set(toolGroupIds);
        return (await this.listEnabled()).filter(server => (server.toolGroupIds ?? []).some(id => selected.has(id)));
    }
}
