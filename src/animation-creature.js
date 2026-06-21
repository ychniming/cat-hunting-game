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
        this.pauseDuration = 90 + Math.random() * 60;
        this.exitDelay = 180 + Math.random() * 300;
        this.totalLife = 1800 + Math.random() * 3600;
        this.lifeTimer = 0;

        this.core.initSharedProperties({ minRadius: this.radius, maxRadius: this.radius, minWiggleSpeed: 0.08, maxWiggleSpeed: 0.14 });

        const segCount = CONFIG.animation.tailSegments;
        const segLen = CONFIG.tail.segmentLength;
        this.tailChain = this.core.createTail(this.x, this.y, segCount, segLen, {
            stiffness: CONFIG.tail.stiffness,
            damping: CONFIG.tail.damping,
            constraintIterations: CONFIG.tail.constraintIterations
        });

        this.alive = true;
        this.exiting = false;

        this.movePattern = Math.floor(Math.random() * 3);
        this.patternTimer = 0;
        this.patternDuration = 300 + Math.random() * 420;

        this._currentState = new STATE_MAP.entering();
        this._currentState.enter(this);
    }

    get state() {
        return this._currentState.name;
    }

    set state(newStateName) {
        if (this._currentState.name === newStateName) return;
        const allowed = STATE_TRANSITIONS[this._currentState.name];
        if (allowed.indexOf(newStateName) < 0) return;
        this._currentState.exit(this);
        this._currentState = new STATE_MAP[newStateName]();
        this._currentState.enter(this);
    }

    update() {
        if (!this.alive) return false;

        this.core.wigglePhase += this.core.wiggleSpeed;
        this.core.updateBlink(8, 80, 330);

        this.lifeTimer++;

        // 最大寿命强制死亡（防止永远不退出的情况）
        if (this.lifeTimer > this.totalLife + 600) {
            this.alive = false;
            return false;
        }

        const transition = this._currentState.update(this);
        if (transition && STATE_TRANSITIONS[this._currentState.name].indexOf(transition) >= 0) {
            this.state = transition;
        }

        this.x += this.vx;
        this.y += this.vy;

        // 非退出状态下钳制位置，防止飘出屏幕
        if (!this.exiting) {
            const clampMargin = 50;
            this.x = Math.max(-clampMargin, Math.min(this.canvasWidth + clampMargin, this.x));
            this.y = Math.max(-clampMargin, Math.min(this.canvasHeight + clampMargin, this.y));
        }

        this._updateTailPhysics();

        // 退出状态：只有身体和尾巴末端都出了屏幕才判定死亡
        if (this.exiting) {
            const exitMargin = 100;
            const bodyOutside = this.x < -exitMargin || this.x > this.canvasWidth + exitMargin ||
                                this.y < -exitMargin || this.y > this.canvasHeight + exitMargin;
            if (bodyOutside) {
                // 检查尾巴末端是否也出了屏幕
                const tailTipMargin = 20; // 尾巴末端只需稍微出屏即可
                const segments = this.tailChain.getSegments();
                const tailTip = segments[segments.length - 1];
                const tailOutside = tailTip.x < -tailTipMargin || tailTip.x > this.canvasWidth + tailTipMargin ||
                                    tailTip.y < -tailTipMargin || tailTip.y > this.canvasHeight + tailTipMargin;
                if (tailOutside) {
                    this.alive = false;
                }
            }
        }

        // 非退出状态下飘出屏幕过远，视为死亡以触发重生
        const lostMargin = 300;
        if (!this.exiting &&
            (this.x < -lostMargin || this.x > this.canvasWidth + lostMargin ||
             this.y < -lostMargin || this.y > this.canvasHeight + lostMargin)) {
            this.alive = false;
        }

        return this.alive;
    }

    _updateTailPhysics() {
        if (this.state === 'exiting') {
            // 退出时：增加刚度让尾巴紧跟身体
            this.tailChain.setStiffness(CONFIG.tail.stiffness * 1.5);
        } else {
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

    resize(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.core.canvasWidth = canvasWidth;
        this.core.canvasHeight = canvasHeight;
    }

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
        if (Math.abs(this.vx) < 0.01) this.vx = 0;
        if (Math.abs(this.vy) < 0.01) this.vy = 0;
    }

    stopVelocity() {
        this.vx = 0;
        this.vy = 0;
    }

    resetPattern() {
        this.patternTimer = 0;
        this.movePattern = Math.floor(Math.random() * 3);
        this.patternDuration = 300 + Math.random() * 420;
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
        const result = this.core.addVelocityOffset(this.vx, this.vy, dvx, dvy);
        this.vx = result.vx;
        this.vy = result.vy;
    }

    clampSpeed(maxSpeed) {
        const result = this.core.clampSpeed(this.vx, this.vy, maxSpeed);
        this.vx = result.vx;
        this.vy = result.vy;
    }

    applyBoundaryForce(margin, force) {
        // 平滑边界力：距离边界越近力越大，避免突变导致颤动
        if (this.x < margin) {
            const ratio = 1 - this.x / margin;
            this.vx += force * ratio * ratio;
        }
        if (this.x > this.canvasWidth - margin) {
            const ratio = 1 - (this.canvasWidth - this.x) / margin;
            this.vx -= force * ratio * ratio;
        }
        if (this.y < margin) {
            const ratio = 1 - this.y / margin;
            this.vy += force * ratio * ratio;
        }
        if (this.y > this.canvasHeight - margin) {
            const ratio = 1 - (this.canvasHeight - this.y) / margin;
            this.vy -= force * ratio * ratio;
        }
    }

    getSpeed() {
        return this.core.getSpeed(this.vx, this.vy);
    }

    resetStateTimer() {
        this.stateTimer = 0;
    }
}

export { AnimationCreature };
