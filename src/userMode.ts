import {
  AbstractUserModeSelector,
  BasicStorage,
  ChatPreset,
  ChatPresetManager,
  EventMessage,
  SendMessageOption,
  UserState,
} from './core/index.js'
import { getConfig } from './config.js'

export class StandaloneUserModeSelector extends AbstractUserModeSelector {
  constructor(
    private presetManager: ChatPresetManager,
    private userStateStorage: BasicStorage<UserState>
  ) {
    super()
  }

  async getChatPreset(e: EventMessage): Promise<ChatPreset> {
    const userId = String(e.sender.user_id)
    const config = getConfig()

    // 1. Check if user has an explicitly chosen preset
    try {
      const state = await this.userStateStorage.getItem(userId)
      if (state?.settings?.preset) {
        const custom = await this.presetManager.getInstance(state.settings.preset)
        if (custom) return custom
      }
    } catch (err) {
      console.warn(`[UserModeSelector] Failed to query user state for ${userId}:`, err)
    }

    // 2. Check default chat preset from config.llm
    if (config.llm?.defaultChatPresetId) {
      try {
        const defaultPreset = await this.presetManager.getInstance(config.llm.defaultChatPresetId)
        if (defaultPreset) return defaultPreset
      } catch (err) {
        console.warn(`[UserModeSelector] Failed to get defaultChatPresetId:`, err)
      }
    }

    // 3. Fallback to first available preset in database
    try {
      const all = await this.presetManager.getAllPresets()
      if (all && all.length > 0) {
        const chosen = all.find((p) => !p.local) || all[0]
        return chosen
      }
    } catch (err) {
      console.warn('[UserModeSelector] Failed to query preset storage:', err)
    }

    // 4. Hard fallback placeholder
    return new ChatPreset({
      id: 'default',
      name: '默认预设',
      local: true,
      sendMessageOption: SendMessageOption.create({
        model: 'gpt-4o',
        temperature: 0.7,
      }),
    })
  }
}
