import { BaseClientOptions, ChaiteContext, ToolCallLimitConfig } from '../../../types/index.js';
import { AbstractClient } from '../../clients.js';
import { EmbeddingOption, EmbeddingResult, HistoryMessage, IMessage, ModelUsage } from '../../../types/index.js';
import './converter.js';
import { SendMessageOption } from '../../../types/index.js';
export type GeminiClientOptions = BaseClientOptions & {
    toolCallLimit?: ToolCallLimitConfig;
};
export declare class GeminiClient extends AbstractClient {
    constructor(options: GeminiClientOptions | Partial<GeminiClientOptions>, context?: ChaiteContext);
    _sendMessage(histories: IMessage[], apiKey: string, options: SendMessageOption): Promise<HistoryMessage & {
        usage: ModelUsage;
        rawRequest?: any;
        rawResponse?: any;
    }>;
    getEmbedding(text: string | string[], options: EmbeddingOption): Promise<EmbeddingResult>;
}
