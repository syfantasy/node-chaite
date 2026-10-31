import { ConnectionOptions, LogicalDatabase, SqlDriver } from './types.js';
export declare class DriverRegistry {
    private readonly drivers;
    private initialized;
    private initPromise;
    private closePromise;
    /**
     * 初始化。并发调用会共用同一个 Promise——否则两个调用方都能通过
     * `initialized === false`，各开一套连接，后完成的那个把前一套从 Map 里顶掉，
     * 顶掉的连接就此泄漏。
     *
     * 中途失败会把这一轮已经建好的 driver 全部关掉再抛出，不留下半初始化状态；
     * initialized 仍为 false，调用方可以修好配置后重试。
     */
    init(options: ConnectionOptions): Promise<void>;
    private doInit;
    get(name: LogicalDatabase): SqlDriver;
    isInitialized(): boolean;
    /** 列出去重后的 driver。Postgres 下三个逻辑库共用一个实例。 */
    listUnique(): SqlDriver[];
    /** 关闭全部连接。重复调用共用同一个 Promise。 */
    close(): Promise<void>;
    /** 仅供测试：注入一个现成的 driver。 */
    register(name: LogicalDatabase, driver: SqlDriver): void;
}
/** 进程级默认注册表。宿主插件一般用这个就够了。 */
export declare const drivers: DriverRegistry;
