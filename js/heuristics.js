/* ==========================================================================
   heuristics.js — A*, Hill Climbing y Recocido Simulado.
   ========================================================================== */

/* ---------------------------------------------------------------------------
   A* sobre un grid con obstáculos. Inicio y final se arrastran con ratón,
   dedo o lápiz; pintar o borrar muros arrastrando.
   --------------------------------------------------------------------------- */
class AStarVisualizer extends Visualizer {
    constructor() {
        super('astar-canvas', { start: 'astar-start', reset: 'astar-reset' });
        this.gridSize = numberOf('grid-size', 20);
        this.animationSpeed = numberOf('animation-speed', 50);
        this.startCell = { x: 2, y: 2 };
        this.endCell = { x: 17, y: 17 };
        this.walls = new Set();
        this.grid = [];
        this.dragging = null; // 'start' | 'end' | null
        this.painting = false;
        this.paintValue = true; // true: pintar muros; false: borrarlos
        this.lastCellKey = null;

        bindControl('grid-size', {
            label: 'grid-size-value',
            format: (v) => `${v}x${v}`,
            onChange: (v) => this.setGridSize(v),
        });
        bindControl('animation-speed', {
            label: 'speed-value',
            format: (v) => `${v}ms`,
            onChange: (v) => (this.animationSpeed = v),
        });
        bindClick('astar-clear-walls', () => this.clearWalls());

        // Pointer events cubren ratón, táctil y lápiz
        this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
        this.canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
        this.canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));
        this.canvas.addEventListener('pointercancel', (e) => this.handlePointerUp(e));

        this.initGrid();
        this.mount();
    }

    // ---- Estado del grid -------------------------------------------------

    initGrid() {
        this.grid = Array.from({ length: this.gridSize }, (_, y) =>
            Array.from({ length: this.gridSize }, (_, x) => ({
                x,
                y,
                g: Infinity,
                f: Infinity,
                parent: null,
                visited: false,
                isPath: false,
            }))
        );
    }

    setGridSize(size) {
        this.cancel();
        this.gridSize = size;
        this.walls.clear();
        this.clampEndpoints();
        this.initGrid();
        this.draw();
    }

    // Al reducir el grid, inicio y final se llevan al borde válido más cercano
    clampEndpoints() {
        const max = this.gridSize - 1;
        const fit = (cell) => ({ x: Math.min(cell.x, max), y: Math.min(cell.y, max) });
        this.startCell = fit(this.startCell);
        this.endCell = fit(this.endCell);
        if (this.isSameCell(this.startCell, this.endCell)) {
            this.endCell = this.isSameCell(this.startCell, { x: max, y: max }) ? { x: 0, y: 0 } : { x: max, y: max };
        }
    }

    clearWalls() {
        this.cancel();
        this.walls.clear();
        this.draw();
    }

    reset() {
        this.cancel();
        this.initGrid();
        setText('astar-visited', 0);
        setText('astar-path-length', 0);
        setText('astar-time', '0ms');
        this.setMessage('');
        this.draw();
    }

    // ---- Interacción -----------------------------------------------------

    // Durante una búsqueda el grid no se edita para no mezclar estados
    isEditable() {
        return !this.running;
    }

    getCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const cellPx = this.canvas.width / this.gridSize;
        const x = Math.floor(((e.clientX - rect.left) * (this.canvas.width / rect.width)) / cellPx);
        const y = Math.floor(((e.clientY - rect.top) * (this.canvas.height / rect.height)) / cellPx);
        return { x: clamp(x, 0, this.gridSize - 1), y: clamp(y, 0, this.gridSize - 1) };
    }

    handlePointerDown(e) {
        if (!this.isEditable()) return;
        // El puntero queda capturado: el arrastre sigue aunque el dedo salga del canvas
        this.canvas.setPointerCapture(e.pointerId);
        const cell = this.getCell(e);

        if (this.isSameCell(cell, this.startCell)) {
            this.dragging = 'start';
        } else if (this.isSameCell(cell, this.endCell)) {
            this.dragging = 'end';
        } else {
            // La primera celda decide si el arrastre pinta muros o los borra
            this.painting = true;
            this.paintValue = !this.walls.has(this.cellKey(cell));
            this.lastCellKey = this.cellKey(cell);
            this.paintCell(cell);
        }
    }

    handlePointerMove(e) {
        if (!this.isEditable()) return;
        const cell = this.getCell(e);

        if (this.dragging) {
            this.moveEndpoint(this.dragging, cell);
        } else if (this.painting) {
            // Solo actúa al cambiar de celda; si no, cada movimiento dentro de la celda la alternaría
            const key = this.cellKey(cell);
            if (key === this.lastCellKey) return;
            this.lastCellKey = key;
            this.paintCell(cell);
        }
    }

    handlePointerUp(e) {
        if (this.canvas.hasPointerCapture(e.pointerId)) {
            this.canvas.releasePointerCapture(e.pointerId);
        }
        this.painting = false;
        this.dragging = null;
        this.lastCellKey = null;
    }

    cellKey(cell) {
        return `${cell.x},${cell.y}`;
    }

    isSameCell(a, b) {
        return a.x === b.x && a.y === b.y;
    }

    paintCell(cell) {
        if (this.isSameCell(cell, this.startCell) || this.isSameCell(cell, this.endCell)) return;
        if (this.paintValue) this.walls.add(this.cellKey(cell));
        else this.walls.delete(this.cellKey(cell));
        this.draw();
    }

    moveEndpoint(which, cell) {
        const other = which === 'start' ? this.endCell : this.startCell;
        if (this.isSameCell(cell, other)) return; // inicio y final nunca comparten celda
        this.walls.delete(this.cellKey(cell)); // un extremo no puede quedar sobre un muro
        if (which === 'start') this.startCell = { ...cell };
        else this.endCell = { ...cell };
        this.draw();
    }

    // ---- Búsqueda --------------------------------------------------------

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    neighbors(node) {
        const result = [];
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
            const x = node.x + dx;
            const y = node.y + dy;
            const inside = x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
            if (inside && !this.walls.has(this.cellKey({ x, y }))) result.push(this.grid[y][x]);
        }
        return result;
    }

    start() {
        return this.run((id) => this.searchPath(id));
    }

    async searchPath(id) {
        this.setMessage('');
        this.initGrid();
        const t0 = performance.now();
        const startNode = this.grid[this.startCell.y][this.startCell.x];
        const endNode = this.grid[this.endCell.y][this.endCell.x];
        const open = [startNode];
        startNode.g = 0;
        startNode.f = this.heuristic(startNode, endNode);
        let visited = 0;

        while (open.length > 0) {
            // Se expande el nodo abierto con menor f
            let bestIndex = 0;
            for (let i = 1; i < open.length; i++) {
                if (open[i].f < open[bestIndex].f) bestIndex = i;
            }
            const current = open.splice(bestIndex, 1)[0];

            if (current === endNode) {
                const path = this.reconstructPath(current);
                for (const node of path) {
                    node.isPath = true;
                    this.draw();
                    if (!(await this.step(id, 30))) return;
                }
                this.showFound(path.length - 1, visited, t0);
                return;
            }

            current.visited = true;
            visited++;
            this.draw();
            if (!(await this.step(id, this.animationSpeed))) return;

            for (const next of this.neighbors(current)) {
                if (next.visited) continue;
                const tentative = current.g + 1;
                if (tentative < next.g) {
                    next.parent = current;
                    next.g = tentative;
                    next.f = tentative + this.heuristic(next, endNode);
                    if (!open.includes(next)) open.push(next);
                }
            }
        }

        this.showNoPath(visited, t0);
    }

    reconstructPath(node) {
        const path = [];
        for (let n = node; n; n = n.parent) path.unshift(n);
        return path;
    }

    showFound(steps, visited, t0) {
        setText('astar-visited', visited);
        setText('astar-path-length', steps);
        setText('astar-time', `${(performance.now() - t0).toFixed(2)}ms`);
    }

    showNoPath(visited, t0) {
        setText('astar-visited', visited);
        setText('astar-path-length', 'Sin camino');
        setText('astar-time', `${(performance.now() - t0).toFixed(2)}ms`);
        this.setMessage('No hay camino entre el inicio y el final. Quita algunos obstáculos o mueve un extremo.');
    }

    setMessage(text) {
        setText('astar-message', text);
    }

    // ---- Dibujo ----------------------------------------------------------

    draw() {
        this.clear();
        const { ctx, gridSize } = this;
        const cell = this.canvas.width / gridSize;

        // Primero el fondo, los nodos explorados y el camino
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (this.walls.has(this.cellKey({ x, y }))) continue;
                const node = this.grid[y][x];
                ctx.fillStyle = node.isPath
                    ? COLORS.primary
                    : node.visited
                      ? 'rgba(255, 42, 74, 0.3)'
                      : 'rgba(255, 255, 255, 0.02)';
                ctx.fillRect(x * cell, y * cell, cell, cell);
                ctx.strokeStyle = COLORS.gridLine;
                ctx.strokeRect(x * cell, y * cell, cell, cell);
            }
        }

        // Muros encima, para que se vean aunque la búsqueda haya pasado por ellos
        ctx.fillStyle = COLORS.wall;
        ctx.strokeStyle = COLORS.gridLine;
        for (const key of this.walls) {
            const [x, y] = key.split(',').map(Number);
            ctx.fillRect(x * cell, y * cell, cell, cell);
            ctx.strokeRect(x * cell, y * cell, cell, cell);
        }

        const center = (c) => [(c.x + 0.5) * cell, (c.y + 0.5) * cell];
        this.circle(...center(this.startCell), cell / 3, COLORS.accent);
        this.circle(...center(this.endCell), cell / 3, COLORS.danger);
    }
}

