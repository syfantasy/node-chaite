# Chaite 架构全景文档 (ARCHITECTURE.md)

> 本文档系统记录了 **Chaite** 的整体技术架构、核心设计、视觉处理流水线、上下文调度机制及扩展插件规范。作为系统设计与维护的权威技术基准。

---

## 一、 系统架构与模块分工

### 1. 网络拓扑与协议接入
- **协议端**: 通过 WebSocket（OneBot v11 正向 / 反向连接）与协议端进行全双工消息通信；
- **网络代理**: 外部 API 及模型请求支持通过本地或局域网代理节点出海，国内接口与协议端通信保持直连。

### 2. 系统架构图

```
                +-------------------------------------------------------+
                |             协议端 (OneBot v11 等协议服务)             |
                |               ws://127.0.0.1:3001                     |
                +-------------------------------------------------------+
                                           │  WebSocket
                                           ▼
+───────────────────────────────────────────────────────────────────────+
│                              Chaite 核心                               │
│  - 消息路由与鉴权 (白名单/黑名单/权限控制)                              │
│  - 双水位线群聊上下文流 (Group History Buffer)                         │
│  - 媒体存储与渐进式 GIF 压缩 (MediaRefStore / Gifsicle)                │
│  - 视觉能力自适应与多模态分流 (isModelVisualCapable)                    │
│  - 插件生命周期与热重载管理 (PluginManager)                            │
│  - Web 控制台服务 (NaiveUI SPA, 默认端口: 48370)                       │
+───────────────────────────────────────────────────────────────────────+
        │                                                     │
        ▼                                                     ▼
+──────────────────────────────────+         +──────────────────────────────────+
|            模型调度引擎          |         |         SQLite 持久化层          |
|  - 多模型适配 (OpenAI, Gemini等) |         |  - data/data.db                  |
|  - 预设、工具组与处理器调度      |         |    (预设、渠道、自定义工具)      |
|  - MCP 标准协议工具接入          |         |  - data/history.db               |
|  - 运行时插件调度 (Plugin API)   |         |    (多轮会话历史)                |
|                                  |         |  - data/operation_logs.db        |
+──────────────────────────────────+         +──────────────────────────────────+
```

### 3. 工程结构
- **核心代码**: `src/`（主入口 `src/index.ts`、配置 `src/config.ts`、Web 服务 `src/server.ts`）。
- **插件目录**: `plugins/`（支持单脚本插件与目录级应用插件）。
- **Web 前端**: `web/`（基于 Vue 3 + Naive UI + Vite）。
- **数据目录**: `data/`（基于纯 SQLite 实现轻量免运维持久化）：
  - `data.db`: 渠道（channels）、预设（chat_presets）、工具（tools）、工具组（tools_groups）；
  - `history.db`: 会话上下文与多轮历史记录；
  - `operation_logs.db`: 系统操作审计与请求日志。

---

## 二、 群聊上下文与 KV Cache 优化设计

### 1. 紧凑文本流设计（Roster + Stream）
传统上下文直接倾倒原始 JSON/XML 卡片或表格会导致 token 膨胀和格式干扰。系统采用单行化紧凑流：
- **花名册块 `<chat_members>`**:
  ```xml
  <chat_members>
  - 群名片: "群友A", QQ昵称: "昵称A" (QQ: 10001, 角色: 主人, 头衔: "管理员", 等级: Lv.100)
  - 群名片: "群友B", QQ昵称: "昵称B" (QQ: 10002, 等级: Lv.80)
  - 群名片: "Bot", QQ昵称: "Bot" (QQ: 10003, 角色: 机器人)
  </chat_members>
  ```
  - **动态补全群头衔与等级**:
    - OneBot v11 协议在普通推送事件 `event.sender` 中默认不携带 `title` 和 `level`。
    - 系统内置高性能带 TTL 内存缓存机制，通过并发接口补全群员真实专属头衔（`title`）与活跃等级（`level`），并享有 30 分钟缓存。
