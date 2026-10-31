import { AbstractHistoryManager } from '../types/index.js';
export class InMemoryHistoryManager extends AbstractHistoryManager {
    constructor() {
        super();
        this.name = 'InMemoryHistoryManager';
        this.cache = new Map();
    }
    async saveHistory(message, conversationId) {
        if (!this.cache.has(conversationId)) {
            this.cache.set(conversationId, new Map());
        }
        this.cache.get(conversationId)?.set(message.id, message);
    }
    async getHistory(messageId, conversationId) {
        if (!conversationId) {
            return [];
        }
        if (!messageId) {
            throw new Error('unspecified message id is not implemented yet');
        }
        let parentId = messageId;
        const histories = [];
        while (parentId) {
            const history = await this.getOneHistory(parentId, conversationId);
            if (history) {
                histories.push(history);
                parentId = history.parentId;
            }
            else {
                parentId = null;
            }
        }
        return histories.reverse();
    }
    async deleteConversation(conversationId) {
        this.cache.delete(conversationId);
    }
    async removeHistory(messageId, conversationId) {
        const messages = this.cache.get(conversationId);
        const target = messages?.get(messageId);
        if (!messages || !target)
            return;
        for (const message of messages.values()) {
            if (message.parentId === messageId)
                message.parentId = target.parentId;
        }
        messages.delete(messageId);
    }
    async getOneHistory(messageId, conversationId) {
        return this.cache.get(conversationId)?.get(messageId);
    }
}
export default new InMemoryHistoryManager();
