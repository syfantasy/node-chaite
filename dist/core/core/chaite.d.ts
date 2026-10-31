import { ChannelsManager, ChatPresetManager, ProcessorsManager, ToolManager } from '../share/index.js';
import { ChaiteContext, CustomConfig, HistoryManager, ILogger, ModelResponse, SendMessageOption, TriggerDTO, UserMessage } from '../types/index.js';
import { EventMessage, UserModeSelector } from '../types/index.js';
import { BasicStorage, UserState } from '../types/index.js';
import { FrontEndAuthHandler, GlobalConfig } from '../utils/index.js';
import { ChatPreset } from '../channels/index.js';
import { RAGManager } from '../rag/index.js';
import EventEmitter from 'node:events';
import { ApiServerOptions } from '../controllers/index.js';
import { ToolsGroupManager } from '../share/index.js';
import { TriggerManager } from '../share/index.js';
import type { Application } from 'express';
import type { SkillRegistry } from '../agent/skills/SkillRegistry.js';
import type { BackgroundJobManager } from '../agent/background/BackgroundJobManager.js';
import type { DynamicScheduler } from '../agent/scheduler/DynamicScheduler.js';
import type { McpServerManager } from '../agent/mcp/McpServerConfig.js';
import { McpCapabilityManager } from '../agent/mcp/McpCapabilityManager.js';
import type { AgentRunContext } from '../agent/contracts.js';
import type { WorkflowEngine } from '../agent/workflow/WorkflowEngine.js';
import type { PlanExecutor } from '../agent/planning/PlanExecutor.js';
import { McpToolExecutor } from '../agent/tool-executors/mcp.js';
import { OperationLogManager } from '../share/operation-log.js';
/**
 * 入口
 */
