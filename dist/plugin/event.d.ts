import { ReplyMessageInfo } from './types.js';
export interface SenderInfo {
    userId: number | string;
    nickname: string;
    card?: string;
    role?: string;
    title?: string;
    level?: number;
}
export interface ImageAttachment {
    ref?: string;
    url?: string;
    mimeType?: string;
    base64?: string;
}
export interface QueryAIOptions {
    /**
     * 方式 1: 指定走某个预设 (预设已绑定好渠道与人设)
     */
    presetId?: string;
    /**
     * 方式 2: 纯净基元对话（不走任何预设，直接连渠道模型，零预设人设污染）
     */
    pure?: boolean;
    channelId?: string;
    model?: string;
    systemPrompt?: string;
    temperature?: number;
}
export type ReplyContent = string | {
    text?: string;
    at?: boolean | string | number;
    images?: string[];
    reply?: boolean;
};
export declare class ChaiteEvent {
    readonly userId: number | string;
    readonly groupId: number | null;
    readonly text: string;
    readonly rawText: string;
    readonly sender: SenderInfo;
    readonly images: ImageAttachment[];
    readonly raw: any;
    readonly client?: any;
    readonly eventType: string;
    readonly isPoke: boolean;
    readonly isSelfPoke: boolean;
    readonly targetId?: number | string;
    readonly operatorId?: number | string;
    readonly messageId?: number | string;
    readonly subType?: string;
    readonly flag?: string;
    readonly comment?: string;
    readonly replyId?: number | string | null;
    command?: string;
    args: string;
    private _replyInfo?;
    private _replyLoaded;
    private replyHandler;
    constructor(params: {
        userId: number | string;
        groupId: number | null;
        text: string;
        rawText: string;
        sender: SenderInfo;
        images?: ImageAttachment[];
        raw: any;
        client?: any;
        eventType?: string;
        isPoke?: boolean;
        isSelfPoke?: boolean;
        targetId?: number | string;
        operatorId?: number | string;
        messageId?: number | string;
        subType?: string;
        flag?: string;
        comment?: string;
        replyId?: number | string | null;
        command?: string;
        args?: string;
        replyHandler: (content: ReplyContent) => Promise<any>;
    });
    get isGroup(): boolean;
    get isPrivate(): boolean;
    /**
     * 快捷调用底层适配器协议动作 (如 OneBot 的 callAction)
     */
    callAction(action: string, params?: Record<string, any>): Promise<any>;
    /**
     * 跨协议统一获取被引用/被回复的消息对象（按需懒加载并缓存）
     * 自动抹平 icqq (e.source) 与 OneBot (get_msg) 的协议差异
     */
    getReply(): Promise<ReplyMessageInfo | null>;
    /**
     * 快捷获取被引用消息中的图片列表
     */
    getReplyImages(): Promise<ImageAttachment[]>;
    /**
     * 快捷获取本轮相关图片（优先当前消息携带的图片，无图且 includeReply 为 true 时回退被引用的图片）
     */
    getAllImages(includeReply?: boolean): Promise<ImageAttachment[]>;
    /**
     * 兼容 icqq / Yunzai 插件生态习惯的 e.source 访问器 (返回 Promise<ReplyMessageInfo | null>)
     */
    get source(): Promise<ReplyMessageInfo | null>;
    /**
     * 跨协议统一获取合并转发消息详情
     * 自动抹平 icqq (e.group.getForwardMsg / e.bot.getForwardMsg) 与 OneBot (get_forward_msg) 协议差异
     */
    getForwardMsg(forwardId?: string): Promise<any>;
    /**
     * 快捷同意好友申请或入群申请 (仅在 request 事件中生效)
     */
    approve(remark?: string): Promise<any>;
    /**
     * 快捷拒绝好友申请或入群申请 (仅在 request 事件中生效)
     */
    reject(reason?: string): Promise<any>;
    /**
     * 快捷撤回消息
     */
    deleteMsg(messageId?: number | string): Promise<any>;
    /**
     * 快捷获取当前群的成员列表 (仅群聊可用)
     */
    getMemberList(): Promise<any[]>;
    /**
     * 调用已注册的渲染服务将 HTML / URL 转换为图片
     */
    render(options: any): Promise<Buffer | string>;
    /**
     * 统一回复消息（支持纯文本、内嵌 CQ 码自动转换、或结构化参数如 { text, at: true, images }）
     */
    reply(content: ReplyContent): Promise<any>;
    /**
     * 直接调用 AI 模型回答（单轮问答）
     * - 支持指定预设 (presetId) 自动映射渠道
     * - 支持纯净基元模式 (pure: true 或指定 channelId)，完全跳过预设人设，直接向底层模型请求
     */
    queryAI(prompt: string, options?: QueryAIOptions): Promise<string>;
    /**
     * 携带当前群聊上下文向 AI 发问
     */
    askWithContext(prompt: string, options?: QueryAIOptions): Promise<string>;
    /**
     * 获取当前群近期清洗后的聊天流水
     * @param limit 条数，默认 30
     * @param formatted 是否返回排版后的文本字符串（默认 false 返回结构化对象数组）
     */
    getRecentHistory(limit?: number, formatted?: boolean): string | import("../context/groupHistoryBuffer.js").BufferedMessage[];
}
