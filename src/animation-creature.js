import { STATE_MAP, STATE_TRANSITIONS } from './creature-states.js';
import { CONFIG } from './config.js';
import { CreatureCore } from './creature-core.js';

class AnimationCreature {
    constructor(canvasWidth, canvasHeight) {
        this.core = new CreatureCore(canvasWidth, canvasHeight);
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.reset();
    }

    reset() {
        this.radius = 20 + Math.random() * 20;
        const baseSpeed = 3 - (this.radius - 20) / 20 * 1.5;
        this.speed = baseSpeed + Math.random() * 1;

        const pos = this.core.spawnFromEdge(60);
        this.x = pos.x;
        this.y = pos.y;

        this.targetX = this.canvasWidth * 0.15 + Math.random() * this.canvasWidth * 0.7;
        this.targetY = this.canvasHeight * 0.15 + Math.random() * this.canvasHeight * 0.7;

        this.vx = 0;
        this.vy = 0;
        this.stateTimer = 0;
        this.pauseDuration = 120 + Math.random() * 180;
        this.exitDelay = 120 + Math.random() * 180;
        this.totalLife = 600 + Math.random() * 900;
        this.lifeTimer = 0;

        this.core.initSharedProperties({ minRadius: this.radius, maxRadius: this.radius, minWiggleSpeed: 0.08, maxWiggleSpeed: 0.14 });

        const segCount = CONFIG.animation.tailSegments;
        const segLen = CONFIG.tail.segmentLength;
        this.tailChain = this.core.createTail(this.x, this.y, segCount, segLen, {
            gravity: CONFIG.tail.gravity,
            stiffness: CONFIG.tail.stiffness,
            damping: CONFIG.tail.damping,
            constraintIterations: CONFIG.tail.constraintIterations
        });

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

        this.core.wigglePhase += this.core.wiggleSpeed;
        this.core.updateBlink(8, 80, 330);

        this.lifeTimer++;

        const transition = this._currentState.update(this);
        if (transition && STATE_TRANSITIONS[this._currentState.name].includes(transition)) {
            this.state = transition;
        }

        this.x += this.vx;
        this.y += this.vy;

        this._updateTailPhysics();

        const margin = 100;
        if (this.exiting &&
            (this.x < -margin || this.x > this.canvasWidth + margin ||
             this.y < -margin || this.y > this.canvasHeight + margin)) {
            this.alive = false;
        }

        return this.alive;
    }

    _updateTailPhysics() {
        if (this.state === 'pausing') {
            this.tailChain.setGravity(CONFIG.tail.gravity * 2);
            this.tailChain.setStiffness(CONFIG.tail.stiffness * 0.5);
        } else if (this.state === 'exiting') {
            this.tailChain.setGravity(CONFIG.tail.gravity * 0.5);
            this.tailChain.setStiffness(CONFIG.tail.stiffness * 1.2);
        } else {
            this.tailChain.setGravity(CONFIG.tail.gravity);
            this.tailChain.setStiffness(CONFIG.tail.stiffness);
        }
        this.tailChain.update(this.x, this.y);
    }

    get tailSegments() {
        return this.tailChain.getSegments();
    }

    getVisualProps() {
        const base = this.core.getBaseVisualProps(this.x, this.y, this.tailSegments);
        return {
            ...base,
            eyeSizeRatio: 0.3,
            eyeSpacingRatio: 0.25,
            pupilSizeRatio: 0.45,
            eyeVerticalOffset: -this.radius * 0.1,
            caught: false,
            caughtTime: 0
        };
    }

    isMoving() {
        return this.state === 'moving' || this.state === 'entering' || this.state === 'exiting';
    }

    isPausing() {
        return this.state === 'pausing';
    }

    // --- Semantic action methods for state classes ---

    steerToward(targetX, targetY, speed) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const angle = Math.atan2(dy, dx);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    setVelocity(angle, speed) {
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    decelerate(factor) {
        this.vx *= factor;
        this.vy *= factor;
    }

    resetPattern() {
        this.patternTimer = 0;
        this.movePattern = Math.floor(Math.random() * 3);
        this.patternDuration = 100 + Math.random() * 200;
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    incrementPatternTimer() {
        this.patternTimer++;
    }

    isPatternExpired() {
        return this.patternTimer > this.patternDuration;
    }

    isLifeExpiring() {
        return this.lifeTimer > this.totalLife - this.exitDelay;
    }

    incrementStateTimer() {
        this.stateTimer++;
    }

    isPauseDurationExceeded() {
        return this.stateTimer > this.pauseDuration;
    }

    isNearTarget(threshold) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        return Math.sqrt(dx * dx + dy * dy) < threshold;
    }

    isEnteringTimeout(limit) {
        return this.lifeTimer > limit;
    }

    setExiting() {
        this.exiting = true;
    }

    addVelocityOffset(dvx, dvy) {
        this.vx += dvx;
        this.vy += dvy;
    }

    clampSpeed(maxSpeed) {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }
    }

    applyBoundaryForce(margin, force) {
        if (this.x < margin) this.vx += force;
        if (this.x > this.canvasWidth - margin) this.vx -= force;
        if (this.y < margin) this.vy += force;
        if (this.y > this.canvasHeight - margin) this.vy -= force;
    }

    getSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }

    resetStateTimer() {
        this.stateTimer = 0;
    }
}

export { AnimationCreature };
