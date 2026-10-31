import { ColumnSpec, ColumnTypeName, IndexColumn, IndexOptions, LogicalDatabase } from '../driver/types.js';
/**
 * 表的形状：表名、列、主键、所属逻辑库。
 *
 * 刻意和序列化逻辑分开放。toRecord/fromRecord 要 import DTO 类，而那条链会经由
 * types -> core -> 包入口绕回 storage，形成模块环；迁移工具只需要知道表长什么样，
 * 没有理由被卷进去。分开之后这里也成了列定义的唯一出处，storage 和迁移工具各取
 * 所需，不会各写一份然后慢慢漂移。
 */
export interface TableShape {
    database: LogicalDatabase;
    table: string;
    keyColumn: string;
    columns: Record<string, ColumnSpec | ColumnTypeName>;
    /**
     * upsert 依赖的唯一约束。
     *
     * 只有 keyColumn 不是主键时才需要——user_states 的业务主键是 userId，而 id
     * 是代理主键，ON CONFLICT(userId) 必须有唯一索引兜底。迁移工具建完表也要照建，
     * 否则往新库里搬数据时会直接报「no unique or exclusion constraint matching
     * the ON CONFLICT specification」。
     */
    uniqueIndex?: IndexOptions & {
        columns: IndexColumn[];
    };
}
/** 可分享实体共有的那组列（渠道、预设、工具、处理器、触发器）。 */
export declare const SHAREABLE_COLUMNS: Record<string, ColumnSpec | ColumnTypeName>;
export declare const CHANNELS: TableShape;
export declare const CHAT_PRESETS: TableShape;
export declare const TOOLS: TableShape;
export declare const TRIGGERS: TableShape;
export declare const PROCESSORS: TableShape;
export declare const TOOLS_GROUPS: TableShape;
export declare const USER_STATES: TableShape;
export declare const MCP_SERVERS: TableShape;
export declare const HISTORY: TableShape;
export declare const OPERATION_LOGS: TableShape;
export declare const MEMORIES: TableShape;
/** chaite 自己管的全部表。宿主有额外的表可以自己追加。 */
export declare const CHAITE_TABLES: TableShape[];
