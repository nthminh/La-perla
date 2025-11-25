
const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = !app.isPackaged; // Simple check if we are in dev or prod

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "La Perla Nail AI Stylist",
    icon: path.join(__dirname, '../public/favicon.ico'), // Ensure you have an icon if possible
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple apps, this allows easier communication
      webSecurity: false // sometimes needed for local file loading in dev
    },
    autoHideMenuBar: true, // Hide the default menu bar for a cleaner "App" feel
  });

  // In production, load the built index.html.
  // In development, load the local dev server.
  // NOTE: You must build the React app first before creating the .exe
  if (isDev) {
    // If running via 'electron .' locally while dev server is up
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    // Load the build output (adjust 'dist' or 'build' based on your bundler)
    win.loadFile(path.join(__dirname, '../dist/index.html')).catch(() => {
        // Fallback for standard Create React App structure
        win.loadFile(path.join(__dirname, '../build/index.html'));
    });
  }
}

// This method will be called when Electron has finished initialization.
app.whenReady().then(() => {
  createWindow();

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
