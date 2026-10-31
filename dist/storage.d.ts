import { Chaite, ChannelsManager, ChatPresetManager, OperationLogManager, SqlUserStateStorage, SqlHistoryManager } from './core/index.js';
export interface StorageContext {
    mainDriver: any;
    chaite: Chaite;
    presetManager: ChatPresetManager;
    channelsManager: ChannelsManager;
    userStateStorage: SqlUserStateStorage;
    historyStorage: SqlHistoryManager;
    operationLogManager: OperationLogManager;
}
export declare function getStorageContext(): StorageContext | null;
export declare function initChaiteStorage(): Promise<StorageContext>;
