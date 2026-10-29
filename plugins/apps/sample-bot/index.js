export default function setup(ctx) {
  const getCfg = () => ctx.config || {}
  const cmd = getCfg().prefix || '#打招呼'

  ctx.logger.info(`问候插件已初始化，当前监听指令: ${cmd}`)

  ctx.registerCommand(cmd, async (e) => {
    const cfg = getCfg()
    const text = cfg.greetingText || '你好！我是通过目录工程级插件回复你的哦~'

    // 支持结构化参数 at: true，也可以传纯字符串 (带 [CQ:at,qq=...] 均会自动解析为原生 Segment)
    await e.reply({
      text,
      at: cfg.enableAt,
    })
    return true
  })
}
