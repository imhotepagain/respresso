import { app, BrowserWindow, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { initDatabase, closeDatabase } from './database'
import { setupIpcHandlers } from './ipc-handlers'
import { BackupService } from './backup'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  await closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// TOP-LEVEL EMERGENCY ERROR HANDLER
process.on('uncaughtException', (error) => {
  try {
    const logPath = path.join(app.getPath('desktop'), 'GLISSA_CRITICAL_ERROR.txt')
    fs.appendFileSync(logPath, `CRITICAL CRASH (${new Date().toISOString()}): ${error.stack || error}\n`)
  } catch (e) {}
})

// Force single instance
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
    // 🚀 AUTO-LAUNCH FOR WINDOWS
    if (!isDev) {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: app.getPath('exe')
      })
    }

    const logPath = path.join(app.getPath('desktop'), 'GLISSA_WINDOWS_LOG.txt')
    
    try {
      fs.appendFileSync(logPath, `[WINDOWS PROD] Starting... ${new Date().toISOString()}\n`)

      createWindow()
      await initDatabase()
      setupIpcHandlers()
      
      BackupService.init()
      BackupService.createBackup()
      
      fs.appendFileSync(logPath, `[WINDOWS PROD] System Online\n`)

    } catch (error: any) {
      fs.appendFileSync(logPath, `FATAL ERROR: ${error.stack || error}\n`)
      dialog.showErrorBox('EPOS System Error', `The application could not start. Please check the log on your desktop.`)
    }
  })
}
