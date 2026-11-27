/* ==========================================================================
   ml.js — K-means sobre puntos 2D.
   Los puntos se guardan normalizados en [0, 1] × [0, 1]: así el dibujo
   se adapta al tamaño del canvas sin que los puntos se salgan en móvil.
   ========================================================================== */

const MAX_KMEANS_ITERATIONS = 50;
const CLUSTER_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94', '#c7ceea', '#ffd93d', '#6bcf7f'];

const distance = (a, b) => Math.hypot(a.u - b.u, a.v - b.v);

class KMeansVisualizer extends Visualizer {
    constructor() {
        super('kmeans-canvas', { start: 'kmeans-start', reset: 'kmeans-reset' });
        this.k = numberOf('kmeans-k', 3);
        this.numPoints = numberOf('kmeans-points', 150);
        this.speed = numberOf('kmeans-speed', 500);
        this.points = [];
        this.centroids = [];
        this.iteration = 0;

        bindClick('kmeans-generate', () => this.generate());
        bindControl('kmeans-k', { label: 'kmeans-k-value', onChange: (v) => (this.k = v) });
        bindControl('kmeans-points', { label: 'kmeans-points-value', onChange: (v) => (this.numPoints = v) });
        bindControl('kmeans-speed', {
            label: 'kmeans-speed-value',
            format: (v) => `${v}ms`,
            onChange: (v) => (this.speed = v),
        });
        this.generate();
        this.mount();
    }

    setStatus(text) {
        setText('kmeans-status', text);
    }

    // Nube de puntos: grupos gaussianos-like más un fondo uniforme
    generate() {
        this.cancel();
        const clusters = 2 + Math.floor(Math.random() * 3);
        const perCluster = Math.floor(this.numPoints / clusters);
        this.points = [];

        for (let c = 0; c < clusters; c++) {
            const cu = 0.15 + Math.random() * 0.7;
            const cv = 0.15 + Math.random() * 0.7;
            const spread = 0.05 + Math.random() * 0.07;
            for (let i = 0; i < perCluster; i++) {
                const angle = Math.random() * TAU;
                const radius = Math.random() * spread;
                this.points.push({ u: cu + Math.cos(angle) * radius, v: cv + Math.sin(angle) * radius, cluster: -1 });
            }
        }
        while (this.points.length < this.numPoints) {
            this.points.push({ u: 0.08 + Math.random() * 0.84, v: 0.08 + Math.random() * 0.84, cluster: -1 });
        }

        this.centroids = [];
        this.iteration = 0;
        setText('kmeans-iteration', 0);
        setText('kmeans-convergence', '-');
        this.setStatus('Puntos generados');
        this.draw();
    }

    reset() {
        this.cancel();
        this.centroids = [];
        this.points.forEach((p) => (p.cluster = -1));
        this.iteration = 0;
        setText('kmeans-iteration', 0);
        setText('kmeans-convergence', '-');
        this.setStatus('Listo');
        this.draw();
    }

    // Inicialización "farthest-first": cada centroide nuevo va al punto más alejado de los existentes
    initialCentroids() {
        const first = this.points[Math.floor(Math.random() * this.points.length)];
        const centroids = [{ u: first.u, v: first.v }];
        while (centroids.length < this.k) {
            let farthest = null;
            let farthestDistance = -1;
            for (const p of this.points) {
                const d = Math.min(...centroids.map((c) => distance(p, c)));
                if (d > farthestDistance) {
                    farthestDistance = d;
                    farthest = p;
                }
            }
            centroids.push({ u: farthest.u, v: farthest.v });
        }
        return centroids;
    }

    // Asigna cada punto a su centroide más cercano; devuelve si hubo cambios
    assignClusters() {
        let changed = false;
        for (const p of this.points) {
            let best = 0;
            let bestDistance = Infinity;
            this.centroids.forEach((c, i) => {
                const d = distance(p, c);
                if (d < bestDistance) {
                    bestDistance = d;
                    best = i;
                }
            });
            if (p.cluster !== best) {
                p.cluster = best;
                changed = true;
            }
        }
        return changed;
    }

    // Recalcula cada centroide como media de su grupo; devuelve true si ya no se mueven
    updateCentroids() {
        let maxMove = 0;
        this.centroids = this.centroids.map((old, c) => {
            const members = this.points.filter((p) => p.cluster === c);
            if (!members.length) return old; // grupo vacío: el centroide se conserva
            const next = { u: average(members.map((m) => m.u)), v: average(members.map((m) => m.v)) };
            maxMove = Math.max(maxMove, distance(old, next));
            return next;
        });
        return maxMove < 0.002;
    }

    start() {
        return this.run(async (id) => {
            this.iteration = 0;
            this.points.forEach((p) => (p.cluster = -1));
            this.centroids = this.initialCentroids();
            this.setStatus('Ejecutando...');
            this.draw();
            if (!(await this.step(id, this.speed))) return;

            let converged = false;
            while (this.iteration < MAX_KMEANS_ITERATIONS && !converged) {
                this.iteration++;
                setText('kmeans-iteration', this.iteration);

                const changed = this.assignClusters();
                this.draw();
                if (!(await this.step(id, this.speed))) return;
                if (!changed) {
                    converged = true;
                    break;
                }

                converged = this.updateCentroids();
                this.draw();
                if (!(await this.step(id, this.speed))) return;
            }

            if (converged) {
                this.setStatus('Convergido ✓');
                setText('kmeans-convergence', `Sí (iter ${this.iteration})`);
            } else {
                this.setStatus('Máx iteraciones');
                setText('kmeans-convergence', 'No');
            }
        });
    }

    draw() {
        this.clear();
        const width = this.canvas.width;
        const height = this.canvas.height;

        for (const p of this.points) {
            const color = p.cluster >= 0 ? CLUSTER_COLORS[p.cluster % CLUSTER_COLORS.length] : 'rgba(150, 150, 150, 0.5)';
            this.circle(p.u * width, p.v * height, 4, color);
        }
        this.centroids.forEach((c, i) => {
            this.drawCentroid(c.u * width, c.v * height, CLUSTER_COLORS[i % CLUSTER_COLORS.length]);
        });
    }

    // Centroide: estrella blanca con borde del color del grupo y un halo
    drawCentroid(x, y, color) {
        const { ctx } = this;
        this.circle(x, y, 20, `${color}40`);

        ctx.fillStyle = COLORS.text;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let j = 0; j < 10; j++) {
            const radius = j % 2 === 0 ? 12 : 6;
            const angle = (j * Math.PI) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (j === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}
