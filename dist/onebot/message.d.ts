import { UserMessage, ModelResponse } from '../core/index.js';
import { OneBotMessageEvent, OneBotSegment } from './types.js';
export interface ConvertOptions {
    botUin?: number;
    toggleMode?: 'at' | 'prefix' | 'both';
    togglePrefix?: string;
    maxRecentImages?: number;
    onebot?: any;
}
export declare function detectSupportedImageMime(buffer: Buffer): string;
/**
 * Extract the first frame of an animated GIF without any external dependencies.
 * Slices the GIF stream right after the first image data block and appends a trailer byte (0x3B).
 * Produces a fully valid static GIF containing the exact first frame with original palette.
 */
export declare function extractFirstFrameFromGif(buffer: Buffer): Buffer | null;
/**
 * Try compressing an animated GIF while preserving motion using gifsicle.
 * - Stage 1: gifsicle lossy + resize fit 360x360
 * - Stage 2: frame skipping if still oversized
 * Returns compressed Buffer if <= maxBytes, or null if failed or still oversized.
 */
export declare function compressAnimatedGif(buffer: Buffer, maxBytes?: number): Buffer | null;
/**
 * Multi-stage GIF optimization:
 * 1. If buffer <= targetMaxBytes, return original as-is.
 * 2. If > targetMaxBytes, attempt animated GIF compression preserving motion.
 * 3. If compression fails or still oversized, fall back to static 1st frame extraction.
 */
export declare function optimizeGifBuffer(buffer: Buffer, targetMaxBytes?: number): {
    buffer: Buffer;
    method: 'original' | 'compressed_anim' | 'first_frame';
};
/**
 * Convert OneBot message to Chaite UserMessage
 */
export declare function oneBotToUserMessage(event: OneBotMessageEvent, options?: ConvertOptions): Promise<{
    userMessage: UserMessage;
    isAtBot: boolean;
    rawText: string;
    cleanText: string;
}>;
/**
 * Split text into chunks to comply with QQ platform length limits
 */
export declare function splitTextIntoChunks(text: string, maxLength?: number): string[];
/**
 * Format Chaite ModelResponse into packets that comply with QQ constraints:
 * - Text chunks and media (image/audio) are separated into individual messages.
 * - Text chunks are limited to maxMessageLength.
 */
export declare function formatModelResponse(response: ModelResponse, replyMessageId?: number, maxLength?: number, ignoreReasoning?: boolean): OneBotSegment[][];
