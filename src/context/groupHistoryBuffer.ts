import { estimateTokens } from './tokenEstimator.js'
import { parseJsonCard, parseXmlCard } from './cardParser.js'
import { mediaRefStore } from '../onebot/refStore.js'
import { OneBotMessageEvent, OneBotSegment } from '../onebot/types.js'
import { getConfig } from '../config.js'

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
  /** 生效主人列表（宿主注入，如 Yunzai masterQQ），用于花名册 [主人] 徽标；缺省回退面板配置 */
  masterUsers?: (string | number)[]
  /**
   * 是否在流水行首输出流动序号 `[#N HH:mm]`。默认 true。
   * 普通对话需要去掉序号（`[HH:mm]`），伪人模式仍保留序号以便短引用定位。
   */
  includeSeqIndex?: boolean
  /** 允许插件或调用方自定义单条花名册的格式 */
  transformRosterItem?: (member: any, defaultStr: string) => string
  /** 允许插件或调用方过滤群聊流水条目 */
  filterFlow?: (msg: any) => boolean
  /** 允许插件或调用方自定义单条流水发言的格式 */
  transformFlowItem?: (msg: any, defaultStr: string) => string
}

export interface GroupContextResult {
  membersBlock: string | null
  messagesBlock: string | null
  recentImageRefs: string[]
  fullText: string
  messageCount: number
  estimatedTokens: number
  /**
   * 流水里是否已包含「本轮触发消息」。
   * 仅当缓冲池里除本轮消息外没有任何其它发言时（如机器人在本群重启后的首次触发），
   * 才会退化为把本轮消息也放进流水，避免整个 `<group_messages>` 块缺失。
   */
  includesCurrentMessage: boolean
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

