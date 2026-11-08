import { getFromChaiteConverter, getFromChaiteToolConverter } from '../../../utils/converter.js';
import { parseInlineImage } from '../../../utils/imageData.js';
import { buildGeminiTooling } from './tooling.js';
import './converter.js';
export function geminiApiVersion(baseUrl, builtinTools = false) {
    const url = baseUrl.replace(/\/+$/, '');
    if (/\/v1(?:alpha|beta)?$/i.test(url))
        return '';
    if (builtinTools && url && !/:\/\/(?:generativelanguage|[a-z0-9-]+-aiplatform)\.googleapis\.com(?:\/|$)/i.test(url))
        return 'v1';
    return undefined;
}
export function buildGeminiThinking(model, options) {
    const match = /gemini-(\d+)(?:[.-](\d+))?/i.exec(model);
    const major = Number(match?.[1] || 0);
    // 1. 提取显式指定的 includeThoughts
    const explicitIncludeThoughts = options.geminiIncludeThoughts ?? options.includeThoughts;
    const shouldInclude = explicitIncludeThoughts !== undefined
        ? Boolean(explicitIncludeThoughts)
        : Boolean(options.enableReasoning || options.isThinkingModel || options.showThinking);
    // 2. 提取 ThinkingLevel（优先专有 geminiThinkingLevel，其次通用 reasoningEffort）
    let level = options.geminiThinkingLevel || (options.enableReasoning ? options.reasoningEffort : undefined);
    if (!level && major >= 4 && (options.enableReasoning || explicitIncludeThoughts !== undefined)) {
        level = 'medium';
    }
    // 3. 如果显式关闭（level === 'off'）
    if (level === 'off') {
        if (explicitIncludeThoughts === false) {
            return { includeThoughts: false };
        }
        return undefined;
    }
    // 4. 如果没有开启专有 includeThoughts，且没有指定专有 geminiThinkingLevel，且通用 enableReasoning 为 false/undefined
    if (explicitIncludeThoughts === undefined && !options.geminiThinkingLevel && !options.enableReasoning && !options.isThinkingModel) {
        return undefined;
    }
    // 5. 构建 ThinkingConfig
    const thinkingConfig = {};
    if (level && level !== 'off') {
        thinkingConfig.thinkingLevel = level.toUpperCase();
    }
    if (explicitIncludeThoughts !== undefined || options.enableReasoning || options.showThinking) {
        thinkingConfig.includeThoughts = shouldInclude;
    }
    return Object.keys(thinkingConfig).length > 0 ? thinkingConfig : undefined;
}
/** Remote public images must be downloaded, not passed as base64 strings. */
async function prepareImages(message) {
    if (!message.content.some(part => part.type === 'image' && /^https?:\/\//i.test(part.image)))
        return message;
    const content = [];
    for (const part of message.content) {
        if (part.type === 'image' && /^https?:\/\//i.test(part.image) && !/^https:\/\/generativelanguage\.googleapis\.com\/.*files\//i.test(part.image)) {
            const response = await fetch(part.image, { signal: AbortSignal.timeout(30000) });
            if (!response.ok)
                throw new Error(`获取 Gemini 图片失败：${response.status}`);
            const parsed = parseInlineImage(Buffer.from(await response.arrayBuffer()).toString('base64'), response.headers.get('content-type') || part.mimeType);
            content.push({ ...part, image: parsed.data, mimeType: parsed.mimeType });
        }
        else
            content.push(part);
    }
    return { ...message, content };
}
export async function buildGeminiRequest(histories, tools, options) {
    const model = options.model || 'gemini-2.0-flash-001';
    const converter = getFromChaiteConverter('gemini');
    const contents = [];
    const system = options.systemOverride ? [options.systemOverride] : [];
    for (const history of histories) {
        if (history.role === 'system' || history.role === 'developer') {
            system.push(...history.content.filter((part) => part.type === 'text').map(part => part.text));
        }
        else {
            const converted = converter(await prepareImages(history));
            if (converted.parts?.length)
                contents.push(converted);
        }
    }
    if (!contents.length)
        throw new Error('Gemini 请求没有可发送的消息');
    const tooling = buildGeminiTooling(tools.map(getFromChaiteToolConverter('gemini')), options.geminiBuiltinTools || [], options.toolChoice, model);
    const validSafetySettings = options.safetySettings
        ?.filter(setting => setting && setting.category && setting.category !== 'HARM_CATEGORY_UNSPECIFIED')
        ?.map(setting => {
        const copy = { ...setting };
        delete copy.method;
        return copy;
    });
    const request = {
        model, contents,
        config: {
            temperature: options.temperature, maxOutputTokens: options.maxToken,
            thinkingConfig: buildGeminiThinking(model, options),
            tools: tooling.tools, ...(tooling.toolConfig ? { toolConfig: tooling.toolConfig } : {}),
            responseModalities: options.responseModalities,
            ...(validSafetySettings && validSafetySettings.length > 0 ? { safetySettings: validSafetySettings } : {}),
            ...(system.length ? { systemInstruction: system.join('\n\n') } : {}),
        },
    };
    return { request, ...tooling };
}
