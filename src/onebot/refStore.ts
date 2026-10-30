import crypto from 'node:crypto'
import fs from 'node:fs'
import axios from 'axios'
import { detectSupportedImageMime, optimizeGifBuffer } from './message.js'

export type RefType = 'voice' | 'forward' | 'image' | 'video' | 'file'

export interface BaseRefData {
  id: string
  ref: string
  type: RefType
  createdAt: number
  groupId?: number | string
  senderId?: number | string
  messageId?: number | string
}

export interface VoiceRefData extends BaseRefData {
  type: 'voice'
  file?: string
  url?: string
  duration?: number
}

export interface ForwardRefData extends BaseRefData {
  type: 'forward'
  forwardId: string
  summary?: string
  messagesCount?: number
  previewMessages?: Array<{
    senderName: string
    time?: string
    text: string
  }>
}

export interface ImageRefData extends BaseRefData {
  type: 'image'
  url?: string
  file?: string
  base64?: string
  mimeType?: string
}

export interface VideoRefData extends BaseRefData {
  type: 'video'
  file?: string
  url?: string
  name?: string
  ext?: string
  fileSize?: number
}

export interface FileRefData extends BaseRefData {
  type: 'file'
  file?: string
  fileId?: string
  url?: string
  name?: string
  ext?: string
  fileSize?: number
}

export type RefData = VoiceRefData | ForwardRefData | ImageRefData | VideoRefData | FileRefData | BaseRefData

class MediaRefStore {
  private store = new Map<string, RefData>()
  private maxItems = 1000
  private ttlMs = 2 * 60 * 60 * 1000 // 2 hours

  private generateShortId(): string {
    return crypto.randomBytes(4).toString('hex')
  }

  saveVoice(data: Omit<VoiceRefData, 'id' | 'ref' | 'type' | 'createdAt'>): string {
    this.cleanup()
    const id = this.generateShortId()
    const ref = `voice_${id}`
    const record: VoiceRefData = {
      ...data,
      id,
      ref,
      type: 'voice',
      createdAt: Date.now(),
    }
    this.store.set(ref, record)
    return ref
  }

  saveForward(data: Omit<ForwardRefData, 'id' | 'ref' | 'type' | 'createdAt'>): string {
    this.cleanup()
    const id = this.generateShortId()
    const ref = `fwd_${id}`
    const record: ForwardRefData = {
      ...data,
      id,
      ref,
      type: 'forward',
      createdAt: Date.now(),
    }
    this.store.set(ref, record)
    return ref
  }

  saveImage(data: Omit<ImageRefData, 'id' | 'ref' | 'type' | 'createdAt'>): string {
    this.cleanup()
    const id = this.generateShortId()
    const ref = `img_${id}`
    const record: ImageRefData = {
      ...data,
      id,
      ref,
      type: 'image',
      createdAt: Date.now(),
    }
    this.store.set(ref, record)
    return ref
  }

  saveVideo(data: Omit<VideoRefData, 'id' | 'ref' | 'type' | 'createdAt'>): string {
    this.cleanup()
    const id = this.generateShortId()
    const ref = `vid_${id}`
    const record: VideoRefData = {
      ...data,
      id,
      ref,
      type: 'video',
      createdAt: Date.now(),
    }
    this.store.set(ref, record)
    return ref
  }

  saveFile(data: Omit<FileRefData, 'id' | 'ref' | 'type' | 'createdAt'>): string {
    this.cleanup()
    const id = this.generateShortId()
    const ref = `file_${id}`
    const record: FileRefData = {
      ...data,
      id,
      ref,
      type: 'file',
      createdAt: Date.now(),
    }
    this.store.set(ref, record)
    return ref
  }

  /**
   * Resolve media (video, file, etc.) downloadable URL or local path
   */
  async resolveMedia(ref: string, onebotClient?: any): Promise<{ url?: string; file?: string; name?: string; ext?: string } | null> {
    const item = this.get(ref)
    if (!item) return null

    if (item.type === 'video') {
      const v = item as VideoRefData
      let url = v.url
      if (!url && v.file?.startsWith('http')) {
        url = v.file
      }
      if (!url && onebotClient && v.file) {
        try {
          const res = await onebotClient.send('get_file', { file_id: v.file })
          if (res?.data?.url) url = res.data.url
          else if (res?.data?.file) return { file: res.data.file, name: v.name, ext: v.ext }
        } catch {}
      }
      return { url, file: v.file, name: v.name, ext: v.ext }
    }

    if (item.type === 'file') {
      const f = item as FileRefData
      let url = f.url
      if (!url && f.file?.startsWith('http')) {
        url = f.file
      }
      if (!url && onebotClient && (f.fileId || f.file)) {
        try {
          if (f.groupId && f.fileId) {
            const res = await onebotClient.send('get_group_file_url', { group_id: f.groupId, file_id: f.fileId })
            if (res?.data?.url) url = res.data.url
          }
          if (!url) {
            const res = await onebotClient.send('get_file', { file_id: f.fileId || f.file })
            if (res?.data?.url) url = res.data.url
            else if (res?.data?.file) return { file: res.data.file, name: f.name, ext: f.ext }
          }
        } catch {}
      }
      return { url, file: f.file, name: f.name, ext: f.ext }
    }

    return null
  }

