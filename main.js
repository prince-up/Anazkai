const { app, BrowserWindow, globalShortcut, ipcMain, desktopCapturer, session, shell } = require('electron');
const path = require('path');

// Register anazkai:// as a custom deep-link protocol (must be before app.whenReady)
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('anazkai', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('anazkai');
}

// Ensure single instance so deep links work correctly on Windows
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Ensure unrestricted audio device access and no user-gesture requirement for audio in Electron
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('enable-features', 'PulseaudioLoopbackForCast,WebRTCPipeWireCapturer');

let mainWindow;
let userWantsToClose = false;
let sebWatchdogActive = true;
let isUserHiding = false;
let isUserMinimizing = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 800,
    icon: path.join(__dirname, 'dist', 'penguin.jpg'),
    alwaysOnTop: true,   // Will be set to 'screen-saver' level after creation
    resizable: true,
    show: true,          // Start visible by default
    skipTaskbar: true,   // ── SEB STEALTH: Hide from taskbar / task manager UI ──
    transparent: true,   // Make background transparent
    backgroundColor: '#00000000',
    frame: false,        // Remove window frame
    focusable: true,     // Keep true so login/clicks work; we switch to false via IPC when needed
    type: 'panel',       // MacOS: Prevents window from auto-switching spaces
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    }
  });

  // ── SEB STEALTH: Set window level to 'screen-saver' so it renders above SEB fullscreen ──
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  // Keep window visually on top even when SEB takes focus
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const isDev = process.argv.includes('--dev');
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Prevent window from being captured in screen shares, screenshots, or recordings
  mainWindow.setContentProtection(true);

  // ── SEB WATCHDOG: Prevent SEB from hiding or minimizing our window ──
  // If SEB tries to minimize → immediately restore (unless user initiated)
  mainWindow.on('minimize', (e) => {
    if (isUserMinimizing) {
      isUserMinimizing = false;
      return;
    }
    e.preventDefault && e.preventDefault();
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.restore();
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
      }
    }, 100);
  });

  // If SEB tries to hide → immediately show again (unless user initiated)
  mainWindow.on('hide', () => {
    if (isUserHiding) {
      isUserHiding = false;
      return;
    }
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
      }
    }, 100);
  });

  // Pulse watchdog every 800ms — keeps re-asserting screen-saver level
  const sebWatchdog = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed() && sebWatchdogActive) {
      // Only re-assert if window should be visible (not user-hidden via F2)
      if (mainWindow.isVisible()) {
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
        mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      }
    }
  }, 800);

  // Expose watchdog toggle via IPC so F2 hide/show still works smoothly
  ipcMain.on('seb-watchdog-pause', () => { sebWatchdogActive = false; });
  ipcMain.on('seb-watchdog-resume', () => { sebWatchdogActive = true; });

  // ── SEB ANTI-KILL: Prevent SEB from force-closing our app ──
  mainWindow.on('close', (e) => {
    if (!userWantsToClose) {
      // SEB or OS is trying to kill us — block it and just hide instead
      e.preventDefault();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.hide();
        // Re-show after a short delay so SEB thinks it closed us
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
            mainWindow.setAlwaysOnTop(true, 'screen-saver');
          }
        }, 1500);
      }
    }
  });

  mainWindow.on('closed', () => {
    clearInterval(sebWatchdog);
    mainWindow = null;
  });
}

// IPC handler to open DevTools from button in UI
ipcMain.on('open-devtools', () => {
  if (mainWindow) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
});

// IPC handler to open external browser URL (for website login redirect)
ipcMain.on('open-external-url', (event, url) => {
  shell.openExternal(url);
});

// Handle deep link from second instance (Windows) — anazkai://auth?access_token=xxx
app.on('second-instance', (event, commandLine) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    // Find anazkai:// URL in args
    const deepLink = commandLine.find(arg => arg.startsWith('anazkai://'));
    if (deepLink) {
      mainWindow.webContents.send('auth-deep-link', deepLink);
    }
  }
});

// Handle deep link on macOS (open-url event)
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow && url.startsWith('anazkai://')) {
    mainWindow.webContents.send('auth-deep-link', url);
  }
});

app.whenReady().then(() => {
  if (app.dock) app.dock.hide(); // Hide from macOS dock to prevent space auto-switching
  createWindow();

  // Handle deep link if app was launched directly via anazkai:// (Windows cold start)
  const deepLinkArg = process.argv.find(arg => arg.startsWith('anazkai://'));
  if (deepLinkArg) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('auth-deep-link', deepLinkArg);
    });
  }


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

  // F2: Toggle visibility — pause watchdog during hide so it doesn't fight us
  globalShortcut.register('F2', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        // User wants to hide → pause watchdog so it doesn't immediately show again
        mainWindow.webContents.send('seb-watchdog-pause-renderer'); // notify renderer
        sebWatchdogActive = false; // pause internal watchdog
        isUserHiding = true; // Set user action flag
        mainWindow.hide();
      } else {
        // User wants to show → resume watchdog
        mainWindow.show();
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
        mainWindow.focus();
        sebWatchdogActive = true; // resume internal watchdog
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

  // ── SEB EXTRA HOTKEYS: Work at OS level even inside SEB lockdown ──
  // F5: Scroll AI response UP
  globalShortcut.register('F5', () => {
    if (mainWindow) mainWindow.webContents.send('shortcut-triggered', 'F5');
  });

  // F6: Scroll AI response DOWN
  globalShortcut.register('F6', () => {
    if (mainWindow) mainWindow.webContents.send('shortcut-triggered', 'F6');
  });

  // F7: Increase window opacity (more visible)
  globalShortcut.register('F7', () => {
    if (mainWindow) {
      const current = mainWindow.getOpacity();
      mainWindow.setOpacity(Math.min(1.0, parseFloat((current + 0.1).toFixed(1))));
    }
  });

  // F8: Decrease window opacity (more transparent / stealth)
  globalShortcut.register('F8', () => {
    if (mainWindow) {
      const current = mainWindow.getOpacity();
      mainWindow.setOpacity(Math.max(0.1, parseFloat((current - 0.1).toFixed(1))));
    }
  });

  // F9: Toggle SEB stealth mode — make window non-focusable so SEB doesn't detect interaction
  globalShortcut.register('F9', () => {
    if (mainWindow) {
      const isFocusable = mainWindow.isFocusable ? mainWindow.isFocusable() : true;
      mainWindow.setFocusable(!isFocusable);
      mainWindow.webContents.send('shortcut-triggered', 'F9');
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

  // ── SEB STEALTH: Always use 'screen-saver' level so we stay above SEB fullscreen ──
  ipcMain.on('toggle-always-on-top', (event, isAlwaysOnTop) => {
    if (mainWindow) {
      if (isAlwaysOnTop) {
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
      } else {
        mainWindow.setAlwaysOnTop(false);
      }
    }
  });

  ipcMain.on('minimize-window', () => {
    if (mainWindow) {
      isUserMinimizing = true;
      mainWindow.minimize();
    }
  });

  ipcMain.on('close-window', () => {
    userWantsToClose = true;
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
