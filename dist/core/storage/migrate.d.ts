import { SqlDriver } from './driver/types.js';
import { TableShape } from './sql/tables.js';
import { ColumnSpec, ColumnTypeName, LogicalDatabase } from './driver/types.js';
/**
 * 跨引擎搬数据。
 *
 * 换方言不会自动带走数据——sqlite 和 postgres 是两个各自独立的库。这个工具把
 * 一边的表整体复制到另一边，用于「从 SQLite 迁到 Postgres」这种一次性动作。
 *
 * 复制走 upsert，所以中断之后重跑是安全的，不会产生重复行。
 *
 * **迁移期间必须停止写入。** 这里是逐表、按游标分页复制的，没有全局快照：
 * 如果源库还在接受写入，一条已经被游标越过的记录再被更新，这次更新不会进入
 * 目标库。宿主应当先停机再迁移；需要在线迁移的话得另外做增量追赶或双写，
 * 这个工具不负责。
 */
/** 要搬的表：逻辑库、表名、列定义、主键列。 */
export interface MigratableTable {
    database: LogicalDatabase;
    table: string;
    columns: Record<string, ColumnSpec | ColumnTypeName>;
    keyColumn: string;
    /** keyColumn 不是主键时，upsert 依赖的唯一索引 */
    uniqueIndex?: TableShape['uniqueIndex'];
    /** 分页读取的排序列，必须唯一。默认用 keyColumn。 */
    cursorColumn?: string;
}
/**
 * 默认要搬的表。定义在 sql/tables.ts 里，storage 和这里共用同一份。
 */
export declare function getChaiteTables(): MigratableTable[];
export interface MigrateOptions {
    /** 源端，按逻辑库取 driver */
    from: (database: LogicalDatabase) => SqlDriver;
    /** 目标端 */
    to: (database: LogicalDatabase) => SqlDriver;
    /** 默认搬 getChaiteTables() */
    tables?: MigratableTable[];
    /** 每批行数。历史表可能有几十万行，别一次读进内存。 */
    batchSize?: number;
    /** 每张表搬完回调一次，便于打进度 */
    onProgress?: (progress: TableProgress) => void;
}
export interface TableProgress {
    table: string;
    copied: number;
    skipped: boolean;
    reason?: string;
}
export interface MigrateResult {
    tables: TableProgress[];
    total: number;
}
/**
 * 把一批表从源端复制到目标端。
 *
 * 目标表不存在会先按列定义建出来，所以可以直接对着一个空库跑。
 */
export declare function migrateSqlStorage(options: MigrateOptions): Promise<MigrateResult>;
