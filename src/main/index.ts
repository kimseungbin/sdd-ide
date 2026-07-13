import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { registerIpcHandlers, registerSpecIpc } from './ipc'
import { registerGitIpc } from './git'
import { registerAgentIpc } from './agent'
import { registerCredentialsIpc } from './credentials'
import { installAppMenu } from './menu'
import { openSpecStore, seedDemoSpec } from './specStore'

// Set the app name early (before `ready`) so menu role items (About/Hide/Quit) and dialogs read
// "SDD IDE" instead of the dev process name "Electron". Packaged builds also get this from
// electron-builder.yml's productName; in dev the bold macOS app-menu *title* may still show
// "Electron" (it reads the Electron.app bundle) until a packaged build.
app.setName('SDD IDE')

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
    },
  })

  window.on('ready-to-show', () => window.show())

  // In dev, electron-vite serves the renderer over a URL (enables HMR);
  // in a packaged build it is loaded from the bundled file.
  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  registerIpcHandlers()
  // Code-side git panel (status/staging/commit/branch/log/line-diff), shelled out from main.
  registerGitIpc()

  // The spec store + engine live in main (D30): a local SQLite DB in the project's .sdd/ dir.
  // Seed a demo spec on first run (empty DB); replaced by real specs once BL-022 lands.
  const specStore = openSpecStore(join(process.cwd(), '.sdd', 'spec.db'))
  if (specStore.engine.getRoots().length === 0) seedDemoSpec(specStore.engine)
  registerSpecIpc(specStore)

  // App-owned agent surface (BL-039) + BYOK credentials (BL-051), both main-process.
  registerCredentialsIpc()
  registerAgentIpc()

  // Native menu owns the Settings… entry point (Cmd/Ctrl+,), which opens the settings surface.
  installAppMenu()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
