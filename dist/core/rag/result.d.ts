import { RAGResult } from '../types/common.js';
export declare class RAGAggregator {
    /**
     * 聚合多个RAG结果
     * @param results RAG结果数组
     * @param maxLength 聚合结果的最大长度
     * @returns 聚合后的文本
     */
    static aggregate(results: RAGResult[], maxLength?: number): string;
    /**
     * 过滤结果集
     * @param results RAG结果数组
     * @param minScore 最小分数阈值
     * @returns 过滤后的结果数组
     */
    static filterResults(results: RAGResult[], minScore: number): RAGResult[];
}
