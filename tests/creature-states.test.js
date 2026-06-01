import { describe, it, expect, beforeEach } from 'vitest';
import { EnteringState, MovingState, PausingState, ExitingState, STATE_TRANSITIONS } from '../src/creature-states.js';

describe('CreatureStates', () => {
    describe('EnteringState', () => {
        let state;
        let creature;

        beforeEach(() => {
            state = new EnteringState();
            creature = {
                targetX: 400, targetY: 300,
                x: 100, y: -60,
                speed: 2,
                vx: 0, vy: 0,
                lifeTimer: 0,
                state: 'entering'
            };
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
            creature.lifeTimer = 200;
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
            creature = {
                patternTimer: 0,
                patternDuration: 100,
                lifeTimer: 0,
                totalLife: 600,
                exitDelay: 120,
                movePattern: 0,
                speed: 2,
                vx: 1, vy: 0,
                wigglePhase: 0,
                x: 400, y: 300,
                canvasWidth: 800,
                canvasHeight: 600,
                state: 'moving'
            };
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
            creature = {
                stateTimer: 0,
                pauseDuration: 120,
                lifeTimer: 0,
                totalLife: 600,
                exitDelay: 120,
                vx: 1, vy: 0,
                state: 'pausing'
            };
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
});