- **消息流块 `<group_messages>` (真实群名片 + 系统认证角标流)**:
  ```xml
  <group_messages>
  [20:23] 群友A [群管/主人]: 测试消息
  [20:23] 群友B: 收到回复
  [20:23] Bot [机器人]: 收到，处理完毕
  </group_messages>
  ```
  - **核心机制与优势**:
    - **称呼自然**: 彻底弃用 `U1/U2` 人造映射编号，模型在群聊中称呼群友自然逼真。
    - **支持多主人与复合身份**: 系统依据 `masterUsers` 与真实权限强制注入系统认证角标（`[群主/主人]`、`[群管/主人]`、`[主人]`、`[群管]`、`[机器人]`）。
    - **防伪造注入安全**: 剥离用户群名片中可能包含的伪造角标，普通群友无法获得系统认证后缀。
- **去除冗余**: 当前触发轮次的消息 ID 会从构建的上下文中自动剔除，避免 active turn 重复。

### 2. 双水位线动态滑动窗口 (Dual-Watermark Window)
为了最大化利用 Gemini / Claude / DeepSeek 等模型的 **KV Cache Prefix Caching**，避免频繁变更上下文头部导致缓存击穿：
- **触发淘汰条件**: 仅当 **消息数 > `maxMessages` (默认 100)** 且 **总估算 Token > `maxTokens` (默认 10000)** 时触发淘汰；
- **回落目标**: 裁剪到 **`minMessages` (默认 20)** 与 **`minTokens` (默认 2000)**；
- **配置优先级**: 预设可选覆盖 > 全局配置默认（预设中未配置则自动回退全局）。

### 3. 富媒体卡片压缩 (`cardParser.ts`)
- 解析各种富文本与小程序卡片，压缩为单行 markdown 链接 `[卡片: 标题 - 详情](url)`，杜绝大 JSON 卡片浪费 tokens。

---

## 三、 多媒体与资源引用体系（MediaRefStore & Ref 规范）

在聊天场景中，图片、视频、语音、文件及合并转发消息体积庞大且异构。Chaite 统一采用 **Ref 引用系统 (`mediaRefStore`)** 对非纯文本媒体进行轻量化占位抽象，既避免了上游大模型上下文和网关 Payload 爆破，又赋予了大模型和插件按需延迟反查与解析能力。

### 1. 全系列 Ref 占位规范

所有媒体进入消息流时，均由 `mediaRefStore` 分配一个带类型前缀的全局唯一短 ID（TTL 2小时）：

| 媒体类型 | 消息流中的文本占位符 | 生成前缀 | 存储元数据与扩展属性 |
|---|---|---|---|
| **图片** | `[图片 ref:img_xxxx]` | `img_` | 原图 URL / 本地文件路径、Base64 缓存、MIME 类型、宽高尺寸 |
| **合并转发** | `[聊天记录:共 N 条记录 摘要: 用户A: xxx; 用户B: yyy... ref:fwd_xxxx]` | `fwd_` | 合并转发 ID (`forwardId`)、前 10 条消息图文预览 (`previewMessages`)、记录总数 |
| **视频** | `[视频:文件名.mp4 ref:vid_xxxx]` | `vid_` | 视频名称、格式后缀 (`ext`)、字节大小 (`fileSize`)、文件 ID / URL |
| **语音** | `[语音 (N秒) ref:voice_xxxx]` | `voice_` | 语音时长 (`duration`)、Silk/Amr 资源定位文件与直链 |
| **文件** | `[文件:文档.pdf (3.5MB) ref:file_xxxx]` | `file_` | 文件名、文件大小、后缀 (`ext`)、群文件 ID (`fileId`)、下载直链 |

---

### 2. 详细媒体类型处理规范

#### ① 图片引用 (`img_xxxx`) & 视觉防爆
- **原生多模态注入**:
  - 扫描最近的 `maxRecentImages`（默认 3 张）图片；
  - 通过 `mediaRefStore.resolveImage` 解析并转化为 `{ type: 'image', image: base64, mimeType }`；
  - 上下文总 Base64 字符上限硬限制为 **3.2MB**，超出自动略过，杜绝网关拒绝。
