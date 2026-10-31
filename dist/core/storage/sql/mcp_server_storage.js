import { SqlKvStorage, parseJson } from '../sql_storage.js';
import { MCP_SERVERS } from './tables.js';
/**
 * MCP 连接配置。里面有凭据（headers 里的 Authorization、env 里的 API key），
 * 所以整条记录只落本地库，不上传云端。
 */
const spec = {
    table: MCP_SERVERS.table,
    columns: MCP_SERVERS.columns,
    indexes: [{ columns: ['name'], name: 'idx_mcp_servers_name' }],
    filterable: ['id', 'name', 'enabled'],
    boolean: ['enabled'],
    orderBy: 'updatedAt DESC',
    toRecord(value, id) {
        return {
            id,
            name: value.name,
            enabled: value.enabled ? 1 : 0,
            updatedAt: value.updatedAt || Date.now(),
            payload: JSON.stringify(value),
        };
    },
    fromRecord(record) {
        if (!record)
            return null;
        return parseJson(record.payload, null);
    },
};
export class SqlMcpServerStorage extends SqlKvStorage {
    constructor(driver) {
        super(driver, spec);
    }
    getName() {
        return 'SqlMcpServerStorage';
    }
}
export { spec as mcpServerSpec };
