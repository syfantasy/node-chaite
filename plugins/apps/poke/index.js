export const name = '戳一戳互动 (poke)'
export const version = '1.1.0'
export const description = '捕获戳一戳事件，当机器人被戳时触发 AI 大模型回复或趣味互动，忽略群友互戳'

const DEFAULT_RESPONSES = [
  '再戳，再戳就把你吃掉！( >﹏< )',
  '手戳麻了吗？哼！',
  '别戳啦，在忙呢！(・∀・)',
  '戳我有优惠券领吗？',
  '干嘛戳我呀？(·•᷄ࡤ•᷅)',
  '别戳了，再戳要报废了~',
  ' ( ▔___▔ ) 谁在戳我？',
  '要被你戳痛了啦！QAQ',
  '找本宝有什么事吗？',
  '戳戳戳，就知道戳！(o・ω・o)'
]

export default async function setup(ctx) {
  const logger = ctx.logger

  ctx.onPoke(async (event) => {
    const cfg = ctx.config || {}
    const adapter = ctx.getAdapter?.('onebot') || event.client
    const selfId = adapter?.getSelfId ? adapter.getSelfId() : globalThis.chaiteConfig?.onebot?.botUin

    const isSelfPoke =
      Boolean(event.isSelfPoke) ||
      (Boolean(selfId) && String(event.targetId) === String(selfId))

    // 别人互戳：直接忽略消费，避免无端发言
    if (!isSelfPoke) {
      return true
    }

    const userId = event.userId || event.operatorId
    logger.info(`收到来自用户 [${userId}] 的戳一戳`)

    // 反戳逻辑（如果开启）：尝试反戳回去
    if (cfg.pokeBack && event.groupId && event.callAction) {
      setTimeout(() => {
        event.callAction('group_poke', {
          group_id: Number(event.groupId),
          user_id: Number(userId),
        }).catch(() => {})
      }, 500)
    }

    // 模式判断：默认为 'ai'（智能大模型响应）
    const mode = cfg.mode || 'ai'
    if (mode === 'ai') {
      // 传递指定的预设 ID 给事件
      if (cfg.presetId) {
        event.presetId = cfg.presetId
      }
      // 返回 false，放行给 Chaite 主流水线由 AI 大模型响应（携带群聊流水、花名册与戳一戳环境说明）
      return false
    }

    // 固定词库模式
    let responses = DEFAULT_RESPONSES
    if (typeof cfg.responses === 'string' && cfg.responses.trim()) {
      responses = cfg.responses.split('\n').map((s) => s.trim()).filter(Boolean)
    } else if (Array.isArray(cfg.responses) && cfg.responses.length > 0) {
      responses = cfg.responses.filter(Boolean)
    }

    const replyText = responses[Math.floor(Math.random() * responses.length)]
    try {
      if (typeof event.reply === 'function') {
        await event.reply(replyText)
      }
    } catch (err) {
      logger.error('回复戳一戳消息失败:', err)
    }

    return true
  })
}
