// worker.js
importScripts('workerFunctions.js');

self.onmessage = function(e) {
  try {
    const msg = e.data;
    const { dinos, obstacles, generation } = msg;
    let bestFitness = -Infinity;
    let bestModel = null;

    for (let dino of dinos) {
      if (!dino.alive) continue;
      const state = self.getStateForDino(dino, obstacles);
      const action = self.decideAction(dino, state);
      dino.action = action;
      // Exemplo simples de incremento de fitness por "frame"
      dino.fitness += 1;

      if (dino.fitness > bestFitness) {
        bestFitness = dino.fitness;
        bestModel = dino.brain;
      }
    }
    
    // Retorna o estado atualizado desses dinos para o Renderer
    self.postMessage({ updatedDinos: dinos, bestFitness, bestModel });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
