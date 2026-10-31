import { HistoryMessage, AbstractHistoryManager } from '../types/index.js';
type HistoryCache = Map<string, Map<string, HistoryMessage>>;
export declare class InMemoryHistoryManager extends AbstractHistoryManager {
    cache: HistoryCache;
    constructor();
    saveHistory(message: HistoryMessage, conversationId: string): Promise<void>;
    getHistory(messageId?: string, conversationId?: string): Promise<HistoryMessage[]>;
    deleteConversation(conversationId: string): Promise<void>;
    removeHistory(messageId: string, conversationId: string): Promise<void>;
    getOneHistory(messageId: string, conversationId: string): Promise<HistoryMessage | undefined>;
    name: string;
}
declare const _default: InMemoryHistoryManager;
export default _default;
