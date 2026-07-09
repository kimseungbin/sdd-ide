/*
  Settings surface open/close state (BL-051). A tiny external store (Rule 6) so both the native
  menu (via IPC) and in-app affordances (the agent pane's "no provider" notice) can open the same
  modal. The store subscribes to the menu signal once at module load, guarded for tests/Ladle.
*/
let open = false
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

if (typeof window !== 'undefined' && window.sddIde?.menu) {
  window.sddIde.menu.onOpenSettings(() => {
    if (!open) {
      open = true
      notify()
    }
  })
}

export const settingsStore = {
  subscribe(onChange: () => void): () => void {
    listeners.add(onChange)
    return () => {
      listeners.delete(onChange)
    }
  },
  isOpen(): boolean {
    return open
  },
  open(): void {
    if (!open) {
      open = true
      notify()
    }
  },
  close(): void {
    if (open) {
      open = false
      notify()
    }
  },
}
