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
    command?: string;
    args: string;
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
}
