import { CONFIG } from './config.js';
import { CreatureCore } from './creature-core.js';

class Creature {
    constructor(canvasWidth, canvasHeight) {
        this.core = new CreatureCore(canvasWidth, canvasHeight);
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
    }

    reset() {
        const pos = this.core.spawnFromEdge(50);
        this.x = pos.x;
        this.y = pos.y;

        const targetX = this.canvasWidth * 0.2 + Math.random() * this.canvasWidth * 0.6;
        const targetY = this.canvasHeight * 0.2 + Math.random() * this.canvasHeight * 0.6;
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        const speed = 1.5 + Math.random() * 2.5;

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.core.initSharedProperties({ minRadius: 15, maxRadius: 25, minWiggleSpeed: 0.1, maxWiggleSpeed: 0.2 });
        this.radius = this.core.radius;
        this.alive = true;
        this.caught = false;
        this.caughtTime = 0;

        const segCount = CONFIG.game.tailSegments;
        const segLen = CONFIG.tail.segmentLength;
        this.tailChain = this.core.createTail(this.x, this.y, segCount, segLen, {
            gravity: CONFIG.tail.gravity,
            stiffness: CONFIG.tail.stiffness,
            damping: CONFIG.tail.damping,
            constraintIterations: CONFIG.tail.constraintIterations
        });
    }

    update() {
        if (this.caught) {
            this.incrementCaughtTime();
            this.shrinkRadius();
            this.tailChain.update(this.x, this.y);
            return !this.isCaughtAnimationDone();
        }

        this.core.wigglePhase += this.core.wiggleSpeed;
        this.core.updateBlink(10, 100, 400);

        this.x += this.vx;
        this.y += this.vy;

        this.addWiggleOffset();
        this.clampSpeed(4);

        this.tailChain.update(this.x, this.y);

        if (this.isOutOfBounds(100)) {
            this.alive = false;
        }

        return true;
    }

    // --- Semantic action methods ---

    addWiggleOffset() {
        this.vx += Math.sin(this.core.wigglePhase * 2) * 0.05;
        this.vy += Math.cos(this.core.wigglePhase * 1.5) * 0.05;
    }

    clampSpeed(maxSpeed) {
        const speed = this.getSpeed();
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }
    }

    getSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }

    incrementCaughtTime() {
        this.caughtTime++;
    }

    shrinkRadius() {
        this.radius *= 0.9;
    }

    isCaughtAnimationDone() {
        return this.caughtTime >= 20;
    }

    isOutOfBounds(margin) {
        return this.x < -margin || this.x > this.canvasWidth + margin ||
            this.y < -margin || this.y > this.canvasHeight + margin;
    }

    get tailSegments() {
        return this.tailChain.getSegments();
    }

    getVisualProps() {
        const base = this.core.getBaseVisualProps(this.x, this.y, this.tailSegments);
        return {
            ...base,
            eyeSizeRatio: 0.35,
            eyeSpacingRatio: 0.3,
            pupilSizeRatio: 0.5,
            eyeVerticalOffset: -2,
            caught: this.caught,
            caughtTime: this.caughtTime
        };
    }

    checkClick(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius * 2;
    }
}

export { Creature };
