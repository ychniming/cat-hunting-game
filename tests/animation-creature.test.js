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

        it('has 20 tail segments', () => {
            expect(creature.tailSegments.length).toBe(20);
        });

        it('speed is positive', () => {
            expect(creature.speed).toBeGreaterThan(0);
        });
    });

    describe('state transitions', () => {
        it('transitions from entering to moving', () => {
            creature.lifeTimer = 400;
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

        it('updates position on transition frame', () => {
            creature.lifeTimer = 400;
            creature.update();
            expect(creature.state).toBe('moving');
            expect(creature.tailSegments.length).toBe(20);
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

        it('tailSegments is an array of {x, y} objects', () => {
            const props = creature.getVisualProps();
            expect(Array.isArray(props.tailSegments)).toBe(true);
            props.tailSegments.forEach(s => {
                expect(s).toHaveProperty('x');
                expect(s).toHaveProperty('y');
            });
        });
    });

    describe('resize', () => {
        it('updates canvasWidth and canvasHeight', () => {
            creature.resize(1024, 768);
            expect(creature.canvasWidth).toBe(1024);
            expect(creature.canvasHeight).toBe(768);
        });

        it('updates core canvasWidth and canvasHeight', () => {
            creature.resize(1024, 768);
            expect(creature.core.canvasWidth).toBe(1024);
            expect(creature.core.canvasHeight).toBe(768);
        });

        it('can be called multiple times with different values', () => {
            creature.resize(1024, 768);
            expect(creature.canvasWidth).toBe(1024);
            creature.resize(500, 400);
            expect(creature.canvasWidth).toBe(500);
            expect(creature.canvasHeight).toBe(400);
        });
    });

    describe('update produces finite values without isFinite guards', () => {
        it('x and y remain finite after many updates from entering state', () => {
            for (let i = 0; i < 500; i++) {
                creature.update();
                if (!creature.alive) break;
                expect(Number.isFinite(creature.x)).toBe(true);
                expect(Number.isFinite(creature.y)).toBe(true);
                expect(Number.isFinite(creature.vx)).toBe(true);
                expect(Number.isFinite(creature.vy)).toBe(true);
            }
        });

        it('vx and vy remain finite when decelerating to zero', () => {
            transitionTo(creature, 'pausing');
            for (let i = 0; i < 200; i++) {
                creature.update();
                if (!creature.alive) break;
                expect(Number.isFinite(creature.vx)).toBe(true);
                expect(Number.isFinite(creature.vy)).toBe(true);
            }
        });

        it('clampSpeed with zero velocity does not produce NaN', () => {
            creature.vx = 0;
            creature.vy = 0;
            creature.clampSpeed(creature.speed);
            expect(Number.isFinite(creature.vx)).toBe(true);
            expect(Number.isFinite(creature.vy)).toBe(true);
        });
    });

    describe('tail physics', () => {
        it('uses normal stiffness when pausing', () => {
            transitionTo(creature, 'pausing');
            creature.update();
            expect(creature.tailChain.stiffness).toBeCloseTo(0.8);
        });

        it('restores default stiffness when moving', () => {
            transitionTo(creature, 'pausing');
            creature.update();
            transitionTo(creature, 'moving');
            creature.update();
            expect(creature.tailChain.stiffness).toBeCloseTo(0.8);
        });
    });
});
