import { AbstractClient } from '../../clients.js';
import { GoogleGenAI, } from '@google/genai';
import { getIntoChaiteConverter } from '../../../utils/converter.js';
import './converter.js';
import { asyncLocalStorage, getKey } from '../../../utils/index.js';
import * as crypto from 'node:crypto';
import { VERSION } from '../../../index.js';
import { buildGeminiRequest, geminiApiVersion } from './request.js';
const DEFAULT_TOOL_CALL_LIMIT = {
    maxConsecutiveCalls: 8,
    maxConsecutiveIdenticalCalls: 2,
};
export class GeminiClient extends AbstractClient {
    constructor(options, context) {
        super(options, context);
        this.name = 'gemini';
        const providedLimit = options?.toolCallLimit;
        const effectiveLimit = {
            ...DEFAULT_TOOL_CALL_LIMIT,
            ...(providedLimit || {}),
        };
        this.setToolCallLimitConfig(effectiveLimit);
    }
    async _sendMessage(histories, apiKey, options) {
        const debug = this.context.chaite.getGlobalConfig()?.getDebug();
        const { request: req, suppressedBuiltinTools, hasEffectiveBuiltinTools } = await buildGeminiRequest(histories, this.tools, options);
        const model = req.model;
        if (suppressedBuiltinTools) {
            this.logger.warn(`[GeminiClient] Gemini built-in tools were not combined with function tools for model "${model}"; tool combination requires Gemini 3/4. Existing function tools remain enabled.`);
        }
        const apiVersion = geminiApiVersion(this.baseUrl, hasEffectiveBuiltinTools);
        const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
                baseUrl: this.baseUrl || undefined,
                headers: {
                    'x-request-from': 'node-chaite/' + VERSION,
                },
                // GoogleGenAI defaults to v1beta. GCLI2API exposes its native Gemini
                // endpoint under /v1. Explicit version suffixes must never be duplicated.
                ...(apiVersion !== undefined ? { apiVersion } : {}),
            },
        });
        if (debug) {
            this.logger.debug(`gemini request: ${JSON.stringify(req)}`);
        }
        const intoChaiteConverter = getIntoChaiteConverter('gemini');
        let result;
        if (options.stream) {
            const stream = await ai.models.generateContentStream(req);
            const mergedParts = [];
            let lastChunk;
            let lastUsage;
            let lastFinishReason;
            let lastGrounding;
            let responseId;
            let modelVersion;
            for await (const chunk of stream) {
                lastChunk = chunk;
                if (chunk.responseId)
                    responseId = chunk.responseId;
                if (chunk.modelVersion)
                    modelVersion = chunk.modelVersion;
                if (chunk.usageMetadata)
                    lastUsage = chunk.usageMetadata;
                const cand = chunk.candidates?.[0];
                if (cand?.finishReason)
                    lastFinishReason = cand.finishReason;
                if (cand?.groundingMetadata)
                    lastGrounding = cand.groundingMetadata;
                const chunkParts = cand?.content?.parts || [];
                for (const part of chunkParts) {
                    const prev = mergedParts[mergedParts.length - 1];
                    // 合并连续的纯文本或纯思考分片（无 thoughtSignature 时），避免产生大量碎片 part
                    if (prev &&
                        part.text !== undefined &&
                        prev.text !== undefined &&
                        Boolean(part.thought) === Boolean(prev.thought) &&
                        !part.thoughtSignature &&
                        !prev.thoughtSignature &&
                        !part.functionCall &&
                        !prev.functionCall &&
                        !part.inlineData &&
                        !prev.inlineData) {
                        prev.text += part.text;
                    }
                    else {
                        mergedParts.push({ ...part });
                    }
                }
                if (options.onChunk && chunkParts.length > 0) {
                    const chunkMsg = intoChaiteConverter(chunk);
                    const delta = chunkMsg.content.filter(c => c.type !== 'provider_context');
                    if (delta.length > 0 || (chunkMsg.toolCalls && chunkMsg.toolCalls.length > 0)) {
                        await options.onChunk({
                            id: chunk.responseId,
                            model: chunk.modelVersion || model,
                            delta,
                            ...(chunkMsg.toolCalls && chunkMsg.toolCalls.length > 0 ? { toolCall: chunkMsg.toolCalls } : {}),
                        });
                    }
                }
            }
            result = {
                ...(lastChunk || {}),
                ...(responseId ? { responseId } : {}),
                ...(modelVersion ? { modelVersion } : {}),
                ...(lastUsage ? { usageMetadata: lastUsage } : {}),
                candidates: [
                    {
                        ...(lastChunk?.candidates?.[0] || {}),
                        content: { role: 'model', parts: mergedParts },
                        ...(lastFinishReason ? { finishReason: lastFinishReason } : {}),
                        ...(lastGrounding ? { groundingMetadata: lastGrounding } : {}),
                    },
                ],
            };
        }
        else {
            result = await ai.models.generateContent(req);
        }
        if (debug) {
            this.logger.info(`gemini response: ${JSON.stringify(result)}`);
        }
        const id = crypto.randomUUID();
        const iMessage = intoChaiteConverter(result);
        const rspToSave = {
            id,
            parentId: options.parentMessageId,
            role: 'assistant',
            content: iMessage.content,
            toolCalls: iMessage.toolCalls,
        };
        const usage = {
            promptTokens: result.usageMetadata?.promptTokenCount,
            completionTokens: result.usageMetadata?.candidatesTokenCount,
            totalTokens: result.usageMetadata?.totalTokenCount,
            cachedTokens: result.usageMetadata?.cachedContentTokenCount,
            reasoningTokens: result.usageMetadata?.thoughtsTokenCount,
        };
        return {
            ...rspToSave,
            usage,
            rawRequest: req,
            rawResponse: result,
        };
    }
    async getEmbedding(text, options) {
        return asyncLocalStorage.run(this.context, async () => {
            const apiKey = await getKey(this.apiKey, this.multipleKeyStrategy);
            const model = options.model || 'text-embedding-004';
            const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                    baseUrl: this.baseUrl || undefined,
                    ...(geminiApiVersion(this.baseUrl) !== undefined ? { apiVersion: geminiApiVersion(this.baseUrl) } : {}),
                    headers: {
                        'x-request-from': 'node-chaite/' + VERSION,
                    },
                },
            });
            function textToRequest(_text) {
                return { role: 'user', parts: [{ text: _text }] };
            }
            if (!Array.isArray(text)) {
                text = [text];
            }
            const batchEmbedContentsResponse = await ai.models.embedContent({
                model,
                contents: text.map(textToRequest),
            });
            return {
                embeddings: batchEmbedContentsResponse.embeddings?.map(em => em.values),
            };
        });
    }
}
