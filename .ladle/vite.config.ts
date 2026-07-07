import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Ladle-only Vite config. React/JSX is handled by Ladle itself, so we add ONLY
// Tailwind here so stories get the same token-driven utilities as the app.
export default defineConfig({
  plugins: [tailwindcss()],
})
