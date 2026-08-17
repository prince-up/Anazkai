const { app, BrowserWindow, globalShortcut, ipcMain, desktopCapturer, session } = require('electron');
const path = require('path');

// Ensure unrestricted audio device access and no user-gesture requirement for audio in Electron
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-features', 'PulseaudioLoopbackForCast,WebRTCPipeWireCapturer');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
    alwaysOnTop: true, // Always on top as requested
    resizable: true,
    show: true, // Start visible by default
    skipTaskbar: true, // Hide from the taskbar
    transparent: true, // Make background transparent
    frame: false, // Remove window frame
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simplicity in this example to allow IPC from React
      devTools: true // Enable Developer Tools for live console inspection
    }
  });

  const isDev = process.argv.includes('--dev');
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Prevent window from being captured in screen shares, screenshots, or recordings
  mainWindow.setContentProtection(true);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Register Display Media Request Handler for system audio loopback capture
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      const primarySource = sources[0];
      if (primarySource) {
        callback({
          video: primarySource,
          audio: 'loopback'
        });
      } else {
        callback(null);
      }
    }).catch((err) => {
      console.error('Error fetching screen sources for getDisplayMedia:', err);
      callback(null);
    });
  });

  // Grant media permission requests explicitly (microphone and loopback)
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true); // Always allow microphone, media, and screen capture requests
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    return true; // Always return true for media and microphone permissions
  });

  // Register Global Hotkeys
  globalShortcut.register('F1', () => {
    if (mainWindow) {
      mainWindow.webContents.send('shortcut-triggered', 'F1');
    }
  });

  globalShortcut.register('F2', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  globalShortcut.register('F3', () => {
    if (mainWindow) {
      mainWindow.webContents.send('shortcut-triggered', 'F3');
    }
  });

  globalShortcut.register('F4', () => {
    if (mainWindow) {
      mainWindow.webContents.send('shortcut-triggered', 'F4');
    }
  });

  globalShortcut.register('F12', () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    }
  });

  // Handle IPC request for full screen capture
  ipcMain.handle('capture-screen', async () => {
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
      const primaryDisplay = sources[0]; // Usually the first one is the primary screen
      if (primaryDisplay) {
        return primaryDisplay.thumbnail.toDataURL();
      }
      return null;
    } catch (error) {
      console.error('Error capturing screen:', error);
      return null;
    }
  });

  // Handle IPC request to get the primary display desktop source ID for system audio capture
  ipcMain.handle('get-desktop-source-id', async () => {
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'] });
      // Return the ID of the first (primary) screen source
      return sources[0]?.id || null;
    } catch (error) {
      console.error('Error getting desktop source ID:', error);
      return null;
    }
  });

  // Handle IPC request for region capture
  let captureWindow = null;
  let capturePromiseResolve = null;

  ipcMain.handle('start-region-capture', async () => {
    return new Promise((resolve) => {
      capturePromiseResolve = resolve;
      
      const { screen } = require('electron');
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.bounds;

      captureWindow = new BrowserWindow({
        width, height,
        x: 0, y: 0,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        enableLargerThanScreen: true,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          devTools: false
        }
      });

      captureWindow.setFullScreen(true);
      captureWindow.loadFile(path.join(__dirname, 'capture.html'));
      
      captureWindow.on('closed', () => {
        if (capturePromiseResolve) {
          capturePromiseResolve(null);
          capturePromiseResolve = null;
        }
        captureWindow = null;
      });
    });
  });

  ipcMain.on('region-selected', async (event, bounds) => {
    if (captureWindow) {
      captureWindow.close();
    }
    
    try {
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
      const primaryDisplay = sources[0];
      
      if (primaryDisplay && bounds) {
        const image = primaryDisplay.thumbnail;
        const cropped = image.crop(bounds);
        if (capturePromiseResolve) {
          capturePromiseResolve(cropped.toDataURL());
        }
      } else {
        if (capturePromiseResolve) capturePromiseResolve(null);
      }
    } catch (err) {
      console.error(err);
      if (capturePromiseResolve) capturePromiseResolve(null);
    } finally {
      capturePromiseResolve = null;
    }
  });

  ipcMain.on('set-opacity', (event, opacity) => {
    if (mainWindow) mainWindow.setOpacity(opacity);
  });

  ipcMain.on('toggle-always-on-top', (event, isAlwaysOnTop) => {
    if (mainWindow) mainWindow.setAlwaysOnTop(isAlwaysOnTop);
  });

  ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts when the application quits
  globalShortcut.unregisterAll();
});
