import sharp from 'sharp';
export const DEFAULT_COMPRESSION_CONFIG = {
    enabled: true,
    maxDimension: 1280,
    quality: 80,
    thresholdBytes: 153600, // 150KB
};
/**
 * 针对大模型多模态输入优化图片：
 * 1. 等比缩放长边（默认 <= 1280px），杜绝大模型切片 Tiles 暴增及请求超时；
 * 2. 压缩质量（默认 80），剥离冗余元数据；
 * 3. 动态跳过：动图 GIF（保持动画）或体积小于门槛且分辨率未超标的图片原样保留；
 * 4. 容错保障：任何编码异常均优雅回退至原图，确保业务流程稳定。
 */
export async function compressImageBuffer(rawBuffer, declaredMime = 'image/jpeg', options) {
    const cfg = { ...DEFAULT_COMPRESSION_CONFIG, ...options };
    if (!cfg.enabled) {
        return { buffer: rawBuffer, mimeType: declaredMime, compressed: false };
    }
    // 动图 GIF 暂不通过静态流程压缩，避免损坏多帧动画
    if (declaredMime === 'image/gif') {
        return { buffer: rawBuffer, mimeType: declaredMime, compressed: false };
    }
    try {
        const image = sharp(rawBuffer, { failOn: 'none' });
        const metadata = await image.metadata();
        const width = metadata.width || 0;
        const height = metadata.height || 0;
        const maxDim = Math.max(width, height);
        // 若图片体积小于门槛且分辨率在允许长边内，无需处理
        if (rawBuffer.length <= cfg.thresholdBytes && maxDim <= cfg.maxDimension) {
            return { buffer: rawBuffer, mimeType: declaredMime, compressed: false };
        }
        let pipeline = image.rotate(); // 依据 EXIF 自动校正旋转方向
        // 超过指定最大分辨率时等比缩放
        if (maxDim > cfg.maxDimension) {
            pipeline = pipeline.resize(cfg.maxDimension, cfg.maxDimension, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }
        // 处理透明通道（PNG / WEBP 转 JPEG 时白底平铺，避免黑色背景）
        if (metadata.hasAlpha) {
            pipeline = pipeline.flatten({ background: '#ffffff' });
        }
        // 统一编码为高质量标准的 JPEG，大模型解码速度最快且 Base64 膨胀率相对可控
        const compressedBuffer = await pipeline
            .jpeg({
            quality: Math.min(100, Math.max(1, cfg.quality)),
            mozjpeg: true,
        })
            .toBuffer();
        // 仅当压缩后确实比原图小，或者分辨率超标被缩减时采用压缩结果
        if (compressedBuffer.length < rawBuffer.length || maxDim > cfg.maxDimension) {
            const origKb = (rawBuffer.length / 1024).toFixed(1);
            const compKb = (compressedBuffer.length / 1024).toFixed(1);
            const ratio = Math.round((1 - compressedBuffer.length / rawBuffer.length) * 100);
            console.log(`[ImageCompressor] Compressed image (${width}x${height}, ${origKb}KB) -> (max ${cfg.maxDimension}px, ${compKb}KB, -${ratio}%)`);
            return {
                buffer: compressedBuffer,
                mimeType: 'image/jpeg',
                compressed: true,
            };
        }
        return { buffer: rawBuffer, mimeType: declaredMime, compressed: false };
    }
    catch (err) {
        console.warn(`[ImageCompressor] Compression skipped due to error:`, err?.message || err);
        return { buffer: rawBuffer, mimeType: declaredMime, compressed: false };
    }
}