  get(ref: string): RefData | undefined {
    const item = this.store.get(ref)
    if (!item) return undefined
    if (Date.now() - item.createdAt > this.ttlMs) {
      this.store.delete(ref)
      return undefined
    }
    return item
  }

  /**
   * Resolve an image ref to base64 data and mimeType, caching results in memory
   */
  async resolveImage(ref: string, onebotClient?: any): Promise<{ base64: string; mimeType: string } | null> {
    const item = this.get(ref)
    if (!item || item.type !== 'image') return null
    const imgData = item as ImageRefData

    // Return cached base64 directly
    if (imgData.base64 && imgData.mimeType) {
      return { base64: imgData.base64, mimeType: imgData.mimeType }
    }

    let rawBuffer: Buffer | null = null
    let detectedMime: string | null = null

    // 1. Try URL directly
    let targetUrl = imgData.url
    if (!targetUrl && imgData.file && imgData.file.startsWith('http')) {
      targetUrl = imgData.file
    }

    if (targetUrl) {
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        try {
          const resp = await axios.get(targetUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          })
          rawBuffer = Buffer.from(resp.data)
          detectedMime = detectSupportedImageMime(rawBuffer) || String(resp.headers['content-type'] || 'image/jpeg')
        } catch (err: any) {
          console.warn(`[RefStore] Failed to download image from url ${targetUrl}:`, err.message)
        }
      } else if (targetUrl.startsWith('base64://')) {
        const b64 = targetUrl.replace('base64://', '')
        rawBuffer = Buffer.from(b64, 'base64')
        detectedMime = detectSupportedImageMime(rawBuffer) || 'image/jpeg'
      } else if (targetUrl.startsWith('file://')) {
        const filePath = targetUrl.replace('file://', '')
        if (fs.existsSync(filePath)) {
          rawBuffer = fs.readFileSync(filePath)
          detectedMime = detectSupportedImageMime(rawBuffer) || 'image/jpeg'
        }
      } else if (fs.existsSync(targetUrl)) {
        rawBuffer = fs.readFileSync(targetUrl)
        detectedMime = detectSupportedImageMime(rawBuffer) || 'image/jpeg'
      }
    }

    // 2. If URL failed or missing, try OneBot get_image API using file ID
    if (!rawBuffer && imgData.file && onebotClient) {
      try {
        const resp = await onebotClient.callAction('get_image', { file: imgData.file })
        const fetchedUrl = resp?.data?.url || resp?.data?.file
        if (fetchedUrl && (fetchedUrl.startsWith('http://') || fetchedUrl.startsWith('https://'))) {
          const dlResp = await axios.get(fetchedUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          })
          rawBuffer = Buffer.from(dlResp.data)
          detectedMime = detectSupportedImageMime(rawBuffer) || String(dlResp.headers['content-type'] || 'image/jpeg')
        }
      } catch (err: any) {
        console.warn(`[RefStore] Failed to get image via OneBot get_image for file ${imgData.file}:`, err.message)
      }
    }

    if (!rawBuffer) return null

    // 3. GIF / Image optimization and payload guard
    // If it is a GIF and exceeds 1.2MB, try animated compression; fall back to 1st frame
    if (detectedMime === 'image/gif' && rawBuffer.length > 1.2 * 1024 * 1024) {
      const opt = optimizeGifBuffer(rawBuffer, 1.2 * 1024 * 1024)
      if (opt.method === 'compressed_anim') {
        console.log(
          `[RefStore] Compressed animated GIF (${ref}): ${(rawBuffer.length / 1024 / 1024).toFixed(2)}MB -> ${(opt.buffer.length / 1024).toFixed(1)}KB (preserved motion)`
        )
        rawBuffer = opt.buffer
      } else if (opt.method === 'first_frame') {
        console.log(
          `[RefStore] Extracted first frame for large GIF (${ref}): ${(rawBuffer.length / 1024 / 1024).toFixed(2)}MB -> ${(opt.buffer.length / 1024).toFixed(1)}KB (first-frame fallback)`
        )
        rawBuffer = opt.buffer
      }
    }

    // Safety guard: reject single images that still exceed 2.5MB to prevent upstream HTTP 413
    if (rawBuffer.length > 2.5 * 1024 * 1024) {
      console.warn(
        `[RefStore] Image ${ref} is too large (${(rawBuffer.length / 1024 / 1024).toFixed(2)}MB > 2.5MB), skipping payload inclusion to avoid upstream 413 payload too large`
      )
      return null
    }

    // Cache the resolved result
    const base64 = rawBuffer.toString('base64')
    const mimeType = detectedMime || 'image/jpeg'
    imgData.base64 = base64
    imgData.mimeType = mimeType

    return { base64, mimeType }
  }

  private cleanup(): void {
    const now = Date.now()
    if (this.store.size > this.maxItems) {
      // Evict oldest or expired
      for (const [key, item] of this.store.entries()) {
        if (now - item.createdAt > this.ttlMs || this.store.size > this.maxItems * 0.8) {
          this.store.delete(key)
        }
      }
    }
  }
}

export const mediaRefStore = new MediaRefStore()
