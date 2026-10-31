import type { ListLogsFilter, LogsPage, LogsStats, OperationLog } from '../types/operation-log.js';
import type { BasicStorage } from '../types/storage.js';
/**
 * Manages operation logs for the AI system.
 *
 * By default stores up to `maxInMemory` recent entries in a ring buffer.
 * Optionally accepts a `BasicStorage<OperationLog>` for durable persistence —
 * when provided, all writes go to storage and reads query from there.
 *
 * Attach to Chaite via `chaite.setOperationLogManager(mgr)` to activate
 * event-based logging of jobs, plans, and tool calls.
 */
export declare class OperationLogManager {
    private readonly storage?;
    private readonly memBuf;
    private readonly maxInMemory;
    constructor(storage?: BasicStorage<OperationLog>, maxInMemory?: number);
    add(entry: Omit<OperationLog, 'id' | 'timestamp'> & Partial<Pick<OperationLog, 'id' | 'timestamp'>>): Promise<OperationLog>;
    /** Convenience: add a log entry synchronously (fire-and-forget, swallows errors) */
    addSync(entry: Omit<OperationLog, 'id' | 'timestamp'> & Partial<Pick<OperationLog, 'id' | 'timestamp'>>): void;
    get(id: string): Promise<OperationLog | null>;
    list(filter?: ListLogsFilter): Promise<LogsPage>;
    getStats(): Promise<LogsStats>;
    clear(filter?: Pick<ListLogsFilter, 'type' | 'level' | 'userId' | 'from' | 'to'>): Promise<number>;
    private pushMemory;
    private matchesFilter;
}
