import type { ChaiteContext } from '../../types/common.js';
import type { McpServerConfig, McpServerManager } from './McpServerConfig.js';
export interface ActiveMcpTools {
    server: McpServerConfig;
    toolNames: string[];
    expiresAt: number;
}
/**
 * Ephemeral, conversation-scoped MCP capability grants.
 * They deliberately contain only tool names: schemas are fetched from the
 * cached server manifest only after the LLM has selected matching MCP tools.
 */
export declare class McpCapabilityManager {
    private readonly servers;
    private readonly ttlMs;
    private readonly maxToolsPerServer;
    private readonly active;
    private readonly drafts;
    constructor(servers: () => McpServerManager | undefined, ttlMs?: number, maxToolsPerServer?: number);
    activate(context: ChaiteContext, serverRef: string, toolNames: string[]): Promise<ActiveMcpTools>;
    getActive(context: ChaiteContext): ActiveMcpTools[];
    clear(context: ChaiteContext): void;
    createDraft(config: Omit<McpServerConfig, 'id' | 'createdAt' | 'updatedAt'>): {
        id: string;
        expiresAt: number;
    };
    takeDraft(id: string): Omit<McpServerConfig, 'id' | 'createdAt' | 'updatedAt'> | null;
    private scope;
}
