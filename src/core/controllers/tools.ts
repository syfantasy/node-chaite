import express, { Router, Request, Response } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { Chaite, ChaiteContext, ChaiteResponse, ToolDTO, Filter, SearchOption } from '../index.js'
import { asyncLocalStorage, extractClassName } from '../utils/index.js'

const router: Router = express.Router()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findPluginTool(id: string): { plugin: any; tool: any } | null {
  if (!id || !id.startsWith('plugin:')) return null
  const parts = id.split(':')
  const pluginId = parts[1]
  const toolName = parts[2]
  try {
    const gPluginMgr = (globalThis as any).chaitePluginManager
    if (!gPluginMgr) return null
    const plugin = (gPluginMgr as any).plugins?.get(pluginId)
    if (!plugin) return null
    const tool = (plugin.tools || []).find((t: any) => t.name === toolName)
    if (!tool) return null
    return { plugin, tool }
  } catch {
    return null
  }
}

function paginate<T>(items: T[], req: Request) {
  const page = Math.max(1, parseInt(req.query['page'] as string) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query['pageSize'] as string) || 20))
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize }
}

async function wrap(res: Response, fn: () => Promise<unknown>) {
  try {
    const data = await fn()
    if (!res.headersSent) res.status(200).json(ChaiteResponse.ok(data))
  } catch (e) {
    if (!res.headersSent) {
      Chaite.getInstance().getLogger().error(e as object)
      res.status(500).json(ChaiteResponse.fail(null, e instanceof Error ? e.message : 'Unknown error'))
    }
  }
}

// ─── Local CRUD ───────────────────────────────────────────────────────────────

/** GET /api/tools/list?name=xxx&page=1&pageSize=20 */
router.get('/list', (req: Request, res: Response) => {
  wrap(res, async () => {
    let items = await Chaite.getInstance().getToolsManager().listInstances()

    // 聚合插件注册的工具
    try {
      const gPluginMgr = (globalThis as any).chaitePluginManager
      if (gPluginMgr && typeof gPluginMgr.getPlugins === 'function') {
        const plugins = gPluginMgr.getPlugins()
        for (const p of plugins) {
          const loaded = (gPluginMgr as any).plugins?.get(p.id)
          if (loaded && Array.isArray(loaded.tools)) {
            for (const t of loaded.tools) {
              items.push({
                id: `plugin:${p.id}:${t.name}`,
                name: t.name,
                description: t.description || t.function?.description || '',
                parameters: t.parameters || t.function?.parameters || null,
                code: '// 插件注册工具，代码位于插件目录内部',
                config: t.config || loaded.config || {},
                pluginId: p.id,
                pluginName: p.name || p.id,
                isPluginTool: true,
                status: 'enabled',
                createdAt: (p as any).createdAt || 0,
                updatedAt: (p as any).updatedAt || 0,
              } as any)
            }
          }
        }
      }
    } catch {}

    const name = req.query['name'] as string | undefined
    if (name) {
      const kw = name.toLowerCase()
      items = items.filter(t => t.name.toLowerCase().includes(kw) || (t as any).pluginName?.toLowerCase().includes(kw) || (t.description || '').toLowerCase().includes(kw))
    }
    const toolType = req.query['toolType'] as string | undefined
    if (toolType === 'local') {
      items = items.filter(t => !(t as any).isPluginTool)
    } else if (toolType === 'plugin') {
      items = items.filter(t => Boolean((t as any).isPluginTool))
    }
    return paginate(items, req)
  })
})

/** GET /api/tools/:id/test-schema — schema from the actually loaded tool instance. */
router.get('/:id/test-schema', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const pluginTarget = findPluginTool(req.params.id)
    if (pluginTarget) {
      const tool = pluginTarget.tool
      return { name: tool.function.name, description: tool.function.description, parameters: tool.function.parameters }
    }

    const mgr = Chaite.getInstance().getToolsManager()
    const dto = await mgr.getInstanceT(req.params.id)
    if (!dto) throw new Error('Tool not found')
    const tool = (await mgr.getInstance(dto.name)) || (await mgr.getInstance(extractClassName(dto.code || '') || ''))
    if (!tool) throw new Error(`工具“${dto.name}”尚未被运行时加载，请保存后稍候再试`)
    return { name: tool.function.name, description: tool.function.description, parameters: tool.function.parameters }
  })
})

