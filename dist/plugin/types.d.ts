import { ChaiteEvent } from './event.js';
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
export { ChaiteEvent };
