import{d as i,k as c,o as n,c as l,a as t,e as o,w as v,g as a,u as d,B as g,Z as b,W as p,j as u}from"./index-CGMrCcJI.js";import{C as r}from"./Code-9YWhTYyC.js";const m={class:"docs-container"},x={class:"docs-header"},f={class:"content-body"},y={class:"doc-card"},h={class:"code-wrapper"},w={class:"doc-card"},_={class:"code-wrapper"},C={class:"doc-card"},S={class:"code-wrapper",style:{"margin-top":"16px"}},I={class:"doc-card"},k={class:"storage-box"},$={class:"doc-card"},j={class:"code-wrapper"},M=`// @name 每日打卡插件
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
`,R=`// runner/plugins/my-pack/index.js
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
`,T=`// 注入给大模型的 Function Call 工具示例
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
`,A=`// 全系列媒体 Ref 提取与按需解析示例
import { mediaRefStore } from 'chaite' // 或直接读取 globalThis.mediaRefStore

export default function setup(ctx) {
  ctx.on('message', async (e) => {
    const raw = e.rawText || ''

    // 匹配消息中包含的任意多媒体 Ref
    // 格式覆盖：[视频:... ref:vid_xxx]、[文件:... ref:file_xxx]、[语音 ref:voice_xxx]、[聊天记录 ref:fwd_xxx]、[图片 ref:img_xxx]
    const refMatch = raw.match(/\\[(?:视频|文件|语音|聊天记录|图片)[^\\]]*ref:[a-z0-9_]+)\\]/
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
`,D=i({__name:"index",setup(B){const s=c();return(N,e)=>(n(),l("div",m,[t("header",x,[e[2]||(e[2]=t("div",null,[t("h1",{class:"docs-title"},"Chaite 插件开发指南"),t("p",{class:"docs-subtitle"}," 面向下一代智能体生态：零门槛单文件脚本、统一事件驱动、直调大模型、轻量持久化与工具扩展。 ")],-1)),o(d(g),{type:"primary",secondary:"",onClick:e[0]||(e[0]=P=>d(s).push("/plugin-manager"))},{default:v(()=>[...e[1]||(e[1]=[a(" 返回插件管理 ",-1)])]),_:1})]),t("div",f,[e[15]||(e[15]=b('<section class="doc-card" data-v-50e503bb><h2 data-v-50e503bb>1. 核心设计哲学</h2><p data-v-50e503bb> 传统框架（如旧云崽）通常让插件直接耦合特定的协议底层（如 icqq 的 raw segment、CQ 码），导致更换协议端或跨平台时插件大面积失效。 </p><p data-v-50e503bb> Chaite 彻底废弃了脆弱的旧触发器（Triggers），引入全新的统一事件抽象 <code data-v-50e503bb>ChaiteEvent</code>。 <strong data-v-50e503bb>插件作者永远只需要面对一套规范的对象属性与操作方法</strong>，协议端负责映射与翻译，真正实现「一次编写，到处运行」。 </p></section><section class="doc-card" data-v-50e503bb><h2 data-v-50e503bb>2. 插件文件结构规范</h2><div class="spec-grid" data-v-50e503bb><div class="spec-item" data-v-50e503bb><h3 data-v-50e503bb>单文件 / 脚本插件 (Single-File)</h3><ul data-v-50e503bb><li data-v-50e503bb>存放目录：<code data-v-50e503bb>plugins/scripts/&lt;plugin-id&gt;/index.js</code>（支持直接丢 <code data-v-50e503bb>plugins/scripts/&lt;name&gt;.js</code> 自动归档）</li><li data-v-50e503bb>开箱即用，无需复杂构建</li><li data-v-50e503bb>可在 Web 控制台在线查看、修改源码并<strong data-v-50e503bb>免重启实时重载</strong></li><li data-v-50e503bb>适合轻量指令、小工具、群互动与娱乐功能</li></ul></div><div class="spec-item" data-v-50e503bb><h3 data-v-50e503bb>工程目录包插件 (Directory Package)</h3><ul data-v-50e503bb><li data-v-50e503bb>存放目录：<code data-v-50e503bb>plugins/apps/&lt;plugin-id&gt;/</code></li><li data-v-50e503bb>包含 <code data-v-50e503bb>package.json</code> 与入口文件（<code data-v-50e503bb>index.js</code>）</li><li data-v-50e503bb>专属静态配置保存在同级 <code data-v-50e503bb>config.json</code>，拷贝即迁移</li><li data-v-50e503bb>适合复杂业务逻辑、多模块拆分或引入第三方 npm 依赖的完整套件</li></ul></div></div></section>',2)),t("section",y,[e[3]||(e[3]=t("h2",null,"3. 最小可用实例（带 KV 存储与直调 AI）",-1)),e[4]||(e[4]=t("p",null,[a("单文件插件完整示例：创建 "),t("code",null,"runner/plugins/signin.js"),a(" 即可自动加载：")],-1)),t("div",h,[o(d(r),{code:M,language:"javascript"})])]),e[16]||(e[16]=b('<section class="doc-card" data-v-50e503bb><h2 data-v-50e503bb>4. 统一事件对象 (ChaiteEvent) API 规范</h2><table class="api-table" data-v-50e503bb><thead data-v-50e503bb><tr data-v-50e503bb><th data-v-50e503bb>属性 / 方法</th><th data-v-50e503bb>类型</th><th data-v-50e503bb>说明</th></tr></thead><tbody data-v-50e503bb><tr data-v-50e503bb><td data-v-50e503bb><code data-v-50e503bb>e.userId</code></td><td data-v-50e503bb><code data-v-50e503bb>string | number</code></td><td data-v-50e503bb>发送者的唯一用户标识（如 QQ 号）</td></tr><tr data-v-50e503bb><td data-v-50e503bb><code data-v-50e503bb>e.groupId</code></td><td data-v-50e503bb><code data-v-50e503bb>number | null</code></td><td data-v-50e503bb>群聊 ID，若为私聊消息则为 <code data-v-50e503bb>null</code></td></tr><tr data-v-50e503bb><td data-v-50e503bb><code data-v-50e503bb>e.isGroup / e.isPrivate</code></td><td data-v-50e503bb><code data-v-50e503bb>boolean</code></td><td data-v-50e503bb>当前环境是否为群聊 / 私聊</td></tr><tr data-v-50e503bb><td data-v-50e503bb><code data-v-50e503bb>e.text</code></td><td data-v-50e503bb><code data-v-50e503bb>string</code></td><td data-v-50e503bb>清洗后的纯文本消息（已去除 @ 和前缀）</td></tr><tr data-v-50e503bb><td data-v-50e503bb><code data-v-50e503bb>e.sender</code></td><td data-v-50e503bb><code data-v-50e503bb>object</code></td><td data-v-50e503bb>发送者信息：<code data-v-50e503bb>{ nickname, card, role, title, level }</code></td></tr><tr data-v-50e503bb><td data-v-50e503bb><code data-v-50e503bb>e.images</code></td><td data-v-50e503bb><code data-v-50e503bb>ImageAttachment[]</code></td><td data-v-50e503bb>消息附带的图片数组 <code data-v-50e503bb>[{ ref, url, mimeType }]</code></td></tr><tr data-v-50e503bb><td data-v-50e503bb><code data-v-50e503bb>await e.reply(content)</code></td><td data-v-50e503bb><code data-v-50e503bb>Promise&lt;any&gt;</code></td><td data-v-50e503bb>回复消息，支持字符串或对象，底层自动适配</td></tr><tr data-v-50e503bb><td data-v-50e503bb><code data-v-50e503bb>await e.queryAI(prompt, [opt])</code></td><td data-v-50e503bb><code data-v-50e503bb>Promise&lt;string&gt;</code></td><td data-v-50e503bb>直接调用当前系统的默认预设模型回答，零配置直通 AI</td></tr><tr data-v-50e503bb><td data-v-50e503bb><code data-v-50e503bb>await e.askWithContext(prompt, [opt])</code></td><td data-v-50e503bb><code data-v-50e503bb>Promise&lt;string&gt;</code></td><td data-v-50e503bb><strong data-v-50e503bb>自动绑定群聊滑动窗口历史</strong>，让模型基于近期群聊提炼作答</td></tr></tbody></table></section>',1)),t("section",w,[e[5]||(e[5]=t("h2",null,"5. 进阶：群聊上下文分析插件",-1)),t("div",_,[o(d(r),{code:R,language:"javascript"})])]),t("section",C,[e[6]||(e[6]=b('<h2 data-v-50e503bb>6. 多媒体与资源引用体系 (Media Ref Specification)</h2><p data-v-50e503bb> 在聊天流中，图片、视频、语音、文档与合并转发消息体积大且格式各异。Chaite 统一采用 <strong data-v-50e503bb>Ref 引用模式</strong> 进行轻量化占位抽象，避免上下文和网关 Payload 爆破，同时允许插件和大模型按需延迟解析。 </p><table class="api-table" style="margin-top:12px;" data-v-50e503bb><thead data-v-50e503bb><tr data-v-50e503bb><th data-v-50e503bb>媒体类别</th><th data-v-50e503bb>文本占位符格式</th><th data-v-50e503bb>Ref 前缀</th><th data-v-50e503bb>核心元数据与能力说明</th></tr></thead><tbody data-v-50e503bb><tr data-v-50e503bb><td data-v-50e503bb><strong data-v-50e503bb>图片 (Image)</strong></td><td data-v-50e503bb><code data-v-50e503bb>[图片 ref:img_xxxx]</code></td><td data-v-50e503bb><code data-v-50e503bb>img_</code></td><td data-v-50e503bb>包含图片直链/本地文件、Base64 缓存与 MIME。具备双水位线防爆与 GIF 三级动态压缩。支持 <code data-v-50e503bb>mediaRefStore.resolveImage(ref)</code>。</td></tr><tr data-v-50e503bb><td data-v-50e503bb><strong data-v-50e503bb>聊天记录 (Forward)</strong></td><td data-v-50e503bb><code data-v-50e503bb>[聊天记录:共N条记录 摘要:... ref:fwd_xxxx]</code></td><td data-v-50e503bb><code data-v-50e503bb>fwd_</code></td><td data-v-50e503bb>包含合并转发 ID (<code data-v-50e503bb>forwardId</code>) 与前 10 条图文消息摘要预览 (<code data-v-50e503bb>previewMessages</code>)，大模型无需读取庞大原始 JSON 即可理解上下文对话脉络。</td></tr><tr data-v-50e503bb><td data-v-50e503bb><strong data-v-50e503bb>视频 (Video)</strong></td><td data-v-50e503bb><code data-v-50e503bb>[视频:xxx.mp4 ref:vid_xxxx]</code></td><td data-v-50e503bb><code data-v-50e503bb>vid_</code></td><td data-v-50e503bb>包含视频名称、后缀 (<code data-v-50e503bb>ext</code>)、字节大小 (<code data-v-50e503bb>fileSize</code>)。支持 <code data-v-50e503bb>mediaRefStore.resolveMedia(ref)</code> 异步解析临时下载直链与本地缓存。</td></tr><tr data-v-50e503bb><td data-v-50e503bb><strong data-v-50e503bb>语音 (Voice)</strong></td><td data-v-50e503bb><code data-v-50e503bb>[语音 (5秒) ref:voice_xxxx]</code></td><td data-v-50e503bb><code data-v-50e503bb>voice_</code></td><td data-v-50e503bb>包含语音精确时长 (<code data-v-50e503bb>duration</code>) 及 Silk/Amr 资源路径，插件可结合外部语音识别服务进行 STT 文本转录。</td></tr><tr data-v-50e503bb><td data-v-50e503bb><strong data-v-50e503bb>文件 (File)</strong></td><td data-v-50e503bb><code data-v-50e503bb>[文件:文档.pdf (3.5MB) ref:file_xxxx]</code></td><td data-v-50e503bb><code data-v-50e503bb>file_</code></td><td data-v-50e503bb>包含文件名、大小与群文件 ID (<code data-v-50e503bb>fileId</code>)。支持 <code data-v-50e503bb>mediaRefStore.resolveMedia(ref)</code> 自动获取群文件直链下载地址。</td></tr></tbody></table>',3)),t("div",S,[o(d(r),{code:A,language:"javascript"})])]),t("section",I,[e[10]||(e[10]=t("h2",null,"7. 存储最佳实践",-1)),t("div",k,[e[7]||(e[7]=t("p",null,[t("strong",null,"• 静态配置 (ctx.config)"),a("：")],-1)),e[8]||(e[8]=t("p",null,[a("随插件目录存放的 "),t("code",null,"config.json"),a("，用于存放指令前缀、开关、API Key 等静态设置。插拔拷贝插件时配置直接随走，干净无残留。")],-1)),o(d(p),{style:{margin:"12px 0"}}),e[9]||(e[9]=b("<p data-v-50e503bb><strong data-v-50e503bb>• 动态业务持久化 (ctx.storage)</strong>：</p><p data-v-50e503bb>系统在 SQLite 中提供全隔离的 KV 接口，插件无需自己引数据库驱动即可随时存取数据：</p><ul data-v-50e503bb><li data-v-50e503bb><code data-v-50e503bb>await ctx.storage.get(key, [defaultValue])</code>：获取键值（自动序列化 JSON）</li><li data-v-50e503bb><code data-v-50e503bb>await ctx.storage.set(key, value)</code>：存储任意 JavaScript 对象或值</li><li data-v-50e503bb><code data-v-50e503bb>await ctx.storage.delete(key)</code>：删除指定键</li><li data-v-50e503bb><code data-v-50e503bb>await ctx.storage.list()</code>：列出该插件所有持久化数据</li></ul>",3))])]),t("section",$,[e[11]||(e[11]=t("h2",null,"8. 工具扩展 (Function Calling) 与定时任务",-1)),e[12]||(e[12]=t("p",null,"插件可以随时向系统大模型暴露自定义工具（Function Tool）：",-1)),t("div",j,[o(d(r),{code:T,language:"javascript"})]),e[13]||(e[13]=t("p",{style:{"margin-top":"14px"}},[t("strong",null,"定时调度：")],-1)),e[14]||(e[14]=t("p",null,[a("通过 "),t("code",null,"ctx.cron('0 8 * * *', handler)"),a(" 注册定时任务，在插件禁用或热重载时系统会自动注销计时器，杜绝内存泄漏。")],-1))])])]))}}),q=u(D,[["__scopeId","data-v-50e503bb"]]);export{q as default};
