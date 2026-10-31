import { ToolsGroupDTO } from '../../types/tools.js';
import { SqlDriver } from '../driver/types.js';
import { SqlKvStorage, TableSpec } from '../sql_storage.js';
declare const spec: TableSpec<ToolsGroupDTO>;
export declare class SqlToolsGroupStorage extends SqlKvStorage<ToolsGroupDTO> {
    constructor(driver: SqlDriver);
    getName(): string;
    setItem(id: string, group: ToolsGroupDTO): Promise<string>;
}
export { spec as toolsGroupSpec };
