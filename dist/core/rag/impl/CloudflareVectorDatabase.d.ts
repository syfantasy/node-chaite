import { AbstractVectorDatabase } from '../vector.js';
/**
 * 使用Cloudflare的Vectorize数据库实现向量数据库
 * // todo
 */
export declare class CloudflareVectorDatabase extends AbstractVectorDatabase {
    addVector(vector: number[], text: string): Promise<string>;
    addVectors(vectors: number[][], texts: string[]): Promise<string[]>;
    clear(): Promise<void>;
    count(): Promise<number>;
    deleteVector(id: string): Promise<boolean>;
    getVector(id: string): Promise<{
        vector: number[];
        text: string;
    } | null>;
    search(queryVector: number[], k: number): Promise<Array<{
        id: string;
        score: number;
        text: string;
    }>>;
    updateVector(id: string, newVector: number[], newText: string): Promise<boolean>;
}
