// __tests__/logging.test.js
const log = require('electron-log');
const path = require('path');
const fs = require('fs');

describe("Testes de Logging", () => {
  const logPath = path.join(__dirname, '..', 'logs', 'test.log');
  
  beforeAll(() => {
    // Configura o log para usar um arquivo de teste
    log.transports.file.resolvePath = () => logPath;
    if(fs.existsSync(logPath)) fs.unlinkSync(logPath);
  });
  
  test("Escrever log e ler do arquivo", () => {
    log.info("Teste de log");
    // Aguarda um pouco para que o log seja escrito
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(fs.existsSync(logPath)).toBe(true);
        const content = fs.readFileSync(logPath, "utf-8");
        expect(content).toMatch(/Teste de log/);
        resolve();
      }, 500);
    });
  });
});
