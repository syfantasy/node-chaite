import { ToolsGroupDTO } from '../../types/tools.js';
import { SqlKvStorage, parseJson } from '../sql_storage.js';
import { stampTimestamps } from './shareable.js';
import { TOOLS_GROUPS } from './tables.js';
const spec = {
    table: TOOLS_GROUPS.table,
    columns: TOOLS_GROUPS.columns,
    indexes: [{ columns: ['name'], name: 'idx_tools_groups_name' }],
    filterable: ['id', 'name', 'description', 'isDefault'],
    boolean: ['isDefault'],
    toRecord(group, id) {
        const { name, description, toolIds, isDefault, createdAt, updatedAt } = group;
        return {
            id,
            name: name || '',
            description: description || '',
            toolIds: JSON.stringify(toolIds || []),
            isDefault: isDefault ? 1 : 0,
            createdAt: createdAt || '',
            updatedAt: updatedAt || '',
        };
    },
    fromRecord(record) {
        if (!record)
            return null;
        return new ToolsGroupDTO({
            id: record.id,
            name: record.name,
            description: record.description,
            toolIds: parseJson(record.toolIds, []),
            isDefault: Boolean(record.isDefault),
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        });
    },
};
export class SqlToolsGroupStorage extends SqlKvStorage {
    constructor(driver) {
        super(driver, spec);
    }
    getName() {
        return 'SqlToolsGroupStorage';
    }
    async setItem(id, group) {
        stampTimestamps(group);
        return super.setItem(id, group);
    }
}
export { spec as toolsGroupSpec };
