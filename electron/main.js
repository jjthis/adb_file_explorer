import { app, BrowserWindow, ipcMain } from 'electron';
import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import iconv from 'iconv-lite';
import { Mutex } from 'async-mutex';
import os from 'os';
import fs from 'fs';
import notifier from 'node-notifier';
import { dialog } from 'electron';

let shellProcess;
const commandMutex = new Mutex();

let home = os.homedir() + '/Documents/adbfrida';
let download = home + '/Downloads';
let favorite = home + '/favorite.json';
let favoriteData = [
    { name: 'init', path: '' },
    { name: 'root', path: '/' },
    { name: 'sdcard', path: '/sdcard' },
    { name: 'storage/emulated/0', path: '/storage/emulated/0' },
    { name: 'data/data', path: '/data/data' },
    { name: 'data/app', path: '/data/app' }
];

function createWindow() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    if (!fs.existsSync(download)) {
        fs.mkdirSync(download, { recursive: true });
        console.log('[fileSys] folder created:', download);
    } else {
        console.log('[fileSys] folder already exists');
    }

    if (fs.existsSync(favorite)) {
        favoriteData = JSON.parse(fs.readFileSync(favorite, 'utf8'));
    } else {
        fs.writeFileSync(favorite, JSON.stringify(favoriteData, null, 2));
    }

    //console.log("[favoriteData] ", favoriteData);

    console.log("[home] " + home);

    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
    });

    win.loadURL('http://localhost:5173');


    // const template = [
    //     {
    //         label: 'File',
    //         submenu: [
    //             { role: 'quit' },
    //         ],
    //     },
    //     {
    //         label: 'View',
    //         submenu: [
    //             {
    //                 label: '개발자 도구 열기',
    //                 accelerator: 'CmdOrCtrl+Shift+I',
    //                 click: () => {
    //                     win.webContents.openDevTools({ mode: 'detach' });
    //                 },
    //             },
    //             { role: 'reload' },
    //             { role: 'togglefullscreen' },
    //         ],
    //     },
    // ];
    //
    // const menu = Menu.buildFromTemplate(template);
    // Menu.setApplicationMenu(menu);





    shellProcess = spawn('cmd.exe', [], { stdio: 'pipe' });
    addCommand('adb shell').then((what) => {
        console.log("[What] " + what);
    });

    addCommand('su').then((what) => {
        console.log("[What] " + what);
    });

}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('open-devtools', (event) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.webContents.openDevTools({ mode: 'detach' }); // 혹은 'right', 'bottom'
        return 'DevTools opened';
    }
});

async function addCommand(command) {
    return commandMutex.runExclusive(async () => {
        return new Promise((resolve, reject) => {
            if (!shellProcess) return reject('Shell not started');

            let output = '';
            let timer = setTimeout(() => {
                shellProcess.stdout.off('data', onData);
                shellProcess.stderr.off('data', onData);
                resolve(output);
            }, 2000);

            const onData = (data) => {
                output += iconv.decode(data, 'utf-8');
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => {
                    shellProcess.stdout.off('data', onData);
                    shellProcess.stderr.off('data', onData);
                    resolve(output);
                }, 300);
            };

            shellProcess.stdout.on('data', onData);
            shellProcess.stderr.on('data', onData);

            shellProcess.stdin.write(command + '\n');
        });
    });
}

ipcMain.handle('exec-command', async (event, command) => {
    return addCommand(command);
});

ipcMain.handle('get-favorite', async (event) => {
    return favoriteData;
});

function addFavorite(locate) {
    favoriteData.push({ name: locate, path: locate });
    fs.writeFileSync(favorite, JSON.stringify(favoriteData, null, 2));
}
function removeFavorite(locate) {
    favoriteData = favoriteData.filter(item => item.path !== locate);
    fs.writeFileSync(favorite, JSON.stringify(favoriteData, null, 2));
}

function notify(title, message) {
    notifier.notify({
        title: title,
        message: message,
        timeout: 1,
        wait: false
    });
}

function cmdShell(command) {
    return new Promise((resolve, reject) => {
        exec(command, { encoding: 'utf-8' }, (error, stdout, stderr) => {
            if (error) {
                notify('Error', error.message);
                resolve("ok");
                return;
            }
            if (stderr) {
                notify('stderr', stderr);
            }
            notify('Success', stdout);
            resolve("ok");
        });
    });
}

ipcMain.handle('optional', async (event, cmd, locate) => {
    // notify('Download Start', locate);
    let command = '';
    if (cmd === "download") {
        command = `adb pull ${locate} ${download}`;
        console.log("[command] " + command);
    } else if (cmd === "load") {

        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile']
        });
        if (canceled || !filePaths.length) return;

        command = `adb push ${filePaths[0]} ${locate}`;
        console.log("[command] " + command);
    } else if (cmd === "favorite") {
        addFavorite(locate);
        return new Promise((resolve, reject) => {
            resolve("ok");
        });
    } else if (cmd === "remove") {
        command = `rm -rf ${locate}`;
        return addCommand(command);
    } else if (cmd === "removefavorite") {
        removeFavorite(locate);
        return new Promise((resolve, reject) => {
            resolve("ok");
        });
    }

    return cmdShell(command);
});

