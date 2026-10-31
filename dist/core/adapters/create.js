import { OpenAIClient } from './impl/openai/OpenAIClient.js';
import { ClaudeClient } from './impl/claude/ClaudeClient.js';
import { GeminiClient } from './impl/gemini/GeminiClient.js';
export function createClient(name, options, context) {
    switch (name) {
        case 'openai': {
            return new OpenAIClient(options, context);
        }
        case 'claude': {
            return new ClaudeClient(options, context);
        }
        case 'gemini': {
            return new GeminiClient(options, context);
        }
    }
}
