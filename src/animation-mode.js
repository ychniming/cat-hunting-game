import { AnimationCreature } from './animation-creature.js';
import { CONFIG } from './config.js';

class AnimationMode {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.creature = null;
        this.spawnTimer = 0;
        this.offScreenTimer = 0;
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
        this.offScreenTimer = 0;
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

        // 检测生物是否离屏或无效（即使 alive=true）
        const creatureLost = this.creature && this.creature.alive && this._isCreatureOffScreen(this.creature);

        // 离屏计时器：生物在屏幕外时递增，在屏幕内时重置
        if (this.creature && this.creature.alive && !this.creature.exiting &&
            (this.creature.x < -200 || this.creature.x > this.canvasWidth + 200 ||
             this.creature.y < -200 || this.creature.y > this.canvasHeight + 200)) {
            this.offScreenTimer++;
        } else if (this.creature && this.creature.alive && isFinite(this.creature.x) && isFinite(this.creature.y)) {
            this.offScreenTimer = 0;
        }

        if (!this.creature || !this.creature.alive || creatureLost) {
            if (creatureLost) {
                this.creature.alive = false;
            }
            this.spawnTimer++;
            if (this.spawnTimer >= CONFIG.animation.spawnDelay) {
                this.spawnTimer = 0;
                this.offScreenTimer = 0;
                this.creature = new AnimationCreature(this.canvasWidth, this.canvasHeight);
                soundEvents.push('startCrawl');
            }
        } else {
            const wasMoving = this.creature.isMoving();
            this.creature.update();

            if (!this.creature.alive) {
                soundEvents.push('stopCrawl');
            } else {
                const isMoving = this.creature.isMoving();
                const isPausing = this.creature.isPausing();

                if (wasMoving && !isMoving && isPausing) {
                    soundEvents.push('stopCrawl');
                    soundEvents.push('playPause');
                } else if (!wasMoving && isMoving) {
                    soundEvents.push('startCrawl');
                }
            }
        }

        return { soundEvents, expired: false };
    }

    _isCreatureOffScreen(creature) {
        const margin = 200;
        const x = creature.x;
        const y = creature.y;
        // NaN 或 Infinity 检测
        if (!isFinite(x) || !isFinite(y)) return true;
        // 非退出状态下离屏过远
        if (!creature.exiting &&
            (x < -margin || x > this.canvasWidth + margin ||
             y < -margin || y > this.canvasHeight + margin)) {
            return this.offScreenTimer > 120; // 2秒容错
        }
        // 退出状态下超时未消失
        if (creature.exiting && creature.lifeTimer > creature.totalLife + 600) {
            return true;
        }
        return false;
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
            this.creature.resize(canvasWidth, canvasHeight);
        }
    }
}

export { AnimationMode };