/* ---------------------------------------------------------------------------
   Hill Climbing: siempre se mueve al vecino que mejora; se atasca en máximos locales.
   --------------------------------------------------------------------------- */
class HillClimbingVisualizer extends FunctionVisualizer {
    constructor() {
        super('hillclimbing-canvas', { start: 'hc-start', reset: 'hc-reset', fn: 'hc-function' });
        this.stepSize = numberOf('hc-step-size', 0.1);
        this.maxIterations = numberOf('hc-max-iterations', 100);
        bindControl('hc-step-size', {
            label: 'hc-step-value',
            format: (v) => v.toFixed(2),
            onChange: (v) => (this.stepSize = v),
        });
        bindControl('hc-max-iterations', {
            label: 'hc-iterations-value',
            onChange: (v) => (this.maxIterations = v),
        });
        this.reset();
        this.mount();
    }

    reset() {
        this.cancel();
        this.history = [];
        setText('hc-iterations', 0);
        setText('hc-best-value', '-');
        setText('hc-position', '-');
        this.draw();
    }

    start() {
        return this.run(async (id) => {
            this.history = [];
            let current = Math.random() * 10;
            let value = this.evaluate(current);
            this.history.push({ x: current, y: value });
            this.draw();
            let iterations = 0;

            for (let i = 0; i < this.maxIterations; i++) {
                // Vecinos a ±paso dentro de [0, 10]; se toma el mejor de ellos
                const best = [current - this.stepSize, current + this.stepSize]
                    .filter((x) => x >= 0 && x <= 10)
                    .map((x) => ({ x, y: this.evaluate(x) }))
                    .reduce((b, c) => (c.y > b.y ? c : b), { x: current, y: value });

                if (best.y <= value) break; // máximo local: ningún vecino mejora

                current = best.x;
                value = best.y;
                this.history.push({ x: current, y: value });
                iterations++;
                this.draw();
                if (!(await this.step(id, 100))) return;
            }

            setText('hc-iterations', iterations);
            setText('hc-best-value', value.toFixed(3));
            setText('hc-position', current.toFixed(3));
        });
    }

