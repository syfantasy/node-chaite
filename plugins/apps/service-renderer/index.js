import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const execAsync = promisify(exec)

/**
 * Chaite 渲染服务插件 (Service Provider Plugin)
 * 为全系统其他插件提供高性能 HTML/卡片/URL 截图能力
 */
export default async function setup(ctx) {
  const logger = ctx.logger
  let browserInstance = null

  const getCfg = () => ({
    driver: 'shotium',
    puppeteerWsEndpoint: '',
    format: 'png',
    deviceScaleFactor: 2,
    ...(ctx.config || {}),
  })

  // 依赖安装/卸载命令辅助器
  async function runNpm(args) {
    const registry = 'https://registry.npmmirror.com'
    const cmd = `npm ${args} --registry=${registry}`
    const cwd = ctx.pluginDir || process.cwd()
    logger.info(`[ServiceRenderer] 执行命令: ${cmd} (目录: ${cwd})`)
    const { stdout, stderr } = await execAsync(cmd, { cwd, timeout: 180000 })
    return stdout || stderr
  }

  // 1. 注册控制台按钮动作 (Actions)
  ctx.registerAction('installShotium', async () => {
    logger.info('开始一键安装 @pixel.js/shotium 原生渲染引擎...')
    try {
      const output = await runNpm('install --save @pixel.js/shotium')
      return { success: true, message: '🎉 Shotium 渲染引擎安装成功！即刻畅享超清秒级出图。' }
    } catch (err) {
      logger.error('安装 Shotium 失败:', err)
      return { success: false, message: `安装失败: ${err.message}` }
    }
  })

  ctx.registerAction('uninstallShotium', async () => {
    logger.info('开始卸载 @pixel.js/shotium...')
    try {
      await runNpm('uninstall @pixel.js/shotium')
      return { success: true, message: '🗑️ 已成功卸载 Shotium 引擎。' }
    } catch (err) {
      return { success: false, message: `卸载失败: ${err.message}` }
    }
  })

  ctx.registerAction('installPuppeteer', async () => {
    logger.info('开始一键安装 puppeteer-core...')
    try {
      await runNpm('install --save puppeteer-core')
      return { success: true, message: '🎉 puppeteer-core 安装成功！' }
    } catch (err) {
      return { success: false, message: `安装失败: ${err.message}` }
    }
  })

  ctx.registerAction('uninstallPuppeteer', async () => {
    logger.info('开始卸载 puppeteer-core...')
    try {
      await runNpm('uninstall puppeteer-core')
      return { success: true, message: '🗑️ 已成功卸载 puppeteer-core。' }
    } catch (err) {
      return { success: false, message: `卸载失败: ${err.message}` }
    }
  })

  // 2. Shotium 原生引擎渲染实现
  async function renderViaShotium(options, cfg) {
    let shotiumModule = null
    try {
      shotiumModule = await import('@pixel.js/shotium')
    } catch (err) {
      throw new Error(
        '未检测到本地 Shotium 引擎 (@pixel.js/shotium)！\n请前往 Web 控制台 [插件管理] -> [渲染服务] -> 点击【📦 一键安装 Shotium】按钮'
      )
    }

    const { screenshot } = shotiumModule
    const type = options.format || cfg.format || 'png'
    const scale = options.deviceScaleFactor || cfg.deviceScaleFactor || 2

    // 内存 HTML 转写为本地临时文件进行无损渲染
    let tmpFile = null
    let targetFile = options.url || ''

    if (options.html) {
      const tmpDir = path.join(os.tmpdir(), 'chaite-render')
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true })
      }
      tmpFile = path.join(tmpDir, `render_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.html`)
      fs.writeFileSync(tmpFile, options.html, 'utf-8')
      targetFile = tmpFile
    }

    if (!targetFile) {
      throw new Error('渲染请求缺少 html 或 url 参数')
    }

    try {
      const result = await screenshot({
        file: targetFile,
        type: type === 'jpeg' ? 'jpeg' : type === 'webp' ? 'webp' : 'png',
        scale,
        fullPage: options.fullPage !== false,
        selector: options.selector,
        allowFileAccess: true,
        viewport: options.viewport || { width: 800, height: 600 },
      })

      if (!result?.image) {
        throw new Error('Shotium 渲染未生成有效图像流')
      }

      return result.image
    } finally {
      if (tmpFile && fs.existsSync(tmpFile)) {
        fs.unlink(tmpFile, () => {})
      }
    }
  }

  // 3. Puppeteer 驱动实现
  async function renderViaPuppeteer(options, cfg) {
    let puppeteer = null
    try {
      puppeteer = (await import('puppeteer')).default || (await import('puppeteer'))
    } catch {
      try {
        puppeteer = (await import('puppeteer-core')).default || (await import('puppeteer-core'))
      } catch {
        throw new Error('未检测到本地 puppeteer-core 依赖，请在插件配置中点击【📦 一键安装 Puppeteer-core】')
      }
    }

    if (!browserInstance) {
      if (cfg.puppeteerWsEndpoint) {
        browserInstance = await puppeteer.connect({
          browserWSEndpoint: cfg.puppeteerWsEndpoint,
        })
      } else {
        browserInstance = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
        })
      }
    }

    const page = await browserInstance.newPage()
    try {
      const vp = options.viewport || { width: 800, height: 600 }
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: options.deviceScaleFactor || cfg.deviceScaleFactor || 2,
      })

      if (options.html) {
        await page.setContent(options.html, { waitUntil: 'networkidle0' })
      } else if (options.url) {
        await page.goto(options.url, { waitUntil: 'networkidle0' })
      } else {
        throw new Error('必须指定 html 或 url 渲染内容')
      }

      const clipElement = options.selector ? await page.$(options.selector) : null
      const screenshotTarget = clipElement || page
      const buf = await screenshotTarget.screenshot({
        type: options.format || cfg.format || 'png',
        quality: options.format === 'jpeg' ? (options.quality || 90) : undefined,
        encoding: 'binary',
      })
      return Buffer.from(buf)
    } finally {
      await page.close().catch(() => {})
    }
  }

  // 4. 注册统一渲染器到系统
  const rendererService = {
    render: async (options) => {
      const cfg = getCfg()
      if (cfg.driver === 'disabled') {
        throw new Error('当前系统渲染服务已配置为禁用状态')
      }

      if (cfg.driver === 'shotium') {
        return renderViaShotium(options, cfg)
      }

      if (cfg.driver === 'puppeteer') {
        return renderViaPuppeteer(options, cfg)
      }

      throw new Error(`未知的渲染驱动引擎: ${cfg.driver}`)
    },
  }

  // 向 Chaite 平台服务总线注册
  ctx.registerRenderer(rendererService)
  ctx.registerService('renderer', rendererService)
  logger.info(`渲染服务提供者已就绪，当前后端驱动: ${getCfg().driver}`)

  // 资源清理钩子
  ctx.onDestroy(async () => {
    if (browserInstance) {
      logger.info('正在关闭 Puppeteer 浏览器实例...')
      await browserInstance.close().catch(() => {})
      browserInstance = null
    }
  })

  // 指令：测试渲染服务状态
  ctx.registerCommand(/^#?(渲染测试|测试渲染)$/i, async (e) => {
    const cfg = getCfg()
    await e.reply(`正在测试渲染后端 (${cfg.driver})，请稍候...`)
    try {
      const testHtml = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, sans-serif; background: #0f172a; color: white; padding: 40px; border-radius: 16px; width: 420px; box-sizing: border-box;">
            <h2 style="margin: 0 0 10px; color: #38bdf8;">✨ Chaite 渲染服务测试</h2>
            <p style="color: #94a3b8; margin: 0 0 20px;">当前驱动模式: <b>${cfg.driver}</b></p>
            <div style="background: rgba(255,255,255,0.08); padding: 16px; border-radius: 8px; line-height: 1.6;">
              系统时间: ${new Date().toLocaleString()}<br/>
              渲染后端: <b>${cfg.driver === 'shotium' ? 'Shotium 原生 Blink 引擎' : cfg.driver}</b><br/>
              状态: 正常在线 (Ready)
            </div>
          </body>
        </html>
      `
      const result = await ctx.render({ html: testHtml })
      const base64 = Buffer.isBuffer(result) ? result.toString('base64') : String(result)

      await e.reply({
        text: `✅ 渲染服务正常运行 (驱动: ${cfg.driver})`,
        images: [`base64://${base64}`],
      })
    } catch (err) {
      await e.reply(`❌ 渲染测试失败: ${err.message}`)
    }
  })
}
