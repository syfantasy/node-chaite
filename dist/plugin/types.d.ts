import { ChaiteEvent, type ForwardNode } from './event.js';
export type PluginType = 'single-file' | 'directory';
export interface PluginConfigField {
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'textarea' | 'select' | 'button';
    default?: any;
    description?: string;
    options?: Array<{
        label: string;
        value: any;
    }>;
    group?: 'plugin' | 'common';
    buttonText?: string;
    buttonType?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';
    action?: string;
}
export interface PluginMeta {
    id: string;
    name: string;
    version?: string;
    description?: string;
    author?: string;
    type: PluginType;
    enabled: boolean;
    entryPath: string;
    configSchema?: PluginConfigField[];
    config?: Record<string, any>;
}
export interface PluginStorageClient {
    get: <T = any>(key: string, defaultValue?: T) => Promise<T | undefined>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<boolean>;
    list: () => Promise<Record<string, any>>;
    clear: () => Promise<number>;
}
export type CommandHandler = (e: ChaiteEvent) => Promise<boolean | void>;
export interface CommandRule {
    match: string | RegExp;
    description?: string;
    adminOnly?: boolean;
}
export type MiddlewarePhase = 'before_llm' | 'after_llm';
export type MiddlewareHandler = (ctx: {
    event: any;
    userMessage?: any;
    preset?: any;
    replyText?: string;
}) => Promise<void | boolean>;
export interface RenderOptions {
    html?: string;
    url?: string;
    selector?: string;
    viewport?: {
        width: number;
        height: number;
        deviceScaleFactor?: number;
    };
    format?: 'png' | 'jpeg' | 'webp';
    quality?: number;
}
export interface RendererService {
    render: (options: RenderOptions) => Promise<Buffer | string>;
}
export declare const COMMON_PLUGIN_SCHEMA_FIELDS: PluginConfigField[];
export interface PluginSkillDefinition {
    id?: string;
    name: string;
    description: string;
    keywords?: string[];
    allowedTools?: string[];
    mcpServer?: string;
    mcpTools?: string[];
    instructions?: string;
    validate?: (event: ChaiteEvent) => boolean | Promise<boolean>;
}
export interface ChatExecutionOptions {
    /** 指定使用的预设 ID（若不传则遵循常规匹配/默认预设） */
    presetId?: string;
    /** 显式覆盖本轮模型输入内容（如分析 GitHub 仓库内容），缺省使用 event.text */
    input?: string;
    /** 限制工具白名单（仅允许调用的工具名称数组） */
    tools?: string[];
    /** 是否将本轮交互存入持久会话历史（默认 true；临时/特定任务可置为 false 避免上下文污染） */
    saveHistory?: boolean;
    /** 是否由框架自动将回复发送至群聊/私聊（默认 true；设为 false 时由调用方自行处理返回值） */
    autoReply?: boolean;
    /** 触发原因标识，体现在操作日志与环境提示块（如 poke_bot、github_analysis） */
    triggerReason?: string;
    /** 自定义环境描述块（覆盖 <chat_environment> 中的 triggerWay 或 interactMode） */
    environment?: {
        triggerWay?: string;
        interactMode?: string;
        [key: string]: any;
    };
    /** 单次自定义场景协议提示词转换/精简函数 */
    transformProtocol?: (protocol: string) => string;
    /** 单次自定义群聊花名册条目渲染函数（可注入年龄、性别、专属头衔等） */
    transformRosterItem?: (member: any, defaultStr: string) => string;
    /** 单次自定义群聊流水条目过滤函数 */
    filterFlow?: (msg: any) => boolean;
    /** 单次自定义群聊流水条目格式转换函数 */
    transformFlowItem?: (msg: any, defaultStr: string) => string;
}
export interface PluginHooks {
    /** 注册全局场景协议转换钩子 */
    onBuildProtocol: (hook: (protocol: string, ctx?: any) => string) => void;
    /** 注册全局花名册条目渲染钩子 */
    onBuildRosterItem: (hook: (member: any, defaultStr: string, ctx?: any) => string) => void;
    /** 注册全局群聊流水过滤钩子 */
    onFilterFlow: (hook: (msg: any, ctx?: any) => boolean) => void;
}
export interface PluginContext {
    pluginId: string;
    config: Record<string, any>;
    storage: PluginStorageClient;
    logger: {
        info: (...args: any[]) => void;
        warn: (...args: any[]) => void;
        error: (...args: any[]) => void;
        debug: (...args: any[]) => void;
    };
    saveConfig: (newConfig: Record<string, any>) => Promise<void>;
    registerCommand: (rule: string | RegExp | CommandRule, handler: CommandHandler) => void;
    registerAction: (actionName: string, handler: (payload?: any) => Promise<{
        success: boolean;
        message?: string;
        data?: any;
    } | void>) => void;
    registerAdapter: (name: string, adapter: any) => void;
    registerModelProvider: (name: string, provider: any) => void;
    registerMiddleware: (phase: MiddlewarePhase, handler: MiddlewareHandler) => void;
    registerTool: (tool: any) => void;
    cron: (cronExpression: string, handler: () => void | Promise<void>) => () => void;
    onDestroy: (cleanupFn: () => void | Promise<void>) => void;
    emitMessage: (event: ChaiteEvent) => Promise<boolean>;
    onPoke: (handler: (e: ChaiteEvent) => Promise<boolean | void>) => void;
    onMemberJoin: (handler: (e: ChaiteEvent) => Promise<boolean | void>) => void;
    onMemberLeave: (handler: (e: ChaiteEvent) => Promise<boolean | void>) => void;
    onRequest: (handler: (e: ChaiteEvent) => Promise<boolean | void>) => void;
    onRecall: (handler: (e: ChaiteEvent) => Promise<boolean | void>) => void;
    getAdapter: (name?: string) => any;
    client: any;
    registerService: (name: string, service: any) => void;
    getService: <T = any>(name: string) => T | undefined;
    registerRenderer: (renderer: RendererService) => void;
    render: (options: RenderOptions) => Promise<Buffer | string>;
    readonly services: Map<string, any>;
    registerSkill: (skill: PluginSkillDefinition) => void;
    getGroupHistory: (groupId: string | number, limit?: number, formatted?: boolean) => any;
    chat: (event: ChaiteEvent, options?: ChatExecutionOptions) => Promise<any>;
    hooks: PluginHooks;
}
export interface PluginInstance {
    meta: PluginMeta;
    commands: Array<{
        rule: CommandRule;
        handler: CommandHandler;
    }>;
    pokeHandlers: Array<(e: ChaiteEvent) => Promise<boolean | void>>;
    memberJoinHandlers: Array<(e: ChaiteEvent) => Promise<boolean | void>>;
    memberLeaveHandlers: Array<(e: ChaiteEvent) => Promise<boolean | void>>;
    requestHandlers: Array<(e: ChaiteEvent) => Promise<boolean | void>>;
    recallHandlers: Array<(e: ChaiteEvent) => Promise<boolean | void>>;
    actions: Map<string, (payload?: any) => Promise<any>>;
    middlewares: Array<{
        phase: MiddlewarePhase;
        handler: MiddlewareHandler;
    }>;
    cronJobs: Array<() => void>;
    cleanupFns: Array<() => void | Promise<void>>;
    adapters: Map<string, any>;
    modelProviders: Map<string, any>;
    tools: any[];
    skills: string[];
    services: Map<string, any>;
    rawModule?: any;
}
export interface ReplyMessageInfo {
    messageId: number | string;
    userId?: number | string;
    sender?: {
        userId: number | string;
        nickname: string;
        card?: string;
    };
    text: string;
    rawText: string;
    images: Array<{
        ref?: string;
        url?: string;
        mimeType?: string;
        base64?: string;
    }>;
    raw?: any;
}
export { ChaiteEvent, type ForwardNode };
