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
        if (creature.isNearTarget(10) || creature.isEnteringTimeout(120)) {
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
        const noiseX = Math.sin(creature.wigglePhase * 2) * 0.3;
        const noiseY = Math.cos(creature.wigglePhase * 1.7) * 0.3;

        creature.addVelocityOffset(noiseX, noiseY);
        creature.clampSpeed(creature.speed);

        const speed = creature.getSpeed();
        if (speed < creature.speed * 0.5) {
            const angle = Math.random() * Math.PI * 2;
            creature.setVelocity(angle, creature.speed);
        }

        creature.applyBoundaryForce(100, 0.2);
    }

    _moveEdgeCrawl(creature) {
        if (!this._edgeTarget) return;
        creature.steerToward(this._edgeTarget.x, this._edgeTarget.y, creature.speed * 0.8);
    }

    _moveCrossScreen(creature) {
        if (!this._crossTarget) return;
        const dx = this._crossTarget.x - creature.x;
        const dy = this._crossTarget.y - creature.y;
        const angle = Math.atan2(dy, dx);
        const wobbleAngle = angle + Math.sin(creature.wigglePhase) * 0.1;
        creature.setVelocity(wobbleAngle, creature.speed);
    }
}

class PausingState {
    constructor() {
        this.name = 'pausing';
    }

    update(creature) {
        creature.incrementStateTimer();
        creature.decelerate(0.9);

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
    }

    update(creature) {
        if (!this._exitTarget) return null;

        const dx = this._exitTarget.x - creature.x;
        const dy = this._exitTarget.y - creature.y;

        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
            creature.setVelocity(0, creature.speed * 1.5);
        } else {
            creature.steerToward(this._exitTarget.x, this._exitTarget.y, creature.speed * 1.5);
        }

        return null;
    }

    enter(creature) {
        creature.setExiting();

        const margin = 100;
        const candidates = [
            { x: -margin, y: creature.y },
            { x: creature.canvasWidth + margin, y: creature.y },
            { x: creature.x, y: -margin },
            { x: creature.x, y: creature.canvasHeight + margin }
        ];

        let nearest = candidates[0];
        let nearestDist = Infinity;
        for (const c of candidates) {
            const d = Math.sqrt((c.x - creature.x) ** 2 + (c.y - creature.y) ** 2);
            if (d < nearestDist) {
                nearestDist = d;
                nearest = c;
            }
        }

        this._exitTarget = nearest;
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
