const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, '../public/vite.svg'),
        autoHideMenuBar: true
    });

    // HashRouter kullandığımız için artık 'loadFile' kullanabiliriz.
    // Bu yöntem dosya sistemi üzerinden direkt çalışır ve çok daha kararlıdır.

    if (isDev) {
        // Sadece 'npm run dev' (vite) çalışıyorsa localhost'a git
        mainWindow.loadURL('http://localhost:5173').catch(e => {
            console.log('Localhost yüklenemedi. Vite sunucusu çalışıyor mu?');
        });
        mainWindow.webContents.openDevTools();
    } else {
        // Production veya 'npm run electron:dev'
        // app.getAppPath() kullanarak kök dizini (dist'in bulunduğu yer) alıyoruz.
        // Bu yöntem __dirname karmaşasını (asar vb.) çözer.
        const appPath = app.getAppPath();
        const indexPath = path.join(appPath, 'dist/index.html');

        // Dosya kontrolü (sadece paketlenmemiş modda hata ayıklama için yararlıdır, 
        // paketli (asar) modda fs.existsSync her zaman doğru çalışmayabilir ama loadFile doğrusunu yapar)
        mainWindow.loadFile(indexPath).catch(e => {
            console.error('Index.html yüklenemedi:', e);
            // Kullanıcıya hata göster
            const { dialog } = require('electron');
            dialog.showErrorBox('Uygulama Hatası', `Uygulama dosyası yüklenemedi.\nPath: ${indexPath}\nHata: ${e.message}`);
        });
    }

    // Dış linkleri varsayılan tarayıcıda aç
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            require('electron').shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
