import * as crypto from 'node:crypto';
import { MEMORY_LIMITS, } from '../../memory/types.js';
import { SqlKvStorage } from '../sql_storage.js';
import { MEMORIES } from './tables.js';
function clampImportance(val) {
    if (val === undefined || Number.isNaN(val))
        return 50;
    return Math.max(1, Math.min(100, Math.round(Number(val))));
}
function buildTargetId(scope, groupId, userId) {
    if (scope === 'group')
        return `group:${groupId || 'unknown'}`;
    if (scope === 'group_user')
        return `group:${groupId || 'unknown'}:user:${userId || 'unknown'}`;
    if (scope === 'private_user')
        return `private:user:${userId || 'unknown'}`;
    return 'unknown';
}
function getLimitForScope(scope) {
    return MEMORY_LIMITS[scope] || 20;
}
const spec = {
    table: MEMORIES.table,
    columns: MEMORIES.columns,
    indexes: [
        { columns: ['scope', 'targetId'], name: 'idx_memories_scope_target' },
        { columns: ['scope', 'targetId', 'key'], name: 'idx_memories_scope_target_key' },
        { columns: ['groupId'], name: 'idx_memories_group_id' },
        { columns: ['userId'], name: 'idx_memories_user_id' },
        { columns: ['importance'], name: 'idx_memories_importance' },
    ],
    filterable: ['id', 'scope', 'groupId', 'userId', 'targetId', 'key'],
    toRecord(record, id) {
        return {
            id: id || record.id || crypto.randomUUID(),
            scope: record.scope,
            groupId: record.groupId ?? null,
            userId: record.userId ?? null,
            targetId: record.targetId || buildTargetId(record.scope, record.groupId, record.userId),
            key: record.key,
            content: record.content,
            importance: clampImportance(record.importance),
            updatedAt: record.updatedAt || Date.now(),
        };
    },
    fromRecord(record) {
        if (!record)
            return null;
        return {
            id: record.id,
            scope: record.scope,
            groupId: record.groupId || null,
            userId: record.userId || null,
            targetId: record.targetId,
            key: record.key,
            content: record.content,
            importance: clampImportance(Number(record.importance)),
            updatedAt: Number(record.updatedAt || 0),
        };
    },
};
export class SqlMemoryStorage extends SqlKvStorage {
    constructor(driver) {
        super(driver, spec);
    }
    getName() {
        return 'SqlMemoryStorage';
    }
    async getMemories(filter) {
        await this.ensureInitialized();
        const table = this.q(this.table);
        const conditions = [];
        const params = [];
        if (filter.scope) {
            conditions.push(`${this.q('scope')} = ?`);
            params.push(filter.scope);
        }
        if (filter.groupId !== undefined) {
            if (filter.groupId === null) {
                conditions.push(`${this.q('groupId')} IS NULL`);
            }
            else {
                conditions.push(`${this.q('groupId')} = ?`);
                params.push(filter.groupId);
            }
        }
        if (filter.userId !== undefined) {
            if (filter.userId === null) {
                conditions.push(`${this.q('userId')} IS NULL`);
            }
            else {
                conditions.push(`${this.q('userId')} = ?`);
                params.push(filter.userId);
            }
        }
        if (filter.targetId) {
            conditions.push(`${this.q('targetId')} = ?`);
            params.push(filter.targetId);
        }
        if (filter.key) {
            conditions.push(`${this.q('key')} = ?`);
            params.push(filter.key);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limit = filter.limit ? Math.max(1, Math.min(filter.limit, 100)) : 100;
        const offset = Math.max(0, filter.offset || 0);
        // 默认按重要度降序，同重要度按更新时间降序
        const sql = `SELECT * FROM ${table} ${whereClause} ORDER BY ${this.q('importance')} DESC, ${this.q('updatedAt')} DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        const rows = await this.driver.all(sql, params);
        return rows.map(r => spec.fromRecord(r)).filter(Boolean);
    }
    async setMemory(input) {
        await this.ensureInitialized();
        const targetId = buildTargetId(input.scope, input.groupId, input.userId);
        const table = this.q(this.table);
        const importance = clampImportance(input.importance);
        const maxLimit = getLimitForScope(input.scope);
        // 1. 检查是否存在同名 key
        const existing = await this.driver.all(`SELECT id FROM ${table} WHERE ${this.q('scope')} = ? AND ${this.q('targetId')} = ? AND ${this.q('key')} = ?`, [input.scope, targetId, input.key]);
        if (existing.length > 0) {
            const id = existing[0].id;
            await this.setItem(id, {
                id,
                scope: input.scope,
                groupId: input.groupId ?? null,
                userId: input.userId ?? null,
                targetId,
                key: input.key,
                content: input.content,
                importance,
                updatedAt: Date.now(),
            });
            return {
                success: true,
                action: 'updated',
                message: `记忆 [${input.key}] 已成功更新 (重要度: ${importance})`,
            };
        }
        // 2. 检查是否达到容量上限
        const currentRows = await this.driver.all(`SELECT id, ${this.q('key')} as k, ${this.q('importance')} as imp, ${this.q('updatedAt')} as ts FROM ${table} WHERE ${this.q('targetId')} = ? ORDER BY ${this.q('importance')} ASC, ${this.q('updatedAt')} ASC`, [targetId]);
        if (currentRows.length >= maxLimit) {
            // 库已满：比较最低分条目
            const lowest = currentRows[0];
            const lowestImp = Number(lowest.imp || 0);
            if (importance > lowestImp) {
                // 新记忆分值更高：淘汰最低的一条
                await this.driver.run(`DELETE FROM ${table} WHERE id = ?`, [lowest.id]);
                const id = crypto.randomUUID();
                await this.setItem(id, {
                    id,
                    scope: input.scope,
                    groupId: input.groupId ?? null,
                    userId: input.userId ?? null,
                    targetId,
                    key: input.key,
                    content: input.content,
                    importance,
                    updatedAt: Date.now(),
                });
                return {
                    success: true,
                    action: 'replaced',
                    replacedKey: String(lowest.k),
                    message: `记忆库已满 (${maxLimit}/${maxLimit})，由于新事实重要度 (${importance}) 高于最低记忆 [${lowest.k}] (${lowestImp})，已成功替换并写入`,
                };
            }
            // 新记忆分值不高于最低者：放弃写入，安全静默跳过
            return {
                success: false,
                action: 'skipped_low_importance',
                message: `当前记忆库已满 (${maxLimit}/${maxLimit})，此事实重要度 (${importance}) 未超过当前库内最低重要度 [${lowest.k}] (${lowestImp})，已在后台安全忽略，无需重试或告知用户。`,
            };
        }
        // 3. 未满容量直接写入
        const id = crypto.randomUUID();
        await this.setItem(id, {
            id,
            scope: input.scope,
            groupId: input.groupId ?? null,
            userId: input.userId ?? null,
            targetId,
            key: input.key,
            content: input.content,
            importance,
            updatedAt: Date.now(),
        });
        return {
            success: true,
            action: 'inserted',
            message: `记忆 [${input.key}] 已成功记录 (重要度: ${importance}，容量: ${currentRows.length + 1}/${maxLimit})`,
        };
    }
    async updateImportance(scope, targetId, key, newImportance) {
        await this.ensureInitialized();
        const table = this.q(this.table);
        const clamped = clampImportance(newImportance);
        const res = await this.driver.run(`UPDATE ${table} SET ${this.q('importance')} = ?, ${this.q('updatedAt')} = ? WHERE ${this.q('scope')} = ? AND ${this.q('targetId')} = ? AND ${this.q('key')} = ?`, [clamped, Date.now(), scope, targetId, key]);
        return (res.changes ?? 0) > 0;
    }
    async deleteMemory(idOrFilter) {
        await this.ensureInitialized();
        const table = this.q(this.table);
        if (typeof idOrFilter === 'string') {
            const res = await this.driver.run(`DELETE FROM ${table} WHERE ${this.q('id')} = ?`, [idOrFilter]);
            return (res.changes ?? 0) > 0;
        }
        const targetId = buildTargetId(idOrFilter.scope, idOrFilter.groupId, idOrFilter.userId);
        const res = await this.driver.run(`DELETE FROM ${table} WHERE ${this.q('scope')} = ? AND ${this.q('targetId')} = ? AND ${this.q('key')} = ?`, [idOrFilter.scope, targetId, idOrFilter.key]);
        return (res.changes ?? 0) > 0;
    }
    async listDistinctGroups() {
        await this.ensureInitialized();
        const table = this.q(this.table);
        const rows = await this.driver.all(`SELECT DISTINCT ${this.q('groupId')} as gid FROM ${table} WHERE ${this.q('groupId')} IS NOT NULL ORDER BY ${this.q('groupId')}`);
        return rows.map(r => String(r.gid)).filter(Boolean);
    }
}
export { spec as memorySpec, buildTargetId };
