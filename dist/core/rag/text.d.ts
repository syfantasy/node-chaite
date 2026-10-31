export declare class TextProcessor {
    private static readonly punctuationRegex;
    private static readonly stopWords;
    /**
     * 将文本分割成小段落
     * @param text 输入的长文本
     * @param maxLength 每个段落的最大长度
     * @returns 分割后的段落数组
     */
    static splitIntoChunks(text: string, maxLength: number): string[];
    /**
     * 清理和标准化文本
     * @param text 输入文本
     * @returns 清理后的文本
     */
    static cleanText(text: string): string;
    /**
     * 简单的分词（按空格分割英文，按字符分割中文）
     * @param text 输入文本
     * @returns 分词后的数组
     */
    static tokenize(text: string): string[];
    /**
     * 从文本中移除停用词
     * @param text 输入文本
     * @returns 移除停用词后的文本
     */
    static removeStopWords(text: string): string;
    /**
     * 提取文本中的关键词（基于简单频率）
     * @param text 输入文本
     * @param topN 返回的关键词数量
     * @returns 关键词数组
     */
    static extractKeywords(text: string, topN?: number): string[];
    /**
     * 计算两个文本之间的简单相似度
     * @param text1 第一个文本
     * @param text2 第二个文本
     * @returns 相似度分数（0-1之间）
     */
    static simpleSimilarity(text1: string, text2: string): number;
}
