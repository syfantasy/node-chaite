import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PluginManager } from './manager.js';
import { resolveRootDataDir } from '../config.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/**
 * 解析 Chaite 自己的插件目录。
 *
 * - 独立部署（cwd 即包根）：沿用 <包根>/plugins，历史布局零迁移。
 * - 嵌入式（被 Yunzai 等宿主作为依赖加载）：cwd 是宿主根目录，若还用
 *   cwd/plugins 就会把宿主的插件目录当成自己的 —— 面板会列出 Yunzai 的
 *   chatgpt-plugin / miao-plugin / genshin…，而且面板「删除」会 rm -rf
 *   掉宿主插件目录，风险极高。因此改放 Chaite 自己的数据目录：
 *   <dataDir>/plugins（依赖模式下即 <宿主>/data/chaite/plugins）。
 *
 * 可用 CHAITE_PLUGINS_DIR 显式覆盖。
 */
function resolvePluginsDir() {
    const envDir = process.env.CHAITE_PLUGINS_DIR?.trim();
    if (envDir)
        return path.resolve(envDir);
    // 本文件编译后位于 <pkg>/dist/plugin/，上两级才是包根
    const pkgRoot = path.resolve(__dirname, '../..');
    const isStandalone = path.resolve(process.cwd()) === pkgRoot;
    if (isStandalone)
        return path.join(pkgRoot, 'plugins');
    const dataDir = resolveRootDataDir();
    const target = path.join(dataDir, 'plugins');
    migrateLegacyPlugins(path.join(process.cwd(), 'plugins'), target);
    return target;
}
/**
 * 老版本嵌入式部署把插件写在 <宿主>/plugins/{apps,scripts} 下，这里把
 * 这两个（Chaite 专属的）子目录搬到新位置，避免升级后插件"消失"。
 * 只动 apps/scripts，绝不碰宿主的其它插件目录。
 */
function migrateLegacyPlugins(legacyDir, targetDir) {
    for (const sub of ['apps', 'scripts']) {
        const from = path.join(legacyDir, sub);
        const to = path.join(targetDir, sub);
        if (!fs.existsSync(from) || fs.existsSync(to))
            continue;
        let hasContent = false;
        try {
            // 忽略 .gitkeep 之类的占位文件，避免把空目录当成有插件而误迁移
            hasContent = fs.readdirSync(from).some(name => !name.startsWith('.'));
        }
        catch {
            hasContent = false;
        }
        if (!hasContent)
            continue;
        try {
            fs.mkdirSync(path.dirname(to), { recursive: true });
            fs.renameSync(from, to);
            console.log(`[PluginManager] 已迁移旧插件目录: ${from} -> ${to}`);
        }
        catch (e) {
            console.warn(`[PluginManager] 迁移旧插件目录失败 (${from}):`, e?.message || e);
        }
    }
}
export const pluginManager = new PluginManager(resolvePluginsDir());
export * from './types.js';
export { PluginManager };