    draw() {
        this.drawFunction();
        let previous = null;
        this.history.forEach((p, i) => {
            const [px, py] = this.pointFor(p.x, p.y);
            if (previous) {
                this.ctx.strokeStyle = COLORS.accent;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(previous[0], previous[1]);
                this.ctx.lineTo(px, py);
                this.ctx.stroke();
            }
            this.circle(px, py, 6, i === this.history.length - 1 ? COLORS.danger : COLORS.accent);
            previous = [px, py];
        });
    }
}

/* ---------------------------------------------------------------------------
   Recocido Simulado: acepta peores soluciones con probabilidad que baja con la temperatura.
   --------------------------------------------------------------------------- */
class SimulatedAnnealingVisualizer extends FunctionVisualizer {
    constructor() {
        super('annealing-canvas', { start: 'sa-start', reset: 'sa-reset', fn: 'sa-function' });
        this.tempInitial = numberOf('sa-temp-initial', 100);
        this.coolingRate = numberOf('sa-cooling-rate', 0.95);
        this.maxIterations = numberOf('sa-max-iterations', 200);
        bindControl('sa-temp-initial', { label: 'sa-temp-initial-value', onChange: (v) => (this.tempInitial = v) });
        bindControl('sa-cooling-rate', {
            label: 'sa-cooling-value',
            format: (v) => v.toFixed(2),
            onChange: (v) => (this.coolingRate = v),
        });
        bindControl('sa-max-iterations', {
            label: 'sa-iterations-value',
            onChange: (v) => (this.maxIterations = v),
        });
        this.reset();
        this.mount();
    }

