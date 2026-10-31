import { groupHistoryBuffer, groupMessageRefStore } from './context/groupHistoryBuffer.js';
import { ChaiteEvent } from './plugin/index.js';
export declare function handleMessage(event: ChaiteEvent, storageCtx: any): Promise<void>;
export * from './core/index.js';
export * from './config.js';
export * from './storage.js';
export * from './server.js';
export * from './plugin/index.js';
export { CHAITE_COMMANDS, matchChaiteCommand, buildHelpText } from './commands.js';
export { groupHistoryBuffer, groupMessageRefStore };
/**
 * 幂等的 bootstrap：全进程只执行一次。
 *
 * 去重标志必须挂在 globalThis 上而不是模块级变量：当 chaite 以依赖形式
 * 嵌入宿主（如 Yunzai）时，PluginManager 会对宿主插件目录做影子拷贝
 * （plugins/.cache/runtime/<id>/<ts>/）再 import，每份影子副本都是独立的
 * 模块实例，模块级标志会被绕过，导致 bootstrap → loadAll → 影子拷贝 →
 * 再次 bootstrap 的无限递归（表现为反复 "Starting Chaite" / EADDRINUSE）。
 */
export declare function bootstrap(): Promise<void>;
