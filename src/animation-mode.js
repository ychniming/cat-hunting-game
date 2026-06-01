import { AnimationCreature } from './animation-creature.js';
import { CONFIG } from './config.js';

class AnimationMode {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.creature = null;
        this.spawnTimer = 0;
        this.duration = Infinity;
        this.startTime = 0;
        this.running = false;
        this.durationOptions = {
            '30min': 30 * 60 * 1000,
            '1hour': 60 * 60 * 1000,
            'infinite': Infinity
        };
    }

    start(durationKey) {
        this.creature = null;
        this.spawnTimer = 0;
        this.duration = this.durationOptions[durationKey] || Infinity;
        this.startTime = Date.now();
        this.running = true;
    }

    stop() {
        this.running = false;
    }

    update() {
        if (!this.running) return { soundEvents: [] };

        if (this.duration !== Infinity) {
            const elapsed = Date.now() - this.startTime;
            if (elapsed >= this.duration) {
                this.running = false;
                return { soundEvents: [], expired: true };
            }
        }

        const soundEvents = [];

        if (!this.creature || !this.creature.alive) {
            this.spawnTimer++;
            if (this.spawnTimer >= CONFIG.animation.spawnDelay) {
                this.spawnTimer = 0;
                this.creature = new AnimationCreature(this.canvasWidth, this.canvasHeight);
                soundEvents.push('startCrawl');
            }
        } else {
            const wasMoving = this.creature.isMoving();
            this.creature.update();
            const isMoving = this.creature.isMoving();
            const isPausing = this.creature.isPausing();

            if (wasMoving && !isMoving && isPausing) {
                soundEvents.push('stopCrawl');
                soundEvents.push('playPause');
            } else if (!wasMoving && isMoving) {
                soundEvents.push('startCrawl');
            }

            if (!this.creature.alive) {
                soundEvents.push('stopCrawl');
            }
        }

        return { soundEvents, expired: false };
    }

    getState() {
        return {
            creature: this.creature,
            spawnTimer: this.spawnTimer,
            duration: this.duration,
            elapsed: Date.now() - this.startTime
        };
    }

    resize(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        if (this.creature) {
            this.creature.canvasWidth = canvasWidth;
            this.creature.canvasHeight = canvasHeight;
        }
    }
}

export { AnimationMode };
