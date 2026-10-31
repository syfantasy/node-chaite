import { HistoryManager, HistoryMessage } from '../types/index.js';
export interface KVStore {
    get(key: string): Promise<string>;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
}
export declare class KVHistoryManager implements HistoryManager {
    private kvStore;
    name: string;
    constructor(kvStore: KVStore, name: string);
    private getConversationKey;
    private getMessageKey;
    saveHistory(message: HistoryMessage, conversationId: string): Promise<void>;
    getHistory(messageId?: string, conversationId?: string): Promise<HistoryMessage[]>;
    deleteConversation(conversationId: string): Promise<void>;
    removeHistory(messageId: string, conversationId: string): Promise<void>;
    getOneHistory(messageId: string, conversationId: string): Promise<HistoryMessage | undefined>;
}
