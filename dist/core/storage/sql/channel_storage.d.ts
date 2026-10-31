import { Channel } from '../../channels/channels.js';
import { SqlDriver } from '../driver/types.js';
import { SqlKvStorage, TableSpec } from '../sql_storage.js';
declare const spec: TableSpec<Channel>;
export declare class SqlChannelStorage extends SqlKvStorage<Channel> {
    constructor(driver: SqlDriver);
    getName(): string;
    setItem(id: string, channel: Channel): Promise<string>;
    /**
     * models 存的是 JSON 数组，按子串匹配单个模型名。
     *
     * 改造前这是藏在 listItemsByEqFilter 里的一个 LIKE 特判——叫「等值过滤」却做
     * 子串匹配是误导，这里提成显式方法。
     */
    listItemsByModel(model: string): Promise<Channel[]>;
}
export { spec as channelSpec };
