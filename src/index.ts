import { loadConfig, getConfig, saveConfig } from './config'
import { initChaiteStorage } from './storage'
import { startWebServer } from './server'
import { checkPermission, banTarget, unbanTarget, parseDuration } from './guard'
import { oneBotToUserMessage, formatModelResponse } from './onebot/message'
import { OneBotMessageEvent } from './onebot/types'
import { groupHistoryBuffer, groupMessageRefStore } from './context/groupHistoryBuffer'
export { groupHistoryBuffer, groupMessageRefStore }
import { mediaRefStore } from './onebot/refStore'
import { pluginManager, ChaiteEvent } from './plugin'
import { Chaite, EventMessage, SendMessageOption, drivers, TextContent, ImageContent } from './core'

async function bootstrap() {
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

async function handleMessage(
  event: ChaiteEvent,
  storageCtx: any
): Promise<void> {
  const config = getConfig()
  const rawEvent: any = event.raw || {}
  const onebotAdapter = event.client || (globalThis as any).onebotAdapter || rawEvent._adapter

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
  const botUin = (onebotAdapter?.getSelfId ? onebotAdapter.getSelfId() : config.onebot?.botUin) || 0
  const { userMessage, isAtBot, cleanText } = await oneBotToUserMessage(rawEvent, {
    botUin,
    maxRecentImages: config.vision?.maxRecentImages,
    onebot: onebotAdapter,
  })

  // 3. Handle Chaite internal management & utility commands
  // 匹配 #chaite 及旗下的一系列内置指令（如 #状态、#管理面板、#重置对话等）
  // 插件指令（如 #打招呼）由插件自己独立注册调度，不在此处拦截
  const cmdPrefix = (config.chat.commandPrefix || '#').trim()
  const currentText = (event.text || cleanText || '').trim()

  const masterUsers = (config.management?.masterUsers || []).map(Number)
  const isMaster = masterUsers.length === 0 || masterUsers.includes(Number(event.userId))

  const matchCmd = (cmd: string): boolean => {
    const prefixes = Array.from(new Set([cmdPrefix, '#'])).filter(Boolean)
    for (const p of prefixes) {
      if (currentText === `${p}${cmd}` || currentText === `${p}chaite ${cmd}`) {
        return true
      }
    }
    return false
  }

  const matchCmdWithArg = (cmd: string): { matched: boolean; arg: string } => {
    const prefixes = Array.from(new Set([cmdPrefix, '#'])).filter(Boolean)
    for (const p of prefixes) {
      for (const base of [`${p}${cmd}`, `${p}chaite ${cmd}`]) {
        if (currentText === base) {
          return { matched: true, arg: '' }
        }
        if (currentText.startsWith(`${base} `) || currentText.startsWith(`${base}\n`)) {
          return { matched: true, arg: currentText.slice(base.length).trim() }
        }
      }
    }
    return { matched: false, arg: '' }
  }

  if (matchCmd('chaite') || matchCmd('帮助') || matchCmd('help') || matchCmd('gpt帮助')) {
    const helpText = [
      ' Chaite 交互指令',
      '──────────────────',
      `• ${cmdPrefix}chaite / ${cmdPrefix}帮助`,
      `• ${cmdPrefix}结束对话 / ${cmdPrefix}重置对话`,
      `• ${cmdPrefix}清空群上下文 / ${cmdPrefix}重置群聊 (主人)`,
      `• ${cmdPrefix}结束全部对话 / ${cmdPrefix}清空全部会话 (主人)`,
      `• ${cmdPrefix}预设列表 / ${cmdPrefix}查看预设`,
      `• ${cmdPrefix}状态 / ${cmdPrefix}ping`,
      `• ${cmdPrefix}拉黑群 [群号] / ${cmdPrefix}解黑群 [群号]`,
      `• ${cmdPrefix}拉黑 [@某人/QQ] / ${cmdPrefix}解黑 [@某人/QQ]`,
      '──────────────────',
    ].join('\n')

    await event.reply(helpText)
    return
  }

  if (matchCmd('结束对话') || matchCmd('重置对话') || matchCmd('清空对话') || matchCmd('清空上下文') || matchCmd('reset')) {
    const userPrefix = event.isGroup
      ? `conv_group_${event.groupId}_${event.userId}_`
      : `conv_private_${event.userId}_`

    try {
      const historyDriver = drivers.get('history')
      await historyDriver.run(
        `DELETE FROM messages WHERE conversationId LIKE ?`,
        [`${userPrefix}%`]
      )
      await event.reply('✨ 已结束并清空你当前所有的预设对话上下文。')
    } catch (err: any) {
      console.error('[Runner] Error clearing user conversation:', err)
      await event.reply('清空上下文失败，请稍后重试。')
    }
    return
  }

  if (matchCmd('清空群上下文') || matchCmd('重置群聊') || matchCmd('清空群聊上下文')) {
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

  if (matchCmd('结束全部对话') || matchCmd('重置全部对话') || matchCmd('清空全部会话') || matchCmd('resetall')) {
    if (!isMaster) {
      await event.reply('❌ 权限不足：该指令仅管理员/主人可用。')
      return
    }
    try {
      const historyDriver = drivers.get('history')
      await historyDriver.run(`DELETE FROM messages`)
      groupHistoryBuffer.clearAll()
      await event.reply('🧹 已成功结束并清空所有用户与所有群聊的全部预设对话上下文，并重置群聊流水缓冲。')
    } catch (err: any) {
      console.error('[Runner] Error clearing all conversations:', err)
      await event.reply('清空全部会话失败，请稍后重试。')
    }
    return
  }

  const banGroupMatch = matchCmdWithArg('拉黑群')
  if (banGroupMatch.matched) {
    if (!isMaster) {
      await event.reply('❌ 权限不足：该指令仅管理员/主人可用。')
      return
    }
    const parts = banGroupMatch.arg.trim().split(/\s+/)
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

  const unbanGroupMatch = matchCmdWithArg('解黑群')
  if (unbanGroupMatch.matched) {
    if (!isMaster) {
      await event.reply('❌ 权限不足：该指令仅管理员/主人可用。')
      return
    }
    const targetGroup = Number(unbanGroupMatch.arg.trim().split(/\s+/)[0]) || (event.groupId ? Number(event.groupId) : 0)
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

  const banUserMatch = matchCmdWithArg('拉黑')
  if (banUserMatch.matched) {
    if (!isMaster) {
      await event.reply('❌ 权限不足：该指令仅管理员/主人可用。')
      return
    }
    let targetUser = 0
    let durationStr = ''
    const parts = banUserMatch.arg.trim().split(/\s+/).filter(Boolean)

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

  const unbanUserMatch = matchCmdWithArg('解黑')
  if (unbanUserMatch.matched) {
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
      targetUser = Number(unbanUserMatch.arg.trim().split(/\s+/)[0])
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

  if (matchCmd('预设列表') || matchCmd('查看预设') || matchCmd('预设') || matchCmd('presets')) {
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

  if (matchCmd('ping') || matchCmd('状态') || matchCmd('status')) {
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

    // 注入群聊环境与上下文 (Group Environment & History Stream)
    if (event.isGroup && event.groupId) {
      try {
        const contextParts: TextContent[] = []

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

        const mastersList: string[] = []
        if (Array.isArray(config.management?.masterUsers)) {
          for (const m of config.management.masterUsers) {
            if (!mastersList.includes(String(m))) {
              mastersList.push(String(m))
            }
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
          triggerWay = `命中触发词 (${triggerReason.replace('preset_prefix', '').trim()})`
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
            },
            rawEvent.message_id,
            onebotAdapter
          )

          if (groupContextResult) {
            const { membersBlock, messagesBlock, recentImageRefs } = groupContextResult

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
            contextParts.push({
              type: 'text',
              text: '### 场景协议：\n当前会话为 QQ 群聊。下方按顺序包含：\n1. <group_messages>: 近期群聊发言流水记录（仅供理解当下话题语境与历史背景）；\n2. <chat_members>: 当前群聊成员花名册（包含群友名片、身份与头衔等元数据）；\n3. <chat_environment>: 动态会话环境与当前时间。\n请严格保持你预设的角色人设与口吻，结合群聊上下文与环境中的触发方式做出真实群友般的自然回应。',
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

            // 3. 紧接着推入本轮动态的会话环境与时间戳（后置下移，避免每秒变化的时间戳击穿头部缓存）
            contextParts.push(envPart)

            // 4. 推入多模态附图索引清单
            if (visualAttachments.length > 0) {
              const imageIndexLines = visualAttachments.map(
                (att) => `- 附图 ${att.seq}: ${att.detail}`
              )
              contextParts.push({
                type: 'text',
                text: `### 本轮会话附带的多模态图像索引（按顺序严格对应下方图文交错附图）：\n<attached_images>\n${imageIndexLines.join('\n')}\n</attached_images>`,
              })
            }

            // 提取提问者原始的用户消息部件（保持原样，放置在最末尾，避免被伪造/注入人造前缀）
            const originalUserParts = [...userMessage.content]
            userMessage.content = []

            // 1. 注入群聊环境、花名册、发言流水与附图清单
            if (contextParts.length > 0) {
              userMessage.content.push(...contextParts)
            }

            // 2. 注入图文交错的视觉素材
            if (visualAttachments.length > 0) {
              for (const att of visualAttachments) {
                userMessage.content.push({
                  type: 'text',
                  text: `【下方附图 ${att.seq} 对应 ${att.desc}】：\n`,
                })
                userMessage.content.push({
                  type: 'image',
                  mimeType: att.mimeType,
                  image: att.base64,
                } as ImageContent)
              }
            }

            // 3. 构建提问者真实输入：采用与 <group_messages> 流水完全统一的 [#N HH:mm] 发送者(身份): 格式
            // 既能让大模型感知统一的流动序号与提问者身份（彻底防串用户），又能让该消息被虚拟短引用系统注册
            const currentSeq = (groupContextResult?.messageCount || 0) + 1
            const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
              timeZone: 'Asia/Shanghai',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
            const currentMsgTime = timeFormatter.format(now)

            const uidStr = String(event.userId)
            const isBot = uidStr === String(config?.onebot?.botUin || '')
            let roleBadge = ''
            if (isBot) {
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
            const speakerHeader = `[#${currentSeq} ${currentMsgTime}] ${speakerName}${badgeStr}: `

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
              const originText = (originalUserParts[firstTextIndex] as any).text || ''
              originalUserParts[firstTextIndex] = {
                type: 'text',
                text: `${speakerHeader}${originText}`,
              }
            } else {
              originalUserParts.unshift({
                type: 'text',
                text: speakerHeader,
              })
            }

            if (originalUserParts.length > 0) {
              userMessage.content.push(...originalUserParts)
            }
          }
        } else {
          // 未启用群聊历史上下文时，直接注入基础会话环境
          contextParts.push(envPart)
          if (contextParts.length > 0) {
            userMessage.content.unshift(...contextParts)
          }
        }
      } catch (err: any) {
        console.warn('[Runner] Failed to build group context:', err?.message || err)
      }
    } else if (!event.isGroup && isVisual && currentImages.length > 0) {
      // 私聊场景下直接恢复当前发送的图片
      userMessage.content.push(...currentImages)
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
                userMessage,
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

bootstrap().catch((err) => {
  console.error('[Runner] Bootstrap error:', err)
  process.exit(1)
})
