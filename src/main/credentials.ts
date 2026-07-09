/*
  BYOK credential provider (D8 / BL-051). Resolves a provider's API key env → safeStorage, and
  owns encrypted-at-rest storage. The plaintext key lives ONLY here in main — it is never sent
  over IPC (the renderer can set/probe, never read). Best-practice per Electron docs: safeStorage
  is OS-keychain-backed (macOS Keychain / Windows DPAPI / Linux libsecret|kwallet); keytar is
  unmaintained and deliberately avoided.
*/
import { app, ipcMain, safeStorage } from 'electron'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { IPC } from '../shared/ipc'
import type { KeyStatus, ProviderId, SecureStorageStatus } from '../shared/agent'

/** Dev/CI escape hatch: an env var outranks the stored key. */
const ENV_VARS: Record<ProviderId, string> = { anthropic: 'ANTHROPIC_API_KEY' }

function storeFile(): string {
  return join(app.getPath('userData'), 'credentials.json')
}

function readStore(): Record<string, string> {
  try {
    return JSON.parse(readFileSync(storeFile(), 'utf8')) as Record<string, string>
  } catch {
    return {}
  }
}

function writeStore(store: Record<string, string>): void {
  const file = storeFile()
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(store), 'utf8')
}

function decryptStored(provider: ProviderId): string | null {
  const encrypted = readStore()[provider]
  if (!encrypted || !safeStorage.isEncryptionAvailable()) return null
  try {
    return safeStorage.decryptString(Buffer.from(encrypted, 'latin1'))
  } catch {
    // Stored blob is undecryptable (keychain rotated, moved machine) — treat as absent.
    return null
  }
}

/** The resolved plaintext key, or null. Main-process only — never expose the return value to IPC. */
export function getApiKey(provider: ProviderId): string | null {
  const env = process.env[ENV_VARS[provider]]
  if (env && env.trim()) return env.trim()
  return decryptStored(provider)
}

function keyStatus(provider: ProviderId): KeyStatus {
  const env = process.env[ENV_VARS[provider]]
  if (env && env.trim()) return { present: true, source: 'env' }
  return decryptStored(provider) ? { present: true, source: 'stored' } : { present: false }
}

function setKey(provider: ProviderId, key: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure storage is unavailable on this system; cannot store the key at rest.')
  }
  const store = readStore()
  store[provider] = safeStorage.encryptString(key).toString('latin1')
  writeStore(store)
}

function clearKey(provider: ProviderId): void {
  const store = readStore()
  delete store[provider]
  writeStore(store)
}

function secureStorageStatus(): SecureStorageStatus {
  if (!safeStorage.isEncryptionAvailable()) return 'unavailable'
  // Linux-only: a `basic_text` backend means a hardcoded password — at-rest encryption is weak.
  const backend = safeStorage as unknown as { getSelectedStorageBackend?: () => string }
  if (typeof backend.getSelectedStorageBackend === 'function') {
    try {
      if (backend.getSelectedStorageBackend() === 'basic_text') return 'plaintext'
    } catch {
      // Non-Linux or unsupported — fall through to ok.
    }
  }
  return 'ok'
}

export function registerCredentialsIpc(): void {
  ipcMain.handle(IPC.credentialsStatus, (_e, provider: ProviderId) => keyStatus(provider))
  ipcMain.handle(IPC.credentialsSetKey, (_e, provider: ProviderId, key: string) =>
    setKey(provider, key),
  )
  ipcMain.handle(IPC.credentialsClearKey, (_e, provider: ProviderId) => clearKey(provider))
  ipcMain.handle(IPC.credentialsSecureStorageStatus, () => secureStorageStatus())
}
