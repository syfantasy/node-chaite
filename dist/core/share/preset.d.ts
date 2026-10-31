import { NonExecutableShareableManager } from './shareable.js';
import { ChatPreset } from '../channels/index.js';
import { BasicStorage } from '../types/index.js';
export declare class ChatPresetManager extends NonExecutableShareableManager<ChatPreset> {
    protected storage: BasicStorage<ChatPreset>;
    private static instance;
    private constructor();
    static init(storage: BasicStorage<ChatPreset>): Promise<ChatPresetManager>;
    static getInstance(): Promise<ChatPresetManager | null>;
    getAllPresets(options?: {
        includeLocal?: boolean;
        namespace?: string;
    }): Promise<ChatPreset[]>;
    getPresetByPrefix(prefix: string): Promise<ChatPreset | null>;
}
