import type OpenAI from 'openai';
import type { IMessage, SendMessageOption, Tool } from '../../../types/index.js';
import './converter.js';
export type DeepSeekRequest = OpenAI.ChatCompletionCreateParamsNonStreaming & {
    reasoning_effort?: 'none' | 'low' | 'high' | 'max';
    thinking?: {
        type: 'enabled' | 'disabled';
    };
    [key: string]: any;
};
export declare function buildDeepSeekRequest(histories: IMessage[], tools: Tool[], options: SendMessageOption, baseUrl?: string): DeepSeekRequest;
