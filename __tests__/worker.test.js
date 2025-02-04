// __tests__/worker.test.js
const { getStateForDino, decideAction } = require('../workerFunctions');

describe("Testes do Worker", () => {
  test("decideAction retorna um inteiro entre 0 e 2", () => {
    const dino = { brain: { weights: new Array(15).fill(0).map(() => Math.random()*2 - 1) }, x: 50, y: 0, vy: 0 };
    const obstacles = [{ xPos: 800, width: 30, height: 35, yPos: 0 }];
    const state = getStateForDino(dino, obstacles);
    const action = decideAction(dino, state);
    expect(typeof action).toBe("number");
    expect(action).toBeGreaterThanOrEqual(0);
    expect(action).toBeLessThanOrEqual(2);
  });
});
