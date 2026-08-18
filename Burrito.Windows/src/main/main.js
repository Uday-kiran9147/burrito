const { app, BrowserWindow, Tray, ipcMain, screen, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const AutoLaunch = require('auto-launch');
const { processFiles, isVideoFile } = require('./processor');

let tray = null;
let window = null;
let isPinned = false;

const burritoAutoLauncher = new AutoLaunch({
    name: 'Burrito',
    path: app.getPath('exe'),
});

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

function createTrayIcon() {
    const assetsDir = path.join(__dirname, '..', '..', 'assets');
    const iconPath = path.join(assetsDir, 'appicon.png');
    
    let icon;
    if (fs.existsSync(iconPath)) {
        icon = nativeImage.createFromPath(iconPath);
    } else {
        const fallbackDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAABMSURBVHgB7dIxDQAgAMDAw79ozggG3pIGqomk7bmuu0/n930yQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIAAAQIECBAgQIDAhsADG24g8T3lJtQAAAAASUVORK5CYII=';
        icon = nativeImage.createFromDataURL(fallbackDataUrl);
    }

    tray = new Tray(icon);
    tray.setToolTip('Burrito Image & Video Optimizer');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Launch on Login',
            type: 'checkbox',
            checked: false,
            click: async (menuItem) => {
                try {
                    if (menuItem.checked) {
                        await burritoAutoLauncher.enable();
                    } else {
                        await burritoAutoLauncher.disable();
                    }
                } catch (err) {
                    console.error('Failed to toggle auto launch:', err);
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit Burrito',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    burritoAutoLauncher.isEnabled().then((isEnabled) => {
        contextMenu.items[0].checked = isEnabled;
    }).catch(() => {});

    tray.on('click', () => {
        toggleWindow();
    });

    tray.on('right-click', () => {
        tray.popUpContextMenu(contextMenu);
    });
}

function createWindow() {
    window = new BrowserWindow({
        width: 340,
        height: 180,
        show: false,
        frame: false,
        resizable: false,
        fullscreenable: false,
        transparent: false,
        backgroundColor: '#000000',
        skipTaskbar: true,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload', 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false
        }
    });

    window.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

    window.on('blur', () => {
        if (!isPinned && !window.webContents.isDevToolsOpened()) {
            window.hide();
        }
    });
}

function toggleWindow() {
    if (window.isVisible()) {
        window.hide();
    } else {
        showWindow();
    }
}

function showWindow() {
    const trayBounds = tray.getBounds();
    const windowBounds = window.getBounds();
    const primaryDisplay = screen.getPrimaryDisplay();
    const workArea = primaryDisplay.workArea;

    let x, y;

    const hasValidBounds = trayBounds && trayBounds.width > 0 && trayBounds.height > 0 &&
        (trayBounds.x > workArea.x - 50) && (trayBounds.x < workArea.x + workArea.width + 50) &&
        (trayBounds.y > workArea.y - 50) && (trayBounds.y < workArea.y + workArea.height + 150);

    if (hasValidBounds) {
        x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
        y = Math.round(trayBounds.y - windowBounds.height - 8);

        if (x + windowBounds.width > workArea.x + workArea.width) {
            x = workArea.x + workArea.width - windowBounds.width - 12;
        }
        if (x < workArea.x) {
            x = workArea.x + 12;
        }
        if (y < workArea.y) {
            y = Math.min(trayBounds.y + trayBounds.height + 8, workArea.y + workArea.height - windowBounds.height - 12);
        }
    } else {
        // Fallback for Windows 11 taskbar overflow menu
        x = workArea.x + workArea.width - windowBounds.width - 16;
        y = workArea.y + workArea.height - windowBounds.height - 16;
    }

    window.setPosition(x, y, false);
    window.show();
    window.focus();
}

app.whenReady().then(() => {
    createTrayIcon();
    createWindow();
    showWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
            showWindow();
        }
    });
});

app.on('window-all-closed', (e) => {
    if (process.platform !== 'darwin') {
        if (!app.isQuitting) {
            e.preventDefault();
        }
    }
});

// IPC Handlers
ipcMain.handle('process-files', async (event, { filePaths, strategy, settings }) => {
    try {
        const result = await processFiles(filePaths, strategy, settings);
        return result;
    } catch (error) {
        return {
            success: false,
            error: error.message || 'Unknown processing error'
        };
    }
});

ipcMain.handle('determine-media-type', (event, filePaths) => {
    let hasVideo = false;
    let hasImage = false;

    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tiff'];

    for (const file of filePaths) {
        const ext = path.extname(file).toLowerCase();
        if (isVideoFile(file)) {
            hasVideo = true;
        } else if (imageExtensions.includes(ext)) {
            hasImage = true;
        }
    }

    if (hasVideo && hasImage) return 'mixed';
    if (hasVideo) return 'video';
    if (hasImage) return 'image';
    return 'unknown';
});

ipcMain.handle('get-auto-launch-status', async () => {
    try {
        return await burritoAutoLauncher.isEnabled();
    } catch {
        return false;
    }
});

ipcMain.handle('toggle-auto-launch', async (event, enable) => {
    try {
        if (enable) {
            await burritoAutoLauncher.enable();
        } else {
            await burritoAutoLauncher.disable();
        }
        return await burritoAutoLauncher.isEnabled();
    } catch (err) {
        console.error('Failed to toggle auto launch:', err);
        return false;
    }
});

ipcMain.handle('set-pinned', (event, pinned) => {
    isPinned = Boolean(pinned);
    return isPinned;
});

ipcMain.handle('get-pinned-status', () => {
    return isPinned;
});
