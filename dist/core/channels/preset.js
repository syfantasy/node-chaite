import { AbstractShareable, SendMessageOption } from '../types/index.js';
/**
 * 对话模式预设，最终使用的
 */
export class ChatPreset extends AbstractShareable {
    constructor(params) {
        super(params);
        if (params) {
            this.prefix = params.prefix || '';
            this.prefixes = Array.isArray(params.prefixes) ? params.prefixes : (params.prefix ? [params.prefix] : []);
            if (params.sendMessageOption) {
                this.sendMessageOption = params.sendMessageOption;
            }
            this.local = params.local || false;
            this.namespace = params.namespace;
            this.groupContext = params.groupContext;
            this.dynamicContextHistory = params.dynamicContextHistory;
            this.builtinToolCategories = params.builtinToolCategories;
            this.isBymMode = params.isBymMode;
            this.prefixAnywhere = params.prefixAnywhere !== undefined ? params.prefixAnywhere : true;
            this.disableSystemInstructions = params.disableSystemInstructions;
            this.disableConversationContext = params.disableConversationContext;
            this.quoteReply = params.quoteReply !== undefined ? params.quoteReply : false;
            this.showThinking = params.showThinking !== undefined ? params.showThinking : false;
            this.customOptions = params.customOptions;
            this.autoTriggerProbability = typeof params.autoTriggerProbability === 'number' ? params.autoTriggerProbability : 0;
            this.groupContextMinMessages = params.groupContextMinMessages;
            this.groupContextMinTokens = params.groupContextMinTokens;
            this.groupContextMaxMessages = params.groupContextMaxMessages;
            this.groupContextMaxTokens = params.groupContextMaxTokens;
            this.enableRetry = params.enableRetry !== undefined ? params.enableRetry : false;
            this.enableMemory = params.enableMemory !== undefined ? params.enableMemory : false;
            this.maxRetries = typeof params.maxRetries === 'number' ? params.maxRetries : 2;
            this.enableFallback = params.enableFallback !== undefined ? params.enableFallback : false;
            this.fallbackModel = params.fallbackModel;
            this.fallbackModels = Array.isArray(params.fallbackModels) ? params.fallbackModels : (params.fallbackModel ? [params.fallbackModel] : []);
            this.whiteGroups = Array.isArray(params.whiteGroups) ? params.whiteGroups : [];
            this.blackGroups = Array.isArray(params.blackGroups) ? params.blackGroups : [];
            this.whiteUsers = Array.isArray(params.whiteUsers) ? params.whiteUsers : [];
            this.blackUsers = Array.isArray(params.blackUsers) ? params.blackUsers : [];
        }
    }
    toString() {
        return JSON.stringify({
            id: this.id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            embedded: this.embedded,
            uploader: this.uploader,
            modelType: this.modelType,
            prefix: this.prefix,
            // channelId: this.channelId,
            name: this.name,
            local: this.local,
            namespace: this.namespace,
            description: this.description,
            sendMessageOption: this.sendMessageOption?.toString(), // 嵌套序列化
            groupContext: this.groupContext,
            dynamicContextHistory: this.dynamicContextHistory,
            builtinToolCategories: this.builtinToolCategories,
            isBymMode: this.isBymMode,
            prefixAnywhere: this.prefixAnywhere !== undefined ? this.prefixAnywhere : true,
            disableSystemInstructions: this.disableSystemInstructions,
            disableConversationContext: this.disableConversationContext,
            quoteReply: this.quoteReply !== undefined ? this.quoteReply : false,
            showThinking: this.showThinking !== undefined ? this.showThinking : false,
            customOptions: this.customOptions,
            autoTriggerProbability: this.autoTriggerProbability !== undefined ? this.autoTriggerProbability : 0,
            groupContextMinMessages: this.groupContextMinMessages,
            groupContextMinTokens: this.groupContextMinTokens,
            groupContextMaxMessages: this.groupContextMaxMessages,
            groupContextMaxTokens: this.groupContextMaxTokens,
            enableRetry: this.enableRetry !== undefined ? this.enableRetry : false,
            enableMemory: this.enableMemory !== undefined ? this.enableMemory : false,
            maxRetries: this.maxRetries !== undefined ? this.maxRetries : 2,
            enableFallback: this.enableFallback !== undefined ? this.enableFallback : false,
            fallbackModel: this.fallbackModel,
            fallbackModels: this.fallbackModels,
            prefixes: this.prefixes,
            whiteGroups: this.whiteGroups,
            blackGroups: this.blackGroups,
            whiteUsers: this.whiteUsers,
            blackUsers: this.blackUsers,
        });
    }
    fromString(str) {
        const raw = JSON.parse(str);
        const preset = new ChatPreset();
        preset.prefix = raw.prefix;
        // preset.channelId = raw.channelId
        preset.name = raw.name;
        preset.local = raw.local;
        preset.namespace = raw.namespace;
        preset.description = raw.description;
        preset.id = raw.id;
        preset.createdAt = raw.createdAt;
        preset.updatedAt = raw.updatedAt;
        preset.embedded = raw.embedded;
        preset.uploader = raw.uploader;
        preset.modelType = raw.modelType;
        preset.groupContext = raw.groupContext;
        preset.dynamicContextHistory = raw.dynamicContextHistory;
        preset.builtinToolCategories = raw.builtinToolCategories;
        preset.isBymMode = raw.isBymMode;
        preset.prefixAnywhere = raw.prefixAnywhere !== undefined ? Boolean(raw.prefixAnywhere) : true;
        preset.disableSystemInstructions = raw.disableSystemInstructions;
        preset.disableConversationContext = raw.disableConversationContext;
        preset.quoteReply = raw.quoteReply !== undefined ? Boolean(raw.quoteReply) : false;
        preset.showThinking = raw.showThinking !== undefined ? Boolean(raw.showThinking) : false;
        preset.customOptions = raw.customOptions;
        preset.autoTriggerProbability = typeof raw.autoTriggerProbability === 'number' ? raw.autoTriggerProbability : 0;
        preset.groupContextMinMessages = typeof raw.groupContextMinMessages === 'number' ? raw.groupContextMinMessages : undefined;
        preset.groupContextMinTokens = typeof raw.groupContextMinTokens === 'number' ? raw.groupContextMinTokens : undefined;
        preset.groupContextMaxMessages = typeof raw.groupContextMaxMessages === 'number' ? raw.groupContextMaxMessages : undefined;
        preset.groupContextMaxTokens = typeof raw.groupContextMaxTokens === 'number' ? raw.groupContextMaxTokens : undefined;
        preset.enableRetry = raw.enableRetry !== undefined ? Boolean(raw.enableRetry) : false;
        preset.enableMemory = raw.enableMemory !== undefined ? Boolean(raw.enableMemory) : false;
        preset.maxRetries = typeof raw.maxRetries === 'number' ? raw.maxRetries : 2;
        preset.enableFallback = raw.enableFallback !== undefined ? Boolean(raw.enableFallback) : false;
        preset.fallbackModel = raw.fallbackModel;
        preset.fallbackModels = Array.isArray(raw.fallbackModels) ? raw.fallbackModels : (raw.fallbackModel ? [raw.fallbackModel] : []);
        preset.prefixes = Array.isArray(raw.prefixes) ? raw.prefixes : (raw.prefix ? [raw.prefix] : []);
        if (preset.prefixes.length > 0 && !preset.prefix) {
            preset.prefix = preset.prefixes[0];
        }
        preset.whiteGroups = Array.isArray(raw.whiteGroups) ? raw.whiteGroups.map(String) : [];
        preset.blackGroups = Array.isArray(raw.blackGroups) ? raw.blackGroups.map(String) : [];
        preset.whiteUsers = Array.isArray(raw.whiteUsers) ? raw.whiteUsers.map(String) : [];
        preset.blackUsers = Array.isArray(raw.blackUsers) ? raw.blackUsers.map(String) : [];
        if (raw.sendMessageOption) {
            preset.sendMessageOption = typeof raw.sendMessageOption === 'string'
                ? SendMessageOption.create().fromString(raw.sendMessageOption)
                : SendMessageOption.create().fromString(JSON.stringify(raw.sendMessageOption));
        }
        return preset;
    }
    toFormatedString(verbose) {
        let base = `预设ID：${this.id}`;
        if (this.name) {
            base += `\n预设名称：${this.name}`;
        }
        if (this.namespace) {
            base += `\nnamespace：${this.namespace}`;
        }
        if (this.description) {
            base += `\n描述：${this.description}`;
        }
        if (this.prefix) {
            base += `\n前缀：${this.prefix}`;
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
        if (this.sendMessageOption) {
            if (this.sendMessageOption.model) {
                base += `\n模型：${this.sendMessageOption.model}`;
            }
            if (this.sendMessageOption.temperature) {
                base += `\n温度：${this.sendMessageOption.temperature}`;
            }
            if (this.sendMessageOption.maxToken) {
                base += `\n最大Token：${this.sendMessageOption.maxToken}`;
            }
            if (verbose) {
                if (this.sendMessageOption.systemOverride) {
                    base += `\n系统提示：${this.sendMessageOption.systemOverride}`;
                }
            }
            else {
                base += '\n预设内容仅主人可查看';
            }
        }
        if (this.groupContext === 'disable') {
            base += '\n禁止携带群聊上下文';
        }
        else if (this.groupContext === 'enabled') {
            base += '\n携带群聊上下文';
        }
        else if (this.groupContext === 'use_system') {
            base += '\n群聊上下文使用全局配置';
        }
        if (this.isBymMode) {
            base += '\n伪人模式：开启';
        }
        return base.trimEnd();
    }
}
