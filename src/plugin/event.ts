import { Chaite, createClient, ChaiteContext } from '../core'
import { groupHistoryBuffer } from '../context/groupHistoryBuffer'
import { OneBotMessageEvent } from '../onebot/types'

export interface SenderInfo {
  userId: number | string
  nickname: string
  card?: string
  role?: string
  title?: string
  level?: number
}

export interface ImageAttachment {
  ref?: string
  url?: string
  mimeType?: string
  base64?: string
}

export interface QueryAIOptions {
  /**
   * 方式 1: 指定走某个预设 (预设已绑定好渠道与人设)
   */
  presetId?: string

  /**
   * 方式 2: 纯净基元对话（不走任何预设，直接连渠道模型，零预设人设污染）
   */
  pure?: boolean
  channelId?: string
  model?: string
  systemPrompt?: string
  temperature?: number
}

export type ReplyContent =
  | string
  | {
      text?: string
      at?: boolean | string | number
      images?: string[]
      reply?: boolean
    }

export class ChaiteEvent {
  readonly userId: number | string
  readonly groupId: number | null
  readonly text: string
  readonly rawText: string
  readonly sender: SenderInfo
  readonly images: ImageAttachment[]
  readonly raw: any

  private replyHandler: (content: ReplyContent) => Promise<any>

  constructor(params: {
    userId: number | string
    groupId: number | null
    text: string
    rawText: string
    sender: SenderInfo
    images?: ImageAttachment[]
    raw: any
    replyHandler: (content: ReplyContent) => Promise<any>
  }) {
    this.userId = params.userId
    this.groupId = params.groupId
    this.text = params.text
    this.rawText = params.rawText
    this.sender = params.sender
    this.images = params.images || []
    this.raw = params.raw
    this.replyHandler = params.replyHandler
  }

  get isGroup(): boolean {
    return this.groupId !== null && this.groupId !== undefined
  }

  get isPrivate(): boolean {
    return !this.isGroup
  }

  /**
   * 统一回复消息（支持纯文本、内嵌 CQ 码自动转换、或结构化参数如 { text, at: true, images }）
   */
  async reply(content: ReplyContent): Promise<any> {
    return this.replyHandler(content)
  }

  /**
   * 直接调用 AI 模型回答（单轮问答）
   * - 支持指定预设 (presetId) 自动映射渠道
   * - 支持纯净基元模式 (pure: true 或指定 channelId)，完全跳过预设人设，直接向底层模型请求
   */
  async queryAI(prompt: string, options?: QueryAIOptions): Promise<string> {
    const chaite = Chaite.getInstance()
    const storageCtx = (globalThis as any).chaiteStorageCtx
    const channelsManager = chaite.getChannelsManager()

    // 判定是否走纯净基元对话（不经过任何预设人设）：
    const isPure = Boolean(options?.pure || options?.channelId || (options?.systemPrompt && !options?.presetId))

    if (isPure) {
      let targetChannel: any = null
      if (options?.channelId) {
        const all = await channelsManager.getAllChannels()
        targetChannel = all.find((c: any) => c.id === options.channelId)
      }

      const modelName = options?.model || (targetChannel?.models?.[0]?.name) || 'gpt-4o-mini'

      if (!targetChannel) {
        const channels = await channelsManager.getChannelByModel(modelName)
        targetChannel = channels?.find((c: any) => c.status === 'enabled') || channels?.[0]
      }

      if (!targetChannel) {
        const allChannels = await channelsManager.getAllChannels()
        targetChannel = allChannels.find((c: any) => c.status === 'enabled') || allChannels[0]
      }

      if (!targetChannel) {
        throw new Error(`找不到可用的 AI 渠道进行基元调用`)
      }

      const clientOptions = targetChannel.getOptionsForModel(modelName)
      await clientOptions.ready()

      const context = new ChaiteContext(chaite.getLogger())
      const client = createClient(targetChannel.adapterType, clientOptions, context)

      const messages: any[] = []
      if (options?.systemPrompt) {
        messages.push({
          role: 'system',
          content: [{ type: 'text', text: options.systemPrompt }],
        })
      }
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: prompt }],
      })

      const sendOpt: any = {
        model: modelName,
        temperature: options?.temperature !== undefined ? options.temperature : 0.7,
      }

      const resp = await client.sendMessageWithHistory(messages, sendOpt)
      const text = resp?.content
        ?.filter((c: any) => c.type === 'text')
        ?.map((c: any) => c.text)
        ?.join('') || ''

      return text
    }

    // 走预设模式：
    let preset: any = null
    if (options?.presetId) {
      preset = await storageCtx?.presetManager?.getPresetById(options.presetId)
    } else {
      preset = await chaite.getUserModeSelector().getChatPreset({
        sender: { user_id: Number(this.userId) },
        group: this.groupId ? { group_id: Number(this.groupId) } : undefined,
      } as any)
    }

    const modelName = options?.model || preset?.sendMessageOption?.model
    const channels = await channelsManager.getChannelByModel(modelName)
    const channel = channels?.find((c: any) => c.status === 'enabled') || channels?.[0]
    if (!channel) {
      throw new Error(`找不到可用于模型 "${modelName}" 的有效渠道`)
    }

    const clientOptions = channel.getOptionsForModel(modelName)
    await clientOptions.ready()

    const context = new ChaiteContext(chaite.getLogger())
    const client = createClient(channel.adapterType, clientOptions, context)

    const messages: any[] = []
    if (preset?.presetPrompt) {
      messages.push({
        role: 'system',
        content: [{ type: 'text', text: preset.presetPrompt }],
      })
    }
    messages.push({
      role: 'user',
      content: [{ type: 'text', text: prompt }],
    })

    const sendOpt = {
      ...preset?.sendMessageOption,
      model: modelName,
      temperature: options?.temperature !== undefined ? options.temperature : preset?.sendMessageOption?.temperature,
    }

    const resp = await client.sendMessageWithHistory(messages, sendOpt)
    const text = resp?.content
      ?.filter((c: any) => c.type === 'text')
      ?.map((c: any) => c.text)
      ?.join('') || ''

    return text
  }

  /**
   * 携带当前群聊上下文向 AI 发问
   */
  async askWithContext(prompt: string, options?: QueryAIOptions): Promise<string> {
    let contextStream = ''
    if (this.groupId) {
      try {
        const stream = await groupHistoryBuffer.buildContext(
          this.groupId,
          {},
          (this.raw as OneBotMessageEvent)?.message_id
        )
        if (stream) {
          contextStream = stream
        }
      } catch (e) {
        console.warn('[ChaiteEvent] Failed to build context stream:', e)
      }
    }
    const combinedPrompt = contextStream
      ? `${contextStream}\n\n[用户在当前讨论中的提问]: ${prompt}`
      : prompt

    return this.queryAI(combinedPrompt, options)
  }
}
