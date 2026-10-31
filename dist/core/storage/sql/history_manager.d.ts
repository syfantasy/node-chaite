import { AbstractHistoryManager } from '../../types/adapter.js';
import { HistoryMessage } from '../../types/models.js';
import { SqlDriver } from '../driver/types.js';
export interface PruneOptions {
    before: string;
    conversationPrefix?: string;
    batchSize?: number;
    maxBatches?: number;
}
/**
 * 基于 SQL 的对话历史。
 *
 * 和其他 storage 不同，它实现的是 AbstractHistoryManager 而不是 ChaiteStorage，
 * 而且还要把消息里的 base64 图片落盘换成引用——历史库是最大的一张表，把几 MB 的
 * 图片塞进行里会让它迅速膨胀到几百 MB。
 */
export declare class SqlHistoryManager extends AbstractHistoryManager {
    name: string;
    readonly driver: SqlDriver;
    readonly imagesDir: string;
    readonly table = "history";
    /**
     * 保留期清理按 createdAt 过滤，没有索引就是全表扫描。但在已经很大的历史表上
     * 建索引可能要好几秒，不该卡住升级后的第一条消息，所以放到后台用 low 优先级
     * 建——实时对话的写入会插在前面，建好之前清理只是慢一点，不影响正确性。
     * 暴露成 promise，便于测试和清理流程在需要时等待。
     */
    createdAtIndexReady?: Promise<void>;
    private initialized;
    private initPromise;
    constructor(driver: SqlDriver, imagesDir: string);
    private q;
    initialize(): Promise<void>;
    ensureInitialized(): Promise<void>;
    private getMd5;
    private getMimeTypeFromBase64;
    private getExtensionFromMimeType;
    /** 把消息里的 base64 图片落盘，行里只留 `$image:md5:ext` 引用。 */
    private processMessageImages;
    /** 把 `$image:md5:ext` 引用读回 base64；文件没了就把这一项去掉并补上 [图片]。 */
    private restoreMessageImages;
    private messageToRecord;
    private recordToMessage;
    private upsertSql;
    private recordValues;
    saveHistory(message: HistoryMessage, conversationId: string): Promise<void>;
    /** 批量保存走一个事务，避免多条消息逐条 autocommit。 */
    saveHistories(messages: HistoryMessage[], conversationId: string): Promise<void>;
    getHistory(messageId?: string, conversationId?: string): Promise<HistoryMessage[]>;
    /**
     * 从指定消息沿 parentId 追溯到根。
     *
     * 用递归 CTE 一次查完，而不是每条消息发一次查询。原来那种逐条回溯是典型的
     * N+1：链有多长就要多少次往返。本机 SQLite 上一次往返约 0.022ms，一条 3000
     * 条的链就要 65ms；换成走网络的 Postgres，按单次往返 0.3ms 算会变成近 1 秒。
     * 而且这是每条消息进对话时都要做一次的事。
     *
     * 递归 CTE 两种方言都支持（SQLite 3.8.3+、Postgres 一直有）。
     *
     * depth 上限同时兼作防环措施：parentId 理论上不该成环，但一条坏数据就足以
     * 让递归停不下来。
     */
    private getMessageChain;
    private getConversationMessages;
    deleteConversation(conversationId: string): Promise<void>;
    /** 删一条消息但不断链：先把它的直接子节点改挂到它的父节点上。 */
    removeHistory(messageId: string, conversationId: string): Promise<void>;
    getOneHistory(messageId: string, conversationId: string): Promise<HistoryMessage | undefined>;
    private buildPruneFilter;
    countHistoryBefore({ before, conversationPrefix }: {
        before: string;
        conversationPrefix?: string;
    }): Promise<number>;
    /**
     * 按保留期删除历史消息。
     *
     * 分批删而不是一条 DELETE 干掉几十万行：单条大 DELETE 会长时间占住写连接，
     * 期间所有对话的写入都要排队。批次走 low 优先级，让实时对话的写入插在前面。
     */
    pruneHistory({ before, conversationPrefix, batchSize, maxBatches, }: PruneOptions): Promise<{
        deleted: number;
        truncated: boolean;
    }>;
    /** 删掉已经没有任何消息引用的图片文件。 */
    cleanupUnusedImages(): Promise<{
        deleted: number;
        total: number;
    }>;
    /** 连接归 DriverRegistry 管，这里不关。 */
    close(): Promise<void>;
}
