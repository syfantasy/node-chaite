/**
 * 绝大多数可分享实体（渠道、预设、工具、处理器、触发器）都继承 AbstractShareable，
 * 表结构里因此有一整组完全相同的列。抽出来避免五份拷贝各自漂移。
 */
export const SHAREABLE_COLUMNS = {
    cloudId: { type: 'int' },
    createdAt: { type: 'text' },
    updatedAt: { type: 'text' },
    md5: { type: 'text' },
    embedded: { type: 'bool', default: 0 },
    uploader: { type: 'json' },
};
/** 写入时统一打时间戳：首次写入补 createdAt，每次写入刷新 updatedAt。 */
export function stampTimestamps(entity) {
    if (!entity.createdAt)
        entity.createdAt = new Date().toISOString();
    entity.updatedAt = new Date().toISOString();
    return entity;
}
/** 把 record 里的公共字段读回实体形状。 */
export function readShareable(record) {
    return {
        id: record.id,
        name: record.name,
        description: record.description,
        cloudId: record.cloudId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        md5: record.md5,
        embedded: Boolean(record.embedded),
    };
}
/** 把实体的公共字段写成 record 形状。 */
export function writeShareable(entity) {
    return {
        name: entity.name || '',
        description: entity.description || '',
        cloudId: entity.cloudId || null,
        createdAt: entity.createdAt || '',
        updatedAt: entity.updatedAt || '',
        md5: entity.md5 || '',
        embedded: entity.embedded ? 1 : 0,
    };
}
