import { parseToolArguments } from '../../../utils/toolArguments.js';
/** Tool calls stream independently by index; IDs usually appear only in the first delta. */
export class OpenAIStreamAccumulator {
    constructor() {
        this.calls = new Map();
        this.reasoning = '';
    }
    applyReasoning(completion) {
        const choice = completion.choices.find(choice => choice.index === 0);
        if (choice && this.reasoning)
            choice.message.reasoning_content = this.reasoning;
    }
    push(chunk) {
        const choice = chunk.choices.find(choice => choice.index === 0);
        if (!choice)
            return;
        const delta = choice.delta;
        const content = [];
        if (delta.content)
            content.push({ type: 'text', text: delta.content });
        const reasoning = delta.reasoning_content || delta.reasoning || delta.thinking_content || delta.thinking || delta.think;
        if (reasoning) {
            this.reasoning += reasoning;
            content.push({ type: 'reasoning', text: reasoning });
        }
        const toolCalls = [];
        for (const part of delta.tool_calls || []) {
            const call = this.calls.get(part.index) || { id: '', name: '', arguments: '' };
            if (part.id)
                call.id = part.id;
            if (part.function?.name)
                call.name += part.function.name;
            if (part.function?.arguments)
                call.arguments += part.function.arguments;
            this.calls.set(part.index, call);
            if (!call.id || !call.name || call.emitted !== undefined)
                continue;
            try {
                const args = parseToolArguments(call.arguments, call.name);
                // An empty initial fragment is not a complete function call.
                if (!call.arguments.trim())
                    continue;
                toolCalls.push({ id: call.id, type: 'function', function: { name: call.name, arguments: args } });
                call.emitted = call.arguments;
            }
            catch { /* Wait for the remaining JSON fragments. */ }
        }
        if (!content.length && !toolCalls.length)
            return;
        return { id: chunk.id, model: chunk.model, delta: content, ...(toolCalls.length ? { toolCall: toolCalls } : {}) };
    }
}
