// trainingProcess.js
const { Worker } = require('worker_threads');
const path = require('path');
const os = require('os');
const log = require('electron-log');
const {
  Dino,
  MultiDinoEngine,
  createNextGeneration,
  selectElite
} = require('./ga');

const numWorkers = os.cpus().length;
log.info(`TrainingProcess: Número de workers configurados: ${numWorkers}`);
let simulatorWorkers = [];
let dinosPerWorker = 0;
let engine;
let generationCount = 1;
let globalBestFitness = 0;
let globalBestModel = null;
let populationSize = 5000; // Valor padrão (pode ser alterado via IPC)
let elitePercent = 10;     // Valor padrão
let trainingActive = false;

// Cria um worker thread usando caminho absoluto para simulator.js
function createSimulatorWorker() {
  const worker = new Worker(path.resolve(__dirname, 'simulator.js'));
  worker.setMaxListeners(0);
  log.info('TrainingProcess: Worker criado.');
  return worker;
}

function initSimulatorWorkers() {
  simulatorWorkers = [];
  for (let i = 0; i < numWorkers; i++) {
    simulatorWorkers.push(createSimulatorWorker());
  }
  log.info('TrainingProcess: Workers inicializados.');
}

// Loop de simulação (treinamento) – aproximadamente 30 fps
async function simulationLoop() {
  if (!trainingActive) {
    log.info('TrainingProcess: Treinamento inativo. Encerrando loop.');
    return;
  }
  log.debug(`TrainingProcess: Início do ciclo de simulação, Geração ${generationCount}`);

  let promises = [];
  for (let i = 0; i < simulatorWorkers.length; i++) {
    promises.push(new Promise((resolve, reject) => {
      const worker = simulatorWorkers[i];
      // Remove listeners antigos para evitar acúmulo
      worker.removeAllListeners('message');
      worker.removeAllListeners('error');
      worker.once('message', (msg) => {
        log.debug(`TrainingProcess: Worker ${i} respondeu na Geração ${generationCount}`);
        resolve({ workerIndex: i, msg });
      });
      worker.once('error', (err) => {
        log.error(`TrainingProcess: Erro no Worker ${i}:`, err);
        reject(err);
      });
      const startIdx = i * dinosPerWorker;
      const subset = engine.dinos.slice(startIdx, startIdx + dinosPerWorker).map(dino => ({
        x: dino.x,
        y: dino.y,
        vy: dino.vy,
        width: dino.width,
        height: dino.height,
        jumping: dino.jumping,
        ducking: dino.ducking,
        alive: dino.alive,
        fitness: dino.fitness,
        brain: dino.brain,
        action: dino.action,
        turnsSurvived: dino.turnsSurvived
      }));
      const clonedObstacles = JSON.parse(JSON.stringify(engine.obstacles));
      if (subset.length > 0) {
        log.debug(`TrainingProcess: Enviando subset de tamanho ${subset.length} para Worker ${i}`);
        worker.postMessage({ dinos: subset, obstacles: clonedObstacles, generation: generationCount });
      } else {
        resolve({ workerIndex: i, msg: { updatedDinos: [] } });
      }
    }));
  }

  try {
    const responses = await Promise.all(promises);
    responses.forEach(({ workerIndex, msg }) => {
      const startIdx = workerIndex * dinosPerWorker;
      for (let j = 0; j < msg.updatedDinos.length; j++) {
        Object.assign(engine.dinos[startIdx + j], msg.updatedDinos[j]);
      }
      if (msg.bestFitness && msg.bestFitness > globalBestFitness) {
        globalBestFitness = msg.bestFitness;
        globalBestModel = msg.bestModel;
      }
    });
  } catch (err) {
    log.error('TrainingProcess: Erro na comunicação com os simulatorWorkers:', err);
  }

  // Atualiza a física e checa colisões
  const ended = engine.updateAll();
  log.debug(`TrainingProcess: Após updateAll, Geração ${generationCount}, bestFitness: ${Math.max(...engine.dinos.map(d => d.fitness))}`);

  // Envia atualização para o main (e renderer), incluindo obstáculos
  const eliteTemp = selectElite(engine.dinos, 5);
  process.send({
    type: 'update',
    generation: generationCount,
    bestFitness: Math.max(...engine.dinos.map(d => d.fitness)),
    eliteDinos: eliteTemp,
    obstacles: engine.obstacles
  });

  if (ended) {
    log.info(`TrainingProcess: Todos os dinos morreram na Geração ${generationCount}`);
    onAllDinosDead();
  }

  setTimeout(simulationLoop, 33);
}

function onAllDinosDead() {
  const eliteTemp = selectElite(engine.dinos, 5);
  const best = eliteTemp[0];
  const bestFitness = best ? best.fitness : 0;
  process.send({
    type: 'generation-end',
    generation: generationCount,
    bestFitness,
    eliteDinos: eliteTemp,
    obstacles: engine.obstacles
  });
  log.info(`TrainingProcess: Geração ${generationCount} encerrada. Melhor Fitness: ${bestFitness}`);

  if (bestFitness > globalBestFitness) {
    globalBestFitness = bestFitness;
    globalBestModel = best.brain;
  }
  const newPop = createNextGeneration(engine.dinos, populationSize, elitePercent);
  generationCount++;
  engine.reset(newPop);
  log.info(`TrainingProcess: Nova geração iniciada. Geração ${generationCount}`);
}

process.on('message', (msg) => {
  if (msg.cmd === 'start-training') {
    log.info('TrainingProcess: Comando start-training recebido.', msg.data);
    const data = msg.data;
    populationSize = data.populationSize || populationSize;
    elitePercent = data.elitePercent || elitePercent;
    generationCount = 1;
    globalBestFitness = 0;
    globalBestModel = null;
    trainingActive = true;

    let initialPopulation = [];
    for (let i = 0; i < populationSize; i++) {
      initialPopulation.push(new Dino());
    }
    engine = new MultiDinoEngine(initialPopulation.length);
    engine.dinos = initialPopulation;
    dinosPerWorker = Math.ceil(populationSize / numWorkers);
    log.info(`TrainingProcess: População inicial criada com ${populationSize} dinos.`);
    
    initSimulatorWorkers();
    simulationLoop();
  } else if (msg.cmd === 'stop-training') {
    log.info('TrainingProcess: Comando stop-training recebido.');
    trainingActive = false;
    simulatorWorkers.forEach(worker => worker.terminate());
  }
});
