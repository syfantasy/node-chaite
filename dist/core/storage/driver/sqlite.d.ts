import { Dialect, RunResult, SqlDriver, TransactionScope, WriteOptions } from './types.js';
export interface SqliteDriverOptions {
    busyTimeout?: number;
    slowQueryMs?: number;
}
/**
 * SQLite driver。
 *
 * SQLite 全库只有一个写锁，并发写会直接撞上 SQLITE_BUSY，所以这里自己把写入
 * 串起来：一个专用的 writer 连接 + 三档优先级队列，读取走另一条连接绕开队列。
 * 这套东西 chatgpt-plugin 里已经跑了很久，karin 那份拷贝没有——收进 chaite
 * 就是为了让两边都拿到。
 *
 * **串行化只在单个实例内生效。** 同一个文件被构造出两个 SqliteDriver 时，两个
 * 队列互不知情，最终还是退回 WAL + busy_timeout 去扛。DriverRegistry 每个文件
 * 只建一个实例，走注册表就没问题；绕过注册表自己 new 的话，这一层保证就没了。
 */
export declare class SqliteDriver implements SqlDriver {
    readonly dialect: Dialect;
    readonly dbPath: string;
    private readonly busyTimeout;
    private readonly slowQueryMs;
    private readonly queues;
    private readonly writerReady;
    private readonly readerReady;
    private readonly readyPromise;
    private writerActive;
    private busyCount;
    /**
     * open -> closing -> closed。
     *
     * 只有一个布尔量不够：close() 先置位再等队列排空，中间这段时间里新的
     * run()/get() 如果不被拦下，就会排到一个即将被关掉的连接上，或者留下一个
     * 永远不会完成的 Promise。
     */
    private state;
    private closePromise;
    constructor(dbPath: string, options?: SqliteDriverOptions);
    get name(): string;
    private get queueDepth();
    ready(): Promise<void>;
    /**
     * 关闭中/已关闭就别再收活了，早失败好过半路连接被抽走。
     *
     * 返回 Error 而不是直接抛：driver 的其他方法一律以 rejected promise 报错，
     * 这里同步抛会让调用方要写两种错误处理。
     */
    private closedError;
    private enqueue;
    private drain;
    /** 读取直接打在 reader 连接上，绕开写入队列。 */
    private read;
    get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;
    all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
    run(sql: string, params?: unknown[], options?: WriteOptions): Promise<RunResult>;
    exec(sql: string, options?: WriteOptions): Promise<void>;
    transaction<T>(work: (scope: TransactionScope) => Promise<T>, options?: WriteOptions): Promise<T>;
    /** 库文件加上 WAL/SHM 的总大小。 */
    fileSize(): number;
    /**
     * 回收删除后留下的空闲页。
     *
     * 只能用整库 VACUUM：即使把 auto_vacuum 设成 INCREMENTAL（而且必须设在
     * journal_mode=WAL 之前，否则会被静默忽略），PRAGMA incremental_vacuum 在
     * WAL 下也几乎回收不到东西。
     *
     * VACUUM 本身很快，但会重写整个数据库文件，期间独占写锁，并且临时需要约等于
     * 库大小的额外磁盘空间。
     */
    vacuum({ minFreePages }?: {
        minFreePages?: number;
    }): Promise<Record<string, unknown>>;
    /**
     * 关闭连接。重复调用会等同一个 Promise，而不是第二个调用方立刻拿到 resolve
     * 却其实还没关完。
     */
    close(): Promise<void>;
}
