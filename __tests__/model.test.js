// __tests__/model.test.js
const fs = require('fs');
const path = require('path');
const { Dino } = require('../ga');

describe("Testes de salvamento de modelo", () => {
  const savePath = path.join(__dirname, '..', 'best-models');
  const modelFile = path.join(savePath, 'best_model.json');
  
  beforeAll(() => {
    if(fs.existsSync(modelFile)){
      fs.unlinkSync(modelFile);
    }
  });
  
  test("Salvar e carregar modelo", () => {
    if(!fs.existsSync(savePath)){
      fs.mkdirSync(savePath, { recursive: true });
    }
    const dino = new Dino();
    const modelData = { fitness: 100, brain: dino.brain };
    fs.writeFileSync(modelFile, JSON.stringify(modelData, null, 2));
    expect(fs.existsSync(modelFile)).toBe(true);
    const loadedData = JSON.parse(fs.readFileSync(modelFile));
    expect(loadedData.fitness).toBe(100);
    expect(loadedData.brain.weights.length).toBe(15);
  });
});
