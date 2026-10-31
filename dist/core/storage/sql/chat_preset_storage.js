import { ChatPreset } from '../../channels/preset.js';
import { SqlKvStorage, parseJson, stringifyJson } from '../sql_storage.js';
import { stampTimestamps } from './shareable.js';
import { CHAT_PRESETS } from './tables.js';
const spec = {
    table: CHAT_PRESETS.table,
    columns: CHAT_PRESETS.columns,
    indexes: [{ columns: ['prefix'] }, { columns: ['name'] }],
    filterable: ['id', 'name', 'description', 'prefix', 'namespace', 'cloudId', 'local', 'embedded'],
    boolean: ['local', 'embedded'],
    toRecord(preset, id) {
        const { id: _ignored, name, description, prefix, local, namespace, sendMessageOption, cloudId, createdAt, updatedAt, md5, embedded, uploader, ...rest } = preset;
        return {
            id,
            name: name || '',
            description: description || '',
            prefix: prefix || '',
            // 历史行为：只有显式 false 才存 0
            local: local === false ? 0 : 1,
            namespace: namespace || null,
            sendMessageOption: JSON.stringify(sendMessageOption || {}),
            cloudId: cloudId || null,
            createdAt: createdAt || '',
            updatedAt: updatedAt || '',
            md5: md5 || '',
            embedded: embedded ? 1 : 0,
            uploader: stringifyJson(uploader),
            extraData: Object.keys(rest).length > 0 ? JSON.stringify(rest) : null,
        };
    },
    fromRecord(record) {
        if (!record)
            return null;
        return new ChatPreset({
            id: record.id,
            name: record.name,
            description: record.description,
            prefix: record.prefix,
            local: Boolean(record.local),
            namespace: record.namespace,
            sendMessageOption: parseJson(record.sendMessageOption, {}),
            cloudId: record.cloudId,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            md5: record.md5,
            embedded: Boolean(record.embedded),
            uploader: parseJson(record.uploader, undefined),
            ...parseJson(record.extraData, {}),
        });
    },
};
export class SqlChatPresetStorage extends SqlKvStorage {
    constructor(driver) {
        super(driver, spec);
    }
    getName() {
        return 'SqlChatPresetStorage';
    }
    async setItem(id, preset) {
        stampTimestamps(preset);
        return super.setItem(id, preset);
    }
    async getPresetByPrefix(prefix) {
        await this.ensureInitialized();
        const row = await this.driver.get(`SELECT * FROM ${this.q(this.table)} WHERE ${this.q('prefix')} = ?`, [prefix]);
        return row ? spec.fromRecord(row) : null;
    }
}
export { spec as chatPresetSpec };
