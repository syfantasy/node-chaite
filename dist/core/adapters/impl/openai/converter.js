import { registerFromChaiteConverter, registerFromChaiteToolConverter, registerIntoChaiteConverter, } from '../../../utils/converter.js';
import { parseInlineImage } from '../../../utils/imageData.js';
import { parseToolArguments } from '../../../utils/toolArguments.js';
registerFromChaiteConverter('openai', (source) => {
    switch (source.role) {
        case 'assistant': {
            const msg = source;
            // Keep the string form used by compatible servers, without leaking reasoning into the answer.
            const text = msg.content.filter((part) => part.type === 'text').map(part => part.text).join('');
            const context = msg.content.find(part => part.type === 'provider_context' && part.provider === 'openai');
            return {
                role: 'assistant', content: text || null,
                ...(typeof context?.data.reasoning_content === 'string' ? { reasoning_content: context.data.reasoning_content } : {}),
                ...(msg.toolCalls?.length ? { tool_calls: msg.toolCalls.map(call => ({
                        id: call.id, type: 'function', function: { name: call.function.name, arguments: JSON.stringify(parseToolArguments(call.function.arguments, call.function.name)) },
                    })) } : {}),
            };
        }
        case 'user': {
            const parts = [];
            for (const part of source.content) {
                if (part.type === 'text' && part.text)
                    parts.push({ type: 'text', text: part.text });
                else if (part.type === 'audio' && part.data)
                    parts.push({ type: 'input_audio', input_audio: { data: part.data, format: part.format } });
                else if (part.type === 'image' && part.image) {
                    let url = part.image;
                    if (!/^https?:\/\//i.test(url)) {
                        const { data, mimeType } = parseInlineImage(url, part.mimeType);
                        url = `data:${mimeType};base64,${data}`;
                    }
                    parts.push({ type: 'image_url', image_url: { url } });
                }
            }
            return { role: 'user', content: parts };
        }
        case 'tool': return source.content.map(result => {
            if (!result.tool_call_id)
                throw new Error('OpenAI 工具结果缺少 tool_call_id');
            return { role: 'tool', tool_call_id: result.tool_call_id, content: result.content ?? '' };
        });
        case 'system':
        case 'developer': return {
            role: source.role,
            content: source.content.filter((part) => part.type === 'text').map(part => part.text).join('\n'),
        };
        default: throw new Error(`OpenAI 消息转换不支持 role=${source.role}`);
    }
});
function reasoningText(part) {
    return part.reasoning_content || part.reasoning || part.thinking_content || part.thinking || part.think;
}
registerIntoChaiteConverter('openai', msg => {
    switch (msg.role) {
        case 'assistant': {
            const content = [];
            if (typeof msg.content === 'string' && msg.content)
                content.push({ type: 'text', text: msg.content });
            else if (Array.isArray(msg.content)) {
                for (const part of msg.content) {
                    const text = part.type === 'text' ? part.text : part.refusal;
                    if (text)
                        content.push({ type: 'text', text });
                }
            }
            if (!content.length && msg.refusal)
                content.push({ type: 'text', text: msg.refusal });
            const reasoning = reasoningText(msg);
            if (reasoning)
                content.push({ type: 'reasoning', text: reasoning });
            if (typeof msg.reasoning_content === 'string')
                content.push({ type: 'provider_context', provider: 'openai', data: { reasoning_content: msg.reasoning_content } });
            const toolCalls = [];
            for (const call of msg.tool_calls || []) {
                if (call.type !== 'function')
                    throw new Error('当前 OpenAI 适配器仅支持 function 工具调用');
                toolCalls.push({ id: call.id, type: 'function', function: { name: call.function.name, arguments: parseToolArguments(call.function.arguments, call.function.name) } });
            }
            return { role: 'assistant', content, toolCalls: toolCalls.length ? toolCalls : undefined };
        }
        case 'user': {
            const content = [];
            if (typeof msg.content === 'string')
                content.push({ type: 'text', text: msg.content });
            else
                for (const part of msg.content || []) {
                    if (part.type === 'image_url')
                        content.push({ type: 'image', image: part.image_url.url });
                    else if (part.type === 'text')
                        content.push({ type: 'text', text: part.text });
                    else if (part.type === 'input_audio')
                        content.push({ type: 'audio', data: part.input_audio.data, format: part.input_audio.format });
                }
            return { role: 'user', content };
        }
        case 'system':
        case 'developer': return {
            role: msg.role,
            content: typeof msg.content === 'string' ? [{ type: 'text', text: msg.content }] : msg.content?.map(part => ({ type: 'text', text: part.text })) || [],
        };
        case 'tool': return {
            role: 'tool',
            content: [{ type: 'tool', tool_call_id: msg.tool_call_id, content: typeof msg.content === 'string' ? msg.content : msg.content.map(part => part.text).join('') }],
        };
        default: throw new Error('OpenAI 不支持此消息类型');
    }
});
registerFromChaiteToolConverter('openai', tool => ({
    type: 'function', function: { name: tool.function.name, description: tool.function.description, parameters: tool.function.parameters },
}));
