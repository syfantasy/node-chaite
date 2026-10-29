import WebSocket from 'ws'

function parseTextAndCQ(text) {
  const segments = []
  if (!text) return segments

  const cqRegex = /\[CQ:([a-zA-Z0-9_-]+)((?:,[a-zA-Z0-9_-]+=[^,\]]*)*)\]/g
  let lastIndex = 0
  let match

  while ((match = cqRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const pureText = text.slice(lastIndex, match.index)
      if (pureText) {
        segments.push({ type: 'text', data: { text: pureText } })
      }
    }

    const type = match[1]
    const rawParams = match[2]
    const data = {}

    if (rawParams) {
      const paramPairs = rawParams.slice(1).split(',')
      for (const pair of paramPairs) {
        const eqIdx = pair.indexOf('=')
        if (eqIdx !== -1) {
          const k = pair.slice(0, eqIdx).trim()
          let v = pair.slice(eqIdx + 1).trim()
          v = v.replace(/&#91;/g, '[').replace(/&#93;/g, ']').replace(/&#44;/g, ',').replace(/&amp;/g, '&')
          data[k] = v
        }
      }
    }

    segments.push({ type, data })
    lastIndex = cqRegex.lastIndex
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex)
    if (remaining) {
      segments.push({ type: 'text', data: { text: remaining } })
    }
  }

  return segments
}

function buildMessageSegments(event, content) {
  const segments = []

  const needReply = typeof content === 'object' ? content.reply !== false : true
  if (needReply && event.message_id) {
    segments.push({ type: 'reply', data: { id: event.message_id } })
  }

  if (typeof content === 'object' && content.at) {
    const atTarget = content.at === true ? event.user_id : content.at
    segments.push({ type: 'at', data: { qq: String(atTarget) } })
    segments.push({ type: 'text', data: { text: ' ' } })
  }

  const rawText = typeof content === 'string' ? content : (content.text || '')
  if (rawText) {
    const parsedSegs = parseTextAndCQ(rawText)
    segments.push(...parsedSegs)
  }

  if (typeof content === 'object' && Array.isArray(content.images)) {
    for (const img of content.images) {
      if (img) {
        segments.push({ type: 'image', data: { file: img } })
      }
    }
  }

  return segments
}

