/* ==========================================================================
   sorting.js — algoritmos de ordenamiento animados con barras.
   Cada algoritmo implementa sort(id) y devuelve false si fue cancelado.
   ========================================================================== */

// Colores de las barras según su estado
const BAR = {
    idle: 'rgba(102, 126, 234, 0.7)',
    done: '#43e97b', // ordenada o ya procesada
    current: '#ffd93d', // posición o elemento en curso
    compare: '#f5576c', // elemento que se compara o mínimo/pivote
    probe: 'rgba(245, 87, 108, 0.5)', // elemento que se examina
    partition: '#ff8b94', // frontera de la partición
};

/**
 * Base de los ordenamientos: genera el array, dibuja las barras
 * y lleva los contadores (comparaciones, intercambios...).
 */
class BarSortVisualizer extends Visualizer {
    constructor(prefix, counters) {
        super(`${prefix}-sort-canvas`, { start: `${prefix}-start`, reset: `${prefix}-reset` });
        this.prefix = prefix;
        this.counters = counters;
        this.stats = {};
        this.fixed = new Set(); // índices ya colocados (quick sort)
        this.values = [];
        this.arraySize = numberOf(`${prefix}-array-size`, 10);
        this.speed = numberOf(`${prefix}-speed`, 100);
        bindControl(`${prefix}-array-size`, { label: `${prefix}-size-value`, onChange: (v) => (this.arraySize = v) });
        bindControl(`${prefix}-speed`, {
            label: `${prefix}-speed-value`,
            format: (v) => `${v}ms`,
            onChange: (v) => (this.speed = v),
        });
    }

    reset() {
        this.cancel();
        this.values = Array.from({ length: this.arraySize }, () => Math.floor(Math.random() * 100) + 10);
        this.resetCounters();
        this.draw();
    }

    resetCounters() {
        for (const name of this.counters) {
            this.stats[name] = 0;
            setText(`${this.prefix}-${name}`, 0);
        }
    }

    bump(name) {
        this.stats[name]++;
        setText(`${this.prefix}-${name}`, this.stats[name]);
    }

    start() {
        return this.run(async (id) => {
            this.fixed = new Set();
            this.resetCounters();
            const finished = await this.sort(id);
            if (finished && this.alive(id)) this.drawBars(() => BAR.done);
        });
    }

    draw() {
        this.drawBars(() => BAR.idle);
    }

    // Dibuja las barras; `colorOf(i)` decide el color de cada una
    drawBars(colorOf) {
        this.clear();
        const { ctx, canvas, values } = this;
        const barWidth = (canvas.width - 80) / values.length;
        const maxHeight = canvas.height - 80;

        values.forEach((value, i) => {
            const x = 40 + i * barWidth;
            const height = (value / 110) * maxHeight;
            const y = canvas.height - 40 - height;
            ctx.fillStyle = colorOf(i);
            ctx.fillRect(x, y, barWidth - 4, height);

            // Con barras muy estrechas (pantallas pequeñas) los valores se ocultan para no solaparse
            if (barWidth >= 22) {
                ctx.fillStyle = COLORS.text;
                ctx.font = '12px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(String(value), x + barWidth / 2 - 2, y - 5);
            }
        });
    }
}

class BubbleSortVisualizer extends BarSortVisualizer {
    constructor() {
        super('bubble', ['comparisons', 'swaps']);
        this.reset();
        this.mount();
    }

    async sort(id) {
        const a = this.values;
        const n = a.length;
        for (let pass = 0; pass < n - 1; pass++) {
            const sortedFrom = n - pass; // los últimos `pass` elementos ya están en su sitio
            let swapped = false;
            for (let j = 0; j < n - pass - 1; j++) {
                const pair = (i) => (i >= sortedFrom ? BAR.done : i === j || i === j + 1 ? BAR.compare : BAR.idle);
                this.bump('comparisons');
                this.drawBars(pair);
                if (!(await this.step(id, this.speed))) return false;

                if (a[j] > a[j + 1]) {
                    [a[j], a[j + 1]] = [a[j + 1], a[j]];
                    swapped = true;
                    this.bump('swaps');
                    this.drawBars(pair);
                    if (!(await this.step(id, this.speed))) return false;
                }
            }
            if (!swapped) break;
        }
        return true;
    }
}

class SelectionSortVisualizer extends BarSortVisualizer {
    constructor() {
        super('selection', ['comparisons', 'swaps']);
        this.reset();
        this.mount();
    }

    async sort(id) {
        const a = this.values;
        const n = a.length;
        for (let i = 0; i < n - 1; i++) {
            let min = i;
            for (let j = i + 1; j < n; j++) {
                this.bump('comparisons');
                this.drawBars((k) => {
                    if (k < i) return BAR.done;
                    if (k === min) return BAR.compare;
                    if (k === i) return BAR.current;
                    return k === j ? BAR.probe : BAR.idle;
                });
                if (!(await this.step(id, this.speed))) return false;
                if (a[j] < a[min]) min = j;
            }

            if (min !== i) {
                [a[i], a[min]] = [a[min], a[i]];
                this.bump('swaps');
                this.drawBars((k) => (k <= i ? BAR.done : k === min ? BAR.compare : BAR.idle));
                if (!(await this.step(id, this.speed))) return false;
            }
        }
        return true;
    }
}

