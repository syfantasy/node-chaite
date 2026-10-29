# Chaite

基于 **Chaite** 内核与 **OneBot v11** 的独立高性能 AI 智能体接入服务。

## 核心架构与技术文档

系统采用模块化独立架构：
- **完整架构与技术设计详见**: 👉 [**ARCHITECTURE.md**](./ARCHITECTURE.md)
  - 核心架构与 SQLite 持久化存储
  - 双水位线群聊上下文与 KV Cache 优化
  - 多模态图片注入与三级渐进式 GIF 压缩
  - 视觉能力自适应分流与普通工具 `ask_about_image`
  - 伪人插话模式与预设隔离机制
  - 独立插件热插拔系统与沙箱隔离

## 快速入口

- **Web 控制台**: 默认端口 `48370`（Token 见 `config.json` 中的 `adminToken`）
- **配置文件**: `config.json`（参考 `config.example.json`）
- **运行日志**: `bot.log`
