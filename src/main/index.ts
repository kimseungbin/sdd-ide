import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { registerIpcHandlers, registerSpecIpc } from './ipc'
import { openSpecStore, seedDemoSpec } from './specStore'

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

  // The spec store + engine live in main (D30): a local SQLite DB in the project's .sdd/ dir.
  // Seed a demo spec on first run (empty DB); replaced by real specs once BL-022 lands.
  const specStore = openSpecStore(join(process.cwd(), '.sdd', 'spec.db'))
  if (specStore.engine.getRoots().length === 0) seedDemoSpec(specStore.engine)
  registerSpecIpc(specStore)

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
