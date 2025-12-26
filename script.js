// ============================================
// A* PATHFINDING ALGORITHM
// ============================================

class AStarVisualizer {
    constructor() {
        this.canvas = document.getElementById('astar-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.cellSize = this.canvas.width / this.gridSize;
        this.grid = [];
        this.start = { x: 2, y: 2 };
        this.end = { x: 17, y: 17 };
        this.walls = new Set();
        this.isDrawing = false;
        this.isDragging = null;
        this.animationSpeed = 50;

        this.initGrid();
        this.setupEventListeners();
        this.draw();
    }

    initGrid() {
        this.grid = [];
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = {
                    x, y,
                    g: Infinity,
                    h: 0,
                    f: Infinity,
                    parent: null,
                    visited: false
                };
            }
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());

        document.getElementById('grid-size').addEventListener('input', (e) => {
            this.gridSize = parseInt(e.target.value);
            document.getElementById('grid-size-value').textContent = `${this.gridSize}x${this.gridSize}`;
            this.cellSize = this.canvas.width / this.gridSize;
            this.walls.clear();
            this.initGrid();
            this.draw();
        });

        document.getElementById('animation-speed').addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = `${this.animationSpeed}ms`;
        });

        document.getElementById('astar-start').addEventListener('click', () => this.runAStar());
        document.getElementById('astar-reset').addEventListener('click', () => this.reset());
        document.getElementById('astar-clear-walls').addEventListener('click', () => {
            this.walls.clear();
            this.draw();
        });
    }

    getCellFromMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Account for canvas scaling - convert mouse position to canvas coordinates
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;

        const x = Math.floor(canvasX / this.cellSize);
        const y = Math.floor(canvasY / this.cellSize);

        // Ensure coordinates are within bounds
        return {
            x: Math.max(0, Math.min(x, this.gridSize - 1)),
            y: Math.max(0, Math.min(y, this.gridSize - 1))
        };
    }

    handleMouseDown(e) {
        const cell = this.getCellFromMouse(e);

        if (cell.x === this.start.x && cell.y === this.start.y) {
            this.isDragging = 'start';
        } else if (cell.x === this.end.x && cell.y === this.end.y) {
            this.isDragging = 'end';
        } else {
            this.isDrawing = true;
            this.toggleWall(cell);
        }
    }

    handleMouseMove(e) {
        const cell = this.getCellFromMouse(e);

        if (this.isDragging === 'start') {
            this.start = cell;
            this.draw();
        } else if (this.isDragging === 'end') {
            this.end = cell;
            this.draw();
        } else if (this.isDrawing) {
            this.toggleWall(cell);
        }
    }

    handleMouseUp() {
        this.isDrawing = false;
        this.isDragging = null;
    }

    toggleWall(cell) {
        const key = `${cell.x},${cell.y}`;
        if ((cell.x !== this.start.x || cell.y !== this.start.y) &&
            (cell.x !== this.end.x || cell.y !== this.end.y)) {
            if (this.walls.has(key)) {
                this.walls.delete(key);
            } else {
                this.walls.add(key);
            }
            this.draw();
        }
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, { x: 1, y: 0 },
            { x: 0, y: 1 }, { x: -1, y: 0 }
        ];

        for (const dir of directions) {
            const x = node.x + dir.x;
            const y = node.y + dir.y;

            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                if (!this.walls.has(`${x},${y}`)) {
                    neighbors.push(this.grid[y][x]);
                }
            }
        }

        return neighbors;
    }

    async runAStar() {
        this.initGrid();
        const startTime = performance.now();

        const openSet = [];
        const startNode = this.grid[this.start.y][this.start.x];
        const endNode = this.grid[this.end.y][this.end.x];

        startNode.g = 0;
        startNode.h = this.heuristic(startNode, endNode);
        startNode.f = startNode.h;
        openSet.push(startNode);

        let visitedCount = 0;

        while (openSet.length > 0) {
            // Find node with lowest f score
            let current = openSet[0];
            let currentIndex = 0;

            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < current.f) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }

            // Reached the goal
            if (current.x === endNode.x && current.y === endNode.y) {
                const path = this.reconstructPath(current);
                await this.animatePath(path);

                const endTime = performance.now();
                document.getElementById('astar-visited').textContent = visitedCount;
                document.getElementById('astar-path-length').textContent = path.length;
                document.getElementById('astar-time').textContent = `${(endTime - startTime).toFixed(2)}ms`;
                return;
            }

            openSet.splice(currentIndex, 1);
            current.visited = true;
            visitedCount++;

            // Visualize
            this.draw();
            await this.sleep(this.animationSpeed);

            const neighbors = this.getNeighbors(current);

            for (const neighbor of neighbors) {
                if (neighbor.visited) continue;

                const tentativeG = current.g + 1;

                if (tentativeG < neighbor.g) {
                    neighbor.parent = current;
                    neighbor.g = tentativeG;
                    neighbor.h = this.heuristic(neighbor, endNode);
                    neighbor.f = neighbor.g + neighbor.h;

                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        // No path found
        alert('No se encontró un camino!');
    }

    reconstructPath(node) {
        const path = [];
        let current = node;

        while (current !== null) {
            path.unshift(current);
            current = current.parent;
        }

        return path;
    }

    async animatePath(path) {
        for (const node of path) {
            node.isPath = true;
            this.draw();
            await this.sleep(30);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset() {
        this.initGrid();
        document.getElementById('astar-visited').textContent = '0';
        document.getElementById('astar-path-length').textContent = '0';
        document.getElementById('astar-time').textContent = '0ms';
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const node = this.grid[y][x];
                const px = x * this.cellSize;
                const py = y * this.cellSize;

                // Draw cell background
                if (node.isPath) {
                    this.ctx.fillStyle = '#667eea';
                } else if (node.visited) {
                    this.ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
                } else if (this.walls.has(`${x},${y}`)) {
                    this.ctx.fillStyle = '#2d3748';
                } else {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
                }

                this.ctx.fillRect(px, py, this.cellSize, this.cellSize);

                // Draw grid lines
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.strokeRect(px, py, this.cellSize, this.cellSize);
            }
        }

        // Draw start
        const startPx = this.start.x * this.cellSize;
        const startPy = this.start.y * this.cellSize;
        this.ctx.fillStyle = '#43e97b';
        this.ctx.beginPath();
        this.ctx.arc(startPx + this.cellSize / 2, startPy + this.cellSize / 2, this.cellSize / 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw end
        const endPx = this.end.x * this.cellSize;
        const endPy = this.end.y * this.cellSize;
        this.ctx.fillStyle = '#f5576c';
        this.ctx.beginPath();
        this.ctx.arc(endPx + this.cellSize / 2, endPy + this.cellSize / 2, this.cellSize / 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

// ============================================
// HILL CLIMBING ALGORITHM
// ============================================

class HillClimbingVisualizer {
    constructor() {
        this.canvas = document.getElementById('hillclimbing-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stepSize = 0.1;
        this.maxIterations = 100;
        this.currentFunction = 'quadratic';
        this.history = [];

        this.setupEventListeners();
        this.drawFunction();
    }

    setupEventListeners() {
        document.getElementById('hc-function').addEventListener('change', (e) => {
            this.currentFunction = e.target.value;
            this.drawFunction();
        });

        document.getElementById('hc-step-size').addEventListener('input', (e) => {
            this.stepSize = parseFloat(e.target.value);
            document.getElementById('hc-step-value').textContent = this.stepSize.toFixed(2);
        });

        document.getElementById('hc-max-iterations').addEventListener('input', (e) => {
            this.maxIterations = parseInt(e.target.value);
            document.getElementById('hc-iterations-value').textContent = this.maxIterations;
        });

        document.getElementById('hc-start').addEventListener('click', () => this.runHillClimbing());
        document.getElementById('hc-reset').addEventListener('click', () => this.reset());
    }

    evaluateFunction(x) {
        switch (this.currentFunction) {
            case 'quadratic':
                return -(x - 5) * (x - 5) + 25;
            case 'sine':
                return Math.sin(x) * 10 + 15;
            case 'rastrigin':
                return 20 - (x * x - 10 * Math.cos(2 * Math.PI * x));
            default:
                return 0;
        }
    }

    async runHillClimbing() {
        this.history = [];
        let current = Math.random() * 10;
        let currentValue = this.evaluateFunction(current);
        this.history.push({ x: current, y: currentValue });

        let iterations = 0;

        for (let i = 0; i < this.maxIterations; i++) {
            // Try neighbors
            const neighbor1 = current + this.stepSize;
            const neighbor2 = current - this.stepSize;

            const value1 = this.evaluateFunction(neighbor1);
            const value2 = this.evaluateFunction(neighbor2);

            let bestNeighbor = current;
            let bestValue = currentValue;

            if (value1 > bestValue && neighbor1 >= 0 && neighbor1 <= 10) {
                bestNeighbor = neighbor1;
                bestValue = value1;
            }

            if (value2 > bestValue && neighbor2 >= 0 && neighbor2 <= 10) {
                bestNeighbor = neighbor2;
                bestValue = value2;
            }

            // No improvement found
            if (bestValue <= currentValue) {
                break;
            }

            current = bestNeighbor;
            currentValue = bestValue;
            this.history.push({ x: current, y: currentValue });
            iterations++;

            this.drawFunction();
            await this.sleep(100);
        }

        document.getElementById('hc-iterations').textContent = iterations;
        document.getElementById('hc-best-value').textContent = currentValue.toFixed(3);
        document.getElementById('hc-position').textContent = current.toFixed(3);
    }

    reset() {
        this.history = [];
        document.getElementById('hc-iterations').textContent = '0';
        document.getElementById('hc-best-value').textContent = '-';
        document.getElementById('hc-position').textContent = '-';
        this.drawFunction();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    drawFunction() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const padding = 40;
        const width = this.canvas.width - 2 * padding;
        const height = this.canvas.height - 2 * padding;

        // Draw axes
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(padding, this.canvas.height - padding);
        this.ctx.lineTo(this.canvas.width - padding, this.canvas.height - padding);
        this.ctx.moveTo(padding, padding);
        this.ctx.lineTo(padding, this.canvas.height - padding);
        this.ctx.stroke();

        // Draw function
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        for (let px = 0; px <= width; px++) {
            const x = (px / width) * 10;
            const y = this.evaluateFunction(x);
            const py = this.canvas.height - padding - ((y + 10) / 40) * height;

            if (px === 0) {
                this.ctx.moveTo(padding + px, py);
            } else {
                this.ctx.lineTo(padding + px, py);
            }
        }
        this.ctx.stroke();

        // Draw history
        if (this.history.length > 0) {
            for (let i = 0; i < this.history.length; i++) {
                const point = this.history[i];
                const px = padding + (point.x / 10) * width;
                const py = this.canvas.height - padding - ((point.y + 10) / 40) * height;

                // Draw line
                if (i > 0) {
                    const prevPoint = this.history[i - 1];
                    const prevPx = padding + (prevPoint.x / 10) * width;
                    const prevPy = this.canvas.height - padding - ((prevPoint.y + 10) / 40) * height;

                    this.ctx.strokeStyle = '#43e97b';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(prevPx, prevPy);
                    this.ctx.lineTo(px, py);
                    this.ctx.stroke();
                }

                // Draw point
                this.ctx.fillStyle = i === this.history.length - 1 ? '#f5576c' : '#43e97b';
                this.ctx.beginPath();
                this.ctx.arc(px, py, 6, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
}

// ============================================
// SIMULATED ANNEALING ALGORITHM
// ============================================

class SimulatedAnnealingVisualizer {
    constructor() {
        this.canvas = document.getElementById('annealing-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tempInitial = 100;
        this.coolingRate = 0.95;
        this.maxIterations = 200;
        this.currentFunction = 'quadratic';
        this.history = [];

        this.setupEventListeners();
        this.drawFunction();
    }

    setupEventListeners() {
        document.getElementById('sa-function').addEventListener('change', (e) => {
            this.currentFunction = e.target.value;
            this.drawFunction();
        });

        document.getElementById('sa-temp-initial').addEventListener('input', (e) => {
            this.tempInitial = parseFloat(e.target.value);
            document.getElementById('sa-temp-initial-value').textContent = this.tempInitial;
        });

        document.getElementById('sa-cooling-rate').addEventListener('input', (e) => {
            this.coolingRate = parseFloat(e.target.value);
            document.getElementById('sa-cooling-value').textContent = this.coolingRate;
        });

        document.getElementById('sa-max-iterations').addEventListener('input', (e) => {
            this.maxIterations = parseInt(e.target.value);
            document.getElementById('sa-iterations-value').textContent = this.maxIterations;
        });

        document.getElementById('sa-start').addEventListener('click', () => this.runSimulatedAnnealing());
        document.getElementById('sa-reset').addEventListener('click', () => this.reset());
    }

    evaluateFunction(x) {
        switch (this.currentFunction) {
            case 'quadratic':
                return -(x - 5) * (x - 5) + 25;
            case 'sine':
                return Math.sin(x) * 10 + 15;
            case 'rastrigin':
                return 20 - (x * x - 10 * Math.cos(2 * Math.PI * x));
            default:
                return 0;
        }
    }

    async runSimulatedAnnealing() {
        this.history = [];
        let current = Math.random() * 10;
        let currentValue = this.evaluateFunction(current);
        let best = current;
        let bestValue = currentValue;

        this.history.push({ x: current, y: currentValue, accepted: true });

        let temperature = this.tempInitial;
        let acceptances = 0;

        for (let i = 0; i < this.maxIterations; i++) {
            // Generate neighbor
            const neighbor = current + (Math.random() - 0.5) * 2;

            if (neighbor < 0 || neighbor > 10) continue;

            const neighborValue = this.evaluateFunction(neighbor);
            const delta = neighborValue - currentValue;

            // Accept or reject
            let accepted = false;
            if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
                current = neighbor;
                currentValue = neighborValue;
                accepted = true;
                acceptances++;

                if (currentValue > bestValue) {
                    best = current;
                    bestValue = currentValue;
                }
            }

            this.history.push({ x: current, y: currentValue, accepted });

            // Cool down
            temperature *= this.coolingRate;

            // Update UI
            const tempBar = document.getElementById('temp-bar');
            const tempValue = document.getElementById('temp-value');
            tempBar.style.width = `${(temperature / this.tempInitial) * 100}%`;
            tempValue.textContent = temperature.toFixed(1);

            this.drawFunction();
            await this.sleep(50);
        }

        document.getElementById('sa-iterations').textContent = this.maxIterations;
        document.getElementById('sa-best-value').textContent = bestValue.toFixed(3);
        document.getElementById('sa-position').textContent = best.toFixed(3);
        document.getElementById('sa-acceptances').textContent = acceptances;
    }

    reset() {
        this.history = [];
        document.getElementById('sa-iterations').textContent = '0';
        document.getElementById('sa-best-value').textContent = '-';
        document.getElementById('sa-position').textContent = '-';
        document.getElementById('sa-acceptances').textContent = '0';
        document.getElementById('temp-bar').style.width = '100%';
        document.getElementById('temp-value').textContent = this.tempInitial;
        this.drawFunction();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    drawFunction() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const padding = 40;
        const width = this.canvas.width - 2 * padding;
        const height = this.canvas.height - 2 * padding;

        // Draw axes
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(padding, this.canvas.height - padding);
        this.ctx.lineTo(this.canvas.width - padding, this.canvas.height - padding);
        this.ctx.moveTo(padding, padding);
        this.ctx.lineTo(padding, this.canvas.height - padding);
        this.ctx.stroke();

        // Draw function
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        for (let px = 0; px <= width; px++) {
            const x = (px / width) * 10;
            const y = this.evaluateFunction(x);
            const py = this.canvas.height - padding - ((y + 10) / 40) * height;

            if (px === 0) {
                this.ctx.moveTo(padding + px, py);
            } else {
                this.ctx.lineTo(padding + px, py);
            }
        }
        this.ctx.stroke();

        // Draw history
        if (this.history.length > 0) {
            for (let i = 0; i < this.history.length; i++) {
                const point = this.history[i];
                const px = padding + (point.x / 10) * width;
                const py = this.canvas.height - padding - ((point.y + 10) / 40) * height;

                // Draw line
                if (i > 0) {
                    const prevPoint = this.history[i - 1];
                    const prevPx = padding + (prevPoint.x / 10) * width;
                    const prevPy = this.canvas.height - padding - ((prevPoint.y + 10) / 40) * height;

                    this.ctx.strokeStyle = point.accepted ? 'rgba(67, 233, 123, 0.5)' : 'rgba(245, 87, 108, 0.3)';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(prevPx, prevPy);
                    this.ctx.lineTo(px, py);
                    this.ctx.stroke();
                }

                // Draw point
                if (point.accepted) {
                    this.ctx.fillStyle = i === this.history.length - 1 ? '#f5576c' : 'rgba(67, 233, 123, 0.6)';
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, 4, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
    }
}

// ============================================
// GENETIC ALGORITHM
// ============================================

class GeneticAlgorithmVisualizer {
    constructor() {
        this.canvas = document.getElementById('genetic-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.populationSize = 50;
        this.mutationRate = 0.1;
        this.crossoverRate = 0.8;
        this.generations = 30;
        this.currentFunction = 'quadratic';
        this.population = [];
        this.generationHistory = [];
        this.currentGeneration = 0;

        this.setupEventListeners();
        this.drawFunction();
    }

    setupEventListeners() {
        document.getElementById('ga-function').addEventListener('change', (e) => {
            this.currentFunction = e.target.value;
            this.drawFunction();
        });

        document.getElementById('ga-population-size').addEventListener('input', (e) => {
            this.populationSize = parseInt(e.target.value);
            document.getElementById('ga-population-value').textContent = this.populationSize;
        });

        document.getElementById('ga-mutation-rate').addEventListener('input', (e) => {
            this.mutationRate = parseFloat(e.target.value);
            document.getElementById('ga-mutation-value').textContent = this.mutationRate.toFixed(2);
        });

        document.getElementById('ga-crossover-rate').addEventListener('input', (e) => {
            this.crossoverRate = parseFloat(e.target.value);
            document.getElementById('ga-crossover-value').textContent = this.crossoverRate.toFixed(2);
        });

        document.getElementById('ga-generations').addEventListener('input', (e) => {
            this.generations = parseInt(e.target.value);
            document.getElementById('ga-generations-value').textContent = this.generations;
        });

        document.getElementById('ga-start').addEventListener('click', () => this.runGeneticAlgorithm());
        document.getElementById('ga-reset').addEventListener('click', () => this.reset());
    }

    evaluateFunction(x) {
        switch (this.currentFunction) {
            case 'quadratic':
                return -(x - 5) * (x - 5) + 25;
            case 'sine':
                return Math.sin(x) * 10 + 15;
            case 'rastrigin':
                return 20 - (x * x - 10 * Math.cos(2 * Math.PI * x));
            default:
                return 0;
        }
    }

    initializePopulation() {
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            const x = Math.random() * 10;
            this.population.push({
                x: x,
                fitness: this.evaluateFunction(x)
            });
        }
    }

    tournamentSelection() {
        const tournamentSize = 3;
        let best = this.population[Math.floor(Math.random() * this.population.length)];

        for (let i = 1; i < tournamentSize; i++) {
            const competitor = this.population[Math.floor(Math.random() * this.population.length)];
            if (competitor.fitness > best.fitness) {
                best = competitor;
            }
        }

        return { ...best }; // Return a copy
    }

    crossover(parent1, parent2) {
        if (Math.random() < this.crossoverRate) {
            const alpha = Math.random();
            const childX = alpha * parent1.x + (1 - alpha) * parent2.x;
            return {
                x: childX,
                fitness: this.evaluateFunction(childX)
            };
        }
        return { ...parent1 };
    }

    mutate(individual) {
        if (Math.random() < this.mutationRate) {
            // Gaussian mutation
            const sigma = 0.5;
            const mutation = this.gaussianRandom(0, sigma);
            let newX = individual.x + mutation;

            // Keep within bounds
            newX = Math.max(0, Math.min(10, newX));

            return {
                x: newX,
                fitness: this.evaluateFunction(newX)
            };
        }
        return individual;
    }

    gaussianRandom(mean, sigma) {
        // Box-Muller transform
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return mean + sigma * z0;
    }

    getBestIndividual() {
        return this.population.reduce((best, ind) =>
            ind.fitness > best.fitness ? ind : best
        );
    }

    getAverageFitness() {
        const sum = this.population.reduce((acc, ind) => acc + ind.fitness, 0);
        return sum / this.population.length;
    }

    async runGeneticAlgorithm() {
        this.initializePopulation();
        this.generationHistory = [];
        this.currentGeneration = 0;

        for (let gen = 0; gen < this.generations; gen++) {
            this.currentGeneration = gen + 1;

            // Store statistics
            const best = this.getBestIndividual();
            const avgFitness = this.getAverageFitness();
            this.generationHistory.push({
                generation: gen + 1,
                bestFitness: best.fitness,
                avgFitness: avgFitness
            });

            // Create new population
            const newPopulation = [];

            // Elitism: keep the best individual
            newPopulation.push({ ...best });

            // Generate rest of population
            while (newPopulation.length < this.populationSize) {
                const parent1 = this.tournamentSelection();
                const parent2 = this.tournamentSelection();

                let child = this.crossover(parent1, parent2);
                child = this.mutate(child);

                newPopulation.push(child);
            }

            this.population = newPopulation;

            // Update UI
            this.updateStats();
            this.drawFunction();
            await this.sleep(100);
        }

        // Final update
        this.updateStats();
        this.drawFunction();
    }

    updateStats() {
        const best = this.getBestIndividual();
        const avgFitness = this.getAverageFitness();

        document.getElementById('ga-generation').textContent = this.currentGeneration;
        document.getElementById('ga-best-fitness').textContent = best.fitness.toFixed(3);
        document.getElementById('ga-avg-fitness').textContent = avgFitness.toFixed(3);
        document.getElementById('ga-best-position').textContent = best.x.toFixed(3);
    }

    reset() {
        this.population = [];
        this.generationHistory = [];
        this.currentGeneration = 0;
        document.getElementById('ga-generation').textContent = '0';
        document.getElementById('ga-best-fitness').textContent = '-';
        document.getElementById('ga-avg-fitness').textContent = '-';
        document.getElementById('ga-best-position').textContent = '-';
        this.drawFunction();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    drawFunction() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const padding = 40;
        const width = this.canvas.width - 2 * padding;
        const height = this.canvas.height - 2 * padding;

        // Draw axes
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(padding, this.canvas.height - padding);
        this.ctx.lineTo(this.canvas.width - padding, this.canvas.height - padding);
        this.ctx.moveTo(padding, padding);
        this.ctx.lineTo(padding, this.canvas.height - padding);
        this.ctx.stroke();

        // Draw function
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        for (let px = 0; px <= width; px++) {
            const x = (px / width) * 10;
            const y = this.evaluateFunction(x);
            const py = this.canvas.height - padding - ((y + 10) / 40) * height;

            if (px === 0) {
                this.ctx.moveTo(padding + px, py);
            } else {
                this.ctx.lineTo(padding + px, py);
            }
        }
        this.ctx.stroke();

        // Draw population
        if (this.population.length > 0) {
            const best = this.getBestIndividual();

            for (const individual of this.population) {
                const px = padding + (individual.x / 10) * width;
                const py = this.canvas.height - padding - ((individual.fitness + 10) / 40) * height;

                // Draw individual
                const isBest = individual.x === best.x && individual.fitness === best.fitness;
                this.ctx.fillStyle = isBest ? '#f5576c' : 'rgba(67, 233, 123, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(px, py, isBest ? 8 : 5, 0, Math.PI * 2);
                this.ctx.fill();

                // Add glow to best
                if (isBest) {
                    this.ctx.strokeStyle = '#f5576c';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(px, py, 12, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }

            // Draw generation info
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = '14px Inter';
            this.ctx.fillText(`Generación: ${this.currentGeneration}`, padding + 10, padding + 20);
            this.ctx.fillText(`Población: ${this.population.length}`, padding + 10, padding + 40);
        }
    }
}

// ============================================
// PARTICLE SWARM OPTIMIZATION
// ============================================

class ParticleSwarmVisualizer {
    constructor() {
        this.canvas = document.getElementById('pso-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.numParticles = 30;
        this.inertia = 0.7;
        this.cognitive = 1.5;
        this.social = 1.5;
        this.maxIterations = 100;
        this.currentFunction = 'quadratic';
        this.particles = [];
        this.globalBest = null;
        this.currentIteration = 0;

        this.setupEventListeners();
        this.drawFunction();
    }

    setupEventListeners() {
        document.getElementById('pso-function').addEventListener('change', (e) => {
            this.currentFunction = e.target.value;
            this.drawFunction();
        });

        document.getElementById('pso-num-particles').addEventListener('input', (e) => {
            this.numParticles = parseInt(e.target.value);
            document.getElementById('pso-particles-value').textContent = this.numParticles;
        });

        document.getElementById('pso-inertia').addEventListener('input', (e) => {
            this.inertia = parseFloat(e.target.value);
            document.getElementById('pso-inertia-value').textContent = this.inertia.toFixed(1);
        });

        document.getElementById('pso-cognitive').addEventListener('input', (e) => {
            this.cognitive = parseFloat(e.target.value);
            document.getElementById('pso-cognitive-value').textContent = this.cognitive.toFixed(1);
        });

        document.getElementById('pso-social').addEventListener('input', (e) => {
            this.social = parseFloat(e.target.value);
            document.getElementById('pso-social-value').textContent = this.social.toFixed(1);
        });

        document.getElementById('pso-iterations').addEventListener('input', (e) => {
            this.maxIterations = parseInt(e.target.value);
            document.getElementById('pso-iterations-value').textContent = this.maxIterations;
        });

        document.getElementById('pso-start').addEventListener('click', () => this.runPSO());
        document.getElementById('pso-reset').addEventListener('click', () => this.reset());
    }

    evaluateFunction(x) {
        switch (this.currentFunction) {
            case 'quadratic':
                return -(x - 5) * (x - 5) + 25;
            case 'sine':
                return Math.sin(x) * 10 + 15;
            case 'rastrigin':
                return 20 - (x * x - 10 * Math.cos(2 * Math.PI * x));
            default:
                return 0;
        }
    }

    initializeSwarm() {
        this.particles = [];
        for (let i = 0; i < this.numParticles; i++) {
            const x = Math.random() * 10;
            const particle = {
                x: x,
                velocity: (Math.random() - 0.5) * 2,
                fitness: this.evaluateFunction(x),
                bestX: x,
                bestFitness: this.evaluateFunction(x)
            };
            this.particles.push(particle);
        }

        // Find global best
        this.globalBest = this.particles.reduce((best, p) =>
            p.fitness > best.fitness ? p : best
        );
    }

    async runPSO() {
        this.initializeSwarm();
        this.currentIteration = 0;

        for (let iter = 0; iter < this.maxIterations; iter++) {
            this.currentIteration = iter + 1;

            // Update each particle
            for (const particle of this.particles) {
                // Update velocity
                const r1 = Math.random();
                const r2 = Math.random();

                const cognitiveComponent = this.cognitive * r1 * (particle.bestX - particle.x);
                const socialComponent = this.social * r2 * (this.globalBest.x - particle.x);

                particle.velocity = this.inertia * particle.velocity + cognitiveComponent + socialComponent;

                // Limit velocity
                particle.velocity = Math.max(-2, Math.min(2, particle.velocity));

                // Update position
                particle.x += particle.velocity;

                // Keep within bounds
                particle.x = Math.max(0, Math.min(10, particle.x));

                // Evaluate fitness
                particle.fitness = this.evaluateFunction(particle.x);

                // Update personal best
                if (particle.fitness > particle.bestFitness) {
                    particle.bestX = particle.x;
                    particle.bestFitness = particle.fitness;
                }

                // Update global best
                if (particle.fitness > this.globalBest.fitness) {
                    this.globalBest = {
                        x: particle.x,
                        fitness: particle.fitness
                    };
                }
            }

            // Update UI
            this.updateStats();
            this.drawFunction();
            await this.sleep(50);
        }
    }

    updateStats() {
        document.getElementById('pso-iteration').textContent = this.currentIteration;
        document.getElementById('pso-best-fitness').textContent = this.globalBest.fitness.toFixed(3);
        document.getElementById('pso-best-position').textContent = this.globalBest.x.toFixed(3);
    }

    reset() {
        this.particles = [];
        this.globalBest = null;
        this.currentIteration = 0;
        document.getElementById('pso-iteration').textContent = '0';
        document.getElementById('pso-best-fitness').textContent = '-';
        document.getElementById('pso-best-position').textContent = '-';
        this.drawFunction();
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    drawFunction() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const padding = 40;
        const width = this.canvas.width - 2 * padding;
        const height = this.canvas.height - 2 * padding;

        // Draw axes
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(padding, this.canvas.height - padding);
        this.ctx.lineTo(this.canvas.width - padding, this.canvas.height - padding);
        this.ctx.moveTo(padding, padding);
        this.ctx.lineTo(padding, this.canvas.height - padding);
        this.ctx.stroke();

        // Draw function
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        for (let px = 0; px <= width; px++) {
            const x = (px / width) * 10;
            const y = this.evaluateFunction(x);
            const py = this.canvas.height - padding - ((y + 10) / 40) * height;

            if (px === 0) {
                this.ctx.moveTo(padding + px, py);
            } else {
                this.ctx.lineTo(padding + px, py);
            }
        }
        this.ctx.stroke();

        // Draw particles
        if (this.particles.length > 0) {
            for (const particle of this.particles) {
                const px = padding + (particle.x / 10) * width;
                const py = this.canvas.height - padding - ((particle.fitness + 10) / 40) * height;

                // Draw particle
                const isGlobalBest = particle.x === this.globalBest.x && particle.fitness === this.globalBest.fitness;
                this.ctx.fillStyle = isGlobalBest ? '#f5576c' : 'rgba(67, 233, 123, 0.7)';
                this.ctx.beginPath();
                this.ctx.arc(px, py, isGlobalBest ? 8 : 5, 0, Math.PI * 2);
                this.ctx.fill();

                // Draw velocity vector
                if (!isGlobalBest) {
                    const velocityScale = 20;
                    this.ctx.strokeStyle = 'rgba(67, 233, 123, 0.5)';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(px, py);
                    this.ctx.lineTo(px + particle.velocity * velocityScale, py);
                    this.ctx.stroke();
                }
            }

            // Draw iteration info
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = '14px Inter';
            this.ctx.fillText(`Iteración: ${this.currentIteration}`, padding + 10, padding + 20);
            this.ctx.fillText(`Partículas: ${this.particles.length}`, padding + 10, padding + 40);
        }
    }
}

// ============================================
// TAB SWITCHING FUNCTION
// ============================================

function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Show selected tab content
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    const clickedButton = event.target.closest('.tab-button');
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
}

// ============================================
// TOGGLE PSEUDOCODE FUNCTION
// ============================================

function togglePseudocode(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');

    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
        // Collapse: set to 0
        content.style.maxHeight = '0px';
        icon.textContent = '▶';
    } else {
        // Expand: set to scrollHeight
        content.style.maxHeight = content.scrollHeight + 'px';
        icon.textContent = '▼';
    }
}

// Initialize pseudocode panels as collapsed
function initPseudocodePanels() {
    const panels = document.querySelectorAll('.pseudocode-content');
    panels.forEach(panel => {
        panel.style.maxHeight = '0px';
    });
}

// ============================================
// BASIC ALGORITHMS
// ============================================

// Linear Search
class LinearSearchVisualizer {
    constructor() {
        this.canvas = document.getElementById('linear-search-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.array = [];
        this.arraySize = 10;
        this.target = 42;
        this.currentIndex = -1;
        this.found = false;
        this.comparisons = 0;

        this.setupEventListeners();
        this.generateArray();
    }

    setupEventListeners() {
        document.getElementById('ls-array-size').addEventListener('input', (e) => {
            this.arraySize = parseInt(e.target.value);
            document.getElementById('ls-size-value').textContent = this.arraySize;
        });

        document.getElementById('ls-target').addEventListener('input', (e) => {
            this.target = parseInt(e.target.value);
        });

        document.getElementById('ls-start').addEventListener('click', () => this.search());
        document.getElementById('ls-reset').addEventListener('click', () => this.generateArray());
    }

    generateArray() {
        this.array = [];
        for (let i = 0; i < this.arraySize; i++) {
            this.array.push(Math.floor(Math.random() * 100) + 1);
        }
        this.currentIndex = -1;
        this.found = false;
        this.comparisons = 0;
        document.getElementById('ls-comparisons').textContent = '0';
        document.getElementById('ls-result').textContent = '-';
        this.draw();
    }

    async search() {
        this.comparisons = 0;
        this.found = false;

        for (let i = 0; i < this.array.length; i++) {
            this.currentIndex = i;
            this.comparisons++;
            document.getElementById('ls-comparisons').textContent = this.comparisons;
            this.draw();
            await this.sleep(300);

            if (this.array[i] === this.target) {
                this.found = true;
                document.getElementById('ls-result').textContent = `Encontrado en posición ${i}`;
                this.draw();
                return;
            }
        }

        this.currentIndex = -1;
        document.getElementById('ls-result').textContent = 'No encontrado';
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const cellWidth = Math.min(50, (this.canvas.width - 40) / this.array.length);
        const startX = (this.canvas.width - cellWidth * this.array.length) / 2;
        const startY = this.canvas.height / 2 - 30;

        for (let i = 0; i < this.array.length; i++) {
            const x = startX + i * cellWidth;

            // Draw cell
            if (i === this.currentIndex) {
                this.ctx.fillStyle = this.found ? '#43e97b' : '#f5576c';
            } else {
                this.ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
            }
            this.ctx.fillRect(x, startY, cellWidth - 2, 60);

            // Draw border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, startY, cellWidth - 2, 60);

            // Draw value
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.array[i], x + cellWidth / 2 - 1, startY + 38);

            // Draw index
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.font = '12px Inter';
            this.ctx.fillText(i, x + cellWidth / 2 - 1, startY + 80);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Binary Search
class BinarySearchVisualizer {
    constructor() {
        this.canvas = document.getElementById('binary-search-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.array = [];
        this.arraySize = 15;
        this.target = 50;
        this.left = -1;
        this.right = -1;
        this.mid = -1;
        this.found = false;
        this.comparisons = 0;

        this.setupEventListeners();
        this.generateArray();
    }

    setupEventListeners() {
        document.getElementById('bs-array-size').addEventListener('input', (e) => {
            this.arraySize = parseInt(e.target.value);
            document.getElementById('bs-size-value').textContent = this.arraySize;
        });

        document.getElementById('bs-target').addEventListener('input', (e) => {
            this.target = parseInt(e.target.value);
        });

        document.getElementById('bs-start').addEventListener('click', () => this.search());
        document.getElementById('bs-reset').addEventListener('click', () => this.generateArray());
    }

    generateArray() {
        this.array = [];
        for (let i = 0; i < this.arraySize; i++) {
            this.array.push(Math.floor(Math.random() * 100) + 1);
        }
        this.array.sort((a, b) => a - b);
        this.left = -1;
        this.right = -1;
        this.mid = -1;
        this.found = false;
        this.comparisons = 0;
        document.getElementById('bs-comparisons').textContent = '0';
        document.getElementById('bs-result').textContent = '-';
        this.draw();
    }

    async search() {
        this.comparisons = 0;
        this.found = false;
        this.left = 0;
        this.right = this.array.length - 1;

        while (this.left <= this.right) {
            this.mid = Math.floor((this.left + this.right) / 2);
            this.comparisons++;
            document.getElementById('bs-comparisons').textContent = this.comparisons;
            this.draw();
            await this.sleep(500);

            if (this.array[this.mid] === this.target) {
                this.found = true;
                document.getElementById('bs-result').textContent = `Encontrado en posición ${this.mid}`;
                this.draw();
                return;
            }

            if (this.array[this.mid] < this.target) {
                this.left = this.mid + 1;
            } else {
                this.right = this.mid - 1;
            }
        }

        this.left = -1;
        this.right = -1;
        this.mid = -1;
        document.getElementById('bs-result').textContent = 'No encontrado';
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const cellWidth = Math.min(40, (this.canvas.width - 40) / this.array.length);
        const startX = (this.canvas.width - cellWidth * this.array.length) / 2;
        const startY = this.canvas.height / 2 - 30;

        for (let i = 0; i < this.array.length; i++) {
            const x = startX + i * cellWidth;

            // Draw cell
            if (i === this.mid) {
                this.ctx.fillStyle = this.found ? '#43e97b' : '#f5576c';
            } else if (i >= this.left && i <= this.right) {
                this.ctx.fillStyle = 'rgba(102, 126, 234, 0.5)';
            } else {
                this.ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
            }
            this.ctx.fillRect(x, startY, cellWidth - 2, 60);

            // Draw border
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, startY, cellWidth - 2, 60);

            // Draw value
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '14px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.array[i], x + cellWidth / 2 - 1, startY + 38);

            // Draw index
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.font = '11px Inter';
            this.ctx.fillText(i, x + cellWidth / 2 - 1, startY + 80);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Bubble Sort
class BubbleSortVisualizer {
    constructor() {
        this.canvas = document.getElementById('bubble-sort-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.array = [];
        this.arraySize = 10;
        this.speed = 100;
        this.comparisons = 0;
        this.swaps = 0;

        this.setupEventListeners();
        this.generateArray();
    }

    setupEventListeners() {
        document.getElementById('bubble-array-size').addEventListener('input', (e) => {
            this.arraySize = parseInt(e.target.value);
            document.getElementById('bubble-size-value').textContent = this.arraySize;
        });

        document.getElementById('bubble-speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('bubble-speed-value').textContent = this.speed + 'ms';
        });

        document.getElementById('bubble-start').addEventListener('click', () => this.sort());
        document.getElementById('bubble-reset').addEventListener('click', () => this.generateArray());
    }

    generateArray() {
        this.array = [];
        for (let i = 0; i < this.arraySize; i++) {
            this.array.push(Math.floor(Math.random() * 100) + 10);
        }
        this.comparisons = 0;
        this.swaps = 0;
        document.getElementById('bubble-comparisons').textContent = '0';
        document.getElementById('bubble-swaps').textContent = '0';
        this.draw();
    }

    async sort() {
        this.comparisons = 0;
        this.swaps = 0;
        const n = this.array.length;

        for (let i = 0; i < n - 1; i++) {
            let swapped = false;

            for (let j = 0; j < n - i - 1; j++) {
                this.comparisons++;
                document.getElementById('bubble-comparisons').textContent = this.comparisons;

                this.draw(j, j + 1, n - i);
                await this.sleep(this.speed);

                if (this.array[j] > this.array[j + 1]) {
                    // Swap
                    [this.array[j], this.array[j + 1]] = [this.array[j + 1], this.array[j]];
                    swapped = true;
                    this.swaps++;
                    document.getElementById('bubble-swaps').textContent = this.swaps;
                    this.draw(j, j + 1, n - i);
                    await this.sleep(this.speed);
                }
            }

            if (!swapped) break;
        }

        this.draw(-1, -1, 0);
    }

    draw(compareIdx1 = -1, compareIdx2 = -1, sortedFrom = 0) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const barWidth = (this.canvas.width - 80) / this.array.length;
        const maxHeight = this.canvas.height - 80;

        for (let i = 0; i < this.array.length; i++) {
            const x = 40 + i * barWidth;
            const height = (this.array[i] / 110) * maxHeight;
            const y = this.canvas.height - 40 - height;

            // Color based on state
            if (i >= this.array.length - sortedFrom + 1) {
                this.ctx.fillStyle = '#43e97b'; // Sorted
            } else if (i === compareIdx1 || i === compareIdx2) {
                this.ctx.fillStyle = '#f5576c'; // Comparing
            } else {
                this.ctx.fillStyle = 'rgba(102, 126, 234, 0.7)';
            }

            this.ctx.fillRect(x, y, barWidth - 4, height);

            // Draw value
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.array[i], x + barWidth / 2 - 2, y - 5);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Selection Sort
class SelectionSortVisualizer {
    constructor() {
        this.canvas = document.getElementById('selection-sort-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.array = [];
        this.arraySize = 10;
        this.speed = 100;
        this.comparisons = 0;
        this.swaps = 0;

        this.setupEventListeners();
        this.generateArray();
    }

    setupEventListeners() {
        document.getElementById('selection-array-size').addEventListener('input', (e) => {
            this.arraySize = parseInt(e.target.value);
            document.getElementById('selection-size-value').textContent = this.arraySize;
        });

        document.getElementById('selection-speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('selection-speed-value').textContent = this.speed + 'ms';
        });

        document.getElementById('selection-start').addEventListener('click', () => this.sort());
        document.getElementById('selection-reset').addEventListener('click', () => this.generateArray());
    }

    generateArray() {
        this.array = [];
        for (let i = 0; i < this.arraySize; i++) {
            this.array.push(Math.floor(Math.random() * 100) + 10);
        }
        this.comparisons = 0;
        this.swaps = 0;
        document.getElementById('selection-comparisons').textContent = '0';
        document.getElementById('selection-swaps').textContent = '0';
        this.draw();
    }

    async sort() {
        this.comparisons = 0;
        this.swaps = 0;
        const n = this.array.length;

        for (let i = 0; i < n - 1; i++) {
            let minIdx = i;

            for (let j = i + 1; j < n; j++) {
                this.comparisons++;
                document.getElementById('selection-comparisons').textContent = this.comparisons;

                this.draw(i, j, minIdx, i);
                await this.sleep(this.speed);

                if (this.array[j] < this.array[minIdx]) {
                    minIdx = j;
                }
            }

            if (minIdx !== i) {
                [this.array[i], this.array[minIdx]] = [this.array[minIdx], this.array[i]];
                this.swaps++;
                document.getElementById('selection-swaps').textContent = this.swaps;
                this.draw(i, -1, minIdx, i);
                await this.sleep(this.speed);
            }
        }

        this.draw(-1, -1, -1, n);
    }

    draw(currentIdx = -1, compareIdx = -1, minIdx = -1, sortedUntil = 0) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const barWidth = (this.canvas.width - 80) / this.array.length;
        const maxHeight = this.canvas.height - 80;

        for (let i = 0; i < this.array.length; i++) {
            const x = 40 + i * barWidth;
            const height = (this.array[i] / 110) * maxHeight;
            const y = this.canvas.height - 40 - height;

            // Color based on state
            if (i < sortedUntil) {
                this.ctx.fillStyle = '#43e97b'; // Sorted
            } else if (i === minIdx) {
                this.ctx.fillStyle = '#f5576c'; // Current minimum
            } else if (i === currentIdx) {
                this.ctx.fillStyle = '#ffd93d'; // Current position
            } else if (i === compareIdx) {
                this.ctx.fillStyle = 'rgba(245, 87, 108, 0.5)'; // Comparing
            } else {
                this.ctx.fillStyle = 'rgba(102, 126, 234, 0.7)';
            }

            this.ctx.fillRect(x, y, barWidth - 4, height);

            // Draw value
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.array[i], x + barWidth / 2 - 2, y - 5);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Insertion Sort
class InsertionSortVisualizer {
    constructor() {
        this.canvas = document.getElementById('insertion-sort-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.array = [];
        this.arraySize = 10;
        this.speed = 100;
        this.comparisons = 0;
        this.shifts = 0;

        this.setupEventListeners();
        this.generateArray();
    }

    setupEventListeners() {
        document.getElementById('insertion-array-size').addEventListener('input', (e) => {
            this.arraySize = parseInt(e.target.value);
            document.getElementById('insertion-size-value').textContent = this.arraySize;
        });

        document.getElementById('insertion-speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('insertion-speed-value').textContent = this.speed + 'ms';
        });

        document.getElementById('insertion-start').addEventListener('click', () => this.sort());
        document.getElementById('insertion-reset').addEventListener('click', () => this.generateArray());
    }

    generateArray() {
        this.array = [];
        for (let i = 0; i < this.arraySize; i++) {
            this.array.push(Math.floor(Math.random() * 100) + 10);
        }
        this.comparisons = 0;
        this.shifts = 0;
        document.getElementById('insertion-comparisons').textContent = '0';
        document.getElementById('insertion-shifts').textContent = '0';
        this.draw();
    }

    async sort() {
        this.comparisons = 0;
        this.shifts = 0;
        const n = this.array.length;

        for (let i = 1; i < n; i++) {
            const key = this.array[i];
            let j = i - 1;

            this.draw(i, j, -1, i);
            await this.sleep(this.speed);

            while (j >= 0) {
                this.comparisons++;
                document.getElementById('insertion-comparisons').textContent = this.comparisons;

                this.draw(i, j, -1, i);
                await this.sleep(this.speed);

                if (this.array[j] > key) {
                    this.array[j + 1] = this.array[j];
                    this.shifts++;
                    document.getElementById('insertion-shifts').textContent = this.shifts;
                    j--;
                } else {
                    break;
                }
            }

            this.array[j + 1] = key;
            this.draw(-1, -1, -1, i + 1);
            await this.sleep(this.speed);
        }

        this.draw(-1, -1, -1, n);
    }

    draw(keyIdx = -1, compareIdx = -1, shiftIdx = -1, sortedUntil = 0) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const barWidth = (this.canvas.width - 80) / this.array.length;
        const maxHeight = this.canvas.height - 80;

        for (let i = 0; i < this.array.length; i++) {
            const x = 40 + i * barWidth;
            const height = (this.array[i] / 110) * maxHeight;
            const y = this.canvas.height - 40 - height;

            if (i < sortedUntil) {
                this.ctx.fillStyle = '#43e97b';
            } else if (i === keyIdx) {
                this.ctx.fillStyle = '#ffd93d';
            } else if (i === compareIdx) {
                this.ctx.fillStyle = '#f5576c';
            } else {
                this.ctx.fillStyle = 'rgba(102, 126, 234, 0.7)';
            }

            this.ctx.fillRect(x, y, barWidth - 4, height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.array[i], x + barWidth / 2 - 2, y - 5);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Merge Sort
class MergeSortVisualizer {
    constructor() {
        this.canvas = document.getElementById('merge-sort-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.array = [];
        this.arraySize = 10;
        this.speed = 100;
        this.comparisons = 0;
        this.merges = 0;

        this.setupEventListeners();
        this.generateArray();
    }

    setupEventListeners() {
        document.getElementById('merge-array-size').addEventListener('input', (e) => {
            this.arraySize = parseInt(e.target.value);
            document.getElementById('merge-size-value').textContent = this.arraySize;
        });

        document.getElementById('merge-speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('merge-speed-value').textContent = this.speed + 'ms';
        });

        document.getElementById('merge-start').addEventListener('click', () => this.sort());
        document.getElementById('merge-reset').addEventListener('click', () => this.generateArray());
    }

    generateArray() {
        this.array = [];
        for (let i = 0; i < this.arraySize; i++) {
            this.array.push(Math.floor(Math.random() * 100) + 10);
        }
        this.comparisons = 0;
        this.merges = 0;
        document.getElementById('merge-comparisons').textContent = '0';
        document.getElementById('merge-merges').textContent = '0';
        this.draw();
    }

    async sort() {
        this.comparisons = 0;
        this.merges = 0;
        await this.mergeSort(0, this.array.length - 1);
        this.draw(-1, -1, this.array.length);
    }

    async mergeSort(left, right) {
        if (left < right) {
            const mid = Math.floor((left + right) / 2);
            await this.mergeSort(left, mid);
            await this.mergeSort(mid + 1, right);
            await this.merge(left, mid, right);
        }
    }

    async merge(left, mid, right) {
        const leftArr = this.array.slice(left, mid + 1);
        const rightArr = this.array.slice(mid + 1, right + 1);

        let i = 0, j = 0, k = left;

        while (i < leftArr.length && j < rightArr.length) {
            this.comparisons++;
            document.getElementById('merge-comparisons').textContent = this.comparisons;

            this.draw(k, left, right);
            await this.sleep(this.speed);

            if (leftArr[i] <= rightArr[j]) {
                this.array[k] = leftArr[i];
                i++;
            } else {
                this.array[k] = rightArr[j];
                j++;
            }
            k++;
        }

        while (i < leftArr.length) {
            this.array[k] = leftArr[i];
            i++;
            k++;
        }

        while (j < rightArr.length) {
            this.array[k] = rightArr[j];
            j++;
            k++;
        }

        this.merges++;
        document.getElementById('merge-merges').textContent = this.merges;
        this.draw(-1, left, right);
        await this.sleep(this.speed);
    }

    draw(currentIdx = -1, mergeStart = -1, mergeEnd = -1) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const barWidth = (this.canvas.width - 80) / this.array.length;
        const maxHeight = this.canvas.height - 80;

        for (let i = 0; i < this.array.length; i++) {
            const x = 40 + i * barWidth;
            const height = (this.array[i] / 110) * maxHeight;
            const y = this.canvas.height - 40 - height;

            if (i === currentIdx) {
                this.ctx.fillStyle = '#ffd93d';
            } else if (i >= mergeStart && i <= mergeEnd) {
                this.ctx.fillStyle = '#43e97b';
            } else {
                this.ctx.fillStyle = 'rgba(102, 126, 234, 0.7)';
            }

            this.ctx.fillRect(x, y, barWidth - 4, height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.array[i], x + barWidth / 2 - 2, y - 5);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Quick Sort
class QuickSortVisualizer {
    constructor() {
        this.canvas = document.getElementById('quick-sort-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.array = [];
        this.arraySize = 10;
        this.speed = 100;
        this.comparisons = 0;
        this.swaps = 0;

        this.setupEventListeners();
        this.generateArray();
    }

    setupEventListeners() {
        document.getElementById('quick-array-size').addEventListener('input', (e) => {
            this.arraySize = parseInt(e.target.value);
            document.getElementById('quick-size-value').textContent = this.arraySize;
        });

        document.getElementById('quick-speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('quick-speed-value').textContent = this.speed + 'ms';
        });

        document.getElementById('quick-start').addEventListener('click', () => this.sort());
        document.getElementById('quick-reset').addEventListener('click', () => this.generateArray());
    }

    generateArray() {
        this.array = [];
        for (let i = 0; i < this.arraySize; i++) {
            this.array.push(Math.floor(Math.random() * 100) + 10);
        }
        this.comparisons = 0;
        this.swaps = 0;
        document.getElementById('quick-comparisons').textContent = '0';
        document.getElementById('quick-swaps').textContent = '0';
        this.draw();
    }

    async sort() {
        this.comparisons = 0;
        this.swaps = 0;
        await this.quickSort(0, this.array.length - 1);
        this.draw(-1, -1, -1, this.array.length);
    }

    async quickSort(low, high) {
        if (low < high) {
            const pi = await this.partition(low, high);
            await this.quickSort(low, pi - 1);
            await this.quickSort(pi + 1, high);
        }
    }

    async partition(low, high) {
        const pivot = this.array[high];
        let i = low - 1;

        for (let j = low; j < high; j++) {
            this.comparisons++;
            document.getElementById('quick-comparisons').textContent = this.comparisons;

            this.draw(j, high, i + 1, 0);
            await this.sleep(this.speed);

            if (this.array[j] < pivot) {
                i++;
                [this.array[i], this.array[j]] = [this.array[j], this.array[i]];
                this.swaps++;
                document.getElementById('quick-swaps').textContent = this.swaps;

                this.draw(j, high, i, 0);
                await this.sleep(this.speed);
            }
        }

        [this.array[i + 1], this.array[high]] = [this.array[high], this.array[i + 1]];
        this.swaps++;
        document.getElementById('quick-swaps').textContent = this.swaps;

        this.draw(-1, -1, i + 1, 0);
        await this.sleep(this.speed);

        return i + 1;
    }

    draw(currentIdx = -1, pivotIdx = -1, partitionIdx = -1, sortedUntil = 0) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const barWidth = (this.canvas.width - 80) / this.array.length;
        const maxHeight = this.canvas.height - 80;

        for (let i = 0; i < this.array.length; i++) {
            const x = 40 + i * barWidth;
            const height = (this.array[i] / 110) * maxHeight;
            const y = this.canvas.height - 40 - height;

            if (i >= sortedUntil && sortedUntil > 0) {
                this.ctx.fillStyle = '#43e97b';
            } else if (i === pivotIdx) {
                this.ctx.fillStyle = '#f5576c';
            } else if (i === currentIdx) {
                this.ctx.fillStyle = '#ffd93d';
            } else if (i === partitionIdx) {
                this.ctx.fillStyle = '#ff8b94';
            } else {
                this.ctx.fillStyle = 'rgba(102, 126, 234, 0.7)';
            }

            this.ctx.fillRect(x, y, barWidth - 4, height);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.array[i], x + barWidth / 2 - 2, y - 5);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================
// K-MEANS CLUSTERING
// ============================================

class KMeansVisualizer {
    constructor() {
        this.canvas = document.getElementById('kmeans-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.centroids = [];
        this.k = 3;
        this.numPoints = 150;
        this.speed = 500;
        this.iteration = 0;
        this.isRunning = false;
        this.converged = false;

        // Cluster colors
        this.colors = [
            '#ff6b6b', // Red
            '#4ecdc4', // Teal
            '#ffe66d', // Yellow
            '#a8e6cf', // Green
            '#ff8b94', // Pink
            '#c7ceea', // Lavender
            '#ffd93d', // Gold
            '#6bcf7f'  // Mint
        ];

        this.setupEventListeners();
        this.generatePoints();
    }

    setupEventListeners() {
        document.getElementById('kmeans-k').addEventListener('input', (e) => {
            this.k = parseInt(e.target.value);
            document.getElementById('kmeans-k-value').textContent = this.k;
        });

        document.getElementById('kmeans-points').addEventListener('input', (e) => {
            this.numPoints = parseInt(e.target.value);
            document.getElementById('kmeans-points-value').textContent = this.numPoints;
        });

        document.getElementById('kmeans-speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('kmeans-speed-value').textContent = this.speed + 'ms';
        });

        document.getElementById('kmeans-generate').addEventListener('click', () => this.generatePoints());
        document.getElementById('kmeans-start').addEventListener('click', () => this.runKMeans());
        document.getElementById('kmeans-reset').addEventListener('click', () => this.reset());
    }

    generatePoints() {
        this.points = [];
        this.centroids = [];
        this.iteration = 0;
        this.converged = false;

        // Generate random clusters for more interesting visualization
        const numClusters = Math.floor(Math.random() * 3) + 2; // 2-4 natural clusters

        for (let c = 0; c < numClusters; c++) {
            const centerX = 100 + Math.random() * 400;
            const centerY = 100 + Math.random() * 300;
            const spread = 30 + Math.random() * 40;
            const pointsInCluster = Math.floor(this.numPoints / numClusters);

            for (let i = 0; i < pointsInCluster; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * spread;
                this.points.push({
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius,
                    cluster: -1
                });
            }
        }

        // Fill remaining points
        while (this.points.length < this.numPoints) {
            this.points.push({
                x: 50 + Math.random() * 500,
                y: 50 + Math.random() * 400,
                cluster: -1
            });
        }

        this.updateStatus('Puntos generados');
        document.getElementById('kmeans-iteration').textContent = '0';
        document.getElementById('kmeans-convergence').textContent = '-';
        this.draw();
    }

    initializeCentroids() {
        this.centroids = [];
        // K-means++ initialization for better initial centroids

        // First centroid: random point
        const firstIdx = Math.floor(Math.random() * this.points.length);
        this.centroids.push({
            x: this.points[firstIdx].x,
            y: this.points[firstIdx].y
        });

        // Remaining centroids: choose points far from existing centroids
        for (let i = 1; i < this.k; i++) {
            let maxDist = -1;
            let farthestPoint = null;

            for (const point of this.points) {
                // Find minimum distance to any existing centroid
                let minDistToCentroid = Infinity;
                for (const centroid of this.centroids) {
                    const dist = this.distance(point, centroid);
                    minDistToCentroid = Math.min(minDistToCentroid, dist);
                }

                // Keep track of point with maximum minimum distance
                if (minDistToCentroid > maxDist) {
                    maxDist = minDistToCentroid;
                    farthestPoint = point;
                }
            }

            this.centroids.push({
                x: farthestPoint.x,
                y: farthestPoint.y
            });
        }
    }

    distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    assignClusters() {
        let changed = false;

        for (const point of this.points) {
            let minDist = Infinity;
            let closestCluster = 0;

            // Find closest centroid
            for (let i = 0; i < this.centroids.length; i++) {
                const dist = this.distance(point, this.centroids[i]);
                if (dist < minDist) {
                    minDist = dist;
                    closestCluster = i;
                }
            }

            if (point.cluster !== closestCluster) {
                changed = true;
                point.cluster = closestCluster;
            }
        }

        return changed;
    }

    updateCentroids() {
        const newCentroids = [];

        for (let k = 0; k < this.k; k++) {
            const clusterPoints = this.points.filter(p => p.cluster === k);

            if (clusterPoints.length > 0) {
                const sumX = clusterPoints.reduce((sum, p) => sum + p.x, 0);
                const sumY = clusterPoints.reduce((sum, p) => sum + p.y, 0);

                newCentroids.push({
                    x: sumX / clusterPoints.length,
                    y: sumY / clusterPoints.length
                });
            } else {
                // Keep old centroid if cluster is empty
                newCentroids.push({ ...this.centroids[k] });
            }
        }

        // Check convergence
        let converged = true;
        for (let i = 0; i < this.k; i++) {
            const dist = this.distance(this.centroids[i], newCentroids[i]);
            if (dist > 0.1) {
                converged = false;
                break;
            }
        }

        this.centroids = newCentroids;
        return converged;
    }

    async runKMeans() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.iteration = 0;
        this.converged = false;

        // Initialize centroids
        this.initializeCentroids();
        this.updateStatus('Ejecutando...');
        this.draw();
        await this.sleep(this.speed);

        // Main K-means loop
        const maxIterations = 50;
        while (this.iteration < maxIterations && !this.converged) {
            this.iteration++;
            document.getElementById('kmeans-iteration').textContent = this.iteration;

            // Assignment step
            const changed = this.assignClusters();
            this.draw();
            await this.sleep(this.speed);

            if (!changed) {
                this.converged = true;
                break;
            }

            // Update step
            const converged = this.updateCentroids();
            this.draw();
            await this.sleep(this.speed);

            if (converged) {
                this.converged = true;
                break;
            }
        }

        this.isRunning = false;

        if (this.converged) {
            this.updateStatus('Convergido ✓');
            document.getElementById('kmeans-convergence').textContent = `Sí (iter ${this.iteration})`;
        } else {
            this.updateStatus('Máx iteraciones');
            document.getElementById('kmeans-convergence').textContent = 'No';
        }
    }

    updateStatus(status) {
        document.getElementById('kmeans-status').textContent = status;
    }

    reset() {
        this.isRunning = false;
        this.iteration = 0;
        this.converged = false;
        this.centroids = [];

        for (const point of this.points) {
            point.cluster = -1;
        }

        document.getElementById('kmeans-iteration').textContent = '0';
        document.getElementById('kmeans-status').textContent = 'Listo';
        document.getElementById('kmeans-convergence').textContent = '-';
        this.draw();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw points
        for (const point of this.points) {
            if (point.cluster >= 0 && point.cluster < this.colors.length) {
                this.ctx.fillStyle = this.colors[point.cluster];
            } else {
                this.ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
            }

            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw centroids
        for (let i = 0; i < this.centroids.length; i++) {
            const centroid = this.centroids[i];

            // Draw outer glow
            this.ctx.fillStyle = this.colors[i] + '40';
            this.ctx.beginPath();
            this.ctx.arc(centroid.x, centroid.y, 20, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw centroid star
            this.ctx.fillStyle = '#fff';
            this.ctx.strokeStyle = this.colors[i];
            this.ctx.lineWidth = 3;

            // Draw star shape
            const spikes = 5;
            const outerRadius = 12;
            const innerRadius = 6;

            this.ctx.beginPath();
            for (let j = 0; j < spikes * 2; j++) {
                const radius = j % 2 === 0 ? outerRadius : innerRadius;
                const angle = (j * Math.PI) / spikes - Math.PI / 2;
                const x = centroid.x + Math.cos(angle) * radius;
                const y = centroid.y + Math.sin(angle) * radius;

                if (j === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================
// INITIALIZE ALL VISUALIZERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Basic Algorithms
    new LinearSearchVisualizer();
    new BinarySearchVisualizer();

    // Sorting Algorithms
    new BubbleSortVisualizer();
    new SelectionSortVisualizer();
    new InsertionSortVisualizer();
    new MergeSortVisualizer();
    new QuickSortVisualizer();

    // Heuristic Algorithms
    new AStarVisualizer();
    new HillClimbingVisualizer();
    new SimulatedAnnealingVisualizer();

    // Evolutionary Algorithms
    new GeneticAlgorithmVisualizer();
    new ParticleSwarmVisualizer();

    // Machine Learning Algorithms
    new KMeansVisualizer();

    // Initialize pseudocode panels
    initPseudocodePanels();
});
