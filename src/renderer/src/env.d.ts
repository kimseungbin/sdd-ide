/// <reference types="vite/client" />

import type { SddIdeApi } from '../../shared/ipc'

declare global {
  interface Window {
    sddIde: SddIdeApi
  }
}
