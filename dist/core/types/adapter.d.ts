import { EmbeddingResult, Feature, HistoryMessage, IMessage, MessageContent, ModelResponse, ModelResponseChunk, ModelUsage, UserMessage } from './models.js';
import { Tool } from './tools.js';
import { ILogger, MultipleKeyStrategy } from './common.js';
import { PostProcessor, PreProcessor } from './processors.js';
import { DeSerializable, Serializable } from './cloud.js';
import { SafetySetting } from '@google/genai';
export interface ToolCallLimitConfig {
    maxConsecutiveCalls?: number;
    maxConsecutiveIdenticalCalls?: number;
}
export declare class SendMessageOption implements Serializable, DeSerializable<SendMessageOption> {
    constructor(option: Partial<SendMessageOption>);
    static create(options?: SendMessageOption | Partial<SendMessageOption>): SendMessageOption;
    model?: string;
    temperature?: number;
    maxToken?: number;
    /**
       * 将系统提示词覆盖
       */
    systemOverride?: string;
    /**
       * 本轮对话禁用历史
       */
    disableHistoryRead?: boolean;
    /**
       * 禁用本轮对话存储到历史
       */
    disableHistorySave?: boolean;
    /**
       * 对话ID。如果不传则默认为第一次对话
       */
    conversationId?: string;
    /**
       * 上一条消息的ID，如果不传则默认为第一次对话
       */
    parentMessageId?: string;
    /**
       * 流模式
       */
    stream?: boolean;
    /**
       * @deprecated 已废弃
       */
    isThinkingModel?: boolean;
    /**
       * 是否以合并转发形式输出思考内容
       */
    showThinking?: boolean;
    /**
       * 预留扩展或插件自定义配置参数
       */
    customOptions?: Record<string, any>;
    enableReasoning?: boolean;
    reasoningEffort?: 'high' | 'medium' | 'low' | 'minimal';
    reasoningBudgetTokens?: number;
    /** Override auto-detection for renamed Claude models on API gateways. */
    claudeThinkingMode?: 'auto' | 'adaptive' | 'enabled' | 'disabled' | 'between_tools';
    claudeEffort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
    openaiReasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
    /** Nonstandard compatible-server extension; never sent to api.openai.com. */
    openaiThinkingBudgetTokens?: number;
    openaiMaxTokenField?: 'max_tokens' | 'max_completion_tokens';
    geminiThinkingLevel?: 'minimal' | 'low' | 'medium' | 'high';
    toolChoice?: ToolChoice;
    postProcessorIds?: string[];
    preProcessorIds?: string[];
    toolGroupId?: string[];
    /**
     * 工具装配模式：'basic' 基础常驻全量模式，'skill' 智能技能按需唤醒模式
     */
    toolMountMode?: 'basic' | 'skill';
    /**
     * 常驻携带的 MCP 服务 ID 列表
     */
    mcpServerIds?: string[];
    /**
     * 允许动态唤醒的 Skill ID 列表（留空则不限制全部允许）
     */
    enabledSkills?: string[];
    responseModalities?: string[];
    safetySettings?: SafetySetting[];
    toolCallLimit?: ToolCallLimitConfig;
    _consecutiveToolCallCount?: number;
    _consecutiveIdenticalToolCallCount?: number;
    _lastToolCallSignature?: string;
    /**
     * Per-tool call timeout in ms. Overrides channel-level toolTimeoutMs.
     */
    toolTimeoutMs?: number;
    /**
     * Agent context fields propagated through the call chain.
     * Set automatically by Chaite when running under a background job or plan.
     */
    jobId?: string;
    planId?: string;
    skillName?: string;
    /** Preset-selected categories of built-in tools. Undefined keeps compatibility by enabling all. */
    builtinToolCategories?: Array<'mcp-discovery' | 'mcp-management' | 'skill-management'>;
    /** 是否为该预设开启长期记忆 */
    enableMemory?: boolean;
    /** Gemini Generate Content built-in tools enabled by the preset. */
    geminiBuiltinTools?: Array<'googleSearch' | 'googleMaps' | 'codeExecution' | 'urlContext'>;
    /**
       * 流模式的回调
       * @param chunk
       */
    onChunk?(chunk: ModelResponseChunk): Promise<void>;
    /**
       * 工具调用轮次，如果有其他非tool_call类消息会被丢弃最后不会返回，但是可以通过onMessageWithToolCall来处理
       * @param message
       */
    onMessageWithToolCall?(message: MessageContent): Promise<void>;
    /**
     * 持久化视图：仅影响写入 history 的内容，不影响实际发给模型的请求。
     * 用于「本轮临时注入的上下文（如群聊流水快照 / 会话环境）不落库」的场景，
     * 避免同一份快照在历史里逐轮堆叠。
     * 注意：实现必须保留 message.id，否则 parentMessageId 链会断。
     */
    persistMessage?(message: HistoryMessage): HistoryMessage;
    /**
     * 上下文置顶：在「历史 + 本轮消息」拼装完成后、真正发给模型前回调。
     * 用于把本轮注入的上下文（场景协议 / 群聊流水 / 花名册 / 环境）放到对话最前面，
     * 而不是塞在本轮 user 消息里 —— 稳定的头部内容才能持续命中前缀缓存。
     * @param histories 当前将要发送的完整消息列表（含本轮 user 消息）
     * @param currentMessage 本轮 user 消息（已在列表末尾）
     * 返回新数组则替换；原地修改亦可。
     */
    prependContext?(histories: HistoryMessage[], currentMessage?: HistoryMessage): HistoryMessage[] | void;
    fromString(str: string): SendMessageOption;
    toString(): string;
}
export interface ToolChoice {
    type: 'none' | 'any' | 'auto' | 'specified';
    tools?: string[];
}
export interface EmbeddingOption {
    model: string;
    dimensions?: number;
}
export type ClientType = 'openai' | 'gemini' | 'claude';
export interface IClient {
    name: ClientType;
    features: Feature[];
    tools: Tool[];
    baseUrl: string;
    apiKey: string | string[];
    multipleKeyStrategy: MultipleKeyStrategy;
    historyManager: HistoryManager;
    postProcessors?: PostProcessor[];
    preProcessors?: PreProcessor[];
    sendMessage(message: UserMessage | undefined, options?: SendMessageOption | Partial<SendMessageOption>): Promise<ModelResponse>;
    sendMessageWithHistory(history: IMessage[], options?: SendMessageOption | Partial<SendMessageOption>): Promise<IMessage & {
        usage: ModelUsage;
    }>;
    getEmbedding(text: string | string[], options: EmbeddingOption): Promise<EmbeddingResult>;
    logger: ILogger;
}
export interface HistoryManager {
    name: string;
    saveHistory(message: HistoryMessage, conversationId: string): Promise<void>;
    getHistory(messageId?: string, conversationId?: string): Promise<HistoryMessage[]>;
    deleteConversation(conversationId: string): Promise<void>;
    /** Remove one history message and reconnect its direct children to its parent. */
    removeHistory?(messageId: string, conversationId: string): Promise<void>;
    getOneHistory(messageId: string, conversationId: string): Promise<HistoryMessage | undefined>;
}
export declare abstract class AbstractHistoryManager implements HistoryManager {
    name: string;
    abstract saveHistory(message: HistoryMessage, conversationId: string): Promise<void>;
    abstract getHistory(messageId?: string, conversationId?: string): Promise<HistoryMessage[]>;
    abstract deleteConversation(conversationId: string): Promise<void>;
    removeHistory?(messageId: string, conversationId: string): Promise<void>;
    abstract getOneHistory(messageId: string, conversationId: string): Promise<HistoryMessage | undefined>;
}
