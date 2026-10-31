import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const EXAMPLE_PATH = path.resolve(__dirname, '../config.example.json')

/**
 * 解析运行数据目录（SQLite 库、config.json、图片、工具/技能脚本等）。
 *
 * 历史上数据全部存放在包目录内（node_modules/<pkg>/data），嵌入式部署下
 * 每次重装/升级依赖都会连带清空渠道、预设与对话历史。现在按以下优先级解析：
 * 1. 宿主 cwd 下 data/chaite 已有数据（data.db 存在）→ 使用它（数据与
 *    node_modules 解耦，重装不丢）。
 * 2. 包目录 data 已有数据 → 沿用（独立部署的历史布局：cwd 即包根，零迁移）。
 * 3. 全新安装 → 落在宿主 cwd 的 data/chaite。
 */
export function resolveRootDataDir(): string {
  // 显式环境变量优先（相对路径基于 cwd 解析），便于宿主自定义数据位置
  const envDir = process.env.CHAITE_DATA_DIR?.trim()
  if (envDir) {
    return path.resolve(envDir)
  }

  const pkgRoot = path.resolve(__dirname, '..')
  const isStandalone = path.resolve(process.cwd()) === pkgRoot
  const pkgDataDir = path.resolve(pkgRoot, 'data')

  // 1. 如果是直接独立部署（当前 cwd 即本体根目录），数据目录始终直接是本体的 data/
  if (isStandalone) {
    return pkgDataDir
  }

  // 2. 如果是被外部宿主（如 Yunzai）作为依赖加载：
  const hostDataDir = path.resolve(process.cwd(), 'data/chaite')
  const hasData = (dir: string): boolean => fs.existsSync(path.join(dir, 'data.db'))
  if (hasData(hostDataDir)) {
    return hostDataDir
  }
  if (hasData(pkgDataDir)) {
    return pkgDataDir
  }
  return hostDataDir
}

function resolveConfigPath(): string {
  const dataDir = resolveRootDataDir()
  const dataConfig = path.join(dataDir, 'config.json')

  const pkgRoot = path.resolve(__dirname, '..')
  const isStandalone = path.resolve(process.cwd()) === pkgRoot
  const rootConfig = path.join(pkgRoot, 'config.json')

  // 独立部署版：优先直接使用本体根目录的 config.json（最符合独立部署直觉，改配置一目了然）
  if (isStandalone) {
    if (fs.existsSync(rootConfig)) {
      return rootConfig
    }
    if (fs.existsSync(dataConfig)) {
      return dataConfig
    }
    return rootConfig
  }

  // 外部宿主依赖版（如在 Yunzai 中运行）：配置必须落在持久化目录 data/chaite/config.json，防止重装被冲掉
  if (fs.existsSync(dataConfig)) {
    return dataConfig
  }

  // 若宿主根目录或包根有老配置，自动迁移过来
  const candidateDirs = [
    pkgRoot,
    process.cwd(),
  ]
  for (const dir of candidateDirs) {
    const legacyPath = path.join(dir, 'config.json')
    if (fs.existsSync(legacyPath) && legacyPath !== dataConfig) {
      try {
        fs.mkdirSync(path.dirname(dataConfig), { recursive: true })
        fs.copyFileSync(legacyPath, dataConfig)
        console.log(`[Config] 自动从历史路径迁移 config.json: ${legacyPath} -> ${dataConfig}`)
        return dataConfig
      } catch {}
    }
  }
  return dataConfig
}

export interface AppConfig {
  onebot?: {
    url?: string
    accessToken?: string
    botUin?: number | string
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
    maxConsecutiveCalls?: number
    maxConsecutiveIdenticalCalls?: number
    [key: string]: any
  }
  bym?: {
    enable?: boolean
    hit?: string[]
    probability?: number
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
  web: {
    host: '0.0.0.0',
    port: 48370,
    adminToken: '',
  },
  management: {
    whiteGroups: [],
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
    maxConsecutiveCalls: 10,
    maxConsecutiveIdenticalCalls: 3,
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
    // 全新安装（data/chaite 还不存在）时，先把数据目录建出来，
    // 否则下面的复制/写入会因目标目录缺失而 ENOENT，白丢一次初始化。
    const configPath = resolveConfigPath()
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(path.dirname(configPath), { recursive: true })
    }
    if (!fs.existsSync(resolveConfigPath())) {
      if (fs.existsSync(EXAMPLE_PATH)) {
        fs.copyFileSync(EXAMPLE_PATH, resolveConfigPath())
        console.log('[Config] config.json 不存在，已自动从 config.example.json 复制初始化')
      } else {
        fs.writeFileSync(resolveConfigPath(), JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8')
        console.log('[Config] config.json 不存在，已自动创建默认配置文件')
      }
    }

    if (fs.existsSync(resolveConfigPath())) {
      const raw = fs.readFileSync(resolveConfigPath(), 'utf-8')
      const parsed = JSON.parse(raw)
      currentConfig = {
        ...DEFAULT_CONFIG,
        ...parsed,
        onebot: { ...DEFAULT_CONFIG.onebot, ...parsed.onebot },
        web: { ...DEFAULT_CONFIG.web, ...parsed.web },
        management: {
          whiteGroups: (parsed.management?.whiteGroups || []).map(Number),
          blackGroups: (parsed.management?.blackGroups || []).map(Number),
          whiteUsers: (parsed.management?.whiteUsers || []).map(Number),
          blackUsers: (parsed.management?.blackUsers || []).map(Number),
          masterUsers: (parsed.management?.masterUsers || []).map(Number),
        },
        chat: { ...DEFAULT_CONFIG.chat, ...parsed.chat },
        llm: { ...DEFAULT_CONFIG.llm, ...parsed.llm },
        groupContext: { ...DEFAULT_CONFIG.groupContext, ...parsed.groupContext },
        logging: { ...DEFAULT_CONFIG.logging, ...parsed.logging },
        vision: { ...DEFAULT_CONFIG.vision, ...parsed.vision },
        maintenance: { ...DEFAULT_CONFIG.maintenance, ...parsed.maintenance },
        ...(parsed.onebot ? { onebot: parsed.onebot } : {}),
        ...(parsed.bym ? { bym: parsed.bym } : {}),
      }
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
    fs.writeFileSync(resolveConfigPath(), JSON.stringify(cfg, null, 2), 'utf-8')
    currentConfig = cfg
  } catch (err) {
    console.error('[Config] Failed to save config.json:', err)
  }
}
