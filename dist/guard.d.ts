import { AppConfig } from './config.js';
export interface CheckResult {
    allow: boolean;
    reason?: string;
}
export interface MinimalMessageEvent {
    message_type: 'group' | 'private';
    user_id: number | string;
    group_id?: number | string;
}
export interface TimedBanItem {
    targetId: number;
    type: 'user' | 'group';
    expireAt: number;
    reason?: string;
}
/**
 * 解析时长字符串 (如 "10m", "2h", "30s", "1d") 为毫秒数
 */
export declare function parseDuration(durationStr?: string): number | null;
/**
 * 设置目标封禁 (支持时限，以供模型工具或管理员指令调用)
 */
export declare function banTarget(targetId: number, type: 'user' | 'group', durationMs?: number | null, reason?: string): {
    isPermanent: boolean;
    expireAt?: number;
};
/**
 * 解除目标封禁
 */
export declare function unbanTarget(targetId: number, type: 'user' | 'group'): void;
/**
 * 检查目标是否被封禁 (自动清理已过期项)
 */
export declare function isTargetBanned(targetId: number, type: 'user' | 'group', config: AppConfig): boolean;
/**
 * 生效的主人列表：面板配置（config.management.masterUsers）优先；
 * 未配置时回退宿主注入的 event.masters（如 Yunzai other.yaml 的 masterQQ）。
 * 两者皆无时返回空数组（调用方自行决定「无配置=全员主人」语义）。
 */
export declare function getEffectiveMasters(event: any, config?: AppConfig): number[];
export declare function checkPermission(event: MinimalMessageEvent, config?: AppConfig): CheckResult;
