const {app, BrowserWindow, protocol, net, ipcMain, dialog, session} = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
protocol.registerSchemesAsPrivileged([{scheme: 'atelier', privileges: {standard: true, secure: true, supportFetchAPI: true}}]);
let mainWindow;
const origin = 'atelier://app';
const isMain = event => event.sender === mainWindow?.webContents && event.senderFrame === mainWindow.webContents.mainFrame;
function check(event) {if (!isMain(event)) throw new Error('Acces refuzat.');}
function preferences(preload) {return {nodeIntegration: false, contextIsolation: true, sandbox: true, ...(preload ? {preload} : {})};}
app.setName('Atelier Perdele');
if (!app.isPackaged && process.env.ATELIER_TEST_DATA) app.setPath('userData', path.resolve(process.env.ATELIER_TEST_DATA));
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {if (mainWindow) {if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus();}});
  app.whenReady().then(async () => {
    const webRoot = path.join(__dirname, 'web');
    protocol.handle('atelier', request => {
      const url = new URL(request.url);
      if (url.hostname !== 'app') return new Response('Forbidden', {status: 403});
      const target = path.resolve(webRoot, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      if (!target.startsWith(webRoot + path.sep)) return new Response('Forbidden', {status: 403});
      return net.fetch(pathToFileURL(target).href);
    });
    const dataPath = path.join(app.getPath('userData'), 'orders.json');
    ipcMain.handle('store-read', async event => {
      check(event);
      try {return await fs.readFile(dataPath, 'utf8');} catch(e) {if (e.code === 'ENOENT') return null; throw e;}
    });
    ipcMain.handle('store-write', async (event, raw) => {
      check(event);
      if (typeof raw !== 'string' || raw.length > 30_000_000) throw new Error('Fișier prea mare.');
      JSON.parse(raw);
      await fs.mkdir(path.dirname(dataPath), {recursive: true});
      await fs.writeFile(dataPath + '.tmp', raw, 'utf8');
      await fs.rename(dataPath + '.tmp', dataPath);
    });
    ipcMain.handle('document', async (event, {html, name, print}) => {
      check(event);
      if (typeof html !== 'string' || html.length > 30_000_000) throw new Error('Document invalid.');
      const win = new BrowserWindow({show: false, webPreferences: {...preferences(), javascript: false}});
      win.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
      win.webContents.on('will-navigate', e => e.preventDefault());
      try {
        await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
        if (print) {
          await new Promise((resolve, reject) => win.webContents.print({silent: false, printBackground: true}, (ok, reason) => ok || reason === 'cancelled' ? resolve() : reject(new Error(reason))));
        } else {
          const selected = await dialog.showSaveDialog(mainWindow, {title: 'Salvează PDF', defaultPath: String(name).replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf', filters: [{name: 'PDF', extensions: ['pdf']}]});
          if (!selected.canceled && selected.filePath) await fs.writeFile(selected.filePath, await win.webContents.printToPDF({pageSize: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false, margins: {top: 0, bottom: 0, left: 0, right: 0}}));
        }
      } finally {win.destroy();}
    });
    session.defaultSession.on('will-download', (event, item) => {
      item.setSaveDialogOptions({title: 'Salvează backupul', filters: [{name: 'JSON', extensions: ['json']}]});
    });
    mainWindow = new BrowserWindow({width: 1100, height: 850, minWidth: 390, minHeight: 600, title: 'Atelier Perdele', autoHideMenuBar: true, webPreferences: preferences(path.join(__dirname, 'preload.cjs'))});
    mainWindow.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
    mainWindow.webContents.on('will-navigate', (event, url) => {if (!url.startsWith(origin + '/')) event.preventDefault();});
    await mainWindow.loadURL(origin + '/');
  }).catch(e => {dialog.showErrorBox('Atelier Perdele', e.message); app.quit();});
  app.on('window-all-closed', () => app.quit());
}
