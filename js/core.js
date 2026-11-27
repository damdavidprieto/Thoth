/* ==========================================================================
   core.js — utilidades y clase base de todas las visualizaciones.
   Debe cargarse antes que el resto de archivos de js/.
   ========================================================================== */

const COLORS = {
    primary: '#667eea',
    accent: '#43e97b',
    danger: '#f5576c',
    highlight: '#ffd93d',
    wall: '#2d3748',
    text: '#ffffff',
    axis: 'rgba(255, 255, 255, 0.3)',
    gridLine: 'rgba(255, 255, 255, 0.1)',
};

const TAU = Math.PI * 2;

// Declarada como función para poder sustituirla en pruebas
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const average = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

function byId(id) {
    return document.getElementById(id);
}

function setText(id, text) {
    const el = byId(id);
    if (el) el.textContent = String(text);
}

// Valor numérico de un control; `fallback` si no existe o está vacío
function numberOf(id, fallback) {
    const el = byId(id);
    const value = el ? parseFloat(el.value) : NaN;
    return Number.isNaN(value) ? fallback : value;
}

// Actualiza la etiqueta del control y avisa al cambiar.
// Los <select> escuchan 'change' y entregan su valor tal cual; el resto escucha 'input' y entrega un número.
function bindControl(id, { label, format = (v) => v, onChange }) {
    const el = byId(id);
    if (!el) return;
    const isSelect = el.tagName === 'SELECT';
    el.addEventListener(isSelect ? 'change' : 'input', () => {
        const value = isSelect ? el.value : parseFloat(el.value);
        if (typeof value === 'number' && Number.isNaN(value)) return; // campo numérico vacío
        if (label) setText(label, format(value));
        onChange(value);
    });
}

function bindClick(id, handler) {
    const el = byId(id);
    if (el) el.addEventListener('click', handler);
}

// Funciones de prueba sobre el intervalo [0, 10]
const TEST_FUNCTIONS = {
    quadratic: (x) => -(x - 5) * (x - 5) + 25,
    sine: (x) => Math.sin(x) * 10 + 15,
    rastrigin: (x) => 20 - (x * x - 10 * Math.cos(2 * Math.PI * x)),
};

// Rango vertical de cada función sobre [0, 10], con margen. Se calcula una sola vez.
const FUNCTION_RANGES = {};
function rangeOf(name) {
    if (!FUNCTION_RANGES[name]) {
        let min = Infinity;
        let max = -Infinity;
        for (let i = 0; i <= 400; i++) {
            const y = TEST_FUNCTIONS[name](i / 40);
            min = Math.min(min, y);
            max = Math.max(max, y);
        }
        const pad = (max - min) * 0.08;
        FUNCTION_RANGES[name] = { min: min - pad, max: max + pad };
    }
    return FUNCTION_RANGES[name];
}

/**
 * Base de todas las visualizaciones: canvas, ejecución única con cancelación
 * y estado visual "ejecutando" en el botón de inicio.
 */
class Visualizer {
    constructor(canvasId, { start, reset } = {}) {
        this.canvas = byId(canvasId);
        this.ctx = this.canvas.getContext('2d');
        // La proporción alto/ancho viene del HTML: cada canvas conserva su forma al redimensionar
        this.aspect = this.canvas.height / this.canvas.width;
        this.startBtn = start ? byId(start) : null;
        this.startLabel = this.startBtn ? this.startBtn.innerHTML : '';
        this.runId = 0;
        this.running = false;
        if (start) bindClick(start, () => this.start());
        if (reset) bindClick(reset, () => this.reset());
    }

    // Se llama al final del constructor de cada visualización, cuando su estado ya existe
    mount() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    // Ancho útil del canvas (sin el padding del panel)
    contentWidth() {
        const box = this.canvas.parentElement;
        const style = getComputedStyle(box);
        return box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    }

    resize() {
        const width = this.contentWidth();
        if (width <= 0) return; // pestaña oculta: se redimensiona al mostrarse
        this.canvas.width = width;
        this.canvas.height = Math.round(width * this.aspect);
        this.draw();
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    circle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, TAU);
        this.ctx.fill();
    }

    // Ejecuta una animación. Solo puede haber una activa por visualización.
    async run(task) {
        if (this.running) return;
        this.running = true;
        const id = ++this.runId;
        this.setBusy(true);
        try {
            await task(id);
        } finally {
            if (id === this.runId) this.finish();
        }
    }

    // true mientras la animación `id` siga siendo la vigente
    alive(id) {
        return id === this.runId;
    }

    // Espera entre pasos; devuelve false si la animación se canceló mientras tanto
    async step(id, ms) {
        await sleep(ms);
        return this.alive(id);
    }

    // Cancela la animación en curso: sus bucles comprueban alive() y salen
    cancel() {
        this.runId++;
        this.finish();
    }

    finish() {
        this.running = false;
        this.setBusy(false);
    }

    setBusy(busy) {
        if (this.startBtn) {
            this.startBtn.disabled = busy;
            this.startBtn.innerHTML = busy ? '<span class="btn-icon">…</span> Ejecutando' : this.startLabel;
        }
        this.canvas.setAttribute('aria-busy', String(busy));
    }
}

/**
 * Base de Hill Climbing, Recocido Simulado, GA y PSO: todas optimizan
 * una de las funciones de prueba sobre [0, 10] y comparten la gráfica.
 */
class FunctionVisualizer extends Visualizer {
    constructor(canvasId, controls) {
        super(canvasId, controls);
        this.fnName = 'quadratic';
        this.history = [];
        if (controls.fn) {
            // Cambiar de función empieza de nuevo: el estado anterior ya no tiene sentido
            bindControl(controls.fn, {
                onChange: (name) => {
                    this.fnName = name;
                    this.reset();
                },
            });
        }
    }

    evaluate(x) {
        return TEST_FUNCTIONS[this.fnName](x);
    }

    plot() {
        const pad = 40;
        const { width, height } = this.canvas;
        return { left: pad, top: pad, width: width - 2 * pad, height: height - 2 * pad, bottom: height - pad };
    }

    // Píxeles de un punto (x en [0, 10], y en la escala de la función)
    pointFor(x, y) {
        const plot = this.plot();
        const { min, max } = rangeOf(this.fnName);
        return [plot.left + (x / 10) * plot.width, plot.bottom - ((y - min) / (max - min)) * plot.height];
    }

    drawFunction() {
        const { ctx } = this;
        const plot = this.plot();
        this.clear();

        ctx.strokeStyle = COLORS.axis;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(plot.left, plot.bottom);
        ctx.lineTo(plot.left + plot.width, plot.bottom);
        ctx.moveTo(plot.left, plot.top);
        ctx.lineTo(plot.left, plot.bottom);
        ctx.stroke();

        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let px = 0; px <= plot.width; px++) {
            const x = (px / plot.width) * 10;
            const [sx, sy] = this.pointFor(x, this.evaluate(x));
            if (px === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
    }

    drawLabel(text, row) {
        const plot = this.plot();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '13px Inter';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(text, plot.left + 10, plot.top + 20 + row * 20);
    }
}