function resolveToolConfigPath(toolName: string): { dir: string; filePath: string } {
  const cwd = process.cwd()
  // 1. 已知特定工具路径 (如网易云工具组)
  if (toolName === 'searchNetease' || toolName === 'sendNetease') {
    const dir = path.join(cwd, 'data', 'netease_music_tool')
    return { dir, filePath: path.join(dir, 'config.json') }
  }
  // 2. data/<toolName>/config.json 存在则优先使用
  const specificDir = path.join(cwd, 'data', toolName)
  const specificFile = path.join(specificDir, 'config.json')
  if (fs.existsSync(specificFile)) {
    return { dir: specificDir, filePath: specificFile }
  }
  // 3. 默认通用路径 data/tools_config/<toolName>.json
  const defaultDir = path.join(cwd, 'data', 'tools_config')
  return { dir: defaultDir, filePath: path.join(defaultDir, `${toolName}.json`) }
}

/** GET /api/tools/:id/config — 获取工具独立的配置文件 */
router.get('/:id/config', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const pluginTarget = findPluginTool(req.params.id)
    if (pluginTarget) {
      const { plugin, tool } = pluginTarget
      const pName = plugin.meta?.name || plugin.id
      // 将 schema 数组转换为映射对象供前端快速检索
      let schemaObj: Record<string, any> = {}
      if (Array.isArray(plugin.meta?.configSchema)) {
        for (const item of plugin.meta.configSchema) {
          if (item?.key) {
            schemaObj[item.key] = item
          }
        }
      } else if (plugin.meta?.configSchema && typeof plugin.meta.configSchema === 'object') {
        schemaObj = plugin.meta.configSchema
      }
      return {
        filePath: `plugins/apps/${plugin.id}/config.json`,
        rawText: JSON.stringify(plugin.config || tool.config || {}, null, 2),
        config: plugin.config || tool.config || {},
        schema: (tool as any)?.configSchema || schemaObj,
        managedByPlugin: pName,
        pluginId: plugin.id,
        toolMeta: {
          name: tool.name,
          description: tool.description || tool.function?.description || '',
          parameters: tool.parameters || tool.function?.parameters || null,
        },
      }
    }

    const mgr = Chaite.getInstance().getToolsManager()
    const dto = await mgr.getInstanceT(req.params.id)
    if (!dto) throw new Error('Tool not found')
    const { dir, filePath } = resolveToolConfigPath(dto.name)
    let rawText = ''
    let config: any = null
    if (fs.existsSync(filePath)) {
      rawText = fs.readFileSync(filePath, 'utf-8')
      try {
        config = JSON.parse(rawText)
      } catch {
        config = null
      }
    } else {
      config = dto.config || (dto.extraData as any)?.config || {}
      rawText = JSON.stringify(config, null, 2)
    }
    const relativePath = path.relative(process.cwd(), filePath)

    // 读取工具实例上的 configSchema
    let schema: any = null
    let managedByPlugin: string | null = null
    try {
      const tool = (await mgr.getInstance(dto.name)) || (await mgr.getInstance(extractClassName(dto.code || '') || ''))
      schema = (tool as any)?.configSchema || (dto as any)?.configSchema || null
    } catch {
      schema = null
    }

    // 探测是否由插件统一托管
    try {
      const gPluginMgr = (globalThis as any).chaitePluginManager
      if (gPluginMgr && typeof gPluginMgr.getAllTools === 'function') {
        const plugins = gPluginMgr.getPlugins ? gPluginMgr.getPlugins() : []
        for (const p of plugins) {
          const loaded = (gPluginMgr as any).plugins?.get(p.id)
          if (loaded && Array.isArray(loaded.tools) && loaded.tools.some((t: any) => t?.name === dto.name)) {
            managedByPlugin = p.name || p.id
            break
          }
        }
      }
    } catch {}

    return { filePath: relativePath, rawText, config, schema, managedByPlugin }
  })
})

