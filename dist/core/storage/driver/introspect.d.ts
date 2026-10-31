import { SqlDriver } from './types.js';
/**
 * 模式自省。两种方言问法不同，但调用方不该关心。
 *
 * 抽出来是因为有两处都要用：storage 初始化时补列，迁移工具决定搬哪些列。
 */
/** 这张表在不在。 */
export declare function tableExists(driver: SqlDriver, table: string): Promise<boolean>;
/** 表上现有的列名。表不存在时返回空集合。 */
export declare function listColumns(driver: SqlDriver, table: string): Promise<Set<string>>;
