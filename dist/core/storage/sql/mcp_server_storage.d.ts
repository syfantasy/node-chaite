import { McpServerConfig } from '../../agent/mcp/McpServerConfig.js';
import { SqlDriver } from '../driver/types.js';
import { SqlKvStorage, TableSpec } from '../sql_storage.js';
/**
 * MCP 连接配置。里面有凭据（headers 里的 Authorization、env 里的 API key），
 * 所以整条记录只落本地库，不上传云端。
 */
declare const spec: TableSpec<McpServerConfig>;
export declare class SqlMcpServerStorage extends SqlKvStorage<McpServerConfig> {
    constructor(driver: SqlDriver);
    getName(): string;
}
export { spec as mcpServerSpec };
