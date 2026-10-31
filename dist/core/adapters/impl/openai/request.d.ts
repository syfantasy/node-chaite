import type OpenAI from 'openai';
import type { IMessage, SendMessageOption, Tool } from '../../../types/index.js';
import './converter.js';
export type OpenAIRequest = OpenAI.ChatCompletionCreateParamsNonStreaming & {
    thinking_budget_tokens?: number;
    thinking?: {
        type: 'enabled' | 'disabled';
    };
    [key: string]: any;
};
export declare function buildOpenAIRequest(histories: IMessage[], tools: Tool[], options: SendMessageOption, baseUrl?: string): OpenAIRequest;
