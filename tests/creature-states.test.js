import { describe, it, expect, beforeEach } from 'vitest';
import { EnteringState, MovingState, PausingState, ExitingState, STATE_TRANSITIONS } from '../src/creature-states.js';

function createMockCreature(overrides = {}) {
    const creature = {
        targetX: 400, targetY: 300,
        x: 100, y: -60,
        speed: 2,
        vx: 0, vy: 0,
        lifeTimer: 0,
        patternTimer: 0,
        patternDuration: 100,
        totalLife: 600,
        exitDelay: 120,
        movePattern: 0,
        core: { wigglePhase: 0, wiggleSpeed: 0.1 },
        canvasWidth: 800,
        canvasHeight: 600,
        stateTimer: 0,
        pauseDuration: 120,
        exiting: false,
        ...overrides
    };

    creature.isNearTarget = (threshold) => {
        const dx = creature.targetX - creature.x;
        const dy = creature.targetY - creature.y;
        return Math.sqrt(dx * dx + dy * dy) < threshold;
    };

    creature.isEnteringTimeout = (limit) => {
        return creature.lifeTimer > limit;
    };

    creature.steerToward = (targetX, targetY, speed) => {
        const dx = targetX - creature.x;
        const dy = targetY - creature.y;
        const angle = Math.atan2(dy, dx);
        creature.vx = Math.cos(angle) * speed;
        creature.vy = Math.sin(angle) * speed;
    };

    creature.setVelocity = (angle, speed) => {
        creature.vx = Math.cos(angle) * speed;
        creature.vy = Math.sin(angle) * speed;
    };

    creature.incrementPatternTimer = () => {
        creature.patternTimer++;
    };

    creature.isPatternExpired = () => {
        return creature.patternTimer > creature.patternDuration;
    };

    creature.isLifeExpiring = () => {
        return creature.lifeTimer > creature.totalLife - creature.exitDelay;
    };

    creature.resetPattern = () => {
        creature.patternTimer = 0;
        creature.movePattern = Math.floor(Math.random() * 3);
        creature.patternDuration = 100 + Math.random() * 200;
        const angle = Math.random() * Math.PI * 2;
        creature.vx = Math.cos(angle) * creature.speed;
        creature.vy = Math.sin(angle) * creature.speed;
    };

    creature.incrementStateTimer = () => {
        creature.stateTimer++;
    };

    creature.decelerate = (factor) => {
        creature.vx *= factor;
        creature.vy *= factor;
    };

    creature.isPauseDurationExceeded = () => {
        return creature.stateTimer > creature.pauseDuration;
    };

    creature.setExiting = () => {
        creature.exiting = true;
    };

    creature.addVelocityOffset = (dvx, dvy) => {
        creature.vx += dvx;
        creature.vy += dvy;
    };

    creature.clampSpeed = (maxSpeed) => {
        const speed = Math.sqrt(creature.vx * creature.vx + creature.vy * creature.vy);
        if (speed > maxSpeed) {
            creature.vx = (creature.vx / speed) * maxSpeed;
            creature.vy = (creature.vy / speed) * maxSpeed;
        }
    };

    creature.applyBoundaryForce = (margin, force) => {
        if (creature.x < margin) creature.vx += force;
        if (creature.x > creature.canvasWidth - margin) creature.vx -= force;
        if (creature.y < margin) creature.vy += force;
        if (creature.y > creature.canvasHeight - margin) creature.vy -= force;
    };

    creature.getSpeed = () => {
        return Math.sqrt(creature.vx * creature.vx + creature.vy * creature.vy);
    };

    creature.resetStateTimer = () => {
        creature.stateTimer = 0;
    };

    return creature;
}

