import type { Tool } from '../types/tools'
import type { ChaiteContext } from '../types/common'

export type MemoryScope = 'group' | 'group_user' | 'private_user'

export interface MemoryRecord {
  id: string
  scope: MemoryScope
  groupId?: string | null
  userId?: string | null
  targetId: string
  key: string
  content: string
  importance: number // 百分制 (1~100)
  updatedAt: number
}

export interface MemoryFilter {
  scope?: MemoryScope
  groupId?: string | null
  userId?: string | null
  targetId?: string
  key?: string
  limit?: number
  offset?: number
}

export interface MemoryInput {
  scope: MemoryScope
  groupId?: string | null
  userId?: string | null
  key: string
  content: string
  importance?: number // 1~100，默认 50
}

export interface SetMemoryResult {
  success: boolean
  action: 'inserted' | 'updated' | 'replaced' | 'skipped_low_importance'
  replacedKey?: string
  message: string
}

export interface MemoryLimits {
  group: number
  group_user: number
  private_user: number
}

export const MEMORY_LIMITS: MemoryLimits = {
  group: 20,
  group_user: 20,
  private_user: 30,
}

/**
 * 记忆提供者接口（SPI）
 */
export interface MemoryProvider {
  readonly id: string
  readonly name: string

  injectContext(context: ChaiteContext, options?: { groupId?: string; userId?: string }): Promise<string | undefined>
  getTools(): Tool[]
  getMemories(filter: MemoryFilter): Promise<MemoryRecord[]>
  setMemory(input: MemoryInput): Promise<SetMemoryResult>
  updateImportance(scope: MemoryScope, targetId: string, key: string, newImportance: number): Promise<boolean>
  deleteMemory(idOrFilter: string | { scope: MemoryScope; groupId?: string | null; userId?: string | null; key: string }): Promise<boolean>
}
