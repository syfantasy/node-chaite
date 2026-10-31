import { ChaiteStorage } from '../types/storage.js';
import { ColumnSpec, ColumnTypeName, IndexColumn, IndexOptions, SqlDriver } from './driver/types.js';
export interface TableSpec<T> {
    /** 表名 */
    table: string;
    /** 列定义 */
    columns: Record<string, ColumnSpec | ColumnTypeName>;
    /** 主键列，默认 'id'。user_states 用 userId 做业务主键 */
    keyColumn?: string;
    /** 冲突时不覆盖的列，例如代理主键 */
    immutableColumns?: string[];
    indexes?: (IndexOptions & {
        columns: IndexColumn[];
    })[];
    /** 可以下推到 SQL 的列；其余条件在内存里过滤 */
    filterable?: string[];
    /** 过滤时需要 Number() 归一的列 */
    numeric?: string[];
    /** 过滤时需要归一成 0/1 的列 */
    boolean?: string[];
    /** listItems 的排序，如 'updatedAt DESC' */
    orderBy?: string;
    toRecord(entity: T, id: string): Record<string, unknown>;
    fromRecord(record: Record<string, unknown>): T | null;
}
/**
 * 「键值表 + 提升列」的公共实现。
 *
 * 宿主插件里的九个 storage 在关系意义上都不是关系数据：一个 TEXT 主键、几个为了
 * 能下推过滤而提升出来的列、剩下的塞进 JSON 列，一个 JOIN 都没有。所以这里不引
 * ORM——ORM 的价值在关系映射和查询组合，这套代码一样都用不上。
 *
 * 子类只需要给出一份 TableSpec，七个 ChaiteStorage 方法由这里统一实现，SQL 一份，
 * 方言差异由 driver 兜住。
 */
export declare class SqlKvStorage<T> extends ChaiteStorage<T> {
    readonly driver: SqlDriver;
    readonly spec: TableSpec<T>;
    readonly table: string;
    readonly keyColumn: string;
    protected initialized: boolean;
    private initPromise;
    constructor(driver: SqlDriver, spec: TableSpec<T>);
    get dialect(): import("src/index.js").Dialect;
    /**
     * 建表与索引。重复调用是安全的。
     *
     * **子类不要覆盖这个方法**，要加初始化步骤请覆盖 afterInitialize()。
     * 覆盖 initialize() 并在里面 `await super.initialize()` 会有竞态：基类返回时
     * initialized 已经是 true，此时另一个并发的 ensureInitialized() 会立刻放行，
     * 而子类那部分（建唯一索引之类）还没跑完。
     */
    initialize(): Promise<void>;
    /**
     * 建表之后、标记就绪之前的钩子。子类在这里做额外的模式调整。
     * 抛错会让整次 initialize 失败并允许重试。
     */
    protected afterInitialize(): Promise<void>;
    /**
     * 给老表补上新增的列。
     *
     * CREATE TABLE IF NOT EXISTS 对已存在的表是空操作，不会补列。于是从更早版本
     * 升上来的库里，表可能缺某几列，而写入路径会把当前全部列都列进 INSERT，
     * 运行时直接报 "no column named ..." / "column does not exist"。
     *
     * 这里对比实际列和 spec，把缺的 ALTER TABLE ADD COLUMN 补回去。
     *
     * 两个做不到的情况会告警而不是硬失败——继续跑总比因为一次模式差异起不来好：
     * - 主键列缺失：两种方言都不允许事后加主键，通常意味着这张表根本不是我们的
     * - NOT NULL 且没有默认值：已有行无法填充，只能降级成可空
     */
    private reconcileColumns;
    ensureInitialized(): Promise<void>;
    protected q(name: string): string;
    protected orderClause(): string;
    getItem(key: string): Promise<T | null>;
    setItem(id: string, value: T): Promise<string>;
    removeItem(key: string): Promise<void>;
    listItems(): Promise<T[]>;
    /** 能下推的条件走 SQL，其余在内存里过滤。 */
    listItemsByEqFilter(filter: Record<string, unknown>): Promise<T[]>;
    listItemsByInQuery(query: {
        field: string;
        values: unknown[];
    }[]): Promise<T[]>;
    clear(): Promise<void>;
    /**
     * 故意什么都不做。
     *
     * 一个 driver 是被多个 storage 共用的（Postgres 下更是共用同一个连接池），
     * 任何一个 storage 关掉它，其余的就全断了。连接的生命周期归 DriverRegistry
     * 管，进程退出时统一关闭。
     */
    close(): Promise<void>;
    protected isFilterable(field: string): boolean;
    /** 过滤值归一：数值列用 Number，布尔列用 0/1，与建表时的存储表示对齐。 */
    protected normalize(field: string, value: unknown): unknown;
}
/** JSON 列的读写。存坏了就当空值，不要让一条脏数据把整个列表查询打挂。 */
export declare function parseJson<T = unknown>(value: unknown, fallback: T): T;
export declare function stringifyJson(value: unknown): string | null;
