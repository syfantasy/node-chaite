import type { ChaiteContext } from '../types/common.js';
import type { Tool } from '../types/tools.js';
import { MemoryFilter, MemoryInput, MemoryProvider, MemoryRecord, MemoryScope, SetMemoryResult } from './types.js';
import { SqlMemoryStorage } from '../storage/sql/memory_storage.js';
export * from './types.js';
export declare class DefaultMemoryProvider implements MemoryProvider {
    private storage;
    readonly id = "builtin-lightweight";
    readonly name = "Chaite \u5185\u7F6E\u8F7B\u91CF\u5206\u7FA4\u8BB0\u5FC6\uFF08\u4F18\u5148\u961F\u5217\u4E0E\u7FA4\u9694\u79BB\uFF09";
    constructor(storage: SqlMemoryStorage);
    injectContext(context: ChaiteContext, options?: {
        groupId?: string;
        userId?: string;
    }): Promise<string | undefined>;
    getTools(): Tool[];
    getMemories(filter: MemoryFilter): Promise<MemoryRecord[]>;
    setMemory(input: MemoryInput): Promise<SetMemoryResult>;
    updateImportance(scope: MemoryScope, targetId: string, key: string, newImportance: number): Promise<boolean>;
    deleteMemory(idOrFilter: string | {
        scope: MemoryScope;
        groupId?: string | null;
        userId?: string | null;
        key: string;
    }): Promise<boolean>;
    getStorage(): SqlMemoryStorage;
}
export declare class MemoryManager {
    private activeProvider;
    private providers;
    constructor(defaultProvider: MemoryProvider);
    registerProvider(provider: MemoryProvider, setAsActive?: boolean): void;
    getActiveProvider(): MemoryProvider;
    getProvider(id: string): MemoryProvider | undefined;
    setActiveProvider(id: string): boolean;
}
