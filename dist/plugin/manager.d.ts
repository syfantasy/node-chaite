import { PluginMeta, MiddlewarePhase, ChaiteEvent } from './types.js';
export declare class PluginManager {
    private pluginsDir;
    private plugins;
    private stateFilePath;
    private kvStorage?;
    readonly scriptsDir: string;
    readonly appsDir: string;
    readonly cacheDir: string;
    private adapters;
    private services;
    constructor(pluginsDir: string, driver?: any);
    setDriver(driver: any): void;
    getAdapter(name?: string): any;
    registerService(name: string, service: any): void;
    getService<T = any>(name: string): T | undefined;
    private loadState;
    private saveState;
    loadAll(): Promise<void>;
    private loadScriptPluginDir;
    private loadDirectoryPlugin;
    private clearInstanceResources;
    /**
     * 影子拷贝会把插件移到 <宿主>/plugins/.cache/runtime/<id>/<ts>/ 下运行，
     * 相对导入的解析根整体下移一层，需要两层符号链接补偿：
     *  1. runtime 根 ↔ 宿主根（pluginsDir/..）：插件里 `../../../x` 原解析到
     *     <宿主根>/x（如 Yunzai 插件的 ../../../lib/plugins/plugin.js）；
     *  2. runtime/<id> ↔ plugins 目录：插件里 `../../x` 原解析到兄弟插件
     *     plugins/x（如 ../other 与 ../../other/restart.js）。
     * 已存在的条目一律跳过。
     */
    private ensureRuntimePathShim;
    private prepareDirectoryRuntime;
    private initPluginModule;
    getPlugins(): PluginMeta[];
    togglePlugin(id: string, enabled: boolean): Promise<boolean>;
    updatePluginConfig(id: string, newConfig: Record<string, any>): Promise<boolean>;
    reloadPlugin(id: string): Promise<boolean>;
    getPluginCode(id: string): string | null;
    savePluginCode(id: string, code: string): Promise<boolean>;
    exportPlugin(id: string, includeConfig?: boolean, format?: 'zip' | 'raw'): Promise<{
        filename: string;
        buffer: Buffer;
    }>;
    importPlugin(targetType: 'single-file' | 'directory', filename: string, buffer: Buffer, options?: {
        overwrite?: boolean;
        customId?: string;
    }): Promise<{
        id: string;
        overwritten?: boolean;
    }>;
    deletePlugin(id: string, keepConfig?: boolean): Promise<boolean>;
    resetPluginConfig(id: string): Promise<Record<string, any>>;
    private messagePipelineHandler?;
    setMessagePipelineHandler(handler: (event: ChaiteEvent) => Promise<void>): void;
    emitMessage(event: ChaiteEvent): Promise<boolean>;
    private parseListConfig;
    private isBlockedByPluginCommonConfig;
    dispatchCommand(event: ChaiteEvent): Promise<boolean>;
    dispatchMiddleware(phase: MiddlewarePhase, ctx: any): Promise<boolean>;
    triggerAction(pluginId: string, actionName: string, payload?: any): Promise<{
        success: boolean;
        message?: string;
        data?: any;
    }>;
}
