/**
 * 解析运行数据目录（SQLite 库、config.json、图片、工具/技能脚本等）。
 *
 * 历史上数据全部存放在包目录内（node_modules/<pkg>/data），嵌入式部署下
 * 每次重装/升级依赖都会连带清空渠道、预设与对话历史。现在按以下优先级解析：
 * 1. 宿主 cwd 下 data/chaite 已有数据（data.db 存在）→ 使用它（数据与
 *    node_modules 解耦，重装不丢）。
 * 2. 包目录 data 已有数据 → 沿用（独立部署的历史布局：cwd 即包根，零迁移）。
 * 3. 全新安装 → 落在宿主 cwd 的 data/chaite。
 */
export declare function resolveRootDataDir(): string;
export interface AppConfig {
    onebot?: {
        url?: string;
        accessToken?: string;
        botUin?: number | string;
    };
    web: {
        host: string;
        port: number;
        adminToken: string;
    };
    management: {
        whiteGroups: number[];
        blackGroups: number[];
        whiteUsers: number[];
        blackUsers: number[];
        masterUsers: number[];
    };
    chat: {
        toggleMode: 'at' | 'prefix' | 'both';
        togglePrefix: string;
        commandPrefix?: string;
        allowPrivate: boolean;
        maxMessageLength: number;
        enableAt?: boolean;
        atPresetId?: string;
    };
    llm: {
        defaultModel?: string;
        defaultChatPresetId?: string;
        enableGroupContext?: boolean;
        maxConsecutiveCalls?: number;
        maxConsecutiveIdenticalCalls?: number;
        [key: string]: any;
    };
    bym?: {
        enable?: boolean;
        hit?: string[];
        probability?: number;
        speakingMode?: 'reply' | 'contextual';
        contextualPrompt?: string;
        defaultPreset?: string;
        presetPrefix?: string;
        presetMap?: Array<{
            keywords: string[];
            presetId: string;
            priority: number;
            recall?: boolean;
        }>;
        maxTokens?: number;
        temperature?: number;
        sendReasoning?: boolean;
        [key: string]: any;
    };
    groupContext: {
        minMessages: number;
        minTokens: number;
        maxMessages: number;
        maxTokens: number;
        enableRichCards: boolean;
        enableForwardParse: boolean;
        maxForwardMessages: number;
    };
    logging: {
        enabled: boolean;
        maxRecords: number;
    };
    vision: {
        maxRecentImages: number;
        enableGroupContextImages: boolean;
    };
    maintenance?: {
        historyRetentionDays: number;
        autoCleanImages: boolean;
    };
}
export declare function loadConfig(): AppConfig;
export declare function getConfig(): AppConfig;
export declare function saveConfig(cfg: AppConfig): void;
