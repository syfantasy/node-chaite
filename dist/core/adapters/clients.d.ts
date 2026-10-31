import { EmbeddingResult, Feature, HistoryMessage, IMessage, ModelResponse, ModelUsage, Tool, ToolCallLimitConfig, UserMessage } from '../types/index.js';
import { BaseClientOptions, ChaiteContext, ILogger, MultipleKeyStrategy } from '../types/index.js';
import { ClientType, EmbeddingOption, HistoryManager, IClient, SendMessageOption } from '../types/index.js';
import { PostProcessor, PreProcessor } from '../types/index.js';
export declare class AbstractClient implements IClient {
    options: BaseClientOptions;
    constructor(options: BaseClientOptions | Partial<BaseClientOptions>, context?: ChaiteContext);
    fullfillProcessors(preIds?: string[], postIds?: string[]): Promise<{
        pre: PreProcessor[];
        post: PostProcessor[];
    }>;
    fullfillTools(toolGroupIds?: string[]): Promise<Tool[]>;
    sendMessage(message: UserMessage | undefined, options: SendMessageOption | Partial<SendMessageOption>): Promise<ModelResponse>;
    protected shouldPersistHistory(message?: HistoryMessage): boolean;
    private getUsageLogContext;
    protected isEffectivelyEmptyMessage(message?: IMessage): boolean;
    private hasMeaningfulContent;
    private isMessagePartMeaningful;
    protected setToolCallLimitConfig(config?: ToolCallLimitConfig): void;
    private getEffectiveToolCallLimit;
    private updateToolCallTracking;
    private resetToolCallTracking;
    private buildToolCallSignature;
    _sendMessage(_histories: IMessage[], _apiKey: string, _options: SendMessageOption): Promise<HistoryMessage & {
        usage: ModelUsage;
        rawRequest?: any;
        rawResponse?: any;
    }>;
    sendMessageWithHistory(history: IMessage[], options?: SendMessageOption | Partial<SendMessageOption>): Promise<IMessage & {
        usage: ModelUsage;
    }>;
    apiKey: string | string[];
    baseUrl: string;
    features: Feature[];
    multipleKeyStrategy: MultipleKeyStrategy;
    name: ClientType;
    tools: Tool[];
    logger: ILogger;
    historyManager: HistoryManager;
    context: ChaiteContext;
    postProcessors?: PostProcessor[];
    preProcessors?: PreProcessor[];
    protected toolCallLimitConfig?: ToolCallLimitConfig;
    getEmbedding(_text: string | string[], _options: EmbeddingOption): Promise<EmbeddingResult>;
}
