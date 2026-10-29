# Chaite

独立高性能 AI 智能体接入服务与管理控制台。

## 安装与启动

### 1. 克隆仓库

```bash
git clone https://github.com/syfantasy/node-chaite.git chaite
cd chaite
```

### 2. 安装依赖

推荐使用 Node.js 20+ 环境：

```bash
npm install
# 或使用 pnpm
pnpm install
```

### 3. 配置初始化

复制示例配置文件：

```bash
cp config.example.json config.json
```

编辑 `config.json`，设置你的管理员密钥（`adminToken`）及监听端口（默认 `48370`）。

### 4. 运行服务

```bash
# 开发模式（代码变动自动重载）
npm run dev

# 生产模式
npm start
```

启动后在浏览器打开 `http://localhost:48370`，输入 `adminToken` 即可进入 Web 控制台。

---

## 核心架构与技术文档

系统采用模块化独立架构：
- **完整架构与技术设计详见**: 👉 [**ARCHITECTURE.md**](./ARCHITECTURE.md)
  - 核心架构与 SQLite 持久化存储
  - 双水位线群聊上下文与 KV Cache 优化
  - 多模态图片注入与三级渐进式 GIF 压缩
  - 视觉能力自适应分流与普通工具 `ask_about_image`
  - 伪人插话模式与预设隔离机制
  - 独立插件热插拔系统与沙箱隔离

## 目录速览

- **Web 控制台**: 默认端口 `48370`
- **配置文件**: `config.json`（参考 `config.example.json`）
- **数据目录**: `data/`（自动生成的 SQLite 数据库及媒体缓存）
- **插件目录**: `plugins/`
- **运行日志**: `bot.log`
