import { ColumnSpec, ColumnTypeName } from '../driver/types.js';
/**
 * 绝大多数可分享实体（渠道、预设、工具、处理器、触发器）都继承 AbstractShareable，
 * 表结构里因此有一整组完全相同的列。抽出来避免五份拷贝各自漂移。
 */
export declare const SHAREABLE_COLUMNS: Record<string, ColumnSpec | ColumnTypeName>;
/** 写入时统一打时间戳：首次写入补 createdAt，每次写入刷新 updatedAt。 */
export declare function stampTimestamps<T extends {
    createdAt?: string;
    updatedAt?: string;
}>(entity: T): T;
/** 把 record 里的公共字段读回实体形状。 */
export declare function readShareable(record: Record<string, unknown>): {
    id: string;
    name: string;
    description: string;
    cloudId: number;
    createdAt: string;
    updatedAt: string;
    md5: string;
    embedded: boolean;
};
/** 把实体的公共字段写成 record 形状。 */
export declare function writeShareable(entity: Record<string, unknown>): {
    name: string;
    description: string;
    cloudId: number;
    createdAt: string;
    updatedAt: string;
    md5: string;
    embedded: number;
};
