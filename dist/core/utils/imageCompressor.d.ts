import type { VisionCompressionConfig } from '../../config.js';
export declare const DEFAULT_COMPRESSION_CONFIG: VisionCompressionConfig;
export interface CompressResult {
    buffer: Buffer;
    mimeType: string;
    compressed: boolean;
}
/**
 * 针对大模型多模态输入优化图片：
 * 1. 等比缩放长边（默认 <= 1280px），杜绝大模型切片 Tiles 暴增及请求超时；
 * 2. 压缩质量（默认 80），剥离冗余元数据；
 * 3. 动态跳过：动图 GIF（保持动画）或体积小于门槛且分辨率未超标的图片原样保留；
 * 4. 容错保障：任何编码异常均优雅回退至原图，确保业务流程稳定。
 */
export declare function compressImageBuffer(rawBuffer: Buffer, declaredMime?: string, options?: Partial<VisionCompressionConfig>): Promise<CompressResult>;
