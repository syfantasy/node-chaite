import type OpenAI from 'openai';
import type { ModelResponseChunk } from '../../../types/index.js';
export declare class DeepSeekStreamAccumulator {
    private calls;
    private reasoning;
    applyReasoning(completion: OpenAI.ChatCompletion): void;
    push(chunk: OpenAI.ChatCompletionChunk): ModelResponseChunk | undefined;
}
