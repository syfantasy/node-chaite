import { IClient, Vectorizer } from '../../types/index.js';
export declare class VectorizerImpl implements Vectorizer {
    private client;
    private model;
    private dimensions;
    constructor(client: IClient, model: string, dimensions: number);
    textToVector(text: string): Promise<number[]>;
    batchTextToVector(texts: string[]): Promise<number[][]>;
}
