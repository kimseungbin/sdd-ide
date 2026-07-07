import { defineConfig } from 'electron-vite'

// electron-vite builds each process separately into out/{main,preload,renderer}.
// Defaults are intentionally bare here — the shell (BL-001) adds no plugins yet.
export default defineConfig({
  main: {},
  preload: {},
  renderer: {},
})
