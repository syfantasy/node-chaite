import path from 'node:path'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import schedule from '@karinjs/node-schedule'
import JSZip from 'jszip'
import {
  PluginMeta,
  PluginInstance,
  PluginContext,
  CommandRule,
  CommandHandler,
  MiddlewarePhase,
  MiddlewareHandler,
  ChaiteEvent,
  COMMON_PLUGIN_SCHEMA_FIELDS,
  RendererService,
  RenderOptions,
  PluginSkillDefinition,
} from './types'
import { PluginKVStorage } from './storage'
import { Chaite } from '../core/core/chaite'
import { InMemorySkillImpl } from '../core/agent/skills/SkillRegistry'

export class PluginManager {
  private plugins = new Map<string, PluginInstance>()
  private stateFilePath: string
  private kvStorage?: PluginKVStorage

  readonly scriptsDir: string
  readonly appsDir: string
  readonly cacheDir: string
  private adapters: Map<string, any> = new Map()
  private services: Map<string, any> = new Map()

  constructor(private pluginsDir: string, driver?: any) {
    this.scriptsDir = path.join(pluginsDir, 'scripts')
    this.appsDir = path.join(pluginsDir, 'apps')
    this.cacheDir = path.join(pluginsDir, '.cache', 'runtime')

    if (!fs.existsSync(this.scriptsDir)) {
      fs.mkdirSync(this.scriptsDir, { recursive: true })
    }
    if (!fs.existsSync(this.appsDir)) {
      fs.mkdirSync(this.appsDir, { recursive: true })
    }
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }

