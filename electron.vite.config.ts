import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

// electron-vite builds each process separately into out/{main,preload,renderer}.
// Only the renderer runs React; main/preload are plain Node.
export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    plugins: [react()],
  },
})
