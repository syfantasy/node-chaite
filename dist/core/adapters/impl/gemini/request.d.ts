import type { GenerateContentParameters, ThinkingConfig } from '@google/genai';
import type { IMessage, SendMessageOption, Tool } from '../../../types/index.js';
import './converter.js';
export declare function geminiApiVersion(baseUrl: string, builtinTools?: boolean): string | undefined;
export declare function buildGeminiThinking(model: string, options: SendMessageOption): ThinkingConfig | undefined;
export declare function buildGeminiRequest(histories: IMessage[], tools: Tool[], options: SendMessageOption): Promise<{
    tools?: import("@google/genai").Tool[];
    toolConfig?: import("@google/genai").ToolConfig;
    suppressedBuiltinTools: boolean;
    hasEffectiveBuiltinTools: boolean;
    request: GenerateContentParameters;
}>;
