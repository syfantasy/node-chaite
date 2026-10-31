import { MEMORY_LIMITS, } from './types.js';
import { createMemoryTools } from '../agent/tools/memory-tools.js';
export * from './types.js';
export class DefaultMemoryProvider {
    constructor(storage) {
        this.storage = storage;
        this.id = 'builtin-lightweight';
        this.name = 'Chaite 内置轻量分群记忆（优先队列与群隔离）';
    }
    async injectContext(context, options) {
        const event = context.getEvent();
        const gid = options?.groupId || (event?.group_id ? String(event.group_id) : (event?.group?.group_id ? String(event.group.group_id) : undefined));
        const uid = options?.userId || (event?.user_id ? String(event.user_id) : (event?.sender?.user_id ? String(event.sender.user_id) : undefined));
        const lines = [];
        if (gid) {
            // 1. 本群共享记忆（全量注入，最多 20 条）
            const groupMems = await this.storage.getMemories({ scope: 'group', groupId: gid, limit: MEMORY_LIMITS.group });
            if (groupMems.length > 0) {
                lines.push(`【当前群聊共享记忆 (${groupMems.length}/${MEMORY_LIMITS.group})】`);
                for (const m of groupMems) {
                    lines.push(`- [${m.key}] ${m.content} (重要度: ${m.importance})`);
                }
            }
            // 2. 当前提问者在「本群」的记忆（严格群隔离，全量注入，最多 20 条）
            if (uid) {
                const groupUserMems = await this.storage.getMemories({
                    scope: 'group_user',
                    groupId: gid,
                    userId: uid,
                    limit: MEMORY_LIMITS.group_user,
                });
                if (groupUserMems.length > 0) {
                    lines.push(`【发言者在当前群的个人事实 (QQ: ${uid}) (${groupUserMems.length}/${MEMORY_LIMITS.group_user})】（仅在本群生效，严格隔离）`);
                    for (const m of groupUserMems) {
                        lines.push(`- [${m.key}] ${m.content} (重要度: ${m.importance})`);
                    }
                }
            }
        }
        else if (uid) {
            // 3. 私聊场景下的个人记忆（全量注入，最多 30 条）
            const privateMems = await this.storage.getMemories({
                scope: 'private_user',
                userId: uid,
                limit: MEMORY_LIMITS.private_user,
            });
            if (privateMems.length > 0) {
                lines.push(`【私聊用户个人记忆 (QQ: ${uid}) (${privateMems.length}/${MEMORY_LIMITS.private_user})】`);
                for (const m of privateMems) {
                    lines.push(`- [${m.key}] ${m.content} (重要度: ${m.importance})`);
                }
            }
        }
        if (lines.length === 0) {
            return undefined;
        }
        return `<long_term_memory>\n${lines.join('\n')}\n</long_term_memory>`;
    }
    getTools() {
        return createMemoryTools();
    }
    async getMemories(filter) {
        return this.storage.getMemories(filter);
    }
    async setMemory(input) {
        return this.storage.setMemory(input);
    }
    async updateImportance(scope, targetId, key, newImportance) {
        return this.storage.updateImportance(scope, targetId, key, newImportance);
    }
    async deleteMemory(idOrFilter) {
        return this.storage.deleteMemory(idOrFilter);
    }
    getStorage() {
        return this.storage;
    }
}
export class MemoryManager {
    constructor(defaultProvider) {
        this.providers = new Map();
        this.activeProvider = defaultProvider;
        this.providers.set(defaultProvider.id, defaultProvider);
    }
    registerProvider(provider, setAsActive = true) {
        this.providers.set(provider.id, provider);
        if (setAsActive) {
            this.activeProvider = provider;
        }
    }
    getActiveProvider() {
        return this.activeProvider;
    }
    getProvider(id) {
        return this.providers.get(id);
    }
    setActiveProvider(id) {
        const p = this.providers.get(id);
        if (p) {
            this.activeProvider = p;
            return true;
        }
        return false;
    }
}
