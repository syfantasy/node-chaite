import axios from 'axios'
import { spawnSync } from 'child_process'
import {
  UserMessage,
  MessageContent,
  TextContent,
  ImageContent,
  AudioContent,
  ReasoningContent,
  ModelResponse,
} from '../core/index.js'
import {
  OneBotMessageEvent,
  OneBotSegment,
  OneBotSegmentText,
  OneBotSegmentImage,
} from './types.js'
import { mediaRefStore } from './refStore.js'

export interface ConvertOptions {
  botUin?: number
  toggleMode?: 'at' | 'prefix' | 'both'
  togglePrefix?: string
  maxRecentImages?: number
  onebot?: any
}

export function detectSupportedImageMime(buffer: Buffer): string {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) return ''
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') return 'image/png'
  const head = buffer.toString('ascii', 0, Math.min(buffer.length, 12))
  if (head.startsWith('GIF87a') || head.startsWith('GIF89a')) return 'image/gif'
  if (head.startsWith('RIFF') && head.slice(8, 12) === 'WEBP') return 'image/webp'
  return ''
}

/**
 * Extract the first frame of an animated GIF without any external dependencies.
 * Slices the GIF stream right after the first image data block and appends a trailer byte (0x3B).
 * Produces a fully valid static GIF containing the exact first frame with original palette.
 */
export function extractFirstFrameFromGif(buffer: Buffer): Buffer | null {
  if (!Buffer.isBuffer(buffer) || buffer.length < 13) return null
  const header = buffer.toString('ascii', 0, 6)
  if (header !== 'GIF87a' && header !== 'GIF89a') return null

  try {
    let pos = 13 // Header (6) + Logical Screen Descriptor (7)
    const packed = buffer[10]
    const hasGct = (packed & 0x80) !== 0
    if (hasGct) {
      const gctSize = 3 * (1 << ((packed & 0x07) + 1))
      pos += gctSize
    }

    let firstFrameEnd = -1

    while (pos < buffer.length) {
      const blockType = buffer[pos]
      if (blockType === 0x3b) {
        break
      } else if (blockType === 0x21) {
        pos++ // skip 0x21
        pos++ // skip extension type
        while (pos < buffer.length) {
          const blockSize = buffer[pos++]
          if (blockSize === 0) break
          pos += blockSize
        }
      } else if (blockType === 0x2c) {
        pos++ // skip 0x2C
        pos += 8 // skip Left (2), Top (2), Width (2), Height (2)
        const imgPacked = buffer[pos++]
        const hasLct = (imgPacked & 0x80) !== 0
        if (hasLct) {
          const lctSize = 3 * (1 << ((imgPacked & 0x07) + 1))
          pos += lctSize
        }
        pos++ // skip LZW minimum code size
        while (pos < buffer.length) {
          const blockSize = buffer[pos++]
          if (blockSize === 0) break
          pos += blockSize
        }
        firstFrameEnd = pos
        break
      } else {
        break
      }
    }

    if (firstFrameEnd > 0 && firstFrameEnd <= buffer.length) {
      return Buffer.concat([
        buffer.subarray(0, firstFrameEnd),
        Buffer.from([0x3b]),
      ])
    }
  } catch {}

  return null
}

/**
 * Try compressing an animated GIF while preserving motion using gifsicle.
 * - Stage 1: gifsicle lossy + resize fit 360x360
 * - Stage 2: frame skipping if still oversized
 * Returns compressed Buffer if <= maxBytes, or null if failed or still oversized.
 */
export function compressAnimatedGif(buffer: Buffer, maxBytes = 1.2 * 1024 * 1024): Buffer | null {
  try {
    const res = spawnSync('gifsicle', ['-O3', '--lossy=80', '--resize-fit', '360x360', '--colors', '128'], {
      input: buffer,
      maxBuffer: 25 * 1024 * 1024,
      timeout: 6000,
    })
    if (res.status === 0 && res.stdout && res.stdout.length > 0) {
      if (res.stdout.length <= maxBytes) {
        return res.stdout
      }
      // If still above maxBytes, try frame-skipping (take every 2nd frame)
      const resSkip = spawnSync('gifsicle', ['-O3', '--lossy=100', '--resize-fit', '300x300', '--colors', '64', '-U', '#0-99/2'], {
        input: res.stdout,
        maxBuffer: 25 * 1024 * 1024,
        timeout: 6000,
      })
      if (resSkip.status === 0 && resSkip.stdout && resSkip.stdout.length > 0 && resSkip.stdout.length <= maxBytes) {
        return resSkip.stdout
      }
    }
  } catch (err: any) {
    // gifsicle missing or errored
  }
  return null
}

