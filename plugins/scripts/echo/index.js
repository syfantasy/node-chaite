// @name 复读机示例插件
// @author Chaite
// @description 演示单文件插件的统一事件对象 (ChaiteEvent) 与轻量 KV 存储

export const name = '复读机示例'
export const version = '1.1.0'
export const description = '演示单文件插件的指令注册、ChaiteEvent 与内置 SQLite KV 存储'

export default function setup(ctx) {
  ctx.logger.info('复读机插件已成功加载！')

  // 注册指令：#复读 [内容]
  ctx.registerCommand('#复读', async (e) => {
    // 获取去掉指令后的纯文本
    const content = e.text.slice('#复读'.length).trim()
    if (!content) {
      await e.reply('请在 #复读 后面加上要复读的内容喵！')
      return true
    }

    // 演示轻量 KV 存储：累加复读次数
    const count = (await ctx.storage.get('repeat_count', 0)) + 1
    await ctx.storage.set('repeat_count', count)

    await e.reply(`[复读机第 ${count} 次] ${content}`)
    return true
  })
}
