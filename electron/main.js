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
}

app.whenReady().then(() => {
  // Build a minimal macOS menu
  const template = [
    { role: 'appMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
