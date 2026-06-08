import { describe, it, expect } from 'vitest';
import { renderCreature, renderTail } from '../src/creature-renderer.js';

function createMockCtx() {
    const calls = [];
    const handler = {
        get(target, prop) {
            if (typeof prop === 'string' && (prop === 'save' || prop === 'restore' || prop === 'beginPath' || prop === 'fill' || prop === 'stroke' || prop === 'closePath')) {
                return () => calls.push(prop);
            }
            if (typeof prop === 'string' && (prop === 'arc' || prop === 'ellipse' || prop === 'moveTo' || prop === 'lineTo' || prop === 'quadraticCurveTo' || prop === 'bezierCurveTo')) {
                return (...args) => calls.push({ method: prop, args });
            }
            if (typeof prop === 'string' && (prop === 'fillRect' || prop === 'strokeRect')) {
                return (...args) => calls.push({ method: prop, args });
            }
            if (typeof prop === 'string' && prop === 'lineWidth') {
                return 1;
            }
            if (typeof prop === 'string' && (prop === 'strokeStyle' || prop === 'fillStyle' || prop === 'lineCap' || prop === 'lineJoin')) {
                return '';
            }
            const setTarget = (val) => {
                calls.push({ set: prop, value: val });
            };
            return new Proxy(function() {}, {
                apply: (_target, _thisArg, args) => {
                    calls.push({ method: prop, args });
                },
                get: (_target, innerProp) => {
                    if (innerProp === 'set') return setTarget;
                    return undefined;
                }
            });
        },
        set(_target, prop, value) {
            calls.push({ set: prop, value });
            return true;
        }
    };
    const ctx = new Proxy({}, handler);
    return { ctx, calls };
}

function makeProps(overrides = {}) {
    return {
        x: 100, y: 100, radius: 20,
        tailSegments: [
            { x: 100, y: 100 },
            { x: 100, y: 110 },
            { x: 100, y: 120 },
            { x: 100, y: 130 },
            { x: 100, y: 140 }
        ],
        wigglePhase: 0,
        vx: 1, vy: 0, blinking: false, eyeOffset: 0,
        eyeSizeRatio: 0.35, eyeSpacingRatio: 0.3, pupilSizeRatio: 0.5,
        eyeVerticalOffset: -2, caught: false, caughtTime: 0,
        tailWiggleScale: 8, tailWiggleFreq: 0.8,
        ...overrides
    };
}

describe('CreatureRenderer', () => {
    describe('renderCreature', () => {
        it('does nothing when radius < 1', () => {
            const { ctx, calls } = createMockCtx();
            renderCreature(ctx, makeProps({ radius: 0.5, tailSegments: [] }));
            expect(calls.length).toBe(0);
        });

        it('calls save and restore', () => {
            const { ctx, calls } = createMockCtx();
            renderCreature(ctx, makeProps({ tailSegments: [] }));
            expect(calls).toContain('save');
            expect(calls).toContain('restore');
        });

        it('draws head circle', () => {
            const { ctx, calls } = createMockCtx();
            renderCreature(ctx, makeProps({ tailSegments: [] }));
            const arcCall = calls.find(c => c.method === 'arc');
            expect(arcCall).toBeDefined();
            expect(arcCall.args[0]).toBe(100);
            expect(arcCall.args[1]).toBe(100);
            expect(arcCall.args[2]).toBe(20);
        });

        it('draws open eyes when not blinking', () => {
            const { ctx, calls } = createMockCtx();
            renderCreature(ctx, makeProps({ tailSegments: [] }));
            const ellipseCalls = calls.filter(c => c.method === 'ellipse');
            expect(ellipseCalls.length).toBeGreaterThanOrEqual(2);
        });

        it('draws closed eyes when blinking', () => {
            const { ctx, calls } = createMockCtx();
            renderCreature(ctx, makeProps({ tailSegments: [], blinking: true }));
            const lineCalls = calls.filter(c => c.method === 'lineTo');
            expect(lineCalls.length).toBeGreaterThanOrEqual(2);
        });

        it('renders tail with uniform width (cylindrical)', () => {
            const { ctx, calls } = createMockCtx();
            renderCreature(ctx, makeProps());
            const strokeCalls = calls.filter(c => c === 'stroke');
            expect(strokeCalls.length).toBeGreaterThanOrEqual(1);
        });

        it('uses quadraticCurveTo for smooth tail curves', () => {
            const { ctx, calls } = createMockCtx();
            renderCreature(ctx, makeProps());
            const bezierCalls = calls.filter(c => c.method === 'quadraticCurveTo');
            expect(bezierCalls.length).toBeGreaterThanOrEqual(1);
        });

        it('sets uniform lineWidth for cylindrical tail', () => {
            const { ctx, calls } = createMockCtx();
            renderCreature(ctx, makeProps());
            const lineWidthSets = calls.filter(c => c.set === 'lineWidth');
            expect(lineWidthSets.length).toBeGreaterThanOrEqual(1);
            const widths = lineWidthSets.map(c => c.value);
            const allSame = widths.every(w => w === widths[0]);
            expect(allSame).toBe(true);
        });
    });

    describe('renderTail', () => {
        it('does nothing with fewer than 2 segments', () => {
            const { ctx, calls } = createMockCtx();
            renderTail(ctx, [{ x: 100, y: 100 }], 12);
            const strokeCalls = calls.filter(c => c === 'stroke');
            expect(strokeCalls.length).toBe(0);
        });

        it('draws with uniform width for all segments', () => {
            const { ctx, calls } = createMockCtx();
            const segments = [
                { x: 100, y: 100 },
                { x: 100, y: 110 },
                { x: 100, y: 120 },
                { x: 100, y: 130 }
            ];
            renderTail(ctx, segments, 12);
            const lineWidthSets = calls.filter(c => c.set === 'lineWidth');
            expect(lineWidthSets.length).toBeGreaterThanOrEqual(1);
            const widths = lineWidthSets.map(c => c.value);
            expect(widths.every(w => w === 12)).toBe(true);
        });

        it('uses quadraticCurveTo for intermediate points', () => {
            const { ctx, calls } = createMockCtx();
            const segments = [
                { x: 100, y: 100 },
                { x: 105, y: 110 },
                { x: 95, y: 120 },
                { x: 100, y: 130 }
            ];
            renderTail(ctx, segments, 8);
            const quadCalls = calls.filter(c => c.method === 'quadraticCurveTo');
            expect(quadCalls.length).toBeGreaterThanOrEqual(1);
        });

        it('strokes exactly once for the whole tail', () => {
            const { ctx, calls } = createMockCtx();
            const segments = [
                { x: 100, y: 100 },
                { x: 100, y: 108 },
                { x: 100, y: 116 },
                { x: 100, y: 124 },
                { x: 100, y: 132 },
                { x: 100, y: 140 }
            ];
            renderTail(ctx, segments, 10);
            const strokeCalls = calls.filter(c => c === 'stroke');
            expect(strokeCalls.length).toBe(1);
        });
    });
});
