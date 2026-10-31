import { Dialect, PostgresConnectionOptions, RunResult, SqlDriver, TransactionScope } from './types.js';
/** pg 的最小接口。pg 是可选 peer 依赖，动态 import。 */
interface PgQueryResult {
    rows: Record<string, unknown>[];
    rowCount: number | null;
}
interface PgClient {
    query(sql: string, params?: unknown[]): Promise<PgQueryResult>;
    release(): void;
}
interface PgPool {
    query(sql: string, params?: unknown[]): Promise<PgQueryResult>;
    connect(): Promise<PgClient>;
    end(): Promise<void>;
    on(event: 'error', listener: (error: Error) => void): void;
}
/**
 * Postgres driver。
 *
 * 和 SQLite 那边最大的不同：这里不需要写者队列。SQLite 全库只有一个写锁，所以
 * 必须自己把写入串起来；Postgres 有 MVCC 和真正的连接池，串行化反而会白白限制
 * 吞吐，并发控制整个交给 pg.Pool。
 *
 * SQL 仍按 `?` 书写，在执行入口统一翻译成 $1..$n，storage 层不用关心方言。
 */
export declare class PostgresDriver implements SqlDriver {
    readonly dialect: Dialect;
    private readonly options;
    private readonly pool;
    private readonly slowQueryMs;
    private closed;
    constructor(options: PostgresConnectionOptions, pool: PgPool);
    get name(): string;
    ready(): Promise<void>;
    private query;
    get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;
    all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
    /**
     * lastID 只在显式写了 RETURNING id 时才有值。SQLite 的 this.lastID 在
     * Postgres 没有对应物，调用方不该依赖它。
     */
    run(sql: string, params?: unknown[]): Promise<RunResult>;
    /** exec 用来跑建表之类的多语句脚本，本身不带参数，所以不翻译占位符。 */
    exec(sql: string): Promise<void>;
    transaction<T>(work: (scope: TransactionScope) => Promise<T>): Promise<T>;
    close(): Promise<void>;
}
/** pg 是可选依赖，只有真的选了 postgres 才需要装。 */
export declare function createPostgresDriver(options: PostgresConnectionOptions): Promise<PostgresDriver>;
export {};