/** POST /api/tools/:id/config — 保存工具独立的配置文件 */
router.post('/:id/config', (req: Request<{ id: string }, object, { rawText?: string; config?: any }>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getToolsManager()
    const dto = await mgr.getInstanceT(req.params.id)
    if (!dto) throw new Error('Tool not found')

    // 插件托管拦截
    try {
      const gPluginMgr = (globalThis as any).chaitePluginManager
      if (gPluginMgr && typeof gPluginMgr.getAllTools === 'function') {
        const plugins = gPluginMgr.getPlugins ? gPluginMgr.getPlugins() : []
        for (const p of plugins) {
          const loaded = (gPluginMgr as any).plugins?.get(p.id)
          if (loaded && Array.isArray(loaded.tools) && loaded.tools.some((t: any) => t?.name === dto.name)) {
            throw new Error(`该工具由插件【${p.name || p.id}】统一托管，请前往【插件管理】修改配置`)
          }
        }
      }
    } catch (e: any) {
      if (e.message?.includes('统一托管')) throw e
    }

    const { dir, filePath } = resolveToolConfigPath(dto.name)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    let textToSave = req.body.rawText
    let parsedConfig = req.body.config
    if (textToSave != null) {
      try {
        parsedConfig = JSON.parse(textToSave)
        textToSave = JSON.stringify(parsedConfig, null, 2)
      } catch (err: any) {
        throw new Error(`JSON 格式错误: ${err?.message || err}`)
      }
    } else if (parsedConfig != null) {
      textToSave = JSON.stringify(parsedConfig, null, 2)
    } else {
      textToSave = '{}'
      parsedConfig = {}
    }
    fs.writeFileSync(filePath, textToSave, 'utf-8')

    // 同步更新数据库内 tool.config 以及内存中的 live 实例
    dto.config = parsedConfig
    await mgr.upsertInstanceT(dto)
    try {
      const tool = (await mgr.getInstance(dto.name)) || (await mgr.getInstance(extractClassName(dto.code || '') || ''))
      if (tool) {
        ;(tool as any).config = parsedConfig
      }
    } catch {
      // ignore
    }

    const relativePath = path.relative(process.cwd(), filePath)
    return { success: true, filePath: relativePath, config: parsedConfig, rawText: textToSave }
  })
})

/** POST /api/tools/:id/test — execute through the live Chaite/plugin runtime. */
router.post('/:id/test', (req: Request<{ id: string }, object, { args?: Record<string, unknown>; userId?: string; groupId?: string }>, res: Response) => {
  wrap(res, async () => {
    const chaite = Chaite.getInstance()
    const pluginTarget = findPluginTool(req.params.id)
    let tool: any = null
    let toolConfig: any = {}

    if (pluginTarget) {
      tool = pluginTarget.tool
      toolConfig = pluginTarget.plugin.config || tool.config || {}
      tool.config = toolConfig
    } else {
      const mgr = chaite.getToolsManager()
      const dto = await mgr.getInstanceT(req.params.id)
      if (!dto) throw new Error('Tool not found')
      const toolInstance = (await mgr.getInstance(dto.name)) || (await mgr.getInstance(extractClassName(dto.code || '') || ''))
      if (!toolInstance) throw new Error(`工具“${dto.name}”尚未被运行时加载`)
      toolConfig = dto.config || (dto.extraData as any)?.config || {}
      ;(toolInstance as any).config = toolConfig
      tool = toolInstance
    }

    const context = new ChaiteContext(chaite.getLogger())
    context.setChaite(chaite)
    ;(context as any).toolConfig = toolConfig
    context.setEvent({
      sender: { user_id: req.body.userId || 'console-test', nickname: 'Console Test' },
      group: req.body.groupId ? { group_id: req.body.groupId } : undefined,
      raw_message: '[管理面板工具测试]',
    } as any)
    const startedAt = Date.now()
    const result = await asyncLocalStorage.run(context, () => tool.run((req.body.args || {}) as any, context))
    return { result: typeof result === 'string' ? result : JSON.stringify(result), durationMs: Date.now() - startedAt }
  })
})

