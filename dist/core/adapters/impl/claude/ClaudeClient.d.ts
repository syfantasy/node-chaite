import { AbstractClient } from '../../clients.js';
import { BaseClientOptions } from '../../../types/index.js';
import { ChaiteContext, HistoryMessage, IMessage, ModelUsage } from '../../../types/index.js';
import './converter.js';
import { SendMessageOption } from '../../../types/index.js';
export declare class ClaudeClient extends AbstractClient {
    constructor(options: BaseClientOptions | Partial<BaseClientOptions>, context?: ChaiteContext);
    _sendMessage(histories: IMessage[], apiKey: string, options: SendMessageOption): Promise<HistoryMessage & {
        usage: ModelUsage;
        rawRequest?: any;
        rawResponse?: any;
    }>;
}
