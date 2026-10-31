import { OneBotMessageEvent } from '../onebot/types.js';
export interface GroupContextOptions {
    minMessages?: number;
    minTokens?: number;
    maxMessages?: number;
    maxTokens?: number;
    enableRichCards?: boolean;
    enableForwardParse?: boolean;
    maxForwardMessages?: number;
    currentSender?: {
        userId: string | number;
        nickname?: string;
        card?: string;
        role?: string;
        title?: string;
        level?: string | number;
    };
    /** 生效主人列表（宿主注入，如 Yunzai masterQQ），用于花名册 [主人] 徽标；缺省回退面板配置 */
    masterUsers?: (string | number)[];
    /**
     * 是否在流水行首输出流动序号 `[#N HH:mm]`。默认 true。
     * 普通对话需要去掉序号（`[HH:mm]`），伪人模式仍保留序号以便短引用定位。
     */
    includeSeqIndex?: boolean;
}
export interface GroupContextResult {
    membersBlock: string | null;
    messagesBlock: string | null;
    recentImageRefs: string[];
    fullText: string;
    messageCount: number;
    estimatedTokens: number;
    /**
     * 流水里是否已包含「本轮触发消息」。
     * 仅当缓冲池里除本轮消息外没有任何其它发言时（如机器人在本群重启后的首次触发），
     * 才会退化为把本轮消息也放进流水，避免整个 `<group_messages>` 块缺失。
     */
    includesCurrentMessage: boolean;
}
export interface EphemeralGroupMessage {
    seq: number;
    messageId: string | number;
    userId: string | number;
    rawTime: number;
    timeStr: string;
    nickname?: string;
    card?: string;
    role?: string;
    text: string;
    imageRefs?: string[];
}
export declare class GroupMessageRefStore {
    private static instance;
    private turnRefs;
    private idRefs;
    static getInstance(): GroupMessageRefStore;
    registerTurn(groupId: string | number, messages: EphemeralGroupMessage[]): void;
    appendMessage(groupId: string | number, message: EphemeralGroupMessage): void;
    /**
     * 解析目标消息：支持传入流动序号（如 "#1"、"1" 或 1）或者原始消息 messageId
     */
    resolve(groupId: string | number, target: string | number): EphemeralGroupMessage | undefined;
    clear(groupId: string | number): void;
    clearAll(): void;
}
export declare const groupMessageRefStore: GroupMessageRefStore;
export interface BufferedMessage {
    messageId: string | number;
    /**
     * 去重指纹。
     * 宿主（如 chatgpt-plugin）会先调 /api/bridge/record 预记录一次，随后触发对话时
     * handleMessage 又记录一次，同一条消息被写两遍（表现为流水里每条发言成对出现，
     * 且本轮消息既在流水里又在末尾重复）。有 message_id 时按 id 去重，缺失时退化为
     * 「发送者 + 时间 + 文本前缀」指纹。
     */
    dedupeKey?: string;
    rawTime: number;
    timeStr: string;
    userId: string;
    nickname: string;
    card?: string;
    role?: string;
    title?: string;
    level?: string | number;
    text: string;
    tokens: number;
    imageRefs?: string[];
}
export declare class GroupHistoryBuffer {
    private buffers;
    private hardCapacity;
    private memberMetaCache;
    /**
     * Fetch member metadata (title, level) via OneBot API with caching
     */
    fetchMemberMeta(groupId: string | number, userId: string | number, onebotClient?: any): Promise<{
        title?: string;
        level?: string | number;
    }>;
    /**
     * Process and append an incoming OneBot group message to the buffer
     */
    recordMessage(event: OneBotMessageEvent, onebotClient?: any): Promise<void>;
    /**
     * Format message segments into clean text with ref anchors
     */
    private formatSegmentsToText;
    /**
     * Build structured group context according to dual-watermark window rules
     */
    buildContext(groupId: string | number, options?: GroupContextOptions, excludeMessageId?: string | number, onebotClient?: any): Promise<GroupContextResult | null>;
    /**
     * Append Bot's own response to group buffer so future turns have full conversational context
     */
    recordBotMessage(groupId: string | number, data: {
        botUin?: string | number;
        name?: string;
        text: string;
        messageId?: string | number;
    }): void;
    /**
     * Get recent image refs from group history (chronological order)
     */
    getRecentImageRefs(groupId: string | number, maxCount?: number, excludeMessageId?: string | number): string[];
    /**
     * Get buffer length for a group
     */
    getBufferCount(groupId: string | number): number;
    /**
     * Clear buffer for a group
     */
    clear(groupId: string | number): void;
    /**
     * Clear all group message buffers
     */
    clearAll(): void;
}
export declare const groupHistoryBuffer: GroupHistoryBuffer;