/**
 * Multi-stage GIF optimization:
 * 1. If buffer <= targetMaxBytes, return original as-is.
 * 2. If > targetMaxBytes, attempt animated GIF compression preserving motion.
 * 3. If compression fails or still oversized, fall back to static 1st frame extraction.
 */
export function optimizeGifBuffer(
  buffer: Buffer,
  targetMaxBytes = 1.2 * 1024 * 1024
): { buffer: Buffer; method: 'original' | 'compressed_anim' | 'first_frame' } {
  if (buffer.length <= targetMaxBytes) {
    return { buffer, method: 'original' }
  }

  // Attempt 1: Compress while keeping animation
  const compressed = compressAnimatedGif(buffer, targetMaxBytes)
  if (compressed && compressed.length <= targetMaxBytes) {
    return { buffer: compressed, method: 'compressed_anim' }
  }

  // Attempt 2: Extract 1st frame
  const frame1 = extractFirstFrameFromGif(buffer)
  if (frame1) {
    return { buffer: frame1, method: 'first_frame' }
  }

  return { buffer, method: 'original' }
}

function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  const dimensions = (width: number, height: number) => (width > 0 && height > 0 ? { width, height } : null)
  switch (detectSupportedImageMime(buffer)) {
    case 'image/png':
      return buffer.length >= 24 && buffer.toString('ascii', 12, 16) === 'IHDR'
        ? dimensions(buffer.readUInt32BE(16), buffer.readUInt32BE(20))
        : null
    case 'image/gif':
      return buffer.length >= 10 ? dimensions(buffer.readUInt16LE(6), buffer.readUInt16LE(8)) : null
    case 'image/jpeg': {
      let offset = 2
      while (offset < buffer.length) {
        if (buffer[offset++] !== 0xff) return null
        while (buffer[offset] === 0xff) offset++
        if (offset >= buffer.length) return null
        const marker = buffer[offset++]
        if (marker === 0xd9 || marker === 0xda) return null
        if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue
        if (offset + 2 > buffer.length) return null
        const length = buffer.readUInt16BE(offset)
        if (length < 2 || offset + length > buffer.length) return null
        if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
          return length >= 8 ? dimensions(buffer.readUInt16BE(offset + 5), buffer.readUInt16BE(offset + 3)) : null
        }
        offset += length
      }
      return null
    }
    case 'image/webp': {
      for (let offset = 12; offset + 8 <= buffer.length; ) {
        const type = buffer.toString('ascii', offset, offset + 4)
        const length = buffer.readUInt32LE(offset + 4)
        const data = offset + 8
        if (data + length > buffer.length) return null
        if (type === 'VP8X' && length >= 10)
          return dimensions(buffer.readUIntLE(data + 4, 3) + 1, buffer.readUIntLE(data + 7, 3) + 1)
        if (type === 'VP8 ' && length >= 10 && buffer.toString('hex', data + 3, data + 6) === '9d012a') {
          return dimensions(buffer.readUInt16LE(data + 6) & 0x3fff, buffer.readUInt16LE(data + 8) & 0x3fff)
        }
        if (type === 'VP8L' && length >= 5 && buffer[data] === 0x2f) {
          const bits = buffer.readUInt32LE(data + 1)
          return dimensions((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1)
        }
        offset = data + length + (length % 2)
      }
      return null
    }
    default:
      return null
  }
}

/**
 * Convert OneBot message to Chaite UserMessage
 */
