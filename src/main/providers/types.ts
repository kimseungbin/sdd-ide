/*
  The Provider seam (D8 / P7, BL-051). One neutral interface; concrete providers (Anthropic first)
  plug in behind it. The agent loop (agent.ts) drives tool execution against these types and never
  imports a vendor SDK — so provider choice never leaks into a feature, and adding a provider is a
  new file, not a rewrite.

  The seam carries tool-calling, not just text: `tools` in, `toolCalls` out, tool results back as a
  `tool` turn. That machinery is what `ask_user` (and later MCP spec mutations, BL-050) ride on.
*/
import type { ProviderId } from '../../shared/agent'

/** A tool offered to the model. `inputSchema` is a JSON Schema object. */
export interface ToolDef {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

/** A tool invocation the model requested. `input` is the parsed arguments object. */
export interface ToolCall {
  /** Provider-native call id — echoed back on the matching result. */
  id: string
  name: string
  input: unknown
}

/** The outcome of executing a tool, fed back into the next model turn. */
export interface ToolResult {
  callId: string
  content: string
}

/** The neutral transcript the loop maintains and each provider translates to its native shape. */
export type Turn =
  | { role: 'user'; content: string }
  | { role: 'assistant'; text: string; toolCalls: ToolCall[] }
  | { role: 'tool'; results: ToolResult[] }

export interface RunParams {
  system?: string
  turns: Turn[]
  tools: ToolDef[]
  /** Called with each incremental assistant text chunk as it streams. */
  onText: (delta: string) => void
  signal?: AbortSignal
}

/** One model turn's result: the final assistant text plus any tool calls it wants executed. */
export interface RunResult {
  text: string
  toolCalls: ToolCall[]
}

export interface Provider {
  id: ProviderId
  /**
   * Run the model once over the transcript, streaming text via `onText`. Returns the assistant
   * text and any tool calls. When `toolCalls` is non-empty the loop executes them, appends a
   * `tool` turn, and calls `run` again — the provider does not loop itself.
   */
  run(apiKey: string, params: RunParams): Promise<RunResult>
}
