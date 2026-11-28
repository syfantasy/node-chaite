import{d as i,k as n,o as c,c as f,a as d,e as b,w as l,g as e,u as a,B as v,Z as r,W as p,j as g}from"./index-B4xx0ADb.js";import{C as o}from"./Code-BGbAgqby.js";const u={class:"docs-container"},m={class:"docs-header"},x={class:"content-body"},h={class:"doc-card"},y={class:"code-wrapper"},w={class:"doc-card"},k={class:"code-wrapper"},S={class:"doc-card"},_={class:"code-wrapper",style:{"margin-top":"12px"}},I={class:"doc-card"},C={class:"code-wrapper",style:{"margin-top":"16px"}},$={class:"doc-card"},R={class:"storage-box"},j={class:"doc-card"},M={class:"code-wrapper"},T=`// @name 每日打卡插件
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
`,A=`// runner/plugins/my-pack/index.js
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
`,P=`// 核心对话管线主动调度与上下文拦截 Hooks
export default function setup(ctx) {
  // 1. 扩展花名册条目：在成员后追加年龄、性别与自定义属性
  ctx.hooks.onBuildRosterItem((member, defaultStr) => {
    const extra = []
    if (member.sex) extra.push(\`性别:\${member.sex}\`)
    if (member.age) extra.push(\`年龄:\${member.age}岁\`)
    return extra.length > 0 ? \`\${defaultStr} [\${extra.join(', ')}]\` : defaultStr
  })

  // 2. 流水安全过滤：动态阻断违规发言进入模型上下文
  ctx.hooks.onFilterFlow((msg) => {
    return msg.userId !== '12345678'
  })

  // 3. 主动调度核心对话管线：定制预设、提示词、工具与环境
  ctx.onPoke(async (e) => {
    if (!e.isSelfPoke) return true

    const response = await ctx.chat(e, {
      input: '[戳了你一下]',
      presetId: 'tsundere_bot',
      triggerReason: 'poke_bot',
      tools: ['web_fetch', 'GetQQAvatar'],
      autoReply: false, // 禁用默认回复，由插件自行处理
    })

    const text = response?.contents?.find(c => c.type === 'text')?.text
    if (text) {
      await e.reply(\`[专属回应] \${text}\`)
    }
    return true
  })
}
`,B=`// 注入给大模型的 Function Call 工具示例
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
`,D=`// 全系列媒体 Ref 提取与按需解析示例
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
`,F=i({__name:"index",setup(N){const s=n();return(V,t)=>(c(),f("div",u,[d("header",m,[t[2]||(t[2]=d("div",null,[d("h1",{class:"docs-title"},"Chaite 插件开发指南"),d("p",{class:"docs-subtitle"}," 面向下一代智能体生态：零门槛单文件脚本、统一事件驱动、直调大模型、轻量持久化与工具扩展。 ")],-1)),b(a(v),{type:"primary",secondary:"",onClick:t[0]||(t[0]=Q=>a(s).push("/plugin-manager"))},{default:l(()=>[...t[1]||(t[1]=[e(" 返回插件管理 ",-1)])]),_:1})]),d("div",x,[t[17]||(t[17]=r('<section class="doc-card" data-v-b72fdb0b><h2 data-v-b72fdb0b>1. 核心设计哲学</h2><p data-v-b72fdb0b> 传统框架（如旧云崽）通常让插件直接耦合特定的协议底层（如 icqq 的 raw segment、CQ 码），导致更换协议端或跨平台时插件大面积失效。 </p><p data-v-b72fdb0b> Chaite 彻底废弃了脆弱的旧触发器（Triggers），引入全新的统一事件抽象 <code data-v-b72fdb0b>ChaiteEvent</code>。 <strong data-v-b72fdb0b>插件作者永远只需要面对一套规范的对象属性与操作方法</strong>，协议端负责映射与翻译，真正实现「一次编写，到处运行」。 </p></section><section class="doc-card" data-v-b72fdb0b><h2 data-v-b72fdb0b>2. 插件文件结构规范</h2><div class="spec-grid" data-v-b72fdb0b><div class="spec-item" data-v-b72fdb0b><h3 data-v-b72fdb0b>单文件 / 脚本插件 (Single-File)</h3><ul data-v-b72fdb0b><li data-v-b72fdb0b>存放目录：<code data-v-b72fdb0b>plugins/scripts/&lt;plugin-id&gt;/index.js</code>（支持直接丢 <code data-v-b72fdb0b>plugins/scripts/&lt;name&gt;.js</code> 自动归档）</li><li data-v-b72fdb0b>开箱即用，无需复杂构建</li><li data-v-b72fdb0b>可在 Web 控制台在线查看、修改源码并<strong data-v-b72fdb0b>免重启实时重载</strong></li><li data-v-b72fdb0b>适合轻量指令、小工具、群互动与娱乐功能</li></ul></div><div class="spec-item" data-v-b72fdb0b><h3 data-v-b72fdb0b>工程目录包插件 (Directory Package)</h3><ul data-v-b72fdb0b><li data-v-b72fdb0b>存放目录：<code data-v-b72fdb0b>plugins/apps/&lt;plugin-id&gt;/</code></li><li data-v-b72fdb0b>包含 <code data-v-b72fdb0b>package.json</code> 与入口文件（<code data-v-b72fdb0b>index.js</code>）</li><li data-v-b72fdb0b>专属静态配置保存在同级 <code data-v-b72fdb0b>config.json</code>，拷贝即迁移</li><li data-v-b72fdb0b>适合复杂业务逻辑、多模块拆分或引入第三方 npm 依赖的完整套件</li></ul></div></div></section>',2)),d("section",h,[t[3]||(t[3]=d("h2",null,"3. 最小可用实例（带 KV 存储与直调 AI）",-1)),t[4]||(t[4]=d("p",null,[e("单文件插件完整示例：创建 "),d("code",null,"runner/plugins/signin.js"),e(" 即可自动加载：")],-1)),d("div",y,[b(a(o),{code:T,language:"javascript"})])]),t[18]||(t[18]=r('<section class="doc-card" data-v-b72fdb0b><h2 data-v-b72fdb0b>4. 统一事件对象 (ChaiteEvent) API 规范</h2><table class="api-table" data-v-b72fdb0b><thead data-v-b72fdb0b><tr data-v-b72fdb0b><th data-v-b72fdb0b>属性 / 方法</th><th data-v-b72fdb0b>类型</th><th data-v-b72fdb0b>说明</th></tr></thead><tbody data-v-b72fdb0b><tr data-v-b72fdb0b><td data-v-b72fdb0b><code data-v-b72fdb0b>e.userId</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>string | number</code></td><td data-v-b72fdb0b>发送者的唯一用户标识（如 QQ 号）</td></tr><tr data-v-b72fdb0b><td data-v-b72fdb0b><code data-v-b72fdb0b>e.groupId</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>number | null</code></td><td data-v-b72fdb0b>群聊 ID，若为私聊消息则为 <code data-v-b72fdb0b>null</code></td></tr><tr data-v-b72fdb0b><td data-v-b72fdb0b><code data-v-b72fdb0b>e.isGroup / e.isPrivate</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>boolean</code></td><td data-v-b72fdb0b>当前环境是否为群聊 / 私聊</td></tr><tr data-v-b72fdb0b><td data-v-b72fdb0b><code data-v-b72fdb0b>e.text</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>string</code></td><td data-v-b72fdb0b>清洗后的纯文本消息（已去除 @ 和前缀）</td></tr><tr data-v-b72fdb0b><td data-v-b72fdb0b><code data-v-b72fdb0b>e.sender</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>object</code></td><td data-v-b72fdb0b>发送者信息：<code data-v-b72fdb0b>{ nickname, card, role, title, level }</code></td></tr><tr data-v-b72fdb0b><td data-v-b72fdb0b><code data-v-b72fdb0b>e.images</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>ImageAttachment[]</code></td><td data-v-b72fdb0b>消息附带的图片数组 <code data-v-b72fdb0b>[{ ref, url, mimeType }]</code></td></tr><tr data-v-b72fdb0b><td data-v-b72fdb0b><code data-v-b72fdb0b>await e.reply(content)</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>Promise&lt;any&gt;</code></td><td data-v-b72fdb0b>回复消息，支持字符串或对象，底层自动适配</td></tr><tr data-v-b72fdb0b><td data-v-b72fdb0b><code data-v-b72fdb0b>await e.queryAI(prompt, [opt])</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>Promise&lt;string&gt;</code></td><td data-v-b72fdb0b>直接调用当前系统的默认预设模型回答，零配置直通 AI</td></tr><tr data-v-b72fdb0b><td data-v-b72fdb0b><code data-v-b72fdb0b>await e.askWithContext(prompt, [opt])</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>Promise&lt;string&gt;</code></td><td data-v-b72fdb0b><strong data-v-b72fdb0b>自动绑定群聊滑动窗口历史</strong>，让模型基于近期群聊提炼作答</td></tr></tbody></table></section>',1)),d("section",w,[t[5]||(t[5]=d("h2",null,"5. 进阶：群聊上下文分析插件",-1)),d("div",k,[b(a(o),{code:A,language:"javascript"})])]),d("section",S,[t[6]||(t[6]=d("h2",null,"5.1 高级：核心对话调度管线 (ctx.chat) 与上下文 Hook 拦截",-1)),t[7]||(t[7]=d("p",null,[e(" 通过 "),d("code",null,"ctx.chat(event, options)"),e("，插件可在特定业务场景（戳一戳、小游戏裁判、主动唤醒）下按需编排大模型对话，支持覆盖 prompt、指定预设、限定工具白名单或关闭自动回复。同时可通过 "),d("code",null,"ctx.hooks"),e(" 对花名册、群流水和场景协议进行全局动态修饰。 ")],-1)),d("div",_,[b(a(o),{code:P,language:"javascript"})])]),d("section",I,[t[8]||(t[8]=r('<h2 data-v-b72fdb0b>6. 多媒体与资源引用体系 (Media Ref Specification)</h2><p data-v-b72fdb0b> 在聊天流中，图片、视频、语音、文档与合并转发消息体积大且格式各异。Chaite 统一采用 <strong data-v-b72fdb0b>Ref 引用模式</strong> 进行轻量化占位抽象，避免上下文和网关 Payload 爆破，同时允许插件和大模型按需延迟解析。 </p><table class="api-table" style="margin-top:12px;" data-v-b72fdb0b><thead data-v-b72fdb0b><tr data-v-b72fdb0b><th data-v-b72fdb0b>媒体类别</th><th data-v-b72fdb0b>文本占位符格式</th><th data-v-b72fdb0b>Ref 前缀</th><th data-v-b72fdb0b>核心元数据与能力说明</th></tr></thead><tbody data-v-b72fdb0b><tr data-v-b72fdb0b><td data-v-b72fdb0b><strong data-v-b72fdb0b>图片 (Image)</strong></td><td data-v-b72fdb0b><code data-v-b72fdb0b>[图片 ref:img_xxxx]</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>img_</code></td><td data-v-b72fdb0b>包含图片直链/本地文件、Base64 缓存与 MIME。具备双水位线防爆与 GIF 三级动态压缩。支持 <code data-v-b72fdb0b>mediaRefStore.resolveImage(ref)</code>。</td></tr><tr data-v-b72fdb0b><td data-v-b72fdb0b><strong data-v-b72fdb0b>聊天记录 (Forward)</strong></td><td data-v-b72fdb0b><code data-v-b72fdb0b>[聊天记录:共N条记录 摘要:... ref:fwd_xxxx]</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>fwd_</code></td><td data-v-b72fdb0b>包含合并转发 ID (<code data-v-b72fdb0b>forwardId</code>) 与前 10 条图文消息摘要预览 (<code data-v-b72fdb0b>previewMessages</code>)，大模型无需读取庞大原始 JSON 即可理解上下文对话脉络。</td></tr><tr data-v-b72fdb0b><td data-v-b72fdb0b><strong data-v-b72fdb0b>视频 (Video)</strong></td><td data-v-b72fdb0b><code data-v-b72fdb0b>[视频:xxx.mp4 ref:vid_xxxx]</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>vid_</code></td><td data-v-b72fdb0b>包含视频名称、后缀 (<code data-v-b72fdb0b>ext</code>)、字节大小 (<code data-v-b72fdb0b>fileSize</code>)。支持 <code data-v-b72fdb0b>mediaRefStore.resolveMedia(ref)</code> 异步解析临时下载直链与本地缓存。</td></tr><tr data-v-b72fdb0b><td data-v-b72fdb0b><strong data-v-b72fdb0b>语音 (Voice)</strong></td><td data-v-b72fdb0b><code data-v-b72fdb0b>[语音 (5秒) ref:voice_xxxx]</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>voice_</code></td><td data-v-b72fdb0b>包含语音精确时长 (<code data-v-b72fdb0b>duration</code>) 及 Silk/Amr 资源路径，插件可结合外部语音识别服务进行 STT 文本转录。</td></tr><tr data-v-b72fdb0b><td data-v-b72fdb0b><strong data-v-b72fdb0b>文件 (File)</strong></td><td data-v-b72fdb0b><code data-v-b72fdb0b>[文件:文档.pdf (3.5MB) ref:file_xxxx]</code></td><td data-v-b72fdb0b><code data-v-b72fdb0b>file_</code></td><td data-v-b72fdb0b>包含文件名、大小与群文件 ID (<code data-v-b72fdb0b>fileId</code>)。支持 <code data-v-b72fdb0b>mediaRefStore.resolveMedia(ref)</code> 自动获取群文件直链下载地址。</td></tr></tbody></table>',3)),d("div",C,[b(a(o),{code:D,language:"javascript"})])]),d("section",$,[t[12]||(t[12]=d("h2",null,"7. 存储最佳实践",-1)),d("div",R,[t[9]||(t[9]=d("p",null,[d("strong",null,"• 静态配置 (ctx.config)"),e("：")],-1)),t[10]||(t[10]=d("p",null,[e("随插件目录存放的 "),d("code",null,"config.json"),e("，用于存放指令前缀、开关、API Key 等静态设置。插拔拷贝插件时配置直接随走，干净无残留。")],-1)),b(a(p),{style:{margin:"12px 0"}}),t[11]||(t[11]=r("<p data-v-b72fdb0b><strong data-v-b72fdb0b>• 动态业务持久化 (ctx.storage)</strong>：</p><p data-v-b72fdb0b>系统在 SQLite 中提供全隔离的 KV 接口，插件无需自己引数据库驱动即可随时存取数据：</p><ul data-v-b72fdb0b><li data-v-b72fdb0b><code data-v-b72fdb0b>await ctx.storage.get(key, [defaultValue])</code>：获取键值（自动序列化 JSON）</li><li data-v-b72fdb0b><code data-v-b72fdb0b>await ctx.storage.set(key, value)</code>：存储任意 JavaScript 对象或值</li><li data-v-b72fdb0b><code data-v-b72fdb0b>await ctx.storage.delete(key)</code>：删除指定键</li><li data-v-b72fdb0b><code data-v-b72fdb0b>await ctx.storage.list()</code>：列出该插件所有持久化数据</li></ul>",3))])]),d("section",j,[t[13]||(t[13]=d("h2",null,"8. 工具扩展 (Function Calling) 与定时任务",-1)),t[14]||(t[14]=d("p",null,"插件可以随时向系统大模型暴露自定义工具（Function Tool）：",-1)),d("div",M,[b(a(o),{code:B,language:"javascript"})]),t[15]||(t[15]=d("p",{style:{"margin-top":"14px"}},[d("strong",null,"定时调度：")],-1)),t[16]||(t[16]=d("p",null,[e("通过 "),d("code",null,"ctx.cron('0 8 * * *', handler)"),e(" 注册定时任务，在插件禁用或热重载时系统会自动注销计时器，杜绝内存泄漏。")],-1))])])]))}}),E=g(F,[["__scopeId","data-v-b72fdb0b"]]);export{E as default};