export default function setup(ctx) {
  const getCfg = () => ctx.config || {}
  let ws = null
  let isClosed = false
  let selfId = 0
  let echoCounter = 0
  const pendingCalls = new Map()

  function getWsUrl() {
    const cfg = getCfg()
    let url = cfg.wsUrl || 'ws://127.0.0.1:3001'
    if (cfg.token) {
      const sep = url.includes('?') ? '&' : '?'
      url = `${url}${sep}access_token=${encodeURIComponent(cfg.token)}`
    }
    return url
  }

  function callAction(action, params = {}, timeoutMs = 30000) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('[Adapter-OneBot] WebSocket 未连接'))
    }

    const echo = `echo_${Date.now()}_${++echoCounter}`
    const payload = JSON.stringify({ action, params, echo })

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (pendingCalls.has(echo)) {
          pendingCalls.delete(echo)
          reject(new Error(`[Adapter-OneBot] Action "${action}" 超时`))
        }
      }, timeoutMs)

      pendingCalls.set(echo, { resolve, reject, timer })
      try {
        ws.send(payload)
      } catch (err) {
        clearTimeout(timer)
        pendingCalls.delete(echo)
        reject(err)
      }
    })
  }

  async function sendPacket(event, content) {
    const message = buildMessageSegments(event, content)
    return callAction('send_msg', {
      message_type: event.message_type,
      group_id: event.group_id,
      user_id: event.user_id,
      message,
    })
  }

  function handleMessageEvent(event) {
    const cfg = getCfg()

    // 提取文本与清洗 @
    let text = ''
    let rawText = event.raw_message || ''
    const images = []

    if (Array.isArray(event.message)) {
      for (const seg of event.message) {
        if (seg.type === 'text') {
          text += seg.data?.text || ''
        } else if (seg.type === 'image') {
          images.push({
            url: seg.data?.url || seg.data?.file || '',
            file: seg.data?.file,
          })
        }
      }
    } else if (typeof event.message === 'string') {
      text = event.message
    }

    // 清洗掉 @ 当前机器人的 CQ 码
    const currentBotUin = cfg.botUin || selfId
    if (currentBotUin) {
      const atRegex = new RegExp(`\\[CQ:at,qq=${currentBotUin}\\]`, 'gi')
      text = text.replace(atRegex, '').trim()
    }

    const chaiteEvent = {
      userId: event.user_id,
      groupId: event.group_id || null,
      isGroup: event.message_type === 'group',
      isPrivate: event.message_type === 'private',
      text: text.trim(),
      rawText,
      sender: {
        userId: event.user_id,
        nickname: event.sender?.nickname || '',
        card: event.sender?.card || '',
        role: event.sender?.role,
        title: event.sender?.title,
        level: event.sender?.level,
      },
      images,
      raw: event,
      reply: (content) => sendPacket(event, content),
    }

    ctx.emitMessage(chaiteEvent).catch((err) => {
      ctx.logger.error('消息派发异常:', err)
    })
  }

  function connect() {
    if (isClosed) return
    const cfg = getCfg()
    const url = getWsUrl()
    ctx.logger.info(`正在连接 OneBot 协议端: ${url}`)

    try {
      const wsOptions = {}
      if (cfg.token) {
        wsOptions.headers = {
          Authorization: `Bearer ${cfg.token}`,
        }
      }
      ws = new WebSocket(url, wsOptions)
    } catch (err) {
      ctx.logger.error('创建 WebSocket 失败:', err.message)
      scheduleReconnect()
      return
    }

    ws.on('open', () => {
      ctx.logger.info('OneBot 协议端连接成功！')
      callAction('get_login_info')
        .then((res) => {
          if (res?.data?.user_id) {
            selfId = res.data.user_id
            ctx.logger.info(`当前登录账号: ${res.data.nickname || ''} (${selfId})`)
          }
        })
        .catch((e) => ctx.logger.warn('获取登录信息失败:', e.message))
    })

    ws.on('message', (data) => {
      try {
        const text = typeof data === 'string' ? data : data.toString('utf-8')
        const payload = JSON.parse(text)

        if (payload.echo && pendingCalls.has(payload.echo)) {
          const item = pendingCalls.get(payload.echo)
          clearTimeout(item.timer)
          pendingCalls.delete(payload.echo)
          if (payload.status === 'ok') {
            item.resolve(payload)
          } else {
            item.reject(new Error(payload.message || 'OneBot Action error'))
          }
          return
        }

        if (payload.post_type === 'message') {
          handleMessageEvent(payload)
        }
      } catch (err) {
        ctx.logger.error('解析 OneBot 数据包失败:', err)
      }
    })

    ws.on('error', (err) => {
      ctx.logger.error('WebSocket 连接出错:', err.message)
    })

    ws.on('close', (code, reason) => {
      ctx.logger.warn(`OneBot 连接关闭 (${code}: ${reason?.toString() || '无说明'})`)
      ws = null
      for (const [echo, item] of pendingCalls.entries()) {
        clearTimeout(item.timer)
        item.reject(new Error(`WebSocket 已断开 (${code})`))
      }
      pendingCalls.clear()
      scheduleReconnect()
    })
  }

  function scheduleReconnect() {
    if (isClosed) return
    const interval = getCfg().reconnectInterval || 3000
    setTimeout(() => {
      if (!isClosed && !ws) {
        connect()
      }
    }, interval)
  }

  connect()

  // 注册全局适配器 API
  ctx.registerAdapter('onebot', {
    callAction,
    sendMsg: sendPacket,
    getSelfId: () => selfId,
  })

  // 资源清理
  ctx.onDestroy(() => {
    isClosed = true
    if (ws) {
      ctx.logger.info('正在断开 OneBot WebSocket 连接...')
      try { ws.close() } catch {}
      ws = null
    }
  })
}