describe('CreatureStates', () => {
    describe('EnteringState', () => {
        let state;
        let creature;

        beforeEach(() => {
            state = new EnteringState();
            creature = createMockCreature();
        });

        it('has name entering', () => {
            expect(state.name).toBe('entering');
        });

        it('transitions to moving when near target', () => {
            creature.x = 395;
            creature.y = 298;
            const transition = state.update(creature);
            expect(transition).toBe('moving');
        });

        it('transitions to moving on timeout', () => {
            creature.lifeTimer = 400;
            const transition = state.update(creature);
            expect(transition).toBe('moving');
        });

        it('stays entering when far from target', () => {
            creature.lifeTimer = 0;
            const transition = state.update(creature);
            expect(transition).toBeNull();
        });
    });

    describe('MovingState', () => {
        let state;
        let creature;

        beforeEach(() => {
            state = new MovingState();
            creature = createMockCreature({
                x: 400, y: 300,
                vx: 1, vy: 0
            });
        });

        it('has name moving', () => {
            expect(state.name).toBe('moving');
        });

        it('transitions to pausing when pattern duration exceeded', () => {
            creature.patternTimer = 101;
            const transition = state.update(creature);
            expect(transition).toBe('pausing');
        });

        it('transitions to exiting when life nearly over', () => {
            creature.lifeTimer = creature.totalLife - creature.exitDelay + 1;
            const transition = state.update(creature);
            expect(transition).toBe('exiting');
        });

        it('stays moving when within pattern duration', () => {
            creature.patternTimer = 50;
            creature.lifeTimer = 0;
            const transition = state.update(creature);
            expect(transition).toBeNull();
        });

        it('enter re-randomizes movePattern', () => {
            const patterns = new Set();
            for (let i = 0; i < 50; i++) {
                state.enter(creature);
                patterns.add(creature.movePattern);
            }
            expect(patterns.size).toBeGreaterThan(1);
        });

        it('enter re-randomizes patternDuration', () => {
            const durations = new Set();
            for (let i = 0; i < 50; i++) {
                state.enter(creature);
                durations.add(creature.patternDuration);
            }
            expect(durations.size).toBeGreaterThan(1);
        });

        it('enter resets patternTimer to 0', () => {
            creature.patternTimer = 999;
            state.enter(creature);
            expect(creature.patternTimer).toBe(0);
        });

        it('caches edge target on enter', () => {
            state.enter(creature);
            expect(state._edgeTarget).not.toBeNull();
            expect(state._edgeTarget).toHaveProperty('x');
            expect(state._edgeTarget).toHaveProperty('y');
        });

        it('caches cross target on enter', () => {
            state.enter(creature);
            expect(state._crossTarget).not.toBeNull();
            expect(state._crossTarget).toHaveProperty('x');
            expect(state._crossTarget).toHaveProperty('y');
        });

        it('edge crawl uses cached target consistently', () => {
            creature.movePattern = 1;
            state.enter(creature);
            const targetX = state._edgeTarget.x;
            const targetY = state._edgeTarget.y;
            state.update(creature);
            expect(state._edgeTarget.x).toBe(targetX);
            expect(state._edgeTarget.y).toBe(targetY);
        });

        it('cross screen uses cached target consistently', () => {
            creature.movePattern = 2;
            state.enter(creature);
            const targetX = state._crossTarget.x;
            const targetY = state._crossTarget.y;
            state.update(creature);
            expect(state._crossTarget.x).toBe(targetX);
            expect(state._crossTarget.y).toBe(targetY);
        });
    });

    describe('PausingState', () => {
        let state;
        let creature;

        beforeEach(() => {
            state = new PausingState();
            creature = createMockCreature({
                vx: 1, vy: 0
            });
        });

        it('has name pausing', () => {
            expect(state.name).toBe('pausing');
        });

        it('transitions to moving when pause duration exceeded', () => {
            creature.stateTimer = 121;
            const transition = state.update(creature);
            expect(transition).toBe('moving');
        });

        it('transitions to exiting when life nearly over', () => {
            creature.lifeTimer = creature.totalLife - creature.exitDelay + 1;
            const transition = state.update(creature);
            expect(transition).toBe('exiting');
        });

        it('stays pausing when within duration', () => {
            creature.stateTimer = 50;
            creature.lifeTimer = 0;
            const transition = state.update(creature);
            expect(transition).toBeNull();
        });
    });

    describe('ExitingState', () => {
        let state;

        beforeEach(() => {
            state = new ExitingState();
        });

        it('has name exiting', () => {
            expect(state.name).toBe('exiting');
        });

        it('never transitions to another state', () => {
            const transition = state.update({});
            expect(transition).toBeNull();
        });
    });

    describe('STATE_TRANSITIONS', () => {
        it('defines entering transitions', () => {
            expect(STATE_TRANSITIONS.entering).toContain('moving');
        });

        it('defines moving transitions', () => {
            expect(STATE_TRANSITIONS.moving).toContain('pausing');
            expect(STATE_TRANSITIONS.moving).toContain('exiting');
        });

        it('defines pausing transitions', () => {
            expect(STATE_TRANSITIONS.pausing).toContain('moving');
            expect(STATE_TRANSITIONS.pausing).toContain('exiting');
        });

        it('exiting has no outgoing transitions', () => {
            expect(STATE_TRANSITIONS.exiting).toEqual([]);
        });
    });

    describe('semantic method usage', () => {
        it('EnteringState uses steerToward instead of direct vx/vy assignment', () => {
            const state = new EnteringState();
            const creature = createMockCreature();
            const originalVx = creature.vx;
            const originalVy = creature.vy;
            state.enter(creature);
            // steerToward should have set vx/vy based on target direction
            const speed = Math.sqrt(creature.vx ** 2 + creature.vy ** 2);
            expect(speed).toBeCloseTo(creature.speed);
        });

        it('PausingState uses decelerate instead of direct vx/vy multiplication', () => {
            const state = new PausingState();
            const creature = createMockCreature({ vx: 10, vy: 5, stateTimer: 0, lifeTimer: 0 });
            state.update(creature);
            expect(creature.vx).toBeCloseTo(8.5);
            expect(creature.vy).toBeCloseTo(4.25);
        });

        it('MovingState uses incrementPatternTimer instead of direct increment', () => {
            const state = new MovingState();
            const creature = createMockCreature({ patternTimer: 50, lifeTimer: 0 });
            state.update(creature);
            expect(creature.patternTimer).toBe(51);
        });

        it('ExitingState uses setExiting instead of direct assignment', () => {
            const state = new ExitingState();
            const creature = createMockCreature({ x: 400, y: 300 });
            state.enter(creature);
            expect(creature.exiting).toBe(true);
        });
    });
});