- **动图渐进式三级压缩策略 (Progressive GIF Optimization)**:
  1. *Tier 1 (原图放行)*: 文件 <= 1.2MB 时，直接保留原始二进制；
  2. *Tier 2 (Gifsicle 动态压缩)*: 文件 > 1.2MB 时，调用系统已安装的 `gifsicle` 进行缩放（最大 360x360）、有损量化、减色与跳帧压缩，**尽可能保留动画动态**；
  3. *Tier 3 (首帧静态降级)*: 若压缩后仍超限或解析报错，纯 JS 降级提取首帧静态 GIF（约 200KB），保证基础视觉可用。
- **纯文本模型自适应**:
  - 若模型渠道未开启 `visual` 能力，自动剥离 Base64 降级为 `[图片 ref:img_xxxx]`，主模型可通过内置的 `ask_about_image` 工具委派视觉模型二级解读。

#### ② 聊天记录与合并转发 (`fwd_xxxx`)
- 当群友发送聊天记录合并转发卡片或在引用中引用合并转发时：
  - 系统异步触发 OneBot `get_forward_msg` 解析内部消息树；
  - 自动提取前 10 条记录的发送人昵称和文字摘要拼接为轻量预览：`[聊天记录:共 18 条记录 摘要: 张三: 明天开会; 李四: 收到... ref:fwd_1a2b3c4d]`；
  - 大模型无需吃进几千行完整的富文本 JSON，即可理解上下文话题；插件可通过 `mediaRefStore.get(ref)` 获取完整转发 ID 进行深度拉取。

#### ③ 视频引用 (`vid_xxxx`)
- 视频在消息中转换为 `[视频:demo.mp4 ref:vid_xxxx]`；
- 插件或工具可通过 `await mediaRefStore.resolveMedia(ref, onebotClient)` 自动调用 OneBot `get_file` 解析出视频的临时直链下载地址或本地缓存绝对路径，方便对接视频抽帧、音轨转录或文件审查。

#### ④ 语音引用 (`voice_xxxx`)
- 语音转换为 `[语音 (5秒) ref:voice_xxxx]`，并在元数据中记录准确的时长与音频资源；
- 支持挂载语音识别插件（如 Whisper、本地语音服务），通过 Ref 提取语音原始音频进行 STT 转写后回填给模型或处理流程。

#### ⑤ 文件引用 (`file_xxxx`)
- 文件转换为 `[文件:需求文档.docx (2.1MB) ref:file_xxxx]`；
- 调用 `await mediaRefStore.resolveMedia(ref, onebotClient)` 时，系统会自动区分私聊文件与群文件，优先调用 `get_group_file_url` 或 `get_file` 获得高可用直链下载地址，供知识库文档提取或代码插件执行。

---

### 3. 代码中使用 Ref 的标准范式

在自定义插件、工具（Tools）或处理器（Processors）中，可直接调用全局对象 `mediaRefStore`：

```typescript
import { mediaRefStore } from 'chaite' // 或 globalThis.mediaRefStore

// 1. 查询引用元数据
const item = mediaRefStore.get('file_a1b2c3d4')
if (item && item.type === 'file') {
  console.log(`收到文件: ${item.name}, 大小: ${item.fileSize}`)
}

// 2. 异步解析直链或本地文件（视频 / 文件）
const resolved = await mediaRefStore.resolveMedia('vid_98765432', globalThis.onebotClient)
if (resolved?.url) {
  console.log(`视频下载地址: ${resolved.url}`)
}

// 3. 异步解析图片为 Base64
const img = await mediaRefStore.resolveImage('img_12345678', globalThis.onebotClient)
if (img) {
  console.log(`图片 MIME: ${img.mimeType}, Base64 长度: ${img.base64.length}`)
}
```

---

## 四、 视觉能力自适应与 `ask_about_image` 工具规范

### 1. 渠道能力动态分流 (`isModelVisualCapable`)
在请求模型前，系统会实时读取当前渠道模型的 `features` 是否包含 `'visual'`：
- **若勾选了 `visual` (具备视觉能力)**:
  - 允许注入 Base64 图像附件；
  - 上下文追加引导提示：已具备视觉感知，请直接作答。
