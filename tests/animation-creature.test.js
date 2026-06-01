import { describe, it, expect, beforeEach } from 'vitest';
import { AnimationCreature } from '../src/animation-creature.js';

function transitionTo(creature, stateName) {
    if (stateName === 'moving') {
        creature.state = 'moving';
    } else if (stateName === 'pausing') {
        creature.state = 'moving';
        creature.state = 'pausing';
    } else if (stateName === 'exiting') {
        creature.state = 'moving';
        creature.state = 'exiting';
    }
}

describe('AnimationCreature', () => {
    let creature;

    beforeEach(() => {
        creature = new AnimationCreature(800, 600);
    });

    describe('construction', () => {
        it('initializes with alive state', () => {
            expect(creature.alive).toBe(true);
        });

        it('initializes in entering state', () => {
            expect(creature.state).toBe('entering');
        });

        it('has positive radius', () => {
            expect(creature.radius).toBeGreaterThan(0);
        });

        it('has 12 tail segments', () => {
            expect(creature.tailSegments.length).toBe(12);
        });

        it('speed is positive', () => {
            expect(creature.speed).toBeGreaterThan(0);
        });
    });

    describe('state transitions', () => {
        it('transitions from entering to moving', () => {
            creature.lifeTimer = 200;
            creature.update();
            expect(creature.state).toBe('moving');
        });

        it('transitions from moving to pausing', () => {
            transitionTo(creature, 'moving');
            creature.patternTimer = creature.patternDuration + 1;
            creature.lifeTimer = 0;
            creature.update();
            expect(creature.state).toBe('pausing');
        });

        it('transitions from pausing back to moving', () => {
            transitionTo(creature, 'pausing');
            creature.stateTimer = creature.pauseDuration + 1;
            creature.lifeTimer = 0;
            creature.update();
            expect(creature.state).toBe('moving');
        });

        it('transitions to exiting when life expires', () => {
            transitionTo(creature, 'moving');
            creature.lifeTimer = creature.totalLife;
            creature.patternTimer = 0;
            creature.update();
            expect(creature.state).toBe('exiting');
            expect(creature.exiting).toBe(true);
        });

        it('rejects invalid transitions', () => {
            expect(creature.state).toBe('entering');
            creature.state = 'pausing';
            expect(creature.state).toBe('entering');
        });

        it('skips position update on transition frame', () => {
            const prevX = creature.x;
            const prevY = creature.y;
            creature.lifeTimer = 200;
            creature.update();
            expect(creature.x).toBe(prevX);
            expect(creature.y).toBe(prevY);
        });
    });

    describe('isMoving', () => {
        it('returns true for entering state', () => {
            expect(creature.isMoving()).toBe(true);
        });

        it('returns true for moving state', () => {
            transitionTo(creature, 'moving');
            expect(creature.isMoving()).toBe(true);
        });

        it('returns true for exiting state', () => {
            transitionTo(creature, 'exiting');
            expect(creature.isMoving()).toBe(true);
        });

        it('returns false for pausing state', () => {
            transitionTo(creature, 'pausing');
            expect(creature.isMoving()).toBe(false);
        });
    });

    describe('isPausing', () => {
        it('returns true for pausing state', () => {
            transitionTo(creature, 'pausing');
            expect(creature.isPausing()).toBe(true);
        });

        it('returns false for moving state', () => {
            transitionTo(creature, 'moving');
            expect(creature.isPausing()).toBe(false);
        });
    });

    describe('getVisualProps', () => {
        it('returns animation-mode specific eye ratios', () => {
            const props = creature.getVisualProps();
            expect(props.eyeSizeRatio).toBe(0.3);
            expect(props.eyeSpacingRatio).toBe(0.25);
            expect(props.pupilSizeRatio).toBe(0.45);
        });

        it('caught is always false for animation creature', () => {
            const props = creature.getVisualProps();
            expect(props.caught).toBe(false);
        });
    });
});
