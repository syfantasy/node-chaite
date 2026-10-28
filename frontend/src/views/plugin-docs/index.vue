<script lang="ts" setup>
import { NCard, NTag, NDivider, NCode, NSpace, NButton } from 'naive-ui'
import { useRouter } from 'vue-router'

const router = useRouter()

const sampleCodeSingle = `// @name 每日打卡插件
// @author YourName
// @description 单文件极简示例

export const name = '每日打卡'
export const version = '1.0.0'

export default function setup(ctx) {
  ctx.logger.info('每日打卡插件启动！')

  // 1. 注册指令：#打卡
  ctx.registerCommand('#打卡', async (e) => {
    const key = \`sign_\${e.userId}\`
    const lastSign = await ctx.storage.get(key)
    const today = new Date().toDateString()

    if (lastSign === today) {
      await e.reply('你今天已经打过卡啦，明天再来喵！')
      return true
    }

    await ctx.storage.set(key, today)
    const total = (await ctx.storage.get(\`total_\${e.userId}\`, 0)) + 1
    await ctx.storage.set(\`total_\${e.userId}\`, total)

    await e.reply(\`打卡成功！你已累计打卡 \${total} 天！\`)
    return true
  })

  // 2. 注册 AI 互动指令：#求签 [关键词]
  ctx.registerCommand('#求签', async (e) => {
    const topic = e.text.slice('#求签'.length).trim() || '今日运势'
    // 一句话调起大模型回答，完全无需关心底层 API 与 Key
    const answer = await e.queryAI(\`请为群友生成一段关于"\${topic}"的简短求签解签诗，语气神秘有趣，50字以内\`)
    await e.reply(answer)
    return true
  })
}
`

const sampleCodeDir = `// runner/plugins/my-pack/index.js
export const name = '高级扩展包'
export const version = '1.0.0'

export default function setup(ctx) {
  // 读取插件目录下的 config.json 静态配置
  const prefix = ctx.config?.prefix || '#总结'

  // 结合群聊上下文进行智能摘要
  ctx.registerCommand(prefix, async (e) => {
    if (!e.isGroup) {
      await e.reply('该指令仅支持群聊环境哦')
      return true
    }

    await e.reply('正在阅读刚才的群聊发言，请稍候...')
    // askWithContext 自动携带双水位线滑动窗口内的近期群聊记录
    const summary = await e.askWithContext('请用活泼风趣的语气简要总结群友刚才都在聊些什么，列出核心要点')
    await e.reply(summary)
    return true
  })
}
`

const sampleCodeTool = `// 注入给大模型的 Function Call 工具示例
export default function setup(ctx) {
  ctx.registerTool({
    name: 'get_server_time',
    description: '获取当前机器人服务器的精准系统时间',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  }, async (args) => {
    return {
      currentTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      timestamp: Date.now(),
    }
  })
}
`
</script>

