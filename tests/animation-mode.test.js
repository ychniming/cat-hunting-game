import { describe, it, expect, beforeEach } from 'vitest';
import { AnimationMode } from '../src/animation-mode.js';

describe('AnimationMode', () => {
    let animMode;

    beforeEach(() => {
        animMode = new AnimationMode(800, 600);
    });

    describe('start', () => {
        it('sets running to true', () => {
            animMode.start('infinite');
            expect(animMode.running).toBe(true);
        });

        it('resets creature to null', () => {
            animMode.creature = {};
            animMode.start('infinite');
            expect(animMode.creature).toBeNull();
        });

        it('sets duration from key', () => {
            animMode.start('30min');
            expect(animMode.duration).toBe(30 * 60 * 1000);
        });

        it('defaults to infinite for unknown key', () => {
            animMode.start('unknown');
            expect(animMode.duration).toBe(Infinity);
        });
    });

    describe('stop', () => {
        it('sets running to false', () => {
            animMode.start('infinite');
            animMode.stop();
            expect(animMode.running).toBe(false);
        });
    });

    describe('update', () => {
        it('returns soundEvents array', () => {
            animMode.start('infinite');
            const result = animMode.update();
            expect(result).toHaveProperty('soundEvents');
            expect(Array.isArray(result.soundEvents)).toBe(true);
        });

        it('spawns creature after delay', () => {
            animMode.start('infinite');
            for (let i = 0; i < 70; i++) {
                animMode.update();
            }
            expect(animMode.creature).not.toBeNull();
        });

        it('returns expired true when duration exceeded', () => {
            animMode.start('30min');
            animMode.startTime = Date.now() - (30 * 60 * 1000 + 1);
            const result = animMode.update();
            expect(result.expired).toBe(true);
        });
    });

    describe('resize', () => {
        it('updates canvas dimensions', () => {
            animMode.resize(1024, 768);
            expect(animMode.canvasWidth).toBe(1024);
            expect(animMode.canvasHeight).toBe(768);
        });
    });
});
