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
// INITIALIZE ALL VISUALIZERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    new AStarVisualizer();
    new HillClimbingVisualizer();
    new SimulatedAnnealingVisualizer();
});
