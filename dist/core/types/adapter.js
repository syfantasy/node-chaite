export class SendMessageOption {
    constructor(option) {
        this.model = option.model;
        this.temperature = option.temperature;
        this.maxToken = option.maxToken;
        this.systemOverride = option.systemOverride;
        this.disableHistoryRead = option.disableHistoryRead;
        this.disableHistorySave = option.disableHistorySave;
        this.conversationId = option.conversationId;
        this.parentMessageId = option.parentMessageId;
        this.stream = option.stream;
        this.isThinkingModel = option.isThinkingModel;
        this.showThinking = option.showThinking;
        this.customOptions = option.customOptions;
        this.enableReasoning = option.enableReasoning;
        this.reasoningEffort = option.reasoningEffort;
        this.reasoningBudgetTokens = option.reasoningBudgetTokens;
        this.claudeThinkingMode = option.claudeThinkingMode;
        this.claudeEffort = option.claudeEffort;
        this.openaiReasoningEffort = option.openaiReasoningEffort;
        this.openaiThinkingBudgetTokens = option.openaiThinkingBudgetTokens;
        this.openaiMaxTokenField = option.openaiMaxTokenField;
        this.geminiThinkingLevel = option.geminiThinkingLevel;
        this.toolChoice = option.toolChoice;
        this.preProcessorIds = option.preProcessorIds;
        this.postProcessorIds = option.postProcessorIds;
        this.toolGroupId = option.toolGroupId;
        this.mcpServerIds = option.mcpServerIds;
        this.toolMountMode = option.toolMountMode;
        this.enabledSkills = option.enabledSkills;
        this.safetySettings = option.safetySettings;
        this.responseModalities = option.responseModalities;
        this.onChunk = option.onChunk;
        this.onMessageWithToolCall = option.onMessageWithToolCall;
        this.toolCallLimit = option.toolCallLimit;
        this._consecutiveToolCallCount = option._consecutiveToolCallCount;
        this._consecutiveIdenticalToolCallCount = option._consecutiveIdenticalToolCallCount;
        this._lastToolCallSignature = option._lastToolCallSignature;
        this.toolTimeoutMs = option.toolTimeoutMs;
        this.jobId = option.jobId;
        this.planId = option.planId;
        this.skillName = option.skillName;
        this.enableMemory = option.enableMemory;
        this.builtinToolCategories = option.builtinToolCategories;
        this.geminiBuiltinTools = option.geminiBuiltinTools;
        this.persistMessage = option.persistMessage;
        this.prependContext = option.prependContext;
    }
    static create(options) {
        return options instanceof SendMessageOption
            ? options
            : new SendMessageOption(options || {});
    }
    fromString(str) {
        return JSON.parse(str);
    }
    toString() {
        const json = {
            model: this.model,
            temperature: this.temperature,
            maxToken: this.maxToken,
            systemOverride: this.systemOverride,
            disableHistoryRead: this.disableHistoryRead,
            disableHistorySave: this.disableHistorySave,
            conversationId: this.conversationId,
            parentMessageId: this.parentMessageId,
            stream: this.stream,
            isThinkingModel: this.isThinkingModel,
            showThinking: this.showThinking,
            customOptions: this.customOptions,
            enableReasoning: this.enableReasoning,
            reasoningEffort: this.reasoningEffort,
            reasoningBudgetTokens: this.reasoningBudgetTokens,
            claudeThinkingMode: this.claudeThinkingMode,
            claudeEffort: this.claudeEffort,
            openaiReasoningEffort: this.openaiReasoningEffort,
            openaiThinkingBudgetTokens: this.openaiThinkingBudgetTokens,
            openaiMaxTokenField: this.openaiMaxTokenField,
            geminiThinkingLevel: this.geminiThinkingLevel,
            toolChoice: this.toolChoice,
            preProcessorIds: this.preProcessorIds,
            postProcessorIds: this.postProcessorIds,
            toolGroupId: this.toolGroupId,
            mcpServerIds: this.mcpServerIds,
            toolMountMode: this.toolMountMode,
            enabledSkills: this.enabledSkills,
            responseModalities: this.responseModalities,
            safetySettings: this.safetySettings,
            toolCallLimit: this.toolCallLimit,
            enableMemory: this.enableMemory,
            builtinToolCategories: this.builtinToolCategories,
            geminiBuiltinTools: this.geminiBuiltinTools,
        };
        return JSON.stringify(json);
    }
}
export class AbstractHistoryManager {
}
