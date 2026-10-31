import { SqlKvStorage, parseJson } from '../sql_storage.js';
import { log } from '../logger.js';
import { OPERATION_LOGS } from './tables.js';
/** 能下推到 SQL 的列。其余字段都在 payload 里，只能读出来再过滤。 */
const FILTERABLE = ['id', 'timestamp', 'type', 'level', 'userId', 'groupId', 'channelId', 'model', 'presetId'];
const spec = {
    table: OPERATION_LOGS.table,
    columns: OPERATION_LOGS.columns,
    indexes: [
        { columns: [{ column: 'timestamp', order: 'DESC' }], name: 'idx_operation_logs_time' },
        { columns: ['userId', { column: 'timestamp', order: 'DESC' }], name: 'idx_operation_logs_user' },
        { columns: ['groupId', { column: 'timestamp', order: 'DESC' }], name: 'idx_operation_logs_group' },
        { columns: ['channelId', { column: 'timestamp', order: 'DESC' }], name: 'idx_operation_logs_channel' },
        { columns: ['type', { column: 'timestamp', order: 'DESC' }], name: 'idx_operation_logs_type' },
        {
            columns: [{ column: 'timestamp', order: 'ASC' }, { column: 'id', order: 'ASC' }],
            name: 'idx_operation_logs_retention',
        },
    ],
    filterable: FILTERABLE,
    numeric: ['timestamp'],
    orderBy: 'timestamp DESC',
    toRecord(value, id) {
        return {
            id,
            timestamp: value.timestamp,
            type: value.type,
            level: value.level,
            userId: value.userId ?? null,
            groupId: value.groupId ?? null,
            channelId: value.channelId ?? null,
            model: value.model ?? null,
            presetId: value.presetId ?? null,
            payload: JSON.stringify(value),
        };
    },
    fromRecord(record) {
        if (!record)
            return null;
        return parseJson(record.payload, null);
    },
};
/**
 * 操作日志。
 *
 * 和其他 storage 的区别是它有保留期：写入频率高、条数按万计，所以要按 maxEntries
 * 滚动裁剪。裁剪分批进行并走低优先级队列，免得在低配机器上把实时对话的写入挤掉。
 */
export class SqlOperationLogStorage extends SqlKvStorage {
    constructor(driver, maxEntries = 50000) {
        super(driver, spec);
        this.writeCount = 0;
        this.prunePromise = null;
        this.pruneBatchSize = 500;
        this.maxEntries = normalizeLimit(maxEntries);
    }
    getName() {
        return 'SqlOperationLogStorage';
    }
    async initialize() {
        if (this.initialized)
            return;
        await super.initialize();
        void this.schedulePrune();
    }
    async setItem(id, value) {
        const key = await super.setItem(id, value);
        this.writeCount++;
        // 低配机器上别每写一条就查一次总数：按比例间隔触发，上限 200
        const pruneEvery = Math.min(200, Math.max(1, Math.floor(this.maxEntries / 10)));
        if (this.maxEntries > 0 && this.writeCount % pruneEvery === 0) {
            void this.schedulePrune();
        }
        return key;
    }
    /** clear 也走分批，避免一次性删掉几十万行把写锁占满。 */
    async clear() {
        await this.ensureInitialized();
        for (;;) {
            const result = await this.driver.run(`DELETE FROM ${this.q(this.table)} WHERE ${this.q('id')} IN (
           SELECT ${this.q('id')} FROM ${this.q(this.table)}
           ORDER BY ${this.q('timestamp')} ASC, ${this.q('id')} ASC LIMIT ?
         )`, [this.pruneBatchSize], { priority: 'low', label: 'clear operation logs batch' });
            if (result.changes < this.pruneBatchSize)
                return;
            await new Promise(resolve => setImmediate(resolve));
        }
    }
    async setMaxEntries(maxEntries) {
        this.maxEntries = normalizeLimit(maxEntries);
        await (this.schedulePrune(true) || Promise.resolve());
    }
    schedulePrune(force = false) {
        if (this.prunePromise) {
            // force 时要等当前这轮跑完再按新的 maxEntries 重来一次
            return force ? this.prunePromise.then(() => this.schedulePrune(true) ?? undefined) : this.prunePromise;
        }
        if (this.maxEntries <= 0)
            return null;
        const targetEntries = this.maxEntries;
        this.prunePromise = this.prune(targetEntries, force)
            .catch((error) => log().warn(`[operation_logs] prune failed: ${error instanceof Error ? error.message : String(error)}`))
            .finally(() => {
            this.prunePromise = null;
        });
        return this.prunePromise;
    }
    async prune(targetEntries, force = false) {
        if (targetEntries <= 0)
            return;
        await this.ensureInitialized();
        // 留 10% 余量，避免刚好卡在阈值时每写一条都要删一条
        const highWatermark = Math.max(targetEntries + 1, Math.ceil(targetEntries * 1.1));
        const row = await this.driver.get(`SELECT COUNT(*) AS "count" FROM ${this.q(this.table)}`, []);
        let remaining = Number(row?.count || 0);
        if (!force && remaining <= highWatermark)
            return;
        while (remaining > targetEntries && this.maxEntries > 0) {
            const batchSize = Math.min(this.pruneBatchSize, remaining - targetEntries);
            const startedAt = Date.now();
            const result = await this.driver.run(`DELETE FROM ${this.q(this.table)} WHERE ${this.q('id')} IN (
           SELECT ${this.q('id')} FROM ${this.q(this.table)}
           ORDER BY ${this.q('timestamp')} ASC, ${this.q('id')} ASC LIMIT ?
         )`, [batchSize], { priority: 'low', label: 'operation log retention batch' });
            remaining -= result.changes;
            log().debug(`[operation_logs] pruned ${result.changes} rows in ${Date.now() - startedAt}ms, remaining=${remaining}`);
            if (result.changes === 0)
                break;
            await new Promise(resolve => setImmediate(resolve));
        }
    }
}
function normalizeLimit(value) {
    const limit = Number.parseInt(String(value), 10);
    return Number.isFinite(limit) && limit > 0 ? limit : 0;
}
export { spec as operationLogSpec };
