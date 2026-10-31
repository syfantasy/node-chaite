import { DefaultCloudService } from '../share/index.js';
import { ChaiteContext, SendMessageOption, } from '../types/index.js';
import { createClient } from '../adapters/index.js';
import { asyncLocalStorage, DEFAULT_HOST, DEFAULT_PORT, FrontEndAuthHandler, GlobalConfig, InMemoryHistoryManager, } from '../utils/index.js';
import EventEmitter from 'node:events';
import { runServer } from '../controllers/index.js';
import { McpCapabilityManager } from '../agent/mcp/McpCapabilityManager.js';
import { McpToolExecutor } from '../agent/tool-executors/mcp.js';
import { OperationLogManager } from '../share/operation-log.js';
/**
 * 入口
 */
export class Chaite extends EventEmitter {
    constructor(channelsManager, toolsManager, processorsManager, chatPresetManager, toolsGroupManager, triggerManager, userModeSelector, userStateStorage, historyManager = new InMemoryHistoryManager(), logger) {
        super();
        this.channelsManager = channelsManager;
        this.toolsManager = toolsManager;
        this.processorsManager = processorsManager;
        this.chatPresetManager = chatPresetManager;
        this.toolsGroupManager = toolsGroupManager;
        this.triggerManager = triggerManager;
        this.userModeSelector = userModeSelector;
        this.userStateStorage = userStateStorage;
        this.historyManager = historyManager;
        this.logger = logger;
        this.operationLogManager = new OperationLogManager();
        this._subscribeOperationLogEvents(this.operationLogManager);
    }
    static init(channelsManager, toolsManager, processorsManager, chatPresetManager, toolsGroupManager, triggerManager, userModeSelector, userStateStorage, historyManager = new InMemoryHistoryManager(), logger) {
        if (Chaite.instance) {
            return Chaite.instance;
        }
        Chaite.instance = new Chaite(channelsManager, toolsManager, processorsManager, chatPresetManager, toolsGroupManager, triggerManager, userModeSelector, userStateStorage, historyManager, logger);
        Chaite.instance.setFrontendAuthHandler(new FrontEndAuthHandler());
        return Chaite.instance;
    }
    static getInstance() {
        return Chaite.instance;
    }
    setUpdateConfigCallback(callback) {
        this.onUpdateCustomConfig = callback;
    }
    setGetConfig(callback) {
        this.getCustomConfig = callback;
    }
    setRAGManager(ragManager) {
        this.ragManager = ragManager;
    }
    getRAGManager() {
        return this.ragManager;
    }
    setGlobalConfig(globalConfig) {
        this.globalConfig = globalConfig;
        this.globalConfig.on('change', obj => {
            const { key, newVal, oldVal } = obj;
            this.emit('config-change', { key, newVal, oldVal });
        });
    }
    getGlobalConfig() {
        if (!this.globalConfig) {
            this.setGlobalConfig(new GlobalConfig());
        }
        return this.globalConfig;
    }
    setFrontendAuthHandler(frontendAuthHandler) {
        this.frontendAuthHandler = frontendAuthHandler;
    }
    getFrontendAuthHandler() {
        return this.frontendAuthHandler;
    }
    /**
       * 对话
       * @param message
       * @param e
       * @param options 包含对话id和消息id
       */
    async sendMessage(message, e, options) {
        const context = new ChaiteContext(this.logger);
        context.setEvent(e);
        context.setChaite(this);
        // Inject agent context fields from options
        if (options.jobId)
            context.jobId = options.jobId;
        if (options.planId)
            context.planId = options.planId;
        if (options.skillName)
            context.skillName = options.skillName;
        return asyncLocalStorage.run(context, async () => {
            if (!options.chatPreset) {
                options.chatPreset = await this.userModeSelector.getChatPreset(e);
            }
            // Skill selection: if no explicit preset provided, try skill-based routing
            const msgText = message?.content
                ?.filter(c => c.type === 'text')
                .map(c => c.text)
                .join(' ') ?? '';
            if (!options.skillName && this.skillRegistry) {
                const matched = await this.skillRegistry.matchSkill(msgText, {
                    userId: e.sender?.user_id,
                    groupId: e.group?.group_id,
                    isGroup: Boolean(e.group),
                    messageText: msgText,
                });
                if (matched) {
                    context.skillName = matched.id;
                    options.skillName = matched.id;
                    // Apply skill's preset override if specified
                    if (matched.frontmatter.preset && !options.chatPreset) {
                        const skillPreset = await this.chatPresetManager.getInstance(matched.frontmatter.preset);
                        if (skillPreset)
                            options.chatPreset = skillPreset;
                    }
                }
            }
            // If the matched skill declares an executionMode, route accordingly
            if (options.skillName && this.skillRegistry) {
                const skill = this.skillRegistry.getSkillByName(options.skillName);
                const mode = skill?.frontmatter.executionMode;
                if (mode === 'workflow' && this.workflowEngine && skill?.frontmatter.workflowRef) {
                    const agentCtx = this.buildAgentRunContext({
                        skillName: options.skillName,
                        userId: String(e.sender.user_id),
                        groupId: e.group ? String(e.group.group_id) : undefined,
                    });
                    try {
                        const buf = await skill.readFile(skill.frontmatter.workflowRef);
                        const workflowDef = JSON.parse(buf.toString('utf-8'));
                        const result = await this.workflowEngine.run(workflowDef, agentCtx);
                        return {
                            contents: [{ type: 'text', text: result.finalOutput ?? (result.status === 'failed' ? `Workflow failed: ${result.error}` : '') }],
                        };
                    }
                    catch (err) {
                        this.logger.error(`[Chaite] Workflow execution failed for skill "${options.skillName}": ${String(err)}`);
                        // Fall through to normal LLM path as degraded fallback
                    }
                }
                if (mode === 'plan' && this.planExecutor) {
                    const agentCtx = this.buildAgentRunContext({
                        skillName: options.skillName,
                        userId: String(e.sender.user_id),
                        groupId: e.group ? String(e.group.group_id) : undefined,
                    });
                    try {
                        const { output } = await this.planExecutor.execute(msgText, agentCtx);
                        return {
                            contents: [{ type: 'text', text: output }],
                        };
                    }
                    catch (err) {
                        this.logger.error(`[Chaite] Plan execution failed for skill "${options.skillName}": ${String(err)}`);
                        // Fall through to normal LLM path as degraded fallback
                    }
                }
            }
            if (!options.chatPreset) {
                throw new Error('ChatPreset is required for sendMessage');
            }
            const preset = options.chatPreset;
            context.presetId = preset.id;
            context.presetName = preset.name;
            const primaryModelSpec = preset.sendMessageOption?.model || '';
            const enableRetry = Boolean(preset.enableRetry);
            const maxRetries = Math.max(1, Number(preset.maxRetries) || 2);
            const enableFallback = Boolean(preset.enableFallback);
            const fallbackSpecs = [];
            if (enableFallback) {
                if (Array.isArray(preset.fallbackModels)) {
                    for (const m of preset.fallbackModels) {
                        if (m && typeof m === 'string' && m.trim())
                            fallbackSpecs.push(m.trim());
                    }
                }
                if (fallbackSpecs.length === 0 && preset.fallbackModel?.trim()) {
                    fallbackSpecs.push(preset.fallbackModel.trim());
                }
            }
            const allSpecsToTry = [primaryModelSpec, ...fallbackSpecs].filter(Boolean);
            const resolveChannelAndModel = async (spec) => {
                let selectedChannel = undefined;
                let realModel = spec;
                if (spec.includes('/')) {
                    const slashIdx = spec.indexOf('/');
                    const channelIdent = spec.slice(0, slashIdx).trim();
                    const candidateModel = spec.slice(slashIdx + 1).trim();
                    const allChannels = await this.channelsManager.listInstances();
                    const matched = allChannels.find(c => c.name === channelIdent || c.id === channelIdent);
                    if (matched) {
                        selectedChannel = matched;
                        realModel = candidateModel;
                    }
                }
                if (!selectedChannel) {
                    const channels = await this.channelsManager.getChannelByModel(realModel);
                    if (channels.length > 0) {
                        selectedChannel = channels[0];
                    }
                }
                if (!selectedChannel) {
                    throw new Error(`No available channels for model "${spec}"`);
                }
                return { channel: selectedChannel, realModel };
            };
            const invokeModel = async (spec) => {
                const { channel, realModel } = await resolveChannelAndModel(spec);
                context.channelId = channel.id;
                context.channelName = channel.name;
                const clientOptions = channel.getOptionsForModel(realModel);
                await clientOptions.ready();
                clientOptions.setHistoryManager(this.historyManager);
                clientOptions.setLogger(this.logger);
                const client = createClient(channel.adapterType, clientOptions, context);
                const newOptions = {
                    ...preset.sendMessageOption,
                    enableMemory: preset.enableMemory ?? preset.sendMessageOption?.enableMemory,
                    builtinToolCategories: preset.builtinToolCategories,
                    ...Object.fromEntries(Object.entries(options)
                        .filter(([_, value]) => value !== undefined)),
                    model: realModel,
                };
                if (options.skillName && this.skillRegistry) {
                    const skill = this.skillRegistry.getSkillByName(options.skillName);
                    if (skill) {
                        const instructions = await skill.loadInstructions();
                        if (instructions) {
                            const skillBlock = [
                                '<!-- BEGIN_SKILL_RUNTIME -->',
                                `<active_skill id="${skill.id}" name="${skill.frontmatter.name}">`,
                                `### 当前激活专职技能：${skill.frontmatter.name}`,
                                instructions,
                                '</active_skill>',
                                '<!-- END_SKILL_RUNTIME -->',
                            ].join('\n');
                            newOptions.systemOverride = [newOptions.systemOverride, skillBlock]
                                .filter(Boolean)
                                .join('\n\n');
                        }
                    }
                }
                if (this.globalConfig?.getDebug()) {
                    this.logger.debug(`sendMessage options: ${JSON.stringify(newOptions)}`);
                }
                const resp = await client.sendMessage(message, newOptions);
                if (resp && typeof resp === 'object') {
                    ;
                    resp.channelId = channel.id;
                    resp.channelName = channel.name;
                }
                return resp;
            };
            const callWithRetry = async (spec, retries) => {
                let attempt = 0;
                while (true) {
                    try {
                        return await invokeModel(spec);
                    }
                    catch (err) {
                        attempt++;
                        if (retries > 0 && attempt <= retries) {
                            this.logger.warn(`[Chaite] Request for model "${spec}" failed (attempt ${attempt}/${retries}): ${err?.message || err}. Retrying in 1s...`);
                            await new Promise(r => setTimeout(r, 1000));
                            continue;
                        }
                        throw err;
                    }
                }
            };
            let lastSpecError = null;
            for (let i = 0; i < allSpecsToTry.length; i++) {
                const currentSpec = allSpecsToTry[i];
                try {
                    if (i > 0) {
                        this.logger.warn(`[Chaite] Fallback step ${i}: attempting fallback model "${currentSpec}"`);
                    }
                    return await callWithRetry(currentSpec, enableRetry ? maxRetries : 0);
                }
                catch (err) {
                    lastSpecError = err;
                    this.logger.warn(`[Chaite] Model "${currentSpec}" exhausted all retries/attempts: ${err?.message || err}`);
                }
            }
            throw lastSpecError || new Error(`No available model succeeded for preset "${preset.name}"`);
        });
    }
    // ─── Skill Registry ─────────────────────────────────────────────────────────
    setSkillRegistry(registry) {
        this.skillRegistry = registry;
    }
    getSkillRegistry() {
        return this.skillRegistry;
    }
    // ─── Background Job Manager ──────────────────────────────────────────────────
    setBackgroundJobManager(manager) {
        this.backgroundJobManager = manager;
    }
    getBackgroundJobManager() {
        return this.backgroundJobManager;
    }
    // ─── Agent Storage ───────────────────────────────────────────────────────────
    setAgentStorage(storage) {
        this.agentStorage = storage;
    }
    getAgentStorage() {
        return this.agentStorage;
    }
    // ─── Dynamic Scheduler ───────────────────────────────────────────────────────
    setDynamicScheduler(scheduler) {
        this.dynamicScheduler = scheduler;
    }
    getDynamicScheduler() {
        return this.dynamicScheduler;
    }
    // ─── MCP Server Manager ──────────────────────────────────────────────────────
    setMcpServerManager(manager) {
        this.mcpServerManager = manager;
        this.mcpCapabilityManager = new McpCapabilityManager(() => this.mcpServerManager);
    }
    getMcpServerManager() {
        return this.mcpServerManager;
    }
    getMcpCapabilityManager() {
        return this.mcpCapabilityManager;
    }
    setMcpManagementGuard(guard) {
        this.mcpManagementGuard = guard;
    }
    canManageMcp(context) {
        return this.mcpManagementGuard?.(context) ?? false;
    }
    setMemoryManager(manager) {
        this.memoryManager = manager;
    }
    getMemoryManager() {
        return this.memoryManager;
    }
    // ─── Workflow Engine ─────────────────────────────────────────────────────────
    setWorkflowEngine(engine) {
        this.workflowEngine = engine;
    }
    getWorkflowEngine() {
        return this.workflowEngine;
    }
    // ─── Plan Executor ───────────────────────────────────────────────────────────
    setPlanExecutor(executor) {
        this.planExecutor = executor;
    }
    getPlanExecutor() {
        return this.planExecutor;
    }
    // ─── Operation Log Manager ───────────────────────────────────────────────────
    setOperationLogManager(mgr) {
        this.operationLogManager = mgr;
        this._subscribeOperationLogEvents(mgr);
    }
    getOperationLogManager() {
        return this.operationLogManager;
    }
    /**
     * Subscribe to Chaite's EventEmitter to automatically capture
     * job lifecycle and plan/tool audit events into the operation log.
     */
    _subscribeOperationLogEvents(mgr) {
        const on = (event, handler) => {
            this.on(event, handler);
        };
        // ── Background jobs ──────────────────────────────────────────────────────
        on('job:queued', (data) => {
            mgr.addSync({ type: 'job.queued', level: 'info', summary: `Job queued`, jobId: data.jobId, userId: data.userId, metadata: data.data });
        });
        on('job:start', (data) => {
            mgr.addSync({ type: 'job.start', level: 'info', summary: `Job started`, jobId: data.jobId, userId: data.userId, metadata: data.data });
        });
        on('job:complete', (data) => {
            mgr.addSync({ type: 'job.complete', level: 'info', summary: `Job completed`, jobId: data.jobId, userId: data.userId, metadata: data.data });
        });
        on('job:failed', (data) => {
            const errMsg = data.data?.error ?? '';
            mgr.addSync({ type: 'job.failed', level: 'error', summary: `Job failed${errMsg ? ': ' + errMsg : ''}`, jobId: data.jobId, userId: data.userId, detail: errMsg, metadata: data.data });
        });
        on('job:progress', (data) => {
            mgr.addSync({ type: 'job.progress', level: 'info', summary: `Job progress`, jobId: data.jobId, userId: data.userId, metadata: data.data });
        });
        // ── Plans ────────────────────────────────────────────────────────────────
        on('plan:start', (data) => {
            mgr.addSync({ type: 'plan.start', level: 'info', summary: `Plan started`, planId: data.planId, userId: data.userId, metadata: data.data });
        });
        on('plan:step:start', (data) => {
            const stepDesc = data.data?.description ?? data.stepId ?? '';
            mgr.addSync({ type: 'plan.step.start', level: 'info', summary: `Plan step started${stepDesc ? ': ' + stepDesc : ''}`, planId: data.planId, stepId: data.stepId, userId: data.userId, metadata: data.data });
        });
        on('plan:step:end', (data) => {
            mgr.addSync({ type: 'plan.step.end', level: 'info', summary: `Plan step completed`, planId: data.planId, stepId: data.stepId, userId: data.userId, metadata: data.data });
        });
        on('plan:complete', (data) => {
            mgr.addSync({ type: 'plan.complete', level: 'info', summary: `Plan completed`, planId: data.planId, userId: data.userId, metadata: data.data });
        });
        on('plan:failed', (data) => {
            const errMsg = data.data?.error ?? '';
            mgr.addSync({ type: 'plan.failed', level: 'error', summary: `Plan failed${errMsg ? ': ' + errMsg : ''}`, planId: data.planId, userId: data.userId, detail: errMsg, metadata: data.data });
        });
        // ── Tool events from emitAudit ────────────────────────────────────────────
        on('tool:start', (data) => {
            const toolName = data.data?.toolName ?? '';
            mgr.addSync({ type: 'tool.call', level: 'info', summary: `Tool started: ${toolName}`, toolName, userId: data.userId, jobId: data.jobId, planId: data.planId, metadata: data.data });
        });
        on('tool:error', (data) => {
            const toolName = data.data?.toolName ?? '';
            const errMsg = data.data?.error ?? '';
            mgr.addSync({ type: 'tool.error', level: 'error', summary: `Tool error: ${toolName}`, toolName, userId: data.userId, detail: errMsg, jobId: data.jobId, planId: data.planId, metadata: data.data });
        });
    }
    /**
     * Build a composite McpToolExecutor from all enabled MCP server configs.
     * Returns undefined if no MCP servers are configured.
     * Call this after init and assign to channel.options.toolExecutor if desired.
     *
     * Multiple MCP servers are chained as fallback: first server that has the tool wins.
     */
    async buildMcpExecutor() {
        if (!this.mcpServerManager)
            return undefined;
        const servers = await this.mcpServerManager.listEnabled();
        if (servers.length === 0)
            return undefined;
        // Chain executors: last one has no fallback, each wraps the next
        let executor;
        for (let i = servers.length - 1; i >= 0; i--) {
            const cfg = servers[i];
            executor = new McpToolExecutor(cfg, executor);
        }
        return executor;
    }
    /**
     * Build an AgentRunContext bound to the current Chaite instance.
     * Used by BackgroundJobManager and PlanExecutor when running background tasks.
     */
    buildAgentRunContext(overrides) {
        const logger = this.logger;
        const storage = this.agentStorage ?? this.userStateStorage;
        const chaite = this;
        return {
            sendMessage: async (goal, options) => {
                const textContent = [{ type: 'text', text: goal }];
                const userMsg = { role: 'user', content: textContent };
                const fakeEvent = {
                    sender: { user_id: overrides?.userId ?? 'agent', nickname: 'Agent' },
                    group: overrides?.groupId ? { group_id: overrides.groupId } : undefined,
                };
                const mergedOptions = SendMessageOption.create({
                    jobId: overrides?.jobId,
                    skillName: overrides?.skillName,
                    ...options,
                });
                return chaite.sendMessage(userMsg, fakeEvent, mergedOptions);
            },
            storage,
            logger,
            emitAudit: (event) => {
                chaite.emit(event.type, event);
                // Also re-emit job:progress and job:complete as top-level events
                if (event.type === 'job:progress' || event.type === 'job:complete' || event.type === 'job:failed') {
                    chaite.emit(event.type, event.data);
                }
            },
            jobManager: this.backgroundJobManager,
        };
    }
    getChannelsManager() {
        return this.channelsManager;
    }
    setChannelsManager(channelsManager) {
        this.channelsManager = channelsManager;
    }
    getToolsManager() {
        return this.toolsManager;
    }
    setToolsManager(toolsManager) {
        this.toolsManager = toolsManager;
    }
    getProcessorsManager() {
        return this.processorsManager;
    }
    setProcessorsManager(processorsManager) {
        this.processorsManager = processorsManager;
    }
    getChatPresetManager() {
        return this.chatPresetManager;
    }
    setChatPresetManager(chatPresetManager) {
        this.chatPresetManager = chatPresetManager;
    }
    getToolsGroupManager() {
        return this.toolsGroupManager;
    }
    setToolsGroupManager(toolsGroupManager) {
        this.toolsGroupManager = toolsGroupManager;
    }
    getTriggerManager() {
        return this.triggerManager;
    }
    setTriggerManager(triggerManager) {
        this.triggerManager = triggerManager;
    }
    getUserModeSelector() {
        return this.userModeSelector;
    }
    setUserModeSelector(userModeSelector) {
        this.userModeSelector = userModeSelector;
    }
    getUserStateStorage() {
        return this.userStateStorage;
    }
    setUserStateStorage(userStateStorage) {
        this.userStateStorage = userStateStorage;
    }
    getHistoryManager() {
        return this.historyManager;
    }
    setHistoryManager(historyManager) {
        this.historyManager = historyManager;
    }
    getLogger() {
        return this.logger;
    }
    setLogger(logger) {
        this.logger = logger;
    }
    setCloudService(cloudServiceBaseUrl) {
        this.channelsManager.setCloudService(new DefaultCloudService(cloudServiceBaseUrl, 'channel'));
        this.toolsManager.setCloudService(new DefaultCloudService(cloudServiceBaseUrl, 'tool'));
        this.processorsManager.setCloudService(new DefaultCloudService(cloudServiceBaseUrl, 'processor'));
        this.chatPresetManager.setCloudService(new DefaultCloudService(cloudServiceBaseUrl, 'chat-preset'));
        this.toolsGroupManager.setCloudService(new DefaultCloudService(cloudServiceBaseUrl, 'tool-group'));
        this.triggerManager.setCloudService(new DefaultCloudService(cloudServiceBaseUrl, 'trigger'));
    }
    async auth(apiKey) {
        if (!this.toolsManager.cloudService) {
            throw new Error('Cloud service is not initialized');
        }
        const user = await this.toolsManager.cloudService.authenticate(apiKey);
        if (user) {
            user.api_key = apiKey;
            this.channelsManager.cloudService?.setUser(user);
            this.toolsManager.cloudService?.setUser(user);
            this.processorsManager.cloudService?.setUser(user);
            this.triggerManager.cloudService?.setUser(user);
            this.chatPresetManager.cloudService?.setUser(user);
        }
    }
    getExpressApp() {
        return this.expressApp;
    }
    runApiServer(configureApp, options = {}) {
        const { app } = runServer(this.globalConfig?.getHost() || DEFAULT_HOST, this.globalConfig?.getPort() || DEFAULT_PORT, configureApp, options);
        this.expressApp = app;
        return app;
    }
}