  public getMessages(groupId: string | number): EphemeralGroupMessage[] {
    const gid = String(groupId)
    const seqMap = this.turnRefs.get(gid)
    if (!seqMap) return []
    return Array.from(seqMap.values())
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
  /**
   * 去重指纹。
   * 宿主（如 chatgpt-plugin）会先调 /api/bridge/record 预记录一次，随后触发对话时
   * handleMessage 又记录一次，同一条消息被写两遍（表现为流水里每条发言成对出现，
   * 且本轮消息既在流水里又在末尾重复）。有 message_id 时按 id 去重，缺失时退化为
   * 「发送者 + 时间 + 文本前缀」指纹。
   */
  dedupeKey?: string
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
  replyMsgId?: string | number
  quotedPrefix?: string
}

export function parseCqMessageToSegments(content: string): Array<{ type: string; data: Record<string, any> }> {
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
 * 解析合并转发消息中的单条消息节点，将文本及多媒体（图片、视频、文件、语音）提取并生成对应 ref
 */
export function parseForwardNodeToText(
  node: any,
  meta?: { groupId?: number | string; messageId?: number | string }
): { senderName: string; text: string; imageRefs: string[] } {
  const uid = node.sender?.user_id || node.user_id || node.sender?.uin || node.uin
  const rawName = (node.sender?.card || node.sender?.nickname || node.nickname || '').replace(/[\s\u3000]+/g, ' ').trim()
  let senderName = rawName
  if (!senderName) {
    senderName = uid ? `QQ ${uid}` : '群友'
  }

  const rawMsg = node.message ?? node.content ?? node.raw_message ?? ''
  let segments: Array<{ type: string; data?: Record<string, any> }> = []
  if (Array.isArray(rawMsg)) {
    segments = rawMsg
  } else if (typeof rawMsg === 'string' && rawMsg.includes('[CQ:')) {
    segments = parseCqMessageToSegments(rawMsg)
  } else if (typeof rawMsg === 'string') {
    segments = [{ type: 'text', data: { text: rawMsg } }]
  }

  const parts: string[] = []
  const imageRefs: string[] = []

  for (const seg of segments) {
    switch (seg.type) {
      case 'text': {
        const txt = seg.data?.text || ''
        if (txt) parts.push(txt)
        break
      }
      case 'at': {
        const qq = String(seg.data?.qq || '')
        parts.push(`@${qq}`)
        break
      }
      case 'image': {
        const url = seg.data?.url || seg.data?.file
        const file = seg.data?.file
        const ref = mediaRefStore.saveImage({
          url: typeof url === 'string' && url.startsWith('http') ? url : undefined,
          file: typeof file === 'string' ? file : undefined,
          groupId: meta?.groupId,
          senderId: uid,
          messageId: meta?.messageId,
        })
        imageRefs.push(ref)
        parts.push(`[图片 ref:${ref}]`)
        break
      }
      case 'video': {
        const file = seg.data?.file || seg.data?.url || ''
        const url = seg.data?.url
        let name = seg.data?.name || seg.data?.file_name || ''
        if (!name && typeof file === 'string') {
          const rawName = file.split('/').pop()?.split('?')[0] || ''
          if (rawName && rawName.includes('.')) name = rawName
        }
        const extMatch = name ? name.match(/\.([a-zA-Z0-9]+)$/) : (typeof file === 'string' ? file.match(/\.([a-zA-Z0-9]+)$/) : null)
        const ext = (extMatch ? extMatch[1] : seg.data?.ext || 'mp4').toLowerCase()
        const displayLabel = name || `视频.${ext}`

        const ref = mediaRefStore.saveVideo({
          file: typeof file === 'string' ? file : undefined,
          url: typeof url === 'string' && url.startsWith('http') ? url : undefined,
          name: displayLabel,
          ext,
          fileSize: Number(seg.data?.file_size || seg.data?.size || 0) || undefined,
          groupId: meta?.groupId,
          senderId: uid,
          messageId: meta?.messageId,
        })
        parts.push(`[视频:${displayLabel} ref:${ref}]`)
        break
      }
      case 'file': {
        const name = seg.data?.name || seg.data?.file_name || ''
        const file = seg.data?.file || ''
        const fileId = seg.data?.file_id || seg.data?.id || ''
        const url = seg.data?.url
        const size = Number(seg.data?.file_size || seg.data?.size || 0) || undefined
        const extMatch = name ? name.match(/\.([a-zA-Z0-9]+)$/) : (typeof file === 'string' ? file.match(/\.([a-zA-Z0-9]+)$/) : null)
        const ext = (extMatch ? extMatch[1] : 'file').toLowerCase()
        const displayLabel = name || (typeof file === 'string' ? file.split('/').pop()?.split('?')[0] : '') || `文件.${ext}`
        const sizeStr = size ? ` (${(size / 1024 / 1024).toFixed(1)}MB)` : ''

        const ref = mediaRefStore.saveFile({
          file: typeof file === 'string' ? file : undefined,
          fileId: typeof fileId === 'string' ? fileId : undefined,
          url: typeof url === 'string' && url.startsWith('http') ? url : undefined,
          name: displayLabel,
          ext,
          fileSize: size,
          groupId: meta?.groupId,
          senderId: uid,
          messageId: meta?.messageId,
        })
        parts.push(`[文件:${displayLabel}${sizeStr} ref:${ref}]`)
        break
      }
      case 'record': {
        const duration = Number(seg.data?.duration || seg.data?.seconds || 0)
        const file = seg.data?.file || seg.data?.url
        const ref = mediaRefStore.saveVoice({
          file: typeof file === 'string' ? file : undefined,
          url: typeof seg.data?.url === 'string' && seg.data.url.startsWith('http') ? seg.data.url : undefined,
          duration: duration || undefined,
          groupId: meta?.groupId,
          senderId: uid,
          messageId: meta?.messageId,
        })
        const durStr = duration > 0 ? ` ${duration}秒` : ''
        parts.push(`[语音${durStr} ref:${ref}]`)
        break
      }
      case 'face':
      case 'mface':
      case 'sface': {
        parts.push('[表情]')
        break
      }
      default: {
        break
      }
    }
  }

  let text = parts.join('').replace(/\r\n/g, '\n').trim()
  if (!text && typeof rawMsg === 'string') {
    text = rawMsg.trim()
  }
  return { senderName, text: text || '[空消息]', imageRefs }
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
  private memberMetaCache = new Map<string, { title?: string; level?: string | number; age?: number; sex?: string; expire: number }>()

  /**
   * Fetch member metadata (title, level) via OneBot API with caching
   */
  async fetchMemberMeta(
    groupId: string | number,
    userId: string | number,
    onebotClient?: any
  ): Promise<{ title?: string; level?: string | number; age?: number; sex?: string }> {
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
        const age = res.data.age !== undefined && res.data.age !== null ? Number(res.data.age) : undefined
        const sex = res.data.sex || undefined
        this.memberMetaCache.set(key, {
          title,
          level,
          age,
          sex,
          expire: Date.now() + 30 * 60 * 1000, // 30 minutes cache
        })
        return { title, level, age, sex }
      }
    } catch {}

    return {}
  }

