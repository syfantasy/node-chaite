import { AbstractClient } from '../../clients.js';
import OpenAI from 'openai';
import { asyncLocalStorage, getKey } from '../../../utils/index.js';
import { getIntoChaiteConverter } from '../../../utils/converter.js';
import { buildDeepSeekRequest } from './request.js';
import { DeepSeekStreamAccumulator } from './stream.js';
import './converter.js';
import * as crypto from 'node:crypto';
import { VERSION } from '../../../index.js';
export class DeepSeekClient extends AbstractClient {
    constructor(options, context) {
        super(options, context);
        this.name = 'deepseek';
        if (!this.baseUrl) {
            this.baseUrl = 'https://api.deepseek.com';
        }
    }
    async _sendMessage(histories, apiKey, options) {
        const debug = this.context.chaite?.getGlobalConfig()?.getDebug();
        const client = new OpenAI({
            apiKey,
            baseURL: this.baseUrl || 'https://api.deepseek.com',
            defaultHeaders: {
                'x-request-from': 'node-chaite/' + VERSION,
            },
        });
        const request = buildDeepSeekRequest(histories, this.tools, options, this.baseUrl);
        if (debug)
            this.logger.debug(`deepseek request: ${JSON.stringify(request)}`);
        let chatCompletion;
        if (options.stream) {
            const stream = client.chat.completions.stream({ ...request, stream: true });
            const accumulator = new DeepSeekStreamAccumulator();
            for await (const chunk of stream) {
                const delta = accumulator.push(chunk);
                if (delta && options.onChunk)
                    await options.onChunk(delta);
            }
            chatCompletion = await stream.finalChatCompletion();
            accumulator.applyReasoning(chatCompletion);
        }
        else {
            chatCompletion = await client.chat.completions.create({ ...request, stream: false });
        }
        if (debug) {
            this.logger.info(`deepseek response: ${JSON.stringify(chatCompletion)}`);
        }
        const id = crypto.randomUUID();
        const toChaiteConverter = getIntoChaiteConverter('deepseek');
        const contents = chatCompletion.choices
            .map(ch => ch.message)
            .map(toChaiteConverter)
            .filter(ch => ch.content && ch.content.length > 0)
            .map(ch => ch.content)
            .reduce((a, b) => [...a, ...b], []);
        const result = {
            id,
            parentId: options.parentMessageId,
            role: 'assistant',
            content: contents,
            toolCalls: chatCompletion.choices
                .map(ch => ch.message)
                .map(toChaiteConverter)
                .filter(ch => ch.toolCalls)
                .map(ch => ch.toolCalls)
                .reduce((a, b) => [...a, ...b], []),
        };
        const usage = {
            promptTokens: chatCompletion.usage?.prompt_tokens,
            completionTokens: chatCompletion.usage?.completion_tokens,
            totalTokens: chatCompletion.usage?.total_tokens,
            cachedTokens: chatCompletion.usage?.prompt_tokens_details?.cached_tokens,
            reasoningTokens: chatCompletion.usage?.completion_tokens_details?.reasoning_tokens,
        };
        return {
            ...result,
            usage,
            rawRequest: request,
            rawResponse: chatCompletion,
        };
    }
    async getEmbedding(text, options) {
        return asyncLocalStorage.run(this.context, async () => {
            const apiKey = await getKey(this.apiKey, this.multipleKeyStrategy);
            const client = new OpenAI({
                apiKey,
                baseURL: this.baseUrl || 'https://api.deepseek.com',
            });
            const embeddings = await client.embeddings.create({
                model: options.model,
                input: text,
            });
            return {
                embeddings: embeddings.data.map(d => d.embedding),
            };
        });
    }
}
