import { describe, it, expect, beforeEach, vi } from 'vitest';
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

        it('has tail segments', () => {
            expect(creature.tailSegments.length).toBe(8);
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
            expect(props).toHaveProperty('wigglePhase');
            expect(props).toHaveProperty('vx');
            expect(props).toHaveProperty('vy');
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
    });
});
