import path from 'node:path'
import fs from 'node:fs'
import { Server } from 'node:http'
import { Application, Request, Response } from 'express'
import {
  createApp,
  Chaite,
  ChaiteResponse,
  GlobalConfig,
  FrontEndAuthHandler,
} from './core'
import { AppConfig, getConfig, saveConfig } from './config'
import { pluginManager } from './plugin'

const cwd = process.cwd()
const FRONTEND_DIR = fs.existsSync(path.resolve(cwd, 'web/build'))
  ? path.resolve(cwd, 'web/build')
  : (fs.existsSync(path.resolve(cwd, 'web/dist')) ? path.resolve(cwd, 'web/dist') : path.resolve(cwd, 'build'))

class CustomAuthHandler extends FrontEndAuthHandler {
  constructor(private staticToken?: string) {
    super()
  }

  override validateToken(token: string): boolean {
    if (this.staticToken && token === this.staticToken) {
      return true
    }
    return super.validateToken(token)
  }
}

export function startWebServer(config: AppConfig): { app: any; server: Server } {
  const globalConfig = new GlobalConfig()
  globalConfig.setHost(config.web.host)
  globalConfig.setPort(config.web.port)
  globalConfig.setAuthKey(config.web.adminToken || 'admin')
  Chaite.getInstance().setGlobalConfig(globalConfig)
  Chaite.getInstance().setFrontendAuthHandler(new CustomAuthHandler(config.web.adminToken))

  // Link Chaite custom config to runner config
  Chaite.getInstance().setGetConfig(async () => {
    const cur = getConfig()
    return {
      basic: {
        toggleMode: cur.chat.toggleMode === 'both' ? 'at' : cur.chat.toggleMode,
        commandPrefix: cur.chat.commandPrefix || '#',
        debug: false,
        enableAt: cur.chat.enableAt !== false,
        atPresetId: cur.chat.atPresetId || '',
      },
      management: {
        whiteGroups: (cur.management.whiteGroups || []).map(String),
        blackGroups: (cur.management.blackGroups || []).map(String),
        whiteUsers: (cur.management.whiteUsers || []).map(String),
        blackUsers: (cur.management.blackUsers || []).map(String),
        masterUsers: (cur.management.masterUsers || []).map(String),
        defaultRateLimit: 0,
      },
      llm: (() => {
        const l = { ...(cur.llm || {}) }
        delete (l as any).retainDynamicContextHistory
        delete (l as any).groupContextLength
        delete (l as any).groupContextTemplatePrefix
        delete (l as any).groupContextTemplateMessage
        delete (l as any).groupContextTemplateSuffix
        return l
      })(),
      groupContext: {
        enable: cur.llm?.enableGroupContext !== false,
        minMessages: cur.groupContext?.minMessages ?? 20,
        minTokens: cur.groupContext?.minTokens ?? 2000,
        maxMessages: cur.groupContext?.maxMessages ?? 100,
        maxTokens: cur.groupContext?.maxTokens ?? 10000,
        enableRichCards: cur.groupContext?.enableRichCards ?? true,
        enableForwardParse: cur.groupContext?.enableForwardParse ?? true,
        maxForwardMessages: cur.groupContext?.maxForwardMessages ?? 15,
      },
      bym: cur.bym || {},
      logging: cur.logging || { enabled: true, maxRecords: 500 },
      vision: cur.vision || { maxRecentImages: 3 },
      maintenance: {
        historyRetentionDays: cur.maintenance?.historyRetentionDays ?? 30,
        autoCleanImages: cur.maintenance?.autoCleanImages ?? true,
      },
      chaite: {
        storage: 'sql',
        db: { dialect: 'sqlite' },
      },
    } as any
  })

  Chaite.getInstance().setUpdateConfigCallback(async (newCfg: any) => {
    const cur = getConfig()
    if (newCfg.management) {
      const parseNums = (arr: any[]): number[] =>
        Array.from(new Set(arr.map(Number).filter((n): n is number => !Number.isNaN(n) && n > 0)))

      if (Array.isArray(newCfg.management.whiteGroups)) {
        cur.management.whiteGroups = parseNums(newCfg.management.whiteGroups)
      }
      if (Array.isArray(newCfg.management.blackGroups)) {
        cur.management.blackGroups = parseNums(newCfg.management.blackGroups)
      }
      if (Array.isArray(newCfg.management.whiteUsers)) {
        cur.management.whiteUsers = parseNums(newCfg.management.whiteUsers)
      }
      if (Array.isArray(newCfg.management.blackUsers)) {
        cur.management.blackUsers = parseNums(newCfg.management.blackUsers)
      }
      if (Array.isArray(newCfg.management.masterUsers)) {
        cur.management.masterUsers = parseNums(newCfg.management.masterUsers)
      }
    }
    if (newCfg.basic) {
      if (newCfg.basic.toggleMode) cur.chat.toggleMode = newCfg.basic.toggleMode
      if (newCfg.basic.commandPrefix !== undefined) cur.chat.commandPrefix = String(newCfg.basic.commandPrefix).trim() || '#'
      if (newCfg.basic.enableAt !== undefined) cur.chat.enableAt = Boolean(newCfg.basic.enableAt)
      if (newCfg.basic.atPresetId !== undefined) cur.chat.atPresetId = newCfg.basic.atPresetId
    }
    if (newCfg.llm) {
      const cleanedLlm = { ...newCfg.llm }
      delete cleanedLlm.retainDynamicContextHistory
      delete cleanedLlm.groupContextLength
      delete cleanedLlm.groupContextTemplatePrefix
      delete cleanedLlm.groupContextTemplateMessage
      delete cleanedLlm.groupContextTemplateSuffix
      cur.llm = { ...cur.llm, ...cleanedLlm }
      delete (cur.llm as any).retainDynamicContextHistory
      delete (cur.llm as any).groupContextLength
      delete (cur.llm as any).groupContextTemplatePrefix
      delete (cur.llm as any).groupContextTemplateMessage
      delete (cur.llm as any).groupContextTemplateSuffix
    }
    if (newCfg.groupContext) {
      cur.groupContext = {
        minMessages: Number(newCfg.groupContext.minMessages) || 20,
        minTokens: Number(newCfg.groupContext.minTokens) || 2000,
        maxMessages: Number(newCfg.groupContext.maxMessages) || 100,
        maxTokens: Number(newCfg.groupContext.maxTokens) || 10000,
        enableRichCards: newCfg.groupContext.enableRichCards !== false,
        enableForwardParse: newCfg.groupContext.enableForwardParse !== false,
        maxForwardMessages: Number(newCfg.groupContext.maxForwardMessages) || 15,
      }
      if (newCfg.groupContext.enable !== undefined) {
        if (!cur.llm) cur.llm = {} as any
        cur.llm.enableGroupContext = Boolean(newCfg.groupContext.enable)
      }
    }
    if (newCfg.bym) {
      cur.bym = { ...cur.bym, ...newCfg.bym }
    }
    if (newCfg.logging) {
      cur.logging = { ...cur.logging, ...newCfg.logging }
    }
    if (newCfg.vision) {
      cur.vision = { ...cur.vision, ...newCfg.vision }
    }
    if (newCfg.maintenance) {
      cur.maintenance = {
        historyRetentionDays: Number(newCfg.maintenance.historyRetentionDays) || 0,
        autoCleanImages: newCfg.maintenance.autoCleanImages !== false,
      }
    }
    saveConfig(cur)
    console.log('[Server] Saved updated configuration from web dashboard:', {
      whiteGroups: cur.management.whiteGroups,
      llm: cur.llm,
      bym: cur.bym,
      logging: cur.logging,
      vision: cur.vision,
      maintenance: cur.maintenance,
    })
    return newCfg
  })

  const app = createApp(
    (expressApp: any) => {
      // Memory simple-extension fallback status route (avoids 404 alert on WebUI)
      expressApp.get('/api/memory/extensions/simple/status', (_req: any, res: any) => {
        res.status(200).json(
          ChaiteResponse.ok({
            enabled: false,
            platform: process.platform,
            arch: process.arch,
            libraryPath: '',
            dictPath: '',
            libraryExists: false,
            dictExists: false,
          })
        )
      })

      expressApp.post('/api/memory/extensions/simple/download', (_req: any, res: any) => {
        res.status(200).json(ChaiteResponse.ok({}))
      })

      // Plugin Management API
      expressApp.get('/api/plugins', (_req: any, res: any) => {
        const list = pluginManager.getPlugins()
        res.status(200).json(ChaiteResponse.ok(list))
      })

      expressApp.post('/api/plugins/:id/toggle', async (req: any, res: any) => {
        const { id } = req.params
        const { enabled } = req.body || {}
        const ok = await pluginManager.togglePlugin(id, Boolean(enabled))
        res.status(200).json(ok ? ChaiteResponse.ok({ success: true }) : ChaiteResponse.fail(null, 'Plugin not found'))
      })

      expressApp.post('/api/plugins/:id/config', async (req: any, res: any) => {
        const { id } = req.params
        const config = req.body?.config !== undefined ? req.body.config : req.body || {}
        const ok = await pluginManager.updatePluginConfig(id, config)
        res.status(200).json(ok ? ChaiteResponse.ok({ success: true }) : ChaiteResponse.fail(null, 'Plugin not found'))
      })

      expressApp.get('/api/plugins/:id/code', (req: any, res: any) => {
        const { id } = req.params
        const code = pluginManager.getPluginCode(id)
        if (code === null) {
          return res.status(404).json(ChaiteResponse.fail(null, 'Single-file plugin not found'))
        }
        res.status(200).json(ChaiteResponse.ok({ code }))
      })

      expressApp.post('/api/plugins/:id/code', async (req: any, res: any) => {
        const { id } = req.params
        const { code } = req.body || {}
        if (typeof code !== 'string') {
          return res.status(400).json(ChaiteResponse.fail(null, 'Code must be string'))
        }
        const ok = await pluginManager.savePluginCode(id, code)
        res.status(200).json(ok ? ChaiteResponse.ok({ success: true }) : ChaiteResponse.fail(null, 'Failed to save plugin'))
      })

      expressApp.post('/api/plugins/:id/reload', async (req: any, res: any) => {
        const { id } = req.params
        const ok = await pluginManager.reloadPlugin(id)
        res.status(200).json(ok ? ChaiteResponse.ok({ success: true }) : ChaiteResponse.fail(null, 'Plugin not found'))
      })

      // 导出插件
      expressApp.get('/api/plugins/:id/export', async (req: any, res: any) => {
        try {
          const { id } = req.params
          const includeConfig = req.query.includeConfig !== 'false'
          const format = req.query.format === 'raw' ? 'raw' : 'zip'
          const { filename, buffer } = await pluginManager.exportPlugin(id, includeConfig, format)

          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
          res.setHeader('Content-Type', format === 'raw' ? 'text/javascript' : 'application/zip')
          res.send(buffer)
        } catch (err: any) {
          res.status(500).json(ChaiteResponse.fail(null, err?.message || '导出失败'))
        }
      })

      // 导入插件
      expressApp.post('/api/plugins/import', async (req: any, res: any) => {
        try {
          const { type, filename, base64 } = req.body || {}
          if (!filename || !base64) {
            return res.status(400).json(ChaiteResponse.fail(null, '缺少文件数据'))
          }
          const buf = Buffer.from(base64, 'base64')
          const pluginId = await pluginManager.importPlugin(type || 'single-file', filename, buf)
          res.status(200).json(ChaiteResponse.ok({ id: pluginId }))
        } catch (err: any) {
          res.status(500).json(ChaiteResponse.fail(null, err?.message || '导入失败'))
        }
      })

      // Enhanced login route: supports configured adminToken as well as dynamic tokens
      expressApp.post('/api/auth/login', async (req: any, res: any) => {
        const body = req.body || {}
        const inputToken = String(body.token || '').trim()
        const expectedToken = getConfig().web.adminToken
        const authHandler = Chaite.getInstance().getFrontendAuthHandler()

        const isDynamicValid = authHandler ? authHandler.validateToken(inputToken) : false
        const isStaticValid = expectedToken && inputToken === expectedToken

        if (isStaticValid || isDynamicValid) {
          const authKey = globalConfig.getAuthKey() || 'chaite-key'
          const token = FrontEndAuthHandler.generateJWT(authKey)
          res.status(200).json(
            ChaiteResponse.ok({
              token,
              expiresIn: 7 * 24 * 60 * 60,
            })
          )
        } else {
          res.status(401).json(ChaiteResponse.fail(null, 'Invalid admin token'))
        }
      })
    },
    { frontendDir: FRONTEND_DIR }
  )

  const server = app.listen(config.web.port, config.web.host, () => {
    console.log(`[Server] Chaite Web Dashboard running at http://${config.web.host}:${config.web.port}`)
    console.log(`[Server] Admin Token: "${config.web.adminToken}"`)
  })

  return { app, server }
}
