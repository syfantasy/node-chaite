import { UserState } from '../../types/storage.js';
import { SqlDriver } from '../driver/types.js';
import { SqlKvStorage, TableSpec } from '../sql_storage.js';
/**
 * user_states 的业务主键是 userId，不是 id——id 只是个随机 UUID 代理键。
 * 所以 keyColumn 指到 userId，并把 id 标成不可覆盖：同一个用户反复写入时
 * 代理键不应该跟着变。
 */
declare const spec: TableSpec<UserState>;
export declare class SqlUserStateStorage extends SqlKvStorage<UserState> {
    constructor(driver: SqlDriver);
    getName(): string;
    /**
     * 在基类建表之外，还要保证 userId 上有唯一索引——ON CONFLICT(userId) 依赖它。
     *
     * 老库只有一个普通索引，而且改造前的写入是「先 SELECT 再 INSERT/UPDATE」，
     * 两个并发请求给同一个新用户写状态时可以各插一行。所以建唯一索引之前先去重，
     * 每个 userId 只留 updatedAt 最新的那行。
     */
    protected afterInitialize(): Promise<void>;
}
export { spec as userStateSpec };
