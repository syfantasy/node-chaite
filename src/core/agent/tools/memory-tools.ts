import type { ChaiteContext } from '../../types/common'
import type { Tool } from '../../types/tools'
import type { MemoryScope } from '../../memory/types'
import { buildTargetId } from '../../storage/sql/memory_storage'

export function createMemoryTools(): Tool[] {
  return [rememberTool(), updateImportanceTool(), getMemoriesTool(), forgetMemoryTool()]
}

const SILENT_INSTRUCTION = '【内部执行契约】：记忆处理已在后台静默完成。请直接根据对话语境自然回复群友/用户，绝对禁止在回答中提及“我已记住”、“调整了记忆”、“重要度不足”、“记忆库已满”等系统内部行为字眼。'

function rememberTool(): Tool {
  return {
    name: 'remember',
    type: 'function',
    function: {
      name: 'remember',
      description: '记录或更新长期事实记忆。本工具会在后台根据重要度（1~100）自动进行优先置换（若已满，高重要度自动挤掉最低重要度的旧记忆）。记录完成后请直接自然对话，切勿口头向用户汇报记录状态。',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '记忆的具体事实内容' },
          scope: {
            type: 'string',
            enum: ['user', 'group'],
            description: '作用域：user (当前发言人在本群/私聊的个人事实，严格群隔离保护隐私), group (本群整体共享常识/群规，仅群聊可用)',
          },
          key: {
            type: 'string',
            description: '简短标识键（如 preferences, identity, rule 等）',
          },
          importance: {
            type: 'number',
            description: '重要度打分 (1~100 分制，默认 50)。核心身份/根本禁忌打 85~100；长期偏好/稳定事实打 60~80；普通日常事实打 30~50；临时琐事打 1~29。',
          },
        },
        required: ['content', 'scope', 'key'],
      },
    },
    async run(args, context?: ChaiteContext) {
      if (!context) return JSON.stringify({ error: 'Context is missing' })
      const memoryManager = context.getChaite()?.getMemoryManager()
      if (!memoryManager) return JSON.stringify({ error: 'Memory manager is not available' })

      const rawScope = String(args.scope || 'user').trim()
      const key = String(args.key || 'fact').trim()
      const content = String(args.content || '').trim()
      const rawImportance = args.importance !== undefined ? Number(args.importance) : 50

      if (!content) return JSON.stringify({ error: 'Memory content cannot be empty' })

      const event = context.getEvent() as any
      const groupId = event?.group_id ? String(event.group_id) : (event?.group?.group_id ? String(event.group.group_id) : undefined)
      const userId = event?.user_id ? String(event.user_id) : (event?.sender?.user_id ? String(event.sender.user_id) : 'default_user')

      let targetScope: MemoryScope = 'group_user'
      let finalGroupId: string | null = null
      let finalUserId: string | null = null

      if (rawScope === 'group') {
        if (!groupId) {
          return JSON.stringify({ error: '当前不在群聊中，无法记录群共享记忆', instruction: SILENT_INSTRUCTION })
        }
        targetScope = 'group'
        finalGroupId = groupId
      } else {
        if (groupId) {
          targetScope = 'group_user'
          finalGroupId = groupId
          finalUserId = userId
        } else {
          targetScope = 'private_user'
          finalUserId = userId
        }
      }

      const res = await memoryManager.getActiveProvider().setMemory({
        scope: targetScope,
        groupId: finalGroupId,
        userId: finalUserId,
        key,
        content,
        importance: rawImportance,
      })

      return JSON.stringify({
        ...res,
        instruction: SILENT_INSTRUCTION,
      })
    },
  }
}

function updateImportanceTool(): Tool {
  return {
    name: 'update_memory_importance',
    type: 'function',
    function: {
      name: 'update_memory_importance',
      description: '动态调整已有某条记忆的重要度分值（1~100）。若某条事实变得更关键或已不重要，可通过本工具微调。执行后同样静默，切勿向用户口头汇报。',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: '要调整重要度的记忆键名' },
          scope: {
            type: 'string',
            enum: ['user', 'group'],
            description: '作用域：user (当前用户在本群/私聊的记忆), group (本群共享记忆)',
          },
          importance: {
            type: 'number',
            description: '新的重要度分值 (1~100)',
          },
        },
        required: ['key', 'scope', 'importance'],
      },
    },
    async run(args, context?: ChaiteContext) {
      if (!context) return JSON.stringify({ error: 'Context is missing' })
      const memoryManager = context.getChaite()?.getMemoryManager()
      if (!memoryManager) return JSON.stringify({ error: 'Memory manager is not available' })

      const key = String(args.key || '').trim()
      const rawScope = String(args.scope || 'user').trim()
      const newImp = Number(args.importance)

      if (!key || Number.isNaN(newImp)) {
        return JSON.stringify({ error: 'key and valid numeric importance are required' })
      }

      const event = context.getEvent() as any
      const groupId = event?.group_id ? String(event.group_id) : (event?.group?.group_id ? String(event.group.group_id) : undefined)
      const userId = event?.user_id ? String(event.user_id) : (event?.sender?.user_id ? String(event.sender.user_id) : undefined)

      let targetScope: MemoryScope = 'group_user'
      let finalGroupId: string | null = null
      let finalUserId: string | null = null

      if (rawScope === 'group') {
        if (!groupId) return JSON.stringify({ error: '当前不在群聊中' })
        targetScope = 'group'
        finalGroupId = groupId
      } else {
        if (groupId) {
          targetScope = 'group_user'
          finalGroupId = groupId
          finalUserId = userId || null
        } else {
          targetScope = 'private_user'
          finalUserId = userId || null
        }
      }

      const targetId = buildTargetId(targetScope, finalGroupId, finalUserId)
      const ok = await memoryManager.getActiveProvider().updateImportance(targetScope, targetId, key, newImp)

      return JSON.stringify({
        success: ok,
        message: ok ? `记忆 [${key}] 重要度已调整为 ${newImp}` : `未找到匹配的记忆条目 [${key}]`,
        instruction: SILENT_INSTRUCTION,
      })
    },
  }
}

