import { estimateTokens } from './tokenEstimator'
import { parseJsonCard, parseXmlCard } from './cardParser'
import { mediaRefStore } from '../onebot/refStore'
import { OneBotMessageEvent, OneBotSegment } from '../onebot/types'
import { getConfig } from '../config'

export interface GroupContextOptions {
  minMessages?: number
  minTokens?: number
  maxMessages?: number
  maxTokens?: number
  enableRichCards?: boolean
  enableForwardParse?: boolean
  maxForwardMessages?: number
  currentSender?: {
    userId: string | number
    nickname?: string
    card?: string
    role?: string
    title?: string
    level?: string | number
  }
}

export interface GroupContextResult {
  membersBlock: string | null
  messagesBlock: string | null
  recentImageRefs: string[]
  fullText: string
  messageCount: number
  estimatedTokens: number
}

export interface EphemeralGroupMessage {
  seq: number
  messageId: string | number
  userId: string | number
  rawTime: number
  timeStr: string
  nickname?: string
  card?: string
  role?: string
  text: string
  imageRefs?: string[]
}

export class GroupMessageRefStore {
  private static instance: GroupMessageRefStore
  // groupId -> Map<seq, EphemeralGroupMessage>
  private turnRefs = new Map<string, Map<number, EphemeralGroupMessage>>()
  // groupId -> Map<messageIdStr, EphemeralGroupMessage>
  private idRefs = new Map<string, Map<string, EphemeralGroupMessage>>()

  public static getInstance(): GroupMessageRefStore {
    if (!GroupMessageRefStore.instance) {
      GroupMessageRefStore.instance = new GroupMessageRefStore()
    }
    return GroupMessageRefStore.instance
  }

  public registerTurn(groupId: string | number, messages: EphemeralGroupMessage[]) {
    const gid = String(groupId)
    const seqMap = new Map<number, EphemeralGroupMessage>()
    const idMap = new Map<string, EphemeralGroupMessage>()
    for (const m of messages) {
      seqMap.set(m.seq, m)
      if (m.messageId !== undefined && m.messageId !== null && m.messageId !== '') {
        idMap.set(String(m.messageId), m)
      }
    }
    this.turnRefs.set(gid, seqMap)
    this.idRefs.set(gid, idMap)
  }

  public appendMessage(groupId: string | number, message: EphemeralGroupMessage) {
    const gid = String(groupId)
    let seqMap = this.turnRefs.get(gid)
    let idMap = this.idRefs.get(gid)
    if (!seqMap) {
      seqMap = new Map()
      this.turnRefs.set(gid, seqMap)
    }
    if (!idMap) {
      idMap = new Map()
      this.idRefs.set(gid, idMap)
    }
    seqMap.set(message.seq, message)
    if (message.messageId !== undefined && message.messageId !== null && message.messageId !== '') {
      idMap.set(String(message.messageId), message)
    }
  }