  private pinMessageRefs(msg: BufferedMessage): void {
    if (msg.imageRefs && msg.imageRefs.length > 0) {
      for (const ref of msg.imageRefs) {
        mediaRefStore.pin(ref)
      }
    }
    const textRefs = mediaRefStore.extractRefsFromText(msg.text)
    for (const ref of textRefs) {
      mediaRefStore.pin(ref)
    }
    if (msg.quotedPrefix) {
      const qRefs = mediaRefStore.extractRefsFromText(msg.quotedPrefix)
      for (const ref of qRefs) {
        mediaRefStore.pin(ref)
      }
    }
  }

  private unpinMessageRefs(msg: BufferedMessage): void {
    if (msg.imageRefs && msg.imageRefs.length > 0) {
      for (const ref of msg.imageRefs) {
        mediaRefStore.unpin(ref)
      }
    }
    const textRefs = mediaRefStore.extractRefsFromText(msg.text)
    for (const ref of textRefs) {
      mediaRefStore.unpin(ref)
    }
    if (msg.quotedPrefix) {
      const qRefs = mediaRefStore.extractRefsFromText(msg.quotedPrefix)
      for (const ref of qRefs) {
        mediaRefStore.unpin(ref)
      }
    }
  }

  /**
   * 解析消息中的引用回复，返回双轨前缀（流水内回复 vs 远古历史引用）及新捕获的多媒体
   */
  public async resolveQuotePrefix(
    groupId: string | number,
    replyMsgId: string | number,
    onebotClient?: any
  ): Promise<{ prefix: string; newImageRefs: string[] }> {
    const gid = String(groupId)
    const newImageRefs: string[] = []
    const list = this.buffers.get(gid) || []

    // 1. 优先检查是否命中当前流水缓冲池中的消息
    const inBufferIdx = list.findIndex(m => String(m.messageId) === String(replyMsgId))
    if (inBufferIdx >= 0) {
      const target = list[inBufferIdx]
      const targetAuthor = target.card || target.nickname || `QQ ${target.userId}`
      return {
        prefix: `(回复 @${targetAuthor})`,
        newImageRefs,
      }
    }

    // 2. 未命中流水，尝试通过协议端拉取远古历史消息
    if (onebotClient && typeof onebotClient.callAction === 'function') {
      try {
        const resp = await onebotClient.callAction('get_msg', { message_id: Number(replyMsgId) })
        const qData = resp?.data
        if (qData) {
          const qSender = qData.sender || {}
          const qAuthor = qSender.card || qSender.nickname || (qSender.user_id ? `QQ ${qSender.user_id}` : '某人')
          let summary = ''
          const qSegs = Array.isArray(qData.message)
            ? qData.message
            : parseCqMessageToSegments(String(qData.raw_message || qData.message || ''))

          for (const s of qSegs) {
            if (s.type === 'text') {
              summary += s.data?.text || ''
            } else if (s.type === 'image') {
              const url = s.data?.url || s.data?.file
              const ref = mediaRefStore.saveImage({
                url,
                file: s.data?.file,
                groupId: gid,
                senderId: qSender.user_id,
                messageId: replyMsgId,
              })
              newImageRefs.push(ref)
              summary += ` [图片 ref:${ref}] `
            } else if (s.type === 'record') {
              const dur = Number(s.data?.duration || 0)
              summary += ` [语音${dur > 0 ? ` ${dur}秒` : ''}] `
            } else if (s.type === 'video') {
              const vName = s.data?.name || s.data?.file_name || '视频'
              summary += ` [视频: ${vName}] `
            } else if (s.type === 'file') {
              const fName = s.data?.name || s.data?.file_name || '文件'
              summary += ` [文件: ${fName}] `
            } else if (s.type === 'forward') {
              const fwdId = s.data?.id
              let fwdSummary = '合并转发'
              if (fwdId && typeof onebotClient?.callAction === 'function') {
                try {
                  const fResp = await onebotClient.callAction('get_forward_msg', { id: fwdId })
                  const fData = fResp?.data?.messages || fResp?.data
                  if (Array.isArray(fData)) {
                    const samples = fData.slice(0, 3).map((node: any) => {
                      const p = parseForwardNodeToText(node, { groupId: gid, messageId: replyMsgId })
                      if (p.imageRefs.length > 0) newImageRefs.push(...p.imageRefs)
                      return `${p.senderName}: ${p.text.slice(0, 30)}`
                    })
                    fwdSummary = `合并转发(${fData.length}条: ${samples.join('; ')})`
                  }
                } catch {}
              }
              summary += ` [${fwdSummary}] `
            }
          }

          summary = summary.replace(/\r\n|\r|\n/g, ' ').trim()
          if (summary.length > 70) summary = summary.slice(0, 70) + '...'
          return {
            prefix: `(引用历史 @${qAuthor}: ${summary || '[消息]'})`,
            newImageRefs,
          }
        }
      } catch (err: any) {
        console.warn(`[GroupHistoryBuffer] Failed to resolve remote quoted message ${replyMsgId}:`, err?.message || err)
      }
    }

    return {
      prefix: `(引用消息 ${replyMsgId})`,
      newImageRefs,
    }
  }

