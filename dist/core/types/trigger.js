import { asyncLocalStorage, getLogger } from '../utils/index.js';
import { AbstractShareable } from './cloud.js';
import { ChaiteContext } from './common.js';
import schedule from '@karinjs/node-schedule';
import * as crypto from 'node:crypto';
import { Chaite } from '../core/index.js';
import { createClient } from '../adapters/index.js';
export class TriggerDTO extends AbstractShareable {
    constructor(params) {
        super(params);
        this.modelType = 'executable';
        this.status = params.status || 'enabled';
        this.isOneTime = params.isOneTime || false;
    }
    fromString(str) {
        return new TriggerDTO(JSON.parse(str));
    }
    toFormatedString(verbose) {
        let base = `触发器ID: ${this.id}\n`;
        if (this.name) {
            base += `触发器名称：${this.name}`;
        }
        if (this.description) {
            base += `\n触发器描述：${this.description}`;
        }
        if (this.status) {
            base += `\n触发器状态：${this.status}`;
        }
        if (this.createdAt) {
            base += `\n创建时间：${this.createdAt}`;
        }
        if (this.updatedAt) {
            base += `\n最后更新时间：${this.updatedAt}`;
        }
        if (this.uploader?.username) {
            base += `\n上传者：@${this.uploader.username}`;
        }
        return base.trimEnd();
    }
}
// 基础触发器抽象类
export class BaseTrigger {
    constructor(params) {
        this.triggerExecuted = false;
        this.name = params.name;
        this.isOneTime = params.isOneTime || false;
    }
    async register(context) {
        this.triggerExecuted = false;
        await this.registerImpl(context);
        getLogger().debug(`触发器 ${this.name} 注册成功 ${this.isOneTime ? '(一次性)' : ''}`);
    }
    async unregister() {
        await this.unregisterImpl();
        getLogger().debug(`触发器 ${this.name} 已注销`);
    }
    async checkOneTimeAndCleanup() {
        if (this.isOneTime && !this.triggerExecuted) {
            this.triggerExecuted = true;
            // 延迟执行注销和删除，确保当前操作完成
            setTimeout(async () => {
                try {
                    await this.unregister();
                    // 这里需要通过 name 而不是 id 来删除
                    const triggerManager = asyncLocalStorage.getStore()?.getChaite().getTriggerManager();
                    // 注意：这里需要修改 TriggerManager 中的 deleteInstance 方法
                    // 使其支持通过触发器名称删除
                    await triggerManager?.deleteInstanceByName(this.name);
                    getLogger().info(`一次性触发器 ${this.name} 已执行完毕并自动删除`);
                }
                catch (err) {
                    getLogger().error(`一次性触发器 ${this.name} 清理出错:`, err);
                }
            }, 100);
            return true;
        }
        return false;
    }
    async triggerAction(action) {
        const startedAt = Date.now();
        try {
            // 先执行实际动作
            const context = new ChaiteContext();
            context.setChaite(Chaite.getInstance());
            await asyncLocalStorage.run(context, async () => {
                await action();
                // 如果是一次性触发器，则执行清理
                await this.checkOneTimeAndCleanup();
            });
            Chaite.getInstance().getOperationLogManager()?.addSync({
                type: 'trigger.call', level: 'info', summary: `触发器执行：${this.name}`,
                triggerName: this.name, durationMs: Date.now() - startedAt,
            });
        }
        catch (err) {
            getLogger().error(`触发器 ${this.name} 执行出错:`, err);
            Chaite.getInstance().getOperationLogManager()?.addSync({
                type: 'trigger.error', level: 'error', summary: `触发器失败：${this.name}`,
                triggerName: this.name, detail: err instanceof Error ? err.message : String(err),
                durationMs: Date.now() - startedAt,
            });
            // 即使出错也要执行清理
            if (this.isOneTime) {
                await this.checkOneTimeAndCleanup();
            }
        }
    }
    async queryLLM(message, options) {
        const preset = options.chatPreset;
        if (preset) {
            options = preset.sendMessageOption;
        }
        // todo remove Chaite import
        const context = new ChaiteContext();
        context.setChaite(Chaite.getInstance());
        // context.setEvent({})
        const res = await asyncLocalStorage.run(context, async () => {
            const channels = await Chaite.getInstance().getChannelsManager().getChannelByModel(options.model || '');
            if (channels.length > 0) {
                const channel = channels[0];
                context.channelId = channel.id;
                context.channelName = channel.name;
                context.presetId = preset?.id;
                context.presetName = preset?.name;
                const clientOptions = channel.getOptionsForModel(options.model || '');
                await clientOptions.ready();
                const client = createClient(channel.adapterType, clientOptions, context);
                options.conversationId = crypto.randomUUID();
                options.parentMessageId = crypto.randomUUID();
                return await client.sendMessage(message, options);
            }
        });
        if (!res) {
            throw new Error('No channel found');
        }
        return res;
    }
}
export class CronTrigger extends BaseTrigger {
    constructor(params) {
        super(params);
        this.cronExpression = params.cronExpression;
    }
    async registerImpl(context) {
        if (this.isOneTime) {
            // 对于一次性触发器，使用一次性任务
            const date = new Date(Date.now() + 1000); // 1秒后执行，可根据需要调整
            getLogger().debug(`正在注册一次性触发器 '${this.name}'，计划执行时间: ${date.toLocaleString()}`);
            this.cronJob = schedule.scheduleJob(date, () => {
                getLogger().debug(`开始执行一次性触发器 '${this.name}'`);
                this.triggerAction(() => this.execute(context));
            }) ?? undefined;
            if (this.cronJob) {
                getLogger().debug(`一次性触发器 '${this.name}' 注册成功，将在 ${date.toLocaleString()} 执行`);
            }
            else {
                getLogger().error(`一次性触发器 '${this.name}' 注册失败`);
            }
        }
        else {
            // 对于普通触发器，使用原来的cron表达式
            getLogger().debug(`正在注册定时触发器 '${this.name}'，Cron表达式: ${this.cronExpression}`);
            this.cronJob = schedule.scheduleJob(this.cronExpression, () => {
                getLogger().debug(`开始执行定时触发器 '${this.name}'，Cron表达式: ${this.cronExpression}`);
                this.execute(context).catch(err => {
                    getLogger().error(`触发器 ${this.name} 执行出错:`, err);
                });
            }) ?? undefined;
            if (this.cronJob) {
                const nextRun = this.cronJob.nextInvocation();
                getLogger().debug(`定时触发器 '${this.name}' 注册成功，Cron表达式: ${this.cronExpression}，下次执行时间: ${nextRun?.toLocaleString()}`);
            }
            else {
                getLogger().error(`定时触发器 '${this.name}' 注册失败，Cron表达式可能无效: ${this.cronExpression}`);
            }
        }
    }
    async unregisterImpl() {
        if (this.cronJob) {
            this.cronJob.cancel();
            this.cronJob = undefined;
        }
    }
    async unregister() {
        if (this.cronJob) {
            this.cronJob.cancel();
            this.cronJob = undefined;
            getLogger().info(`触发器 ${this.name} 已取消注册`);
        }
    }
}
// 事件触发器
export class EventTrigger extends BaseTrigger {
    constructor(params) {
        super(params);
        this.isRegistered = false;
        this.eventName = params.eventName;
        this.bot = params.bot;
        this.eventHandler = this.handleEvent.bind(this);
    }
    async register(context) {
        // ... existing code ...
        if (this.isOneTime) {
            // 创建一个包装函数，处理事件后自动注销
            const wrappedHandler = async (...args) => {
                try {
                    await this.handleEvent(...args);
                    // 注销并删除自身
                    await this.unregister();
                    // 通知 TriggerManager 删除此触发器，使用 name 而不是 id
                    const triggerManager = Chaite.getInstance().getTriggerManager();
                    await triggerManager.deleteInstanceByName(this.name);
                }
                catch (err) {
                    getLogger().error(`一次性事件触发器 ${this.name} 处理出错:`, err);
                    // 出错也应该注销，避免重复触发
                    await this.unregister();
                }
            };
            this.eventHandler = wrappedHandler;
        }
        // ... existing code ...
    }
    async unregister() {
        if (!this.isRegistered)
            return;
        this.bot.off(this.eventName, this.eventHandler);
        this.isRegistered = false;
        getLogger().info(`事件触发器 ${this.name} 已注销`);
    }
}
