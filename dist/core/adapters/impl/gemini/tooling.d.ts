import { FunctionDeclaration, Tool, ToolConfig } from '@google/genai';
import { SendMessageOption } from '../../../types/index.js';
export type GeminiBuiltinToolName = 'googleSearch' | 'googleMaps' | 'codeExecution' | 'urlContext';
export declare function isGemini3Model(model: string): boolean;
export declare function buildGeminiTooling(functionDeclarations: FunctionDeclaration[], builtinToolNames: GeminiBuiltinToolName[], toolChoice: SendMessageOption['toolChoice'], model: string): {
    tools?: Tool[];
    toolConfig?: ToolConfig;
    suppressedBuiltinTools: boolean;
    hasEffectiveBuiltinTools: boolean;
};
