import { ListLogsFilter, LogsPage, LogsStats, OperationLog } from '../../types/operation-log.js';
import { SqlDriver } from '../driver/types.js';
import { SqlKvStorage, TableSpec } from '../sql_storage.js';
declare const spec: TableSpec<OperationLog>;
/**
 * 操作日志。
 *
 * 和其他 storage 的区别是它有保留期：写入频率高、条数按万计，所以要按 maxEntries
 * 滚动裁剪。裁剪分批进行并走低优先级队列，免得在低配机器上把实时对话的写入挤掉。
 */
export declare class SqlOperationLogStorage extends SqlKvStorage<OperationLog> {
    private writeCount;
    private maxEntries;
    private prunePromise;
    private readonly pruneBatchSize;
    constructor(driver: SqlDriver, maxEntries?: number);
    getName(): string;
    initialize(): Promise<void>;
    setItem(id: string, value: OperationLog): Promise<string>;
    /** clear 也走分批，避免一次性删掉几十万行把写锁占满。 */
    clear(): Promise<void>;
    setMaxEntries(maxEntries: number): Promise<void>;
    /** 分页查询（下推 SQL，极大降低高并发与大数据量下的内存压力） */
    listPaged(filter?: ListLogsFilter): Promise<LogsPage>;
    /** 聚合统计（下推 SQL 聚合，秒级返回且内存开销极低） */
    getStats(): Promise<LogsStats>;
    private schedulePrune;
    private prune;
}
export { spec as operationLogSpec };
