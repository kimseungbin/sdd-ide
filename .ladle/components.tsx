/// <reference types="vite/client" />
import type { GlobalProvider } from '@ladle/react'
// Load the design tokens + Tailwind so stories render exactly like the app.
import '../src/renderer/src/styles/theme.css'

export const Provider: GlobalProvider = ({ children }) => <>{children}</>
