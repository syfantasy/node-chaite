import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  Chaite,
  ChannelsManager,
  DefaultChannelLoadBalancer,
  ToolManager,
  ProcessorsManager,
  ChatPresetManager,
  ToolsGroupManager,
  TriggerManager,
  OperationLogManager,
  McpServerManager,
  SkillRegistry,
  drivers,
  SqlChannelStorage,
  SqlChatPresetStorage,
  SqlToolsStorage,
  SqlProcessorsStorage,
  SqlUserStateStorage,
  SqlToolsGroupStorage,
  SqlTriggerStorage,
  SqlMcpServerStorage,
  SqlHistoryManager,
  SqlOperationLogStorage,
  SqlMemoryStorage,
  MemoryManager,
  DefaultMemoryProvider,
  getLogger,
} from './core'
import { StandaloneUserModeSelector } from './userMode'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DATA_DIR = path.resolve(__dirname, '../data')

export interface StorageContext {
  mainDriver: any
  chaite: Chaite
  presetManager: ChatPresetManager
  channelsManager: ChannelsManager
  userStateStorage: SqlUserStateStorage
  historyStorage: SqlHistoryManager
  operationLogManager: OperationLogManager
}

let currentStorageContext: StorageContext | null = null

export function getStorageContext(): StorageContext | null {
  return currentStorageContext
}

export async function initChaiteStorage(): Promise<StorageContext> {
  // Ensure directories exist
  const dirs = [
    ROOT_DATA_DIR,
    path.join(ROOT_DATA_DIR, 'images'),
    path.join(ROOT_DATA_DIR, 'tools'),
    path.join(ROOT_DATA_DIR, 'processors'),
    path.join(ROOT_DATA_DIR, 'triggers'),
    path.join(ROOT_DATA_DIR, 'skills'),
  ]
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  // 1. Initialize SQLite drivers (data.db, history.db, operation_logs.db)
  await drivers.init({
    dialect: 'sqlite',
    dataDir: ROOT_DATA_DIR,
  })

  const mainDriver = drivers.get('main')
  const historyDriver = drivers.get('history')
  const logDriver = drivers.get('operation_logs')

  // 2. Initialize tables
  const channelsStorage = new SqlChannelStorage(mainDriver)
  await channelsStorage.initialize()

  const chatPresetsStorage = new SqlChatPresetStorage(mainDriver)
  await chatPresetsStorage.initialize()

  const toolsStorage = new SqlToolsStorage(mainDriver)
  await toolsStorage.initialize()

  const processorsStorage = new SqlProcessorsStorage(mainDriver)
  await processorsStorage.initialize()

  const userStateStorage = new SqlUserStateStorage(mainDriver)
  await userStateStorage.initialize()

  const toolsGroupStorage = new SqlToolsGroupStorage(mainDriver)
  await toolsGroupStorage.initialize()

  const triggerStorage = new SqlTriggerStorage(mainDriver)
  await triggerStorage.initialize()

  const mcpServerStorage = new SqlMcpServerStorage(mainDriver)
  await mcpServerStorage.initialize()

  const memoryStorage = new SqlMemoryStorage(mainDriver)
  await memoryStorage.initialize()

  const historyStorage = new SqlHistoryManager(historyDriver, path.join(ROOT_DATA_DIR, 'images'))
  await historyStorage.initialize()

  // 3. Initialize managers
  const channelsManager = await ChannelsManager.init(channelsStorage, new DefaultChannelLoadBalancer())
  const toolsManager = await ToolManager.init(path.join(ROOT_DATA_DIR, 'tools'), toolsStorage)
  const processorsManager = await ProcessorsManager.init(path.join(ROOT_DATA_DIR, 'processors'), processorsStorage)
  const chatPresetManager = await ChatPresetManager.init(chatPresetsStorage)
  const toolsGroupManager = await ToolsGroupManager.init(toolsGroupStorage)
  const triggerManager = new TriggerManager(path.join(ROOT_DATA_DIR, 'triggers'), triggerStorage)
  await triggerManager.initialize()

  // 4. Mode selector
  const userModeSelector = new StandaloneUserModeSelector(chatPresetManager, userStateStorage)

  // 5. Initialize Chaite instance
  const chaite = Chaite.init(
    channelsManager,
    toolsManager,
    processorsManager,
    chatPresetManager,
    toolsGroupManager,
    triggerManager,
    userModeSelector,
    userStateStorage,
    historyStorage,
    getLogger()
  )

  const opLogStorage = new SqlOperationLogStorage(logDriver, 500)
  await opLogStorage.initialize()
  const opLogMgr = new OperationLogManager(opLogStorage)
  chaite.setOperationLogManager(opLogMgr)
  chaite.setMcpServerManager(new McpServerManager(mcpServerStorage))

  const memoryManager = new MemoryManager(new DefaultMemoryProvider(memoryStorage))
  chaite.setMemoryManager(memoryManager)

  const skillRegistry = new SkillRegistry(path.join(ROOT_DATA_DIR, 'skills'))
  await skillRegistry.load()
  chaite.setSkillRegistry(skillRegistry)

  console.log('[Storage] Chaite core & SQLite storage initialized successfully.')

  currentStorageContext = {
    mainDriver,
    chaite,
    presetManager: chatPresetManager,
    channelsManager,
    userStateStorage,
    historyStorage,
    operationLogManager: opLogMgr,
  }

  return currentStorageContext
}
