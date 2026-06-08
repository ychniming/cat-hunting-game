const STATE_TRANSITIONS = Object.freeze({
    entering: ['moving'],
    moving: ['pausing', 'exiting'],
    pausing: ['moving', 'exiting'],
    exiting: []
});

class EnteringState {
    constructor() {
        this.name = 'entering';
    }

    update(creature) {
        if (creature.isNearTarget(10) || creature.isEnteringTimeout(360)) {
            return 'moving';
        }

        creature.steerToward(creature.targetX, creature.targetY, creature.speed);
        return null;
    }

    enter(creature) {
        creature.steerToward(creature.targetX, creature.targetY, creature.speed);
    }

    exit() {}
}

class MovingState {
    constructor() {
        this.name = 'moving';
        this._edgeTarget = null;
        this._crossTarget = null;
    }

    update(creature) {
        creature.incrementPatternTimer();

        if (creature.isPatternExpired()) {
            return 'pausing';
        }

        if (creature.isLifeExpiring()) {
            return 'exiting';
        }

        switch(creature.movePattern) {
            case 0:
                this._moveWander(creature);
                break;
            case 1:
                this._moveEdgeCrawl(creature);
                break;
            case 2:
                this._moveCrossScreen(creature);
                break;
        }

        return null;
    }

    enter(creature) {
        creature.resetPattern();
        this._edgeTarget = this._computeEdgeTarget(creature);
        this._crossTarget = this._computeCrossTarget(creature);
    }

    exit() {}

    _computeEdgeTarget(creature) {
        const edgeMargin = 80;
        if (creature.x < edgeMargin) {
            return { x: edgeMargin, y: Math.random() * creature.canvasHeight };
        } else if (creature.x > creature.canvasWidth - edgeMargin) {
            return { x: creature.canvasWidth - edgeMargin, y: Math.random() * creature.canvasHeight };
        } else if (creature.y < edgeMargin) {
            return { x: Math.random() * creature.canvasWidth, y: edgeMargin };
        } else if (creature.y > creature.canvasHeight - edgeMargin) {
            return { x: Math.random() * creature.canvasWidth, y: creature.canvasHeight - edgeMargin };
        } else {
            const edges = [
                { x: edgeMargin, y: creature.y },
                { x: creature.canvasWidth - edgeMargin, y: creature.y },
                { x: creature.x, y: edgeMargin },
                { x: creature.x, y: creature.canvasHeight - edgeMargin }
            ];
            return edges[Math.floor(Math.random() * edges.length)];
        }
    }

    _computeCrossTarget(creature) {
        const edgeMargin = 100;
        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0:
                return { x: Math.random() * creature.canvasWidth, y: edgeMargin };
            case 1:
                return { x: creature.canvasWidth - edgeMargin, y: Math.random() * creature.canvasHeight };
            case 2:
                return { x: Math.random() * creature.canvasWidth, y: creature.canvasHeight - edgeMargin };
            default:
                return { x: edgeMargin, y: Math.random() * creature.canvasHeight };
        }
    }

    _moveWander(creature) {
        const noiseX = Math.sin(creature.core.wigglePhase * 2) * 0.15;
        const noiseY = Math.cos(creature.core.wigglePhase * 1.7) * 0.15;

        creature.addVelocityOffset(noiseX, noiseY);
        creature.clampSpeed(creature.speed);

        const speed = creature.getSpeed();
        if (speed < creature.speed * 0.5) {
            const angle = Math.random() * Math.PI * 2;
            creature.setVelocity(angle, creature.speed);
        }

        creature.applyBoundaryForce(100, 0.15);
    }

    _moveEdgeCrawl(creature) {
        if (!this._edgeTarget) return;
        creature.steerToward(this._edgeTarget.x, this._edgeTarget.y, creature.speed * 0.8);
        creature.applyBoundaryForce(100, 0.3);
    }

    _moveCrossScreen(creature) {
        if (!this._crossTarget) return;
        const dx = this._crossTarget.x - creature.x;
        const dy = this._crossTarget.y - creature.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 30) {
            creature.decelerate(0.92);
        } else {
            const angle = Math.atan2(dy, dx);
            const wobbleAngle = angle + Math.sin(creature.core.wigglePhase) * 0.1;
            creature.setVelocity(wobbleAngle, creature.speed);
        }
        creature.applyBoundaryForce(100, 0.3);
    }
}

class PausingState {
    constructor() {
        this.name = 'pausing';
    }

    update(creature) {
        creature.incrementStateTimer();
        creature.decelerate(0.85);

        // 速度足够小时直接归零，防止微速度导致的颤动
        if (creature.getSpeed() < 0.05) {
            creature.vx = 0;
            creature.vy = 0;
        }

        if (creature.isPauseDurationExceeded()) {
            return 'moving';
        }

        if (creature.isLifeExpiring()) {
            return 'exiting';
        }

        return null;
    }

    enter(creature) {
        creature.resetStateTimer();
    }

    exit() {}
}

class ExitingState {
    constructor() {
        this.name = 'exiting';
        this._exitTarget = null;
        this._exitAngle = 0;
    }

    update(creature) {
        if (!this._exitTarget) return null;

        const dx = this._exitTarget.x - creature.x;
        const dy = this._exitTarget.y - creature.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 如果已经过了目标点或非常接近，直接朝边缘外方向加速
        if (dist < 5) {
            creature.setVelocity(this._exitAngle, creature.speed * 2);
        } else {
            creature.steerToward(this._exitTarget.x, this._exitTarget.y, creature.speed * 1.5);
        }

        return null;
    }

    enter(creature) {
        creature.setExiting();

        // 计算从屏幕中心到生物位置的方向，生物应该朝远离中心的方向离开
        const cx = creature.canvasWidth / 2;
        const cy = creature.canvasHeight / 2;
        this._exitAngle = Math.atan2(creature.y - cy, creature.x - cx);

        // 如果生物在中心附近，随机选一个方向
        if (Math.abs(creature.x - cx) < 50 && Math.abs(creature.y - cy) < 50) {
            this._exitAngle = Math.random() * Math.PI * 2;
        }

        // 目标点设在屏幕外较远处，确保生物能走出去
        const farMargin = 200;
        this._exitTarget = {
            x: cx + Math.cos(this._exitAngle) * (Math.max(creature.canvasWidth, creature.canvasHeight) + farMargin),
            y: cy + Math.sin(this._exitAngle) * (Math.max(creature.canvasWidth, creature.canvasHeight) + farMargin)
        };

        // 立即设置朝目标方向的初速度
        creature.setVelocity(this._exitAngle, creature.speed * 1.5);
    }

    exit() {}
}

const STATE_MAP = {
    entering: EnteringState,
    moving: MovingState,
    pausing: PausingState,
    exiting: ExitingState
};

export {
    EnteringState,
    MovingState,
    PausingState,
    ExitingState,
    STATE_TRANSITIONS,
    STATE_MAP
};
