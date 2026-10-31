import { ChatPreset } from '../../channels/preset.js';
import { SqlDriver } from '../driver/types.js';
import { SqlKvStorage, TableSpec } from '../sql_storage.js';
declare const spec: TableSpec<ChatPreset>;
export declare class SqlChatPresetStorage extends SqlKvStorage<ChatPreset> {
    constructor(driver: SqlDriver);
    getName(): string;
    setItem(id: string, preset: ChatPreset): Promise<string>;
    getPresetByPrefix(prefix: string): Promise<ChatPreset | null>;
}
export { spec as chatPresetSpec };
