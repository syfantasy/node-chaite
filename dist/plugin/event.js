import { Chaite, createClient, ChaiteContext } from '../core/index.js';
import { groupHistoryBuffer } from '../context/groupHistoryBuffer.js';
export class ChaiteEvent {
    constructor(params) {
        this.userId = params.userId;
        this.groupId = params.groupId;
        this.text = params.text;
        this.rawText = params.rawText;
        this.sender = params.sender;
        this.images = params.images || [];
        this.raw = params.raw;
        this.client = params.client;
        this.eventType = params.eventType || 'message';
        this.isPoke = Boolean(params.isPoke || params.eventType === 'poke');
        this.isSelfPoke = Boolean(params.isSelfPoke);
        this.targetId = params.targetId;
        this.operatorId = params.operatorId;
        this.messageId = params.messageId;
        this.subType = params.subType;
        this.flag = params.flag;
        this.comment = params.comment;
        this.command = params.command;
        this.args = params.args || '';
        this.replyHandler = params.replyHandler;
    }
    get isGroup() {
        return this.groupId !== null && this.groupId !== undefined;
    }
    get isPrivate() {
        return !this.isGroup;
    }
    /**
     * 快捷调用底层适配器协议动作 (如 OneBot 的 callAction)
     */
    async callAction(action, params = {}) {
        if (this.client && typeof this.client.callAction === 'function') {
            return this.client.callAction(action, params);
        }
        const globalClient = globalThis.onebotClient;
        if (globalClient && typeof globalClient.callAction === 'function') {
            return globalClient.callAction(action, params);
        }
        throw new Error('当前环境无可用协议客户端 (Client 未就绪)');
    }
    /**
     * 快捷同意好友申请或入群申请 (仅在 request 事件中生效)
     */
    async approve(remark) {
        if (this.eventType !== 'request' || !this.flag) {
            throw new Error('approve 仅可在 request 申请事件中调用且需要有效 flag');
        }
        if (this.subType === 'group' || this.isGroup) {
            return this.callAction('set_group_add_request', {
                flag: this.flag,
                sub_type: this.raw?.sub_type || 'add',
                approve: true,
                reason: remark,
            });
        }
        else {
            return this.callAction('set_friend_add_request', {
                flag: this.flag,
                approve: true,
                remark: remark || '',
            });
        }
    }
    /**
     * 快捷拒绝好友申请或入群申请 (仅在 request 事件中生效)
     */
    async reject(reason) {
        if (this.eventType !== 'request' || !this.flag) {
            throw new Error('reject 仅可在 request 申请事件中调用且需要有效 flag');
        }
        if (this.subType === 'group' || this.isGroup) {
            return this.callAction('set_group_add_request', {
                flag: this.flag,
                sub_type: this.raw?.sub_type || 'add',
                approve: false,
                reason: reason || '',
            });
        }
        else {
            return this.callAction('set_friend_add_request', {
                flag: this.flag,
                approve: false,
            });
        }
    }
    /**
     * 快捷撤回消息
     */
    async deleteMsg(messageId) {
        const targetId = messageId || this.messageId || this.raw?.message_id;
        if (!targetId) {
            throw new Error('未提供要撤回的 messageId');
        }
        return this.callAction('delete_msg', { message_id: targetId });
    }
    /**
     * 快捷获取当前群的成员列表 (仅群聊可用)
     */
    async getMemberList() {
        if (!this.groupId)
            return [];
        try {
            const res = await this.callAction('get_group_member_list', { group_id: Number(this.groupId) });
            return Array.isArray(res?.data) ? res.data : [];
        }
        catch {
            return [];
        }
    }
    /**
     * 调用已注册的渲染服务将 HTML / URL 转换为图片
     */
    async render(options) {
        const renderer = globalThis.chaiteRenderer;
        if (renderer && typeof renderer.render === 'function') {
            return renderer.render(options);
        }
        throw new Error('当前系统未启用或未注册可用渲染服务 (请检查是否已安装并启用 service-renderer 插件)');
    }
    /**
     * 统一回复消息（支持纯文本、内嵌 CQ 码自动转换、或结构化参数如 { text, at: true, images }）
     */
    async reply(content) {
        return this.replyHandler(content);
    }
    /**
     * 直接调用 AI 模型回答（单轮问答）
     * - 支持指定预设 (presetId) 自动映射渠道
     * - 支持纯净基元模式 (pure: true 或指定 channelId)，完全跳过预设人设，直接向底层模型请求
     */
    async queryAI(prompt, options) {
        const chaite = Chaite.getInstance();
        const storageCtx = globalThis.chaiteStorageCtx;
        const channelsManager = chaite.getChannelsManager();
        // 判定是否走纯净基元对话（不经过任何预设人设）：
        const isPure = Boolean(options?.pure || options?.channelId || (options?.systemPrompt && !options?.presetId));
        if (isPure) {
            let targetChannel = null;
            if (options?.channelId) {
                const all = await channelsManager.getAllChannels();
                targetChannel = all.find((c) => c.id === options.channelId);
            }
            const modelName = options?.model || (targetChannel?.models?.[0]?.name) || 'gpt-4o-mini';
            if (!targetChannel) {
                const channels = await channelsManager.getChannelByModel(modelName);
                targetChannel = channels?.find((c) => c.status === 'enabled') || channels?.[0];
            }
            if (!targetChannel) {
                const allChannels = await channelsManager.getAllChannels();
                targetChannel = allChannels.find((c) => c.status === 'enabled') || allChannels[0];
            }
            if (!targetChannel) {
                throw new Error(`找不到可用的 AI 渠道进行基元调用`);
            }
            const clientOptions = targetChannel.getOptionsForModel(modelName);
            await clientOptions.ready();
            const context = new ChaiteContext(chaite.getLogger());
            const client = createClient(targetChannel.adapterType, clientOptions, context);
            const messages = [];
            if (options?.systemPrompt) {
                messages.push({
                    role: 'system',
                    content: [{ type: 'text', text: options.systemPrompt }],
                });
            }
            messages.push({
                role: 'user',
                content: [{ type: 'text', text: prompt }],
            });
            const sendOpt = {
                model: modelName,
                temperature: options?.temperature !== undefined ? options.temperature : 0.7,
            };
            const resp = await client.sendMessageWithHistory(messages, sendOpt);
            const text = resp?.content
                ?.filter((c) => c.type === 'text')
                ?.map((c) => c.text)
                ?.join('') || '';
            return text;
        }
        // 走预设模式：
        let preset = null;
        if (options?.presetId) {
            preset = await storageCtx?.presetManager?.getPresetById(options.presetId);
        }
        else {
            preset = await chaite.getUserModeSelector().getChatPreset({
                sender: { user_id: Number(this.userId) },
                group: this.groupId ? { group_id: Number(this.groupId) } : undefined,
            });
        }
        const modelName = options?.model || preset?.sendMessageOption?.model;
        const channels = await channelsManager.getChannelByModel(modelName);
        const channel = channels?.find((c) => c.status === 'enabled') || channels?.[0];
        if (!channel) {
            throw new Error(`找不到可用于模型 "${modelName}" 的有效渠道`);
        }
        const clientOptions = channel.getOptionsForModel(modelName);
        await clientOptions.ready();
        const context = new ChaiteContext(chaite.getLogger());
        const client = createClient(channel.adapterType, clientOptions, context);
        const messages = [];
        if (preset?.presetPrompt) {
            messages.push({
                role: 'system',
                content: [{ type: 'text', text: preset.presetPrompt }],
            });
        }
        messages.push({
            role: 'user',
            content: [{ type: 'text', text: prompt }],
        });
        const sendOpt = {
            ...preset?.sendMessageOption,
            model: modelName,
            temperature: options?.temperature !== undefined ? options.temperature : preset?.sendMessageOption?.temperature,
        };
        const resp = await client.sendMessageWithHistory(messages, sendOpt);
        const text = resp?.content
            ?.filter((c) => c.type === 'text')
            ?.map((c) => c.text)
            ?.join('') || '';
        return text;
    }
    /**
     * 携带当前群聊上下文向 AI 发问
     */
    async askWithContext(prompt, options) {
        let contextStream = '';
        if (this.groupId) {
            try {
                const stream = await groupHistoryBuffer.buildContext(this.groupId, {}, this.raw?.message_id);
                if (stream) {
                    contextStream = stream.fullText;
                }
            }
            catch (e) {
                console.warn('[ChaiteEvent] Failed to build context stream:', e);
            }
        }
        const combinedPrompt = contextStream
            ? `${contextStream}\n\n[用户在当前讨论中的提问]: ${prompt}`
            : prompt;
        return this.queryAI(combinedPrompt, options);
    }
}
