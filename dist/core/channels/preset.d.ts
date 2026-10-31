import { AbstractShareable, SendMessageOption } from '../types/index.js';
/**
 * 对话模式预设，最终使用的
 */
export declare class ChatPreset extends AbstractShareable<ChatPreset> {
    constructor(params?: Partial<ChatPreset>);
    prefix: string;
    prefixes?: string[];
    local: boolean;
    namespace?: string;
    sendMessageOption: SendMessageOption;
    /**
     * 回复时是否引用原消息（默认关闭）
     */
    quoteReply?: boolean;
    /**
     * 是否输出思考内容（若模型产生思考过程，以转发聊天记录形式发送，默认关闭）
     */
    showThinking?: boolean;
    /**
     * 自定义扩展配置或插件参数（预留未来插件系统动态配置）
     */
    customOptions?: Record<string, any>;
    /**
     * 自动触发 AI 对话的概率（0 ~ 1，默认为 0；群聊产生新消息时按概率唤醒，不论是否开启伪人模式均生效）
     */
    autoTriggerProbability?: number;
    /**
     * 群聊上下文覆盖配置（选填，未填则继承全局配置）
     */
    groupContextMinMessages?: number;
    groupContextMinTokens?: number;
    groupContextMaxMessages?: number;
    groupContextMaxTokens?: number;
    /**
     * 错误重试开关与最大重试次数
     */
    enableRetry?: boolean;
    enableMemory?: boolean;
    maxRetries?: number;
    /**
     * 基本模型请求失败（或重试耗尽）后是否转用备用模型及备用模型名称 (渠道/模型名)
     */
    enableFallback?: boolean;
    fallbackModel?: string;
    fallbackModels?: string[];
    /**
     * 预设生效的群聊/群员黑白名单
     */
    whiteGroups?: string[];
    blackGroups?: string[];
    whiteUsers?: string[];
    blackUsers?: string[];
    /**
     * 伪人模式：开启后作为独立群友插话，不绑定多轮记忆，且不向数据库写入死历史
     */
    isBymMode?: boolean;
    /**
     * 允许在消息的任意位置匹配触发前缀（默认开启）
     */
    prefixAnywhere?: boolean;
    /**
     * 携带群聊上下文
     */
    groupContext?: 'disable' | 'enabled' | 'use_system';
    /** Whether dynamic context from older turns is kept in normal chat history. */
    dynamicContextHistory?: 'use_system' | 'retain' | 'discard';
    /** Built-in tool categories enabled for this preset. Undefined enables all for compatibility. */
    builtinToolCategories?: Array<'mcp-discovery' | 'mcp-management' | 'skill-management'>;
    /** Whether to start each turn from a detached history branch. */
    disableConversationContext?: boolean;
    /**
     * 禁止系统prompt
     */
    disableSystemInstructions?: boolean;
    toString(): string;
    fromString(str: string): ChatPreset;
    toFormatedString(verbose?: boolean): string;
}
