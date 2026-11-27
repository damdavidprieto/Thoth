/* ==========================================================================
   evolutionary.js — algoritmos genéticos y optimización por enjambre (PSO).
   ========================================================================== */

/* ---------------------------------------------------------------------------
   Algoritmo genético sobre un único gen real x en [0, 10].
   Selección por torneo, cruce aritmético, mutación gaussiana y elitismo.
   --------------------------------------------------------------------------- */
class GeneticAlgorithmVisualizer extends FunctionVisualizer {
    constructor() {
        super('genetic-canvas', { start: 'ga-start', reset: 'ga-reset', fn: 'ga-function' });
        this.populationSize = numberOf('ga-population-size', 50);
        this.mutationRate = numberOf('ga-mutation-rate', 0.1);
        this.crossoverRate = numberOf('ga-crossover-rate', 0.8);
        this.generations = numberOf('ga-generations', 30);
        this.population = [];
        this.generation = 0;

        bindControl('ga-population-size', { label: 'ga-population-value', onChange: (v) => (this.populationSize = v) });
        bindControl('ga-mutation-rate', {
            label: 'ga-mutation-value',
            format: (v) => v.toFixed(2),
            onChange: (v) => (this.mutationRate = v),
        });
        bindControl('ga-crossover-rate', {
            label: 'ga-crossover-value',
            format: (v) => v.toFixed(2),
            onChange: (v) => (this.crossoverRate = v),
        });
        bindControl('ga-generations', { label: 'ga-generations-value', onChange: (v) => (this.generations = v) });
        this.reset();
        this.mount();
    }

    reset() {
        this.cancel();
        this.population = [];
        this.generation = 0;
        setText('ga-generation', 0);
        setText('ga-best-fitness', '-');
        setText('ga-avg-fitness', '-');
        setText('ga-best-position', '-');
        this.draw();
    }

    start() {
        return this.run(async (id) => {
            let population = this.randomPopulation();
            for (let g = 0; g <= this.generations; g++) {
                this.population = population;
                this.generation = g;
                this.showStats();
                this.draw();
                if (g === this.generations) break;
                if (!(await this.step(id, 100))) return;
                population = this.nextGeneration(population);
            }
        });
    }

    randomPopulation() {
        return Array.from({ length: this.populationSize }, () => {
            const x = Math.random() * 10;
            return { x, fitness: this.evaluate(x) };
        });
    }

    bestOf(population) {
        return population.reduce((best, ind) => (ind.fitness > best.fitness ? ind : best));
    }

    // Torneo de 3 individuos: gana el de mayor fitness
    tournament(pool) {
        let best = pool[Math.floor(Math.random() * pool.length)];
        for (let i = 1; i < 3; i++) {
            const challenger = pool[Math.floor(Math.random() * pool.length)];
            if (challenger.fitness > best.fitness) best = challenger;
        }
        return best;
    }

    crossover(parent1, parent2) {
        const alpha = Math.random();
        const x = alpha * parent1.x + (1 - alpha) * parent2.x;
        return { x, fitness: this.evaluate(x) };
    }

    mutate(individual) {
        const x = clamp(individual.x + this.gaussian(0, 0.5), 0, 10);
        return { x, fitness: this.evaluate(x) };
    }

    // Box-Muller: número con distribución normal
    gaussian(mean, sigma) {
        const u1 = Math.random() || 1e-12; // evita log(0)
        const u2 = Math.random();
        return mean + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(TAU * u2);
    }

    nextGeneration(population) {
        // Se vuelve a evaluar por si la función cambió durante la ejecución
        const pool = population.map((ind) => ({ x: ind.x, fitness: this.evaluate(ind.x) }));
        const next = [{ ...this.bestOf(pool) }]; // elitismo: el mejor siempre pasa

        while (next.length < this.populationSize) {
            const parent1 = this.tournament(pool);
            const parent2 = this.tournament(pool);
            let child = Math.random() < this.crossoverRate ? this.crossover(parent1, parent2) : { ...parent1 };
            if (Math.random() < this.mutationRate) child = this.mutate(child);
            next.push(child);
        }
        return next;
    }

    showStats() {
        const best = this.bestOf(this.population);
        setText('ga-generation', this.generation);
        setText('ga-best-fitness', best.fitness.toFixed(3));
        setText('ga-avg-fitness', average(this.population.map((ind) => ind.fitness)).toFixed(3));
        setText('ga-best-position', best.x.toFixed(3));
    }

