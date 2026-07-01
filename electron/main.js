const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

// ponytail: keep native macOS menu, just override app name
app.setName('Cognify');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',   // macOS traffic-light inset
    trafficLightPosition: { x: 16, y: 18 },
    icon: path.join(__dirname, '..', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Service workers need https; disable for file:// gracefully
      serviceWorkers: false,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'index.html'));

  // Open all navigation links in system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

app.whenReady().then(() => {
  const win = createWindow();

  // Build a minimal macOS menu with desktop actions.
  const template = [
    { role: 'appMenu' },
    {
      label: 'File',
      submenu: [
        {
          label: 'New Task',
          accelerator: 'CmdOrCtrl+N',
          click: () => win.webContents.executeJavaScript("window.dispatchEvent(new Event('cognify-open-quick-entry'))")
        },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+Option+S',
          click: () => win.webContents.executeJavaScript("window.dispatchEvent(new Event('cognify-toggle-sidebar'))")
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
