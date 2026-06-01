import { STATE_MAP, STATE_TRANSITIONS } from './creature-states.js';
import { CONFIG } from './config.js';

class AnimationCreature {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
    }

    reset() {
        this.radius = 20 + Math.random() * 20;
        const baseSpeed = 3 - (this.radius - 20) / 20 * 1.5;
        this.speed = baseSpeed + Math.random() * 1;

        const side = Math.floor(Math.random() * 4);
        const margin = 60;

        switch(side) {
            case 0:
                this.x = Math.random() * this.canvasWidth;
                this.y = -margin;
                break;
            case 1:
                this.x = this.canvasWidth + margin;
                this.y = Math.random() * this.canvasHeight;
                break;
            case 2:
                this.x = Math.random() * this.canvasWidth;
                this.y = this.canvasHeight + margin;
                break;
            case 3:
                this.x = -margin;
                this.y = Math.random() * this.canvasHeight;
                break;
        }

        this.targetX = this.canvasWidth * 0.15 + Math.random() * this.canvasWidth * 0.7;
        this.targetY = this.canvasHeight * 0.15 + Math.random() * this.canvasHeight * 0.7;

        this.vx = 0;
        this.vy = 0;
        this.stateTimer = 0;
        this.pauseDuration = 120 + Math.random() * 180;
        this.exitDelay = 120 + Math.random() * 180;
        this.totalLife = 600 + Math.random() * 900;
        this.lifeTimer = 0;

        this.wigglePhase = Math.random() * Math.PI * 2;
        this.wiggleSpeed = 0.08 + Math.random() * 0.06;
        this.tailSegments = [];
        const tailAngle = Math.atan2(this.targetY - this.y, this.targetX - this.x) + Math.PI;
        const tailStep = this.radius * 0.8;
        for (let i = 0; i < CONFIG.animation.tailSegments; i++) {
            this.tailSegments.push({
                x: this.x + Math.cos(tailAngle) * tailStep * i,
                y: this.y + Math.sin(tailAngle) * tailStep * i
            });
        }

        this.eyeOffset = 0;
        this.blinkTimer = Math.random() * 200;
        this.blinking = false;
        this.alive = true;
        this.exiting = false;

        this.movePattern = Math.floor(Math.random() * 3);
        this.patternTimer = 0;
        this.patternDuration = 100 + Math.random() * 200;

        this._currentState = new STATE_MAP.entering();
        this._currentState.enter(this);
    }

    get state() {
        return this._currentState.name;
    }

    set state(newStateName) {
        if (this._currentState.name === newStateName) return;
        const allowed = STATE_TRANSITIONS[this._currentState.name];
        if (!allowed.includes(newStateName)) return;
        this._currentState.exit(this);
        this._currentState = new STATE_MAP[newStateName]();
        this._currentState.enter(this);
    }

    update() {
        if (!this.alive) return false;

        this.wigglePhase += this.wiggleSpeed;
        this.eyeOffset = Math.sin(this.wigglePhase) * 2;
        this.blinkTimer--;

        if (this.blinkTimer <= 0) {
            this.blinking = true;
            if (this.blinkTimer < -8) {
                this.blinking = false;
                this.blinkTimer = 80 + Math.random() * 250;
            }
        }

        this.lifeTimer++;

        const prevStateName = this._currentState.name;
        const transition = this._currentState.update(this);
        if (transition && STATE_TRANSITIONS[this._currentState.name].includes(transition)) {
            this.state = transition;
        }

        if (this._currentState.name !== prevStateName) {
            return this.alive;
        }

        this.x += this.vx;
        this.y += this.vy;

        this.tailSegments.unshift({ x: this.x, y: this.y });
        if (this.tailSegments.length > CONFIG.animation.tailSegments) {
            this.tailSegments.pop();
        }

        const margin = 100;
        if (this.exiting &&
            (this.x < -margin || this.x > this.canvasWidth + margin ||
             this.y < -margin || this.y > this.canvasHeight + margin)) {
            this.alive = false;
        }

        return this.alive;
    }

    getVisualProps() {
        return {
            x: this.x,
            y: this.y,
            radius: this.radius,
            tailSegments: this.tailSegments,
            wigglePhase: this.wigglePhase,
            vx: this.vx,
            vy: this.vy,
            blinking: this.blinking,
            eyeOffset: this.eyeOffset,
            eyeSizeRatio: 0.3,
            eyeSpacingRatio: 0.25,
            pupilSizeRatio: 0.45,
            eyeVerticalOffset: -this.radius * 0.1,
            caught: false,
            caughtTime: 0,
            tailWiggleScale: this.radius * 2,
            tailWiggleFreq: 0.6
        };
    }

    isMoving() {
        return this.state === 'moving' || this.state === 'entering' || this.state === 'exiting';
    }

    isPausing() {
        return this.state === 'pausing';
    }
}

export { AnimationCreature };
