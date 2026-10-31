import express, { Router, Request, Response } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { Chaite, ChaiteContext, ChaiteResponse, ToolDTO, Filter, SearchOption } from '../index.js'
import { asyncLocalStorage, extractClassName } from '../utils/index.js'

const router: Router = express.Router()

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    const name = req.query['name'] as string | undefined
    if (name) items = items.filter(t => t.name.includes(name))
    return paginate(items, req)
  })
})

/** GET /api/tools/:id/test-schema — schema from the actually loaded tool instance. */
router.get('/:id/test-schema', (req: Request<{ id: string }>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getToolsManager()
    const dto = await mgr.getInstanceT(req.params.id)
    if (!dto) throw new Error('Tool not found')
    const instanceName = extractClassName(dto.code || '') || dto.name
    const tool = instanceName ? await mgr.getInstance(instanceName) : undefined
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
    return { filePath: relativePath, rawText, config }
  })
})

/** POST /api/tools/:id/config — 保存工具独立的配置文件 */
router.post('/:id/config', (req: Request<{ id: string }, object, { rawText?: string; config?: any }>, res: Response) => {
  wrap(res, async () => {
    const mgr = Chaite.getInstance().getToolsManager()
    const dto = await mgr.getInstanceT(req.params.id)
    if (!dto) throw new Error('Tool not found')
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

    // 同步更新数据库内 tool.config
    dto.config = parsedConfig
    await mgr.upsertInstanceT(dto)

    const relativePath = path.relative(process.cwd(), filePath)
    return { success: true, filePath: relativePath, config: parsedConfig, rawText: textToSave }
  })
})

/** POST /api/tools/:id/test — execute through the live Chaite/plugin runtime. */
router.post('/:id/test', (req: Request<{ id: string }, object, { args?: Record<string, unknown>; userId?: string; groupId?: string }>, res: Response) => {
  wrap(res, async () => {
    const chaite = Chaite.getInstance()
    const mgr = chaite.getToolsManager()
    const dto = await mgr.getInstanceT(req.params.id)
    if (!dto) throw new Error('Tool not found')
    const instanceName = extractClassName(dto.code || '') || dto.name
    const tool = instanceName ? await mgr.getInstance(instanceName) : undefined
    if (!tool) throw new Error(`工具“${dto.name}”尚未被运行时加载`)
    const toolConfig = dto.config || (dto.extraData as any)?.config || {}
    ;(tool as any).config = toolConfig

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
