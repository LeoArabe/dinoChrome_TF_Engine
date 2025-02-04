// ga.js
// Módulo do Algoritmo Genético para o agente Dino

class Dino {
    constructor(brain = null) {
      this.x = 50;
      this.y = 0;
      this.vy = 0;
      this.width = 44;
      this.height = 47;
      this.jumping = false;
      this.ducking = false;
      this.alive = true;
      this.fitness = 0;
      this.brain = brain || createRandomBrain();
      this.action = 2; // 0 = pular, 1 = abaixar, 2 = nada
      this.turnsSurvived = 0;
    }
    
    update(gravity) {
      if (!this.alive) return;
      if (this.jumping) {
        this.vy += gravity;
        this.y += this.vy;
        if (this.y <= 0) {
          this.y = 0;
          this.jumping = false;
          this.vy = 0;
        }
      }
    }
    
    clone() {
      const cloned = new Dino(this.brain);
      cloned.x = this.x;
      cloned.y = this.y;
      cloned.vy = this.vy;
      cloned.width = this.width;
      cloned.height = this.height;
      cloned.jumping = this.jumping;
      cloned.ducking = this.ducking;
      cloned.alive = this.alive;
      cloned.fitness = this.fitness;
      cloned.turnsSurvived = this.turnsSurvived;
      cloned.action = this.action;
      return cloned;
    }
  }
  
  function createRandomBrain() {
    let weights = [];
    // 15 pesos = 3 ações * 5 inputs
    for (let i = 0; i < 15; i++) {
      weights.push(Math.random() * 2 - 1);
    }
    return { weights };
  }
  
  class MultiDinoEngine {
    constructor(numDinos) {
      this.dimensions = { width: 800, height: 200 };
      this.gravity = -0.6;
      this.currentSpeed = 5;
      this.maxSpeed = 13;
      this.acceleration = 0.001;
      this.obstacles = [];
      this.nextObstacleDist = null;
      this.distanceRan = 0;
      this.allDead = false;
      this.dinos = [];
      for (let i = 0; i < numDinos; i++) {
        this.dinos.push(new Dino());
      }
      // Para modo de teste:
      this.gameOver = false;
      this.score = 0;
    }
    
    updateAll() {
      this.updateObstacles();
      this.distanceRan += this.currentSpeed;
      
      let aliveCount = 0;
      for (let dino of this.dinos) {
        if (!dino.alive) continue;
        dino.turnsSurvived++;
        aliveCount++;
        
        this.handleAction(dino, dino.action);
        dino.update(this.gravity);
        if (this.checkCollision(dino)) {
          dino.alive = false;
        } else {
          dino.fitness += this.currentSpeed;
        }
      }
      
      // Aumenta a velocidade até o máximo
      if (this.currentSpeed < this.maxSpeed) {
        this.currentSpeed = Math.min(this.currentSpeed + this.acceleration, this.maxSpeed);
      }
      
      // Se nenhum dino está vivo
      if (aliveCount === 0 && !this.allDead) {
        this.allDead = true;
        return true; // Sinaliza que todos morreram
      }
      return false;
    }
    
    handleAction(dino, action) {
      if (!dino.alive) return;
      
      // Ação 0 = pular
      if (action === 0 && !dino.jumping && !dino.ducking) {
        dino.jumping = true;
        dino.vy = 12;
      }
      // Ação 1 = abaixar (apenas se não estiver no ar)
      else if (action === 1 && !dino.jumping) {
        dino.ducking = true;
        dino.height = 25;
        dino.width = 59;
      }
      // Ação 2 = nada (ou levantar se estiver abaixado)
      else if (action === 2 && dino.ducking) {
        dino.ducking = false;
        dino.height = 47;
        dino.width = 44;
      }
    }
    
    updateObstacles() {
      // Move os obstáculos
      this.obstacles.forEach(obs => {
        obs.xPos -= this.currentSpeed;
      });
      // Remove obstáculos que saíram da tela
      this.obstacles = this.obstacles.filter(o => o.xPos + o.width > 0);
      // Verifica se devemos adicionar um novo obstáculo
      if (this.shouldAddNewObstacle()) {
        this.addNewObstacle();
      }
    }
    
    shouldAddNewObstacle() {
      // Impede obstáculos muito cedo
      if (this.distanceRan < 300) return false;
      if (this.obstacles.length === 0) return true;
      
      if (!this.nextObstacleDist) {
        const minGap = 250;
        const maxGap = 450;
        this.nextObstacleDist = Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
      }
      const last = this.obstacles[this.obstacles.length - 1];
      return (last.xPos + last.width < this.dimensions.width - this.nextObstacleDist);
    }
    
    addNewObstacle() {
      const obstacleTypes = [
        { type: 'ground', width: 30, height: 35, yPos: 0 },
        { type: 'aerial', width: 40, height: 30, yPos: 30 },
        { type: 'passive', width: 35, height: 35, yPos: 0 }
      ];
      
      // Adiciona um quarto tipo após 10k de distância
      if (this.distanceRan >= 10000) {
        obstacleTypes.push({ type: 'high', width: 40, height: 40, yPos: 60 });
      }
      
      const rand = Math.random();
      let chosen;
      if (obstacleTypes.length === 3) {
        // Distribuição para 3 tipos
        if (rand < 0.4) chosen = obstacleTypes[0];
        else if (rand < 0.8) chosen = obstacleTypes[1];
        else chosen = obstacleTypes[2];
      } else {
        // Distribuição equilibrada para 4 tipos
        if (rand < 0.25) chosen = obstacleTypes[0];
        else if (rand < 0.5) chosen = obstacleTypes[1];
        else if (rand < 0.75) chosen = obstacleTypes[2];
        else chosen = obstacleTypes[3];
      }
      
      this.obstacles.push({
        xPos: this.dimensions.width,
        yPos: chosen.yPos,
        width: chosen.width,
        height: chosen.height,
        type: chosen.type
      });
      this.nextObstacleDist = null;
    }
    
    checkCollision(dino) {
      for (let obs of this.obstacles) {
        // Bounding box do dino
        const dinoBox = {
          x1: dino.x,
          y1: this.dimensions.height - dino.height - dino.y,
          x2: dino.x + dino.width,
          y2: this.dimensions.height - dino.y
        };
        // Bounding box do obstáculo
        const obsBox = {
          x1: obs.xPos,
          y1: this.dimensions.height - obs.height - obs.yPos,
          x2: obs.xPos + obs.width,
          y2: this.dimensions.height - obs.yPos
        };
        
        // Verifica overlap
        const overlap = !(
          dinoBox.x2 < obsBox.x1 ||
          dinoBox.x1 > obsBox.x2 ||
          dinoBox.y2 < obsBox.y1 ||
          dinoBox.y1 > obsBox.y2
        );
        if (overlap) {
          // Checa exceções por tipo
          if (obs.type === 'ground' && dino.action === 0) {
            // Se está pulando, ignora colisão
            continue;
          } else if (obs.type === 'aerial' && dino.action === 1) {
            // Se está abaixado, ignora colisão
            continue;
          } else if (obs.type === 'passive' && dino.action === 2) {
            // Se está parado (ação 2), ignora colisão
            continue;
          } else if (obs.type === 'high') {
            // Exemplo de checagem mais elaborada:
            // Se o dino está pulando E a parte de baixo do dino está acima do topo do obstáculo
            // ignorar colisão, senão colide
            const dinoBottom = dinoBox.y2; // parte de baixo do dino
            const obsTop = obsBox.y1;      // topo do obstáculo
            if (dino.jumping && dinoBottom <= obsTop) {
              continue;
            }
          }
          return true; // Se não passou em nenhuma exceção, é colisão
        }
      }
      return false;
    }
    
    getStateForDino(dino) {
      const firstObs = this.obstacles[0] || null;
      const distToObs = firstObs ? (firstObs.xPos - dino.x) : 600;
      const maxJumpY = 120;  // Altura máxima do pulo aproximada
      const normY = Math.min(dino.y / maxJumpY, 1); // Normaliza em [0..1]
      const normVY = dino.vy / 20;
      const normDist = distToObs / 600;
      const normW = firstObs ? firstObs.width / 50 : 0;
      const normH = firstObs ? firstObs.height / 50 : 0;
      return [normY, normVY, normDist, normW, normH];
    }
    
    reset(newDinos) {
      this.obstacles = [];
      this.nextObstacleDist = null;
      this.distanceRan = 0;
      this.currentSpeed = 5;
      this.allDead = false;
      
      if (newDinos) {
        this.dinos = newDinos;
      } else {
        this.dinos = this.dinos.map(d => d.alive ? d : new Dino(d.brain));
      }
    }
  
    render(ctx) {
      // Limpa o canvas
      ctx.clearRect(0, 0, this.dimensions.width, this.dimensions.height);
      
      // Renderiza os obstáculos
      ctx.fillStyle = "gray";
      this.obstacles.forEach(obs => {
        ctx.fillRect(
          obs.xPos,
          this.dimensions.height - obs.height - obs.yPos,
          obs.width,
          obs.height
        );
      });
      
      // Renderiza os dinos
      ctx.fillStyle = "green";
      this.dinos.forEach(dino => {
        if (!dino.alive) return;
        ctx.fillRect(
          dino.x,
          this.dimensions.height - dino.height - dino.y,
          dino.width,
          dino.height
        );
      });
    }
  }
  
  // Classe para modo de teste com um único Dino
  class SingleDinoEngine extends MultiDinoEngine {
    constructor(brain) {
      super(1);
      this.dinos[0] = new Dino(brain);
      this.dino = this.dinos[0];
    }
    
    start() {
      this.gameOver = false;
      this.score = 0;
      this.obstacles = [];
      this.distanceRan = 0;
      this.currentSpeed = 5;
    }
    
    // Decide a ação do dino usando o próprio cérebro linear
    decideAction() {
      const state = this.getStateForDino(this.dino);
      const weights = this.dino.brain.weights;
      if (weights.length !== 15) {
        throw new Error("O cérebro deve ter 15 pesos!");
      }
      let scores = [0, 0, 0];
      for (let a = 0; a < 3; a++) {
        let dot = 0;
        for (let i = 0; i < 5; i++) {
          dot += state[i] * weights[a * 5 + i];
        }
        scores[a] = dot;
      }
      this.dino.action = scores.indexOf(Math.max(...scores));
    }
    
    update() {
      this.updateObstacles();
      this.dino.turnsSurvived++;
      this.handleAction(this.dino, this.dino.action);
      this.dino.update(this.gravity);
      if (this.checkCollision(this.dino)) {
        this.dino.alive = false;
        this.gameOver = true;
      } else {
        this.dino.fitness += this.currentSpeed;
        this.score = this.dino.fitness;
      }
    }
  }
  
  // Funções do Algoritmo Genético
  function selectElite(dinos, elitePercent) {
    const eliteCount = Math.max(1, Math.floor(dinos.length * (elitePercent / 100)));
    return [...dinos].sort((a, b) => b.fitness - a.fitness).slice(0, eliteCount);
  }
  
  function tournamentSelection(dinos, size = 3) {
    let best = null;
    for (let i = 0; i < size; i++) {
      const r = Math.floor(Math.random() * dinos.length);
      const candidate = dinos[r];
      if (!best || candidate.fitness > best.fitness) {
        best = candidate;
      }
    }
    return best;
  }
  
  function crossover(brainA, brainB) {
    const child = { weights: [] };
    if (brainA.weights.length !== 15 || brainB.weights.length !== 15) {
      throw new Error("O cérebro deve ter 15 pesos!");
    }
    for (let i = 0; i < brainA.weights.length; i++) {
      child.weights.push(Math.random() < 0.5 ? brainA.weights[i] : brainB.weights[i]);
    }
    return child;
  }
  
  function mutate(brain, rate = 0.02) {
    for (let i = 0; i < brain.weights.length; i++) {
      if (Math.random() < rate) {
        brain.weights[i] += (Math.random() * 0.4 - 0.2);
      }
    }
  }
  
  function createNextGeneration(dinos, popSize, elitePercent) {
    const elite = selectElite(dinos, elitePercent);
    const newPop = elite.map(e => new Dino(e.brain));
    while (newPop.length < popSize) {
      const pA = tournamentSelection(dinos);
      const pB = tournamentSelection(dinos);
      const childBrain = crossover(pA.brain, pB.brain);
      mutate(childBrain, 0.02);
      newPop.push(new Dino(childBrain));
    }
    return newPop;
  }
  
  module.exports = {
    Dino,
    MultiDinoEngine,
    SingleDinoEngine,
    createRandomBrain,
    selectElite,
    tournamentSelection,
    crossover,
    mutate,
    createNextGeneration
  };
  