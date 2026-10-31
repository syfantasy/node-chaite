import type { BasicStorage } from '../../types/storage.js';
export type McpTransportType = 'streamable-http' | 'sse' | 'stdio';
export interface McpToolManifest {
    name: string;
    description?: string;
    schema?: unknown;
}
/** Persistent configuration for a single MCP server connection */
export interface McpServerConfig {
    id: string;
    name: string;
    description?: string;
    /** Transport type. Existing baseUrl-only records default to streamable HTTP. */
    transport?: McpTransportType;
    /** MCP endpoint for Streamable HTTP / legacy SSE transports. */
    url?: string;
    /** @deprecated Use url. Kept to migrate existing MCP configuration records. */
    baseUrl?: string;
    /** Extra request headers. Useful for Authorization and vendor API keys. */
    headers?: Record<string, string>;
    /** @deprecated Use headers.Authorization. */
    authHeader?: string;
    /** Command to run for a local stdio MCP server. */
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
    /** Legacy tool-group binding. MCP discovery is global for enabled servers. */
    toolGroupIds?: string[];
    /** Cached on a successful connection test; avoids discovering tools per chat. */
    tools?: McpToolManifest[];
    toolsDiscoveredAt?: number;
    /** Default timeout for tool calls in ms */
    timeoutMs?: number;
    /** Whether this server is active */
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
}
/**
 * Manager for MCP server configurations.
 * CRUD over BasicStorage — no cloud sharing (configs contain private credentials).
 *
 * These configs are used by Chaite.buildToolExecutor() to create McpToolExecutors
 * and attach them to channels at startup.
 */
export declare class McpServerManager {
    private readonly storage;
    constructor(storage: BasicStorage<McpServerConfig>);
    add(config: Omit<McpServerConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<McpServerConfig>;
    update(id: string, patch: Partial<Omit<McpServerConfig, 'id' | 'createdAt'>>): Promise<McpServerConfig | null>;
    delete(id: string): Promise<void>;
    get(id: string): Promise<McpServerConfig | null>;
    list(): Promise<McpServerConfig[]>;
    listEnabled(): Promise<McpServerConfig[]>;
    listEnabledForToolGroups(toolGroupIds: string[]): Promise<McpServerConfig[]>;
}
