// __tests__/ga.test.js
const { createRandomBrain, selectElite, tournamentSelection, crossover, mutate, createNextGeneration, Dino } = require('../ga');

describe("Testes do GA", () => {
  test("createRandomBrain retorna um objeto com array de 15 pesos", () => {
    const brain = createRandomBrain();
    expect(brain).toHaveProperty("weights");
    expect(Array.isArray(brain.weights)).toBe(true);
    expect(brain.weights.length).toBe(15);
  });

  test("selectElite retorna a quantidade correta de indivíduos", () => {
    const dinos = [];
    for (let i = 0; i < 100; i++){
      const dino = new Dino();
      dino.fitness = Math.random() * 100;
      dinos.push(dino);
    }
    const elitePercent = 10;
    const elite = selectElite(dinos, elitePercent);
    expect(elite.length).toBe(Math.max(1, Math.floor(100 * (elitePercent/100))));
    for(let i = 1; i < elite.length; i++){
      expect(elite[i-1].fitness).toBeGreaterThanOrEqual(elite[i].fitness);
    }
  });

  test("createNextGeneration gera população do tamanho correto", () => {
    const dinos = [];
    for (let i = 0; i < 50; i++){
      const dino = new Dino();
      dino.fitness = Math.random() * 100;
      dinos.push(dino);
    }
    const newPop = createNextGeneration(dinos, 50, 10);
    expect(newPop.length).toBe(50);
    newPop.forEach(d => {
      expect(d).toBeInstanceOf(Dino);
    });
  });
});
