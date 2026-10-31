/**
 * Chaite 内置指令注册表（单一来源）
 *
 * - handleMessage 的指令分发按此表匹配与执行；
 * - GET /api/bridge/commands 把此表暴露给宿主适配器（如 chatgpt-plugin），
 *   由宿主据此把命中指令的消息原样转发进来，宿主侧不再各自硬编码指令。
 *
 * 新增指令时：在此表登记 → 在 handleMessage 的 dispatch 分支实现执行体。
 */
export interface ChaiteCommand {
    /** 指令主名（不含前缀），同时作为 dispatch 的标识 */
    name: string;
    /** 等效别名（同样不含前缀） */
    aliases: string[];
    /** 帮助文案 */
    description: string;
    /** all=所有人可用；master=仅主人（config.management.masterUsers） */
    permission: 'all' | 'master';
    /** 是否接受参数（如 #拉黑 10001 1h） */
    hasArgs?: boolean;
}
export declare const CHAITE_COMMANDS: ChaiteCommand[];
export interface ChaiteCommandHit {
    command: ChaiteCommand;
    /** 实际命中的别名 */
    alias: string;
    /** hasArgs 指令时，前缀+指令之后剩余的参数文本 */
    arg: string;
}
/**
 * 按注册表匹配一条消息是否为 Chaite 指令。
 * 匹配规则与既有行为一致：`<prefix><别名>` 精确命中，或 `<prefix>chaite <别名>`，
 * hasArgs 指令额外接受其后跟空白 + 参数。未命中返回 null。
 */
export declare function matchChaiteCommand(text: string, commandPrefix?: string): ChaiteCommandHit | null;
/** 生成帮助文案（由注册表派生，保持与分发一致） */
export declare function buildHelpText(commandPrefix?: string, isMaster?: boolean): string;
