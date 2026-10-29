import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_PATH = path.resolve(__dirname, '../config.json')

export interface AppConfig {
  onebot: {
    url: string
    accessToken: string
    botUin: number
  }
  web: {
    host: string
    port: number
    adminToken: string
  }
  management: {
    whiteGroups: number[]
    blackGroups: number[]
    whiteUsers: number[]
    blackUsers: number[]
    masterUsers: number[]
  }
  chat: {
    toggleMode: 'at' | 'prefix' | 'both'
    togglePrefix: string
    commandPrefix?: string
    allowPrivate: boolean
    maxMessageLength: number
    enableAt?: boolean
    atPresetId?: string
  }
  llm: {
    defaultModel?: string
    defaultChatPresetId?: string
    enableGroupContext?: boolean
    [key: string]: any
  }
  bym: {
    enable: boolean
    hit: string[]
    probability: number
    speakingMode?: 'reply' | 'contextual'
    contextualPrompt?: string
    defaultPreset?: string
    presetPrefix?: string
    presetMap?: Array<{
      keywords: string[]
      presetId: string
      priority: number
      recall?: boolean
    }>
    maxTokens?: number
    temperature?: number
    sendReasoning?: boolean
    [key: string]: any
  }
  groupContext: {
    minMessages: number
    minTokens: number
    maxMessages: number
    maxTokens: number
    enableRichCards: boolean
    enableForwardParse: boolean
    maxForwardMessages: number
  }
  logging: {
    enabled: boolean
    maxRecords: number
  }
  vision: {
    maxRecentImages: number
    enableGroupContextImages: boolean
  }
  maintenance?: {
    historyRetentionDays: number
    autoCleanImages: boolean
  }
}

const DEFAULT_CONFIG: AppConfig = {
  onebot: {
    url: 'ws://127.0.0.1:3001/',
    accessToken: '',
    botUin: 0,
  },
  web: {
    host: '0.0.0.0',
    port: 48370,
    adminToken: 'admin',
  },
  management: {
    whiteGroups: [748098456],
    blackGroups: [],
    whiteUsers: [],
    blackUsers: [],
    masterUsers: [],
  },
  chat: {
    toggleMode: 'at',
    togglePrefix: '#chat',
    commandPrefix: '#',
    allowPrivate: false,
    maxMessageLength: 1500,
    enableAt: true,
    atPresetId: '',
  },
  llm: {
    defaultModel: '',
    defaultChatPresetId: '',
    enableGroupContext: true,
  },
  bym: {
    enable: false,
    hit: [],
    probability: 0.02,
    speakingMode: 'reply',
    defaultPreset: '',
    presetMap: [],
  },
  groupContext: {
    minMessages: 20,
    minTokens: 2000,
    maxMessages: 100,
    maxTokens: 10000,
    enableRichCards: true,
    enableForwardParse: true,
    maxForwardMessages: 15,
  },
  logging: {
    enabled: true,
    maxRecords: 500,
  },
  vision: {
    maxRecentImages: 3,
    enableGroupContextImages: true,
  },
  maintenance: {
    historyRetentionDays: 30,
    autoCleanImages: true,
  },
}

let currentConfig: AppConfig = { ...DEFAULT_CONFIG }

export function loadConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
      const parsed = JSON.parse(raw)
      currentConfig = {
        ...DEFAULT_CONFIG,
        ...parsed,
        onebot: { ...DEFAULT_CONFIG.onebot, ...parsed.onebot },
        web: { ...DEFAULT_CONFIG.web, ...parsed.web },
        management: {
          whiteGroups: (parsed.management?.whiteGroups ?? [748098456]).map(Number),
          blackGroups: (parsed.management?.blackGroups || []).map(Number),
          whiteUsers: (parsed.management?.whiteUsers || []).map(Number),
          blackUsers: (parsed.management?.blackUsers || []).map(Number),
          masterUsers: (parsed.management?.masterUsers || []).map(Number),
        },
        chat: { ...DEFAULT_CONFIG.chat, ...parsed.chat },
        llm: { ...DEFAULT_CONFIG.llm, ...parsed.llm },
        bym: { ...DEFAULT_CONFIG.bym, ...parsed.bym },
        groupContext: { ...DEFAULT_CONFIG.groupContext, ...parsed.groupContext },
        logging: { ...DEFAULT_CONFIG.logging, ...parsed.logging },
        vision: { ...DEFAULT_CONFIG.vision, ...parsed.vision },
      }
    } else {
      currentConfig = { ...DEFAULT_CONFIG }
      saveConfig(currentConfig)
    }
  } catch (err) {
    console.error('[Config] Failed to load config.json, using defaults:', err)
    currentConfig = { ...DEFAULT_CONFIG }
  }
  return currentConfig
}

export function getConfig(): AppConfig {
  return currentConfig
}

export function saveConfig(cfg: AppConfig): void {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf-8')
    currentConfig = cfg
  } catch (err) {
    console.error('[Config] Failed to save config.json:', err)
  }
}
