import { AbstractVectorDatabase } from '../vector.js';
/**
 * 使用Cloudflare的Vectorize数据库实现向量数据库
 * // todo
 */
export class CloudflareVectorDatabase extends AbstractVectorDatabase {
    async addVector(vector, text) {
        return Promise.resolve('');
    }
    async addVectors(vectors, texts) {
        return Promise.resolve([]);
    }
    async clear() {
        return Promise.resolve(undefined);
    }
    async count() {
        return Promise.resolve(0);
    }
    async deleteVector(id) {
        return Promise.resolve(false);
    }
    async getVector(id) {
        return Promise.resolve(null);
    }
    async search(queryVector, k) {
        return Promise.resolve([]);
    }
    async updateVector(id, newVector, newText) {
        return Promise.resolve(false);
    }
}
