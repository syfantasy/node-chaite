import { ProcessorDTO } from '../../types/processors.js';
import { SqlDriver } from '../driver/types.js';
import { SqlKvStorage, TableSpec } from '../sql_storage.js';
declare const spec: TableSpec<ProcessorDTO>;
export declare class SqlProcessorsStorage extends SqlKvStorage<ProcessorDTO> {
    constructor(driver: SqlDriver);
    getName(): string;
    setItem(id: string, processor: ProcessorDTO): Promise<string>;
}
export { spec as processorsSpec };
