// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const log = require('electron-log');

let mainWindow;
let trainingProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true, // Permite uso de ipcRenderer no renderer
      contextIsolation: false
    }
  });
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', () => { mainWindow = null; });
  log.info('Main: Janela criada.');
}

app.whenReady().then(() => {
  // Ativa flags de GPU (opcional)
  app.commandLine.appendSwitch('enable-webgl');
  app.commandLine.appendSwitch('ignore-gpu-blacklist');
  app.commandLine.appendSwitch('disable-software-rasterizer');
  app.commandLine.appendSwitch('enable-gpu-rasterization');

  createWindow();

  // Inicia o processo de treinamento como processo filho
  trainingProcess = fork(path.join(__dirname, 'trainingProcess.js'));
  log.info('Main: Processo de treinamento iniciado.');

  // Encaminha mensagens do processo de treinamento para o renderer
  trainingProcess.on('message', (msg) => {
    log.info('Main: Recebeu mensagem do treinamento:', msg);
    if (mainWindow) {
      mainWindow.webContents.send('training-update', msg);
    }
  });

  // Recebe comandos do renderer e repassa para o processo de treinamento
  ipcMain.on('start-training', (event, data) => {
    log.info('Main: Comando start-training recebido com dados:', data);
    trainingProcess.send({ cmd: 'start-training', data });
  });
  ipcMain.on('stop-training', () => {
    log.info('Main: Comando stop-training recebido.');
    trainingProcess.send({ cmd: 'stop-training' });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
