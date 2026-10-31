/** 可分享实体共有的那组列（渠道、预设、工具、处理器、触发器）。 */
export const SHAREABLE_COLUMNS = {
    cloudId: { type: 'int' },
    createdAt: { type: 'text' },
    updatedAt: { type: 'text' },
    md5: { type: 'text' },
    embedded: { type: 'bool', default: 0 },
    uploader: { type: 'json' },
};
/** 工具和触发器除 isOneTime 外结构完全一致。 */
const EXECUTABLE_COLUMNS = {
    id: { type: 'text', pk: true },
    name: { type: 'text', notNull: true },
    description: { type: 'text' },
    modelType: { type: 'text' },
    code: { type: 'text' },
    status: { type: 'text' },
    permission: { type: 'text' },
    ...SHAREABLE_COLUMNS,
};
export const CHANNELS = {
    database: 'main',
    table: 'channels',
    keyColumn: 'id',
    columns: {
        id: { type: 'text', pk: true },
        name: { type: 'text', notNull: true },
        description: { type: 'text' },
        adapterType: { type: 'text', notNull: true },
        type: { type: 'text', notNull: true },
        weight: { type: 'int', default: 1 },
        priority: { type: 'int', default: 0 },
        status: { type: 'text', default: 'enabled' },
        disabledReason: { type: 'text' },
        models: { type: 'json' },
        options: { type: 'json' },
        statistics: { type: 'json' },
        ...SHAREABLE_COLUMNS,
        extra: { type: 'json' },
    },
};
export const CHAT_PRESETS = {
    database: 'main',
    table: 'chat_presets',
    keyColumn: 'id',
    columns: {
        id: { type: 'text', pk: true },
        name: { type: 'text', notNull: true },
        description: { type: 'text' },
        prefix: { type: 'text', notNull: true },
        local: { type: 'bool', default: 1 },
        namespace: { type: 'text' },
        sendMessageOption: { type: 'json', notNull: true },
        ...SHAREABLE_COLUMNS,
        extraData: { type: 'json' },
    },
};
export const TOOLS = {
    database: 'main',
    table: 'tools',
    keyColumn: 'id',
    columns: { ...EXECUTABLE_COLUMNS, extraData: { type: 'json' } },
};
export const TRIGGERS = {
    database: 'main',
    table: 'triggers',
    keyColumn: 'id',
    columns: { ...EXECUTABLE_COLUMNS, isOneTime: { type: 'bool' }, extraData: { type: 'json' } },
};
export const PROCESSORS = {
    database: 'main',
    table: 'processors',
    keyColumn: 'id',
    columns: {
        id: { type: 'text', pk: true },
        name: { type: 'text', notNull: true },
        description: { type: 'text' },
        type: { type: 'text', notNull: true },
        code: { type: 'text' },
        ...SHAREABLE_COLUMNS,
        extraData: { type: 'json' },
    },
};
export const TOOLS_GROUPS = {
    database: 'main',
    table: 'tools_groups',
    keyColumn: 'id',
    columns: {
        id: { type: 'text', pk: true },
        name: { type: 'text', notNull: true },
        description: { type: 'text' },
        toolIds: { type: 'json', notNull: true },
        isDefault: { type: 'bool', default: 0 },
        createdAt: { type: 'text' },
        updatedAt: { type: 'text' },
    },
};
export const USER_STATES = {
    database: 'main',
    table: 'user_states',
    // 业务主键是 userId，id 只是个随机 UUID 代理键
    keyColumn: 'userId',
    uniqueIndex: { columns: ['userId'], name: 'uniq_user_states_userId', unique: true },
    columns: {
        id: { type: 'text', pk: true },
        userId: { type: 'text', notNull: true },
        nickname: { type: 'text' },
        card: { type: 'text' },
        conversations: { type: 'json', notNull: true },
        settings: { type: 'json', notNull: true },
        current: { type: 'json', notNull: true },
        updatedAt: { type: 'bigint' },
    },
};
export const MCP_SERVERS = {
    database: 'main',
    table: 'mcp_servers',
    keyColumn: 'id',
    columns: {
        id: { type: 'text', pk: true },
        name: { type: 'text', notNull: true },
        enabled: { type: 'bool', notNull: true, default: 1 },
        updatedAt: { type: 'bigint', notNull: true },
        payload: { type: 'json', notNull: true },
    },
};
export const HISTORY = {
    database: 'history',
    table: 'history',
    keyColumn: 'id',
    columns: {
        id: { type: 'text', pk: true },
        parentId: { type: 'text' },
        conversationId: { type: 'text' },
        role: { type: 'text' },
        messageData: { type: 'json' },
        createdAt: { type: 'text' },
    },
};
export const OPERATION_LOGS = {
    database: 'operation_logs',
    table: 'operation_logs',
    keyColumn: 'id',
    columns: {
        id: { type: 'text', pk: true },
        timestamp: { type: 'bigint', notNull: true },
        type: { type: 'text', notNull: true },
        level: { type: 'text', notNull: true },
        userId: { type: 'text' },
        groupId: { type: 'text' },
        channelId: { type: 'text' },
        model: { type: 'text' },
        presetId: { type: 'text' },
        payload: { type: 'json', notNull: true },
    },
};
export const MEMORIES = {
    database: 'main',
    table: 'memories',
    keyColumn: 'id',
    columns: {
        id: { type: 'text', pk: true },
        scope: { type: 'text', notNull: true },
        groupId: { type: 'text' },
        userId: { type: 'text' },
        targetId: { type: 'text', notNull: true },
        key: { type: 'text', notNull: true },
        content: { type: 'text', notNull: true },
        importance: { type: 'int', default: 50 },
        updatedAt: { type: 'bigint', default: 0 },
    },
    uniqueIndex: { columns: ['scope', 'targetId', 'key'], name: 'uniq_memories_scope_target_key', unique: true },
};
/** chaite 自己管的全部表。宿主有额外的表可以自己追加。 */
export const CHAITE_TABLES = [
    CHANNELS, CHAT_PRESETS, TOOLS, TRIGGERS, PROCESSORS,
    TOOLS_GROUPS, USER_STATES, MCP_SERVERS, HISTORY, OPERATION_LOGS,
    MEMORIES,
];
