// Cocktail Merge Challenge - Playable Ad
// Using PixiJS for rendering

class CocktailMergeGame {
  constructor() {
    // Game constants
    this.GRID_SIZE = 3;
    this.CELL_SIZE = 120;
    this.GAME_DURATION = 30; // seconds

    // Object pools for performance
    this.particlePool = [];
    this.graphicsPool = [];

    // Game state
    this.score = 0;
    this.timeLeft = this.GAME_DURATION;
    this.gameActive = false;
    this.selectedCells = [];
    this.gameOver = false;

    // Initialize PixiJS application
    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initPixiApp();
      });
    } else {
      this.initPixiApp();
    }
  }

  initPixiApp() {
    this.app = new PIXI.Application({
      width: 400,
      height: 600,
      backgroundColor: 0x000000,
      view: document.getElementById('pixi-canvas'),
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Create game grid
    this.grid = Array(this.GRID_SIZE)
      .fill()
      .map(() => Array(this.GRID_SIZE).fill(null));

    // Cocktail types with values and colors
    this.cocktailTypes = [
      { id: 1, name: 'Lemon', value: 1, color: 0xffd700, emoji: '🍋' }, // Lemon
      { id: 2, name: 'Mojito', value: 2, color: 0x32cd32, emoji: '🍸' }, // Green
      { id: 3, name: 'Cosmo', value: 4, color: 0xff69b4, emoji: '🥂' }, // Pink
      { id: 4, name: 'Martini', value: 8, color: 0x87ceeb, emoji: '🥃' }, // Light blue
      { id: 5, name: 'Margarita', value: 16, color: 0x7cfc00, emoji: '🍹' }, // Lawn green
      { id: 6, name: 'Tequila', value: 32, color: 0xff4500, emoji: '🥃' }, // Orange red
      { id: 7, name: 'Whiskey', value: 64, color: 0xdaa520, emoji: '🥃' }, // Golden rod
    ];

    // Initialize game elements
    this.initializeGame();
    this.setupEventListeners();
  }

  initializeGame() {
    // Create background
    this.createBackground();

    // Create grid cells
    this.createGrid();

    // Fill initial grid
    this.fillGrid();

    // Start game loop
    this.startGame();
  }

  createBackground() {
    // Create a multi-layered background
    const background = new PIXI.Graphics();
    // Create a radial gradient effect manually
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

    // Draw concentric circles to simulate gradient
    for (let r = maxRadius; r > 0; r -= 10) {
      const alpha = (r / maxRadius) * 0.3;
      const color = 0x1a1a2e;
      background.beginFill(color, alpha);
      background.drawCircle(centerX, centerY, r);
      background.endFill();
    }

    // Add subtle pattern
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % this.app.screen.width; // Use prime number for more random-like distribution
      const y = (i * 73) % this.app.screen.height;
      const size = Math.random() * 1.5 + 0.5;
      background.beginFill(0xffffff, 0.1);
      background.drawCircle(x, y, size);
      background.endFill();
    }

    this.app.stage.addChild(background);
  }

  createGrid() {
    // Create grid container
    this.gridContainer = new PIXI.Container();
    this.app.stage.addChild(this.gridContainer);

    // Center the grid in the available space, accounting for UI elements
    const totalGridWidth = this.GRID_SIZE * this.CELL_SIZE;
    const totalGridHeight = this.GRID_SIZE * this.CELL_SIZE;
    const startX = (this.app.screen.width - totalGridWidth) / 2;
    const startY = (this.app.screen.height - totalGridHeight) / 2 + 10; // Adjusted to account for UI elements at top and bottom

    // Create grid cells
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        const cellX = startX + col * this.CELL_SIZE;
        const cellY = startY + row * this.CELL_SIZE;

        // Cell background
        const cellBg = new PIXI.Graphics();
        cellBg.lineStyle(3, 0xffffff, 0.4);
        cellBg.beginFill(0x000000, 0.3);
        cellBg.drawRoundedRect(cellX, cellY, this.CELL_SIZE, this.CELL_SIZE, 12);
        cellBg.endFill();
        this.gridContainer.addChild(cellBg);

        // Add subtle inner shadow for depth
        const innerShadow = new PIXI.Graphics();
        innerShadow.lineStyle(1, 0x000000, 0.3);
        innerShadow.beginFill(0x000000, 0.1);
        innerShadow.drawRoundedRect(cellX + 2, cellY + 2, this.CELL_SIZE - 4, this.CELL_SIZE - 4, 10);
        innerShadow.endFill();
        this.gridContainer.addChild(innerShadow);

        // Store cell reference
        if (!this.grid[row][col]) {
          this.grid[row][col] = {
            x: cellX,
            y: cellY,
            sprite: null,
            cocktail: null,
            row: row,
            col: col,
            innerShadow: innerShadow, // Keep reference for updates
          };
        }
      }
    }
  }

  fillGrid() {
    // Fill empty grid cells with random cocktails
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (!this.grid[row][col].cocktail) {
          this.createCocktailAt(row, col);
        }
      }
    }
  }

  // AI-assisted feature: Suggest optimal moves to improve gameplay
  suggestOptimalMove() {
    // Analyze the grid to find possible merges
    const possibleMerges = [];

    // Check horizontal pairs
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE - 1; col++) {
        const cell1 = this.grid[row][col];
        const cell2 = this.grid[row][col + 1];

        if (cell1.cocktail && cell2.cocktail && cell1.cocktail.id === cell2.cocktail.id) {
          possibleMerges.push({
            cells: [
              { row, col },
              { row, col: col + 1 },
            ],
            value: cell1.cocktail.value * 2,
          });
        }
      }
    }

    // Check vertical pairs
    for (let col = 0; col < this.GRID_SIZE; col++) {
      for (let row = 0; row < this.GRID_SIZE - 1; row++) {
        const cell1 = this.grid[row][col];
        const cell2 = this.grid[row + 1][col];

        if (cell1.cocktail && cell2.cocktail && cell1.cocktail.id === cell2.cocktail.id) {
          possibleMerges.push({
            cells: [
              { row, col },
              { row: row + 1, col },
            ],
            value: cell1.cocktail.value * 2,
          });
        }
      }
    }

    // Return the highest value merge if any exist
    if (possibleMerges.length > 0) {
      possibleMerges.sort((a, b) => b.value - a.value);
      return possibleMerges[0];
    }

    return null;
  }

  // Show AI hint to player
  showAIHint() {
    if (!this.gameActive || this.gameOver) return;

    const suggestion = this.suggestOptimalMove();
    if (suggestion) {
      // Highlight the suggested cells
      this.highlightCellsForHint(suggestion.cells);

      // Add a subtle notification
      this.showAINotification('AI suggests a merge!');
    }
  }

  highlightCellsForHint(cells) {
    // Clear any existing hint highlights
    this.clearHintHighlights();

    // Highlight suggested cells
    cells.forEach((cell) => {
      const gridCell = this.grid[cell.row][cell.col];
      if (gridCell.sprite) {
        const hintIndicator = new PIXI.Graphics();
        hintIndicator.lineStyle(4, 0x00ffff, 0.8); // Cyan border
        hintIndicator.drawRoundedRect(2, 2, this.CELL_SIZE - 4, this.CELL_SIZE - 4, 8);

        // Add pulsing animation
        let pulse = 0;
        const animatePulse = () => {
          if (!hintIndicator.parent) return;

          pulse += 0.15;
          const thickness = 3 + Math.sin(pulse) * 2;
          const alpha = 0.5 + Math.sin(pulse * 1.5) * 0.3;

          hintIndicator.clear();
          hintIndicator.lineStyle(thickness, 0x00ffff, alpha);
          hintIndicator.drawRoundedRect(2, 2, this.CELL_SIZE - 4, this.CELL_SIZE - 4, 8);

          requestAnimationFrame(animatePulse);
        };
        animatePulse();

        gridCell.sprite.addChild(hintIndicator);
        gridCell.sprite.hintIndicator = hintIndicator;
      }
    });

    // Clear hint after 2 seconds
    setTimeout(() => {
      this.clearHintHighlights();
    }, 2000);
  }

  clearHintHighlights() {
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        const cell = this.grid[row][col];
        if (cell.sprite && cell.sprite.hintIndicator) {
          cell.sprite.removeChild(cell.sprite.hintIndicator);
          cell.sprite.hintIndicator = null;
        }
      }
    }
  }

  showAINotification(message) {
    // Create a temporary notification with enhanced styling
    const notification = new PIXI.Text(message, {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: [0xffff00, 0xffd700], // Gradient effect
      align: 'center',
      fontWeight: 'bold',
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowBlur: 4,
      dropShadowAngle: 0,
      dropShadowDistance: 0,
    });
    notification.anchor.set(0.5);
    notification.x = this.app.screen.width / 2;
    notification.y = 20; // Position higher to avoid overlapping with game grid

    // Add background for better visibility
    const bg = new PIXI.Graphics();
    const bounds = notification.getBounds();
    bg.beginFill(0x000000, 0.7);
    bg.lineStyle(2, 0xffff00, 1);
    bg.drawRoundedRect(-bounds.width / 2 - 15, -bounds.height / 2 - 8, bounds.width + 30, bounds.height + 16, 12);
    bg.endFill();

    const container = new PIXI.Container();
    container.addChild(bg);
    container.addChild(notification);
    container.x = this.app.screen.width / 2;
    container.y = 20; // Position higher to avoid overlapping with game grid

    this.app.stage.addChild(container);

    // Animate and fade out effect
    let alpha = 1;
    const fadeOut = () => {
      alpha -= 0.02;
      container.alpha = alpha;

      if (alpha > 0) {
        requestAnimationFrame(fadeOut);
      } else {
        this.app.stage.removeChild(container);
      }
    };
    fadeOut();
  }

  createCocktailAt(row, col) {
    // Select a random cocktail type (more common lower-value cocktails)
    let cocktailType;
    const rand = Math.random();

    if (rand < 0.4) cocktailType = this.cocktailTypes[0]; // Lemon (40% chance)
    else if (rand < 0.7) cocktailType = this.cocktailTypes[1]; // Mojito (30% chance)
    else if (rand < 0.85) cocktailType = this.cocktailTypes[2]; // Cosmo (15% chance)
    else cocktailType = this.cocktailTypes[Math.floor(Math.random() * 3) + 3]; // Higher value (15% chance)

    // Create cocktail sprite
    const cell = this.grid[row][col];
    const cocktail = new PIXI.Container();

    // Background circle
    const bg = new PIXI.Graphics();
    bg.beginFill(cocktailType.color);
    bg.drawCircle(this.CELL_SIZE / 2, this.CELL_SIZE / 2, this.CELL_SIZE / 2 - 10);
    bg.endFill();
    cocktail.addChild(bg);

    // Cocktail emoji/text
    const text = new PIXI.Text(cocktailType.emoji, {
      fontFamily: 'Arial',
      fontSize: 48,
      fill: 0xffffff,
      align: 'center',
    });
    text.anchor.set(0.5);
    text.x = this.CELL_SIZE / 2;
    text.y = this.CELL_SIZE / 2 - 5;

    // Add subtle pulsing animation
    let pulseScale = 1;
    let pulseDirection = 0.005;
    const animatePulse = () => {
      if (!text.parent) return; // Stop if removed from parent

      pulseScale += pulseDirection;
      if (pulseScale > 1.1 || pulseScale < 0.95) {
        pulseDirection *= -1;
      }

      text.scale.set(pulseScale);
      requestAnimationFrame(animatePulse);
    };
    animatePulse();

    cocktail.addChild(text);

    // Position the cocktail
    cocktail.x = cell.x;
    cocktail.y = cell.y;

    // Make it interactive for both mouse and touch
    cocktail.interactive = true;
    cocktail.buttonMode = true;
    cocktail.on('pointerdown', () => this.onCocktailClick(row, col));
    cocktail.on('touchstart', () => this.onCocktailClick(row, col));

    // Add to stage and grid
    this.gridContainer.addChild(cocktail);
    cell.sprite = cocktail;
    cell.cocktail = cocktailType;
  }

  onCocktailClick(row, col) {
    if (!this.gameActive || this.gameOver) return;

    const cell = this.grid[row][col];

    if (!cell.cocktail) return;

    // Toggle selection
    const isSelected = this.selectedCells.some((c) => c.row === row && c.col === col);

    if (isSelected) {
      // Deselect
      this.selectedCells = this.selectedCells.filter((c) => !(c.row === row && c.col === col));
      this.updateSelectionVisuals();
    } else {
      // Select (max 2 selections)
      if (this.selectedCells.length < 2) {
        this.selectedCells.push({ row, col });
        this.updateSelectionVisuals();

        // If 2 cells selected, check for merge
        if (this.selectedCells.length === 2) {
          this.attemptMerge();
        }
      }
    }
  }

  updateSelectionVisuals() {
    // Clear previous selections
    this.gridContainer.children.forEach((child) => {
      if (child.selectedIndicator) {
        child.removeChild(child.selectedIndicator);
        child.selectedIndicator = null;
      }
    });

    // Highlight selected cells with animation
    this.selectedCells.forEach((selected, index) => {
      const cell = this.grid[selected.row][selected.col];
      if (cell.sprite) {
        const indicator = new PIXI.Graphics();

        // Different color for first and second selection
        const color = index === 0 ? 0x00ff00 : 0xffff00; // Green for first, Yellow for second
        indicator.lineStyle(4, color, 0.8);

        // Create animated selection border
        indicator.drawRoundedRect(3, 3, this.CELL_SIZE - 6, this.CELL_SIZE - 6, 8);

        // Add pulsing effect to the indicator
        let pulse = 0;
        const animatePulse = () => {
          if (!indicator.parent) return; // Stop if removed from parent

          pulse += 0.1;
          const thickness = 3 + Math.sin(pulse) * 1.5;
          const alpha = 0.6 + Math.sin(pulse) * 0.4;

          indicator.clear();
          indicator.lineStyle(thickness, color, alpha);
          indicator.drawRoundedRect(3, 3, this.CELL_SIZE - 6, this.CELL_SIZE - 6, 8);

          requestAnimationFrame(animatePulse);
        };
        animatePulse();

        cell.sprite.addChild(indicator);
        cell.sprite.selectedIndicator = indicator;
      }
    });
  }

  attemptMerge() {
    const [cell1, cell2] = this.selectedCells;
    const cocktail1 = this.grid[cell1.row][cell1.col].cocktail;
    const cocktail2 = this.grid[cell2.row][cell2.col].cocktail;

    // Check if cocktails are the same type
    if (cocktail1 && cocktail2 && cocktail1.id === cocktail2.id) {
      // Valid merge - create higher value cocktail
      const nextCocktailIndex = Math.min(cocktail1.id, this.cocktailTypes.length - 1);
      const newCocktail = this.cocktailTypes[nextCocktailIndex];

      // Update score
      this.score += newCocktail.value * 10;
      this.updateScoreDisplay();

      // Remove the two selected cocktails
      this.removeCocktailAt(cell1.row, cell1.col);
      this.removeCocktailAt(cell2.row, cell2.col);

      // Place new merged cocktail in first position
      this.grid[cell1.row][cell1.col].cocktail = newCocktail;
      if (this.grid[cell1.row][cell1.col].sprite) {
        this.gridContainer.removeChild(this.grid[cell1.row][cell1.col].sprite);
      }

      // Create new sprite for merged cocktail
      this.createCocktailAt(cell1.row, cell1.col);

      // Add visual effect for merge
      this.showMergeEffect(cell1.row, cell1.col);

      // Clear selections
      this.selectedCells = [];
      this.updateSelectionVisuals();

      // Add new random cocktail to empty space
      this.fillEmptySpaces();
    } else {
      // Invalid merge - clear selections
      this.selectedCells = [];
      this.updateSelectionVisuals();
    }
  }

  removeCocktailAt(row, col) {
    const cell = this.grid[row][col];
    if (cell.sprite) {
      this.gridContainer.removeChild(cell.sprite);
      cell.sprite = null;
      cell.cocktail = null;
    }
  }

  showMergeEffect(row, col) {
    const cell = this.grid[row][col];

    // Create a more elaborate merge effect
    const effectContainer = new PIXI.Container();
    this.app.stage.addChild(effectContainer);

    // Center position
    const centerX = cell.x + this.CELL_SIZE / 2;
    const centerY = cell.y + this.CELL_SIZE / 2;

    // Create a multi-layered effect
    // Outer glow
    const outerGlow = new PIXI.Graphics();
    outerGlow.beginFill(0xffff00, 0.3);
    outerGlow.drawCircle(centerX, centerY, 20);
    outerGlow.endFill();
    effectContainer.addChild(outerGlow);

    // Main expanding circle
    const mainCircle = new PIXI.Graphics();
    mainCircle.lineStyle(4, 0xffff00, 1);
    mainCircle.beginFill(0xffff00, 0.4);
    mainCircle.drawCircle(centerX, centerY, 10);
    mainCircle.endFill();
    effectContainer.addChild(mainCircle);

    // Inner particles
    const particles = [];
    for (let i = 0; i < 12; i++) {
      const particle = new PIXI.Graphics();
      particle.beginFill(0xffffff, 0.9);
      particle.drawCircle(centerX, centerY, 4);
      particle.endFill();
      effectContainer.addChild(particle);
      particles.push({
        graphic: particle,
        angle: (i * Math.PI * 2) / 12,
        distance: 0,
        speed: 3,
        size: Math.random() * 3 + 2,
      });
    }

    // Animate the effect
    let scale = 0.1;
    let time = 0;
    const animate = () => {
      if (time > 45) {
        // Run for about 0.75 seconds at 60fps
        this.app.stage.removeChild(effectContainer);
        return;
      }

      // Scale and fade effects
      scale += 0.15;
      const alpha = 1 - time / 45;

      mainCircle.scale.set(scale);
      mainCircle.alpha = alpha;

      outerGlow.scale.set(scale * 0.8);
      outerGlow.alpha = alpha * 0.5;

      // Move particles outward with rotation
      particles.forEach((p, idx) => {
        p.distance += p.speed;
        const angleOffset = time * 0.1; // Rotation effect
        const x = centerX + Math.cos(p.angle + angleOffset) * p.distance;
        const y = centerY + Math.sin(p.angle + angleOffset) * p.distance;
        p.graphic.x = x;
        p.graphic.y = y;
        p.graphic.alpha = alpha * 0.8;
      });

      time++;
      requestAnimationFrame(animate);
    };
    animate();
  }

  fillEmptySpaces() {
    // Find empty cells and fill them
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (!this.grid[row][col].cocktail) {
          this.createCocktailAt(row, col);
        }
      }
    }
  }

  startGame() {
    this.gameActive = true;
    this.gameOver = false;
    this.score = 0;
    this.timeLeft = this.GAME_DURATION;
    this.selectedCells = [];

    // Update displays
    this.updateScoreDisplay();
    this.updateTimerDisplay();

    // Hide game over screen
    document.getElementById('game-over').style.display = 'none';

    // Start timer
    this.gameTimer = setInterval(() => {
      this.timeLeft--;
      this.updateTimerDisplay();

      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  endGame() {
    this.gameActive = false;
    this.gameOver = true;

    // Clear timer
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }

    // Show game over screen
    document.getElementById('final-score').textContent = `Score: ${this.score}`;
    document.getElementById('game-over').style.display = 'flex';
  }

  updateScoreDisplay() {
    document.getElementById('score-display').textContent = `Score: ${this.score}`;

    // Add celebration effect for high scores
    if (this.score > 0 && this.score % 100 === 0) {
      this.showCelebrationEffect();
    }
  }

  showCelebrationEffect() {
    // Create celebration particles using object pooling for performance
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        // Get or create a particle from the pool
        let particle;
        if (this.particlePool.length > 0) {
          particle = this.particlePool.pop();
          particle.clear();
        } else {
          particle = new PIXI.Graphics();
        }

        // Set particle properties
        const color = Math.random() * 0xffffff;
        const size = Math.random() * 5 + 2;
        particle.beginFill(color);
        particle.drawCircle(0, 0, size);
        particle.endFill();

        // Position
        particle.x = Math.random() * this.app.screen.width;
        particle.y = Math.random() * this.app.screen.height;

        this.app.stage.addChild(particle);

        // Animate particle
        let posX = particle.x;
        let posY = particle.y;
        let velX = (Math.random() - 0.5) * 8;
        let velY = (Math.random() - 0.5) * 8 - 2; // Slight upward bias
        let alpha = 1;
        let life = 100; // Frames to live

        const animateParticle = () => {
          if (life <= 0) {
            // Return particle to pool instead of creating new ones
            this.app.stage.removeChild(particle);
            particle.clear();
            this.particlePool.push(particle);
            return;
          }

          posX += velX;
          posY += velY;
          velY += 0.1; // Gravity
          alpha -= 0.01;
          life--;

          particle.x = posX;
          particle.y = posY;
          particle.alpha = alpha;

          requestAnimationFrame(animateParticle);
        };
        animateParticle();
      }, i * 60); // Stagger the particles
    }
  }

  updateTimerDisplay() {
    document.getElementById('timer-display').textContent = `${this.timeLeft}s`;
  }

  setupEventListeners() {
    // Restart button
    document.getElementById('restart-btn').addEventListener('click', () => {
      this.startGame();
    });

    // AI Hint button
    document.getElementById('ai-hint-btn').addEventListener('click', () => {
      this.showAIHint();
    });
  }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
  const game = new CocktailMergeGame();

  // Store game instance globally for debugging
  window.cocktailGame = game;
});
