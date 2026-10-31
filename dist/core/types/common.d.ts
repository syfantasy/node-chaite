import { Feature, HistoryMessage } from './models.js';
import { Tool } from './tools.js';
import { HistoryManager, SendMessageOption } from './adapter.js';
import { PostProcessor, PreProcessor } from './processors.js';
import { DeSerializable, Serializable, Wait } from './cloud.js';
import { EventMessage } from './external.js';
import type { AbstractClient } from '../adapters/index.js';
import type { Chaite } from '../core/index.js';
import type { ToolExecutor } from '../agent/contracts.js';
export declare const MultipleKeyStrategyChoice: {
    RANDOM: MultipleKeyStrategy;
    ROUND_ROBIN: MultipleKeyStrategy;
    CONVERSATION_HASH: MultipleKeyStrategy;
};
export type MultipleKeyStrategy = 'random' | 'round-robin' | 'conversation-hash';
export declare class BaseClientOptions implements Serializable, DeSerializable<BaseClientOptions>, Wait {
    features: Feature[];
    tools: Tool[];
    baseUrl: string;
    apiKey: string | string[];
    multipleKeyStrategy?: MultipleKeyStrategy;
    proxy?: string;
    historyManager: HistoryManager;
    logger?: ILogger;
    postProcessorIds?: string[];
    private postProcessors?;
    preProcessorIds?: string[];
    private preProcessors?;
    /**
     * Optional ToolExecutor for remote-first / sandbox tool execution.
     * If provided, AbstractClient will use it instead of calling tool.run() directly.
     */
    toolExecutor?: ToolExecutor;
    /** Per-tool call timeout in ms (used by ToolExecutor if supported) */
    toolTimeoutMs?: number;
    constructor(options?: Partial<BaseClientOptions>);
    static create(options: BaseClientOptions | Partial<BaseClientOptions>): BaseClientOptions;
    private initPromise;
    ready(): Promise<void>;
    setHistoryManager(historyManager: HistoryManager): void;
    setLogger(logger: ILogger): void;
    getPostProcessors(): PostProcessor[];
    getPreProcessors(): PreProcessor[];
    init(): Promise<void>;
    toString(): string;
    fromString(str: string): BaseClientOptions;
}
export interface ILogger {
    debug(msg: object | string, ...args: never[]): void;
    info(msg: object | string, ...args: never[]): void;
    warn(msg: object | string, ...args: never[]): void;
    error(msg: object | string, ...args: never[]): void;
}
export declare const DefaultLogger: {
    readonly name: string;
    readonly enableColors: boolean;
    formatDate(): string;
    formatMessage(level: string, msg: object | string, args: never[]): string;
    debug(msg: object | string, ...args: never[]): void;
    error(msg: object | string, ...args: never[]): void;
    info(msg: object | string, ...args: never[]): void;
    warn(msg: object | string, ...args: never[]): void;
};
export declare class ChaiteContext {
    constructor(logger?: ILogger);
    logger?: ILogger;
    chaite: Chaite;
    private options?;
    private historyMessages?;
    private event?;
    private data?;
    private client?;
    /** Set when this context is running inside a background job */
    jobId?: string;
    /** Set when this context is executing a plan */
    planId?: string;
    /** Active skill name for this request */
    skillName?: string;
    /** Active workflow id for this request */
    workflowId?: string;
    /** Resource identity used by usage logging. */
    channelId?: string;
    channelName?: string;
    presetId?: string;
    presetName?: string;
    setHistoryMessages(histories: HistoryMessage[]): void;
    getHistoryMessages(): HistoryMessage[] | undefined;
    setOptions(options: SendMessageOption): void;
    getOptions(): SendMessageOption | undefined;
    setEvent(event: EventMessage): void;
    setChaite(chaite: Chaite): void;
    getEvent(): EventMessage | undefined;
    setData(data: Record<string, any>): void;
    getData(): Record<string, any> | undefined;
    setClient(client: AbstractClient): void;
    getClient(): AbstractClient | undefined;
    getChaite(): Chaite;
}
export interface Into<U> {
    into(): U;
}
export interface From<T> {
    from(value: T): this;
}
export interface RAGResult {
    content: string;
    score: number;
}
export interface Vectorizer {
    /**
     * 将文本转换为向量
     * @param text 输入文本
     * @returns 文本的向量表示
     */
    textToVector(text: string): Promise<number[]>;
    /**
     * 批量将文本转换为向量
     * @param texts 输入文本数组
     * @returns 文本向量数组
     */
    batchTextToVector(texts: string[]): Promise<number[][]>;
}
export type CloudAPIType = 'tool' | 'processor' | 'chat-preset' | 'channel' | 'tool-group' | 'trigger';
export type CustomConfigValueType = string | number | boolean | object | undefined | null | CustomConfigValueType[];
export type CustomConfig = Record<string, CustomConfigValueType | Record<string, CustomConfigValueType>>;