class InsertionSortVisualizer extends BarSortVisualizer {
    constructor() {
        super('insertion', ['comparisons', 'shifts']);
        this.reset();
        this.mount();
    }

    async sort(id) {
        const a = this.values;
        const n = a.length;
        for (let i = 1; i < n; i++) {
            const key = a[i];
            let j = i - 1;
            this.drawBars((k) => (k < i ? BAR.done : k === i ? BAR.current : BAR.idle));
            if (!(await this.step(id, this.speed))) return false;

            while (j >= 0) {
                this.bump('comparisons');
                this.drawBars((k) => (k < i ? BAR.done : k === i ? BAR.current : k === j ? BAR.compare : BAR.idle));
                if (!(await this.step(id, this.speed))) return false;

                if (a[j] <= key) break;
                a[j + 1] = a[j];
                this.bump('shifts');
                j--;
            }

            a[j + 1] = key;
            this.drawBars((k) => (k <= i ? BAR.done : BAR.idle));
            if (!(await this.step(id, this.speed))) return false;
        }
        return true;
    }
}

class MergeSortVisualizer extends BarSortVisualizer {
    constructor() {
        super('merge', ['comparisons', 'merges']);
        this.reset();
        this.mount();
    }

    sort(id) {
        return this.mergeSort(id, 0, this.values.length - 1);
    }

    async mergeSort(id, left, right) {
        if (left >= right) return true;
        const mid = Math.floor((left + right) / 2);
        if (!(await this.mergeSort(id, left, mid))) return false;
        if (!(await this.mergeSort(id, mid + 1, right))) return false;
        return this.merge(id, left, mid, right);
    }

    async merge(id, left, mid, right) {
        const a = this.values;
        const leftPart = a.slice(left, mid + 1);
        const rightPart = a.slice(mid + 1, right + 1);
        let i = 0;
        let j = 0;
        let k = left;

        while (i < leftPart.length && j < rightPart.length) {
            this.bump('comparisons');
            this.drawBars((x) => (x === k ? BAR.current : x >= left && x <= right ? BAR.done : BAR.idle));
            if (!(await this.step(id, this.speed))) return false;

            if (leftPart[i] <= rightPart[j]) a[k++] = leftPart[i++];
            else a[k++] = rightPart[j++];
        }
        while (i < leftPart.length) a[k++] = leftPart[i++];
        while (j < rightPart.length) a[k++] = rightPart[j++];

        this.bump('merges');
        this.drawBars((x) => (x >= left && x <= right ? BAR.done : BAR.idle));
        return this.step(id, this.speed);
    }
}

class QuickSortVisualizer extends BarSortVisualizer {
    constructor() {
        super('quick', ['comparisons', 'swaps']);
        this.reset();
        this.mount();
    }

    sort(id) {
        return this.quickSort(id, 0, this.values.length - 1);
    }

    async quickSort(id, low, high) {
        if (low > high) return true;
        if (low === high) {
            this.fixed.add(low);
            return true;
        }
        const pivotIndex = await this.partition(id, low, high);
        if (pivotIndex === null) return false;
        this.fixed.add(pivotIndex);
        return (await this.quickSort(id, low, pivotIndex - 1)) && (await this.quickSort(id, pivotIndex + 1, high));
    }

    // Colores durante la partición: pivote, elemento actual y frontera
    partitionColors(current, pivot, boundary) {
        return (k) => {
            if (this.fixed.has(k)) return BAR.done;
            if (k === pivot) return BAR.compare;
            if (k === current) return BAR.current;
            return k === boundary ? BAR.partition : BAR.idle;
        };
    }

    // Devuelve la posición final del pivote, o null si se canceló
    async partition(id, low, high) {
        const a = this.values;
        const pivot = a[high];
        let i = low - 1;

        for (let j = low; j < high; j++) {
            this.bump('comparisons');
            this.drawBars(this.partitionColors(j, high, i + 1));
            if (!(await this.step(id, this.speed))) return null;

            if (a[j] < pivot) {
                i++;
                [a[i], a[j]] = [a[j], a[i]];
                this.bump('swaps');
                this.drawBars(this.partitionColors(j, high, i));
                if (!(await this.step(id, this.speed))) return null;
            }
        }

        [a[i + 1], a[high]] = [a[high], a[i + 1]];
        this.bump('swaps');
        this.drawBars(this.partitionColors(-1, high, i + 1));
        if (!(await this.step(id, this.speed))) return null;
        return i + 1;
    }
}