export declare class Chaite extends EventEmitter {
    private channelsManager;
    private toolsManager;
    private processorsManager;
    private chatPresetManager;
    private toolsGroupManager;
    private triggerManager;
    private userModeSelector;
    private userStateStorage;
    private historyManager;
    private logger;
    private static instance;
    private ragManager?;
    private frontendAuthHandler;
    private globalConfig?;
    private expressApp?;
    /** SkillRegistry loaded from SKILL.md directories */
    private skillRegistry?;
    /** BackgroundJobManager for async task execution */
    private backgroundJobManager?;
    /** Shared storage for agent state (plans, jobs, etc.) */
    private agentStorage?;
    /** Dynamic scheduler for LLM-created scheduled tasks */
    private dynamicScheduler?;
    /** MCP server configuration manager */
    private mcpServerManager?;
    private mcpCapabilityManager?;
    private mcpManagementGuard?;
    /** Workflow engine for executing WorkflowDefinitions */
    private workflowEngine?;
    /** Plan executor for LLM-driven dynamic planning */
    private planExecutor?;
    /** Operation log manager — records fine-grained AI activity */
    private operationLogManager;
    /** Memory manager for persistent lightweight user & global facts */
    private memoryManager?;
    private constructor();
    static init(channelsManager: ChannelsManager, toolsManager: ToolManager, processorsManager: ProcessorsManager, chatPresetManager: ChatPresetManager, toolsGroupManager: ToolsGroupManager, triggerManager: TriggerManager<TriggerDTO>, userModeSelector: UserModeSelector, userStateStorage: BasicStorage<UserState>, historyManager: HistoryManager, logger: ILogger): Chaite;
    static getInstance(): Chaite;
    onUpdateCustomConfig: (config: CustomConfig) => Promise<CustomConfig>;
    setUpdateConfigCallback(callback: (config: CustomConfig) => Promise<CustomConfig>): void;
    getCustomConfig: () => Promise<CustomConfig>;
    setGetConfig(callback: () => Promise<CustomConfig>): void;
    setRAGManager(ragManager: RAGManager): void;
    getRAGManager(): RAGManager;
    setGlobalConfig(globalConfig: GlobalConfig): void;
    getGlobalConfig(): GlobalConfig;
    setFrontendAuthHandler(frontendAuthHandler: FrontEndAuthHandler): void;
    getFrontendAuthHandler(): FrontEndAuthHandler;
    /**
       * 对话
       * @param message
       * @param e
       * @param options 包含对话id和消息id
       */
    sendMessage(message: UserMessage, e: EventMessage, options: SendMessageOption & {
        chatPreset?: ChatPreset;
    }): Promise<ModelResponse>;
    setSkillRegistry(registry: SkillRegistry): void;
    getSkillRegistry(): SkillRegistry | undefined;
    setBackgroundJobManager(manager: BackgroundJobManager): void;
    getBackgroundJobManager(): BackgroundJobManager | undefined;
    setAgentStorage(storage: BasicStorage<unknown>): void;
    getAgentStorage(): BasicStorage<unknown> | undefined;
    setDynamicScheduler(scheduler: DynamicScheduler): void;
    getDynamicScheduler(): DynamicScheduler | undefined;
    setMcpServerManager(manager: McpServerManager): void;
    getMcpServerManager(): McpServerManager | undefined;
    getMcpCapabilityManager(): McpCapabilityManager | undefined;
    setMcpManagementGuard(guard: (context: ChaiteContext) => boolean): void;
    canManageMcp(context: ChaiteContext): boolean;
    setMemoryManager(manager: import('../memory/index.js').MemoryManager): void;
    getMemoryManager(): import('../memory/index.js').MemoryManager | undefined;
    setWorkflowEngine(engine: WorkflowEngine): void;
    getWorkflowEngine(): WorkflowEngine | undefined;
    setPlanExecutor(executor: PlanExecutor): void;
    getPlanExecutor(): PlanExecutor | undefined;
    setOperationLogManager(mgr: OperationLogManager): void;
    getOperationLogManager(): OperationLogManager | undefined;
    /**
     * Subscribe to Chaite's EventEmitter to automatically capture
     * job lifecycle and plan/tool audit events into the operation log.
     */
    private _subscribeOperationLogEvents;
    /**
     * Build a composite McpToolExecutor from all enabled MCP server configs.
     * Returns undefined if no MCP servers are configured.
     * Call this after init and assign to channel.options.toolExecutor if desired.
     *
     * Multiple MCP servers are chained as fallback: first server that has the tool wins.
     */
    buildMcpExecutor(): Promise<McpToolExecutor | undefined>;
    /**
     * Build an AgentRunContext bound to the current Chaite instance.
     * Used by BackgroundJobManager and PlanExecutor when running background tasks.
     */
    buildAgentRunContext(overrides?: {
        jobId?: string;
        skillName?: string;
        userId?: string;
        groupId?: string;
    }): AgentRunContext;
    getChannelsManager(): ChannelsManager;
    setChannelsManager(channelsManager: ChannelsManager): void;
    getToolsManager(): ToolManager;
    setToolsManager(toolsManager: ToolManager): void;
    getProcessorsManager(): ProcessorsManager;
    setProcessorsManager(processorsManager: ProcessorsManager): void;
    getChatPresetManager(): ChatPresetManager;
    setChatPresetManager(chatPresetManager: ChatPresetManager): void;
    getToolsGroupManager(): ToolsGroupManager;
    setToolsGroupManager(toolsGroupManager: ToolsGroupManager): void;
    getTriggerManager(): TriggerManager<TriggerDTO>;
    setTriggerManager(triggerManager: TriggerManager<TriggerDTO>): void;
    getUserModeSelector(): UserModeSelector;
    setUserModeSelector(userModeSelector: UserModeSelector): void;
    getUserStateStorage(): BasicStorage<UserState>;
    setUserStateStorage(userStateStorage: BasicStorage<UserState>): void;
    getHistoryManager(): HistoryManager;
    setHistoryManager(historyManager: HistoryManager): void;
    getLogger(): ILogger;
    setLogger(logger: ILogger): void;
    setCloudService(cloudServiceBaseUrl: string): void;
    auth(apiKey: string): Promise<void>;
    getExpressApp(): Application | undefined;
    runApiServer(configureApp?: (app: Application) => void, options?: ApiServerOptions): Application;
}
