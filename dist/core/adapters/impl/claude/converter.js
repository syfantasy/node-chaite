import { registerFromChaiteConverter, registerFromChaiteToolConverter, registerIntoChaiteConverter, } from '../../../utils/converter.js';
function toolInput(value) {
    const input = typeof value === 'string' ? JSON.parse(value) : value;
    if (!input || typeof input !== 'object' || Array.isArray(input))
        throw new Error('Claude 工具参数必须是 JSON 对象');
    return input;
}
function imageBlock(image, declaredMime) {
    if (/^https?:\/\//i.test(image))
        return { type: 'image', source: { type: 'url', url: image } };
    const match = /^data:([^;,]+);base64,(.*)$/is.exec(image);
    const data = (match?.[2] || image.replace(/^base64:\/\//i, '')).replace(/\s/g, '');
    const bytes = Buffer.from(data.slice(0, 32), 'base64');
    let mime = (match?.[1] || declaredMime || 'image/jpeg').split(';')[0].trim().toLowerCase();
    if (bytes[0] === 0xff && bytes[1] === 0xd8)
        mime = 'image/jpeg';
    else if (bytes.toString('ascii', 1, 4) === 'PNG')
        mime = 'image/png';
    else if (bytes.toString('ascii', 0, 3) === 'GIF')
        mime = 'image/gif';
    else if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP')
        mime = 'image/webp';
    if (mime === 'image/jpg')
        mime = 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mime))
        throw new Error(`Claude 不支持图片格式 ${mime}`);
    return { type: 'image', source: { type: 'base64', media_type: mime, data } };
}
registerFromChaiteConverter('claude', (source) => {
    switch (source.role) {
        case 'assistant': {
            const msg = source;
            const texts = msg.content.filter((part) => part.type === 'text');
            const snapshot = msg.content.find(part => part.type === 'provider_context' && part.provider === 'claude');
            const original = snapshot?.data.content;
            const blocks = [];
            const emittedTools = new Set();
            let textIndex = 0;
            const appendText = (metadata = {}) => {
                const text = texts[textIndex++]?.text;
                if (text?.trim())
                    blocks.push({ ...metadata, type: 'text', text });
            };
            const appendTool = (tool, metadata = {}) => {
                blocks.push({ ...metadata, type: 'tool_use', id: tool.id, name: tool.function.name, input: toolInput(tool.function.arguments) });
                emittedTools.add(tool.id);
            };
            if (Array.isArray(original)) {
                // Preserve every opaque block, signature, citation, and original block order.
                // Editable text/tool arguments still come from Chaite's current content.
                for (const block of original) {
                    if (block.type === 'text')
                        appendText(block);
                    else if (block.type === 'tool_use') {
                        const tool = msg.toolCalls?.find(call => call.id === block.id);
                        if (tool)
                            appendTool(tool, block);
                    }
                    else
                        blocks.push(block);
                }
            }
            while (textIndex < texts.length)
                appendText();
            for (const tool of msg.toolCalls || [])
                if (!emittedTools.has(tool.id))
                    appendTool(tool);
            return { role: 'assistant', content: blocks };
        }
        case 'user': {
            const content = [];
            for (const part of source.content) {
                if (part.type === 'text' && 'text' in part && typeof part.text === 'string' && part.text.trim())
                    content.push({ type: 'text', text: part.text });
                else if (part.type === 'image' && 'image' in part && typeof part.image === 'string' && part.image) {
                    content.push(imageBlock(part.image, 'mimeType' in part ? part.mimeType : undefined));
                }
                // Unsupported audio/video must not become null blocks in the API request.
            }
            return { role: 'user', content };
        }
        case 'tool': {
            const content = [];
            for (const result of source.content) {
                if (result.type !== 'tool' || !('tool_call_id' in result) || typeof result.tool_call_id !== 'string')
                    throw new Error('Claude 工具结果缺少 tool_call_id');
                content.push({ type: 'tool_result', tool_use_id: result.tool_call_id, content: 'content' in result ? String(result.content ?? '') : '' });
            }
            return { role: 'user', content };
        }
        default: throw new Error(`Claude 消息转换不支持 role=${source.role}`);
    }
});
registerIntoChaiteConverter('claude', msg => {
    const content = [];
    const toolCalls = [];
    for (const block of msg.content) {
        if (block.type === 'text')
            content.push({ type: 'text', text: block.text });
        else if (block.type === 'thinking' && block.thinking)
            content.push({ type: 'reasoning', text: block.thinking });
        else if (block.type === 'tool_use') {
            toolCalls.push({ id: block.id, type: 'function', function: { name: block.name, arguments: toolInput(block.input) } });
        }
    }
    // Even an empty thinking summary can carry a required encrypted signature.
    // Keep the raw payload opaque, rather than fabricating or concatenating signatures.
    if (msg.content.length)
        content.push({ type: 'provider_context', provider: 'claude', data: { content: msg.content } });
    return { role: 'assistant', content, toolCalls };
});
registerFromChaiteToolConverter('claude', tool => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: { ...tool.function.parameters, type: 'object', properties: tool.function.parameters?.properties || {} },
}));
