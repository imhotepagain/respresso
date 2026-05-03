import { app, BrowserWindow, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initDatabase, closeDatabase } from './database'
import { setupIpcHandlers } from './ipc-handlers'
import { BackupService } from './backup'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Built layout:
//   dist-electron/main.js
//   dist-electron/preload.mjs
//   dist/index.html
process.env.APP_ROOT = path.join(__dirname, '..')
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
const PUBLIC_DIR = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST
process.env.VITE_PUBLIC = PUBLIC_DIR

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#0a0a0a',
    icon: path.join(PUBLIC_DIR, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      // Required for ES module scripts to load over file:// in packaged builds.
      webSecurity: false,
    },
  })

  // Hide the application menu entirely (File/Edit/View/Window/Help)
  win.setMenuBarVisibility(false)
  win.setMenu(null)

  win.once('ready-to-show', () => {
    win?.show()
    win?.focus()
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', async () => {
  await closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(async () => {
    try {
      createWindow()
      await initDatabase()
      setupIpcHandlers()
      BackupService.init()
      BackupService.createBackup()
    } catch (error: any) {
      console.error('Startup Error:', error)
      dialog.showErrorBox('Critical Startup Error', error.message || 'Unknown error')
    }
  })
}
