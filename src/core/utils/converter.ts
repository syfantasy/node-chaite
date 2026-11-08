import { ClientType, IMessage, ReasoningPart, Tool } from '../types/index.js'
import { Content, FunctionDeclaration } from '@google/genai'
// import type { Anthropic.MessageParam, ToolUnion } from '@anthropic-ai/sdk/src/resources'
type IntoChaiteConverter<T> = (source: T) => IMessage;
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GenerateContentResponse } from '@google/genai'

class IntoChaiteConverterEntry {
  openai: IntoChaiteConverter<OpenAI.ChatCompletionMessageParam & ReasoningPart>
  gemini: IntoChaiteConverter<GenerateContentResponse>
  claude: IntoChaiteConverter<Anthropic.Message>
  deepseek: IntoChaiteConverter<OpenAI.ChatCompletionMessageParam & ReasoningPart>
}

const converters = new IntoChaiteConverterEntry()

export function registerIntoChaiteConverter<T>(
  _clientType: ClientType,
  converter: IntoChaiteConverter<T>,
) {
  switch (_clientType) {
  case 'openai': {
    converters.openai = converter as unknown as IntoChaiteConverter<OpenAICompatibleMessageParam>
    break
  }
  case 'gemini': {
    converters.gemini = converter as unknown as IntoChaiteConverter<GenerateContentResponse>
    break
  }
  case 'claude': {
    converters.claude = converter as unknown as IntoChaiteConverter<Anthropic.Message>
    break
  }
  case 'deepseek': {
    converters.deepseek = converter as unknown as IntoChaiteConverter<OpenAICompatibleMessageParam>
    break
  }
  }

}

export function getIntoChaiteConverter(_clientType: 'openai'): IntoChaiteConverter<OpenAICompatibleMessageParam>;
export function getIntoChaiteConverter(_clientType: 'deepseek'): IntoChaiteConverter<OpenAICompatibleMessageParam>;
export function getIntoChaiteConverter(_clientType: 'gemini'): IntoChaiteConverter<GenerateContentResponse>;
export function getIntoChaiteConverter(_clientType: 'claude'): IntoChaiteConverter<Anthropic.Message>;
export function getIntoChaiteConverter(_clientType: ClientType): IntoChaiteConverter<OpenAICompatibleMessageParam> | IntoChaiteConverter<GenerateContentResponse> | IntoChaiteConverter<Anthropic.Message> {
  switch (_clientType) {
  case 'openai': {
    return converters.openai
  }
  case 'gemini': {
    return converters.gemini
  }
  case 'claude': {
    return converters.claude
  }
  case 'deepseek': {
    return converters.deepseek
  }
  }
}


type FromChaiteConverter<T> = (source: IMessage) => T;
export type OpenAICompatibleMessageParam = OpenAI.ChatCompletionMessageParam & ReasoningPart

class FromChaiteConverterEntry {
  openai: FromChaiteConverter<OpenAICompatibleMessageParam | OpenAICompatibleMessageParam[]>
  gemini: FromChaiteConverter<Content>
  claude: FromChaiteConverter<Anthropic.MessageParam>
  deepseek: FromChaiteConverter<OpenAICompatibleMessageParam | OpenAICompatibleMessageParam[]>
}

const fromConverters = new FromChaiteConverterEntry()

export function registerFromChaiteConverter<T>(
  _clientType: ClientType,
  converter: FromChaiteConverter<T>,
) {
  switch (_clientType) {
  case 'openai': {
    fromConverters.openai = converter as unknown as FromChaiteConverter<OpenAICompatibleMessageParam | OpenAICompatibleMessageParam[]>
    break
  }
  case 'gemini': {
    fromConverters.gemini = converter as unknown as FromChaiteConverter<Content>
    break
  }
  case 'claude': {
    fromConverters.claude = converter as unknown as FromChaiteConverter<Anthropic.MessageParam>
    break
  }
  case 'deepseek': {
    fromConverters.deepseek = converter as unknown as FromChaiteConverter<OpenAICompatibleMessageParam | OpenAICompatibleMessageParam[]>
    break
  }
  }
}


export function getFromChaiteConverter(_clientType: 'openai'): FromChaiteConverter<OpenAICompatibleMessageParam | OpenAICompatibleMessageParam[]>;
export function getFromChaiteConverter(_clientType: 'deepseek'): FromChaiteConverter<OpenAICompatibleMessageParam | OpenAICompatibleMessageParam[]>;
export function getFromChaiteConverter(_clientType: 'gemini'): FromChaiteConverter<Content>;
export function getFromChaiteConverter(_clientType: 'claude'): FromChaiteConverter<Anthropic.MessageParam>;
export function getFromChaiteConverter(_clientType: ClientType): FromChaiteConverter<OpenAICompatibleMessageParam | OpenAICompatibleMessageParam[]> | FromChaiteConverter<Content> | FromChaiteConverter<Anthropic.MessageParam> {
  switch (_clientType) {
  case 'openai': {
    return fromConverters.openai
  }
  case 'gemini': {
    return fromConverters.gemini
  }
  case 'claude': {
    return fromConverters.claude
  }
  case 'deepseek': {
    return fromConverters.deepseek
  }
  }
}


type FromChaiteToolConverter<T> = (source: Tool) => T;

class FromChaiteToolConverterEntry {
  openai: FromChaiteToolConverter<OpenAI.ChatCompletionTool>
  gemini: FromChaiteToolConverter<FunctionDeclaration>
  claude: FromChaiteToolConverter<Anthropic.ToolUnion>
  deepseek: FromChaiteToolConverter<OpenAI.ChatCompletionTool>
}

const fromToolConverters = new FromChaiteToolConverterEntry()

export function registerFromChaiteToolConverter<T>(
  _clientType: ClientType,
  converter: FromChaiteToolConverter<T>,
) {
  switch (_clientType) {
  case 'openai': {
    fromToolConverters.openai = converter as unknown as FromChaiteToolConverter<OpenAI.ChatCompletionTool>
    break
  }
  case 'gemini': {
    fromToolConverters.gemini = converter as unknown as FromChaiteToolConverter<FunctionDeclaration>
    break
  }
  case 'claude': {
    fromToolConverters.claude = converter as unknown as FromChaiteToolConverter<Anthropic.ToolUnion>
    break
  }
  case 'deepseek': {
    fromToolConverters.deepseek = converter as unknown as FromChaiteToolConverter<OpenAI.ChatCompletionTool>
    break
  }
  }

}


export function getFromChaiteToolConverter(_clientType: 'openai'): FromChaiteToolConverter<OpenAI.ChatCompletionTool>;
export function getFromChaiteToolConverter(_clientType: 'deepseek'): FromChaiteToolConverter<OpenAI.ChatCompletionTool>;
export function getFromChaiteToolConverter(_clientType: 'gemini'): FromChaiteToolConverter<FunctionDeclaration>;
export function getFromChaiteToolConverter(_clientType: 'claude'): FromChaiteToolConverter<Anthropic.ToolUnion>;
export function getFromChaiteToolConverter(_clientType: ClientType): FromChaiteToolConverter<OpenAI.ChatCompletionTool> | FromChaiteToolConverter<FunctionDeclaration> | FromChaiteToolConverter<Anthropic.ToolUnion> {
  switch (_clientType) {
  case 'openai': {
    return fromToolConverters.openai
  }
  case 'gemini': {
    return fromToolConverters.gemini
  }
  case 'claude': {
    return fromToolConverters.claude
  }
  case 'deepseek': {
    return fromToolConverters.deepseek
  }
  }
}

