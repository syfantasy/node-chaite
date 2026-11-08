import {
  OpenAICompatibleMessageParam,
  registerFromChaiteConverter,
  registerFromChaiteToolConverter,
  registerIntoChaiteConverter,
} from '../../../utils/converter.js'
import type {
  AssistantMessage, AudioContent, DeveloperMessage, ImageContent, IMessage, MessageContent,
  ProviderContextContent, ReasoningContent, ReasoningPart, SystemMessage, TextContent, ToolCall,
  ToolCallResultMessage, UserMessage,
} from '../../../types/index.js'
import type OpenAI from 'openai'
import { parseInlineImage } from '../../../utils/imageData.js'
import { parseToolArguments } from '../../../utils/toolArguments.js'

registerFromChaiteConverter<OpenAI.ChatCompletionMessageParam | OpenAI.ChatCompletionMessageParam[]>('deepseek', (source: IMessage) => {
  switch (source.role) {
  case 'assistant': {
    const msg = source as AssistantMessage
    const text = msg.content.filter((part): part is TextContent => part.type === 'text').map(part => part.text).join('')
    const context = msg.content.find(part => part.type === 'provider_context' && (part as ProviderContextContent).provider === 'deepseek') as ProviderContextContent | undefined
    const reasoningText = msg.content.find(part => part.type === 'reasoning') as ReasoningContent | undefined
    const reasoningContent = typeof context?.data?.reasoning_content === 'string'
      ? context.data.reasoning_content
      : reasoningText?.text

    return {
      role: 'assistant',
      content: text || '',
      ...(reasoningContent ? { reasoning_content: reasoningContent } : {}),
      ...(msg.toolCalls?.length ? { tool_calls: msg.toolCalls.map(call => ({
        id: call.id,
        type: 'function',
        function: {
          name: call.function.name,
          arguments: JSON.stringify(parseToolArguments(call.function.arguments, call.function.name)),
        },
      })) } : {}),
    } as OpenAI.ChatCompletionAssistantMessageParam
  }
  case 'user': {
    const parts: OpenAI.ChatCompletionContentPart[] = []
    for (const part of (source as UserMessage).content) {
      if (part.type === 'text' && part.text) parts.push({ type: 'text', text: part.text })
      else if (part.type === 'image' && part.image) {
        let url = part.image
        if (!/^https?:\/\//i.test(url)) {
          const { data, mimeType } = parseInlineImage(url, part.mimeType)
          url = `data:${mimeType};base64,${data}`
        }
        parts.push({ type: 'image_url', image_url: { url } })
      }
    }
    // If only text and single part, simplify to string content
    if (parts.length === 1 && parts[0].type === 'text') {
      return { role: 'user', content: parts[0].text }
    }
    return { role: 'user', content: parts.length > 0 ? parts : '' }
  }
  case 'tool': return (source as ToolCallResultMessage).content.map(result => {
    if (!result.tool_call_id) throw new Error('DeepSeek 工具结果缺少 tool_call_id')
    return { role: 'tool', tool_call_id: result.tool_call_id, content: result.content ?? '' } as OpenAI.ChatCompletionToolMessageParam
  })
  case 'system':
  case 'developer': return {
    role: 'system',
    content: source.content.filter((part): part is TextContent => part.type === 'text').map(part => part.text).join('\n'),
  }
  default: throw new Error(`DeepSeek 消息转换不支持 role=${source.role}`)
  }
})

function extractReasoning(part: ReasoningPart) {
  return part.reasoning_content || part.reasoning || part.thinking_content || part.thinking || part.think
}

registerIntoChaiteConverter<OpenAICompatibleMessageParam>('deepseek', msg => {
  switch (msg.role) {
  case 'assistant': {
    const content: MessageContent[] = []
    if (typeof msg.content === 'string' && msg.content) {
      content.push({ type: 'text', text: msg.content } as TextContent)
    } else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        const text = part.type === 'text' ? part.text : part.refusal
        if (text) content.push({ type: 'text', text } as TextContent)
      }
    }
    if (!content.length && msg.refusal) content.push({ type: 'text', text: msg.refusal } as TextContent)
    const reasoning = extractReasoning(msg)
    if (reasoning) {
      content.push({ type: 'reasoning', text: reasoning } as ReasoningContent)
    }
    if (typeof msg.reasoning_content === 'string' && msg.reasoning_content) {
      content.push({
        type: 'provider_context',
        provider: 'deepseek',
        data: { reasoning_content: msg.reasoning_content },
      } as ProviderContextContent)
    }
    const toolCalls: ToolCall[] = []
    for (const call of msg.tool_calls || []) {
      if (call.type !== 'function') continue
      toolCalls.push({
        id: call.id,
        type: 'function',
        function: {
          name: call.function.name,
          arguments: parseToolArguments(call.function.arguments, call.function.name) as ToolCall['function']['arguments'],
        },
      })
    }
    return { role: 'assistant', content, toolCalls: toolCalls.length ? toolCalls : undefined } as AssistantMessage
  }
  case 'user': {
    const content: UserMessage['content'] = []
    if (typeof msg.content === 'string') content.push({ type: 'text', text: msg.content })
    else for (const part of msg.content || []) {
      if (part.type === 'image_url') content.push({ type: 'image', image: part.image_url.url })
      else if (part.type === 'text') content.push({ type: 'text', text: part.text })
    }
    return { role: 'user', content } as UserMessage
  }
  case 'system':
  case 'developer': return {
    role: 'system',
    content: typeof msg.content === 'string' ? [{ type: 'text', text: msg.content }] : msg.content?.map(part => ({ type: 'text', text: part.text })) || [],
  } as SystemMessage
  case 'tool': return {
    role: 'tool',
    content: [{ type: 'tool', tool_call_id: msg.tool_call_id, content: typeof msg.content === 'string' ? msg.content : msg.content.map(part => part.text).join('') }],
  } as ToolCallResultMessage
  default: throw new Error('DeepSeek 不支持此消息类型')
  }
})

registerFromChaiteToolConverter<OpenAI.ChatCompletionTool>('deepseek', tool => ({
  type: 'function',
  function: {
    name: tool.function.name,
    description: tool.function.description,
    parameters: tool.function.parameters as unknown as OpenAI.FunctionParameters,
  },
}))