/** POST /api/tools — create (no id) or update (with id in body) */
router.post('/', async (req: Request<object, object, ToolDTO>, res: Response) => {
  wrap(res, async () => {
    const body = req.body
    const mgr = Chaite.getInstance().getToolsManager()
    if (body.id) {
      const old = await mgr.getInstanceT(body.id)
      if (!old) { res.status(404).json(ChaiteResponse.fail(null, 'Tool not found')); return null }
      if (old.name !== body.name) await mgr.renameFile(body.id, old.name, body.name)
    }
    const id = await mgr.addInstance(body)
    body.id = id
    return body
  })
})

/** PUT /api/tools/:id — full update */
router.put('/:id', async (req: Request<{ id: string }, object, ToolDTO>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getToolsManager()
    const old = await mgr.getInstanceT(req.params.id)
    if (!old) { res.status(404).json(ChaiteResponse.fail(null, 'Tool not found')); return null }
    const body = Object.assign(req.body, { id: req.params.id })
    if (old.name !== body.name) await mgr.renameFile(req.params.id, old.name, body.name)
    const id = await mgr.addInstance(body)
    return { ...body, id }
  })
})

/** GET /api/tools/:id */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const pluginTarget = findPluginTool(req.params.id)
    if (pluginTarget) {
      const { plugin, tool } = pluginTarget
      return {
        id: req.params.id,
        name: tool.name,
        description: tool.description || tool.function?.description || '',
        parameters: tool.parameters || tool.function?.parameters || null,
        code: '// 插件注册工具，代码位于插件目录内部',
        config: tool.config || plugin.config || {},
        pluginId: plugin.id,
        pluginName: plugin.meta?.name || plugin.id,
        isPluginTool: true,
        createdAt: 0,
        updatedAt: 0,
      }
    }

    const tool = await Chaite.getInstance().getToolsManager().getInstanceT(req.params.id)
    if (!tool) { res.status(404).json(ChaiteResponse.fail(null, 'Tool not found')); return null }
    return tool
  })
})

/** DELETE /api/tools/:id */
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getToolsManager()
    const existing = await mgr.getInstanceT(req.params.id)
    if (!existing) { res.status(404).json(ChaiteResponse.fail(null, 'Tool not found')); return null }
    await mgr.deleteInstance(req.params.id)
    return { deleted: true }
  })
})

// ─── Cloud sync ───────────────────────────────────────────────────────────────

router.post('/upload', (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getToolsManager().shareToCloud(req.body.id))
})

router.post('/download', async (req: Request<object, object, { id: string }>, res: Response) => {
  wrap(res, async () => {
    const manager = Chaite.getInstance().getToolsManager()
    const tool = await manager.getFromCloud(req.body.id)
    if (!tool) { res.status(404).json(ChaiteResponse.fail(null, 'Tool not found in cloud')); return null }
    tool.cloudId = tool.id
    const existing = await manager.getInstanceTByCloudId(tool.cloudId)
    if (existing.length > 0) {
      if (existing[0].code === tool.code) { res.status(400).json(ChaiteResponse.fail(null, '工具已是最新版本')); return null }
      tool.id = existing[0].id
    } else {
      tool.id = ''
    }
    const id = await manager.upsertInstanceT(tool)
    return { ...tool, id }
  })
})

router.post('/list-cloud', (req: Request<object, object, { filter?: Filter; options?: SearchOption; query: string }>, res: Response) => {
  wrap(res, () => Chaite.getInstance().getToolsManager().listFromCloud(req.body.filter || {}, req.body.query, req.body.options || {}))
})

export default router
