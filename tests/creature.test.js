import { describe, it, expect, beforeEach } from 'vitest';
import { Creature } from '../src/creature.js';

describe('Creature', () => {
    let creature;

    beforeEach(() => {
        creature = new Creature(800, 600);
    });

    describe('construction', () => {
        it('initializes with alive state', () => {
            expect(creature.alive).toBe(true);
        });

        it('initializes with not caught', () => {
            expect(creature.caught).toBe(false);
        });

        it('has positive radius', () => {
            expect(creature.radius).toBeGreaterThan(0);
        });

        it('has tail chain with correct segment count', () => {
            expect(creature.tailSegments.length).toBe(16);
        });

        it('spawns with one coordinate outside canvas', () => {
            const outsideX = creature.x < 0 || creature.x > 800;
            const outsideY = creature.y < 0 || creature.y > 600;
            expect(outsideX || outsideY).toBe(true);
        });
    });

    describe('update', () => {
        it('returns true when alive and not caught', () => {
            const result = creature.update();
            expect(result).toBe(true);
        });

        it('returns false when caught animation finishes', () => {
            creature.caught = true;
            creature.caughtTime = 19;
            const result = creature.update();
            expect(result).toBe(false);
        });

        it('shrinks radius when caught', () => {
            creature.caught = true;
            const prevRadius = creature.radius;
            creature.update();
            expect(creature.radius).toBeLessThan(prevRadius);
        });

        it('increments caughtTime when caught', () => {
            creature.caught = true;
            creature.update();
            expect(creature.caughtTime).toBe(1);
        });

        it('updates tail chain on each frame', () => {
            const segsBefore = creature.tailSegments.map(s => ({ x: s.x, y: s.y }));
            creature.update();
            const segsAfter = creature.tailSegments;
            const anchorMoved = segsAfter[0].x !== segsBefore[0].x || segsAfter[0].y !== segsBefore[0].y;
            expect(anchorMoved).toBe(true);
        });
    });

    describe('checkClick', () => {
        it('detects click on creature', () => {
            creature.x = 400;
            creature.y = 300;
            creature.radius = 20;
            expect(creature.checkClick(400, 300)).toBe(true);
        });

        it('detects click within radius * 2', () => {
            creature.x = 400;
            creature.y = 300;
            creature.radius = 20;
            expect(creature.checkClick(430, 300)).toBe(true);
        });

        it('rejects click outside hit area', () => {
            creature.x = 400;
            creature.y = 300;
            creature.radius = 20;
            expect(creature.checkClick(500, 300)).toBe(false);
        });
    });

    describe('getVisualProps', () => {
        it('returns all required visual properties', () => {
            const props = creature.getVisualProps();
            expect(props).toHaveProperty('x');
            expect(props).toHaveProperty('y');
            expect(props).toHaveProperty('radius');
            expect(props).toHaveProperty('tailSegments');
            expect(props).toHaveProperty('blinking');
            expect(props).toHaveProperty('eyeOffset');
            expect(props).toHaveProperty('eyeSizeRatio');
            expect(props).toHaveProperty('eyeSpacingRatio');
            expect(props).toHaveProperty('caught');
            expect(props).toHaveProperty('caughtTime');
        });

        it('has game-mode specific eye ratios', () => {
            const props = creature.getVisualProps();
            expect(props.eyeSizeRatio).toBe(0.35);
            expect(props.eyeSpacingRatio).toBe(0.3);
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

    describe('semantic methods', () => {
        it('addWiggleOffset adds velocity based on wiggle phase', () => {
            creature.vx = 1;
            creature.vy = 1;
            creature.core.wigglePhase = Math.PI / 4;
            const prevVx = creature.vx;
            const prevVy = creature.vy;
            creature.addWiggleOffset();
            expect(creature.vx).not.toBe(prevVx);
            expect(creature.vy).not.toBe(prevVy);
        });

        it('clampSpeed limits speed to maxSpeed', () => {
            creature.vx = 10;
            creature.vy = 10;
            creature.clampSpeed(4);
            const speed = Math.sqrt(creature.vx * creature.vx + creature.vy * creature.vy);
            expect(speed).toBeLessThanOrEqual(4.01);
        });

        it('clampSpeed does not change speed when below maxSpeed', () => {
            creature.vx = 1;
            creature.vy = 1;
            creature.clampSpeed(4);
            expect(creature.vx).toBe(1);
            expect(creature.vy).toBe(1);
        });

        it('getSpeed returns current speed magnitude', () => {
            creature.vx = 3;
            creature.vy = 4;
            expect(creature.getSpeed()).toBeCloseTo(5);
        });

        it('incrementCaughtTime increments caughtTime', () => {
            creature.caughtTime = 0;
            creature.incrementCaughtTime();
            expect(creature.caughtTime).toBe(1);
        });

        it('shrinkRadius reduces radius', () => {
            creature.radius = 20;
            creature.shrinkRadius();
            expect(creature.radius).toBeLessThan(20);
        });

        it('isCaughtAnimationDone returns true when caughtTime >= 20', () => {
            creature.caughtTime = 20;
            expect(creature.isCaughtAnimationDone()).toBe(true);
        });

        it('isCaughtAnimationDone returns false when caughtTime < 20', () => {
            creature.caughtTime = 10;
            expect(creature.isCaughtAnimationDone()).toBe(false);
        });

        it('isOutOfBounds returns true when outside margin', () => {
            creature.x = -200;
            creature.y = 300;
            expect(creature.isOutOfBounds(100)).toBe(true);
        });

        it('isOutOfBounds returns false when inside margin', () => {
            creature.x = 400;
            creature.y = 300;
            expect(creature.isOutOfBounds(100)).toBe(false);
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

    describe('tailSegments', () => {
        it('returns segments from tail chain', () => {
            const segs = creature.tailSegments;
            expect(segs.length).toBe(16);
        });

        it('segments update after creature moves', () => {
            const initialFirst = creature.tailSegments[0];
            creature.update();
            creature.update();
            const afterFirst = creature.tailSegments[0];
            expect(afterFirst.x).not.toBe(initialFirst.x);
        });
    });
});
