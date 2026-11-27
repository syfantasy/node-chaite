import { CustomTool, Chaite, ChaiteContext, createClient } from 'chaite'

export default class AskAboutImage extends CustomTool {
  constructor() {
    super()
    this.name = 'ask_about_image'
    this.function = {
      name: 'ask_about_image',
      description: `查看并描述聊天上下文中的图片原图（在上下文中以 [图片 ref:xxx] 标记显示）。

【核心使用规范】：
1. 若当前对话中你已经能直接看清图片内容和文字细节，请直接作答，不要多此一举调用本工具。
2. 本工具适用于以下两种情况：
   - 上下文中的图片因压缩导致小字模糊、拍屏反光或细节看不清，需要查看【原图高清细节】；
   - 因上下文长度截断等原因看不到画面、仅在文本流中看到 [图片 ref:xxx] 占位符，或当前模型无直接识图能力。
3. 默认直接发送原图；若调用时因图片体积或分辨率超出模型限制而报错，请根据返回的报错信息传入 maxDimension（如 2048、1600、1280）和/或 quality（如 80、70）压缩后重试。`,
      parameters: {
        type: 'object',
        properties: {
          ref: {
            type: 'string',
            description: '图片引用 ID，即上下文 [图片 ref:xxx] 标记中的 xxx（例如 img_19c89e66）。'
          },
          question: {
            type: 'string',
            description: '你想了解这张图片的哪个具体方面（如"图中的小字写了什么"、"拍屏里的报错信息是什么"等）。留空则获得整体画面描述。'
          },
          maxDimension: {
            type: 'number',
            description: '可选。限制图片长边最大像素（如 2048、1600、1280）。默认不传以发送原图；仅当原图超出模型规格报错时传入此参数压缩重试。'
          },
          quality: {
            type: 'number',
            description: '可选。JPEG 压缩质量（1-100，默认 80），仅在传入 maxDimension 时生效。'
          }
        },
        required: ['ref']
      }
    }
  }

  async run(args, context) {
    const { ref, question, maxDimension, quality } = args || {}
    if (!ref) {
      return '错误：未提供 ref 参数。请从上下文 [图片 ref:xxx] 标记中获取有效的 ref。'
    }

    const cleanRef = String(ref).trim().replace(/^ref:/i, '').replace(/^\[|\]$/g, '')

    const store = globalThis.mediaRefStore
    if (!store) {
      return '系统错误：媒体引用存储未就绪。'
    }

    try {
      const onebot = globalThis.onebotClient
      const resolveOpts = maxDimension && Number(maxDimension) > 0
        ? {
            maxDimension: Math.round(Number(maxDimension)),
            quality: quality && Number(quality) > 0 ? Math.min(100, Math.max(1, Math.round(Number(quality)))) : 80
          }
        : { raw: true }
      const resolved = await store.resolveImage(cleanRef, onebot, resolveOpts)
      if (!resolved || !resolved.base64) {
        return `未在缓存中找到图片 ${cleanRef}，该图片可能已过期（默认保留2小时）或 ref 不存在。`
      }

      // 1. 尝试使用当前上下文的客户端（如果当前模型具备视觉能力）
      const client = context?.getClient?.()
      const currentFeatures = client?.features || []
      const currentCanVision = Array.isArray(currentFeatures) && currentFeatures.includes('visual')

      const queryText = question ? `针对这张图片，请回答：${question}` : '请详细描述这张图片的内容和画面细节。'
      const imagePayload = {
        role: 'user',
        content: [
          { type: 'image', image: resolved.base64, mimeType: resolved.mimeType },
          { type: 'text', text: queryText }
        ]
      }
      const activeModel = context?.getOptions?.()?.model || client?.model || 'gemini-2.5-flash'
      const callOptions = {
        model: activeModel,
        disableHistoryRead: true,
        disableHistorySave: true,
        toolChoice: { type: 'none' }
      }

      if (currentCanVision && typeof client.sendMessage === 'function') {
        const response = await client.sendMessage(imagePayload, callOptions)
        const text = response?.contents?.filter(c => c.type === 'text').map(c => c.text).join('\n')
        return text || '识图已完成，但未返回文字描述。'
      }

      // 2. 如果当前模型没有视觉能力，自动在系统中寻找具有 visual 能力的可用渠道
      const chaite = context?.getChaite?.() || Chaite.getInstance()
      const channelsManager = chaite?.getChannelsManager?.()
      if (channelsManager) {
        const allChannels = await channelsManager.getAllChannels()
        const visionChannel = allChannels.find(c =>
          c.status === 'enabled' && c.models?.some(m => m.features?.includes('visual'))
        )

        if (visionChannel) {
          const visualModel = visionChannel.models?.find(m => m.features?.includes('visual'))
          if (visualModel) {
            await visionChannel.ready()
            const modelName = visualModel.name
            const subContext = new ChaiteContext(chaite.getLogger?.())
            subContext.setChaite(chaite)

            const subClient = createClient(visionChannel.adapterType, visionChannel.getOptionsForModel(modelName), subContext)
            const response = await subClient.sendMessage(imagePayload, {
              ...callOptions,
              model: modelName
            })
            const text = response?.contents?.filter(c => c.type === 'text').map(c => c.text).join('\n')
            return text || '独立视觉渠道已完成识图，但未返回文字描述。'
          }
        }
      }

      // 3. 兜底尝试当前 client
      if (client && typeof client.sendMessage === 'function') {
        const response = await client.sendMessage(imagePayload, callOptions)
        const text = response?.contents?.filter(c => c.type === 'text').map(c => c.text).join('\n')
        return text || '识图已完成，但未返回文字描述。'
      }

      return `已找到图片 ${cleanRef}（MIME: ${resolved.mimeType}），但系统无可用视觉模型处理该图片。`
    } catch (err) {
      const msg = String(err?.message || err || '')
      return `查看图片失败：${msg}\n（提示：若因图片体积或分辨率超出当前模型限制而报错，请根据报错信息传入 maxDimension（如 2048、1600、1280）和/或 quality（如 80、70）重新调用 ask_about_image 压缩后查看。）`
    }
  }
}
