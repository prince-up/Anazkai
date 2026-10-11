const { app, BrowserWindow, globalShortcut, ipcMain, desktopCapturer, session, shell, powerSaveBlocker, Tray, Menu } = require('electron');
const path = require('path');

// Prevent macOS App Nap & automatic background suspension
try {
  powerSaveBlocker.start('prevent-app-suspension');
} catch (e) {}

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

// Ensure dock is hidden immediately on macOS (Daemon / Background Agent)
if (process.platform === 'darwin' && app.dock) {
  app.dock.hide();
}

const fs = require('fs');
const os = require('os');
const logPath = path.join(os.homedir(), 'Desktop', 'anazk_log.txt');

function logDebug(msg) {
  try {
    fs.appendFileSync(logPath, `[${new Date().toLocaleTimeString()}] ${msg}\n`);
  } catch (e) {}
}

logDebug('--- App process initialized ---');

let mainWindow;
let userWantsToClose = false;
let isOverlayHidden = false;
let savedOpacity = 0.85;

function toggleVisibility(source = 'unknown') {
  logDebug(`toggleVisibility called by [${source}], current isOverlayHidden=${isOverlayHidden}`);
  if (!mainWindow || mainWindow.isDestroyed()) {
    logDebug('mainWindow is null or destroyed, recreating window!');
    createWindow();
    return;
  }
  if (!isOverlayHidden) {
    // Hide: Set opacity 0 and pass clicks through to browser/desktop
    isOverlayHidden = true;
    savedOpacity = mainWindow.getOpacity() || 0.85;
    mainWindow.setOpacity(0);
    mainWindow.setIgnoreMouseEvents(true);
    logDebug('Window state set to INVISIBLE (opacity 0, mouse ignore true)');
  } else {
    // Show: Restore opacity and re-enable clicks
    isOverlayHidden = false;
    mainWindow.setOpacity(savedOpacity > 0 ? savedOpacity : 0.85);
    mainWindow.setIgnoreMouseEvents(false);
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    logDebug('Window state set to VISIBLE (opacity restored)');
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: '',           // Neutral title so proctor window scans don't detect interview assistant
    width: 600,
    height: 800,
    icon: path.join(__dirname, 'dist', 'penguin.jpg'),
    alwaysOnTop: true,   // Will be set to 'screen-saver' level after creation
    resizable: true,
    show: true,          // Start visible immediately
    skipTaskbar: true,   // ── STEALTH: Hide from taskbar / Alt-Tab / Task Switcher ──
    hiddenInMissionControl: true, // MacOS: Hide from Mission Control & Spaces overview
    transparent: true,   // Make background transparent
    backgroundColor: '#00000000',
    frame: false,        // Remove window frame
    focusable: false,    // ── CRITICAL: Non-focusable prevents focus theft from Chrome (NO WINDOW SWITCH TRIGGER) ──
    acceptFirstMouse: true, // macOS: click buttons immediately without activating window
    type: process.platform === 'darwin' ? 'normal' : 'toolbar', // 'normal' prevents NSPanel auto-hide on macOS, 'toolbar' (WS_EX_TOOLWINDOW) for Windows stealth
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Prevent web page title from changing the window title to "Hide AI"
  mainWindow.on('page-title-updated', (e) => {
    e.preventDefault();
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

  // Pulse watchdog every 1000ms — keeps re-asserting screen-saver level when visible
  const sebWatchdog = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!isOverlayHidden) {
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
        mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      }
    }
  }, 1000);

  // ── PREVENT ACCIDENTAL TERMINATION: Hide instead of destroying window ──
  mainWindow.on('close', (e) => {
    if (!userWantsToClose) {
      e.preventDefault();
      toggleVisibility();
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
  logDebug('app second-instance triggered');
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (isOverlayHidden) toggleVisibility('second-instance');
    mainWindow.show();
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
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
  // --- MACOS SPACES FIX ---
  if (process.platform === 'darwin') {
    app.setActivationPolicy('accessory'); // This fully stops macOS from switching spaces when the app is clicked
    if (app.dock) app.dock.hide();
  }
  // ------------------------

  createWindow();

  // Create Menu Bar Tray icon for 1-click restore (immune to shortcut trapping)
  let tray = null;
  try {
    const trayIcon = path.join(__dirname, 'dist', 'penguin.jpg');
    tray = new Tray(trayIcon);
    tray.setToolTip('System Audio Core Service');
    tray.on('click', () => {
      toggleVisibility('tray-click');
    });
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show / Hide Overlay', click: () => toggleVisibility('tray-menu') },
      { type: 'separator' },
      { label: 'Quit App', click: () => { userWantsToClose = true; app.quit(); } }
    ]);
    tray.setContextMenu(contextMenu);
    logDebug('Menu Bar Tray icon created successfully');
  } catch (err) {
    logDebug(`Tray creation note: ${err.message}`);
  }

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

  // Global Visibility Toggle Shortcuts:
  const regToggle = (key) => {
    const res = globalShortcut.register(key, () => {
      logDebug(`HOTKEY TRIGGERED: ${key}`);
      toggleVisibility(key);
    });
    logDebug(`Register hotkey [${key}]: success=${res}`);
  };
  regToggle('F2');
  regToggle('CommandOrControl+F2');
  regToggle('CommandOrControl+\\');
  regToggle('CommandOrControl+Shift+H');
  regToggle('Alt+H');

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
    toggleVisibility();
  });

  ipcMain.on('close-window', () => {
    // When X is clicked in UI, make invisible (never quit!)
    toggleVisibility();
  });

  ipcMain.on('force-quit-app', () => {
    userWantsToClose = true;
    app.quit();
  });

  app.on('activate', () => {
    logDebug('app activate event fired');
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (isOverlayHidden) toggleVisibility('activate');
    } else {
      createWindow();
    }
  });
});

process.on('uncaughtException', (err) => {
  logDebug(`UNCAUGHT EXCEPTION: ${err ? err.stack : 'unknown'}`);
});
process.on('unhandledRejection', (reason) => {
  logDebug(`UNHANDLED REJECTION: ${reason}`);
});

// Protect daemon from external SIGTERM / SIGINT kills from proctor scripts
process.on('SIGTERM', () => {
  logDebug('Intercepted external SIGTERM (kill -15)');
});
process.on('SIGINT', () => {
  logDebug('Intercepted external SIGINT (kill -2)');
});

// Intercept all termination attempts
app.on('before-quit', (e) => {
  logDebug(`app.before-quit fired, userWantsToClose=${userWantsToClose}`);
  if (!userWantsToClose) {
    e.preventDefault();
  }
});

// NEVER quit when window is hidden or closed
app.on('window-all-closed', (e) => {
  logDebug('app.window-all-closed fired');
  if (e && e.preventDefault) e.preventDefault();
});

app.on('will-quit', () => {
  logDebug('app.will-quit fired');
  globalShortcut.unregisterAll();
});
