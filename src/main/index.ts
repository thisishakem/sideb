import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let tray: Tray | null = null  // Declare tray variable
let mainWindow: BrowserWindow | null = null  // Declare main window variable

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,  // Start with window hidden
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()  // Show window when ready
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer based on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Handle closing the window to prevent quitting the app
  mainWindow.on('close', (event) => {
    if (process.platform !== 'darwin') {
      event.preventDefault()  // Prevent window close
      mainWindow?.hide()  // Hide the window instead of closing it
    }
  })
}

// Create tray and menu
function createTray() {
  const trayIcon = nativeImage.createFromPath(icon)  // Create native image from the icon
  trayIcon.setTemplateImage(true)  // Mark as template image for better display on macOS

  // Create tray
  tray = new Tray(trayIcon)

  // Create a context menu for the tray
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open',
      click: () => {
        if (mainWindow) {
          mainWindow.show()  // Show the main window if it's hidden
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit()  // Quit the application
      }
    }
  ])

  tray.setContextMenu(contextMenu)  // Set the tray context menu
  tray.setToolTip('My Electron App')  // Set a tooltip when hovering over the tray icon

  // Handle single click on the tray icon to toggle window visibility
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()  // Hide the window if it's already visible
      } else {
        mainWindow.show()  // Show the window if it's hidden
      }
    }
  })
}

app.whenReady().then(() => {
  // Set app user model id for Windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()
  createTray()  // Create the tray when the app is ready

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()  // Quit the app when all windows are closed (except on macOS)
  }
})
