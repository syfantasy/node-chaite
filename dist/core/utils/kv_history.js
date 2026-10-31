export class KVHistoryManager {
    constructor(kvStore, name) {
        this.kvStore = kvStore;
        this.name = name;
    }
    getConversationKey(conversationId) {
        return `conversation:${conversationId}`;
    }
    getMessageKey(conversationId, messageId) {
        return `${this.getConversationKey(conversationId)}:message:${messageId}`;
    }
    async saveHistory(message, conversationId) {
        const messageKey = this.getMessageKey(conversationId, message.id);
        await this.kvStore.set(messageKey, JSON.stringify(message));
        const conversationKey = this.getConversationKey(conversationId);
        const messageList = JSON.parse(await this.kvStore.get(conversationKey) || '[]');
        messageList.push(message.id);
        await this.kvStore.set(conversationKey, JSON.stringify(messageList));
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
        const conversationKey = this.getConversationKey(conversationId);
        const messageList = JSON.parse(await this.kvStore.get(conversationKey) || '[]');
        for (const messageId of messageList) {
            await this.kvStore.delete(this.getMessageKey(conversationId, messageId));
        }
        await this.kvStore.delete(conversationKey);
    }
    async removeHistory(messageId, conversationId) {
        const target = await this.getOneHistory(messageId, conversationId);
        if (!target)
            return;
        const conversationKey = this.getConversationKey(conversationId);
        const messageList = JSON.parse(await this.kvStore.get(conversationKey) || '[]');
        for (const id of messageList) {
            const message = await this.getOneHistory(id, conversationId);
            if (message?.parentId === messageId) {
                message.parentId = target.parentId;
                await this.kvStore.set(this.getMessageKey(conversationId, id), JSON.stringify(message));
            }
        }
        await this.kvStore.delete(this.getMessageKey(conversationId, messageId));
        await this.kvStore.set(conversationKey, JSON.stringify(messageList.filter(id => id !== messageId)));
    }
    async getOneHistory(messageId, conversationId) {
        const messageKey = this.getMessageKey(conversationId, messageId);
        const messageData = await this.kvStore.get(messageKey);
        return messageData ? JSON.parse(messageData) : undefined;
    }
}