  /**
   * Process and append an incoming OneBot group message to the buffer
   */
  async recordMessage(event: OneBotMessageEvent, onebotClient?: any): Promise<void> {
    if (event.message_type !== 'group' || !event.group_id) return
    const groupId = String(event.group_id)

    const { text: messageText, imageRefs, replyMsgId } = await this.formatSegmentsToText(event, onebotClient)
    if (!messageText.trim()) return

    let quotedPrefix: string | undefined = undefined
    if (replyMsgId) {
      const qRes = await this.resolveQuotePrefix(groupId, replyMsgId, onebotClient)
      if (qRes.prefix) {
        quotedPrefix = qRes.prefix
      }
      if (qRes.newImageRefs && qRes.newImageRefs.length > 0) {
        imageRefs.push(...qRes.newImageRefs)
      }
    }

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
      replyMsgId,
      quotedPrefix,
    }

    const rawMsgId = (event as any).message_id ?? (event as any).real_id
    buffered.dedupeKey = rawMsgId !== undefined && rawMsgId !== null && String(rawMsgId) !== ''
      ? `id:${String(rawMsgId)}`
      : `fp:${buffered.userId}|${buffered.rawTime}|${messageText.slice(0, 80)}`

    let list = this.buffers.get(groupId)
    if (!list) {
      list = []
      this.buffers.set(groupId, list)
    }

    // 同一条消息可能从 bridge/record 与 handleMessage 两条路径各进来一次
    if (list.some((m) => m.dedupeKey === buffered.dedupeKey)) {
      return
    }

    list.push(buffered)
    this.pinMessageRefs(buffered)

    // Pre-warm member metadata cache asynchronously
    if (event.user_id && onebotClient) {
      this.fetchMemberMeta(groupId, event.user_id, onebotClient).catch(() => {})
    }

