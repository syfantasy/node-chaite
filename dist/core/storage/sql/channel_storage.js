import { Channel } from '../../channels/channels.js';
import { SqlKvStorage, parseJson, stringifyJson } from '../sql_storage.js';
import { stampTimestamps } from './shareable.js';
import { CHANNELS } from './tables.js';
const spec = {
    table: CHANNELS.table,
    columns: CHANNELS.columns,
    indexes: [{ columns: ['type'] }, { columns: ['status'] }],
    filterable: [
        'id', 'name', 'description', 'adapterType', 'type', 'status', 'cloudId', 'weight', 'priority', 'embedded',
    ],
    numeric: ['weight', 'priority'],
    boolean: ['embedded'],
    toRecord(channel, id) {
        const { id: _ignored, name, description, adapterType, type, weight, priority, status, disabledReason, models, options, statistics, uploader, cloudId, createdAt, updatedAt, md5, embedded, ...rest } = channel;
        return {
            id,
            name: name || '',
            description: description || '',
            adapterType: adapterType || type || '',
            type: type || '',
            weight: weight || 1,
            priority: priority || 0,
            status: status || 'enabled',
            disabledReason: disabledReason || null,
            models: Array.isArray(models) ? JSON.stringify(models) : '[]',
            options: stringifyJson(options),
            statistics: stringifyJson(statistics),
            uploader: stringifyJson(uploader),
            cloudId: cloudId || null,
            createdAt: createdAt || '',
            updatedAt: updatedAt || '',
            md5: md5 || '',
            embedded: embedded ? 1 : 0,
            extra: Object.keys(rest).length > 0 ? JSON.stringify(rest) : null,
        };
    },
    fromRecord(record) {
        if (!record)
            return null;
        return new Channel({
            id: record.id,
            name: record.name,
            description: record.description,
            adapterType: record.adapterType,
            type: record.type,
            weight: Number(record.weight),
            priority: Number(record.priority),
            status: record.status,
            disabledReason: record.disabledReason,
            models: parseJson(record.models, []),
            // Channel 的构造函数会把这两个普通对象分别喂给 BaseClientOptions.fromString
            // 和 ChannelStatistics，所以这里给的是反序列化后的裸对象，不是成品实例
            options: parseJson(record.options, {}),
            statistics: parseJson(record.statistics, {}),
            uploader: parseJson(record.uploader, undefined),
            // 列一直是 INTEGER（老库就是这么建的），但 Shareable 把 cloudId 声明成
            // string。保持列不变以兼容既有数据，这里只做类型上的转接。
            cloudId: record.cloudId,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            md5: record.md5,
            embedded: Boolean(record.embedded),
            ...parseJson(record.extra, {}),
        });
    },
};
export class SqlChannelStorage extends SqlKvStorage {
    constructor(driver) {
        super(driver, spec);
    }
    getName() {
        return 'SqlChannelStorage';
    }
    async setItem(id, channel) {
        stampTimestamps(channel);
        return super.setItem(id, channel);
    }
    /**
     * models 存的是 JSON 数组，按子串匹配单个模型名。
     *
     * 改造前这是藏在 listItemsByEqFilter 里的一个 LIKE 特判——叫「等值过滤」却做
     * 子串匹配是误导，这里提成显式方法。
     */
    async listItemsByModel(model) {
        await this.ensureInitialized();
        const rows = await this.driver.all(`SELECT * FROM ${this.q(this.table)} WHERE ${this.q('models')} LIKE ?`, [`%${model}%`]);
        return rows.map(row => spec.fromRecord(row)).filter((item) => Boolean(item));
    }
}
export { spec as channelSpec };
