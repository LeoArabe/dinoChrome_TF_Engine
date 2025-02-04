// simulator.js
const { parentPort } = require('worker_threads');
const { getStateForDino, decideAction } = require('./workerFunctions');

parentPort.on('message', (data) => {
  const { dinos, obstacles, generation } = data;
  let bestFitness = -Infinity;
  let bestModel = null;
  
  for (let dino of dinos) {
    if (!dino.alive) continue;
    const state = getStateForDino(dino, obstacles);
    const action = decideAction(dino, state);
    dino.action = action;
    // Apenas incrementa o fitness (a física completa ocorre no engine.updateAll)
    dino.fitness += 1;
    if (dino.fitness > bestFitness) {
      bestFitness = dino.fitness;
      bestModel = dino.brain;
    }
  }
  
  parentPort.postMessage({
    updatedDinos: dinos,
    bestFitness,
    bestModel,
    generation
  });
});
