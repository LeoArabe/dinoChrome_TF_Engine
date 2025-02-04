// renderer.js
const { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

// Elementos da interface
const startTrainingBtn = document.getElementById('start-training');
const stopTrainingBtn = document.getElementById('stop-training');
const startTestingBtn = document.getElementById('start-testing');
const stopTestingBtn = document.getElementById('stop-testing');
const trainingStatusDiv = document.getElementById('training-status');
const testingStatusDiv = document.getElementById('testing-status');
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');

// Define as dimensões do canvas
gameCanvas.width = 800;
gameCanvas.height = 200;

let currentMode = null; // 'training' ou 'test'
let currentGeneration = 1;
let bestFitnessGlobal = 0;
let testEngine = null; // Para modo de teste

// Atualiza o status na interface
function updateStatus(msg) {
  trainingStatusDiv.innerHTML = `Geração: ${msg.generation} | Melhor Fitness: ${msg.bestFitness}`;
  log.info(`Renderer: Atualizando status - Geração ${msg.generation}, Best Fitness: ${msg.bestFitness}`);
}

// Desenha os obstáculos
function renderObstacles(obstacles) {
  ctx.fillStyle = 'gray';
  obstacles.forEach(obs => {
    ctx.fillRect(
      obs.xPos,
      gameCanvas.height - obs.height - obs.yPos,
      obs.width,
      obs.height
    );
  });
}

// Renderiza toda a cena: obstáculos + elite
function renderScene(eliteDinos, obstacles) {
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  renderObstacles(obstacles);
  eliteDinos.forEach((dino, idx) => {
    ctx.fillStyle = `hsl(${(idx * 40) % 360}, 80%, 50%)`;
    ctx.fillRect(
      dino.x,
      gameCanvas.height - dino.height - dino.y,
      dino.width,
      dino.height
    );
  });
  log.info(`Renderer: Renderizando ${eliteDinos.length} indivíduos da elite com obstáculos.`);
}

// Recebe atualizações do processo de treinamento via IPC (modo treinamento)
ipcRenderer.on('training-update', (event, msg) => {
  if (msg.type === 'update' || msg.type === 'generation-end') {
    updateStatus(msg);
    if (msg.eliteDinos && msg.obstacles) {
      renderScene(msg.eliteDinos, msg.obstacles);
    } else {
      log.warn('Renderer: eliteDinos ou obstacles estão vazios.');
    }
    currentGeneration = msg.generation;
    bestFitnessGlobal = msg.bestFitness;
  } else {
    log.warn('Renderer: Mensagem desconhecida recebida:', msg);
  }
});

// Eventos dos botões de treinamento
startTrainingBtn.addEventListener('click', () => {
  currentMode = 'training';
  const populationSize = parseInt(document.getElementById('populationSize').value);
  const elitePercent = parseFloat(document.getElementById('elitePercent').value);
  log.info('Renderer: Enviando start-training:', { populationSize, elitePercent });
  ipcRenderer.send('start-training', { populationSize, elitePercent });
  startTrainingBtn.disabled = true;
  stopTrainingBtn.disabled = false;
});

stopTrainingBtn.addEventListener('click', () => {
  log.info('Renderer: Enviando stop-training.');
  ipcRenderer.send('stop-training');
  startTrainingBtn.disabled = false;
  stopTrainingBtn.disabled = true;
});

// Modo de Teste – Se necessário, implemente o modo de teste com SingleDinoEngine
function startTest() {
  currentMode = 'test';
  const modelPath = path.join(__dirname, 'best-models', 'best_model.json');
  if (!fs.existsSync(modelPath)) {
    alert("Modelo treinado não encontrado. Execute o treinamento primeiro.");
    return;
  }
  const data = JSON.parse(fs.readFileSync(modelPath));
  const bestBrain = data.brain;
  if (!bestBrain || !bestBrain.weights) {
    alert("Modelo inválido.");
    return;
  }
  log.info('Renderer: Iniciando teste com o melhor modelo carregado.');
  const { SingleDinoEngine } = require('./ga');
  testEngine = new SingleDinoEngine(bestBrain);
  testEngine.start();
  testLoop();
  startTestingBtn.disabled = true;
  stopTestingBtn.disabled = false;
}

function testLoop() {
  if (testEngine.gameOver) {
    testingStatusDiv.innerHTML = `Game Over! Score: ${testEngine.dino.fitness.toFixed(2)}`;
    log.info(`Renderer: Teste encerrado. Score final: ${testEngine.dino.fitness}`);
    return;
  }
  testEngine.decideAction();
  testEngine.update();
  testEngine.render(ctx);
  testingStatusDiv.innerHTML = `Score: ${testEngine.dino.fitness.toFixed(2)}`;
  requestAnimationFrame(testLoop);
}

// Eventos dos botões de teste
startTestingBtn.addEventListener('click', startTest);
stopTestingBtn.addEventListener('click', () => {
  location.reload();
});
