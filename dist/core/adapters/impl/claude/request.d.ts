import type Anthropic from '@anthropic-ai/sdk';
import type { IMessage, SendMessageOption, Tool } from '../../../types/index.js';
import './converter.js';
/** Build the actual SDK payload in one place, shared by tests and the adapter. */
export declare function buildClaudeRequest(histories: IMessage[], tools: Tool[], options: SendMessageOption): Anthropic.MessageCreateParamsNonStreaming;
