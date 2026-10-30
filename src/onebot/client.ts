import EventEmitter from 'node:events'
import WebSocket from 'ws'
import {
  OneBotActionResponse,
  OneBotEvent,
  OneBotMessageEvent,
  OneBotSegment,
} from './types.js'

export interface OneBotClientOptions {
  url: string
  accessToken?: string
  reconnectInterval?: number
}

export class OneBotClient extends EventEmitter {
  private ws: WebSocket | null = null
  private options: OneBotClientOptions
  private echoCounter = 0
  private pendingCalls = new Map<string, { resolve: (res: any) => void; reject: (err: any) => void; timer: NodeJS.Timeout }>()
  private isClosedManually = false
  public selfId: number = 0

  constructor(options: OneBotClientOptions) {
    super()
    this.options = {
      reconnectInterval: 5000,
      ...options,
    }
  }

  connect(): void {
    this.isClosedManually = false
    let targetUrl = this.options.url
    if (this.options.accessToken) {
      const sep = targetUrl.includes('?') ? '&' : '?'
      targetUrl = `${targetUrl}${sep}access_token=${encodeURIComponent(this.options.accessToken)}`
    }

    console.log(`[OneBot] Connecting to ${this.options.url}...`)
    this.ws = new WebSocket(targetUrl)

    this.ws.on('open', () => {
      console.log('[OneBot] Connected successfully.')
      this.emit('connected')
      // Fetch bot info
      this.callAction<{ user_id: number; nickname: string }>('get_login_info')
        .then((res) => {
          if (res?.data?.user_id) {
            this.selfId = res.data.user_id
            console.log(`[OneBot] Logged in as: ${res.data.nickname} (${this.selfId})`)
            this.emit('ready', { selfId: this.selfId, nickname: res.data.nickname })
          }
        })
        .catch((err) => {
          console.warn('[OneBot] Failed to get login info:', err.message)
        })
    })

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const text = typeof data === 'string' ? data : data.toString('utf-8')
        const json = JSON.parse(text)
        this.handleIncoming(json)
      } catch (err) {
        console.error('[OneBot] Error parsing message:', err)
      }
    })

    this.ws.on('error', (err) => {
      console.error('[OneBot] WebSocket error:', err.message)
      this.emit('error', err)
    })

    this.ws.on('close', (code, reason) => {
      console.warn(`[OneBot] WebSocket closed (${code}: ${reason.toString() || 'no reason'})`)
      this.ws = null
      this.rejectAllPending(new Error(`WebSocket closed (${code})`))
      this.emit('disconnected', { code, reason })

      if (!this.isClosedManually) {
        setTimeout(() => {
          console.log('[OneBot] Reconnecting...')
          this.connect()
        }, this.options.reconnectInterval)
      }
    })
  }

  close(): void {
    this.isClosedManually = true
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  private handleIncoming(data: Record<string, unknown>): void {
    // Check if this is an action callback (has echo)
    if (data.echo && typeof data.echo === 'string') {
      const pending = this.pendingCalls.get(data.echo)
      if (pending) {
        clearTimeout(pending.timer)
        this.pendingCalls.delete(data.echo)
        if (data.status === 'ok') {
          pending.resolve(data)
        } else {
          pending.reject(new Error(String(data.message || 'OneBot action failed')))
        }
        return
      }
    }

    // Handle events
    if (data.post_type === 'message') {
      this.emit('message', data as unknown as OneBotMessageEvent)
    } else if (data.post_type === 'meta_event') {
      this.emit('meta_event', data)
    } else {
      this.emit('event', data)
    }
  }

  async callAction<T = unknown>(action: string, params: Record<string, unknown> = {}, timeoutMs = 30000): Promise<OneBotActionResponse<T>> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('[OneBot] WebSocket is not connected')
    }

    const echo = `echo_${Date.now()}_${++this.echoCounter}`
    const payload = JSON.stringify({ action, params, echo })

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pendingCalls.has(echo)) {
          this.pendingCalls.delete(echo)
          reject(new Error(`[OneBot] Action "${action}" timed out after ${timeoutMs}ms`))
        }
      }, timeoutMs)

      this.pendingCalls.set(echo, { resolve, reject, timer })
      this.ws!.send(payload, (err) => {
        if (err) {
          clearTimeout(timer)
          this.pendingCalls.delete(echo)
          reject(err)
        }
      })
    })
  }

  private rejectAllPending(err: Error): void {
    for (const [echo, item] of this.pendingCalls.entries()) {
      clearTimeout(item.timer)
      item.reject(err)
    }
    this.pendingCalls.clear()
  }

  async sendGroupMsg(groupId: number, message: OneBotSegment[] | string): Promise<any> {
    return this.callAction('send_group_msg', {
      group_id: groupId,
      message,
    })
  }

  async sendPrivateMsg(userId: number, message: OneBotSegment[] | string): Promise<any> {
    return this.callAction('send_private_msg', {
      user_id: userId,
      message,
    })
  }

  async sendMsg(params: {
    message_type: 'group' | 'private'
    group_id?: number
    user_id?: number
    message: OneBotSegment[] | string
  }): Promise<any> {
    return this.callAction('send_msg', params)
  }

  async sendForwardMsg(params: {
    message_type: 'group' | 'private'
    group_id?: number
    user_id?: number
    messages: Array<{
      type: 'node'
      data: {
        name: string
        uin: string | number
        content: OneBotSegment[] | string
      }
    }>
  }): Promise<any> {
    if (params.message_type === 'group' && params.group_id) {
      return this.callAction('send_group_forward_msg', {
        group_id: params.group_id,
        messages: params.messages,
      })
    } else if (params.user_id) {
      return this.callAction('send_private_forward_msg', {
        user_id: params.user_id,
        messages: params.messages,
      })
    }
  }
}
