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
        this.time = CONFIG.game.duration;
        this.combo = 0;
        this.maxCombo = 0;
        this.running = false;
        this.spawnTimer = 0;
        this.spawnInterval = CONFIG.game.spawnIntervalBase;
        this.gameTime = 0;
    }

    start() {
        this.score = 0;
        this.time = CONFIG.game.duration;
        this.combo = 0;
        this.maxCombo = 0;
        this.creatures = [];
        this.particles = [];
        this.running = true;
        this.spawnTimer = 0;
        this.gameTime = 0;
    }

    stop() {
        this.running = false;
    }

    update() {
        if (!this.running) return;

        this.gameTime++;

        if (this.gameTime % 60 === 0) {
            this.time--;
            if (this.time <= 0) {
                this.running = false;
            }
        }

        this.spawnTimer++;
        const currentInterval = Math.max(
            CONFIG.game.spawnIntervalMin,
            this.spawnInterval - Math.floor(this.gameTime / CONFIG.game.spawnAccelerationRate) * CONFIG.game.spawnAccelerationStep
        );
        if (this.spawnTimer >= currentInterval) {
            this.spawnTimer = 0;
            this.creatures.push(new Creature(this.canvasWidth, this.canvasHeight));

            if (this.gameTime > CONFIG.game.doubleSpawnThreshold && Math.random() < CONFIG.game.doubleSpawnChance) {
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
