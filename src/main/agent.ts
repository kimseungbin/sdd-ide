/*
  The app-owned agent loop (BL-039 real backend). Provider-agnostic: it drives the tool-calling
  loop against the Provider seam (providers/) and never imports a vendor SDK. This is where the
  membrane / role gating (D7, BL-054) will later live; for now it runs the impl-session agent.

  Flow per send(): resolve the key (main-only, D8), run the provider over the transcript streaming
  text deltas to the renderer, and when the model calls `ask_user`, emit the question to the
  renderer and block until the human answers — then feed the choice back and continue.
*/
import { BrowserWindow, ipcMain } from 'electron'
import { IPC } from '../shared/ipc'
import type { AskUserAnswer, AskUserRequest, ChatMessage } from '../shared/agent'
import { getApiKey } from './credentials'
import { getProvider } from './providers'
import type { ToolDef, ToolResult, Turn } from './providers/types'

const PROVIDER = 'anthropic' as const

// Thinking is disabled in the provider for now, so steer toward direct answers explicitly.
const SYSTEM_PROMPT = [
  'You are the implementation-session agent inside a spec-driven development IDE.',
  'Help the developer read and reason about the code and the structured spec.',
  'When you need a decision, choice, or confirmation from the user, call the ask_user tool with a',
  'closed set of 2–4 options instead of asking in prose. Respond directly and concisely; do not',
  'include exploratory reasoning in your reply.',
].join(' ')

// The first app-owned tool — a structured question with a closed option set (the conversational
// form of the product thesis, D2). The provider translates this schema to its native tool format.
const ASK_USER_TOOL: ToolDef = {
  name: 'ask_user',
  description:
    'Ask the human a structured question with a closed set of options. Use whenever you need a ' +
    'decision, choice, or confirmation from the user rather than guessing or asking in prose.',
  inputSchema: {
    type: 'object',
    properties: {
      question: { type: 'string', description: 'The question to ask the user.' },
      header: { type: 'string', description: 'A short label for the question (≤ 12 chars).' },
      options: {
        type: 'array',
        description: 'The available choices (2–4).',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', description: 'The choice text shown to the user.' },
            description: { type: 'string', description: 'Optional one-line explanation.' },
          },
          required: ['label'],
        },
      },
      multiSelect: { type: 'boolean', description: 'Allow selecting more than one option.' },
    },
    required: ['question', 'options'],
  },
}

interface AskUserInput {
  question: string
  header?: string
  options?: { label: string; description?: string }[]
  multiSelect?: boolean
}

const pendingAsks = new Map<string, (answer: AskUserAnswer) => void>()

function broadcast(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send(channel, payload)
}

function askUser(callId: string, rawInput: unknown): Promise<AskUserAnswer> {
  const input = (rawInput ?? {}) as AskUserInput
  const request: AskUserRequest = {
    callId,
    question: input.question ?? '',
    ...(input.header ? { header: input.header } : {}),
    options: input.options ?? [],
    multiSelect: input.multiSelect ?? false,
  }
  broadcast(IPC.agentAsk, request)
  return new Promise((resolve) => pendingAsks.set(callId, resolve))
}

function toTurns(messages: ChatMessage[]): Turn[] {
  return messages
    .filter((message) => message.role !== 'system')
    .map((message): Turn =>
      message.role === 'user'
        ? { role: 'user', content: message.content }
        : { role: 'assistant', text: message.content, toolCalls: [] },
    )
}

async function runTurn(turnId: string, messages: ChatMessage[]): Promise<void> {
  const apiKey = getApiKey(PROVIDER)
  if (!apiKey) {
    broadcast(IPC.agentError, {
      turnId,
      message: 'No Anthropic API key is set. Add one to connect the agent.',
    })
    return
  }

  const provider = getProvider(PROVIDER)
  const turns = toTurns(messages)

  try {
    // Tool-calling loop: run → if the model requested tools, execute them, append results, repeat.
    for (;;) {
      const result = await provider.run(apiKey, {
        system: SYSTEM_PROMPT,
        turns,
        tools: [ASK_USER_TOOL],
        onText: (delta) => broadcast(IPC.agentDelta, { turnId, text: delta }),
      })

      if (result.toolCalls.length === 0) break

      turns.push({ role: 'assistant', text: result.text, toolCalls: result.toolCalls })

      const results: ToolResult[] = []
      for (const call of result.toolCalls) {
        if (call.name === 'ask_user') {
          const answer = await askUser(call.id, call.input)
          results.push({
            callId: call.id,
            content: answer.selected.length
              ? `The user selected: ${answer.selected.join(', ')}`
              : 'The user made no selection.',
          })
        } else {
          results.push({ callId: call.id, content: `Unknown tool: ${call.name}` })
        }
      }
      turns.push({ role: 'tool', results })
    }
    broadcast(IPC.agentDone, { turnId })
  } catch (err) {
    broadcast(IPC.agentError, {
      turnId,
      message: err instanceof Error ? err.message : String(err),
    })
  }
}

export function registerAgentIpc(): void {
  ipcMain.handle(IPC.agentSend, (_e, turnId: string, messages: ChatMessage[]) =>
    runTurn(turnId, messages),
  )
  ipcMain.on(IPC.agentAnswerAsk, (_e, answer: AskUserAnswer) => {
    const resolve = pendingAsks.get(answer.callId)
    if (resolve) {
      pendingAsks.delete(answer.callId)
      resolve(answer)
    }
  })
}
