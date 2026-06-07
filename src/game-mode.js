import { Creature } from './creature.js';
import { Particle } from './particle.js';
import { CONFIG } from './config.js';

class GameMode {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.creatures = [];
        this.particles = [];
        this.score = 0;
        this._time = CONFIG.game.duration;
        this.combo = 0;
        this.maxCombo = 0;
        this.running = false;
        this.spawnTimer = 0;
        this.spawnInterval = CONFIG.game.spawnIntervalBase;
        this._accumulatedMs = 0;
        this._startTimestamp = 0;
    }

    get time() {
        if (!this.running) return this._time;
        const elapsedMs = this._accumulatedMs + (performance.now() - this._startTimestamp);
        return Math.max(0, CONFIG.game.duration - Math.floor(elapsedMs / 1000));
    }

    get elapsedSeconds() {
        const elapsedMs = this._accumulatedMs + (this.running ? (performance.now() - this._startTimestamp) : 0);
        return Math.floor(elapsedMs / 1000);
    }

    start() {
        this.score = 0;
        this._time = CONFIG.game.duration;
        this.combo = 0;
        this.maxCombo = 0;
        this.creatures = [];
        this.particles = [];
        this.running = true;
        this.spawnTimer = 0;
        this._accumulatedMs = 0;
        this._startTimestamp = performance.now();
    }

    stop() {
        if (this.running) {
            this._time = this.time;
            this._accumulatedMs += performance.now() - this._startTimestamp;
        }
        this.running = false;
    }

    pause() {
        if (this.running) {
            this._time = this.time;
            this._accumulatedMs += performance.now() - this._startTimestamp;
            this.running = false;
        }
    }

    resume() {
        if (!this.running && this._time > 0) {
            this._startTimestamp = performance.now();
            this.running = true;
        }
    }

    update() {
        if (!this.running) return;

        const elapsedMs = this._accumulatedMs + (performance.now() - this._startTimestamp);
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        this._time = Math.max(0, CONFIG.game.duration - elapsedSeconds);

        if (this._time <= 0) {
            this._accumulatedMs += performance.now() - this._startTimestamp;
            this.running = false;
            return;
        }

        this.spawnTimer++;
        const currentInterval = Math.max(
            CONFIG.game.spawnIntervalMin,
            this.spawnInterval - Math.floor(elapsedSeconds / CONFIG.game.spawnAccelerationRateSec) * CONFIG.game.spawnAccelerationStep
        );
        if (this.spawnTimer >= currentInterval) {
            this.spawnTimer = 0;
            this.creatures.push(new Creature(this.canvasWidth, this.canvasHeight));

            if (elapsedSeconds >= CONFIG.game.doubleSpawnThresholdSec && Math.random() < CONFIG.game.doubleSpawnChance) {
                this.creatures.push(new Creature(this.canvasWidth, this.canvasHeight));
            }
        }

        for (let i = this.creatures.length - 1; i >= 0; i--) {
            if (!this.creatures[i].update()) {
                this.creatures.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update()) {
                this.particles.splice(i, 1);
            }
        }
    }

    handleInput(x, y) {
        if (!this.running) return { hit: false, combo: this.combo, score: this.score };

        let hit = false;
        for (let i = this.creatures.length - 1; i >= 0; i--) {
            const creature = this.creatures[i];
            if (creature.alive && !creature.caught && creature.checkClick(x, y)) {
                creature.caught = true;
                hit = true;
                this.combo++;
                if (this.combo > this.maxCombo) this.maxCombo = this.combo;

                const baseScore = 10;
                const comboMultiplier = Math.min(this.combo, 10);
                this.score += baseScore * comboMultiplier;

                for (let j = 0; j < CONFIG.visual.particleCount; j++) {
                    this.particles.push(new Particle(creature.x, creature.y));
                }
                if (this.particles.length > CONFIG.visual.maxParticles) {
                    this.particles = this.particles.slice(-CONFIG.visual.maxParticles);
                }
                break;
            }
        }

        if (!hit) {
            this.combo = 0;
        }

        return { hit, combo: this.combo, score: this.score };
    }

    isOver() {
        return !this.running && this.time <= 0;
    }

    getState() {
        return {
            score: this.score,
            time: this.time,
            combo: this.combo,
            maxCombo: this.maxCombo,
            creatures: this.creatures,
            particles: this.particles
        };
    }

    resize(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        for (const creature of this.creatures) {
            creature.canvasWidth = canvasWidth;
            creature.canvasHeight = canvasHeight;
        }
    }
}

export { GameMode };
