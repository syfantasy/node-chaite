import { ToolDTO } from '../../types/tools.js';
import { TriggerDTO } from '../../types/trigger.js';
import { SqlKvStorage, parseJson, stringifyJson } from '../sql_storage.js';
import { stampTimestamps } from './shareable.js';
import { TOOLS, TRIGGERS } from './tables.js';
/**
 * 工具和触发器的表结构除了 isOneTime 之外完全一样，序列化逻辑也一样。
 * 与其抄两遍，不如把共同部分参数化——这正是整个改造要消灭的那种重复。
 */
const EXECUTABLE_FILTERABLE = [
    'id', 'name', 'description', 'modelType', 'cloudId', 'md5', 'status', 'permission', 'embedded',
];
function writeExecutable(entity, id, defaultModelType) {
    const { id: _ignored, name, description, modelType, code, cloudId, embedded, uploader, createdAt, updatedAt, md5, status, permission, isOneTime: _isOneTime, ...rest } = entity;
    return {
        record: {
            id,
            name: name || '',
            description: description || '',
            modelType: modelType || defaultModelType,
            code: code || null,
            cloudId: cloudId || null,
            embedded: embedded ? 1 : 0,
            uploader: stringifyJson(uploader),
            createdAt: createdAt || '',
            updatedAt: updatedAt || '',
            md5: md5 || '',
            status: status || 'enabled',
            permission: permission || 'public',
        },
        rest,
    };
}
function readExecutable(record) {
    return {
        id: record.id,
        name: record.name,
        description: record.description,
        modelType: record.modelType,
        code: record.code,
        cloudId: record.cloudId,
        embedded: Boolean(record.embedded),
        uploader: parseJson(record.uploader, undefined),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        md5: record.md5,
        status: record.status,
        permission: record.permission,
        ...parseJson(record.extraData, {}),
    };
}
const toolsSpec = {
    table: TOOLS.table,
    columns: TOOLS.columns,
    indexes: [
        { columns: ['name'], name: 'idx_tools_name' },
        { columns: ['status'], name: 'idx_tools_status' },
        { columns: ['permission'], name: 'idx_tools_permission' },
    ],
    filterable: EXECUTABLE_FILTERABLE,
    boolean: ['embedded'],
    toRecord(tool, id) {
        const { record, rest } = writeExecutable(tool, id, '');
        return { ...record, extraData: Object.keys(rest).length > 0 ? JSON.stringify(rest) : null };
    },
    fromRecord(record) {
        if (!record)
            return null;
        return new ToolDTO(readExecutable(record));
    },
};
const triggerSpec = {
    table: TRIGGERS.table,
    columns: TRIGGERS.columns,
    indexes: [
        { columns: ['name'], name: 'idx_triggers_name' },
        { columns: ['status'], name: 'idx_triggers_status' },
    ],
    filterable: [...EXECUTABLE_FILTERABLE, 'isOneTime'],
    boolean: ['embedded', 'isOneTime'],
    toRecord(trigger, id) {
        const { record, rest } = writeExecutable(trigger, id, 'executable');
        return {
            ...record,
            isOneTime: trigger.isOneTime ? 1 : 0,
            extraData: Object.keys(rest).length > 0 ? JSON.stringify(rest) : null,
        };
    },
    fromRecord(record) {
        if (!record)
            return null;
        return new TriggerDTO({ ...readExecutable(record), isOneTime: Boolean(record.isOneTime) });
    },
};
export class SqlToolsStorage extends SqlKvStorage {
    constructor(driver) {
        super(driver, toolsSpec);
    }
    getName() {
        return 'SqlToolsStorage';
    }
    async setItem(id, tool) {
        stampTimestamps(tool);
        return super.setItem(id, tool);
    }
}
export class SqlTriggerStorage extends SqlKvStorage {
    constructor(driver) {
        super(driver, triggerSpec);
    }
    getName() {
        return 'SqlTriggerStorage';
    }
    async setItem(id, trigger) {
        stampTimestamps(trigger);
        return super.setItem(id, trigger);
    }
}
export { toolsSpec, triggerSpec };
