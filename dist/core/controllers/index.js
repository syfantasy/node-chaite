import express from 'express';
import AuthRouter from './auth.js';
import ChannelsRouter from './channels.js';
import ToolsRouter from './tools.js';
import ChatPresetRouter from './preset.js';
import StateRouter from './state.js';
import ConfigRouter from './config.js';
import ProcessorsRouter from './processors.js';
import OpenAIRouter from './openai.js';
import ToolGroupsRouter from './toolsGroup.js';
import TriggerRouter from './trigger.js';
import SystemRouter from './basic.js';
import AgentRouter from './agent.js';
import LogsRouter from './logs.js';
import MaintenanceRouter from './maintenance.js';
import cors from 'cors';
import { authenticateToken } from './middlewares.js';
import { getLogger } from '../utils/index.js';
import path from 'path';
import fs from 'node:fs';
import { __dirname } from '../__dirname.js';
export function createApp(configure, options = {}) {
    const app = express();
    app.use(express.json());
    app.use(cors());
    app.use('/api/system', SystemRouter);
    app.use('/api/channels', authenticateToken, ChannelsRouter);
    app.use('/api/tools', authenticateToken, ToolsRouter);
    app.use('/api/preset', authenticateToken, ChatPresetRouter);
    app.use('/api/state', authenticateToken, StateRouter);
    app.use('/api/config', authenticateToken, ConfigRouter);
    app.use('/api/processors', authenticateToken, ProcessorsRouter);
    app.use('/api/triggers', authenticateToken, TriggerRouter);
    app.use('/api/toolGroups', authenticateToken, ToolGroupsRouter);
    app.use('/api/agent', authenticateToken, AgentRouter);
    app.use('/api/logs', authenticateToken, LogsRouter);
    app.use('/api/maintenance', authenticateToken, MaintenanceRouter);
    app.use('/v1', authenticateToken, OpenAIRouter);
    configure?.(app);
    // core AuthRouter 必须在 configure 之后挂载：宿主（server.ts）会在 configure 中注册
    // 增强版 POST /api/auth/login（支持首次访问初始化管理密码）。若先挂载 core AuthRouter，
    // Express 按注册顺序匹配会永远命中 core 的 /login（仅校验已有密码，未初始化时
    // authKey 回退为 'admin'），导致首次设置密码时始终返回 401 "Invalid token"。
    app.use('/api/auth', AuthRouter);
    const frontendDir = options.frontendDir
        ? path.resolve(options.frontendDir)
        : path.join(__dirname, '../frontend/build');
    const frontendEntry = path.join(frontendDir, 'index.html');
    if (fs.existsSync(frontendEntry)) {
        app.use(express.static(frontendDir));
        app.get('*', (_req, res) => {
            res.sendFile(frontendEntry);
        });
    }
    else {
        getLogger().warn(`Chaite management panel not found at ${frontendDir}`);
        app.get('*', (_req, res) => {
            res.status(404).json({ code: -1, data: null, message: 'Management panel is not installed' });
        });
    }
    return app;
}
export function runServer(host, port, configure, options = {}) {
    const app = createApp(configure, options);
    const server = app.listen(port, host, () => {
        getLogger().info(`Chaite server is running at http://${host}:${port}`);
    });
    return { app, server };
}
