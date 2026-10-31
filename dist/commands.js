export const CHAITE_COMMANDS = [
    { name: 'help', aliases: ['chaite', '帮助', 'help', 'gpt帮助'], description: '查看 Chaite 指令帮助', permission: 'all' },
    { name: 'reset', aliases: ['结束对话', '重置对话', '清空对话', '清空上下文', 'reset'], description: '清空你的对话上下文', permission: 'all' },
    { name: 'clearGroup', aliases: ['清空群上下文', '重置群聊', '清空群聊上下文'], description: '清空本群消息流水（主人）', permission: 'master' },
    { name: 'resetAll', aliases: ['结束全部对话', '结束所有对话', '结束全部会话', '结束所有会话', '重置全部对话', '清空全部会话', 'resetall'], description: '清空所有用户与群聊的全部会话（主人）', permission: 'master' },
    { name: 'banGroup', aliases: ['拉黑群'], description: '拉黑群聊：#拉黑群 [群号] [时长如1h]', permission: 'master', hasArgs: true },
    { name: 'unbanGroup', aliases: ['解黑群'], description: '解除群聊拉黑：#解黑群 [群号]', permission: 'master', hasArgs: true },
    { name: 'banUser', aliases: ['拉黑'], description: '拉黑用户：#拉黑 [@/QQ号] [时长如1h]', permission: 'master', hasArgs: true },
    { name: 'unbanUser', aliases: ['解黑'], description: '解除用户拉黑：#解黑 [@/QQ号]', permission: 'master', hasArgs: true },
    { name: 'presets', aliases: ['预设列表', '查看预设', '预设', 'presets'], description: '查看可用预设列表', permission: 'all' },
    { name: 'status', aliases: ['ping', '状态', 'status'], description: '查看运行状态', permission: 'all' },
    { name: 'update', aliases: ['更新', 'chaite更新', 'chaite升级', 'update'], description: '检查并在线更新 Chaite（主人）', permission: 'master' },
];
/**
 * 按注册表匹配一条消息是否为 Chaite 指令。
 * 匹配规则与既有行为一致：`<prefix><别名>` 精确命中，或 `<prefix>chaite <别名>`，
 * hasArgs 指令额外接受其后跟空白 + 参数。未命中返回 null。
 */
export function matchChaiteCommand(text, commandPrefix = '#') {
    const current = String(text || '').trim();
    if (!current)
        return null;
    // 只认配置的 commandPrefix（默认 '#'）：改前缀后旧前缀立即失效，
    // 避免与宿主（如 Yunzai）的原生指令冲突
    const prefixes = Array.from(new Set([commandPrefix || '#'])).filter(Boolean);
    for (const cmd of CHAITE_COMMANDS) {
        for (const alias of cmd.aliases) {
            for (const p of prefixes) {
                const bases = [`${p}${alias}`, `${p}chaite ${alias}`];
                for (const base of bases) {
                    if (current === base) {
                        return { command: cmd, alias, arg: '' };
                    }
                    if (cmd.hasArgs && (current.startsWith(`${base} `) || current.startsWith(`${base}\n`))) {
                        return { command: cmd, alias, arg: current.slice(base.length).trim() };
                    }
                }
            }
        }
    }
    return null;
}
/** 生成帮助文案（由注册表派生，保持与分发一致） */
export function buildHelpText(commandPrefix = '#', isMaster = true) {
    const p = commandPrefix;
    const lines = ['Chaite 交互指令', '──────────────────'];
    for (const cmd of CHAITE_COMMANDS) {
        if (cmd.permission === 'master' && !isMaster)
            continue;
        const forms = cmd.aliases.slice(0, 2).map((a) => `${p}${a}`);
        const suffix = cmd.permission === 'master' ? ' (主人)' : '';
        lines.push(`• ${forms.join(' / ')} — ${cmd.description}${suffix}`);
    }
    return lines.join('\n');
}
