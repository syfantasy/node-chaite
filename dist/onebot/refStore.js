import crypto from 'node:crypto';
import fs from 'node:fs';
import axios from 'axios';
import { detectSupportedImageMime, optimizeGifBuffer } from './message.js';
import { getConfig } from '../config.js';
import { compressImageBuffer } from '../core/utils/imageCompressor.js';
export async function fetchRawImageBuffer(target) {
    if (!target || typeof target !== 'string')
        return null;
    let cleanTarget = target.trim().replace(/&amp;/g, '&');
    if (cleanTarget.startsWith('base64://')) {
        try {
            const b64 = cleanTarget.replace('base64://', '');
            const buf = Buffer.from(b64, 'base64');
            return { buffer: buf, mime: detectSupportedImageMime(buf) || 'image/jpeg' };
        }
        catch {
            return null;
        }
    }
    if (cleanTarget.startsWith('file://')) {
        cleanTarget = cleanTarget.replace('file://', '');
    }
    if (cleanTarget.startsWith('http://') || cleanTarget.startsWith('https://')) {
        try {
            const resp = await axios.get(cleanTarget, {
                responseType: 'arraybuffer',
                timeout: 12000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                },
            });
            const buf = Buffer.from(resp.data);
            const mime = detectSupportedImageMime(buf) || String(resp.headers['content-type'] || 'image/jpeg').split(';')[0].trim();
            return { buffer: buf, mime };
        }
        catch (err) {
            console.warn(`[RefStore] Failed to download image from ${cleanTarget.slice(0, 80)}:`, err?.message || err);
            return null;
        }
    }
    // 本地文件系统路径 (如 OneBot 宿主本地缓存目录)
    try {
        if (fs.existsSync(cleanTarget)) {
            const buf = fs.readFileSync(cleanTarget);
            const mime = detectSupportedImageMime(buf) || 'image/jpeg';
            return { buffer: buf, mime };
        }
    }
    catch { }
    return null;
}
class MediaRefStore {
    constructor() {
        this.store = new Map();
        this.pinnedRefs = new Map();
        this.maxItems = 1000;
        this.ttlMs = 12 * 60 * 60 * 1000; // 12 hours for unpinned fallback
    }
    /**
     * 锁定特定 ref，阻止因 TTL 或容量清理被淘汰（字在图在，与会话流水生命周期同生共死）
     */
    pin(ref) {
        if (!ref)
            return;
        const count = this.pinnedRefs.get(ref) || 0;
        this.pinnedRefs.set(ref, count + 1);
    }
    /**
     * 解除特定 ref 锁定（当所属消息被群聊滑动窗口淘汰时调用）
     */
    unpin(ref) {
        if (!ref)
            return;
        const count = this.pinnedRefs.get(ref) || 0;
        if (count <= 1) {
            this.pinnedRefs.delete(ref);
        }
        else {
            this.pinnedRefs.set(ref, count - 1);
        }
    }
    isPinned(ref) {
        return (this.pinnedRefs.get(ref) || 0) > 0;
    }
    /**
     * 从消息文本中解析所有 ref 锚点标记
     */
    extractRefsFromText(text) {
        if (!text)
            return [];
        const refs = [];
        const re = /\bref:([a-zA-Z0-9_]+)/g;
        let m;
        while ((m = re.exec(text)) !== null) {
            refs.push(m[1]);
        }
        return refs;
    }
    generateShortId() {
        return crypto.randomBytes(4).toString('hex');
    }
    saveVoice(data) {
        this.cleanup();
        const id = this.generateShortId();
        const ref = `voice_${id}`;
        const record = {
            ...data,
            id,
            ref,
            type: 'voice',
            createdAt: Date.now(),
        };
        this.store.set(ref, record);
        return ref;
    }
    saveForward(data) {
        this.cleanup();
        const id = this.generateShortId();
        const ref = `fwd_${id}`;
        const record = {
            ...data,
            id,
            ref,
            type: 'forward',
            createdAt: Date.now(),
        };
        this.store.set(ref, record);
        return ref;
    }
    saveImage(data, fallbackMime) {
        this.cleanup();
        const id = this.generateShortId();
        const ref = `img_${id}`;
        let record;
        if (Buffer.isBuffer(data)) {
            record = {
                id,
                ref,
                type: 'image',
                base64: data.toString('base64'),
                mimeType: fallbackMime || detectSupportedImageMime(data) || 'image/png',
                createdAt: Date.now(),
            };
        }
        else {
            record = {
                ...data,
                id,
                ref,
                type: 'image',
                createdAt: Date.now(),
            };
        }
        this.store.set(ref, record);
        return ref;
    }
    saveVideo(data) {
        this.cleanup();
        const id = this.generateShortId();
        const ref = `vid_${id}`;
        const record = {
            ...data,
            id,
            ref,
            type: 'video',
            createdAt: Date.now(),
        };
        this.store.set(ref, record);
        return ref;
    }
    saveFile(data) {
        this.cleanup();
        const id = this.generateShortId();
        const ref = `file_${id}`;
        const record = {
            ...data,
            id,
            ref,
            type: 'file',
            createdAt: Date.now(),
        };
        this.store.set(ref, record);
        return ref;
    }
    /**
     * Resolve media (video, file, etc.) downloadable URL or local path
     */
    async resolveMedia(ref, onebotClient) {
        const item = this.get(ref);
        if (!item)
            return null;
        if (item.type === 'video') {
            const v = item;
            let url = v.url;
            if (!url && v.file?.startsWith('http')) {
                url = v.file;
            }
            if (!url && onebotClient && v.file) {
                try {
                    const res = await onebotClient.send('get_file', { file_id: v.file });
                    if (res?.data?.url)
                        url = res.data.url;
                    else if (res?.data?.file)
                        return { file: res.data.file, name: v.name, ext: v.ext };
                }
                catch { }
            }
            return { url, file: v.file, name: v.name, ext: v.ext };
        }
        if (item.type === 'file') {
            const f = item;
            let url = f.url;
            if (!url && f.file?.startsWith('http')) {
                url = f.file;
            }
            if (!url && onebotClient && (f.fileId || f.file)) {
                try {
                    if (f.groupId && f.fileId) {
                        const res = await onebotClient.send('get_group_file_url', { group_id: f.groupId, file_id: f.fileId });
                        if (res?.data?.url)
                            url = res.data.url;
                    }
                    if (!url) {
                        const res = await onebotClient.send('get_file', { file_id: f.fileId || f.file });
                        if (res?.data?.url)
                            url = res.data.url;
                        else if (res?.data?.file)
                            return { file: res.data.file, name: f.name, ext: f.ext };
                    }
                }
                catch { }
            }
            return { url, file: f.file, name: f.name, ext: f.ext };
        }
        return null;
    }
    get(ref) {
        const item = this.store.get(ref);
        if (!item)
            return undefined;
        // 只要处于群聊上下文锁定期，永不过期，保证字在图在
        if (this.isPinned(ref)) {
            return item;
        }
        if (Date.now() - item.createdAt > this.ttlMs) {
            this.store.delete(ref);
            return undefined;
        }
        return item;
    }
    /**
     * Resolve an image ref to base64 data and mimeType, caching results in memory
     */
    async resolveImage(ref, onebotClient, options) {
        const item = this.get(ref);
        if (!item || item.type !== 'image')
            return null;
        const imgData = item;
        const isCustomResize = Boolean(options?.maxDimension);
        const isRaw = Boolean(options?.raw) && !isCustomResize;
        // Return cached base64 directly
        if (isRaw && imgData.rawBase64 && imgData.rawMimeType) {
            return { base64: imgData.rawBase64, mimeType: imgData.rawMimeType };
        }
        if (!isRaw && !isCustomResize && imgData.base64 && imgData.mimeType) {
            return { base64: imgData.base64, mimeType: imgData.mimeType };
        }
        let rawBuffer = null;
        let detectedMime = null;
        // 1. Try URL directly
        let targetUrl = imgData.url;
        if (!targetUrl && imgData.file && (imgData.file.startsWith('http') || imgData.file.startsWith('file://') || imgData.file.startsWith('base64://'))) {
            targetUrl = imgData.file;
        }
        if (targetUrl) {
            const res = await fetchRawImageBuffer(targetUrl);
            if (res) {
                rawBuffer = res.buffer;
                detectedMime = res.mime;
            }
        }
        // 2. If URL failed or missing, try OneBot get_image API using file ID
        if (!rawBuffer && imgData.file && onebotClient) {
            try {
                const caller = onebotClient.callAction ? onebotClient.callAction.bind(onebotClient) : (onebotClient.send ? onebotClient.send.bind(onebotClient) : null);
                if (caller) {
                    const resp = await caller('get_image', { file: imgData.file });
                    const fetchedTarget = resp?.data?.url || resp?.data?.file;
                    if (fetchedTarget) {
                        const res = await fetchRawImageBuffer(fetchedTarget);
                        if (res) {
                            rawBuffer = res.buffer;
                            detectedMime = res.mime;
                        }
                    }
                }
            }
            catch (err) {
                console.warn(`[RefStore] Failed to get image via OneBot get_image for file ${imgData.file}:`, err?.message || err);
            }
        }
        if (!rawBuffer)
            return null;
        // 3. GIF / Image optimization and payload guard
        // If it is a GIF and exceeds 1.2MB, try animated compression; fall back to 1st frame
        if (detectedMime === 'image/gif' && rawBuffer.length > 1.2 * 1024 * 1024) {
            const opt = optimizeGifBuffer(rawBuffer, 1.2 * 1024 * 1024);
            if (opt.method === 'compressed_anim') {
                console.log(`[RefStore] Compressed animated GIF (${ref}): ${(rawBuffer.length / 1024 / 1024).toFixed(2)}MB -> ${(opt.buffer.length / 1024).toFixed(1)}KB (preserved motion)`);
                rawBuffer = opt.buffer;
            }
            else if (opt.method === 'first_frame') {
                console.log(`[RefStore] Extracted first frame for large GIF (${ref}): ${(rawBuffer.length / 1024 / 1024).toFixed(2)}MB -> ${(opt.buffer.length / 1024).toFixed(1)}KB (first-frame fallback)`);
                rawBuffer = opt.buffer;
                detectedMime = 'image/jpeg';
            }
        }
        // 4. Vision image compression (skip when raw=true unless custom maxDimension is requested)
        const MAX_PAYLOAD_BYTES = 2.5 * 1024 * 1024;
        if (isCustomResize) {
            try {
                const compResult = await compressImageBuffer(rawBuffer, detectedMime || 'image/jpeg', {
                    enabled: true,
                    maxDimension: options.maxDimension,
                    quality: options?.quality ?? 80,
                    thresholdBytes: 0,
                });
                rawBuffer = compResult.buffer;
                detectedMime = compResult.mimeType;
            }
            catch (compErr) {
                console.warn(`[RefStore] Custom image compression failed for ${ref}:`, compErr?.message || compErr);
            }
        }
        else if (!isRaw) {
            try {
                const cfg = getConfig();
                const compResult = await compressImageBuffer(rawBuffer, detectedMime || 'image/jpeg', cfg?.vision?.compression);
                rawBuffer = compResult.buffer;
                detectedMime = compResult.mimeType;
            }
            catch (compErr) {
                console.warn(`[RefStore] Image compression failed for ${ref}, keeping original:`, compErr?.message || compErr);
            }
        }
        // Safety guard: for non-raw context images, if image still exceeds 2.5MB, progressively compress to fit under 413 limit
        if (!isRaw && rawBuffer.length > MAX_PAYLOAD_BYTES) {
            const steps = [
                { maxDimension: 2048, quality: 85 },
                { maxDimension: 1600, quality: 75 },
                { maxDimension: 1280, quality: 70 },
                { maxDimension: 1024, quality: 65 },
            ];
            for (const step of steps) {
                if (rawBuffer.length <= MAX_PAYLOAD_BYTES)
                    break;
                try {
                    const compResult = await compressImageBuffer(rawBuffer, detectedMime || 'image/jpeg', {
                        enabled: true,
                        maxDimension: step.maxDimension,
                        quality: step.quality,
                        thresholdBytes: 0,
                    });
                    rawBuffer = compResult.buffer;
                    detectedMime = compResult.mimeType;
                }
                catch {
                    break;
                }
            }
        }
        if (!isRaw && rawBuffer.length > MAX_PAYLOAD_BYTES) {
            console.warn(`[RefStore] Image ${ref} is still too large (${(rawBuffer.length / 1024 / 1024).toFixed(2)}MB > 2.5MB) after fallback compression, skipping payload inclusion`);
            return null;
        }
        // Cache the resolved result without polluting compressed context cache when raw/custom
        const base64 = rawBuffer.toString('base64');
        const mimeType = detectedMime || 'image/jpeg';
        if (isRaw) {
            imgData.rawBase64 = base64;
            imgData.rawMimeType = mimeType;
        }
        else if (!isCustomResize) {
            imgData.base64 = base64;
            imgData.mimeType = mimeType;
        }
        return { base64, mimeType };
    }
    cleanup() {
        const now = Date.now();
        if (this.store.size > this.maxItems) {
            // Evict oldest or expired, but never evict pinned refs
            for (const [key, item] of this.store.entries()) {
                if (this.isPinned(key))
                    continue;
                if (now - item.createdAt > this.ttlMs || this.store.size > this.maxItems * 0.8) {
                    this.store.delete(key);
                }
            }
        }
    }
}
export const mediaRefStore = new MediaRefStore();
