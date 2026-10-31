import { registerFromChaiteConverter, registerFromChaiteToolConverter, registerIntoChaiteConverter } from '../../../utils/converter.js';
import { randomUUID } from 'node:crypto';
import { parseInlineImage } from '../../../utils/imageData.js';
import { parseToolArguments } from '../../../utils/toolArguments.js';
function imagePart(image) {
    if (/^(?:https?:\/\/|gs:\/\/)/i.test(image.image))
        return { fileData: { fileUri: image.image, mimeType: image.mimeType || 'image/jpeg' } };
    return { inlineData: parseInlineImage(image.image, image.mimeType) };
}
registerFromChaiteConverter('gemini', (source) => {
    switch (source.role) {
        case 'assistant': {
            const msg = source;
            const parts = [];
            const snapshot = msg.content.find(part => part.type === 'provider_context' && part.provider === 'gemini' && Array.isArray(part.data.parts));
            const emitted = new Set();
            const appendCall = (call, original = {}) => {
                const functionCall = { ...original.functionCall, name: call.function.name, args: parseToolArguments(call.function.arguments, call.function.name), ...(call.providerCallId !== null ? { id: call.providerCallId || call.id } : {}) };
                if (call.providerCallId === null)
                    delete functionCall.id;
                parts.push({ ...original, functionCall, ...(call.thoughtSignature ? { thoughtSignature: call.thoughtSignature } : {}) });
                emitted.add(call.id);
            };
            if (snapshot) {
                const texts = msg.content.filter((part) => part.type === 'text');
                const images = msg.content.filter((part) => part.type === 'image');
                const ids = snapshot.data.functionCallIds || {};
                let textIndex = 0;
                let imageIndex = 0;
                const originalParts = snapshot.data.parts;
                originalParts.forEach((part, index) => {
                    if (part.functionCall) {
                        const call = msg.toolCalls?.find(call => call.id === (ids[index] || part.functionCall?.id));
                        if (call)
                            appendCall(call, part);
                    }
                    else if (part.text !== undefined && !part.thought) {
                        const text = texts[textIndex++];
                        if (text)
                            parts.push({ ...part, text: text.text });
                    }
                    else if (part.inlineData?.data) {
                        const image = images[imageIndex++];
                        if (image)
                            parts.push({ ...part, ...imagePart(image) });
                    }
                    else
                        parts.push(part);
                });
                for (; textIndex < texts.length; textIndex++)
                    parts.push({ text: texts[textIndex].text });
                for (; imageIndex < images.length; imageIndex++)
                    parts.push(imagePart(images[imageIndex]));
            }
            else {
                // Compatibility with history saved before whole-turn snapshots existed.
                for (const part of msg.content) {
                    if (part.type === 'text' || (part.type === 'reasoning' && part.thoughtSignature)) {
                        parts.push({ text: part.text, ...(part.type === 'reasoning' ? { thought: true } : {}), ...(part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : {}) });
                    }
                    else if (part.type === 'image')
                        parts.push({ ...imagePart(part), ...(part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : {}) });
                    else if (part.type === 'provider_context' && part.provider === 'gemini')
                        parts.push(part.data);
                }
            }
            for (const call of msg.toolCalls || [])
                if (!emitted.has(call.id))
                    appendCall(call);
            return { role: 'model', parts };
        }
        case 'user': {
            const parts = [];
            for (const part of source.content) {
                if (part.type === 'text' && part.text.trim())
                    parts.push({ text: part.text });
                else if (part.type === 'image' && part.image)
                    parts.push(imagePart(part));
                else if (part.type === 'audio' && part.data)
                    parts.push({ inlineData: { data: part.data, mimeType: part.format === 'wav' ? 'audio/wav' : 'audio/mpeg' } });
            }
            return { role: 'user', parts };
        }
        case 'tool': return {
            role: 'user',
            parts: source.content.map(result => {
                if (!result.name)
                    throw new Error('Gemini 工具结果缺少 name');
                return { functionResponse: {
                        ...(result.providerCallId !== null && (result.providerCallId || result.tool_call_id) ? { id: result.providerCallId || result.tool_call_id } : {}),
                        name: result.name,
                        response: { name: result.name, content: result.content },
                    } };
            }),
        };
        default: throw new Error(`Gemini 消息转换不支持 role=${source.role}`);
    }
});
registerIntoChaiteConverter('gemini', msg => {
    const content = [];
    const toolCalls = [];
    const parts = msg.candidates?.[0]?.content?.parts || [];
    const ids = {};
    parts.forEach((part, index) => {
        if (part.text !== undefined)
            content.push({ type: part.thought ? 'reasoning' : 'text', text: part.text, thoughtSignature: part.thoughtSignature });
        if (part.inlineData?.data)
            content.push({ type: 'image', image: part.inlineData.data, mimeType: part.inlineData.mimeType, thoughtSignature: part.thoughtSignature });
        if (part.functionCall) {
            const id = part.functionCall.id || randomUUID();
            ids[index] = id;
            toolCalls.push({ id, type: 'function', providerCallId: part.functionCall.id || null,
                function: { name: part.functionCall.name || '', arguments: parseToolArguments(part.functionCall.args, part.functionCall.name) },
                thoughtSignature: part.thoughtSignature });
        }
    });
    // Retain all parts, including empty signed text and interleaved server/function calls.
    if (parts.length)
        content.push({ type: 'provider_context', provider: 'gemini', data: { parts, functionCallIds: ids } });
    return { role: 'assistant', content, toolCalls: toolCalls.length ? toolCalls : undefined };
});
registerFromChaiteToolConverter('gemini', tool => ({
    name: tool.function.name, description: tool.function.description,
    parametersJsonSchema: tool.function.parameters,
}));