export async function oneBotToUserMessage(
  event: OneBotMessageEvent,
  options: ConvertOptions = {}
): Promise<{
  userMessage: UserMessage
  isAtBot: boolean
  rawText: string
  cleanText: string
}> {
  const maxRecentImages = typeof options.maxRecentImages === 'number' ? options.maxRecentImages : 3

  const segments = Array.isArray(event.message) ? event.message : []
  const contents: Array<TextContent | ImageContent | AudioContent> = []

  let isAtBot = false
  let rawText = ''
  const imageSegments: OneBotSegmentImage[] = []

  // 0. Quoted / reply message resolution
  let quotedPrefix = ''
  const replySeg = segments.find((seg) => seg.type === 'reply')
  if (replySeg && options.onebot) {
    const quotedMsgId = (replySeg as any).data?.id
    if (quotedMsgId) {
      try {
        const quotedResp = await options.onebot.callAction('get_msg', { message_id: Number(quotedMsgId) })
        const quotedData = quotedResp?.data
        if (quotedData && Array.isArray(quotedData.message)) {
          let quotedText = ''
          for (const qSeg of quotedData.message) {
            if (qSeg.type === 'text') {
              quotedText += qSeg.data?.text || ''
            } else if (qSeg.type === 'image') {
              imageSegments.push(qSeg as OneBotSegmentImage)
            } else if (qSeg.type === 'video') {
              const file = (qSeg as any).data?.file || (qSeg as any).data?.url || ''
              const url = (qSeg as any).data?.url
              let name = (qSeg as any).data?.name || (qSeg as any).data?.file_name || ''
              if (!name && typeof file === 'string') {
                const rawName = file.split('/').pop()?.split('?')[0] || ''
                if (rawName && rawName.includes('.')) name = rawName
              }
              const extMatch = name ? name.match(/\.([a-zA-Z0-9]+)$/) : (typeof file === 'string' ? file.match(/\.([a-zA-Z0-9]+)$/) : null)
              const ext = (extMatch ? extMatch[1] : (qSeg as any).data?.ext || 'mp4').toLowerCase()
              const displayLabel = name || `视频.${ext}`
              const ref = mediaRefStore.saveVideo({
                file,
                url: typeof url === 'string' && url.startsWith('http') ? url : undefined,
                name: displayLabel,
                ext,
                fileSize: Number((qSeg as any).data?.file_size || (qSeg as any).data?.size || 0) || undefined,
              })
              quotedText += ` [视频:${displayLabel} ref:${ref}] `
            } else if (qSeg.type === 'record') {
              const file = (qSeg as any).data?.file || (qSeg as any).data?.url || ''
              const url = (qSeg as any).data?.url
              const duration = Number((qSeg as any).data?.duration || (qSeg as any).data?.seconds || 0)
              const ref = mediaRefStore.saveVoice({
                file,
                url: typeof url === 'string' && url.startsWith('http') ? url : undefined,
                duration: duration || undefined,
              })
              const durStr = duration > 0 ? ` (${duration}秒)` : ''
              quotedText += ` [语音${durStr} ref:${ref}] `
            } else if (qSeg.type === 'forward') {
              const forwardId = (qSeg as any).data?.id || ''
              const ref = mediaRefStore.saveForward({
                forwardId,
                summary: '合并转发聊天记录',
              })
              quotedText += ` [聊天记录 ref:${ref}] `
            } else if (qSeg.type === 'file') {
              const name = (qSeg as any).data?.name || (qSeg as any).data?.file_name || ''
              const file = (qSeg as any).data?.file || ''
              const fileId = (qSeg as any).data?.file_id || (qSeg as any).data?.id || ''
              const url = (qSeg as any).data?.url
              const size = Number((qSeg as any).data?.file_size || (qSeg as any).data?.size || 0) || undefined
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
              })
              quotedText += ` [文件:${displayLabel}${sizeStr} ref:${ref}] `
            }
          }
          if (quotedText.trim()) {
            quotedPrefix = `[引用消息: "${quotedText.trim()}"]\n`
          }
        }
      } catch (err: any) {
        console.warn(`[Message] Failed to fetch quoted message ${quotedMsgId}:`, err.message)
      }
    }
  }

  // 1. First pass: extract text and collect all image segments
  for (const seg of segments) {
    if (seg.type === 'at') {
      const qq = String((seg as any).data?.qq)
      if (options.botUin && qq === String(options.botUin)) {
        isAtBot = true
      } else {
        rawText += ` @${qq} `
      }
    } else if (seg.type === 'text') {
      rawText += (seg as OneBotSegmentText).data?.text || ''
    } else if (seg.type === 'image') {
      imageSegments.push(seg as OneBotSegmentImage)
    } else if (seg.type === 'video') {
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
      rawText += ` [视频:${displayLabel} ref:${ref}] `
    } else if (seg.type === 'file') {
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
      rawText += ` [文件:${displayLabel}${sizeStr} ref:${ref}] `
    } else if (seg.type === 'record') {
      const file = (seg as any).data?.file || (seg as any).data?.url || ''
      const url = (seg as any).data?.url
      const duration = Number((seg as any).data?.duration || (seg as any).data?.seconds || 0)
      const ref = mediaRefStore.saveVoice({
        file,
        url: typeof url === 'string' && url.startsWith('http') ? url : undefined,
        duration: duration || undefined,
        groupId: event.group_id,
        senderId: event.user_id,
        messageId: event.message_id,
      })
      const durStr = duration > 0 ? ` (${duration}秒)` : ''
      rawText += ` [语音${durStr} ref:${ref}] `
    } else if (seg.type === 'forward') {
      const forwardId = (seg as any).data?.id || ''
      let summary = '合并转发聊天记录'
      let previewMessages: any[] = []
      if (forwardId && options.onebot) {
        try {
          const fwdRes = await options.onebot.callAction('get_forward_msg', { id: forwardId })
          const list = fwdRes?.data?.messages || []
          previewMessages = list.slice(0, 10).map((m: any) => ({
            senderName: m.sender?.nickname || m.sender?.name || '用户',
            text: Array.isArray(m.message) ? m.message.map((s: any) => s.data?.text || '').join('') : (typeof m.message === 'string' ? m.message : ''),
          }))
          summary = `共 ${list.length} 条记录`
        } catch {}
      }
      const ref = mediaRefStore.saveForward({
        forwardId,
        summary,
        previewMessages,
        groupId: event.group_id,
        senderId: event.user_id,
        messageId: event.message_id,
      })
      const previewStr = previewMessages.length > 0 ? ` 摘要: ${previewMessages.slice(0, 3).map((p: any) => `${p.senderName}: ${p.text}`).join('; ')}...` : ''
      rawText += ` [聊天记录:${summary}${previewStr} ref:${ref}] `
    }
  }

  // 2. Second pass: limit images to recent maxRecentImages
  // Older images are downgraded to [图片 ref:xxx]
  const recentStartIndex = Math.max(0, imageSegments.length - maxRecentImages)

  for (let idx = 0; idx < imageSegments.length; idx++) {
    const seg = imageSegments[idx]
    const url = seg.data?.url || seg.data?.file
    const refId = (url || `img_${idx}`).slice(-8)

    if (idx < recentStartIndex) {
      // Exceeded recent image cap -> downgrade to placeholder
      rawText += ` [图片 ref:${refId}（历史图片已转为引用）] `
      continue
    }

    if (url && url.startsWith('http')) {
      try {
        const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 })
        let buf = Buffer.from(resp.data)
        const mimeType = detectSupportedImageMime(buf) || String(resp.headers['content-type'] || 'image/jpeg')

        if (mimeType === 'image/gif' && buf.length > 1.2 * 1024 * 1024) {
          const opt = optimizeGifBuffer(buf, 1.2 * 1024 * 1024)
          if (opt.method === 'compressed_anim') {
            console.log(
              `[Message] Compressed animated GIF (${(buf.length / 1024 / 1024).toFixed(2)}MB -> ${(opt.buffer.length / 1024).toFixed(1)}KB) preserving motion`
            )
            buf = opt.buffer
          } else if (opt.method === 'first_frame') {
            console.log(
              `[Message] Optimized large GIF (${(buf.length / 1024 / 1024).toFixed(2)}MB -> ${(opt.buffer.length / 1024).toFixed(1)}KB) by first-frame fallback`
            )
            buf = opt.buffer
          }
        }

        if (buf.length > 2.5 * 1024 * 1024) {
          console.warn(`[Message] Skipping oversized image (${(buf.length / 1024 / 1024).toFixed(2)}MB > 2.5MB) to avoid payload rejection`)
          rawText += ` [图片过大已略过: ${refId}] `
          continue
        }

        const base64 = buf.toString('base64')
        contents.push({
          type: 'image',
          image: base64,
          mimeType,
        })
      } catch (err: any) {
        console.warn(`[Message] Failed to download image ${url}:`, err.message)
        rawText += ` [图片下载失败: ${refId}] `
      }
    } else if (url && url.startsWith('base64://')) {
      const dataStr = url.replace('base64://', '')
      const buf = Buffer.from(dataStr, 'base64')
      contents.push({
        type: 'image',
        image: dataStr,
        mimeType: detectSupportedImageMime(buf) || 'image/jpeg',
      })
    }
  }

  let cleanText = rawText.trim()
  const fullPromptText = quotedPrefix ? `${quotedPrefix}${cleanText}` : cleanText
  if (fullPromptText) {
    contents.unshift({
      type: 'text',
      text: fullPromptText,
    })
  }

  return {
    userMessage: {
      role: 'user',
      content: contents,
    },
    isAtBot,
    rawText,
    cleanText,
  }
}

