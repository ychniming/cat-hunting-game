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
        const dx = creature.targetX - creature.x;
        const dy = creature.targetY - creature.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10 || creature.lifeTimer > 120) {
            return 'moving';
        }

        const angle = Math.atan2(dy, dx);
        creature.vx = Math.cos(angle) * creature.speed;
        creature.vy = Math.sin(angle) * creature.speed;
        return null;
    }

    enter(creature) {
        const angle = Math.atan2(creature.targetY - creature.y, creature.targetX - creature.x);
        creature.vx = Math.cos(angle) * creature.speed;
        creature.vy = Math.sin(angle) * creature.speed;
    }

    exit() {}
}

class MovingState {
    constructor() {
        this.name = 'moving';
    }

    update(creature) {
        creature.patternTimer++;

        if (creature.patternTimer > creature.patternDuration) {
            return 'pausing';
        }

        if (creature.lifeTimer > creature.totalLife - creature.exitDelay) {
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
        creature.patternTimer = 0;
        creature.movePattern = Math.floor(Math.random() * 3);
        creature.patternDuration = 100 + Math.random() * 200;
        const angle = Math.random() * Math.PI * 2;
        creature.vx = Math.cos(angle) * creature.speed;
        creature.vy = Math.sin(angle) * creature.speed;
    }

    exit() {}

    _moveWander(creature) {
        const noiseX = Math.sin(creature.wigglePhase * 2) * 0.3;
        const noiseY = Math.cos(creature.wigglePhase * 1.7) * 0.3;

        creature.vx += noiseX;
        creature.vy += noiseY;

        const speed = Math.sqrt(creature.vx * creature.vx + creature.vy * creature.vy);
        if (speed > creature.speed) {
            creature.vx = (creature.vx / speed) * creature.speed;
            creature.vy = (creature.vy / speed) * creature.speed;
        } else if (speed < creature.speed * 0.5) {
            const angle = Math.random() * Math.PI * 2;
            creature.vx = Math.cos(angle) * creature.speed;
            creature.vy = Math.sin(angle) * creature.speed;
        }

        if (creature.x < 100) creature.vx += 0.2;
        if (creature.x > creature.canvasWidth - 100) creature.vx -= 0.2;
        if (creature.y < 100) creature.vy += 0.2;
        if (creature.y > creature.canvasHeight - 100) creature.vy -= 0.2;
    }

    _moveEdgeCrawl(creature) {
        const edgeMargin = 80;
        let targetX, targetY;

        if (creature.x < edgeMargin) {
            targetX = edgeMargin;
            targetY = Math.random() * creature.canvasHeight;
        } else if (creature.x > creature.canvasWidth - edgeMargin) {
            targetX = creature.canvasWidth - edgeMargin;
            targetY = Math.random() * creature.canvasHeight;
        } else if (creature.y < edgeMargin) {
            targetX = Math.random() * creature.canvasWidth;
            targetY = edgeMargin;
        } else if (creature.y > creature.canvasHeight - edgeMargin) {
            targetX = Math.random() * creature.canvasWidth;
            targetY = creature.canvasHeight - edgeMargin;
        } else {
            const edges = [
                { x: edgeMargin, y: creature.y },
                { x: creature.canvasWidth - edgeMargin, y: creature.y },
                { x: creature.x, y: edgeMargin },
                { x: creature.x, y: creature.canvasHeight - edgeMargin }
            ];
            const target = edges[Math.floor(Math.random() * edges.length)];
            targetX = target.x;
            targetY = target.y;
        }

        const dx = targetX - creature.x;
        const dy = targetY - creature.y;
        const angle = Math.atan2(dy, dx);
        creature.vx = Math.cos(angle) * creature.speed * 0.8;
        creature.vy = Math.sin(angle) * creature.speed * 0.8;
    }

    _moveCrossScreen(creature) {
        const edgeMargin = 100;
        let targetX, targetY;

        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0:
                targetX = Math.random() * creature.canvasWidth;
                targetY = edgeMargin;
                break;
            case 1:
                targetX = creature.canvasWidth - edgeMargin;
                targetY = Math.random() * creature.canvasHeight;
                break;
            case 2:
                targetX = Math.random() * creature.canvasWidth;
                targetY = creature.canvasHeight - edgeMargin;
                break;
            case 3:
                targetX = edgeMargin;
                targetY = Math.random() * creature.canvasHeight;
                break;
        }

        const dx = targetX - creature.x;
        const dy = targetY - creature.y;
        const angle = Math.atan2(dy, dx);

        creature.vx = Math.cos(angle + Math.sin(creature.wigglePhase) * 0.1) * creature.speed;
        creature.vy = Math.sin(angle + Math.sin(creature.wigglePhase) * 0.1) * creature.speed;
    }
}

class PausingState {
    constructor() {
        this.name = 'pausing';
    }

    update(creature) {
        creature.stateTimer++;
        creature.vx *= 0.9;
        creature.vy *= 0.9;

        if (creature.stateTimer > creature.pauseDuration) {
            return 'moving';
        }

        if (creature.lifeTimer > creature.totalLife - creature.exitDelay) {
            return 'exiting';
        }

        return null;
    }

    enter(creature) {
        creature.stateTimer = 0;
        creature.vx = 0;
        creature.vy = 0;
    }

    exit() {}
}

class ExitingState {
    constructor() {
        this.name = 'exiting';
    }

    update(creature) {
        const margin = 100;

        const dists = [
            creature.x + margin,
            creature.canvasWidth + margin - creature.x,
            creature.y + margin,
            creature.canvasHeight + margin - creature.y
        ];

        let minIdx = 0;
        for (let i = 1; i < 4; i++) {
            if (dists[i] < dists[minIdx]) {
                minIdx = i;
            }
        }

        const exitX = minIdx === 0 ? -margin : minIdx === 1 ? creature.canvasWidth + margin : creature.x;
        const exitY = minIdx === 2 ? -margin : minIdx === 3 ? creature.canvasHeight + margin : creature.y;

        const dx = exitX - creature.x;
        const dy = exitY - creature.y;

        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
            creature.vx = creature.speed * 1.5;
            creature.vy = 0;
        } else {
            const angle = Math.atan2(dy, dx);
            creature.vx = Math.cos(angle) * creature.speed * 1.5;
            creature.vy = Math.sin(angle) * creature.speed * 1.5;
        }

        return null;
    }

    enter(creature) {
        creature.exiting = true;
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
