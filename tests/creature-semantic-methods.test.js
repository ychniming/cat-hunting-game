import { describe, it, expect, beforeEach } from 'vitest';
import { AnimationCreature } from '../src/animation-creature.js';

describe('AnimationCreature semantic methods', () => {
    let creature;

    beforeEach(() => {
        creature = new AnimationCreature(800, 600);
    });

    describe('steerToward', () => {
        it('sets velocity toward target', () => {
            creature.x = 400;
            creature.y = 300;
            creature.steerToward(500, 300, 2);
            expect(creature.vx).toBeCloseTo(2);
            expect(creature.vy).toBeCloseTo(0);
        });

        it('sets velocity toward target at angle', () => {
            creature.x = 0;
            creature.y = 0;
            creature.steerToward(100, 100, Math.SQRT2);
            expect(creature.vx).toBeCloseTo(1, 3);
            expect(creature.vy).toBeCloseTo(1, 3);
        });

        it('handles target at current position (zero distance)', () => {
            creature.x = 400;
            creature.y = 300;
            creature.steerToward(400, 300, 2);
            // When distance is 0, atan2(0,0) = 0, so vx=speed, vy=0
            expect(creature.vx).toBeCloseTo(2);
            expect(creature.vy).toBeCloseTo(0);
        });

        it('handles target at origin (0,0)', () => {
            creature.x = 100;
            creature.y = 0;
            creature.steerToward(0, 0, 2);
            expect(creature.vx).toBeCloseTo(-2);
            expect(creature.vy).toBeCloseTo(0);
        });

        it('respects speed parameter', () => {
            creature.x = 0;
            creature.y = 0;
            creature.steerToward(100, 0, 5);
            expect(creature.vx).toBeCloseTo(5);
            expect(creature.vy).toBeCloseTo(0);
        });
    });

    describe('setVelocity', () => {
        it('sets velocity from angle and speed', () => {
            creature.setVelocity(0, 3);
            expect(creature.vx).toBeCloseTo(3);
            expect(creature.vy).toBeCloseTo(0);
        });

        it('sets velocity at 90 degrees', () => {
            creature.setVelocity(Math.PI / 2, 2);
            expect(creature.vx).toBeCloseTo(0, 3);
            expect(creature.vy).toBeCloseTo(2);
        });

        it('sets velocity at 180 degrees', () => {
            creature.setVelocity(Math.PI, 2);
            expect(creature.vx).toBeCloseTo(-2);
            expect(creature.vy).toBeCloseTo(0, 3);
        });

        it('sets velocity with zero speed', () => {
            creature.setVelocity(Math.PI / 4, 0);
            expect(creature.vx).toBeCloseTo(0);
            expect(creature.vy).toBeCloseTo(0);
        });
    });

    describe('decelerate', () => {
        it('reduces velocity by factor', () => {
            creature.vx = 10;
            creature.vy = 5;
            creature.decelerate(0.9);
            expect(creature.vx).toBeCloseTo(9);
            expect(creature.vy).toBeCloseTo(4.5);
        });

        it('stops completely with factor 0', () => {
            creature.vx = 10;
            creature.vy = 5;
            creature.decelerate(0);
            expect(creature.vx).toBeCloseTo(0);
            expect(creature.vy).toBeCloseTo(0);
        });

        it('no change with factor 1', () => {
            creature.vx = 10;
            creature.vy = 5;
            creature.decelerate(1);
            expect(creature.vx).toBeCloseTo(10);
            expect(creature.vy).toBeCloseTo(5);
        });
    });

    describe('resetPattern', () => {
        it('resets patternTimer to 0', () => {
            creature.patternTimer = 999;
            creature.resetPattern();
            expect(creature.patternTimer).toBe(0);
        });

        it('re-randomizes movePattern', () => {
            const patterns = new Set();
            for (let i = 0; i < 50; i++) {
                creature.resetPattern();
                patterns.add(creature.movePattern);
            }
            expect(patterns.size).toBeGreaterThan(1);
        });

        it('re-randomizes patternDuration', () => {
            const durations = new Set();
            for (let i = 0; i < 50; i++) {
                creature.resetPattern();
                durations.add(creature.patternDuration);
            }
            expect(durations.size).toBeGreaterThan(1);
        });

        it('sets random initial velocity', () => {
            creature.vx = 0;
            creature.vy = 0;
            creature.resetPattern();
            // After reset, velocity should be set based on random angle
            const speed = Math.sqrt(creature.vx ** 2 + creature.vy ** 2);
            expect(speed).toBeCloseTo(creature.speed);
        });
    });

    describe('incrementPatternTimer', () => {
        it('increments patternTimer by 1', () => {
            creature.patternTimer = 5;
            creature.incrementPatternTimer();
            expect(creature.patternTimer).toBe(6);
        });

        it('increments from 0', () => {
            creature.patternTimer = 0;
            creature.incrementPatternTimer();
            expect(creature.patternTimer).toBe(1);
        });
    });

    describe('isPatternExpired', () => {
        it('returns false when patternTimer <= patternDuration', () => {
            creature.patternTimer = 50;
            creature.patternDuration = 100;
            expect(creature.isPatternExpired()).toBe(false);
        });

        it('returns true when patternTimer > patternDuration', () => {
            creature.patternTimer = 101;
            creature.patternDuration = 100;
            expect(creature.isPatternExpired()).toBe(true);
        });

        it('returns false when patternTimer equals patternDuration', () => {
            creature.patternTimer = 100;
            creature.patternDuration = 100;
            expect(creature.isPatternExpired()).toBe(false);
        });
    });

    describe('isLifeExpiring', () => {
        it('returns false when lifeTimer is well within lifespan', () => {
            creature.lifeTimer = 0;
            creature.totalLife = 600;
            creature.exitDelay = 120;
            expect(creature.isLifeExpiring()).toBe(false);
        });

        it('returns true when lifeTimer exceeds totalLife minus exitDelay', () => {
            creature.lifeTimer = 481;
            creature.totalLife = 600;
            creature.exitDelay = 120;
            expect(creature.isLifeExpiring()).toBe(true);
        });

        it('returns false when lifeTimer equals totalLife minus exitDelay', () => {
            creature.lifeTimer = 480;
            creature.totalLife = 600;
            creature.exitDelay = 120;
            expect(creature.isLifeExpiring()).toBe(false);
        });

        it('returns true when lifeTimer equals totalLife', () => {
            creature.lifeTimer = 600;
            creature.totalLife = 600;
            creature.exitDelay = 120;
            expect(creature.isLifeExpiring()).toBe(true);
        });
    });

    describe('incrementStateTimer', () => {
        it('increments stateTimer by 1', () => {
            creature.stateTimer = 5;
            creature.incrementStateTimer();
            expect(creature.stateTimer).toBe(6);
        });
    });

    describe('isPauseDurationExceeded', () => {
        it('returns false when stateTimer <= pauseDuration', () => {
            creature.stateTimer = 50;
            creature.pauseDuration = 120;
            expect(creature.isPauseDurationExceeded()).toBe(false);
        });

        it('returns true when stateTimer > pauseDuration', () => {
            creature.stateTimer = 121;
            creature.pauseDuration = 120;
            expect(creature.isPauseDurationExceeded()).toBe(true);
        });
    });

    describe('isNearTarget', () => {
        it('returns true when close to target', () => {
            creature.x = 400;
            creature.y = 300;
            creature.targetX = 405;
            creature.targetY = 302;
            expect(creature.isNearTarget(10)).toBe(true);
        });

        it('returns false when far from target', () => {
            creature.x = 100;
            creature.y = 100;
            creature.targetX = 400;
            creature.targetY = 300;
            expect(creature.isNearTarget(10)).toBe(false);
        });

        it('returns true when exactly at target', () => {
            creature.x = 400;
            creature.y = 300;
            creature.targetX = 400;
            creature.targetY = 300;
            expect(creature.isNearTarget(10)).toBe(true);
        });
    });

    describe('isEnteringTimeout', () => {
        it('returns false when lifeTimer is within limit', () => {
            creature.lifeTimer = 50;
            expect(creature.isEnteringTimeout(120)).toBe(false);
        });

        it('returns true when lifeTimer exceeds limit', () => {
            creature.lifeTimer = 200;
            expect(creature.isEnteringTimeout(120)).toBe(true);
        });

        it('returns false when lifeTimer equals limit', () => {
            creature.lifeTimer = 120;
            expect(creature.isEnteringTimeout(120)).toBe(false);
        });
    });

    describe('setExiting', () => {
        it('sets exiting flag to true', () => {
            creature.exiting = false;
            creature.setExiting();
            expect(creature.exiting).toBe(true);
        });
    });

    describe('addVelocityOffset', () => {
        it('adds offset to velocity', () => {
            creature.vx = 1;
            creature.vy = 0;
            creature.addVelocityOffset(0.3, 0.5);
            expect(creature.vx).toBeCloseTo(1.3);
            expect(creature.vy).toBeCloseTo(0.5);
        });

        it('adds negative offset', () => {
            creature.vx = 2;
            creature.vy = 1;
            creature.addVelocityOffset(-1, -0.5);
            expect(creature.vx).toBeCloseTo(1);
            expect(creature.vy).toBeCloseTo(0.5);
        });

        it('adds zero offset (no change)', () => {
            creature.vx = 3;
            creature.vy = 2;
            creature.addVelocityOffset(0, 0);
            expect(creature.vx).toBeCloseTo(3);
            expect(creature.vy).toBeCloseTo(2);
        });
    });

    describe('clampSpeed', () => {
        it('clamps speed when exceeding max', () => {
            creature.vx = 10;
            creature.vy = 0;
            creature.clampSpeed(5);
            expect(creature.vx).toBeCloseTo(5);
            expect(creature.vy).toBeCloseTo(0);
        });

        it('does not change velocity when under max', () => {
            creature.vx = 2;
            creature.vy = 1;
            creature.clampSpeed(5);
            expect(creature.vx).toBeCloseTo(2);
            expect(creature.vy).toBeCloseTo(1);
        });

        it('preserves direction when clamping', () => {
            creature.vx = 6;
            creature.vy = 8;
            creature.clampSpeed(5);
            const speed = Math.sqrt(creature.vx ** 2 + creature.vy ** 2);
            expect(speed).toBeCloseTo(5);
            expect(creature.vx / creature.vy).toBeCloseTo(0.75);
        });

        it('handles zero velocity', () => {
            creature.vx = 0;
            creature.vy = 0;
            creature.clampSpeed(5);
            expect(creature.vx).toBeCloseTo(0);
            expect(creature.vy).toBeCloseTo(0);
        });
    });

    describe('applyBoundaryForce', () => {
        it('pushes right when x < margin (smooth quadratic)', () => {
            creature.x = 50;
            creature.vx = 0;
            creature.vy = 0;
            creature.applyBoundaryForce(100, 0.2);
            // ratio = 1 - 50/100 = 0.5, force = 0.2 * 0.5^2 = 0.05
            expect(creature.vx).toBeCloseTo(0.05);
        });

        it('pushes left when x > canvasWidth - margin (smooth quadratic)', () => {
            creature.x = 750;
            creature.vx = 0;
            creature.vy = 0;
            creature.applyBoundaryForce(100, 0.2);
            // ratio = 1 - (800-750)/100 = 0.5, force = 0.2 * 0.5^2 = 0.05
            expect(creature.vx).toBeCloseTo(-0.05);
        });

        it('pushes down when y < margin (smooth quadratic)', () => {
            creature.x = 400;
            creature.y = 50;
            creature.vx = 0;
            creature.vy = 0;
            creature.applyBoundaryForce(100, 0.2);
            // ratio = 1 - 50/100 = 0.5, force = 0.2 * 0.5^2 = 0.05
            expect(creature.vy).toBeCloseTo(0.05);
        });

        it('pushes up when y > canvasHeight - margin (smooth quadratic)', () => {
            creature.x = 400;
            creature.y = 550;
            creature.vx = 0;
            creature.vy = 0;
            creature.applyBoundaryForce(100, 0.2);
            // ratio = 1 - (600-550)/100 = 0.5, force = 0.2 * 0.5^2 = 0.05
            expect(creature.vy).toBeCloseTo(-0.05);
        });

        it('no force when in center', () => {
            creature.x = 400;
            creature.y = 300;
            creature.vx = 0;
            creature.vy = 0;
            creature.applyBoundaryForce(100, 0.2);
            expect(creature.vx).toBeCloseTo(0);
            expect(creature.vy).toBeCloseTo(0);
        });

        it('maximum force at edge (x=0)', () => {
            creature.x = 0;
            creature.vx = 0;
            creature.vy = 0;
            creature.applyBoundaryForce(100, 0.2);
            // ratio = 1 - 0/100 = 1.0, force = 0.2 * 1.0^2 = 0.2
            expect(creature.vx).toBeCloseTo(0.2);
        });
    });

    describe('getSpeed', () => {
        it('returns speed from velocity', () => {
            creature.vx = 3;
            creature.vy = 4;
            expect(creature.getSpeed()).toBeCloseTo(5);
        });

        it('returns 0 when velocity is zero', () => {
            creature.vx = 0;
            creature.vy = 0;
            expect(creature.getSpeed()).toBeCloseTo(0);
        });

        it('returns correct speed for single axis', () => {
            creature.vx = 2.5;
            creature.vy = 0;
            expect(creature.getSpeed()).toBeCloseTo(2.5);
        });
    });

    describe('resetStateTimer', () => {
        it('resets stateTimer to 0', () => {
            creature.stateTimer = 100;
            creature.resetStateTimer();
            expect(creature.stateTimer).toBe(0);
        });

        it('resets from 0 stays 0', () => {
            creature.stateTimer = 0;
            creature.resetStateTimer();
            expect(creature.stateTimer).toBe(0);
        });
    });
});
