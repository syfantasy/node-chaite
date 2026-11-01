import crypto from 'node:crypto';
import fs from 'node:fs';
import axios from 'axios';
import { detectSupportedImageMime, optimizeGifBuffer } from './message.js';
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
    saveImage(data) {
        this.cleanup();
        const id = this.generateShortId();
        const ref = `img_${id}`;
        const record = {
            ...data,
            id,
            ref,
            type: 'image',
            createdAt: Date.now(),
        };
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
    async resolveImage(ref, onebotClient) {
        const item = this.get(ref);
        if (!item || item.type !== 'image')
            return null;
        const imgData = item;
        // Return cached base64 directly
        if (imgData.base64 && imgData.mimeType) {
            return { base64: imgData.base64, mimeType: imgData.mimeType };
        }
        let rawBuffer = null;
        let detectedMime = null;
        // 1. Try URL directly
        let targetUrl = imgData.url;
        if (!targetUrl && imgData.file && imgData.file.startsWith('http')) {
            targetUrl = imgData.file;
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
                    });
                    rawBuffer = Buffer.from(resp.data);
                    detectedMime = detectSupportedImageMime(rawBuffer) || String(resp.headers['content-type'] || 'image/jpeg');
                }
                catch (err) {
                    console.warn(`[RefStore] Failed to download image from url ${targetUrl}:`, err.message);
                }
            }
            else if (targetUrl.startsWith('base64://')) {
                const b64 = targetUrl.replace('base64://', '');
                rawBuffer = Buffer.from(b64, 'base64');
                detectedMime = detectSupportedImageMime(rawBuffer) || 'image/jpeg';
            }
            else if (targetUrl.startsWith('file://')) {
                const filePath = targetUrl.replace('file://', '');
                if (fs.existsSync(filePath)) {
                    rawBuffer = fs.readFileSync(filePath);
                    detectedMime = detectSupportedImageMime(rawBuffer) || 'image/jpeg';
                }
            }
            else if (fs.existsSync(targetUrl)) {
                rawBuffer = fs.readFileSync(targetUrl);
                detectedMime = detectSupportedImageMime(rawBuffer) || 'image/jpeg';
            }
        }
        // 2. If URL failed or missing, try OneBot get_image API using file ID
        if (!rawBuffer && imgData.file && onebotClient) {
            try {
                const resp = await onebotClient.callAction('get_image', { file: imgData.file });
                const fetchedUrl = resp?.data?.url || resp?.data?.file;
                if (fetchedUrl && (fetchedUrl.startsWith('http://') || fetchedUrl.startsWith('https://'))) {
                    const dlResp = await axios.get(fetchedUrl, {
                        responseType: 'arraybuffer',
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        },
                    });
                    rawBuffer = Buffer.from(dlResp.data);
                    detectedMime = detectSupportedImageMime(rawBuffer) || String(dlResp.headers['content-type'] || 'image/jpeg');
                }
            }
            catch (err) {
                console.warn(`[RefStore] Failed to get image via OneBot get_image for file ${imgData.file}:`, err.message);
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
            }
        }
        // Safety guard: reject single images that still exceed 2.5MB to prevent upstream HTTP 413
        if (rawBuffer.length > 2.5 * 1024 * 1024) {
            console.warn(`[RefStore] Image ${ref} is too large (${(rawBuffer.length / 1024 / 1024).toFixed(2)}MB > 2.5MB), skipping payload inclusion to avoid upstream 413 payload too large`);
            return null;
        }
        // Cache the resolved result
        const base64 = rawBuffer.toString('base64');
        const mimeType = detectedMime || 'image/jpeg';
        imgData.base64 = base64;
        imgData.mimeType = mimeType;
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
