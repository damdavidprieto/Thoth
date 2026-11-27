/* ==========================================================================
   search.js — búsqueda lineal y binaria sobre arrays de números.
   ========================================================================== */

const CELL_IDLE = 'rgba(102, 126, 234, 0.3)';

/**
 * Base de las búsquedas: genera el array, dibuja las celdas y muestra
 * comparaciones y resultado. Las subclases definen start() y draw().
 */
class SearchVisualizer extends Visualizer {
    constructor(canvasId, prefix, { sorted = false, maxCell = 50, sizeDefault = 10 } = {}) {
        super(canvasId, { start: `${prefix}-start`, reset: `${prefix}-reset` });
        this.prefix = prefix;
        this.sorted = sorted;
        this.maxCell = maxCell;
        this.arraySize = numberOf(`${prefix}-array-size`, sizeDefault);
        this.target = numberOf(`${prefix}-target`, 42);
        this.values = [];
        this.found = false;
        bindControl(`${prefix}-array-size`, { label: `${prefix}-size-value`, onChange: (v) => (this.arraySize = v) });
        bindControl(`${prefix}-target`, { onChange: (v) => (this.target = v) });
    }

    generate() {
        this.values = Array.from({ length: this.arraySize }, () => Math.floor(Math.random() * 100) + 1);
        if (this.sorted) this.values.sort((a, b) => a - b);
        this.found = false;
        this.clearMarks();
    }

    reset() {
        this.cancel();
        this.generate();
        setText(`${this.prefix}-comparisons`, 0);
        setText(`${this.prefix}-result`, '-');
        this.draw();
    }

    showComparisons(n) {
        setText(`${this.prefix}-comparisons`, n);
    }

    showResult(text) {
        setText(`${this.prefix}-result`, text);
    }

    // Dibuja una fila de celdas centrada; `fillOf(i)` decide el color de cada una
    drawCells(fillOf) {
        this.clear();
        const { ctx, canvas, values } = this;
        if (!values.length) return;
        const cell = Math.min(this.maxCell, (canvas.width - 40) / values.length);
        const startX = (canvas.width - cell * values.length) / 2;
        const y = canvas.height / 2 - 30;

        values.forEach((value, i) => {
            const x = startX + i * cell;
            ctx.fillStyle = fillOf(i);
            ctx.fillRect(x, y, cell - 2, 60);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, cell - 2, 60);

            ctx.fillStyle = COLORS.text;
            ctx.font = '15px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(String(value), x + cell / 2 - 1, y + 38);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '12px Inter';
            ctx.fillText(String(i), x + cell / 2 - 1, y + 80);
        });
    }

    // Color de la celda encontrada o de la que se compara
    hitColor() {
        return this.found ? COLORS.accent : COLORS.danger;
    }
}

class LinearSearchVisualizer extends SearchVisualizer {
    constructor() {
        super('linear-search-canvas', 'ls', { maxCell: 50, sizeDefault: 10 });
        this.current = -1;
        this.reset();
        this.mount();
    }

    clearMarks() {
        this.current = -1;
    }

    start() {
        return this.run(async (id) => {
            this.found = false;
            this.current = -1;
            this.showComparisons(0);
            this.showResult('-');

            for (let i = 0; i < this.values.length; i++) {
                this.current = i;
                this.showComparisons(i + 1);
                this.draw();
                if (!(await this.step(id, 300))) return;

                if (this.values[i] === this.target) {
                    this.found = true;
                    this.showResult(`Encontrado en posición ${i}`);
                    this.draw();
                    return;
                }
            }

            this.clearMarks();
            this.showResult('No encontrado');
            this.draw();
        });
    }

    draw() {
        this.drawCells((i) => (i === this.current ? this.hitColor() : CELL_IDLE));
    }
}

class BinarySearchVisualizer extends SearchVisualizer {
    constructor() {
        super('binary-search-canvas', 'bs', { sorted: true, maxCell: 40, sizeDefault: 15 });
        this.left = -1;
        this.right = -1;
        this.mid = -1;
        this.reset();
        this.mount();
    }

    clearMarks() {
        this.left = -1;
        this.right = -1;
        this.mid = -1;
    }

    start() {
        return this.run(async (id) => {
            this.found = false;
            this.left = 0;
            this.right = this.values.length - 1;
            this.showComparisons(0);
            this.showResult('-');

            let comparisons = 0;
            while (this.left <= this.right) {
                this.mid = Math.floor((this.left + this.right) / 2);
                comparisons++;
                this.showComparisons(comparisons);
                this.draw();
                if (!(await this.step(id, 500))) return;

                const value = this.values[this.mid];
                if (value === this.target) {
                    this.found = true;
                    this.showResult(`Encontrado en posición ${this.mid}`);
                    this.draw();
                    return;
                }
                if (value < this.target) this.left = this.mid + 1;
                else this.right = this.mid - 1;
            }

            this.clearMarks();
            this.showResult('No encontrado');
            this.draw();
        });
    }

    draw() {
        this.drawCells((i) => {
            if (i === this.mid) return this.hitColor();
            if (i >= this.left && i <= this.right) return 'rgba(102, 126, 234, 0.5)';
            return 'rgba(102, 126, 234, 0.1)';
        });
    }
}
