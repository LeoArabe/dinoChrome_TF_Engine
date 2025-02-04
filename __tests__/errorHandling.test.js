// __tests__/errorHandling.test.js
describe("Testes de tratamento de erros", () => {
    test("Captura de exceção não tratada", () => {
      // Simula um erro não tratado
      expect(() => { throw new Error("Erro de teste"); }).toThrow("Erro de teste");
    });
  
    test("Captura de rejeição não tratada", () => {
      return Promise.reject(new Error("Rejeição de teste")).catch((error) => {
        expect(error.message).toBe("Rejeição de teste");
      });
    });
  });
  