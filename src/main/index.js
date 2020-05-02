'use strict'

import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import '../renderer/store'
// const cpus = require('os').cpus().length

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow, workerWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`
const workerURL = process.env.NODE_ENV === 'development'
  ? `worker.html`
  : `file://${__dirname}/worker.html`
function createWindow () {
  Menu.setApplicationMenu(null)
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: false
    },
    allowRunningInsecureContent: true,
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    workerWindow.close()
    mainWindow = null
  })

  workerWindow = new BrowserWindow({
    // show: false,
    webPreferences: { nodeIntegration: true }
  })
  workerWindow.on('closed', () => {
    console.log('background window closed')
  })
  workerWindow.loadFile(workerURL)
  // workerWindow.loadFile(workerURL)
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// let childDirectoryWindow
// ipcMain.on('import-directory', () => {
//   console.info('-------------')
//   childDirectoryWindow = new BrowserWindow({
//     parent: mainWindow,
//     modal: true,
//     show: false,
//     width: 300,
//     height: 300,
//     resizable: false,
//     backgroundColor: '#fff',
//     frame: false,
//     hasShadow: true,
//     closable: true,
//     webPreferences: {
//       devTools: false
//     }
//   })
//   childDirectoryWindow.once('ready-to-show', () => {
//     childDirectoryWindow.show()
//   })
//   childDirectoryWindow.loadURL(winURL + '#/downloadModal')
// })
// // 关闭模态窗口
// ipcMain.on('close-down-modal', () => {
//   childDirectoryWindow.hide()
// })
/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */

function sendWindowMessage(targetWindow, message, payload) {
  if (typeof targetWindow === 'undefined') {
    console.log('Target window does not exist')
    return
  }
  targetWindow.webContents.send(message, payload)
}

app.on('ready', async () => {
  createWindow()
  ipcMain.on('message-from-worker', (event, arg) => {
    // console.info('########################')
    // console.info(arg.type, arg.data)
    sendWindowMessage(mainWindow, 'message-to-renderer', arg)
  })
  ipcMain.on('message-from-renderer', (event, arg) => {
    // console.info('message-to-background: ', event, arg)
    // tasks.push(['message-to-background', event, arg])
    // console.info(workerWindow)
    sendWindowMessage(workerWindow, 'message-from-main', arg)
  })
  ipcMain.on('ready', (event, arg) => {
    console.info('child process ready')
    // available.push(event.sender)
    // doIt()
  })
})