    this.stateFilePath = path.join(pluginsDir, '.plugins_state.json')
    if (driver) {
      this.kvStorage = new PluginKVStorage(driver)
    }
  }

  setDriver(driver: any) {
    this.kvStorage = new PluginKVStorage(driver)
  }

  getAdapter(name = 'onebot'): any {
    return this.adapters.get(name) || (globalThis as any).onebotClient
  }

  registerService(name: string, service: any) {
    this.services.set(name, service)
    if (name === 'renderer') {
      ;(globalThis as any).chaiteRenderer = service
    }
  }

  getService<T = any>(name: string): T | undefined {
    return this.services.get(name)
  }

  private loadState(): Record<string, { enabled: boolean }> {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        return JSON.parse(fs.readFileSync(this.stateFilePath, 'utf-8'))
      }
    } catch (e) {
      console.warn('[PluginManager] Failed to read state file:', e)
    }
    return {}
  }

  private saveState(state: Record<string, { enabled: boolean }>) {
    try {
      fs.writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2), 'utf-8')
    } catch (e) {
      console.warn('[PluginManager] Failed to save state file:', e)
    }
  }

  async loadAll(): Promise<void> {
    console.log('[PluginManager] Scanning plugins in:', this.pluginsDir)
    this.plugins.clear()
    const state = this.loadState()

    // 1. 扫描工程包插件 (plugins/apps/<id>/)
    if (fs.existsSync(this.appsDir)) {
      const appEntries = fs.readdirSync(this.appsDir, { withFileTypes: true })
      for (const entry of appEntries) {
        if (entry.name.startsWith('.')) continue
        const fullPath = path.join(this.appsDir, entry.name)
        if (entry.isDirectory()) {
          const pluginId = entry.name
          await this.loadDirectoryPlugin(pluginId, fullPath, state[pluginId]?.enabled ?? true)
        }
      }
    }

    // 2. 扫描单 JS 脚本插件 (plugins/scripts/<id>/ 或 plugins/scripts/<id>.js)
    if (fs.existsSync(this.scriptsDir)) {
      const scriptEntries = fs.readdirSync(this.scriptsDir, { withFileTypes: true })
      for (const entry of scriptEntries) {
        if (entry.name.startsWith('.')) continue
        const fullPath = path.join(this.scriptsDir, entry.name)

        if (entry.isDirectory()) {
          const pluginId = entry.name
          await this.loadScriptPluginDir(pluginId, fullPath, state[pluginId]?.enabled ?? true)
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
          // 自动建目录归拢
          const pluginId = path.parse(entry.name).name
          const targetDir = path.join(this.scriptsDir, pluginId)
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true })
            fs.renameSync(fullPath, path.join(targetDir, 'index.js'))
          }
          await this.loadScriptPluginDir(pluginId, targetDir, state[pluginId]?.enabled ?? true)
        }
      }
    }

    // 3. 根目录兼任（若直接放于 plugins/ 下）
    const rootIgnored = new Set(['.cache', '.git', 'node_modules', '.plugins_state.json', 'apps', 'scripts'])
    if (fs.existsSync(this.pluginsDir)) {
      const entries = fs.readdirSync(this.pluginsDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith('.') || rootIgnored.has(entry.name)) continue
        const fullPath = path.join(this.pluginsDir, entry.name)
        if (entry.isDirectory()) {
          const pluginId = entry.name
          if (this.plugins.has(pluginId)) continue
          const hasPackageJson = fs.existsSync(path.join(fullPath, 'package.json'))
          const isEnabled = state[pluginId]?.enabled ?? true
          if (hasPackageJson) {
            await this.loadDirectoryPlugin(pluginId, fullPath, isEnabled)
          } else {
            await this.loadScriptPluginDir(pluginId, fullPath, isEnabled)
          }
        }
      }
    }

    console.log(`[PluginManager] Loaded ${this.plugins.size} plugin(s).`)
  }

  private async loadScriptPluginDir(id: string, dirPath: string, enabled: boolean): Promise<PluginInstance | null> {
    try {
      let entryFile = 'index.js'
      if (!fs.existsSync(path.join(dirPath, entryFile))) {
        // 查找同名或唯一 js
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js') || f.endsWith('.mjs'))
        if (files.length > 0) {
          entryFile = files[0]
        } else {
          console.warn(`[PluginManager] Script plugin "${id}" missing JS file in: ${dirPath}`)
          return null
        }
      }
      const entryPath = path.join(dirPath, entryFile)

      const configPath = path.join(dirPath, 'config.json')
      let config: Record<string, any> = {}
      if (fs.existsSync(configPath)) {
        try { config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) } catch {}
      }

      const schemaPath = path.join(dirPath, 'schema.json')
      let configSchema: any = undefined
      if (fs.existsSync(schemaPath)) {
        try { configSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8')) } catch {}
      }

      const instance: PluginInstance = {
        meta: {
          id,
          name: id,
          type: 'single-file',
          enabled,
          entryPath,
          configSchema,
          config,
        },
        commands: [],
        pokeHandlers: [],
        memberJoinHandlers: [],
        memberLeaveHandlers: [],
        requestHandlers: [],
        recallHandlers: [],
        actions: new Map(),
        middlewares: [],
        cronJobs: [],
        cleanupFns: [],
        adapters: new Map(),
        modelProviders: new Map(),
        tools: [],
        skills: [],
        services: new Map(),
      }

      if (enabled) {
        await this.initPluginModule(instance, entryPath, config)
      }

      this.plugins.set(id, instance)
      return instance
    } catch (err: any) {
      console.error(`[PluginManager] Failed to load script plugin "${id}":`, err)
      return null
    }
  }

  private async loadDirectoryPlugin(id: string, dirPath: string, enabled: boolean): Promise<PluginInstance | null> {
    try {
      const pkgPath = path.join(dirPath, 'package.json')
      const schemaPath = path.join(dirPath, 'schema.json')
      const configPath = path.join(dirPath, 'config.json')

      let pkg: any = {}
      if (fs.existsSync(pkgPath)) {
        try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) } catch {}
      }

      let configSchema: any = undefined
      if (fs.existsSync(schemaPath)) {
        try { configSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8')) } catch {}
      }

      let config: Record<string, any> = {}
      if (fs.existsSync(configPath)) {
        try { config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) } catch {}
      }

      const entryFile = pkg.main || 'index.js'
      const entryPath = path.join(dirPath, entryFile)

      if (!fs.existsSync(entryPath)) {
        console.warn(`[PluginManager] Directory plugin "${id}" missing entry file: ${entryFile}`)
        return null
      }

      const instance: PluginInstance = {
        meta: {
          id,
          name: pkg.name || id,
          version: pkg.version || '1.0.0',
          description: pkg.description || '',
          author: pkg.author || '',
          type: 'directory',
          enabled,
          entryPath,
          configSchema,
          config,
        },
        commands: [],
        pokeHandlers: [],
        memberJoinHandlers: [],
        memberLeaveHandlers: [],
        requestHandlers: [],
        recallHandlers: [],
        actions: new Map(),
        middlewares: [],
        cronJobs: [],
        cleanupFns: [],
        adapters: new Map(),
        modelProviders: new Map(),
        tools: [],
        skills: [],
        services: new Map(),
      }

      if (enabled) {
        await this.initPluginModule(instance, entryPath, config)
      }

      this.plugins.set(id, instance)
      return instance
    } catch (err: any) {
      console.error(`[PluginManager] Failed to load directory plugin "${id}":`, err)
      return null
    }
  }

  private async clearInstanceResources(instance: PluginInstance) {
    for (const cancel of instance.cronJobs) {
      try { cancel() } catch {}
    }
    instance.cronJobs = []

    for (const cleanup of instance.cleanupFns) {
      try { await cleanup() } catch (err) { console.error(`[PluginManager] Cleanup error in "${instance.meta.name}":`, err) }
    }
    instance.cleanupFns = []

    if (instance.skills && instance.skills.length > 0) {
      try {
        const chaite = Chaite.getInstance()
        const registry = chaite?.getSkillRegistry?.()
        if (registry) {
          for (const skillId of instance.skills) {
            registry.unregisterDynamicSkill(skillId)
          }
        }
      } catch {}
      instance.skills = []
    }

    instance.commands = []
    instance.pokeHandlers = []
    instance.memberJoinHandlers = []
    instance.memberLeaveHandlers = []
    instance.requestHandlers = []
    instance.recallHandlers = []
    instance.actions.clear()
    instance.middlewares = []
    for (const key of instance.adapters.keys()) {
      this.adapters.delete(key)
    }
    instance.adapters.clear()

    for (const key of instance.services.keys()) {
      this.services.delete(key)
    }
    instance.services.clear()
    if (!this.services.has('renderer')) {
      delete (globalThis as any).chaiteRenderer
    }

    instance.modelProviders.clear()
    instance.tools = []
  }

  private prepareDirectoryRuntime(id: string, dirPath: string, relativeEntry: string): string {
    const pluginCacheRoot = path.join(this.cacheDir, id)
    if (!fs.existsSync(pluginCacheRoot)) {
      fs.mkdirSync(pluginCacheRoot, { recursive: true })
    }

    const version = String(Date.now())
    const shadowDir = path.join(pluginCacheRoot, version)
    fs.mkdirSync(shadowDir, { recursive: true })

    const copyRecursive = (src: string, dest: string) => {
      const entries = fs.readdirSync(src, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.cache') continue
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)
        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true })
          copyRecursive(srcPath, destPath)
        } else if (entry.isFile()) {
          fs.copyFileSync(srcPath, destPath)
        }
      }
    }
    copyRecursive(dirPath, shadowDir)

    // 若原目录存在私有 node_modules，建立符号链接使依赖解析无损保留
    const originNodeModules = path.join(dirPath, 'node_modules')
    const shadowNodeModules = path.join(shadowDir, 'node_modules')
    if (fs.existsSync(originNodeModules) && !fs.existsSync(shadowNodeModules)) {
      try {
        fs.symlinkSync(originNodeModules, shadowNodeModules, 'junction')
      } catch {}
    }

    // 自动规范化 package.json：若缺失 type 则自动补齐 "type": "module"，消除 ESM 警告与二次重析
    const shadowPkgPath = path.join(shadowDir, 'package.json')
    if (fs.existsSync(shadowPkgPath)) {
      try {
        const pkgData = JSON.parse(fs.readFileSync(shadowPkgPath, 'utf-8'))
        if (!pkgData.type) {
          pkgData.type = 'module'
          fs.writeFileSync(shadowPkgPath, JSON.stringify(pkgData, null, 2), 'utf-8')
        }
      } catch {}
    }

    // 清理该插件旧版本的影子目录
    try {
      const existing = fs.readdirSync(pluginCacheRoot)
      for (const oldVer of existing) {
        if (oldVer !== version) {
          fs.rmSync(path.join(pluginCacheRoot, oldVer), { recursive: true, force: true })
        }
      }
    } catch {}

    return path.join(shadowDir, relativeEntry)
  }

  private async initPluginModule(instance: PluginInstance, entryPath: string, config: Record<string, any>) {
    this.clearInstanceResources(instance)

    let runEntryPath = entryPath
    if (instance.meta.type === 'directory') {
      const pluginDir = path.dirname(entryPath)
      const relativeEntry = path.relative(pluginDir, entryPath)
      runEntryPath = this.prepareDirectoryRuntime(instance.meta.id, pluginDir, relativeEntry)
    }

    const fileUrl = `${pathToFileURL(runEntryPath).href}?t=${Date.now()}`
    const mod = await import(fileUrl)
    instance.rawModule = mod

    const meta = instance.meta
    if (mod.name) meta.name = mod.name
    if (mod.version) meta.version = mod.version
    if (mod.description) meta.description = mod.description
    if (mod.author) meta.author = mod.author
    if (mod.configSchema && !meta.configSchema) meta.configSchema = mod.configSchema

    const storageClient = this.kvStorage?.createScopedClient(meta.id) || {
      get: async () => undefined,
      set: async () => {},
      delete: async () => false,
      list: async () => ({}),
      clear: async () => 0,
    }

    const ctx: PluginContext = {
      pluginId: meta.id,
      config,
      storage: storageClient,
      logger: {
        info: (...args) => console.log(`[Plugin:${meta.name}]`, ...args),
        warn: (...args) => console.warn(`[Plugin:${meta.name}]`, ...args),
        error: (...args) => console.error(`[Plugin:${meta.name}]`, ...args),
        debug: (...args) => console.debug(`[Plugin:${meta.name}]`, ...args),
      },
      saveConfig: async (newCfg) => {
        await this.updatePluginConfig(meta.id, newCfg)
      },
      registerCommand: (rule, handler) => {
        const normalizedRule: CommandRule =
          typeof rule === 'string' || rule instanceof RegExp
            ? { match: rule }
            : rule
        instance.commands.push({ rule: normalizedRule, handler })
      },
      onPoke: (handler) => {
        instance.pokeHandlers.push(handler)
      },
      onMemberJoin: (handler) => {
        instance.memberJoinHandlers.push(handler)
      },
      onMemberLeave: (handler) => {
        instance.memberLeaveHandlers.push(handler)
      },
      onRequest: (handler) => {
        instance.requestHandlers.push(handler)
      },
      onRecall: (handler) => {
        instance.recallHandlers.push(handler)
      },
      registerAction: (actionName, handler) => {
        instance.actions.set(actionName, handler)
      },
      registerAdapter: (name, adapter) => {
        instance.adapters.set(name, adapter)
        this.adapters.set(name, adapter)
        if (name === 'onebot') {
          ;(globalThis as any).onebotClient = adapter
        }
      },
      getAdapter: (name = 'onebot') => {
        return this.getAdapter(name)
      },
      get client() {
        return this.getAdapter('onebot')
      },
      registerService: (name, srv) => {
        instance.services.set(name, srv)
        this.registerService(name, srv)
      },
      getService: (name) => {
        return this.getService(name)
      },
      registerRenderer: (renderer) => {
        instance.services.set('renderer', renderer)
        this.registerService('renderer', renderer)
      },
      render: async (opts) => {
        const renderer = this.getService<RendererService>('renderer') || (globalThis as any).chaiteRenderer
        if (!renderer || typeof renderer.render !== 'function') {
          throw new Error('当前系统未启用或未注册可用渲染服务 (可启用 service-renderer 插件)')
        }
        return renderer.render(opts)
      },
      get services() {
        return this.services
      },
      registerModelProvider: (name, provider) => {
        instance.modelProviders.set(name, provider)
      },
      registerMiddleware: (phase, handler) => {
        instance.middlewares.push({ phase, handler })
      },
      registerTool: (tool) => {
        instance.tools.push(tool)
      },
      registerSkill: (skillDef: PluginSkillDefinition) => {
        try {
          const chaite = Chaite.getInstance()
          const registry = chaite?.getSkillRegistry?.()
          const skillId = skillDef.id || skillDef.name
          if (registry) {
            const inMemSkill = new InMemorySkillImpl({
              id: skillId,
              frontmatter: {
                name: skillDef.name,
                description: skillDef.description,
                keywords: skillDef.keywords,
                allowedTools: skillDef.allowedTools,
                mcpServer: skillDef.mcpServer,
                mcpTools: skillDef.mcpTools,
                readonly: true,
                source: 'plugin',
              },
              instructions: skillDef.instructions,
              validate: skillDef.validate
                ? (ctx) => {
                    const evt = (ctx.event || ctx) as ChaiteEvent
                    return skillDef.validate!(evt)
                  }
                : undefined,
            })
            registry.registerDynamicSkill(inMemSkill)
            instance.skills.push(skillId)
          }
        } catch (err: any) {
          console.warn(`[PluginManager] Failed to register dynamic skill "${skillDef.name}":`, err?.message || err)
        }
      },
      onDestroy: (cleanupFn) => {
        instance.cleanupFns.push(cleanupFn)
      },
      emitMessage: async (evt) => {
        return this.emitMessage(evt)
      },
      cron: (cronExpression, handler) => {
        let job: any = null
        try {
          job = schedule.scheduleJob(cronExpression, async () => {
            try {
              await handler()
            } catch (e) {
              console.error(`[Plugin:${meta.name}] Cron execution error:`, e)
            }
          })
          if (!job) {
            console.error(`[Plugin:${meta.name}] Failed to schedule job for cron rule: "${cronExpression}"`)
          }
        } catch (e) {
          console.error(`[Plugin:${meta.name}] Failed to register cron:`, e)
        }
        const cancel = () => {
          if (job) {
            try {
              job.cancel()
            } catch (err) {
              console.error(`[Plugin:${meta.name}] Error cancelling cron job:`, err)
            }
          }
        }
        instance.cronJobs.push(cancel)
        return cancel
      },
    }

    const setupFn = mod.setup || (typeof mod.default === 'function' ? mod.default : mod.default?.setup)
    if (typeof setupFn === 'function') {
      await setupFn(ctx)
    }
  }

  getPlugins(): PluginMeta[] {
    return Array.from(this.plugins.values()).map((p) => {
      const existingSchema = (Array.isArray(p.meta.configSchema) ? p.meta.configSchema : []).map((f) => ({
        ...f,
        group: f.group || 'plugin',
      }))
      const existingKeys = new Set(existingSchema.map((f) => f.key))
      const extraCommonFields = COMMON_PLUGIN_SCHEMA_FIELDS.filter((f) => !existingKeys.has(f.key))
      return {
        ...p.meta,
        configSchema: [...existingSchema, ...extraCommonFields],
      }
    })
  }

  async togglePlugin(id: string, enabled: boolean): Promise<boolean> {
    const plugin = this.plugins.get(id)
    if (!plugin) return false

    plugin.meta.enabled = enabled
    const state = this.loadState()
    state[id] = { enabled }
    this.saveState(state)

    if (enabled) {
      await this.initPluginModule(plugin, plugin.meta.entryPath, plugin.meta.config || {})
    } else {
      this.clearInstanceResources(plugin)
    }
    return true
  }

  async updatePluginConfig(id: string, newConfig: Record<string, any>): Promise<boolean> {
    const plugin = this.plugins.get(id)
    if (!plugin) return false

    // 拍平由于意外嵌套的 { config: { config: ... } }
    let cleanedConfig = newConfig || {}
    while (
      cleanedConfig &&
      typeof cleanedConfig === 'object' &&
      'config' in cleanedConfig &&
      Object.keys(cleanedConfig).length === 1 &&
      typeof (cleanedConfig as any).config === 'object' &&
      !Array.isArray((cleanedConfig as any).config)
    ) {
      cleanedConfig = (cleanedConfig as any).config
    }

    plugin.meta.config = cleanedConfig
    const pluginDir = path.dirname(plugin.meta.entryPath)
    const configPath = path.join(pluginDir, 'config.json')

    fs.writeFileSync(configPath, JSON.stringify(cleanedConfig, null, 2), 'utf-8')
    console.log(`[PluginManager] Updated config for plugin "${id}"`)

    if (plugin.meta.enabled) {
      await this.initPluginModule(plugin, plugin.meta.entryPath, cleanedConfig)
    }
    return true
  }

  async reloadPlugin(id: string): Promise<boolean> {
    const plugin = this.plugins.get(id)
    if (!plugin) return false

    console.log(`[PluginManager] Reloading plugin "${id}"...`)
    this.clearInstanceResources(plugin)

    if (plugin.meta.enabled) {
      // 重新读取磁盘上的最新 config.json
      const pluginDir = path.dirname(plugin.meta.entryPath)
      const configPath = path.join(pluginDir, 'config.json')
      let cfg: Record<string, any> = {}
      if (fs.existsSync(configPath)) {
        try { cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8')) } catch {}
      }
      plugin.meta.config = cfg
      await this.initPluginModule(plugin, plugin.meta.entryPath, cfg)
    }
    return true
  }

  getPluginCode(id: string): string | null {
    const plugin = this.plugins.get(id)
    if (!plugin || plugin.meta.type !== 'single-file') return null
    if (!fs.existsSync(plugin.meta.entryPath)) return null
    return fs.readFileSync(plugin.meta.entryPath, 'utf-8')
  }

  async savePluginCode(id: string, code: string): Promise<boolean> {
    let plugin = this.plugins.get(id)
    let pluginDir: string
    let filePath: string

    if (plugin) {
      filePath = plugin.meta.entryPath
      pluginDir = path.dirname(filePath)
    } else {
      pluginDir = path.join(this.scriptsDir, id)
      if (!fs.existsSync(pluginDir)) {
        fs.mkdirSync(pluginDir, { recursive: true })
      }
      filePath = path.join(pluginDir, 'index.js')
      const cfgPath = path.join(pluginDir, 'config.json')
      if (!fs.existsSync(cfgPath)) {
        fs.writeFileSync(cfgPath, '{}', 'utf-8')
      }
    }

    fs.writeFileSync(filePath, code, 'utf-8')
    if (!plugin) {
      await this.loadScriptPluginDir(id, pluginDir, true)
    } else {
      await this.reloadPlugin(id)
    }
    return true
  }

  // 导出插件（支持纯 js 或包含 config.json 的 zip）
  async exportPlugin(
    id: string,
    includeConfig: boolean = true,
    format: 'zip' | 'raw' = 'zip'
  ): Promise<{ filename: string; buffer: Buffer }> {
    const plugin = this.plugins.get(id)
    if (!plugin) throw new Error(`插件 ${id} 不存在`)

    const pluginDir = path.dirname(plugin.meta.entryPath)

    if (format === 'raw' && plugin.meta.type === 'single-file') {
      const code = fs.readFileSync(plugin.meta.entryPath)
      return { filename: `${id}.js`, buffer: code }
    }

    const zip = new JSZip()
    const excludes = ['node_modules', '.git', '.cache', '.DS_Store']
    if (!includeConfig) excludes.push('config.json')

    const addFilesRecursively = (currentDir: string, zipFolder: JSZip) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true })
      for (const entry of entries) {
        if (excludes.includes(entry.name)) continue
        if (entry.name.startsWith('.tmp_')) continue
        const fullPath = path.join(currentDir, entry.name)
        if (entry.isDirectory()) {
          const subFolder = zipFolder.folder(entry.name)
          if (subFolder) addFilesRecursively(fullPath, subFolder)
        } else if (entry.isFile()) {
          zipFolder.file(entry.name, fs.readFileSync(fullPath))
        }
      }
    }

    addFilesRecursively(pluginDir, zip)

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    return { filename: `${id}.zip`, buffer }
  }

  // 导入插件
  async importPlugin(
    targetType: 'single-file' | 'directory',
    filename: string,
    buffer: Buffer,
    options?: { overwrite?: boolean; customId?: string }
  ): Promise<{ id: string; overwritten?: boolean }> {
    const isZip = filename.endsWith('.zip')
    const rawId = (options?.customId || path.parse(filename).name).replace(/[^a-zA-Z0-9_-]/g, '')
    let pluginId = rawId || `imported_${Date.now()}`

    // 检查是否存在同名插件
    if (this.plugins.has(pluginId) && !options?.overwrite) {
      throw new Error(`PLUGIN_CONFLICT:${pluginId}`)
    }

    const wasOverwritten = this.plugins.has(pluginId)
    if (wasOverwritten) {
      // 覆盖前先释放旧实例资源
      const oldPlugin = this.plugins.get(pluginId)
      if (oldPlugin) this.clearInstanceResources(oldPlugin)
    }

    if (targetType === 'single-file' && !isZip) {
      // 单纯上传了 .js 文件 -> 存入 scripts/<id>/
      const targetDir = path.join(this.scriptsDir, pluginId)
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })
      fs.writeFileSync(path.join(targetDir, 'index.js'), buffer)
      const cfgPath = path.join(targetDir, 'config.json')
      if (!fs.existsSync(cfgPath)) fs.writeFileSync(cfgPath, '{}', 'utf-8')

      await this.loadScriptPluginDir(pluginId, targetDir, true)
      return { id: pluginId, overwritten: wasOverwritten }
    }

    const destDir =
      targetType === 'directory'
        ? path.join(this.appsDir, pluginId)
        : path.join(this.scriptsDir, pluginId)

    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true })
    }
    fs.mkdirSync(destDir, { recursive: true })

    const zip = await JSZip.loadAsync(buffer)
    const zipEntries = Object.entries(zip.files)

    // 检查是否所有文件都在同一个外层包裹目录下（如 my-plugin/index.js）
    const topLevelDirs = new Set<string>()
    let hasRootFiles = false
    for (const [name, entry] of zipEntries) {
      const parts = name.split('/').filter(Boolean)
      if (parts.length > 0) {
        if (parts.length === 1 && !entry.dir) {
          hasRootFiles = true
        } else {
          topLevelDirs.add(parts[0])
        }
      }
    }
    const shouldStripPrefix = !hasRootFiles && topLevelDirs.size === 1
    const stripPrefix = shouldStripPrefix ? `${Array.from(topLevelDirs)[0]}/` : ''

    for (const [relPath, fileEntry] of zipEntries) {
      let normalizedPath = relPath
      if (stripPrefix && normalizedPath.startsWith(stripPrefix)) {
        normalizedPath = normalizedPath.slice(stripPrefix.length)
      }
      if (!normalizedPath || normalizedPath === '/') continue

      // 安全防范 Zip Slip
      const safeRelPath = path.normalize(normalizedPath).replace(/^(\.\.(\/|\\|$))+/, '')
      const fullDestPath = path.join(destDir, safeRelPath)
      if (!fullDestPath.startsWith(path.resolve(destDir))) continue

      if (fileEntry.dir) {
        if (!fs.existsSync(fullDestPath)) {
          fs.mkdirSync(fullDestPath, { recursive: true })
        }
      } else {
        const parentDir = path.dirname(fullDestPath)
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true })
        }
        const fileContent = await fileEntry.async('nodebuffer')
        fs.writeFileSync(fullDestPath, fileContent)
      }
    }

    // 确保有 config.json
    const cfg = path.join(destDir, 'config.json')
    if (!fs.existsSync(cfg)) fs.writeFileSync(cfg, '{}', 'utf-8')

    if (targetType === 'directory') {
      await this.loadDirectoryPlugin(pluginId, destDir, true)
    } else {
      await this.loadScriptPluginDir(pluginId, destDir, true)
    }

    return { id: pluginId, overwritten: wasOverwritten }
  }

  // 删除插件
  async deletePlugin(id: string, keepConfig: boolean = true): Promise<boolean> {
    const plugin = this.plugins.get(id)
    if (!plugin) return false

    console.log(`[PluginManager] Deleting plugin "${id}", keepConfig = ${keepConfig}`)

    // 1. 释放运行时资源（定时器、事件总线、指令等）
    this.clearInstanceResources(plugin)

    // 2. 移除内存映射
    this.plugins.delete(id)

    // 3. 保存启用状态记录
    const state = this.loadState()
    if (state[id]) {
      delete state[id]
      this.saveState(state)
    }

    // 4. 清理影子运行时目录
    const runtimeShadowDir = path.join(this.cacheDir, 'runtime', id)
    if (fs.existsSync(runtimeShadowDir)) {
      try {
        fs.rmSync(runtimeShadowDir, { recursive: true, force: true })
      } catch (e: any) {
        console.warn(`[PluginManager] Failed to clean runtime cache for ${id}:`, e.message)
      }
    }

    // 5. 处理物理目录与配置保存
    const pluginDir = path.dirname(plugin.meta.entryPath)
    if (fs.existsSync(pluginDir)) {
      try {
        if (keepConfig) {
          const cfgPath = path.join(pluginDir, 'config.json')
          if (fs.existsSync(cfgPath) && this.kvStorage) {
            try {
              const fileCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'))
              const scoped = this.kvStorage.createScopedClient(id)
              for (const [k, v] of Object.entries(fileCfg)) {
                await scoped.set(k, v)
              }
            } catch {}
          }
        }
        fs.rmSync(pluginDir, { recursive: true, force: true })
      } catch (e: any) {
        console.error(`[PluginManager] Failed to remove plugin directory "${pluginDir}":`, e)
      }
    }

    // 6. 不保留配置时，彻底清空持久化数据库
    if (!keepConfig && this.kvStorage) {
      try {
        await this.kvStorage.createScopedClient(id).clear()
        console.log(`[PluginManager] Cleared stored configuration in DB for plugin "${id}"`)
      } catch (e: any) {
        console.warn(`[PluginManager] Failed to clear KV storage for ${id}:`, e.message)
      }
    }

    return true
  }

  // 重置插件配置为初始默认值
  async resetPluginConfig(id: string): Promise<Record<string, any>> {
    const plugin = this.plugins.get(id)
    if (!plugin) throw new Error(`插件 "${id}" 不存在`)

    // 1. 清空 KV Storage
    if (this.kvStorage) {
      await this.kvStorage.createScopedClient(id).clear()
    }

    // 2. 从 schema 中提取默认值
    const schema = plugin.meta.configSchema || []
    const defaultConfig: Record<string, any> = {}
    for (const item of schema) {
      if (item && item.key && item.default !== undefined) {
        defaultConfig[item.key] = item.default
      }
    }

    // 3. 写入文件系统 config.json
    const pluginDir = path.dirname(plugin.meta.entryPath)
    const configPath = path.join(pluginDir, 'config.json')
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8')

    // 4. 更新内存中的 config
    plugin.meta.config = { ...defaultConfig }

    // 5. 若已启用则热重载
    if (plugin.meta.enabled) {
      await this.initPluginModule(plugin, plugin.meta.entryPath, defaultConfig)
    }

    console.log(`[PluginManager] Reset configuration for plugin "${id}" to defaults`)
    return defaultConfig
  }

  private messagePipelineHandler?: (event: ChaiteEvent) => Promise<void>

  setMessagePipelineHandler(handler: (event: ChaiteEvent) => Promise<void>) {
    this.messagePipelineHandler = handler
  }

  async emitMessage(event: ChaiteEvent): Promise<boolean> {
    const handled = await this.dispatchCommand(event)
    if (handled) return true

    if (this.messagePipelineHandler) {
      await this.messagePipelineHandler(event)
      return true
    }
    return false
  }

  private parseListConfig(val: any): string[] {
    if (!val) return []
    if (Array.isArray(val)) return val.map(String).map((s) => s.trim()).filter(Boolean)
    if (typeof val === 'string') {
      return val.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean)
    }
    return []
  }

  private isBlockedByPluginCommonConfig(plugin: PluginInstance, event: ChaiteEvent): boolean {
    const cfg = plugin.meta.config || {}

    // 1. 群聊黑白名单判断
    if (event.isGroup && event.groupId) {
      const gId = String(event.groupId)
      const whiteGroups = this.parseListConfig(cfg.whiteGroups)
      if (whiteGroups.length > 0 && !whiteGroups.includes(gId)) {
        return true
      }
      const blackGroups = this.parseListConfig(cfg.blackGroups)
      if (blackGroups.length > 0 && blackGroups.includes(gId)) {
        return true
      }
    }

    // 2. 用户黑白名单判断
    if (event.userId) {
      const uId = String(event.userId)
      const whiteUsers = this.parseListConfig(cfg.whiteUsers)
      if (whiteUsers.length > 0 && !whiteUsers.includes(uId)) {
        return true
      }
      const blackUsers = this.parseListConfig(cfg.blackUsers)
      if (blackUsers.length > 0 && blackUsers.includes(uId)) {
        return true
      }
    }

    // 3. 自定义前缀判断（若配置了 customPrefix，则仅当输入满足该前缀时触发）
    if (cfg.customPrefix && typeof cfg.customPrefix === 'string' && cfg.customPrefix.trim()) {
      const prefix = cfg.customPrefix.trim()
      if (!event.text.startsWith(prefix)) {
        return true
      }
    }

    return false
  }

  // 消息指令分发
  async dispatchCommand(event: ChaiteEvent): Promise<boolean> {
    const cleanText = event.text

    for (const plugin of this.plugins.values()) {
      if (!plugin.meta.enabled) continue
      if (this.isBlockedByPluginCommonConfig(plugin, event)) continue

      // 1. 响应戳一戳专用处理器
      if (event.isPoke && plugin.pokeHandlers.length > 0) {
        for (const handler of plugin.pokeHandlers) {
          try {
            const intercepted = await handler(event)
            if (intercepted !== false) return true
          } catch (err: any) {
            console.error(`[PluginManager] Poke error in "${plugin.meta.name}":`, err)
            return true
          }
        }
      }

      // 2. 响应群成员变动事件 (加入/退出)
      if (event.eventType === 'member_join' && plugin.memberJoinHandlers.length > 0) {
        for (const handler of plugin.memberJoinHandlers) {
          try {
            const intercepted = await handler(event)
            if (intercepted !== false) return true
          } catch (err: any) {
            console.error(`[PluginManager] MemberJoin error in "${plugin.meta.name}":`, err)
            return true
          }
        }
      }
      if (event.eventType === 'member_leave' && plugin.memberLeaveHandlers.length > 0) {
        for (const handler of plugin.memberLeaveHandlers) {
          try {
            const intercepted = await handler(event)
            if (intercepted !== false) return true
          } catch (err: any) {
            console.error(`[PluginManager] MemberLeave error in "${plugin.meta.name}":`, err)
            return true
          }
        }
      }

      // 3. 响应加好友/加群申请审批事件
      if (event.eventType === 'request' && plugin.requestHandlers.length > 0) {
        for (const handler of plugin.requestHandlers) {
          try {
            const intercepted = await handler(event)
            if (intercepted !== false) return true
          } catch (err: any) {
            console.error(`[PluginManager] Request error in "${plugin.meta.name}":`, err)
            return true
          }
        }
      }

      // 4. 响应消息撤回事件
      if (event.eventType === 'recall' && plugin.recallHandlers.length > 0) {
        for (const handler of plugin.recallHandlers) {
          try {
            const intercepted = await handler(event)
            if (intercepted !== false) return true
          } catch (err: any) {
            console.error(`[PluginManager] Recall error in "${plugin.meta.name}":`, err)
            return true
          }
        }
      }

      // 若为非消息类事件，则不继续进入文本指令匹配
      if (event.eventType !== 'message') {
        continue
      }

      for (const { rule, handler } of plugin.commands) {
        let matched = false

        if (typeof rule.match === 'string') {
          if (cleanText === rule.match) {
            matched = true
            event.command = rule.match
            event.args = ''
          } else if (cleanText.startsWith(`${rule.match} `) || cleanText.startsWith(`${rule.match}\n`)) {
            matched = true
            event.command = rule.match
            event.args = cleanText.slice(rule.match.length).trim()
          }
        } else if (rule.match instanceof RegExp) {
          const m = rule.match.exec(cleanText)
          if (m) {
            matched = true
            event.command = m[0]
            event.args = cleanText.slice(m.index + m[0].length).trim()
          }
        }

        if (matched) {
          try {
            const intercepted = await handler(event)
            if (intercepted !== false) {
              return true
            }
          } catch (err: any) {
            console.error(`[PluginManager] Error executing command in plugin "${plugin.meta.name}":`, err)
            await event.reply(`[插件异常] ${plugin.meta.name}: ${err?.message || err}`)
            return true
          }
        }
      }
    }
    return false
  }

  async dispatchMiddleware(phase: MiddlewarePhase, ctx: any): Promise<boolean> {
    for (const plugin of this.plugins.values()) {
      if (!plugin.meta.enabled) continue
      for (const item of plugin.middlewares) {
        if (item.phase === phase) {
          try {
            const result = await item.handler(ctx)
            if (result === false) return false
          } catch (err: any) {
            console.error(`[PluginManager] Middleware error in plugin "${plugin.meta.name}":`, err)
          }
        }
      }
    }
    return true
  }

  async triggerAction(
    pluginId: string,
    actionName: string,
    payload?: any
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`插件 "${pluginId}" 不存在`)
    }
    const handler = plugin.actions.get(actionName)
    if (!handler) {
      throw new Error(`插件 "${plugin.meta.name}" 未注册动作 "${actionName}"`)
    }
    const res = await handler(payload)
    if (res && typeof res === 'object' && 'success' in res) {
      return res
    }
    return { success: true, message: '执行成功', data: res }
  }
}
