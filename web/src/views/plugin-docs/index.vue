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

const sampleCodeRef = `// 全系列媒体 Ref 提取与按需解析示例
import { mediaRefStore } from 'chaite' // 或直接读取 globalThis.mediaRefStore

export default function setup(ctx) {
  ctx.on('message', async (e) => {
    const raw = e.rawText || ''

    // 匹配消息中包含的任意多媒体 Ref
    // 格式覆盖：[视频:... ref:vid_xxx]、[文件:... ref:file_xxx]、[语音 ref:voice_xxx]、[聊天记录 ref:fwd_xxx]、[图片 ref:img_xxx]
    const refMatch = raw.match(/\\[(?:视频|文件|语音|聊天记录|图片)[^\\]]*ref:([a-z0-9_]+)\\]/)
    if (!refMatch) return

    const ref = refMatch[1]
    const item = mediaRefStore.get(ref)
    if (!item) return

    switch (item.type) {
      case 'file': {
        // 自动解析群文件/私聊文件的下载直链或本地缓存
        const resolved = await mediaRefStore.resolveMedia(ref, globalThis.onebotClient)
        if (resolved?.url) {
          await e.reply(\`已捕获文件: \${item.name} (\${item.fileSize ? Math.round(item.fileSize / 1024) + 'KB' : '未知大小'})\\n直链解析成功！\`)
        }
        break
      }
      case 'video': {
        const resolved = await mediaRefStore.resolveMedia(ref, globalThis.onebotClient)
        console.log(\`收到视频: \${item.name}，格式: \${item.ext}，直链: \${resolved?.url || '本地缓存'}\`)
        break
      }
      case 'voice': {
        console.log(\`收到语音: 时长 \${item.duration || 0} 秒，资源定位: \${item.file || item.url}\`)
        break
      }
      case 'forward': {
        console.log(\`收到聊天记录: \${item.summary}，前置预览条数: \${item.previewMessages?.length || 0}\`)
        break
      }
      case 'image': {
        const img = await mediaRefStore.resolveImage(ref, globalThis.onebotClient)
        console.log(\`图片 MIME: \${img?.mimeType}，Base64 字符数: \${img?.base64?.length || 0}\`)
        break
      }
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
        <h2>2. 插件文件结构规范</h2>
        <div class="spec-grid">
          <div class="spec-item">
            <h3>单文件 / 脚本插件 (Single-File)</h3>
            <ul>
              <li>存放目录：<code>plugins/scripts/&lt;plugin-id&gt;/index.js</code>（支持直接丢 <code>plugins/scripts/&lt;name&gt;.js</code> 自动归档）</li>
              <li>开箱即用，无需复杂构建</li>
              <li>可在 Web 控制台在线查看、修改源码并<strong>免重启实时重载</strong></li>
              <li>适合轻量指令、小工具、群互动与娱乐功能</li>
            </ul>
          </div>
          <div class="spec-item">
            <h3>工程目录包插件 (Directory Package)</h3>
            <ul>
              <li>存放目录：<code>plugins/apps/&lt;plugin-id&gt;/</code></li>
              <li>包含 <code>package.json</code> 与入口文件（<code>index.js</code>）</li>
              <li>专属静态配置保存在同级 <code>config.json</code>，拷贝即迁移</li>
              <li>适合复杂业务逻辑、多模块拆分或引入第三方 npm 依赖的完整套件</li>
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

      <!-- 6. 多媒体与资源引用体系 (Ref Specification) -->
      <section class="doc-card">
        <h2>6. 多媒体与资源引用体系 (Media Ref Specification)</h2>
        <p>
          在聊天流中，图片、视频、语音、文档与合并转发消息体积大且格式各异。Chaite 统一采用 <strong>Ref 引用模式</strong> 进行轻量化占位抽象，避免上下文和网关 Payload 爆破，同时允许插件和大模型按需延迟解析。
        </p>

        <table class="api-table" style="margin-top: 12px;">
          <thead>
            <tr>
              <th>媒体类别</th>
              <th>文本占位符格式</th>
              <th>Ref 前缀</th>
              <th>核心元数据与能力说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>图片 (Image)</strong></td>
              <td><code>[图片 ref:img_xxxx]</code></td>
              <td><code>img_</code></td>
              <td>包含图片直链/本地文件、Base64 缓存与 MIME。具备双水位线防爆与 GIF 三级动态压缩。支持 <code>mediaRefStore.resolveImage(ref)</code>。</td>
            </tr>
            <tr>
              <td><strong>聊天记录 (Forward)</strong></td>
              <td><code>[聊天记录:共N条记录 摘要:... ref:fwd_xxxx]</code></td>
              <td><code>fwd_</code></td>
              <td>包含合并转发 ID (<code>forwardId</code>) 与前 10 条图文消息摘要预览 (<code>previewMessages</code>)，大模型无需读取庞大原始 JSON 即可理解上下文对话脉络。</td>
            </tr>
            <tr>
              <td><strong>视频 (Video)</strong></td>
              <td><code>[视频:xxx.mp4 ref:vid_xxxx]</code></td>
              <td><code>vid_</code></td>
              <td>包含视频名称、后缀 (<code>ext</code>)、字节大小 (<code>fileSize</code>)。支持 <code>mediaRefStore.resolveMedia(ref)</code> 异步解析临时下载直链与本地缓存。</td>
            </tr>
            <tr>
              <td><strong>语音 (Voice)</strong></td>
              <td><code>[语音 (5秒) ref:voice_xxxx]</code></td>
              <td><code>voice_</code></td>
              <td>包含语音精确时长 (<code>duration</code>) 及 Silk/Amr 资源路径，插件可结合外部语音识别服务进行 STT 文本转录。</td>
            </tr>
            <tr>
              <td><strong>文件 (File)</strong></td>
              <td><code>[文件:文档.pdf (3.5MB) ref:file_xxxx]</code></td>
              <td><code>file_</code></td>
              <td>包含文件名、大小与群文件 ID (<code>fileId</code>)。支持 <code>mediaRefStore.resolveMedia(ref)</code> 自动获取群文件直链下载地址。</td>
            </tr>
          </tbody>
        </table>

        <div class="code-wrapper" style="margin-top: 16px;">
          <NCode :code="sampleCodeRef" language="javascript" />
        </div>
      </section>

      <!-- 7. 存储机制 -->
      <section class="doc-card">
        <h2>7. 存储最佳实践</h2>
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

      <!-- 8. 工具与定时任务扩展 -->
      <section class="doc-card">
        <h2>8. 工具扩展 (Function Calling) 与定时任务</h2>
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
