import type { ChaiteContext } from '../types/common.js'
import type { Tool } from '../types/tools.js'
import {
  MEMORY_LIMITS,
  MemoryFilter,
  MemoryInput,
  MemoryProvider,
  MemoryRecord,
  MemoryScope,
  SetMemoryResult,
} from './types.js'
import { createMemoryTools } from '../agent/tools/memory-tools.js'
import { buildTargetId, SqlMemoryStorage } from '../storage/sql/memory_storage.js'

export * from './types.js'

export class DefaultMemoryProvider implements MemoryProvider {
  readonly id = 'builtin-lightweight'
  readonly name = 'Chaite 内置轻量分群记忆（优先队列与群隔离）'

  constructor(private storage: SqlMemoryStorage) {}

  async injectContext(
    context: ChaiteContext,
    options?: { groupId?: string; userId?: string }
  ): Promise<string | undefined> {
    const event = context.getEvent() as any
    const gid = options?.groupId || (event?.group_id ? String(event.group_id) : (event?.group?.group_id ? String(event.group.group_id) : undefined))
    const uid = options?.userId || (event?.user_id ? String(event.user_id) : (event?.sender?.user_id ? String(event.sender.user_id) : undefined))

    const lines: string[] = []

    if (gid) {
      // 1. 本群共享记忆（全量注入，最多 20 条）
      const groupMems = await this.storage.getMemories({ scope: 'group', groupId: gid, limit: MEMORY_LIMITS.group })
      if (groupMems.length > 0) {
        lines.push(`【当前群聊共享记忆 (${groupMems.length}/${MEMORY_LIMITS.group})】`)
        for (const m of groupMems) {
          lines.push(`- [${m.key}] ${m.content} (重要度: ${m.importance})`)
        }
      }

      // 2. 当前提问者在「本群」的记忆（严格群隔离，全量注入，最多 20 条）
      if (uid) {
        const groupUserMems = await this.storage.getMemories({
          scope: 'group_user',
          groupId: gid,
          userId: uid,
          limit: MEMORY_LIMITS.group_user,
        })
        if (groupUserMems.length > 0) {
          lines.push(`【发言者在当前群的个人事实 (QQ: ${uid}) (${groupUserMems.length}/${MEMORY_LIMITS.group_user})】（仅在本群生效，严格隔离）`)
          for (const m of groupUserMems) {
            lines.push(`- [${m.key}] ${m.content} (重要度: ${m.importance})`)
          }
        }
      }
    } else if (uid) {
      // 3. 私聊场景下的个人记忆（全量注入，最多 30 条）
      const privateMems = await this.storage.getMemories({
        scope: 'private_user',
        userId: uid,
        limit: MEMORY_LIMITS.private_user,
      })
      if (privateMems.length > 0) {
        lines.push(`【私聊用户个人记忆 (QQ: ${uid}) (${privateMems.length}/${MEMORY_LIMITS.private_user})】`)
        for (const m of privateMems) {
          lines.push(`- [${m.key}] ${m.content} (重要度: ${m.importance})`)
        }
      }
    }

    if (lines.length === 0) {
      return undefined
    }

    return `<long_term_memory>\n${lines.join('\n')}\n</long_term_memory>`
  }

  getTools(): Tool[] {
    return createMemoryTools()
  }

  async getMemories(filter: MemoryFilter): Promise<MemoryRecord[]> {
    return this.storage.getMemories(filter)
  }

  async setMemory(input: MemoryInput): Promise<SetMemoryResult> {
    return this.storage.setMemory(input)
  }

  async updateImportance(scope: MemoryScope, targetId: string, key: string, newImportance: number): Promise<boolean> {
    return this.storage.updateImportance(scope, targetId, key, newImportance)
  }

  async deleteMemory(idOrFilter: string | { scope: MemoryScope; groupId?: string | null; userId?: string | null; key: string }): Promise<boolean> {
    return this.storage.deleteMemory(idOrFilter)
  }

  getStorage(): SqlMemoryStorage {
    return this.storage
  }
}

export class MemoryManager {
  private activeProvider: MemoryProvider
  private providers = new Map<string, MemoryProvider>()

  constructor(defaultProvider: MemoryProvider) {
    this.activeProvider = defaultProvider
    this.providers.set(defaultProvider.id, defaultProvider)
  }

  registerProvider(provider: MemoryProvider, setAsActive = true) {
    this.providers.set(provider.id, provider)
    if (setAsActive) {
      this.activeProvider = provider
    }
  }

  getActiveProvider(): MemoryProvider {
    return this.activeProvider
  }

  getProvider(id: string): MemoryProvider | undefined {
    return this.providers.get(id)
  }

  setActiveProvider(id: string): boolean {
    const p = this.providers.get(id)
    if (p) {
      this.activeProvider = p
      return true
    }
    return false
  }
}
