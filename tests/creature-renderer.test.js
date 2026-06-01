import { describe, it, expect } from 'vitest';
import { renderCreature } from '../src/creature-renderer.js';

function createMockCtx() {
    const calls = [];
    const handler = {
        get(target, prop) {
            if (prop === 'save' || prop === 'restore' || prop === 'beginPath' || prop === 'fill' || prop === 'stroke') {
                return () => calls.push(prop);
            }
            if (prop === 'arc' || prop === 'ellipse' || prop === 'moveTo' || prop === 'lineTo') {
                return (...args) => calls.push({ method: prop, args });
            }
            if (prop === 'fillRect') {
                return (...args) => calls.push({ method: prop, args });
            }
            return undefined;
        }
    };
    const ctx = new Proxy({}, handler);
    return { ctx, calls };
}

describe('CreatureRenderer', () => {
    describe('renderCreature', () => {
        it('does nothing when radius < 1', () => {
            const { ctx, calls } = createMockCtx();
            renderCreature(ctx, {
                x: 100, y: 100, radius: 0.5,
                tailSegments: [], wigglePhase: 0,
                vx: 1, vy: 0, blinking: false, eyeOffset: 0,
                eyeSizeRatio: 0.35, eyeSpacingRatio: 0.3, pupilSizeRatio: 0.5,
                eyeVerticalOffset: -2, caught: false, caughtTime: 0,
                tailWiggleScale: 8, tailWiggleFreq: 0.8
            });
            expect(calls.length).toBe(0);
        });

        it('calls save and restore', () => {
            const { ctx, calls } = createMockCtx();
            renderCreature(ctx, {
                x: 100, y: 100, radius: 20,
                tailSegments: [], wigglePhase: 0,
                vx: 1, vy: 0, blinking: false, eyeOffset: 0,
                eyeSizeRatio: 0.35, eyeSpacingRatio: 0.3, pupilSizeRatio: 0.5,
                eyeVerticalOffset: -2, caught: false, caughtTime: 0,
                tailWiggleScale: 8, tailWiggleFreq: 0.8
            });
            expect(calls).toContain('save');
            expect(calls).toContain('restore');
        });

        it('draws head circle', () => {
            const { ctx, calls } = createMockCtx();
            renderCreature(ctx, {
                x: 100, y: 100, radius: 20,
                tailSegments: [], wigglePhase: 0,
                vx: 1, vy: 0, blinking: false, eyeOffset: 0,
                eyeSizeRatio: 0.35, eyeSpacingRatio: 0.3, pupilSizeRatio: 0.5,
                eyeVerticalOffset: -2, caught: false, caughtTime: 0,
                tailWiggleScale: 8, tailWiggleFreq: 0.8
            });
            const arcCall = calls.find(c => c.method === 'arc');
            expect(arcCall).toBeDefined();
            expect(arcCall.args[0]).toBe(100);
            expect(arcCall.args[1]).toBe(100);
            expect(arcCall.args[2]).toBe(20);
        });

        it('draws open eyes when not blinking', () => {
            const { ctx, calls } = createMockCtx();
            renderCreature(ctx, {
                x: 100, y: 100, radius: 20,
                tailSegments: [], wigglePhase: 0,
                vx: 1, vy: 0, blinking: false, eyeOffset: 0,
                eyeSizeRatio: 0.35, eyeSpacingRatio: 0.3, pupilSizeRatio: 0.5,
                eyeVerticalOffset: -2, caught: false, caughtTime: 0,
                tailWiggleScale: 8, tailWiggleFreq: 0.8
            });
            const ellipseCalls = calls.filter(c => c.method === 'ellipse');
            expect(ellipseCalls.length).toBeGreaterThanOrEqual(2);
        });

        it('draws closed eyes when blinking', () => {
            const { ctx, calls } = createMockCtx();
            renderCreature(ctx, {
                x: 100, y: 100, radius: 20,
                tailSegments: [], wigglePhase: 0,
                vx: 1, vy: 0, blinking: true, eyeOffset: 0,
                eyeSizeRatio: 0.35, eyeSpacingRatio: 0.3, pupilSizeRatio: 0.5,
                eyeVerticalOffset: -2, caught: false, caughtTime: 0,
                tailWiggleScale: 8, tailWiggleFreq: 0.8
            });
            const lineCalls = calls.filter(c => c.method === 'lineTo');
            expect(lineCalls.length).toBeGreaterThanOrEqual(2);
        });
    });
});
