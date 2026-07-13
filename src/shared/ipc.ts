/*
  The main↔renderer IPC contract (BL-036, BL-020, BL-030). Shared by main (handlers), preload
  (bridge), and renderer (window.sddIde typing). Covers filesystem reads, and read + validated-
  write access to the spec store (which lives in main, D30). Writes go through the engine's single
  mutation path (D2); role/session gating over this surface is later work (membrane D7, M5). The
  MCP (BL-050) surface will extend it over time.
*/
import type { CreateNodeInput, Node, NodeId, NodePatch, NodeType, SpecSnapshot } from '../engine'
import type {
  AgentDone,
  AgentError,
  AgentTextDelta,
  AskUserAnswer,
  AskUserRequest,
  ChatMessage,
  KeyStatus,
  ProviderId,
  SecureStorageStatus,
} from './agent'
import type { GitBranch, GitCommit, GitStatus } from './git'

export interface DirEntry {
  name: string
  /** Absolute path. */
  path: string
  isDirectory: boolean
}

export interface SddIdeApi {
  versions: NodeJS.ProcessVersions
  workspace: {
    /** Absolute path of the workspace root. */
    root(): Promise<string>
  }
  fs: {
    /** List a directory's entries (directories first). Root-scoped. */
    readDir(path: string): Promise<DirEntry[]>
    /** Read a UTF-8 text file. Root-scoped. */
    readFile(path: string): Promise<string>
    /** Write a UTF-8 text file (the editor's edit/save escape hatch, D20). Root-scoped. */
    writeFile(path: string, content: string): Promise<void>
  }
  spec: {
    /** Snapshot of the spec store (the store lives in main, D30). */
    getSnapshot(): Promise<SpecSnapshot>
    /** Subscribe to store changes; returns an unsubscribe. */
    onChanged(listener: () => void): () => void
    // Validated mutations — the renderer-side write path (Caller A, D2). Reject on invalid input.
    updateNode(id: NodeId, patch: NodePatch): Promise<Node>
    changeNodeType(id: NodeId, type: NodeType): Promise<Node>
    createNode(input: CreateNodeInput): Promise<Node>
    moveNode(id: NodeId, newParentId: NodeId | null, index?: number): Promise<void>
    deleteNode(id: NodeId): Promise<void>
  }
  // App-owned agent surface (BL-039 real backend). Provider-agnostic (D8): the loop + tool
  // handling live in main behind a Provider seam. The renderer sends a turn and observes
  // streamed deltas / ask_user requests; it never sees a provider SDK or an API key.
  agent: {
    /** Start a turn from the full transcript (stateless, like the model API). Streams via events. */
    send(turnId: string, messages: ChatMessage[]): Promise<void>
    /** Answer an in-flight ask_user tool call, unblocking the loop. */
    answerAsk(answer: AskUserAnswer): void
    /** Incremental assistant text for a turn. */
    onDelta(listener: (delta: AgentTextDelta) => void): () => void
    /** The model asked the human a structured question — render it and call answerAsk. */
    onAsk(listener: (request: AskUserRequest) => void): () => void
    /** The turn finished normally. */
    onDone(listener: (done: AgentDone) => void): () => void
    /** The turn failed (no provider key, network, provider error) — surfaced honestly, no fake output. */
    onError(listener: (error: AgentError) => void): () => void
  }
  // Code-side git integration (the git panel). Ops `sem` doesn't cover — status/staging/commit/
  // branch/log/line-diff — shelled out from main. The entity diff is the separate `sem` surface.
  // Specs never touch git (D30); this is purely the code side.
  git: {
    /** Whether the workspace root is inside a git work tree. */
    isRepo(): Promise<boolean>
    /** Working-tree status: branch + changed files (staged and unstaged sides). */
    status(): Promise<GitStatus>
    stage(paths: string[]): Promise<void>
    unstage(paths: string[]): Promise<void>
    /** Revert selected changes to HEAD (tracked restored, untracked removed). */
    discard(paths: string[]): Promise<void>
    /** Commit the staged changes with `message`. */
    commit(message: string): Promise<void>
    currentBranch(): Promise<string | null>
    branches(): Promise<GitBranch[]>
    checkout(name: string): Promise<void>
    createBranch(name: string): Promise<void>
    log(limit?: number): Promise<GitCommit[]>
    /** Unified `git diff HEAD` for one file — the line-diff fallback for non-entity files. */
    diff(path: string): Promise<string>
  }
  // Native app menu → renderer signals (main owns the menu; the renderer reacts).
  menu: {
    /** The Settings… item (or Cmd+,) was invoked — open the settings surface. */
    onOpenSettings(listener: () => void): () => void
  }
  // BYOK credential management (D8 / BL-051). Keys resolve env → safeStorage in main; the
  // plaintext key NEVER crosses this bridge. The renderer can only set / probe.
  credentials: {
    /** Whether a key is present for the provider, and how it was resolved. */
    status(provider: ProviderId): Promise<KeyStatus>
    /** Persist a key (encrypted at rest via safeStorage). Overwrites any stored key. */
    setKey(provider: ProviderId, key: string): Promise<void>
    /** Remove the stored key (does not affect an env-var key). */
    clearKey(provider: ProviderId): Promise<void>
    /** safeStorage health, so the UI can warn when at-rest encryption is weak (e.g. Linux basic_text). */
    secureStorageStatus(): Promise<SecureStorageStatus>
  }
}

export const IPC = {
  workspaceRoot: 'workspace:root',
  fsReadDir: 'fs:readDir',
  fsReadFile: 'fs:readFile',
  fsWriteFile: 'fs:writeFile',
  specGetSnapshot: 'spec:getSnapshot',
  specChanged: 'spec:changed',
  specUpdateNode: 'spec:updateNode',
  specChangeNodeType: 'spec:changeNodeType',
  specCreateNode: 'spec:createNode',
  specMoveNode: 'spec:moveNode',
  specDeleteNode: 'spec:deleteNode',
  agentSend: 'agent:send',
  agentAnswerAsk: 'agent:answerAsk',
  agentDelta: 'agent:delta',
  agentAsk: 'agent:ask',
  agentDone: 'agent:done',
  agentError: 'agent:error',
  credentialsStatus: 'credentials:status',
  credentialsSetKey: 'credentials:setKey',
  credentialsClearKey: 'credentials:clearKey',
  credentialsSecureStorageStatus: 'credentials:secureStorageStatus',
  menuOpenSettings: 'menu:openSettings',
  gitIsRepo: 'git:isRepo',
  gitStatus: 'git:status',
  gitStage: 'git:stage',
  gitUnstage: 'git:unstage',
  gitDiscard: 'git:discard',
  gitCommit: 'git:commit',
  gitCurrentBranch: 'git:currentBranch',
  gitBranches: 'git:branches',
  gitCheckout: 'git:checkout',
  gitCreateBranch: 'git:createBranch',
  gitLog: 'git:log',
  gitDiff: 'git:diff',
} as const