  /**
   * 解析目标消息：支持传入流动序号（如 "#1"、"1" 或 1）或者原始消息 messageId
   */
  public resolve(groupId: string | number, target: string | number): EphemeralGroupMessage | undefined {
    const gid = String(groupId)
    const seqMap = this.turnRefs.get(gid)
    const idMap = this.idRefs.get(gid)
    if (!seqMap && !idMap) return undefined

    const cleaned = typeof target === 'string' ? target.trim().replace(/^#/, '') : String(target)
    const num = Number(cleaned)
    // 1. 若是有效序号数字，优先查当前轮次动态序号 (1 ~ N)
    if (!isNaN(num) && seqMap && seqMap.has(num)) {
      return seqMap.get(num)
    }
    // 2. 查原始 messageId
    if (idMap && idMap.has(cleaned)) {
      return idMap.get(cleaned)
    }
    return undefined
  }

  public clear(groupId: string | number) {
    const gid = String(groupId)
    this.turnRefs.delete(gid)
    this.idRefs.delete(gid)
  }

  public clearAll() {
    this.turnRefs.clear()
    this.idRefs.clear()
  }
}

export const groupMessageRefStore = GroupMessageRefStore.getInstance()

export interface BufferedMessage {
  messageId: string | number
  rawTime: number
  timeStr: string
  userId: string
  nickname: string
  card?: string
  role?: string
  title?: string
  level?: string | number
  text: string
  tokens: number
  imageRefs?: string[]
}

function parseCqMessageToSegments(content: string): Array<{ type: string; data: Record<string, any> }> {
  const segments: Array<{ type: string; data: Record<string, any> }> = []
  const cqRegex = /\[CQ:([a-zA-Z0-9_\-]+)(?:,([^\]]*))?\]/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = cqRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index)
      if (text) segments.push({ type: 'text', data: { text } })
    }
    const type = match[1]
    const rawParams = match[2] || ''
    const data: Record<string, any> = {}
    if (rawParams) {
      const parts = rawParams.split(',')
      for (const p of parts) {
        const eqIdx = p.indexOf('=')
        if (eqIdx !== -1) {
          const key = p.slice(0, eqIdx).trim()
          const val = p.slice(eqIdx + 1).trim()
          data[key] = val
        }
      }
    }
    segments.push({ type, data })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex)
    if (text) segments.push({ type: 'text', data: { text } })
  }
  return segments
}

/**
 * Format string with double quotes and clean newlines
 */
function quoteStr(val?: string | number): string {
  if (val === undefined || val === null) return '""'
  const str = String(val).replace(/\r\n|\r|\n/g, ' ')
  return JSON.stringify(str)
}

export class GroupHistoryBuffer {
  // groupId -> array of messages
  private buffers = new Map<string, BufferedMessage[]>()

  // Keep a maximum buffer depth per group to prevent memory leak
  private hardCapacity = 300

  // groupId:userId -> member metadata (title, level, etc.)
  private memberMetaCache = new Map<string, { title?: string; level?: string | number; expire: number }>()

  /**
   * Fetch member metadata (title, level) via OneBot API with caching
   */
  async fetchMemberMeta(
    groupId: string | number,
    userId: string | number,
    onebotClient?: any
  ): Promise<{ title?: string; level?: string | number }> {
    const gid = String(groupId)
    const uid = String(userId)
    if (uid === 'bot' || !uid || isNaN(Number(uid))) return {}

    const key = `${gid}:${uid}`
    const cached = this.memberMetaCache.get(key)
    if (cached && Date.now() < cached.expire) {
      return { title: cached.title, level: cached.level }
    }

    const caller = onebotClient?.callAction || onebotClient?.callApi
    if (!caller) return {}

    try {
      const res = await caller.call(onebotClient, 'get_group_member_info', {
        group_id: Number(gid),
        user_id: Number(uid),
        no_cache: false,
      })
      if (res?.data) {
        const title = res.data.title || undefined
        const level = res.data.level || res.data.qq_level || undefined
        this.memberMetaCache.set(key, {
          title,
          level,
          expire: Date.now() + 30 * 60 * 1000, // 30 minutes cache
        })
        return { title, level }
      }
    } catch {}

    return {}
  }

  /**
   * Process and append an incoming OneBot group message to the buffer
   */
  async recordMessage(event: OneBotMessageEvent, onebotClient?: any): Promise<void> {
    if (event.message_type !== 'group' || !event.group_id) return
    const groupId = String(event.group_id)

    const { text: messageText, imageRefs } = await this.formatSegmentsToText(event, onebotClient)
    if (!messageText.trim()) return

    const date = new Date((event.time || Math.floor(Date.now() / 1000)) * 1000)
    const timeStr = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)

    const tokens = estimateTokens(messageText)

    const sender: any = event.sender || {}
    const buffered: BufferedMessage = {
      messageId: event.message_id || event.real_id || Date.now(),
      rawTime: event.time || Math.floor(Date.now() / 1000),
      timeStr,
      userId: String(event.user_id || sender.user_id || 'unknown'),
      nickname: sender.nickname || '',
      card: sender.card || undefined,
      role: sender.role || undefined,
      title: sender.title || undefined,
      level: sender.level || undefined,
      text: messageText,
      tokens,
      imageRefs: imageRefs.length > 0 ? imageRefs : undefined,
    }

