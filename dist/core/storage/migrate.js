import { log } from './logger.js';
import { CHAITE_TABLES } from './sql/tables.js';
import { listColumns, tableExists } from './driver/introspect.js';
/**
 * 默认要搬的表。定义在 sql/tables.ts 里，storage 和这里共用同一份。
 */
export function getChaiteTables() {
    return CHAITE_TABLES.map((shape) => ({
        database: shape.database,
        table: shape.table,
        columns: shape.columns,
        keyColumn: shape.keyColumn,
        uniqueIndex: shape.uniqueIndex,
    }));
}
/**
 * 把一批表从源端复制到目标端。
 *
 * 目标表不存在会先按列定义建出来，所以可以直接对着一个空库跑。
 */
export async function migrateSqlStorage(options) {
    const tables = options.tables || getChaiteTables();
    const batchSize = options.batchSize ?? 1000;
    const results = [];
    for (const definition of tables) {
        const source = options.from(definition.database);
        const target = options.to(definition.database);
        const progress = await migrateTable(source, target, definition, batchSize);
        results.push(progress);
        options.onProgress?.(progress);
    }
    return { tables: results, total: results.reduce((sum, r) => sum + r.copied, 0) };
}
async function migrateTable(source, target, definition, batchSize) {
    const { table, columns, keyColumn } = definition;
    if (!(await tableExists(source, table))) {
        return { table, copied: 0, skipped: true, reason: '源端没有这张表' };
    }
    // 目标端建表（已存在就是空操作）
    await target.exec(target.dialect.createTable(table, columns));
    // 以及 upsert 依赖的唯一索引，否则 ON CONFLICT 无从匹配
    if (definition.uniqueIndex) {
        await target.exec(target.dialect.createIndex(table, definition.uniqueIndex.columns, definition.uniqueIndex));
    }
    const columnNames = Object.keys(columns);
    const sourceQ = (name) => source.dialect.quoteId(name);
    const cursorColumn = definition.cursorColumn || keyColumn;
    // 源库可能是更早的版本，少几列；只搬两边都有的列
    const available = await listColumns(source, table);
    const copyColumns = columnNames.filter(name => available.has(name));
    if (copyColumns.length === 0) {
        return { table, copied: 0, skipped: true, reason: '源端与目标端没有共同列' };
    }
    const selectList = copyColumns.map(sourceQ).join(', ');
    const upsert = target.dialect.upsert(table, copyColumns, keyColumn);
    let copied = 0;
    let cursor = null;
    for (;;) {
        // 按游标分页，避免 OFFSET 在大表上越翻越慢
        const where = cursor === null ? '' : ` WHERE ${sourceQ(cursorColumn)} > ?`;
        const params = cursor === null ? [] : [cursor];
        const rows = await source.all(`SELECT ${selectList} FROM ${sourceQ(table)}${where} ORDER BY ${sourceQ(cursorColumn)} ASC LIMIT ?`, [...params, batchSize]);
        if (rows.length === 0)
            break;
        await target.transaction(async (transaction) => {
            for (const row of rows) {
                await transaction.run(upsert, copyColumns.map(name => row[name] ?? null));
            }
        }, { priority: 'low', label: `migrate ${table}` });
        copied += rows.length;
        cursor = rows[rows.length - 1][cursorColumn];
        if (rows.length < batchSize)
            break;
    }
    log().info(`[Migrate] ${table}: 复制了 ${copied} 行`);
    return { table, copied, skipped: false };
}
