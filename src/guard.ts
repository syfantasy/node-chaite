import { AppConfig, getConfig } from './config'

export interface CheckResult {
  allow: boolean
  reason?: string
}

export interface MinimalMessageEvent {
  message_type: 'group' | 'private'
  user_id: number | string
  group_id?: number | string
}

export function checkPermission(event: MinimalMessageEvent, config: AppConfig = getConfig()): CheckResult {
  const userId = Number(event.user_id)
  const isGroup = event.message_type === 'group'
  const groupId = isGroup && event.group_id ? Number(event.group_id) : undefined

  // 1. Blacklist check (always drop blacklisted users)
  if (config.management.blackUsers.includes(userId)) {
    return { allow: false, reason: 'user_in_blacklist' }
  }

  // 2. Group checks
  if (isGroup) {
    if (!groupId) {
      return { allow: false, reason: 'missing_group_id' }
    }
    if (config.management.blackGroups.includes(groupId)) {
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