    draw() {
        this.drawFunction();
        if (!this.population.length) return;

        const best = this.bestOf(this.population);
        for (const ind of this.population) {
            if (ind === best) continue;
            const [px, py] = this.pointFor(ind.x, ind.fitness);
            this.circle(px, py, 5, 'rgba(67, 233, 123, 0.6)');
        }

        const [bx, by] = this.pointFor(best.x, best.fitness);
        this.ctx.strokeStyle = COLORS.danger;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(bx, by, 12, 0, TAU);
        this.ctx.stroke();
        this.circle(bx, by, 8, COLORS.danger);

        this.drawLabel(`Generación: ${this.generation}`, 0);
        this.drawLabel(`Población: ${this.population.length}`, 1);
    }
}

/* ---------------------------------------------------------------------------
   Optimización por enjambre: cada partícula combina inercia, su mejor
   posición personal y la mejor posición global.
   --------------------------------------------------------------------------- */
class ParticleSwarmVisualizer extends FunctionVisualizer {
    constructor() {
        super('pso-canvas', { start: 'pso-start', reset: 'pso-reset', fn: 'pso-function' });
        this.numParticles = numberOf('pso-num-particles', 30);
        this.inertia = numberOf('pso-inertia', 0.7);
        this.cognitive = numberOf('pso-cognitive', 1.5);
        this.social = numberOf('pso-social', 1.5);
        this.maxIterations = numberOf('pso-iterations', 100);
        this.particles = [];
        this.globalBest = null;
        this.iteration = 0;

        bindControl('pso-num-particles', { label: 'pso-particles-value', onChange: (v) => (this.numParticles = v) });
        bindControl('pso-inertia', { label: 'pso-inertia-value', format: (v) => v.toFixed(1), onChange: (v) => (this.inertia = v) });
        bindControl('pso-cognitive', { label: 'pso-cognitive-value', format: (v) => v.toFixed(1), onChange: (v) => (this.cognitive = v) });
        bindControl('pso-social', { label: 'pso-social-value', format: (v) => v.toFixed(1), onChange: (v) => (this.social = v) });
        bindControl('pso-iterations', { label: 'pso-iterations-value', onChange: (v) => (this.maxIterations = v) });
        this.reset();
        this.mount();
    }

    reset() {
        this.cancel();
        this.particles = [];
        this.globalBest = null;
        this.iteration = 0;
        setText('pso-iteration', 0);
        setText('pso-best-fitness', '-');
        setText('pso-best-position', '-');
        this.draw();
    }

    start() {
        return this.run(async (id) => {
            this.particles = Array.from({ length: this.numParticles }, () => {
                const x = Math.random() * 10;
                const fitness = this.evaluate(x);
                return { x, velocity: (Math.random() - 0.5) * 2, fitness, bestX: x, bestFitness: fitness };
            });
            this.globalBest = this.bestParticle();
            this.iteration = 0;
            this.draw();

            for (let it = 1; it <= this.maxIterations; it++) {
                this.iteration = it;
                for (const particle of this.particles) this.moveParticle(particle);
                this.showStats();
                this.draw();
                if (!(await this.step(id, 50))) return;
            }
        });
    }

    bestParticle() {
        const best = this.particles.reduce((b, p) => (p.fitness > b.fitness ? p : b));
        return { x: best.x, fitness: best.fitness };
    }

    moveParticle(p) {
        const r1 = Math.random();
        const r2 = Math.random();
        const cognitive = this.cognitive * r1 * (p.bestX - p.x);
        const social = this.social * r2 * (this.globalBest.x - p.x);

        p.velocity = clamp(this.inertia * p.velocity + cognitive + social, -2, 2);
        p.x = clamp(p.x + p.velocity, 0, 10);
        p.fitness = this.evaluate(p.x);

        if (p.fitness > p.bestFitness) {
            p.bestX = p.x;
            p.bestFitness = p.fitness;
        }
        if (p.fitness > this.globalBest.fitness) {
            this.globalBest = { x: p.x, fitness: p.fitness };
        }
    }

    showStats() {
        setText('pso-iteration', this.iteration);
        setText('pso-best-fitness', this.globalBest.fitness.toFixed(3));
        setText('pso-best-position', this.globalBest.x.toFixed(3));
    }

    draw() {
        this.drawFunction();

        for (const p of this.particles) {
            const [px, py] = this.pointFor(p.x, p.fitness);
            // Vector de velocidad, horizontal y escalado para que se vea
            this.ctx.strokeStyle = 'rgba(67, 233, 123, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(px, py);
            this.ctx.lineTo(px + p.velocity * 20, py);
            this.ctx.stroke();
            this.circle(px, py, 5, 'rgba(67, 233, 123, 0.75)');
        }

        if (this.globalBest) {
            const [gx, gy] = this.pointFor(this.globalBest.x, this.globalBest.fitness);
            this.circle(gx, gy, 8, COLORS.danger);
        }

        if (this.particles.length) {
            this.drawLabel(`Iteración: ${this.iteration}`, 0);
            this.drawLabel(`Partículas: ${this.particles.length}`, 1);
        }
    }
}
