import { CONFIG } from './config.js';
import { TailChain } from './tail-chain.js';

class Creature {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
    }

    reset() {
        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0:
                this.x = Math.random() * this.canvasWidth;
                this.y = -50;
                break;
            case 1:
                this.x = this.canvasWidth + 50;
                this.y = Math.random() * this.canvasHeight;
                break;
            case 2:
                this.x = Math.random() * this.canvasWidth;
                this.y = this.canvasHeight + 50;
                break;
            case 3:
                this.x = -50;
                this.y = Math.random() * this.canvasHeight;
                break;
        }

        const targetX = this.canvasWidth * 0.2 + Math.random() * this.canvasWidth * 0.6;
        const targetY = this.canvasHeight * 0.2 + Math.random() * this.canvasHeight * 0.6;
        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        const speed = 1.5 + Math.random() * 2.5;

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 15 + Math.random() * 10;
        this.alive = true;
        this.caught = false;
        this.caughtTime = 0;
        this.wigglePhase = Math.random() * Math.PI * 2;
        this.wiggleSpeed = 0.1 + Math.random() * 0.1;
        this.eyeOffset = 0;
        this.blinkTimer = Math.random() * 200;
        this.blinking = false;

        const segCount = CONFIG.game.tailSegments;
        const segLen = CONFIG.tail.segmentLength;
        this.tailChain = new TailChain(this.x, this.y, segCount, segLen, {
            gravity: CONFIG.tail.gravity,
            stiffness: CONFIG.tail.stiffness,
            damping: CONFIG.tail.damping,
            constraintIterations: CONFIG.tail.constraintIterations
        });
    }

    update() {
        if (this.caught) {
            this.caughtTime++;
            this.radius *= 0.9;
            this.tailChain.update(this.x, this.y);
            return this.caughtTime < 20;
        }

        this.wigglePhase += this.wiggleSpeed;
        this.eyeOffset = Math.sin(this.wigglePhase) * 2;
        this.blinkTimer--;

        if (this.blinkTimer <= 0) {
            this.blinking = true;
            if (this.blinkTimer < -10) {
                this.blinking = false;
                this.blinkTimer = 100 + Math.random() * 300;
            }
        }

        this.x += this.vx;
        this.y += this.vy;

        this.vx += Math.sin(this.wigglePhase * 2) * 0.05;
        this.vy += Math.cos(this.wigglePhase * 1.5) * 0.05;

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpeed = 4;
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        this.tailChain.update(this.x, this.y);

        const margin = 100;
        if (this.x < -margin || this.x > this.canvasWidth + margin ||
            this.y < -margin || this.y > this.canvasHeight + margin) {
            this.alive = false;
        }

        return true;
    }

    get tailSegments() {
        return this.tailChain.getSegments();
    }

    getVisualProps() {
        return {
            x: this.x,
            y: this.y,
            radius: this.radius,
            tailSegments: this.tailSegments,
            blinking: this.blinking,
            eyeOffset: this.eyeOffset,
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