/**
 * Split text into chunks to comply with QQ platform length limits
 */
export function splitTextIntoChunks(text: string, maxLength = 1500): string[] {
  if (text.length <= maxLength) return [text]

  const chunks: string[] = []
  const lines = text.split('\n')
  let current = ''

  for (const line of lines) {
    if ((current + '\n' + line).length > maxLength) {
      if (current) {
        chunks.push(current.trim())
        current = ''
      }
      if (line.length > maxLength) {
        // Line itself exceeds maxLength, split hard
        for (let i = 0; i < line.length; i += maxLength) {
          chunks.push(line.slice(i, i + maxLength))
        }
      } else {
        current = line
      }
    } else {
      current = current ? `${current}\n${line}` : line
    }
  }

  if (current.trim()) {
    chunks.push(current.trim())
  }

  return chunks
}

/**
 * Format Chaite ModelResponse into packets that comply with QQ constraints:
 * - Text chunks and media (image/audio) are separated into individual messages.
 * - Text chunks are limited to maxMessageLength.
 */
export function formatModelResponse(
  response: ModelResponse,
  replyMessageId?: number,
  maxLength = 1500,
  ignoreReasoning = false
): OneBotSegment[][] {
  const packets: OneBotSegment[][] = []

  let combinedText = ''
  let reasoningText = ''
  const mediaSegments: OneBotSegment[] = []

  for (const item of response.contents) {
    if (item.type === 'text') {
      combinedText += (item as TextContent).text || ''
    } else if (item.type === 'reasoning') {
      reasoningText += (item as ReasoningContent).text || ''
    } else if (item.type === 'image') {
      const img = (item as ImageContent).image
      const fileData = img.startsWith('http') ? img : (img.startsWith('base64://') ? img : `base64://${img}`)
      mediaSegments.push({
        type: 'image',
        data: { file: fileData },
      })
    }
  }

  let fullText = combinedText.trim()
  if (!ignoreReasoning && reasoningText && !fullText) {
    fullText = `💭 思考过程:\n${reasoningText.trim()}`
  }

  if (fullText) {
    const textChunks = splitTextIntoChunks(fullText, maxLength)
    for (let i = 0; i < textChunks.length; i++) {
      const segs: OneBotSegment[] = []
      // Add reply quote only to the very first text chunk
      if (i === 0 && replyMessageId) {
        segs.push({
          type: 'reply',
          data: { id: replyMessageId },
        })
      }
      segs.push({
        type: 'text',
        data: { text: textChunks[i] },
      })
      packets.push(segs)
    }
  }

  // QQ Platform constraint: Images must NOT be sent simultaneously in the same message with text
  // So each image is sent as a standalone packet
  for (const media of mediaSegments) {
    packets.push([media])
  }

  return packets
}
