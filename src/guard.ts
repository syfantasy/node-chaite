import { AppConfig, getConfig } from './config.js'

export interface CheckResult {
  allow: boolean
  reason?: string
}

export interface MinimalMessageEvent {
  message_type: 'group' | 'private'
  user_id: number | string
  group_id?: number | string
}

export interface TimedBanItem {
  targetId: number
  type: 'user' | 'group'
  expireAt: number // 时间戳 (毫秒)
  reason?: string
}

const timedBans = new Map<string, TimedBanItem>()

/**
 * 解析时长字符串 (如 "10m", "2h", "30s", "1d") 为毫秒数
 */
export function parseDuration(durationStr?: string): number | null {
  if (!durationStr) return null
  const match = durationStr.trim().match(/^(\d+(?:\.\d+)?)\s*(s|m|h|d|秒|分|小时|天)?$/i)
  if (!match) return null
  const num = parseFloat(match[1])
  const unit = (match[2] || 'm').toLowerCase()
  switch (unit) {
    case 's':
    case '秒':
      return Math.round(num * 1000)
    case 'm':
    case '分':
      return Math.round(num * 60 * 1000)
    case 'h':
    case '小时':
      return Math.round(num * 3600 * 1000)
    case 'd':
    case '天':
      return Math.round(num * 86400 * 1000)
    default:
      return Math.round(num * 60 * 1000)
  }
}

/**
 * 设置目标封禁 (支持时限，以供模型工具或管理员指令调用)
 */
export function banTarget(
  targetId: number,
  type: 'user' | 'group',
  durationMs?: number | null,
  reason?: string
): { isPermanent: boolean; expireAt?: number } {
  const key = `${type}_${targetId}`
  if (!durationMs || durationMs <= 0) {
    timedBans.delete(key)
    return { isPermanent: true }
  }

  const expireAt = Date.now() + durationMs
  timedBans.set(key, { targetId, type, expireAt, reason })
  return { isPermanent: false, expireAt }
}

/**
 * 解除目标封禁
 */
export function unbanTarget(targetId: number, type: 'user' | 'group'): void {
  const key = `${type}_${targetId}`
  timedBans.delete(key)
}

/**
 * 检查目标是否被封禁 (自动清理已过期项)
 */
export function isTargetBanned(targetId: number, type: 'user' | 'group', config: AppConfig): boolean {
  if (type === 'user' && config.management.blackUsers.includes(targetId)) {
    return true
  }
  if (type === 'group' && config.management.blackGroups.includes(targetId)) {
    return true
  }

  const key = `${type}_${targetId}`
  const item = timedBans.get(key)
  if (item) {
    if (Date.now() < item.expireAt) {
      return true
    } else {
      timedBans.delete(key) // 过期自动解黑
    }
  }

  return false
}

// 暴露给全局供任意插件与大模型 Tool 自发调用
;(globalThis as any).banManager = {
  banTarget,
  unbanTarget,
  isTargetBanned,
  parseDuration,
  getTimedBans: () => Array.from(timedBans.values()),
}

export function checkPermission(event: MinimalMessageEvent, config: AppConfig = getConfig()): CheckResult {
  const userId = Number(event.user_id)
  const isGroup = event.message_type === 'group'
  const groupId = isGroup && event.group_id ? Number(event.group_id) : undefined

  // 1. Blacklist check (always drop blacklisted users, including timed bans)
  if (isTargetBanned(userId, 'user', config)) {
    return { allow: false, reason: 'user_in_blacklist' }
  }

  // 2. Group checks
  if (isGroup) {
    if (!groupId) {
      return { allow: false, reason: 'missing_group_id' }
    }
    if (isTargetBanned(groupId, 'group', config)) {
      return { allow: false, reason: 'group_in_blacklist' }
    }
    // Strict group whitelist check: only allowed groups can trigger the bot
    if (config.management.whiteGroups.length > 0 && !config.management.whiteGroups.includes(groupId)) {
      return { allow: false, reason: 'group_not_in_whitelist' }
    }
  } else {
    // 3. Private message checks
    if (!config.chat.allowPrivate) {
      const isMaster = config.management.masterUsers.includes(userId)
      if (!isMaster) {
        return { allow: false, reason: 'private_chat_disabled' }
      }
    }
    if (config.management.whiteUsers.length > 0) {
      const isWhitelisted = config.management.whiteUsers.includes(userId)
      const isMaster = config.management.masterUsers.includes(userId)
      if (!isWhitelisted && !isMaster) {
        return { allow: false, reason: 'user_not_in_whitelist' }
      }
    }
  }

  return { allow: true }
}
