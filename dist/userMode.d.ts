import { AbstractUserModeSelector, BasicStorage, ChatPreset, ChatPresetManager, EventMessage, UserState } from './core/index.js';
export declare class StandaloneUserModeSelector extends AbstractUserModeSelector {
    private presetManager;
    private userStateStorage;
    constructor(presetManager: ChatPresetManager, userStateStorage: BasicStorage<UserState>);
    getChatPreset(e: EventMessage): Promise<ChatPreset>;
}
