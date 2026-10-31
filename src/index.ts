import { loadConfig, getConfig, saveConfig } from './config.js'
import { matchChaiteCommand, buildHelpText } from './commands.js'
import { initChaiteStorage } from './storage.js'
import { startWebServer } from './server.js'
import { checkPermission, getEffectiveMasters, banTarget, unbanTarget, parseDuration } from './guard.js'
import { oneBotToUserMessage, formatModelResponse } from './onebot/message.js'
import { OneBotMessageEvent } from './onebot/types.js'
import { groupHistoryBuffer, groupMessageRefStore } from './context/groupHistoryBuffer.js'
import { mediaRefStore } from './onebot/refStore.js'
import { pluginManager, ChaiteEvent } from './plugin/index.js'
import { Chaite, EventMessage, SendMessageOption, drivers, TextContent, ImageContent, ChaiteContext } from './core/index.js'

async function bootstrapOnce() {
  console.log('==============================================')
  console.log('🚀 Starting Chaite')
  console.log('==============================================')

  const config = loadConfig()
  console.log(`[Config] Allowed Groups (Whitelist): [${config.management.whiteGroups.join(', ')}]`)

  // 1. Initialize SQLite Database & Chaite Subsystems
  const storageCtx = await initChaiteStorage()
  ;(globalThis as any).chaiteStorageCtx = storageCtx
  pluginManager.setDriver(storageCtx.mainDriver)
  ;(globalThis as any).mediaRefStore = mediaRefStore

  // 1.1 Register Core Message Pipeline (AI conversation & system commands)
  pluginManager.setMessagePipelineHandler(async (event: ChaiteEvent) => {
    try {
      await handleMessage(event, storageCtx)
    } catch (err: any) {
      console.error('[Runner] Error handling pipeline message:', err)
    }
  })

  // 1.2 Load all plugins (adapter-onebot, sample-bot, echo, etc.)
  await pluginManager.loadAll()

  // 2. Start Web Dashboard
  const { server } = startWebServer(config)

  // 3. Start periodic history & image maintenance
  const runMaintenanceJob = async () => {
    try {
      const curCfg = getConfig()
      const retentionDays = curCfg.maintenance?.historyRetentionDays ?? 30
      const autoCleanImages = curCfg.maintenance?.autoCleanImages !== false

      if (retentionDays > 0) {
        const before = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString()
        const pruneRes = await storageCtx.historyStorage.pruneHistory({ before })
        let imgCleanRes = { deleted: 0, total: 0 }
        if (autoCleanImages) {
          imgCleanRes = await storageCtx.historyStorage.cleanupUnusedImages()
        }
        if (pruneRes.deleted > 0 || imgCleanRes.deleted > 0) {
          console.log(`[Maintenance] Auto-cleanup: pruned ${pruneRes.deleted} expired message(s), unlinked ${imgCleanRes.deleted} unused image(s).`)
        }
      } else if (autoCleanImages) {
        const imgCleanRes = await storageCtx.historyStorage.cleanupUnusedImages()
        if (imgCleanRes.deleted > 0) {
          console.log(`[Maintenance] Auto-cleanup: unlinked ${imgCleanRes.deleted} unused image(s).`)
        }
      }
    } catch (err: any) {
      console.warn('[Maintenance] Auto maintenance task encountered error:', err?.message || err)
    }
  }

  // Initial check after 30 seconds, then repeat every 24 hours
  const maintenanceTimer = setTimeout(runMaintenanceJob, 30_000)
  const maintenanceInterval = setInterval(runMaintenanceJob, 24 * 60 * 60 * 1000)

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[Runner] Shutting down...')
    clearTimeout(maintenanceTimer)
    clearInterval(maintenanceInterval)
    server.close()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

async function isModelVisualCapable(preset: any): Promise<boolean> {
  try {
    const rawSpec = preset?.sendMessageOption?.model
    if (!rawSpec) return false

    let modelName = rawSpec
    let channelIdent = ''
    if (rawSpec.includes('/')) {
      const slashIdx = rawSpec.indexOf('/')
      channelIdent = rawSpec.slice(0, slashIdx).trim()
      modelName = rawSpec.slice(slashIdx + 1).trim()
    }

    const chaite = Chaite.getInstance()
    const channelsManager = chaite?.getChannelsManager?.()
    if (!channelsManager) return false

    let channel: any = undefined
    if (channelIdent) {
      const allChannels = await channelsManager.listInstances()
      channel = allChannels.find((c: any) => c.name === channelIdent || c.id === channelIdent)
    }

    if (!channel && channelsManager.getChannelByModel) {
      const channels = await channelsManager.getChannelByModel(modelName)
      channel = channels?.find((c: any) => c.status === 'enabled') || channels?.[0]
    }

    if (!channel) return false

    const features =
      (channel as any).getOptionsForModel?.(modelName)?.features ||
      (channel as any).models?.find((m: any) => m.name === modelName)?.features ||
      []
    return Array.isArray(features) && features.includes('visual')
  } catch (err: any) {
    console.warn('[Runner] Failed to check visual capability:', err.message)
    return false
  }
}

/**
 * 把本轮请求实际携带的对话消息渲染成操作日志用的 <chat_history> 区块。
 *
 * 只用于日志展示，不参与真实请求：模型看到的仍然是被注入过群聊上下文的原始
 * 消息数组。日志里把「对话上下文」和「群聊流水/花名册/环境」切开，方便按
 * 一问一答阅读，也不会因为流水每轮变长而看不清对话本身。
 */
function buildChatHistoryBlock(
  messages: { role: string; content: any[] }[],
  opts: { fallbackTime?: string; botLabel?: string },
): string | null {
  const lines: string[] = []
  let lastTime = opts.fallbackTime || ''
  const botLabel = opts.botLabel || '机器人'

  for (const msg of messages) {
    const role = msg?.role
    if (role !== 'user' && role !== 'assistant') continue

    const texts: string[] = []
    let imageCount = 0
    for (const part of msg.content || []) {
      if (!part) continue
      if (part.type === 'text') {
        const t = String(part.text ?? '').trim()
        if (t) texts.push(t)
      } else if (part.type === 'image') {
        imageCount++
      }
    }

    let text = texts.join('\n').trim()
    if (!text && imageCount === 0) continue

    // 兼容老数据：历史消息里可能还留着 `[#3 13:41]` 的流水序号前缀
    text = text.replace(/^\[#\d+\s+(\d{1,2}:\d{2})\]/, '[$1]')
    const timeMatch = text.match(/^\[(\d{1,2}:\d{2})\]/)
    if (timeMatch) lastTime = timeMatch[1]

    const imageNote = imageCount > 0 ? `[图片×${imageCount}]` : ''
    if (role === 'user') {
      lines.push([text, imageNote].filter(Boolean).join(' ').trim())
    } else {
      // assistant 消息本身不带时间戳，沿用上一条 user 的时间（同一轮对话）
      lines.push(`[${lastTime}] ${botLabel}: ${[text, imageNote].filter(Boolean).join(' ')}`.trim())
    }
  }

  if (lines.length === 0) return null
  return `### 对话上下文\n<chat_history>\n${lines.join('\n')}\n</chat_history>`
}

export async function handleMessage(
  event: ChaiteEvent,
  storageCtx: any
): Promise<void> {
  const config = getConfig()
  const rawEvent: any = event.raw || {}
  const onebotAdapter = event.client || (globalThis as any).onebotAdapter || rawEvent._adapter

  // 规范化 isGroup/isPrivate：bridge/chat 与插件内嵌路径构造的是普通对象（非
  // ChaiteEvent 类实例），没有 event.js 里的派生 getter。缺失时按 type/raw 推导，
  // 否则群聊上下文注入（event.isGroup 判断）、群会话 ID 等全部失效。
  if (event && typeof event === 'object') {
    if (event.isGroup === undefined) {
      ;(event as any).isGroup =
        (event as any).type === 'group_message' ||
        rawEvent.message_type === 'group' ||
        rawEvent.isGroup === true
    }
    if ((event as any).isPrivate === undefined) {
      ;(event as any).isPrivate =
        (event as any).type === 'private_message' ||
        rawEvent.message_type === 'private' ||
        rawEvent.isPrivate === true
    }
    // selfId 规范化：bridge/插件内嵌路径的 virtualAdapter.getSelfId() 返回 0，
    // 宿主（如 chatgpt-plugin）通过 raw.self_id 注入真实机器人 QQ 号
    if ((event as any).selfId === undefined && rawEvent.self_id !== undefined && rawEvent.self_id !== 0) {
      ;(event as any).selfId = String(rawEvent.self_id)
    }
  }

  // 主人列表：面板配置（config.management.masterUsers）优先；未配置时回退宿主注入的
  // raw.masters（如 Yunzai 的 other.yaml masterQQ）；两者皆无则维持「全员主人」语义。
  // 用于指令权限判定与群聊环境元信息展示。
  const effectiveMasters = getEffectiveMasters(rawEvent, config).map(String)

  // 1. Check permissions (Enforce dynamic black/white lists via config)
  if (rawEvent.post_type === 'message') {
    const perm = checkPermission(rawEvent, config)
    if (!perm.allow) {
      return
    }
  }

  // Record group message into rolling buffer so future turns have full context
  if (rawEvent.message_type === 'group' && rawEvent.group_id) {
    await groupHistoryBuffer.recordMessage(rawEvent, onebotAdapter)
  }

  // 2. Convert message to Chaite format
  // 自身 QQ 优先级：宿主注入的 event.selfId > 适配器 getSelfId() > 面板配置
  const eventSelfId = (event as any).selfId ? String((event as any).selfId) : ''
  const adapterSelfId = onebotAdapter?.getSelfId ? onebotAdapter.getSelfId() : undefined
  const botUin = eventSelfId || adapterSelfId || config.onebot?.botUin || 0
  // 回填运行时 config：群流水花名册/伪造消息标记等处直接读 config.onebot.botUin，
  // bridge/内嵌路径原本永远拿不到真实 uin，这里仅在其为空时补齐（不覆盖面板显式配置）
  if (botUin && !config.onebot?.botUin) {
    config.onebot = { ...(config.onebot || {}), botUin: String(botUin) }
  }

  const { userMessage, isAtBot, cleanText } = await oneBotToUserMessage(rawEvent, {
    botUin,
    maxRecentImages: config.vision?.maxRecentImages,
    onebot: onebotAdapter,
  })

  // 本轮注入的上下文（场景协议/流水/花名册/环境/附图）最终放在了哪里：
  //   · 并入历史首条 user 时，它不在 userMessage.content 里 —— 日志要单独补上；
  //   · 并入本轮消息时，userMessage.content 已包含它 —— 日志不能再补。
  // 由 installPrependContext 在真正发请求时确定，供操作日志还原「模型实际看到的本轮输入」。
  let logPrependedParts: any[] = []

  // 日志展示用：本轮请求实际携带的「对话上下文」（历史 + 本轮发言，不含注入块）。
  // prependContext 在注入之前抓一份快照，操作日志据此渲染 <chat_history> 一问一答区块。
  let logConversationMessages: { role: string; content: any[] }[] = []
  // 本轮发言时间（[HH:mm]），供日志补 assistant 行时间；群聊分支里赋值
  let logCurrentMsgTime = ''

  // 3. Handle Chaite internal management & utility commands
  // 指令注册表见 src/commands.ts（单一来源）：分发按表匹配执行，宿主适配器
  // （如 chatgpt-plugin）通过 GET /api/bridge/commands 获取同一张表来决定
  // 转发哪些消息，宿主侧不再各自硬编码指令。
  const cmdPrefix = (config.chat.commandPrefix || '#').trim()
  const currentText = (event.text || cleanText || '').trim()

  const masterUsers = effectiveMasters.map(Number)
  const isMaster = effectiveMasters.length === 0 || masterUsers.includes(Number(event.userId))

  const cmdHit = matchChaiteCommand(currentText, cmdPrefix)
  if (cmdHit) {
    switch (cmdHit.command.name) {

  case 'help': {
    await event.reply(buildHelpText(cmdPrefix, isMaster))
    return
  }

  case 'reset': {
    const userPrefix = event.isGroup
      ? `conv_group_${event.groupId}_${event.userId}_`
      : `conv_private_${event.userId}_`

    try {
      // SqlHistoryManager 的表名是 history（历史遗留 bug：曾写死 messages 导致 no such table）
      const historyDriver = drivers.get('history')
      await historyDriver.run(
        `DELETE FROM history WHERE conversationId LIKE ?`,
        [`${userPrefix}%`]
      )
      await event.reply('✨ 已结束并清空你当前所有的预设对话上下文。')
    } catch (err: any) {
      console.error('[Runner] Error clearing user conversation:', err)
      await event.reply('清空上下文失败，请稍后重试。')
    }
    return
  }

  case 'clearGroup': {
    if (!event.isGroup) {
      await event.reply('❌ 该指令仅在群聊中可用。')
      return
    }
    if (!isMaster) {
      await event.reply('❌ 权限不足：该指令仅管理员/主人可用。')
      return
    }
    groupHistoryBuffer.clear(event.groupId)
    await event.reply('🧹 已成功清空本群当前的群聊消息流水与上下文缓冲。')
    return
  }

  case 'resetAll': {
    if (!isMaster) {
      await event.reply('❌ 权限不足：该指令仅管理员/主人可用。')
      return
    }
    try {
      const historyDriver = drivers.get('history')
      await historyDriver.run(`DELETE FROM history`)
      groupHistoryBuffer.clearAll()
      await event.reply('🧹 已成功结束并清空所有用户与所有群聊的全部预设对话上下文，并重置群聊流水缓冲。')
    } catch (err: any) {
      console.error('[Runner] Error clearing all conversations:', err)
      await event.reply('清空全部会话失败，请稍后重试。')
    }
    return
  }

  case 'banGroup': {
    if (!isMaster) {
      await event.reply('❌ 权限不足：该指令仅管理员/主人可用。')
      return
    }
    const parts = cmdHit.arg.trim().split(/\s+/)
    const targetGroup = Number(parts[0]) || (event.groupId ? Number(event.groupId) : 0)
    const durationStr = parts[1] || ''

    if (!targetGroup) {
      await event.reply(`⚠️ 请指定要拉黑的群号，例如: ${cmdPrefix}拉黑群 123456 [时长如 1h]`)
      return
    }

    const durationMs = parseDuration(durationStr)
    if (durationMs) {
      const res = banTarget(targetGroup, 'group', durationMs)
      const expireDate = new Date(res.expireAt!).toLocaleTimeString()
      await event.reply(`⏳ 已将群聊 [${targetGroup}] 临时加入黑名单 (${durationStr}，将于 ${expireDate} 自动解黑)。`)
      return
    }

    banTarget(targetGroup, 'group', null)
    if (!config.management.blackGroups.includes(targetGroup)) {
      config.management.blackGroups.push(targetGroup)
      saveConfig(config)
    }
    await event.reply(`✅ 已成功将群聊 [${targetGroup}] 加入全局黑名单。`)
    return
  }

  case 'unbanGroup': {
    if (!isMaster) {
      await event.reply('❌ 权限不足：该指令仅管理员/主人可用。')
      return
    }
    const targetGroup = Number(cmdHit.arg.trim().split(/\s+/)[0]) || (event.groupId ? Number(event.groupId) : 0)
    if (!targetGroup) {
      await event.reply(`⚠️ 请指定要解除拉黑的群号，例如: ${cmdPrefix}解黑群 123456`)
      return
    }
    unbanTarget(targetGroup, 'group')
    config.management.blackGroups = config.management.blackGroups.filter(g => g !== targetGroup)
    saveConfig(config)
    await event.reply(`✅ 已成功将群聊 [${targetGroup}] 从全局黑名单移除。`)
    return
  }

  case 'banUser': {
    if (!isMaster) {
      await event.reply('❌ 权限不足：该指令仅管理员/主人可用。')
      return
    }
    let targetUser = 0
    let durationStr = ''
    const parts = cmdHit.arg.trim().split(/\s+/).filter(Boolean)

    if (Array.isArray(rawEvent.message)) {
      const atSeg = rawEvent.message.find((seg: any) => seg.type === 'at')
      if (atSeg && (atSeg.data as any)?.qq) {
        targetUser = Number((atSeg.data as any).qq)
        durationStr = parts[0] || ''
      }
    }
    if (!targetUser && parts.length > 0) {
      targetUser = Number(parts[0])
      durationStr = parts[1] || ''
    }

    if (!targetUser) {
      await event.reply(`⚠️ 请指定要拉黑的用户，例如: ${cmdPrefix}拉黑 10001 10m 或 ${cmdPrefix}拉黑 @群友 1h`)
      return
    }

    const durationMs = parseDuration(durationStr)
    if (durationMs) {
      const res = banTarget(targetUser, 'user', durationMs)
      const expireDate = new Date(res.expireAt!).toLocaleTimeString()
      await event.reply(`⏳ 已将用户 [${targetUser}] 临时加入黑名单 (${durationStr}，将于 ${expireDate} 自动解黑)。`)
      return
    }

    banTarget(targetUser, 'user', null)
    if (!config.management.blackUsers.includes(targetUser)) {
      config.management.blackUsers.push(targetUser)
      saveConfig(config)
    }
    await event.reply(`✅ 已成功将用户 [${targetUser}] 加入全局黑名单。`)
    return
  }

  case 'unbanUser': {
    if (!isMaster) {
      await event.reply('❌ 权限不足：该指令仅管理员/主人可用。')
      return
    }
    let targetUser = 0
    if (Array.isArray(rawEvent.message)) {
      const atSeg = rawEvent.message.find((seg: any) => seg.type === 'at')
      if (atSeg && (atSeg.data as any)?.qq) {
        targetUser = Number((atSeg.data as any).qq)
      }
    }
    if (!targetUser) {
      targetUser = Number(cmdHit.arg.trim().split(/\s+/)[0])
    }
    if (!targetUser) {
      await event.reply(`⚠️ 请指定要解除拉黑的用户，例如: ${cmdPrefix}解黑 10001 或 ${cmdPrefix}解黑 @群友`)
      return
    }
    unbanTarget(targetUser, 'user')
    config.management.blackUsers = config.management.blackUsers.filter(u => u !== targetUser)
    saveConfig(config)
    await event.reply(`✅ 已成功将用户 [${targetUser}] 从全局黑名单移除。`)
    return
  }

  case 'presets': {
    try {
      const allPresets = await storageCtx.presetManager.getAllPresets()
      if (!allPresets || allPresets.length === 0) {
        await event.reply('当前暂未配置任何预设。')
        return
      }
      const lines = ['📋 【Chaite 可用预设列表】']
      allPresets.forEach((p: any, idx: number) => {
        const pfxs = Array.isArray(p.prefixes) && p.prefixes.length > 0 ? p.prefixes : (p.prefix ? [p.prefix] : [])
        const prefixStr = pfxs.length > 0 ? ` [前缀: "${pfxs.join(', ')}"${p.prefixAnywhere !== false ? '·任意匹配' : '·开头匹配'}]` : ' [无前缀]'
        const modelStr = p.sendMessageOption?.model || p.model ? ` (${p.sendMessageOption?.model || p.model})` : ''
        lines.push(`${idx + 1}. ${p.name || '未命名'}${prefixStr}${modelStr}`)
      })
      await event.reply(lines.join('\n'))
    } catch (err: any) {
      console.error('[Runner] Error fetching presets list:', err)
      await event.reply('获取预设列表失败。')
    }
    return
  }

  case 'status': {
    const channels = await storageCtx.channelsManager.storage.listItems()
    const presets = await storageCtx.presetManager.getAllPresets()
    const statusText = [
      '【Chaite 运行状态】',
      '架构: node-chaite 原生独立运行',
      '适配层: OneBot v11 (Plugin 解耦模式)',
      `已加载渠道数: ${channels.length}`,
      `可用预设数: ${presets.length}`,
      '状态: 正常运行',
    ].join('\n')

    await event.reply(statusText)
    return
  }
  }
}

  // 4. Trigger & Preset Resolution
  let isTriggered = false
  let matchedPreset: any = null
  let triggerReason = ''

  const isPresetAllowed = (p: any): boolean => {
    if (!p) return true
    const gid = event.groupId ? String(event.groupId) : ''
    const uid = event.userId ? String(event.userId) : ''

    if (gid && Array.isArray(p.blackGroups) && p.blackGroups.map(String).includes(gid)) {
      return false
    }
    if (gid && Array.isArray(p.whiteGroups) && p.whiteGroups.length > 0 && !p.whiteGroups.map(String).includes(gid)) {
      return false
    }
    if (uid && Array.isArray(p.blackUsers) && p.blackUsers.map(String).includes(uid)) {
      return false
    }
    if (uid && Array.isArray(p.whiteUsers) && p.whiteUsers.length > 0 && !p.whiteUsers.map(String).includes(uid)) {
      return false
    }
    return true
  }

  if (event.isPrivate) {
    isTriggered = true
    triggerReason = 'private_chat'
  }

  // 4.1 Check Preset Prefix Match
  if (!isTriggered && currentText) {
    try {
      const allPresets = await storageCtx.presetManager.getAllPresets()
      const prefixItems: Array<{ prefix: string; preset: any; matchAnywhere: boolean }> = []
      for (const p of allPresets) {
        if (!isPresetAllowed(p)) continue
        const pfxs: string[] = []
        if (Array.isArray(p.prefixes)) {
          for (const item of p.prefixes) {
            if (typeof item === 'string' && item.trim()) pfxs.push(item.trim())
          }
        }
        if (pfxs.length === 0 && p.prefix && typeof p.prefix === 'string' && p.prefix.trim()) {
          pfxs.push(p.prefix.trim())
        }

        const matchAnywhere = p.prefixAnywhere !== false
        for (const pfx of pfxs) {
          prefixItems.push({ prefix: pfx, preset: p, matchAnywhere })
        }
      }

      prefixItems.sort((a, b) => b.prefix.length - a.prefix.length)

      for (const item of prefixItems) {
        const isMatch = item.matchAnywhere ? currentText.includes(item.prefix) : currentText.startsWith(item.prefix)
        if (isMatch) {
          isTriggered = true
          matchedPreset = item.preset
          triggerReason = `preset_prefix (${item.prefix}${item.matchAnywhere ? ' anywhere' : ''})`
          break
        }
      }
    } catch (err: any) {
      console.warn('[Runner] Error querying presets for prefix match:', err.message)
    }
  }

  // 4.2 Check Bot Mention / At (严格遵循 enableAt 配置)
  if (!isTriggered) {
    const isAtEnabled = config.chat.enableAt === true
    if (isAtEnabled && isAtBot) {
      isTriggered = true
      triggerReason = 'at_bot'
      if (config.chat.atPresetId) {
        try {
          matchedPreset = await storageCtx.presetManager.getInstance(config.chat.atPresetId)
        } catch (err: any) {
          console.warn('[Runner] Failed to load atPresetId preset:', err.message)
        }
      }
    }
  }

  // 4.3 Check Random Auto Trigger Probability (群聊随机唤醒 / 自动插话)
  if (!isTriggered && event.isGroup) {
    try {
      const allPresets = await storageCtx.presetManager.listInstances()
      for (const p of allPresets) {
        if (p.autoTriggerProbability && p.autoTriggerProbability > 0) {
          if (Math.random() < p.autoTriggerProbability) {
            isTriggered = true
            matchedPreset = p
            triggerReason = 'random_probability'
            break
          }
        }
      }
    } catch (err: any) {
      console.warn('[Runner] Failed checking autoTriggerProbability:', err.message)
    }
  }

  // 4.4 指令前缀只由插件消费，不再作为对话触发词。对话唤醒仅认预设前缀、@ 触发或概率唤醒。
  if (!isTriggered) {
    return
  }

  // 5. Execute Chaite Conversation Flow
  try {
    const chaite = Chaite.getInstance()
    const eMsg: EventMessage = {
      sender: {
        user_id: Number(event.userId),
        nickname: event.sender?.nickname,
        card: event.sender?.card,
      },
      group: event.groupId
        ? {
            group_id: Number(event.groupId),
          }
        : undefined,
    }

    let preset = matchedPreset
    if (!preset) {
      preset = await chaite.getUserModeSelector().getChatPreset(eMsg)
    }

    if (!isPresetAllowed(preset)) {
      return
    }

    const isVisual = await isModelVisualCapable(preset)
    const currentImages: any[] = []

    if (userMessage.content.some((c: any) => c.type === 'image')) {
      if (!isVisual) {
        const imageParts = userMessage.content.filter((c: any) => c.type === 'image')
        const refPlaceholders = imageParts
          .map((img: any) => ` [图片 ref:${(img as any).ref || 'image'}] `)
          .join('')
        userMessage.content = userMessage.content.filter((c: any) => c.type !== 'image')
        const firstText: any = userMessage.content.find((c: any) => c.type === 'text')
        if (firstText) {
          firstText.text += refPlaceholders
        } else {
          userMessage.content.push({ type: 'text', text: refPlaceholders })
        }
      } else {
        // 视觉模型：暂存当前发送的图片，稍后与上下文历史图片统一进行图文交错锚定
        currentImages.push(...userMessage.content.filter((c: any) => c.type === 'image'))
        userMessage.content = userMessage.content.filter((c: any) => c.type !== 'image')
      }
    }

    const targetPresetId = preset?.id || 'default'
    const conversationId = event.isGroup
      ? `conv_group_${event.groupId}_${event.userId}_${targetPresetId}`
      : `conv_private_${event.userId}_${targetPresetId}`

    const effectiveToolCallLimit = preset?.sendMessageOption?.toolCallLimit || {
      maxConsecutiveCalls: config.llm?.maxConsecutiveCalls !== undefined ? Number(config.llm.maxConsecutiveCalls) : 10,
      maxConsecutiveIdenticalCalls: config.llm?.maxConsecutiveIdenticalCalls !== undefined ? Number(config.llm.maxConsecutiveIdenticalCalls) : 3,
    }

    const sendOptions = Object.assign(
      {},
      preset?.sendMessageOption || {},
      {
        // 必须显式传递命中的预设：sendMessage 内部若拿不到 chatPreset，
        // 会回退到 userModeSelector 的默认预设（通常是第一个预设），
        // 导致前缀命中的预设只影响会话 ID/触发词，模型与系统提示词仍走默认预设。
        chatPreset: preset,
        conversationId,
        presetId: targetPresetId,
        customOptions: preset?.customOptions,
        toolCallLimit: effectiveToolCallLimit,
      }
    )

    const isBym = preset?.isBymMode === true || preset?.presetMode === 'bym' || preset?.disableConversationContext === true
    sendOptions.isBymMode = isBym
    if (isBym) {
      sendOptions.conversationId = crypto.randomUUID()
      sendOptions.disableHistoryRead = true
      sendOptions.disableHistorySave = true
      sendOptions.stream = false
    }

    // 预拉取长期记忆（如果预设开启记忆）
    const isMemoryEnabled = Boolean(preset?.enableMemory || preset?.sendMessageOption?.enableMemory)
    let memoryBlock: string | undefined
    if (isMemoryEnabled) {
      try {
        const memoryManager = chaite.getMemoryManager()
        if (memoryManager) {
          const ctx = new ChaiteContext()
          ctx.chaite = chaite
          ctx.setEvent(rawEvent)
          ctx.setOptions(sendOptions)
          memoryBlock = await memoryManager.getActiveProvider().injectContext(ctx, {
            groupId: event.isGroup && event.groupId ? String(event.groupId) : undefined,
            userId: event.userId ? String(event.userId) : undefined,
          })
        }
      } catch (err: any) {
        console.warn('[Runner] Failed to fetch memory context:', err?.message || err)
      }
    }

    // 注入群聊环境与上下文 (Group Environment & History Stream)
    if (event.isGroup && event.groupId) {
      try {
        const contextParts: (TextContent | ImageContent)[] = []

        // ── 上下文置顶器 ──────────────────────────────────────────────────
        // 把本轮注入块（协议/流水/花名册/环境）放到「对话最前面」而不是塞在本轮
        // user 消息里：
        //   · 历史为空（新会话 / 伪人模式）→ 直接并入本轮 user 消息的头部；
        //   · 历史非空 → 并入历史首条 user 消息，避免出现连续两条 user（多数渠道不接受）；
        // 这样对话结构是 [user: 上下文 + 首句] [assistant] [user] ... [user: 本轮发言]，
        // 稳定头部内容才能持续命中前缀缓存（KV Cache）。
        // 写入 history 时仍由 persistMessage 剥掉注入块，只在「并入本轮消息」时需要剥离。
        const installPrependContext = (parts: (TextContent | ImageContent)[]) => {
          if (parts.length === 0) return
          const injectedCount = parts.length
          let ctxAttachedToCurrent = false
          sendOptions.prependContext = (histories: any[], current?: any) => {
            ctxAttachedToCurrent = false
            logPrependedParts = []
            if (!Array.isArray(histories) || histories.length === 0) return
            // 注入前抓一份对话快照（历史 + 本轮发言），供操作日志渲染一问一答的
            // <chat_history> 区块；注入块不属于对话上下文，不进这份快照。
            logConversationMessages = histories.map((m: any) => ({
              role: String(m.role),
              content: Array.isArray(m.content) ? [...m.content] : [],
            }))
            const cloned = parts.map((p) => ({ ...p }))
            // 无论最终并入「历史首条」还是「本轮消息」，userMessage.content 本身都不含注入块
            // （clients 内部是 new 了一个 thisRequestMsg，改的是副本），所以日志统一补这一段
            logPrependedParts = cloned
            // 列表里只有本轮这一条（无历史）：上下文与发言同属最前面的一条消息
            if (histories.length === 1 && (!current || histories[0] === current)) {
              const target = current || histories[0]
              target.content = [...cloned, ...((target.content as any[]) || [])]
              ctxAttachedToCurrent = true
              return
            }
            const head: any = histories[0]
            if (head && head.role === 'user' && Array.isArray(head.content)) {
              head.content = [...cloned, ...head.content]
            } else {
              histories.unshift({
                id: crypto.randomUUID(),
                parentId: null,
                role: 'user',
                content: cloned,
              } as any)
            }
          }
          if (!isBym) {
            sendOptions.persistMessage = (msg: any) => {
              if (!msg || !Array.isArray(msg.content)) return msg
              // 上下文已并入历史首条（或独立成条）时，本轮发言本身就是干净的
              if (!ctxAttachedToCurrent) return msg
              if (msg.content.length <= injectedCount) return { ...msg, content: [] }
              return { ...msg, content: msg.content.slice(injectedCount) }
            }
          }
        }

        // 1. 构建当前会话环境元信息 (时间具体到秒、自身身份、主人列表、提问者、触发方式)
        const now = new Date()
        const cstFormatter = new Intl.DateTimeFormat('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          weekday: 'long',
          hour12: false,
        })
        const cstTimeStr = cstFormatter.format(now).replace(/\//g, '-')

        // ── 发言者时间戳/身份徽标：完整上下文与精简模式共用 ──────────────────
        const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
          timeZone: 'Asia/Shanghai',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        const currentMsgTime = timeFormatter.format(now)
        logCurrentMsgTime = currentMsgTime

        const uidStr = String(event.userId)
        const isBotSelf = uidStr === String(config?.onebot?.botUin || '')
        let roleBadge = ''
        if (isBotSelf) {
          roleBadge = '[机器人]'
        } else if (isMaster) {
          if (event.sender?.role === 'owner') {
            roleBadge = '[群主/主人]'
          } else if (event.sender?.role === 'admin') {
            roleBadge = '[群管/主人]'
          } else {
            roleBadge = '[主人]'
          }
        } else if (event.sender?.role === 'owner') {
          roleBadge = '[群主]'
        } else if (event.sender?.role === 'admin') {
          roleBadge = '[群管]'
        }

        const cleanCard = (event.sender?.card || '').replace(/[\s\u3000]+/g, ' ').trim()
        const cleanNick = (event.sender?.nickname || '').replace(/[\s\u3000]+/g, ' ').trim()
        let speakerName = cleanCard || cleanNick || (event.userId ? `QQ ${event.userId}` : '群友')
        speakerName = speakerName
          .replace(/\r\n|\r|\n/g, ' ')
          .replace(/\[(主人|群主|群管|群主\/主人|群管\/主人|机器人|Admin|Bot)\]/gi, '')
          .trim() || (event.userId ? `QQ ${event.userId}` : '群友')

        const badgeStr = roleBadge ? ` ${roleBadge}` : ''

        // ── 上下文注入策略 ──────────────────────────────────────────────
        // 普通对话与伪人模式一样，**每轮都注入完整的静态上下文**（场景协议 + 流水 +
        // 花名册 + 环境）。这样模型每一轮都能看到当下群里在聊什么、都有谁。
        //
        // 之前之所以改成「只在会话起始注入一次」，是因为 user message 会被原样写入
        // history，每轮注入就在历史里堆 N 份流水快照（token 爆炸 + 时间线互相矛盾）。
        // 现在改为：发给模型的完整内容不变，但**持久化时剥掉注入块**（只保留本轮
        // 发言 + 附图），由 sendOptions.persistMessage 在 saveHistory 前裁剪。
        // 于是每轮请求都是「干净的历史对话 + 新鲜的完整上下文」，两全其美。
        const mastersList: string[] = []
        for (const m of effectiveMasters) {
          if (!mastersList.includes(String(m))) {
            mastersList.push(String(m))
          }
        }
        const mastersStr = mastersList.length > 0 ? mastersList.join(', ') : '无配置'

        let triggerWay = '常规对话'
        let interactMode = '对话响应（结合当前发言者的意图与话题做出针对性回应）'
        if (triggerReason === 'random_probability') {
          triggerWay = '随机唤醒 (自动插话)'
          interactMode = '自然接梗/插话（群友未主动呼叫，无需刻意单点回复最后一人；可就近期话题发表看法、吐槽、接梗，表现得像正在看群的真实群友）'
        } else if (triggerReason === 'at_bot') {
          triggerWay = '@你提问'
        } else if (triggerReason?.startsWith('preset_prefix')) {
          const rawMatch = triggerReason.match(/\((.*?)(?:\s+anywhere)?\)/)
          const matchedPrefix = rawMatch ? rawMatch[1] : (preset?.prefix || '')
          const presetName = preset?.name || '默认预设'
          triggerWay = `命中预设触发词 "${matchedPrefix}" (激活预设: ${presetName})`
        } else if (triggerReason) {
          triggerWay = triggerReason
        }

        const senderCard = event.sender?.card ? ` (群名片: "${event.sender.card}")` : ''
        const senderNick = event.sender?.nickname ? ` (昵称: "${event.sender.nickname}")` : ''
        const senderStr = `QQ ${event.userId}${senderCard}${senderNick}`

        const envLines = [
          '### 当前群聊会话环境与时间：',
          '<chat_environment>',
          `- 会话场景: QQ 群聊 (群号: ${event.groupId})`,
          `- 当前时间: ${cstTimeStr} (北京时间 CST/UTC+8)`,
          `- 你的身份: QQ ${botUin || '未知'}`,
          `- 管理员/主人: QQ ${mastersStr}`,
          `- 当前发言者: ${senderStr}`,
          `- 触发方式: ${triggerWay}`,
          `- 互动模式: ${interactMode}`,
          '</chat_environment>',
        ]

        const envPart: TextContent = {
          type: 'text',
          text: envLines.join('\n'),
        }

        // 2. 注入群聊上下文流水与花名册
        const presetGroupCtxSetting = (preset as any)?.groupContext || 'use_system'
        const shouldInjectGroupContext = presetGroupCtxSetting === 'enabled'
          || (presetGroupCtxSetting === 'use_system' && config.llm?.enableGroupContext !== false)

        if (shouldInjectGroupContext) {
          const groupContextResult = await groupHistoryBuffer.buildContext(
            event.groupId,
            {
              minMessages: config.groupContext?.minMessages ?? 20,
              minTokens: config.groupContext?.minTokens ?? 2000,
              maxMessages: config.groupContext?.maxMessages ?? 100,
              maxTokens: config.groupContext?.maxTokens ?? 10000,
              enableRichCards: config.groupContext?.enableRichCards ?? true,
              enableForwardParse: config.groupContext?.enableForwardParse ?? true,
              maxForwardMessages: config.groupContext?.maxForwardMessages ?? 15,
              currentSender: {
                userId: event.userId,
                nickname: event.sender?.nickname,
                card: event.sender?.card,
                role: event.sender?.role,
                title: event.sender?.title,
                level: event.sender?.level,
              },
              masterUsers: effectiveMasters,
              // 流水行保留流动序号（[#N 12:36]）：普通对话与伪人模式结构完全一致，
              // 且序号供虚拟短引用定位
              includeSeqIndex: true,
            },
            rawEvent.message_id,
            onebotAdapter
          )

          if (groupContextResult) {
            const { membersBlock, messagesBlock, recentImageRefs } = groupContextResult
            if (!messagesBlock && config.logging?.enabled !== false) {
              console.warn(
                `[Runner] Group context stream is empty for group ${event.groupId} ` +
                `(buffer=${groupHistoryBuffer.getBufferCount(event.groupId)}, ` +
                `currentMessageRecorded=${groupContextResult.includesCurrentMessage})`
              )
            }

            // 待发送视觉附件列表
            interface VisualAttachmentItem {
              seq: number
              desc: string
              detail: string
              mimeType: string
              base64: string
            }
            const visualAttachments: VisualAttachmentItem[] = []

            // 1. 若当前模型具备视觉能力，收集并解析群历史图片
            if (isVisual && recentImageRefs && recentImageRefs.length > 0) {
              const maxRecentImages = config.vision?.maxRecentImages ?? 3
              if (maxRecentImages > 0) {
                const imagesToFetch = recentImageRefs.slice(-maxRecentImages)
                for (const ref of imagesToFetch) {
                  try {
                    const resolved = await mediaRefStore.resolveImage(ref, onebotAdapter)
                    if (resolved?.base64) {
                      const refMeta = mediaRefStore.get(ref)
                      let senderNote = ''
                      if (refMeta?.senderId) {
                        senderNote = ` (由 QQ ${refMeta.senderId} 发送)`
                      }
                      visualAttachments.push({
                        seq: visualAttachments.length + 1,
                        desc: `群聊发言流水记录中的 [图片 ref:${ref}]`,
                        detail: `对应群聊发言流水记录中的 [图片 ref:${ref}]${senderNote}`,
                        mimeType: resolved.mimeType || 'image/jpeg',
                        base64: resolved.base64,
                      })
                    }
                  } catch (imgErr: any) {
                    console.warn(`[Runner] Failed to resolve group context image ${ref}:`, imgErr?.message || imgErr)
                  }
                }
              }
            }

            // 2. 将提问者当前轮次直接发送的图片加入待发送列表
            if (isVisual && currentImages.length > 0) {
              for (const img of currentImages) {
                visualAttachments.push({
                  seq: visualAttachments.length + 1,
                  desc: '当前提问者最新发送的图片',
                  detail: '对应当前提问者最新发送的图片',
                  mimeType: img.mimeType || 'image/jpeg',
                  base64: img.image,
                })
              }
            }

            // 0. 注入静态场景协议说明（作为前缀基石，稳定命中 KV Cache）
            const protocolLines = [
              '### 场景协议：',
              '当前会话为 QQ 群聊。下方按顺序包含：',
              '1. <group_messages>: 近期群聊发言流水记录（仅供理解当下话题语境与历史背景）；',
              '2. <chat_members>: 当前群聊成员花名册（包含群友名片、身份与头衔等元数据）；',
            ]
            let orderIdx = 3
            if (isMemoryEnabled && memoryBlock) {
              protocolLines.push(`${orderIdx++}. <long_term_memory>: 长期事实记忆（本群共享常识与当前发言者的个人偏好/事实）；`)
            }
            protocolLines.push(`${orderIdx++}. <chat_environment>: 动态会话环境与当前时间。`)
            protocolLines.push('请严格保持你预设的角色人设与口吻，结合群聊上下文与环境中的触发方式做出真实群友般的自然回应。')

            contextParts.push({
              type: 'text',
              text: protocolLines.join('\n'),
            })

            // 1. 先推入大体积、相对稳定的历史流水，最大化提升大模型 KV Cache Prefix Caching 命中率
            if (messagesBlock) {
              contextParts.push({
                type: 'text',
                text: `### 最近群聊发言流水记录：\n${messagesBlock}`,
              })
            }

            // 2. 推入群聊成员花名册（后置于流水，新人冒泡发言不击穿前序流水的 KV 缓存）
            if (membersBlock) {
              contextParts.push({
                type: 'text',
                text: `### 当前群聊成员花名册：\n${membersBlock}`,
              })
            }

            // 2.5 推入长期事实记忆（紧随花名册后置，不侵入 System Prompt，不击穿流水 KV Cache）
            if (isMemoryEnabled && memoryBlock) {
              contextParts.push({
                type: 'text',
                text: `### 长期记忆背景：\n${memoryBlock}`,
              })
            }

            // 3. 紧接着推入本轮动态的会话环境与时间戳（后置下移，避免每秒变化的时间戳击穿头部缓存）
            contextParts.push(envPart)

            // 4. 多模态附图索引 + 图文交错的视觉素材
            //    附图是「流水里那张图」的补充素材，必须紧跟在流水/环境之后，和其他上下文
            //    同处一块；放进本轮发言里会把末端那句 `[#N HH:mm] 谁: 说了什么` 冲散。
            if (visualAttachments.length > 0) {
              const imageIndexLines = visualAttachments.map(
                (att) => `- 附图 ${att.seq}: ${att.detail}`
              )
              contextParts.push({
                type: 'text',
                text: `### 本轮会话附带的多模态图像索引（按顺序严格对应紧随其后的图文交错附图）：\n<attached_images>\n${imageIndexLines.join('\n')}\n</attached_images>`,
              })
              for (const att of visualAttachments) {
                contextParts.push({
                  type: 'text',
                  text: `【下方附图 ${att.seq} 对应 ${att.desc}】：\n`,
                })
                contextParts.push({
                  type: 'image',
                  mimeType: att.mimeType,
                  image: att.base64,
                } as ImageContent)
              }
            }

            // 提取提问者原始的用户消息部件（保持原样，避免被伪造/注入人造前缀）
            const originalUserParts = [...userMessage.content]
            userMessage.content = []

            // 构建提问者真实输入：
            //   · 普通对话：[HH:mm] 发送者(身份): 内容 —— 刻意不带流水序号。序号是相对
            //     「当前这批流水」算出来的，流水刷新换批后就失去意义；对话上下文（历史）
            //     里存着的序号更是永远对不上新流水，所以对话侧与群聊流水彻底切割。
            //   · 伪人模式：[#N HH:mm] ... —— 依赖流水序号做短引用定位，保持不变。
            const currentSeq = (groupContextResult?.messageCount || 0) + 1
            const seqPrefix = isBym ? `#${currentSeq} ` : ''
            const speakerHeader = `[${seqPrefix}${currentMsgTime}] ${speakerName}${badgeStr}: `
            // 流水里已经带上本轮消息（缓冲池里没有别的发言）时，末尾不再重复一次带头部的同一句
            const tailHeader = groupContextResult?.includesCurrentMessage ? '' : speakerHeader

            // 注册当前消息至短期虚拟引用池，便于后续多轮对话或工具通过序号精准定位
            groupMessageRefStore.appendMessage(String(event.groupId), {
              seq: currentSeq,
              messageId: event.messageId,
              userId: String(event.userId),
              rawTime: Math.floor(Date.now() / 1000),
              timeStr: currentMsgTime,
              nickname: event.sender?.nickname,
              card: event.sender?.card,
              role: event.sender?.role,
              text: currentText,
              imageRefs: [],
            })

            const firstTextIndex = originalUserParts.findIndex((p: any) => p.type === 'text')
            if (firstTextIndex >= 0) {
              if (tailHeader) {
                const originText = (originalUserParts[firstTextIndex] as any).text || ''
                originalUserParts[firstTextIndex] = {
                  type: 'text',
                  text: `${tailHeader}${originText}`,
                }
              }
            } else if (tailHeader) {
              originalUserParts.unshift({
                type: 'text',
                text: tailHeader,
              })
            }

            if (originalUserParts.length > 0) {
              userMessage.content.push(...originalUserParts)
            }

            // ── 持久化裁剪 + 上下文置顶 ────────────────────────────────────
            // 上面构建的「场景协议 / 流水 / 花名册 / 环境 / 附图索引」通过 prependContext
            // 放到对话最前面（新会话即本轮这条消息的头部；已有历史则并入历史首条 user）。
            // 写入 history 时剥掉，只保留附图 + 本轮发言，否则每轮注入的快照都会堆进历史。
            installPrependContext(contextParts)
          }
        } else {
          // 未启用群聊历史上下文时，直接注入记忆与基础会话环境
          if (isMemoryEnabled && memoryBlock) {
            contextParts.push({
              type: 'text',
              text: `### 长期记忆背景：\n${memoryBlock}`,
            })
          }
          contextParts.push(envPart)
          // 同上：注入块置顶，且不落库
          installPrependContext(contextParts)
        }
      } catch (err: any) {
        console.warn('[Runner] Failed to build group context:', err?.message || err)
      }
    } else if (!event.isGroup) {
      if (isVisual && currentImages.length > 0) {
        userMessage.content.push(...currentImages)
      }
      if (isMemoryEnabled && memoryBlock) {
        userMessage.content.unshift({
          type: 'text',
          text: `### 长期记忆背景：\n${memoryBlock}`,
        })
        // 私聊的长期记忆同样是「本轮临时注入」，不落库，避免每轮堆一份
        sendOptions.persistMessage = (msg: any) => {
          if (!msg || !Array.isArray(msg.content)) return msg
          if (msg.content.length <= 1) return { ...msg, content: [] }
          return { ...msg, content: msg.content.slice(1) }
        }
      }
    }

    // Skill intent matching & dynamic activation
    const skillRegistry = chaite.getSkillRegistry()
    if (skillRegistry && !sendOptions.skillName) {
      try {
        const matchedSkill = await skillRegistry.matchSkill(currentText, {
          userId: event.userId,
          groupId: event.groupId,
          isGroup: event.isGroup,
          presetId: targetPresetId,
          messageText: currentText,
          event,
        })
        const allowedSkills = sendOptions.enabledSkills
        if (matchedSkill && (!allowedSkills?.length || allowedSkills.includes(matchedSkill.id))) {
          sendOptions.skillName = matchedSkill.id
          if (config.logging?.enabled !== false) {
            console.log(`[Runner] Activated skill "${matchedSkill.id}" (${matchedSkill.frontmatter.name}) for user ${event.userId}`)
          }
        }
      } catch (err: any) {
        console.warn('[Runner] Failed to match skill:', err?.message || err)
      }
    }

    // Resolve images in history window
    if (Array.isArray(sendOptions.historyMessages)) {
      for (const hMsg of sendOptions.historyMessages) {
        if (!Array.isArray(hMsg.content)) continue
        for (const part of hMsg.content) {
          if (part.type === 'text' && typeof part.text === 'string') {
            const refMatches = Array.from(part.text.matchAll(/\[图片 ref:([a-zA-Z0-9_\-\.]+)\]/g))
            for (const match of refMatches) {
              const ref = (match as any)[1]
              try {
                const resolved: any = await mediaRefStore.resolveImage(ref, onebotAdapter)
                if (resolved && (resolved.base64 || resolved.dataUrl)) {
                  hMsg.content.push({
                    type: 'image',
                    mimeType: resolved.mimeType || 'image/jpeg',
                    data: resolved.base64 || resolved.dataUrl?.split(',')[1],
                  })
                }
              } catch (e: any) {
                console.warn(`[Runner] Failed to resolve historical image ref ${ref}:`, e.message)
              }
            }
          }
        }
      }
    }

    const startTime = Date.now()
    let response: any = null
    let errorCaught: any = null

    try {
      response = await chaite.sendMessage(userMessage, eMsg, sendOptions)
    } catch (sendErr: any) {
      errorCaught = sendErr
      throw sendErr
    } finally {
      const durationMs = Date.now() - startTime
      if (config.logging?.enabled !== false && storageCtx.operationLogManager) {
        try {
          const respText = response?.contents
            ? response.contents.map((c: any) => c.text || c.reasoning || '').join(' ')
            : ''
          const inTok = (response?.usage as any)?.promptTokens ?? (response?.usage as any)?.inputTokens ?? (response?.usage as any)?.prompt_tokens ?? 0
          const outTok = (response?.usage as any)?.completionTokens ?? (response?.usage as any)?.outputTokens ?? (response?.usage as any)?.completion_tokens ?? 0
          const totalTok = response?.usage?.totalTokens ?? (inTok + outTok)
          const reasonTok = response?.usage?.reasoningTokens ?? 0

          let chanName = response?.channelName
          let chanId = response?.channelId || preset?.sendMessageOption?.channelId

          const userText = currentText || (userMessage?.content?.filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ") || "User message")
          const shortUser = userText.length > 50 ? userText.slice(0, 47) + "..." : userText
          const shortResp = respText.length > 50 ? respText.slice(0, 47) + "..." : respText
          const summary = errorCaught
            ? `${shortUser} -> [Error] ${errorCaught.message || "Execution failed"}`
            : `${shortUser} -> ${shortResp || "OK"}`

          // 清理记录到日志的 Options，剔除下划线私有内部状态与重复项（如嵌套的 chatPreset）
          const cleanOptionsForLog = (opts: any) => {
            if (!opts || typeof opts !== "object") return {}
            const res: Record<string, any> = {}
            for (const [k, v] of Object.entries(opts)) {
              if (k.startsWith("_") || k === "chatPreset") continue
              if (k === "customOptions" && v && typeof v === "object") {
                const sub: Record<string, any> = {}
                for (const [sk, sv] of Object.entries(v as Record<string, any>)) {
                  if (!sk.startsWith("_") && opts[sk] === undefined) {
                    sub[sk] = sv
                  }
                }
                if (Object.keys(sub).length > 0) res.customOptions = sub
                continue
              }
              if (k === "model" && typeof v === "string" && v.includes("/")) {
                res[k] = v.slice(v.indexOf("/") + 1).trim()
                continue
              }
              res[k] = v
            }
            return res
          }

          const respParams: Record<string, any> = {
            id: response?.id,
            model: response?.model,
            finishReason: (response as any)?.finishReason || (response as any)?.candidates?.[0]?.finishReason,
            usage: response?.usage,
            toolCalls: response?.toolCalls,
            channelId: chanId,
            channelName: chanName,
          }

          const rawPresetModel = preset?.sendMessageOption?.model
          const cleanPresetModel = rawPresetModel && rawPresetModel.includes("/")
            ? rawPresetModel.slice(rawPresetModel.indexOf("/") + 1).trim()
            : rawPresetModel

          // 日志展示用：把本轮对话（历史 + 本轮发言）渲染成一问一答区块，与群聊流水切割。
          // 伪人模式不读历史、不落库，每轮都是独立会话，没有「对话上下文」可言，不生成该区块。
          const chatHistoryText = (isBym || sendOptions.disableHistoryRead === true) ? null : buildChatHistoryBlock(
            logConversationMessages.length > 0
              ? logConversationMessages
              : [{
                role: 'user',
                content: Array.isArray(userMessage.content) ? userMessage.content : [],
              }],
            {
              fallbackTime: logCurrentMsgTime,
              botLabel: preset?.name ? `${preset.name} [机器人]` : '机器人',
            },
          )

          storageCtx.operationLogManager.addSync({
            type: "llm.call",
            level: errorCaught ? "error" : "info",
            summary,
            detail: errorCaught ? (errorCaught.stack || errorCaught.message) : undefined,
            userId: String(event.userId),
            groupId: event.groupId ? String(event.groupId) : undefined,
            channelId: chanId,
            channelName: chanName,
            model: response?.model || cleanPresetModel || "(default)",
            presetId: preset?.id,
            presetName: preset?.name,
            skillName: sendOptions.skillName,
            durationMs,
            inputTokens: inTok,
            outputTokens: outTok,
            totalTokens: totalTok,
            reasoningTokens: reasonTok,
            metadata: {
              triggerType: isBym ? "bym_mode" : (preset?.prefix ? `preset_prefix (${preset.prefix})` : "direct_chat"),
              isBymMode: isBym,
              status: errorCaught ? 500 : 200,
              rawRequest: (response as any)?.rawRequest,
              rawResponse: (response as any)?.rawResponse,
              requestPayload: {
                // 日志新展示区块：把本轮实际送出的对话（历史 + 本轮发言）渲染成一问一答的
                // <chat_history>；群聊流水/花名册/环境属于注入块，不在这块里（完整报文见原始请求）
                chatHistoryText,
                // 日志要还原「模型本轮实际看到的输入」：上下文并入历史首条时，
                // 它不在 userMessage.content 里，这里补回来（并入本轮时不能再补，否则重复）
                userMessage: logPrependedParts.length > 0
                  ? {
                    ...userMessage,
                    content: [...logPrependedParts, ...(Array.isArray(userMessage.content) ? userMessage.content : [])],
                  }
                  : userMessage,
                sendOptions: cleanOptionsForLog(sendOptions),
              },
              responsePayload: errorCaught ? null : {
                contents: response?.contents,
                usage: response?.usage,
                model: response?.model,
                toolCalls: response?.toolCalls,
                finishReason: (response as any)?.finishReason,
                params: respParams,
              },
              error: errorCaught ? {
                message: errorCaught.message,
                stack: errorCaught.stack,
              } : null,
            },
          })
        } catch {}
      }
    }

    // 6. Send formatted packets
    const shouldOutputThinking = preset?.showThinking === true || (preset?.sendMessageOption as any)?.showThinking === true
    const reasoningParts = response?.contents?.filter((c: any) => c.type === 'reasoning') || []
    const reasoningText = reasoningParts.map((c: any) => c.text || '').join('').trim()

    if (shouldOutputThinking && reasoningText) {
      try {
        const botName = preset?.name || 'Bot'
        const curBotUin = config.onebot?.botUin || botUin || 10001000
        const chunkSize = 1500
        const nodes: any[] = []
        for (let i = 0; i < reasoningText.length; i += chunkSize) {
          const slice = reasoningText.slice(i, i + chunkSize)
          nodes.push({
            type: 'node',
            data: {
              name: `${botName} 思考过程`,
              uin: curBotUin,
              content: [
                { type: 'text', data: { text: slice } },
              ],
            },
          })
        }
        if (onebotAdapter?.callAction) {
          await onebotAdapter.callAction('send_forward_msg', {
            message_type: rawEvent.message_type,
            group_id: rawEvent.group_id,
            user_id: rawEvent.user_id,
            messages: nodes,
          })
        } else {
          await event.reply({ text: `💭 思考过程:\n${reasoningText}`, reply: false })
        }
        await new Promise((r) => setTimeout(r, 200))
      } catch (fwdErr: any) {
        console.warn('[Runner] Failed to send forward reasoning message:', fwdErr.message)
      }
    }

    const shouldQuote = preset?.quoteReply === true
    const replyId = shouldQuote ? rawEvent.message_id : undefined
    const packets = formatModelResponse(response, replyId, config.chat.maxMessageLength, shouldOutputThinking && Boolean(reasoningText))

    if (onebotAdapter?.callAction) {
      for (const packet of packets) {
        if (packet.length === 0) continue
        await onebotAdapter.callAction('send_msg', {
          message_type: rawEvent.message_type,
          group_id: rawEvent.group_id,
          user_id: rawEvent.user_id,
          message: packet,
        })
        await new Promise((r) => setTimeout(r, 200))
      }
    } else {
      const respText = response?.contents?.map((c: any) => c.text || '').join('') || ''
      await event.reply({ text: respText, reply: shouldQuote })
    }

    // Record Bot reply into rolling buffer
    const botReplyText = response?.contents
      ?.filter((c: any) => c.type === 'text')
      ?.map((c: any) => c.text)
      ?.join('\n')
    if (rawEvent.message_type === 'group' && rawEvent.group_id && botReplyText) {
      groupHistoryBuffer.recordBotMessage(rawEvent.group_id, {
        botUin: config.onebot?.botUin || botUin,
        name: preset?.name || 'Bot',
        text: botReplyText,
        messageId: response?.id,
      })
    }
  } catch (err: any) {
    console.error('[Runner] Failed to send message to Chaite:', err.message)
    if (err.message && err.message.includes('No available channels')) {
      const tip = '⚠️ Chaite 尚未配置可用模型渠道，请前往 Web 控制台配置模型 API 渠道。'
      await event.reply(tip)
    } else {
      await event.reply(`⚠️ 请求处理失败: ${err.message}`)
    }
  }
}

export * from './core/index.js'
export * from './config.js'
export * from './storage.js'
export * from './server.js'
export * from './plugin/index.js'
export { CHAITE_COMMANDS, matchChaiteCommand, buildHelpText } from './commands.js'
export { groupHistoryBuffer, groupMessageRefStore }

/**
 * 幂等的 bootstrap：全进程只执行一次。
 *
 * 去重标志必须挂在 globalThis 上而不是模块级变量：当 chaite 以依赖形式
 * 嵌入宿主（如 Yunzai）时，PluginManager 会对宿主插件目录做影子拷贝
 * （plugins/.cache/runtime/<id>/<ts>/）再 import，每份影子副本都是独立的
 * 模块实例，模块级标志会被绕过，导致 bootstrap → loadAll → 影子拷贝 →
 * 再次 bootstrap 的无限递归（表现为反复 "Starting Chaite" / EADDRINUSE）。
 */
export function bootstrap(): Promise<void> {
  const g = globalThis as any
  if (!g.__chaiteBootstrapPromise) {
    g.__chaiteBootstrapPromise = bootstrapOnce().catch((err: unknown) => {
      g.__chaiteBootstrapPromise = null
      throw err
    })
  }
  return g.__chaiteBootstrapPromise
}

const isDirectRun = Boolean(
  process.argv[1] &&
  (process.argv[1].endsWith('index.ts') ||
   process.argv[1].endsWith('index.js') ||
   process.argv[1].endsWith('chaite'))
)

if (isDirectRun) {
  bootstrap().catch((err) => {
    console.error('[Runner] Bootstrap error:', err)
    process.exit(1)
  })
}
