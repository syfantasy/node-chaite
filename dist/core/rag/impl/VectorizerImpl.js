export class VectorizerImpl {
    constructor(client, model, dimensions) {
        this.client = client;
        this.model = model;
        this.dimensions = dimensions;
    }
    async textToVector(text) {
        const embeddingResult = await this.client.getEmbedding(text, {
            model: this.model, dimensions: this.dimensions,
        });
        return embeddingResult.embeddings[0];
    }
    async batchTextToVector(texts) {
        const embeddingResult = await this.client.getEmbedding(texts, {
            model: this.model, dimensions: this.dimensions,
        });
        return embeddingResult.embeddings;
    }
}
