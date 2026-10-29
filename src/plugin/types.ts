import { ChaiteEvent } from './event'

export type PluginType = 'single-file' | 'directory'

export interface PluginConfigField {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'textarea' | 'select'
  default?: any
  description?: string
  options?: Array<{ label: string; value: any }>
}

export interface PluginMeta {
  id: string
  name: string
  version?: string
  description?: string
  author?: string
  type: PluginType
  enabled: boolean
  entryPath: string
  configSchema?: PluginConfigField[]
  config?: Record<string, any>
}

export interface PluginStorageClient {
  get: <T = any>(key: string, defaultValue?: T) => Promise<T | undefined>
  set: (key: string, value: any) => Promise<void>
  delete: (key: string) => Promise<boolean>
  list: () => Promise<Record<string, any>>
  clear: () => Promise<number>
}

export type CommandHandler = (e: ChaiteEvent) => Promise<boolean | void>

export interface CommandRule {
  match: string | RegExp
  description?: string
  adminOnly?: boolean
}

export type MiddlewarePhase = 'before_llm' | 'after_llm'

export type MiddlewareHandler = (ctx: {
  event: any
  userMessage?: any
  preset?: any
  replyText?: string
}) => Promise<void | boolean>

export interface PluginContext {
  pluginId: string
  config: Record<string, any>
  storage: PluginStorageClient
  logger: {
    info: (...args: any[]) => void
    warn: (...args: any[]) => void
    error: (...args: any[]) => void
    debug: (...args: any[]) => void
  }
  saveConfig: (newConfig: Record<string, any>) => Promise<void>
  registerCommand: (
    rule: string | RegExp | CommandRule,
    handler: CommandHandler
  ) => void
  registerAdapter: (name: string, adapter: any) => void
  registerModelProvider: (name: string, provider: any) => void
  registerMiddleware: (phase: MiddlewarePhase, handler: MiddlewareHandler) => void
  registerTool: (tool: any) => void
  cron: (cronExpression: string, handler: () => void | Promise<void>) => () => void
  onDestroy: (cleanupFn: () => void | Promise<void>) => void
  emitMessage: (event: ChaiteEvent) => Promise<boolean>
}

export interface PluginInstance {
  meta: PluginMeta
  commands: Array<{ rule: CommandRule; handler: CommandHandler }>
  middlewares: Array<{ phase: MiddlewarePhase; handler: MiddlewareHandler }>
  cronJobs: Array<() => void>
  cleanupFns: Array<() => void | Promise<void>>
  adapters: Map<string, any>
  modelProviders: Map<string, any>
  tools: any[]
  rawModule?: any
}

export { ChaiteEvent }