    let list = this.buffers.get(groupId)
    if (!list) {
      list = []
      this.buffers.set(groupId, list)
    }

    list.push(buffered)

    // Pre-warm member metadata cache asynchronously
    if (event.user_id && onebotClient) {
      this.fetchMemberMeta(groupId, event.user_id, onebotClient).catch(() => {})
    }

    // Hard ceiling safety
    if (list.length > this.hardCapacity) {
      list.splice(0, list.length - this.hardCapacity)
    }
  }

  /**
   * Format message segments into clean text with ref anchors
   */
  private async formatSegmentsToText(event: OneBotMessageEvent, onebotClient?: any): Promise<{ text: string; imageRefs: string[] }> {
    const rawMsg: any = event.message
    let segments: Array<{ type: string; data?: Record<string, any> }> = []

    if (Array.isArray(rawMsg) && rawMsg.length > 0) {
      segments = rawMsg
    } else if (typeof rawMsg === 'string' && rawMsg.includes('[CQ:')) {
      segments = parseCqMessageToSegments(rawMsg)
    } else if (typeof (event as any).raw_message === 'string' && (event as any).raw_message.includes('[CQ:')) {
      segments = parseCqMessageToSegments((event as any).raw_message)
    } else if (typeof rawMsg === 'string') {
      return { text: rawMsg.replace(/\r\n/g, '\n'), imageRefs: [] }
    }

    const parts: string[] = []
    const imageRefs: string[] = []

    for (const seg of segments) {
      switch (seg.type) {
        case 'text': {
          const txt = (seg as any).data?.text || ''
          if (txt) parts.push(txt)
          break
        }
        case 'at': {
          const qq = String((seg as any).data?.qq)
          parts.push(`@${qq}`)
          break
        }
        case 'image': {
          const url = (seg as any).data?.url || (seg as any).data?.file
          const ref = mediaRefStore.saveImage({
            url,
            file: (seg as any).data?.file,
            groupId: event.group_id,
            senderId: event.user_id,
            messageId: event.message_id,
          })
          imageRefs.push(ref)
          parts.push(`[图片 ref:${ref}]`)
          break
        }
        case 'record': {
          // Voice message
          const duration = Number((seg as any).data?.duration || 0)
          const file = (seg as any).data?.file || (seg as any).data?.url
          const ref = mediaRefStore.saveVoice({
            file,
            url: (seg as any).data?.url,
            duration,
            groupId: event.group_id,
            senderId: event.user_id,
            messageId: event.message_id,
          })
          const durStr = duration > 0 ? ` ${duration}秒` : ''
          parts.push(`[语音${durStr} ref:${ref}]`)
          break
        }
        case 'video': {
          const file = (seg as any).data?.file || (seg as any).data?.url || ''
          const url = (seg as any).data?.url
          let name = (seg as any).data?.name || (seg as any).data?.file_name || ''
          if (!name && typeof file === 'string') {
            const rawName = file.split('/').pop()?.split('?')[0] || ''
            if (rawName && rawName.includes('.')) name = rawName
          }
          const extMatch = name ? name.match(/\.([a-zA-Z0-9]+)$/) : (typeof file === 'string' ? file.match(/\.([a-zA-Z0-9]+)$/) : null)
          const ext = (extMatch ? extMatch[1] : (seg as any).data?.ext || 'mp4').toLowerCase()
          const displayLabel = name || `视频.${ext}`

          const ref = mediaRefStore.saveVideo({
            file,
            url: typeof url === 'string' && url.startsWith('http') ? url : undefined,
            name: displayLabel,
            ext,
            fileSize: Number((seg as any).data?.file_size || (seg as any).data?.size || 0) || undefined,
            groupId: event.group_id,
            senderId: event.user_id,
            messageId: event.message_id,
          })
          parts.push(`[视频:${displayLabel} ref:${ref}]`)
          break
        }
        case 'file': {
          const name = (seg as any).data?.name || (seg as any).data?.file_name || ''
          const file = (seg as any).data?.file || ''
          const fileId = (seg as any).data?.file_id || (seg as any).data?.id || ''
          const url = (seg as any).data?.url
          const size = Number((seg as any).data?.file_size || (seg as any).data?.size || 0) || undefined
          const extMatch = name ? name.match(/\.([a-zA-Z0-9]+)$/) : (typeof file === 'string' ? file.match(/\.([a-zA-Z0-9]+)$/) : null)
          const ext = (extMatch ? extMatch[1] : 'file').toLowerCase()
          const displayLabel = name || (typeof file === 'string' ? file.split('/').pop()?.split('?')[0] : '') || `文件.${ext}`
          const sizeStr = size ? ` (${(size / 1024 / 1024).toFixed(1)}MB)` : ''

          const ref = mediaRefStore.saveFile({
            file,
            fileId,
            url: typeof url === 'string' && url.startsWith('http') ? url : undefined,
            name: displayLabel,
            ext,
            fileSize: size,
            groupId: event.group_id,
            senderId: event.user_id,
            messageId: event.message_id,
          })
          parts.push(`[文件:${displayLabel}${sizeStr} ref:${ref}]`)
          break
        }
        case 'json': {
          const raw = (seg as any).data?.data
          parts.push(parseJsonCard(raw))
          break
        }
        case 'xml': {
          const raw = (seg as any).data?.data
          parts.push(parseXmlCard(raw))
          break
        }
        case 'forward': {
          const forwardId = (seg as any).data?.id
          let preview = ''
          let msgCount = 0

          if (forwardId && onebotClient && typeof onebotClient.callAction === 'function') {
            try {
              const resp = await onebotClient.callAction('get_forward_msg', { id: forwardId })
              const fwdData = resp?.data?.messages || resp?.data
              if (Array.isArray(fwdData)) {
                msgCount = fwdData.length
                const sampleMsgs = fwdData.slice(0, 3).map((m: any, i: number) => {
                  const uid = m.sender?.user_id || m.user_id || m.sender?.uin || m.uin
                  const rawName = (m.sender?.card || m.sender?.nickname || m.nickname || '').replace(/[\s\u3000]+/g, ' ').trim()
                  let sName = rawName
                  if (!sName) {
                    sName = uid ? `QQ ${uid}` : `用户${i + 1}`
                  }
                  let sText = ''
                  if (typeof m.message === 'string') sText = m.message
                  else if (Array.isArray(m.message)) {
                    sText = m.message.map((s: any) => s.data?.text || (s.type === 'image' ? '[图片]' : '')).join('')
                  }
                  sText = (sText || '').replace(/\r\n|\r|\n/g, ' ').trim()
                  return `${sName}: ${sText.slice(0, 40)}`
                })
                preview = sampleMsgs.join('; ')
              }
            } catch {
              // Ignore failure to fetch forward details
            }
          }

          const ref = mediaRefStore.saveForward({
            forwardId: String(forwardId),
            messagesCount: msgCount,
            summary: preview,
            groupId: event.group_id,
            senderId: event.user_id,
            messageId: event.message_id,
          })

          const countStr = msgCount > 0 ? ` (共 ${msgCount} 条)` : ''
          const prevStr = preview ? ` 概要: ${preview}` : ''
          parts.push(`[合并转发${countStr}${prevStr} ref:${ref}]`)
          break
        }
        case 'reply': {
          // Reply segment will be visually clear from conversational context
          break
        }
        default: {
          // Other segments
          break
        }
      }
    }

    let text = parts.join('').replace(/\r\n/g, '\n')
    if (!text.trim() && (event as any).raw_message) {
      text = String((event as any).raw_message).replace(/\r\n/g, '\n')
    }

    return { text, imageRefs }
  }

  /**
   * Build structured group context according to dual-watermark window rules
   */
  async buildContext(
    groupId: string | number,
    options: GroupContextOptions = {},
    excludeMessageId?: string | number,
    onebotClient?: any
  ): Promise<GroupContextResult | null> {
    const gid = String(groupId)
    let list = this.buffers.get(gid) || []

    if (excludeMessageId !== undefined) {
      const exId = String(excludeMessageId)
      list = list.filter((m) => String(m.messageId) !== exId)
    }

    const minMessages = options.minMessages ?? 20
    const minTokens = options.minTokens ?? 2000
    const maxMessages = options.maxMessages ?? 100
    const maxTokens = options.maxTokens ?? 10000

    // Compute total tokens currently in buffer
    let totalTokens = 0
    for (const msg of list) {
      totalTokens += msg.tokens
    }

    // High watermark truncation check:
    // When BOTH maxMessages AND maxTokens thresholds are exceeded, discard oldest items
    if (list.length >= maxMessages && totalTokens >= maxTokens) {
      // Find the cutoff point from end to reset back to minimum watermark
      let rewindTokens = 0
      let rewindCount = 0
      for (let i = list.length - 1; i >= 0; i--) {
        rewindTokens += list[i].tokens
        rewindCount++
        if (rewindCount >= minMessages && rewindTokens >= minTokens) {
          break
        }
      }
      // Drop older messages before the reset point
      const keepIndex = Math.max(0, list.length - rewindCount)
      if (keepIndex > 0) {
        list.splice(0, keepIndex)
      }
    }

    // Now select messages for current prompt context:
    // We want at least minMessages and minTokens (or whatever is accumulated)
    let selectedTokens = 0
    let startIndex = list.length - 1
    let count = 0

    while (startIndex >= 0) {
      selectedTokens += list[startIndex].tokens
      count++
      if (count >= minMessages && selectedTokens >= minTokens) {
        break
      }
      startIndex--
    }

    const effectiveSlice = list.slice(Math.max(0, startIndex))

    // Prefetch missing member metadata (title, level) in parallel
    if (onebotClient && effectiveSlice.length > 0) {
      const uniqueUids = Array.from(new Set(effectiveSlice.map((m) => m.userId)))
      await Promise.all(
        uniqueUids.map((uid) => this.fetchMemberMeta(groupId, uid, onebotClient))
      )
    }

    // 1. Build member roster dictionary
    const config = getConfig()
    const masterUsers = new Set((config?.management?.masterUsers || []).map(String))
    const botUin = String(config?.onebot?.botUin || '')

    // Sanitize speaker name and strip fake system badges
    const getSafeSpeakerName = (card?: string, nickname?: string, userId?: string | number): string => {
      const cleanCard = (card || '').replace(/[\s\u3000]+/g, ' ').trim()
      const cleanNick = (nickname || '').replace(/[\s\u3000]+/g, ' ').trim()
      let raw = cleanCard !== '' ? cleanCard : cleanNick
      if (!raw) {
        return userId ? `QQ ${userId}` : '群友'
      }
      const stripped = raw
        .replace(/\r\n|\r|\n/g, ' ')
        .replace(/\[(主人|群主|群管|群主\/主人|群管\/主人|机器人|Admin|Bot)\]/gi, '')
        .trim()
      return stripped || (userId ? `QQ ${userId}` : '群友')
    }

    const memberMap = new Map<
      string,
      {
        userId: string
        displayName: string
        card?: string
        nickname: string
        roleBadge: string
        roleTitle: string
        title?: string
        level?: string | number
      }
    >()

    const registerMember = (m: {
      userId: string | number
      card?: string
      nickname?: string
      role?: string
      title?: string
      level?: string | number
    }) => {
      const uidStr = String(m.userId)
      if (!uidStr || uidStr === 'unknown') return
      const isMaster = masterUsers.has(uidStr)
      const isBot = uidStr === botUin || m.role === 'bot'

      let roleBadge = ''
      let roleTitle = ''

      if (isBot) {
        roleBadge = '[机器人]'
        roleTitle = '机器人'
      } else if (isMaster) {
        if (m.role === 'owner') {
          roleBadge = '[群主/主人]'
          roleTitle = '群主/主人'
        } else if (m.role === 'admin') {
          roleBadge = '[群管/主人]'
          roleTitle = '群管/主人'
        } else {
          roleBadge = '[主人]'
          roleTitle = '主人'
        }
      } else if (m.role === 'owner') {
        roleBadge = '[群主]'
        roleTitle = '群主'
      } else if (m.role === 'admin') {
        roleBadge = '[群管]'
        roleTitle = '群管'
      }

      const displayName = getSafeSpeakerName(m.card, m.nickname, m.userId)
      const meta = this.memberMetaCache.get(`${gid}:${uidStr}`)

      if (!memberMap.has(uidStr)) {
        memberMap.set(uidStr, {
          userId: uidStr,
          displayName,
          card: m.card,
          nickname: m.nickname || '',
          roleBadge,
          roleTitle,
          title: meta?.title || m.title,
          level: meta?.level || m.level,
        })
      } else {
        const existing = memberMap.get(uidStr)!
        if (!existing.card && m.card) {
          existing.card = m.card
          existing.displayName = getSafeSpeakerName(m.card, existing.nickname, uidStr)
        }
        if (!existing.nickname && m.nickname) existing.nickname = m.nickname
        if (meta?.title) existing.title = meta.title
        else if (!existing.title && m.title) existing.title = m.title
        if (meta?.level) existing.level = meta.level
        else if (!existing.level && m.level) existing.level = m.level
      }
    }

    // Always register currentSender first so model always knows who is asking right now
    if (options.currentSender) {
      registerMember(options.currentSender)
    }

    for (const msg of effectiveSlice) {
      registerMember(msg)
    }

    if (memberMap.size === 0 && effectiveSlice.length === 0) {
      return null
    }

    const memberLines: string[] = []
    for (const m of memberMap.values()) {
      const cardStr = m.card !== undefined && m.card !== null && m.card !== '' ? quoteStr(m.card) : '(无)'
      const nickStr = quoteStr(m.nickname || '')

      const details: string[] = []
      details.push(`QQ: ${m.userId}`)
      if (m.roleTitle) details.push(`角色: ${m.roleTitle}`)
      if (m.title) details.push(`头衔: ${quoteStr(m.title)}`)
      if (m.level) details.push(`等级: Lv.${m.level}`)

      memberLines.push(`- 群名片: ${cardStr}, QQ昵称: ${nickStr} (${details.join(', ')})`)
    }

    // 2. Build concise message stream with verified badges and index/id
    const messageLines: string[] = []
    const recentImageRefs: string[] = []

    // 统计展示名称频次，用于在发言流中对重名群友加注 QQ 唯一消歧
    const nameCounts = new Map<string, number>()
    for (const item of memberMap.values()) {
      const count = nameCounts.get(item.displayName) || 0
      nameCounts.set(item.displayName, count + 1)
    }

    const ephemeralList: EphemeralGroupMessage[] = []
    for (let idx = 0; idx < effectiveSlice.length; idx++) {
      const msg = effectiveSlice[idx]
      const userMeta = memberMap.get(msg.userId)
      let speakerName = userMeta ? userMeta.displayName : getSafeSpeakerName(msg.card, msg.nickname, msg.userId)
      if ((nameCounts.get(speakerName) || 0) > 1 && msg.userId && !speakerName.startsWith('QQ ')) {
        speakerName = `${speakerName}(${msg.userId})`
      }
      const badgeStr = userMeta?.roleBadge ? ` ${userMeta.roleBadge}` : ''

      const seq = idx + 1
      ephemeralList.push({
        seq,
        messageId: msg.messageId,
        userId: msg.userId,
        rawTime: msg.rawTime,
        timeStr: msg.timeStr,
        nickname: msg.nickname,
        card: msg.card,
        role: msg.role,
        text: msg.text,
        imageRefs: msg.imageRefs,
      })

      if (msg.imageRefs && msg.imageRefs.length > 0) {
        for (const ref of msg.imageRefs) {
          if (!recentImageRefs.includes(ref)) {
            recentImageRefs.push(ref)
          }
        }
      }

      // Keep single line per message, escaping inner linebreaks if necessary
      const inlineText = msg.text.replace(/\r\n|\r|\n/g, ' ')
      messageLines.push(`[#${seq} ${msg.timeStr}] ${speakerName}${badgeStr}: ${inlineText}`)
    }

    if (ephemeralList.length > 0) {
      groupMessageRefStore.registerTurn(groupId, ephemeralList)
    }

    const membersBlock = memberLines.length > 0 ? `<chat_members>\n${memberLines.join('\n')}\n</chat_members>` : null
    const messagesBlock = messageLines.length > 0 ? `<group_messages>\n${messageLines.join('\n')}\n</group_messages>` : null

    if (!membersBlock && !messagesBlock) {
      return null
    }

    const fullParts: string[] = []
    if (membersBlock) fullParts.push(membersBlock)
    if (messagesBlock) fullParts.push(messagesBlock)

    return {
      membersBlock,
      messagesBlock,
      recentImageRefs,
      fullText: fullParts.join('\n\n'),
      messageCount: effectiveSlice.length,
      estimatedTokens: selectedTokens,
    }
  }

  /**
   * Append Bot's own response to group buffer so future turns have full conversational context
   */
  recordBotMessage(
    groupId: string | number,
    data: {
      botUin?: string | number
      name?: string
      text: string
      messageId?: string | number
    }
  ): void {
    if (!data.text?.trim()) return
    const gid = String(groupId)
    const date = new Date()
    const timeStr = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
    const tokens = estimateTokens(data.text)

    const buffered: BufferedMessage = {
      messageId: data.messageId || Date.now(),
      rawTime: Math.floor(Date.now() / 1000),
      timeStr,
      userId: String(data.botUin || 'bot'),
      nickname: data.name || 'Bot',
      card: data.name || 'Bot',
      role: 'bot',
      text: data.text.trim(),
      tokens,
    }

    let list = this.buffers.get(gid)
    if (!list) {
      list = []
      this.buffers.set(gid, list)
    }
    list.push(buffered)
    if (list.length > this.hardCapacity) {
      list.splice(0, list.length - this.hardCapacity)
    }
  }

  /**
   * Get recent image refs from group history (chronological order)
   */
  getRecentImageRefs(groupId: string | number, maxCount: number = 3, excludeMessageId?: string | number): string[] {
    const list = this.buffers.get(String(groupId))
    if (!list || list.length === 0 || maxCount <= 0) return []

    const validList = excludeMessageId !== undefined
      ? list.filter(m => String(m.messageId) !== String(excludeMessageId))
      : list

    const collected: string[] = []
    // Scan backwards from newest to oldest
    for (let i = validList.length - 1; i >= 0; i--) {
      const msg = validList[i]
      if (msg.imageRefs && msg.imageRefs.length > 0) {
        // Collect images from the message (reverse within message as well)
        for (let j = msg.imageRefs.length - 1; j >= 0; j--) {
          collected.push(msg.imageRefs[j])
          if (collected.length >= maxCount) break
        }
      }
      if (collected.length >= maxCount) break
    }

    // Return in chronological order so earlier images appear before later images
    return collected.reverse()
  }

  /**
   * Get buffer length for a group
   */
  getBufferCount(groupId: string | number): number {
    return this.buffers.get(String(groupId))?.length || 0
  }

  /**
   * Clear buffer for a group
   */
  clear(groupId: string | number): void {
    this.buffers.delete(String(groupId))
    groupMessageRefStore.clear(groupId)
  }

  /**
   * Clear all group message buffers
   */
  clearAll(): void {
    this.buffers.clear()
    groupMessageRefStore.clearAll()
  }
}

export const groupHistoryBuffer = new GroupHistoryBuffer()
