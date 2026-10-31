import { EmbeddingResult, HistoryMessage, IMessage, ModelUsage } from '../../../types/index.js';
import { AbstractClient } from '../../clients.js';
import { BaseClientOptions, ChaiteContext } from '../../../types/index.js';
import './converter.js';
import { EmbeddingOption, SendMessageOption } from '../../../types/index.js';
export type OpenAIClientOptions = BaseClientOptions;
export declare class OpenAIClient extends AbstractClient {
    constructor(options: OpenAIClientOptions | Partial<OpenAIClientOptions>, context?: ChaiteContext);
    _sendMessage(histories: IMessage[], apiKey: string, options: SendMessageOption): Promise<HistoryMessage & {
        usage: ModelUsage;
        rawRequest?: any;
        rawResponse?: any;
    }>;
    getEmbedding(text: string | string[], options: EmbeddingOption): Promise<EmbeddingResult>;
}
