import { MemoryFilter, MemoryInput, MemoryRecord, MemoryScope, SetMemoryResult } from '../../memory/types.js';
import { SqlDriver } from '../driver/types.js';
import { SqlKvStorage, TableSpec } from '../sql_storage.js';
declare function buildTargetId(scope: MemoryScope, groupId?: string | null, userId?: string | null): string;
declare const spec: TableSpec<MemoryRecord>;
export declare class SqlMemoryStorage extends SqlKvStorage<MemoryRecord> {
    constructor(driver: SqlDriver);
    getName(): string;
    getMemories(filter: MemoryFilter): Promise<MemoryRecord[]>;
    setMemory(input: MemoryInput): Promise<SetMemoryResult>;
    updateImportance(scope: MemoryScope, targetId: string, key: string, newImportance: number): Promise<boolean>;
    deleteMemory(idOrFilter: string | {
        scope: MemoryScope;
        groupId?: string | null;
        userId?: string | null;
        key: string;
    }): Promise<boolean>;
    listDistinctGroups(): Promise<string[]>;
}
export { spec as memorySpec, buildTargetId };
