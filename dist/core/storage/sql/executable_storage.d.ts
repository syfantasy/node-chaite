import { ToolDTO } from '../../types/tools.js';
import { TriggerDTO } from '../../types/trigger.js';
import { SqlDriver } from '../driver/types.js';
import { SqlKvStorage, TableSpec } from '../sql_storage.js';
declare const toolsSpec: TableSpec<ToolDTO>;
declare const triggerSpec: TableSpec<TriggerDTO>;
export declare class SqlToolsStorage extends SqlKvStorage<ToolDTO> {
    constructor(driver: SqlDriver);
    getName(): string;
    setItem(id: string, tool: ToolDTO): Promise<string>;
}
export declare class SqlTriggerStorage extends SqlKvStorage<TriggerDTO> {
    constructor(driver: SqlDriver);
    getName(): string;
    setItem(id: string, trigger: TriggerDTO): Promise<string>;
}
export { toolsSpec, triggerSpec };