function getMemoriesTool(): Tool {
  return {
    name: 'get_memories',
    type: 'function',
    function: {
      name: 'get_memories',
      description: '主动查询当前场景（本群共享、发言人在本群的个人事实、私聊）相关的长期事实记忆。',
      parameters: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['all', 'user', 'group'],
            description: '查询作用域：all (当前场景全部可见记忆), user (发言人在本环境的记忆), group (本群共享记忆)',
          },
          key: { type: 'string', description: '可选，精确指定记忆键名' },
        },
        required: [],
      },
    },
    async run(args, context?: ChaiteContext) {
      if (!context) return JSON.stringify({ error: 'Context is missing' })
      const memoryManager = context.getChaite()?.getMemoryManager()
      if (!memoryManager) return JSON.stringify({ error: 'Memory manager is not available' })

      const scope = String(args.scope || 'all').trim()
      const key = args.key ? String(args.key).trim() : undefined
      const event = context.getEvent() as any
      const groupId = event?.group_id ? String(event.group_id) : (event?.group?.group_id ? String(event.group.group_id) : undefined)
      const userId = event?.user_id ? String(event.user_id) : (event?.sender?.user_id ? String(event.sender.user_id) : undefined)

      const provider = memoryManager.getActiveProvider()
      const results: Record<string, any[]> = {}

      if (groupId && (scope === 'group' || scope === 'all')) {
        const mems = await provider.getMemories({ scope: 'group', groupId, key })
        results.groupSharedMemories = mems.map(m => ({ key: m.key, content: m.content, importance: m.importance, updatedAt: m.updatedAt }))
      }

      if (userId && (scope === 'user' || scope === 'all')) {
        if (groupId) {
          const mems = await provider.getMemories({ scope: 'group_user', groupId, userId, key })
          results.groupUserMemories = mems.map(m => ({ key: m.key, content: m.content, importance: m.importance, updatedAt: m.updatedAt }))
        } else {
          const mems = await provider.getMemories({ scope: 'private_user', userId, key })
          results.privateUserMemories = mems.map(m => ({ key: m.key, content: m.content, importance: m.importance, updatedAt: m.updatedAt }))
        }
      }

      return JSON.stringify(results)
    },
  }
}

function forgetMemoryTool(): Tool {
  return {
    name: 'forget_memory',
    type: 'function',
    function: {
      name: 'forget_memory',
      description: '主动遗忘或删除已过时的某条长期记忆。执行后静默，切勿向用户口头汇报。',
      parameters: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['user', 'group'],
            description: '作用域：user (发言人在本群/私聊的记忆), group (本群共享记忆)',
          },
          key: { type: 'string', description: '要遗忘的记忆标识键' },
        },
        required: ['scope', 'key'],
      },
    },
    async run(args, context?: ChaiteContext) {
      if (!context) return JSON.stringify({ error: 'Context is missing' })
      const memoryManager = context.getChaite()?.getMemoryManager()
      if (!memoryManager) return JSON.stringify({ error: 'Memory manager is not available' })

      const rawScope = String(args.scope || 'user').trim()
      const key = String(args.key || '').trim()
      if (!key) return JSON.stringify({ error: 'Key is required' })

      const event = context.getEvent() as any
      const groupId = event?.group_id ? String(event.group_id) : (event?.group?.group_id ? String(event.group.group_id) : undefined)
      const userId = event?.user_id ? String(event.user_id) : (event?.sender?.user_id ? String(event.sender.user_id) : undefined)

      let targetScope: MemoryScope = 'group_user'
      let finalGroupId: string | null = null
      let finalUserId: string | null = null

      if (rawScope === 'group') {
        targetScope = 'group'
        finalGroupId = groupId || null
      } else {
        if (groupId) {
          targetScope = 'group_user'
          finalGroupId = groupId
          finalUserId = userId || null
        } else {
          targetScope = 'private_user'
          finalUserId = userId || null
        }
      }

      const ok = await memoryManager.getActiveProvider().deleteMemory({
        scope: targetScope,
        groupId: finalGroupId,
        userId: finalUserId,
        key,
      })

      return JSON.stringify({
        success: ok,
        message: ok ? `已遗忘 [${key}]` : `未找到匹配的记忆条目 [${key}]`,
        instruction: SILENT_INSTRUCTION,
      })
    },
  }
}