<template>
  <div class="docs-container">
    <header class="docs-header">
      <div>
        <h1 class="docs-title">Chaite 插件开发指南</h1>
        <p class="docs-subtitle">
          面向下一代智能体生态：零门槛单文件脚本、统一事件驱动、直调大模型、轻量持久化与工具扩展。
        </p>
      </div>
      <NButton type="primary" secondary @click="router.push('/plugin-manager')">
        返回插件管理
      </NButton>
    </header>

    <div class="content-body">
      <!-- 1. 设计哲学 -->
      <section class="doc-card">
        <h2>1. 核心设计哲学</h2>
        <p>
          传统框架（如旧云崽）通常让插件直接耦合特定的协议底层（如 icqq 的 raw segment、CQ 码），导致更换协议端或跨平台时插件大面积失效。
        </p>
        <p>
          Chaite 彻底废弃了脆弱的旧触发器（Triggers），引入全新的统一事件抽象 <code>ChaiteEvent</code>。
          <strong>插件作者永远只需要面对一套规范的对象属性与操作方法</strong>，协议端负责映射与翻译，真正实现「一次编写，到处运行」。
        </p>
      </section>

      <!-- 2. 插件形式与文件结构 -->
      <section class="doc-card">
        <h2>2. 两种插件规格</h2>
        <div class="spec-grid">
          <div class="spec-item">
            <h3>单文件 JS 插件 (Single-File)</h3>
            <ul>
              <li>存放位置：<code>runner/plugins/xxx.js</code></li>
              <li>开箱即用，无需编译</li>
              <li>可在 Web 后台在线查看、修改源码并<strong>免重启实时热重载</strong></li>
              <li>适合轻量指令、小工具、群互动与游戏</li>
            </ul>
          </div>
          <div class="spec-item">
            <h3>工程目录包插件 (Directory Package)</h3>
            <ul>
              <li>存放位置：<code>runner/plugins/my-plugin/</code></li>
              <li>包含 <code>package.json</code>、入口文件 <code>index.js</code></li>
              <li>静态配置位于同级 <code>config.json</code>，配置随插件走，便携迁移</li>
              <li>适合复杂业务逻辑、多文件模块与多功能套件</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 3. 快速上手最小实例 -->
      <section class="doc-card">
        <h2>3. 最小可用实例（带 KV 存储与直调 AI）</h2>
        <p>单文件插件完整示例：创建 <code>runner/plugins/signin.js</code> 即可自动加载：</p>
        <div class="code-wrapper">
          <NCode :code="sampleCodeSingle" language="javascript" />
        </div>
      </section>

      <!-- 4. 统一事件对象 API -->
      <section class="doc-card">
        <h2>4. 统一事件对象 (ChaiteEvent) API 规范</h2>
        <table class="api-table">
          <thead>
            <tr>
              <th>属性 / 方法</th>
              <th>类型</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>e.userId</code></td>
              <td><code>string | number</code></td>
              <td>发送者的唯一用户标识（如 QQ 号）</td>
            </tr>
            <tr>
              <td><code>e.groupId</code></td>
              <td><code>number | null</code></td>
              <td>群聊 ID，若为私聊消息则为 <code>null</code></td>
            </tr>
            <tr>
              <td><code>e.isGroup / e.isPrivate</code></td>
              <td><code>boolean</code></td>
              <td>当前环境是否为群聊 / 私聊</td>
            </tr>
            <tr>
              <td><code>e.text</code></td>
              <td><code>string</code></td>
              <td>清洗后的纯文本消息（已去除 @ 和前缀）</td>
            </tr>
            <tr>
              <td><code>e.sender</code></td>
              <td><code>object</code></td>
              <td>发送者信息：<code>{ nickname, card, role, title, level }</code></td>
            </tr>
            <tr>
              <td><code>e.images</code></td>
              <td><code>ImageAttachment[]</code></td>
              <td>消息附带的图片数组 <code>[{ ref, url, mimeType }]</code></td>
            </tr>
            <tr>
              <td><code>await e.reply(content)</code></td>
              <td><code>Promise&lt;any&gt;</code></td>
              <td>回复消息，支持字符串或对象，底层自动适配</td>
            </tr>
            <tr>
              <td><code>await e.queryAI(prompt, [opt])</code></td>
              <td><code>Promise&lt;string&gt;</code></td>
              <td>直接调用当前系统的默认预设模型回答，零配置直通 AI</td>
            </tr>
            <tr>
              <td><code>await e.askWithContext(prompt, [opt])</code></td>
              <td><code>Promise&lt;string&gt;</code></td>
              <td><strong>自动绑定群聊滑动窗口历史</strong>，让模型基于近期群聊提炼作答</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 5. 结合上下文与群聊总结 -->
      <section class="doc-card">
        <h2>5. 进阶：群聊上下文分析插件</h2>
        <div class="code-wrapper">
          <NCode :code="sampleCodeDir" language="javascript" />
        </div>
      </section>

      <!-- 6. 存储机制 -->
      <section class="doc-card">
        <h2>6. 存储最佳实践</h2>
        <div class="storage-box">
          <p><strong>• 静态配置 (ctx.config)</strong>：</p>
          <p>随插件目录存放的 <code>config.json</code>，用于存放指令前缀、开关、API Key 等静态设置。插拔拷贝插件时配置直接随走，干净无残留。</p>
          <NDivider style="margin: 12px 0;" />
          <p><strong>• 动态业务持久化 (ctx.storage)</strong>：</p>
          <p>系统在 SQLite 中提供全隔离的 KV 接口，插件无需自己引数据库驱动即可随时存取数据：</p>
          <ul>
            <li><code>await ctx.storage.get(key, [defaultValue])</code>：获取键值（自动序列化 JSON）</li>
            <li><code>await ctx.storage.set(key, value)</code>：存储任意 JavaScript 对象或值</li>
            <li><code>await ctx.storage.delete(key)</code>：删除指定键</li>
            <li><code>await ctx.storage.list()</code>：列出该插件所有持久化数据</li>
          </ul>
        </div>
      </section>

      <!-- 7. 工具与定时任务扩展 -->
      <section class="doc-card">
        <h2>7. 工具扩展 (Function Calling) 与定时任务</h2>
        <p>插件可以随时向系统大模型暴露自定义工具（Function Tool）：</p>
        <div class="code-wrapper">
          <NCode :code="sampleCodeTool" language="javascript" />
        </div>
        <p style="margin-top: 14px;"><strong>定时调度：</strong></p>
        <p>通过 <code>ctx.cron('0 8 * * *', handler)</code> 注册定时任务，在插件禁用或热重载时系统会自动注销计时器，杜绝内存泄漏。</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.docs-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
.docs-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.docs-title {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 6px 0;
}
.docs-subtitle {
  font-size: 14px;
  color: var(--n-text-color-3, #777);
  margin: 0;
}
.content-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.doc-card {
  background: var(--n-color, #fff);
  border: 1px solid var(--n-border-color, #e4e7ed);
  border-radius: 12px;
  padding: 24px;
}
.doc-card h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 14px 0;
  color: var(--n-text-color-1, #222);
}
.doc-card p {
  font-size: 14px;
  line-height: 1.7;
  color: var(--n-text-color-2, #555);
  margin: 0 0 10px 0;
}
.spec-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 12px;
}
.spec-item {
  background: var(--n-action-color, #f9fafb);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--n-border-color, #eee);
}
.spec-item h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 10px 0;
}
.spec-item ul {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.8;
  color: var(--n-text-color-2, #666);
}
.code-wrapper {
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--n-border-color, #e0e0e0);
}
.api-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-top: 12px;
}
.api-table th, .api-table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--n-border-color, #eee);
}
.api-table th {
  background: var(--n-action-color, #f8f9fa);
  font-weight: 600;
}
.api-table code {
  background: rgba(120, 120, 120, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}
.storage-box {
  background: var(--n-action-color, #f9fafb);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--n-border-color, #eee);
}
.storage-box ul {
  margin: 6px 0 0 0;
  padding-left: 20px;
  font-size: 13px;
  line-height: 1.8;
}
@media (max-width: 768px) {
  .spec-grid { grid-template-columns: 1fr; }
}
</style>