    // Hard ceiling safety
    if (list.length > this.hardCapacity) {
      const removed = list.splice(0, list.length - this.hardCapacity)
      for (const m of removed) {
        this.unpinMessageRefs(m)
      }
    }
  }

  /**
   */
  private async formatSegmentsToText(event: OneBotMessageEvent, onebotClient?: any): Promise<{ text: string; imageRefs: string[]; replyMsgId?: string | number }> {
    const rawMsg: any = event.message
    let segments: Array<{ type: string; data?: Record<string, any> }> = []

    if (Array.isArray(rawMsg) && rawMsg.length > 0) {
      segments = rawMsg
    } else if (typeof rawMsg === 'string' && rawMsg.includes('[CQ:')) {
      segments = parseCqMessageToSegments(rawMsg)
    } else if (typeof (event as any).raw_message === 'string' && (event as any).raw_message.includes('[CQ:')) {
      segments = parseCqMessageToSegments((event as any).raw_message)
    } else if (typeof rawMsg === 'string') {
      let replyMsgId: string | number | undefined = undefined
      const cqMatch = rawMsg.match(/\[CQ:reply,id=(\d+)\]/)
      if (cqMatch) replyMsgId = cqMatch[1]
      return { text: rawMsg.replace(/\r\n/g, '\n'), imageRefs: [], replyMsgId }
    }

    const parts: string[] = []
    const imageRefs: string[] = []
    let replyMsgId: string | number | undefined = undefined

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
          const previewMessages: Array<{ senderName: string; text: string }> = []

          if (forwardId && onebotClient && typeof onebotClient.callAction === 'function') {
            try {
              const resp = await onebotClient.callAction('get_forward_msg', { id: forwardId })
              const fwdData = resp?.data?.messages || resp?.data
              if (Array.isArray(fwdData)) {
                msgCount = fwdData.length
                const sampleNodes = fwdData.slice(0, 10)
                const sampleStrs: string[] = []
                for (const node of sampleNodes) {
                  const parsed = parseForwardNodeToText(node, {
                    groupId: event.group_id,
                    messageId: event.message_id,
                  })
                  if (parsed.imageRefs.length > 0) {
                    imageRefs.push(...parsed.imageRefs)
                  }
                  previewMessages.push({
                    senderName: parsed.senderName,
                    text: parsed.text,
                  })
                  const shortText = parsed.text.length > 50 ? parsed.text.slice(0, 50) + '...' : parsed.text
                  sampleStrs.push(`${parsed.senderName}: ${shortText}`)
                }
                preview = sampleStrs.slice(0, 3).join('; ')
              }
            } catch {
              // Ignore failure to fetch forward details
            }
          }

          const ref = mediaRefStore.saveForward({
            forwardId: String(forwardId),
            messagesCount: msgCount,
            summary: preview,
            previewMessages,
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
          const rId = (seg as any).data?.id || (seg as any).data?.message_id
          if (rId) {
            replyMsgId = String(rId)
          }
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
    // Final check for replyId if segments didn't pick it up
    if (!replyMsgId && (event as any).raw_message) {
      const cqMatch = String((event as any).raw_message).match(/\[CQ:reply,id=(\d+)\]/)
      if (cqMatch) replyMsgId = cqMatch[1]
    }

    return { text, imageRefs, replyMsgId }
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
    const rawList = this.buffers.get(gid) || []
    let list = rawList
    let includesCurrentMessage = false

    if (excludeMessageId !== undefined) {
      const exId = String(excludeMessageId)
      const filtered = rawList.filter((m) => String(m.messageId) !== exId && m.dedupeKey !== `id:${exId}`)
      // 兜底：若排除本轮消息后流水为空（机器人在本群重启后的首次触发、或本群只有这一条），
      // 则保留本轮消息——否则 <group_messages> 整块缺失，模型完全看不到群聊上下文。
      if (filtered.length === 0 && rawList.length > 0) {
        list = rawList
        includesCurrentMessage = true
      } else {
        list = filtered
      }
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
    const effectiveMasters = Array.isArray(options.masterUsers) && options.masterUsers.length > 0
      ? options.masterUsers
      : (config?.management?.masterUsers || [])
    const masterUsers = new Set(effectiveMasters.map(String))
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
        age?: number
        sex?: string
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
          age: (meta as any)?.age ?? (m as any)?.age,
          sex: (meta as any)?.sex ?? (m as any)?.sex,
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
        if ((meta as any)?.age !== undefined) (existing as any).age = (meta as any).age
        if ((meta as any)?.sex !== undefined) (existing as any).sex = (meta as any).sex
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
      if ((m as any).age !== undefined && (m as any).age !== null) details.push(`年龄: ${(m as any).age}岁`)
      if ((m as any).sex && (m as any).sex !== 'unknown') {
        const sexText = (m as any).sex === 'male' ? '男' : (m as any).sex === 'female' ? '女' : (m as any).sex
        details.push(`性别: ${sexText}`)
      }

      let line = `- 群名片: ${cardStr}, QQ昵称: ${nickStr} (${details.join(', ')})`
      if (typeof options.transformRosterItem === 'function') {
        try {
          line = options.transformRosterItem(m, line) || line
        } catch (e: any) {
          console.warn('[GroupHistoryBuffer] transformRosterItem error:', e.message)
        }
      }
      memberLines.push(line)
    }

    // 2. Build concise message stream with verified badges and index/id
    const messageLines: string[] = []
    const recentImageRefs: string[] = []
    // 普通对话不展示流动序号，仅保留时间；伪人模式保留 [#N] 以便短引用
    const includeSeqIndex = options.includeSeqIndex === undefined ? true : Boolean(options.includeSeqIndex)

    // 统计展示名称频次，用于在发言流中对重名群友加注 QQ 唯一消歧
    const nameCounts = new Map<string, number>()
    for (const item of memberMap.values()) {
      const count = nameCounts.get(item.displayName) || 0
      nameCounts.set(item.displayName, count + 1)
    }

    const ephemeralList: EphemeralGroupMessage[] = []
    for (let idx = 0; idx < effectiveSlice.length; idx++) {
      const msg = effectiveSlice[idx]
      if (typeof options.filterFlow === 'function') {
        try {
          if (!options.filterFlow(msg)) continue
        } catch {}
      }
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

      // 检查当前消息是否引用了其他消息
      let replyPrefixStr = ''
      if (msg.replyMsgId) {
        const targetIdx = effectiveSlice.findIndex(m => String(m.messageId) === String(msg.replyMsgId))
        if (targetIdx >= 0) {
          const targetSeq = targetIdx + 1
          const targetMsg = effectiveSlice[targetIdx]
          const targetUserMeta = memberMap.get(targetMsg.userId)
          const targetName = targetUserMeta ? targetUserMeta.displayName : getSafeSpeakerName(targetMsg.card, targetMsg.nickname, targetMsg.userId)
          replyPrefixStr = `(回复 #${targetSeq} @${targetName}) `
        } else if (msg.quotedPrefix) {
          replyPrefixStr = `${msg.quotedPrefix} `
        }
      } else if (msg.quotedPrefix) {
        replyPrefixStr = `${msg.quotedPrefix} `
      }

      // Keep single line per message, escaping inner linebreaks if necessary
      const inlineText = msg.text.replace(/\r\n|\r|\n/g, ' ')
      const seqPrefix = includeSeqIndex ? `#${seq} ` : ''
      let formattedMsgLine = `[${seqPrefix}${msg.timeStr}] ${speakerName}${badgeStr}: ${replyPrefixStr}${inlineText}`
      if (typeof options.transformFlowItem === 'function') {
        try {
          formattedMsgLine = options.transformFlowItem(msg, formattedMsgLine) || formattedMsgLine
        } catch {}
      }
      messageLines.push(formattedMsgLine)
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
    if (messagesBlock) fullParts.push(messagesBlock)
    if (membersBlock) fullParts.push(membersBlock)

    return {
      membersBlock,
      messagesBlock,
      recentImageRefs,
      fullText: fullParts.join('\n\n'),
      messageCount: effectiveSlice.length,
      estimatedTokens: selectedTokens,
      includesCurrentMessage,
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
   * Append custom/action message (e.g. poke, system notice, plugin action) to group buffer
   */
  recordCustomMessage(
    groupId: string | number,
    data: {
      userId?: string | number
      nickname?: string
      card?: string
      role?: string
      text: string
      messageId?: string | number
      time?: number
    }
  ): void {
    if (!data.text?.trim()) return
    const gid = String(groupId)
    const date = data.time ? new Date(data.time * 1000) : new Date()
    const timeStr = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
    const tokens = estimateTokens(data.text)

    const buffered: BufferedMessage = {
      messageId: data.messageId || Date.now(),
      rawTime: data.time || Math.floor(Date.now() / 1000),
      timeStr,
      userId: String(data.userId || 'action'),
      nickname: data.nickname || '',
      card: data.card || '',
      role: data.role || 'member',
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
   * 获取指定群近期的结构化聊天流水列表
   */
  getRecentMessages(groupId: string | number, limit: number = 30): BufferedMessage[] {
    const list = this.buffers.get(String(groupId)) || []
    return list.slice(-limit)
  }

  /**
   * 获取指定群近期排版格式化好的聊天流水文本
   */
  getFormattedHistory(groupId: string | number, limit: number = 30): string {
    const list = this.getRecentMessages(groupId, limit)
    if (list.length === 0) return ''
    return list
      .map((m) => {
        const name = m.card || m.nickname || String(m.userId)
        const titlePart = m.title ? `[${m.title}] ` : ''
        const timePart = m.timeStr ? `[${m.timeStr}] ` : ''
        return `${timePart}${titlePart}${name}(${m.userId}): ${m.text}`
      })
      .join('\n')
  }

  /**
   * Clear buffer for a group
   */
  clear(groupId: string | number): void {
    const gid = String(groupId)
    const list = this.buffers.get(gid)
    if (list) {
      for (const m of list) {
        this.unpinMessageRefs(m)
      }
    }
    this.buffers.delete(gid)
    groupMessageRefStore.clear(groupId)
  }

  /**
   * Clear all group message buffers
   */
  clearAll(): void {
    for (const list of this.buffers.values()) {
      for (const m of list) {
        this.unpinMessageRefs(m)
      }
    }
    this.buffers.clear()
    groupMessageRefStore.clearAll()
  }
}

export const groupHistoryBuffer = new GroupHistoryBuffer()