    reset() {
        this.cancel();
        this.history = [];
        setText('sa-iterations', 0);
        setText('sa-best-value', '-');
        setText('sa-position', '-');
        setText('sa-acceptances', 0);
        this.setTemperature(this.tempInitial);
        this.draw();
    }

    setTemperature(temperature) {
        const bar = byId('temp-bar');
        if (bar) bar.style.width = `${clamp((temperature / this.tempInitial) * 100, 0, 100)}%`;
        setText('temp-value', temperature.toFixed(1));
    }

    start() {
        return this.run(async (id) => {
            this.history = [];
            let current = Math.random() * 10;
            let value = this.evaluate(current);
            let best = current;
            let bestValue = value;
            let acceptances = 0;
            let temperature = this.tempInitial;
            this.history.push({ x: current, y: value, accepted: true });

            for (let i = 0; i < this.maxIterations; i++) {
                // Candidato aleatorio cercano, dentro de [0, 10]
                const candidate = clamp(current + (Math.random() - 0.5) * 2, 0, 10);
                const candidateValue = this.evaluate(candidate);
                const delta = candidateValue - value;
                const accepted = delta > 0 || Math.random() < Math.exp(delta / temperature);

                if (accepted) {
                    current = candidate;
                    value = candidateValue;
                    acceptances++;
                    if (value > bestValue) {
                        best = current;
                        bestValue = value;
                    }
                    this.history.push({ x: current, y: value, accepted: true });
                } else {
                    this.history.push({ x: candidate, y: candidateValue, accepted: false });
                }

                temperature = Math.max(temperature * this.coolingRate, 1e-9);
                this.setTemperature(temperature);
                setText('sa-acceptances', acceptances);
                setText('sa-iterations', i + 1);
                this.draw();
                if (!(await this.step(id, 50))) return;
            }

            setText('sa-best-value', bestValue.toFixed(3));
            setText('sa-position', best.toFixed(3));
        });
    }

    draw() {
        this.drawFunction();
        const lastAccepted = this.history.reduce((index, p, i) => (p.accepted ? i : index), -1);
        let previous = null;

        this.history.forEach((p, i) => {
            const [px, py] = this.pointFor(p.x, p.y);
            if (p.accepted) {
                if (previous) {
                    this.ctx.strokeStyle = 'rgba(67, 233, 123, 0.5)';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(previous[0], previous[1]);
                    this.ctx.lineTo(px, py);
                    this.ctx.stroke();
                }
                const isLast = i === lastAccepted;
                this.circle(px, py, isLast ? 6 : 4, isLast ? COLORS.danger : 'rgba(67, 233, 123, 0.6)');
                previous = [px, py];
            } else {
                // Los candidatos rechazados se marcan en rojo tenue
                this.circle(px, py, 2.5, 'rgba(245, 87, 108, 0.45)');
            }
        });
    }
}
