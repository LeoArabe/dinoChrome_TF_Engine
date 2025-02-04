// workerFunctions.js
function getStateForDino(dino, obstacles) {
    const firstObs = obstacles[0] || null;
    const distToObs = firstObs ? (firstObs.xPos - dino.x) : 600;
    // Fórmula da versão antiga: normaliza para 1 quando no chão
    const normY = (dino.y + 100) / 100;
    const normVY = dino.vy / 20;
    const normDist = distToObs / 600;
    const normW = firstObs ? firstObs.width / 50 : 0;
    const normH = firstObs ? firstObs.height / 50 : 0;
    return [normY, normVY, normDist, normW, normH];
  }
  
  function decideAction(dino, state) {
    const weights = dino.brain.weights;
    if (!weights || weights.length < 15) return 2;
    let scores = [0, 0, 0];
    for (let a = 0; a < 3; a++) {
      let dot = 0;
      for (let i = 0; i < 5; i++) {
        dot += state[i] * weights[a * 5 + i];
      }
      scores[a] = dot;
    }
    return scores.indexOf(Math.max(...scores));
  }
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getStateForDino, decideAction };
  }
  