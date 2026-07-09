/*
  AnthropicProvider — the first concrete Provider behind the seam (types.ts). The ONLY file that
  imports the Anthropic SDK or knows a Claude model id; the rest of the app stays provider-neutral
  (BL-051). Streams text and translates the neutral transcript ↔ Anthropic's content-block shape.

  Thinking is disabled for this first cut: adaptive thinking + tool use requires replaying the
  model's thinking blocks verbatim on the follow-up turn, which our neutral transcript doesn't
  carry. Disabling avoids that entire failure class for the ask_user round-trip. Re-enabling
  adaptive thinking (preserving blocks as opaque provider-native content) is a scoped follow-up.
*/
import Anthropic from '@anthropic-ai/sdk'
import type { Provider, RunParams, RunResult, ToolCall, Turn } from './types'

/** Default model — the most capable tier (claude-api skill). Configurable per request later. */
const DEFAULT_MODEL = 'claude-opus-4-8'
const MAX_TOKENS = 8192

function toMessages(turns: Turn[]): Anthropic.MessageParam[] {
  return turns.map((turn): Anthropic.MessageParam => {
    if (turn.role === 'user') {
      return { role: 'user', content: turn.content }
    }
    if (turn.role === 'assistant') {
      const content: Anthropic.ContentBlockParam[] = []
      if (turn.text) content.push({ type: 'text', text: turn.text })
      for (const call of turn.toolCalls) {
        content.push({ type: 'tool_use', id: call.id, name: call.name, input: call.input })
      }
      return { role: 'assistant', content }
    }
    // Tool results are delivered back as a user turn of tool_result blocks.
    return {
      role: 'user',
      content: turn.results.map((result) => ({
        type: 'tool_result',
        tool_use_id: result.callId,
        content: result.content,
      })),
    }
  })
}

export const anthropicProvider: Provider = {
  id: 'anthropic',
  async run(apiKey: string, params: RunParams): Promise<RunResult> {
    const client = new Anthropic({ apiKey })
    const tools: Anthropic.Tool[] = params.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
    }))

    const stream = client.messages.stream(
      {
        model: DEFAULT_MODEL,
        max_tokens: MAX_TOKENS,
        thinking: { type: 'disabled' },
        ...(params.system ? { system: params.system } : {}),
        ...(tools.length > 0 ? { tools } : {}),
        messages: toMessages(params.turns),
      },
      params.signal ? { signal: params.signal } : undefined,
    )

    // Live text for the UI; the returned text/toolCalls feed the transcript.
    stream.on('text', (delta) => params.onText(delta))
    const message = await stream.finalMessage()

    let text = ''
    const toolCalls: ToolCall[] = []
    for (const block of message.content) {
      if (block.type === 'text') text += block.text
      else if (block.type === 'tool_use') {
        toolCalls.push({ id: block.id, name: block.name, input: block.input })
      }
    }
    return { text, toolCalls }
  },
}
