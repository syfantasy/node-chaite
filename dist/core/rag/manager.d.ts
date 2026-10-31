import { VectorDatabase } from './vector.js';
import { RAGResult, Vectorizer } from '../types/index.js';
export declare class RAGManager {
    private vectorDb;
    private vectorizer;
    constructor(vectorDb: VectorDatabase, vectorizer: Vectorizer);
    /**
     * 添加文档到 RAG 系统
     * @param document 文档文本
     * @param maxNum 最大分割数
     */
    addDocument(document: string, maxNum?: number): Promise<void>;
    /**
     * 执行 RAG 查询
     * @param query 查询文本
     * @param k 返回结果数量
     * @returns 查询结果
     */
    query(query: string, k: number): Promise<RAGResult[]>;
    /**
     * 聚合检索出来的结果
     * @param results 文本形式
     * @param filterScore 过滤的最低分数
     */
    getAggregatedResults(results: RAGResult[], filterScore?: number): string;
}
