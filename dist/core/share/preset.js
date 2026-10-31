import { NonExecutableShareableManager } from './shareable.js';
export class ChatPresetManager extends NonExecutableShareableManager {
    constructor(storage) {
        super('chat-preset', storage);
        this.storage = storage;
    }
    static async init(storage) {
        if (ChatPresetManager.instance) {
            return ChatPresetManager.instance;
        }
        ChatPresetManager.instance = new ChatPresetManager(storage);
        return ChatPresetManager.instance;
    }
    static async getInstance() {
        if (!ChatPresetManager.instance) {
            return null;
        }
        return ChatPresetManager.instance;
    }
    async getAllPresets(options = {
        includeLocal: true,
    }) {
        if (!this.storage)
            throw new Error('Preset storage not initialized');
        const presets = await this.storage.listItems();
        return presets.filter(preset => {
            const matchNamespace = options.namespace
                ? preset.namespace === options.namespace
                : true;
            const matchLocal = options.includeLocal
                ? true
                : !preset.local;
            return matchNamespace && matchLocal;
        });
    }
    async getPresetByPrefix(prefix) {
        const presets = await this.getAllPresets();
        return presets.find(p => p.prefix === prefix) || null;
    }
}
