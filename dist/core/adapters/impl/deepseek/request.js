import { getFromChaiteConverter, getFromChaiteToolConverter } from '../../../utils/converter.js';
import './converter.js';
export function buildDeepSeekRequest(histories, tools, options, baseUrl = '') {
    const model = options.model || 'deepseek-chat';
    const isReasonerModel = /deepseek-(?:reasoner|r1)/i.test(model);
    const isFlashModel = /flash/i.test(model);
    // Effort resolution: explicit deepseekReasoningEffort > generic reasoningEffort
    let effort = options.deepseekReasoningEffort || (options.enableReasoning || isReasonerModel ? options.reasoningEffort : undefined);
    const messages = [];
    if (options.systemOverride) {
        messages.push({ role: 'system', content: options.systemOverride });
    }
    const converter = getFromChaiteConverter('deepseek');
    for (const history of histories) {
        const converted = converter(history);
        for (const message of Array.isArray(converted) ? converted : [converted]) {
            if (Array.isArray(message.content) && message.content.length === 0)
                continue;
            if (message.role === 'assistant' && !message.content && !message.tool_calls?.length)
                continue;
            // For DeepSeek, ALWAYS preserve reasoning_content in assistant messages (required for multi-turn tool calling)
            messages.push(message);
        }
    }
    if (!messages.length) {
        throw new Error('DeepSeek 请求没有可发送的消息');
    }
    let toolChoice;
    switch (options.toolChoice?.type) {
        case 'specified': {
            const name = options.toolChoice.tools?.[0];
            if (!name || !tools.some(tool => tool.function.name === name)) {
                throw new Error('指定的 DeepSeek 工具必须在当前 tools 中存在');
            }
            toolChoice = { type: 'function', function: { name } };
            break;
        }
        case 'any': {
            if (!tools.length)
                throw new Error('toolChoice=any 至少需要一个可用工具');
            toolChoice = 'required';
            break;
        }
        case 'none':
            toolChoice = 'none';
            break;
        default:
            toolChoice = 'auto';
    }
    // Thinking toggles
    const thinkingConfig = {};
    if (effort) {
        thinkingConfig.reasoning_effort = effort;
    }
    if (options.enableReasoning !== undefined) {
        thinkingConfig.thinking = { type: options.enableReasoning ? 'enabled' : 'disabled' };
    }
    const customParams = options.customOptions || {};
    return {
        model,
        messages,
        ...(options.maxToken !== undefined ? { max_tokens: options.maxToken } : {}),
        // For pure reasoner models like deepseek-reasoner, temperature is fixed to 1 or ignored
        ...(!isReasonerModel && effort !== 'max' && options.temperature !== undefined ? { temperature: options.temperature } : {}),
        ...thinkingConfig,
        ...(tools.length && toolChoice !== 'none' ? {
            tools: tools.map(getFromChaiteToolConverter('deepseek')),
            tool_choice: toolChoice,
        } : {}),
        ...customParams,
    };
}
