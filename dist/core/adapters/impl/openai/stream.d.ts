import type OpenAI from 'openai';
import type { ModelResponseChunk } from '../../../types/index.js';
/** Tool calls stream independently by index; IDs usually appear only in the first delta. */
export declare class OpenAIStreamAccumulator {
    private calls;
    private reasoning;
    applyReasoning(completion: OpenAI.ChatCompletion): void;
    push(chunk: OpenAI.ChatCompletionChunk): ModelResponseChunk | undefined;
}