- **若未勾选 `visual` (纯文本模型，如纯文本推理模型)**:
  - **拦截 Base64**: 将用户消息中的图片剥离为占位符 `[图片 ref:img_xxxx]`；
  - 100% 纯文本传输，杜绝上游报不支持图片错误；
  - 图片数据由 `mediaRefStore` 托管缓存。

### 2. 图片查询工具 (`ask_about_image`)
- 仅用于查看因历史截断而看不到画面的占位符图片；
- 当工具被纯文本主模型调用时，工具会自动在系统内寻找具备 `visual` 能力的子模型发起二级识图，并将描述文本交还给主模型。

---

## 五、 行为纪律与预设隔离

1. **伪人插话模式 (`isBymMode`) 预设隔离**:
   - 预设层的 `isBymMode: true` 表示该预设为**单轮插话模式**（不绑定上文上下文、不存历史记录）；每个预设独立设置，互不干扰。
2. **引用回复 (`quoteReply`) 可配置**:
   - 默认不追加引用回复，只有在具体预设中显式勾选 `quoteReply: true` 时才引用群友消息。
3. **全局媒体引用暴露**:
   - 启动时挂载 `globalThis.mediaRefStore` 和 `globalThis.onebotClient`，方便任意脚本与插件直接访问。

---

## 六、 常见维护命令

```bash
# 开发模式
pnpm dev

# 生产运行
npm start

# 构建前端管理面板
pnpm build:web

# 类型检查
npm run check
```

---

## 七、 核心功能与演进设计

### 1. 模型容灾顺延链与错误自动重试
- `enableRetry`: 接口报错后按指数回退策略在当前模型上重试 `maxRetries` 次。
- `fallbackModels`: 顺序数组，支持配置多级备用模型（如 `渠道A/模型1 -> 渠道B/模型2 -> 渠道C/模型3`）。当主模型及重试全部失败后，按数组顺序依次降级顺延尝试。

### 2. 预设多前缀与黑白名单权限
- **多前缀匹配**: 预设触发词支持标签数组（`prefixes`），按最长词优先匹配；向下兼容单前缀 `prefix`。
- **预设专属黑白名单**: 支持为特定预设配置独立的用户与群组黑白名单。

### 3. 动态黑名单管理
- `#拉黑群 [群号]` / `#解黑群 [群号]`: 将指定群加入或移除全局黑名单并落盘 `config.json`。
- `#拉黑 [@某人/QQ号]` / `#解黑 [@某人/QQ号]`: 将指定用户加入或移除全局黑名单并落盘 `config.json`。

### 4. 存储与多模态维护
- **后台日常维护任务**: 启动后及每 24 小时自动触发一次孤儿图片清理与过期聊天历史截断。
- **Web 端维护控制台**: 前端配置面板实时展示会话库体积、图片占用量，并支持一键手动清理。

---

## 八、 插件化与生态演进

### 1. 插件化系统（`src/plugin/`）
- **轻量单脚本插件（`plugins/scripts/<id>/index.js`）**:
  - 热插拔、极简事件监听；
  - 适合群聊快捷小指令、消息前置改写等。
- **完整应用级插件（`plugins/apps/<id>/`）**:
  - 具备独立依赖（`package.json`）、声明式配置架构（`schema.json`）；
  - ESM 动态隔离与 shadow cache 运行时热重载；
  - 支持 Zip 纯 JS 打包导入/导出及 Zip Slip 安全校验；
  - 支持标准 Cron 定时调度（动态卸载自动注销 Job）。

### 2. 生态与协议扩展规划
1. **协议解耦**: 支持扩充适配器（如飞书、企业微信、Telegram、Discord 等）；
2. **标准 MCP 工具生态**: 打通 Model Context Protocol，无缝对接各类 MCP Server；
3. **复合技能（Skills）**: 基于 MCP 工具与 Prompt 编排构建高级 Agent 技能。
