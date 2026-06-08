import { describe, it, expect, beforeEach } from 'vitest';
import { CreatureCore } from '../src/creature-core.js';

describe('CreatureCore', () => {
    describe('construction', () => {
        it('stores canvasWidth and canvasHeight', () => {
            const core = new CreatureCore(800, 600);
            expect(core.canvasWidth).toBe(800);
            expect(core.canvasHeight).toBe(600);
        });

        it('initializes shared properties with defaults', () => {
            const core = new CreatureCore(800, 600);
            expect(core.radius).toBe(0);
            expect(core.wigglePhase).toBe(0);
            expect(core.wiggleSpeed).toBe(0);
            expect(core.eyeOffset).toBe(0);
            expect(core.blinkTimer).toBe(0);
            expect(core.blinking).toBe(false);
            expect(core.alive).toBe(true);
        });
    });

    describe('initSharedProperties', () => {
        it('initializes radius within expected range', () => {
            const core = new CreatureCore(800, 600);
            core.initSharedProperties({ minRadius: 15, maxRadius: 25 });
            expect(core.radius).toBeGreaterThanOrEqual(15);
            expect(core.radius).toBeLessThanOrEqual(25);
        });

        it('initializes wiggle properties', () => {
            const core = new CreatureCore(800, 600);
            core.initSharedProperties({ minRadius: 15, maxRadius: 25 });
            expect(core.wigglePhase).toBeGreaterThanOrEqual(0);
            expect(core.wigglePhase).toBeLessThan(Math.PI * 2);
            expect(core.wiggleSpeed).toBeGreaterThan(0);
        });

        it('initializes blink properties', () => {
            const core = new CreatureCore(800, 600);
            core.initSharedProperties({ minRadius: 15, maxRadius: 25 });
            expect(core.blinkTimer).toBeGreaterThanOrEqual(0);
            expect(core.blinking).toBe(false);
            expect(core.eyeOffset).toBe(0);
        });

        it('initializes alive to true', () => {
            const core = new CreatureCore(800, 600);
            core.initSharedProperties({ minRadius: 15, maxRadius: 25 });
            expect(core.alive).toBe(true);
        });
    });

    describe('spawnFromEdge', () => {
        it('returns an object with x and y', () => {
            const core = new CreatureCore(800, 600);
            const pos = core.spawnFromEdge(50);
            expect(pos).toHaveProperty('x');
            expect(pos).toHaveProperty('y');
        });

        it('spawns from top edge (side 0)', () => {
            const core = new CreatureCore(800, 600);
            const results = [];
            // Run many times to cover all sides
            for (let i = 0; i < 200; i++) {
                const pos = core.spawnFromEdge(50);
                results.push(pos);
            }
            // At least one should be from top (y = -margin)
            const fromTop = results.some(p => p.y === -50 && p.x >= 0 && p.x <= 800);
            expect(fromTop).toBe(true);
        });

        it('spawns from right edge (side 1)', () => {
            const core = new CreatureCore(800, 600);
            const results = [];
            for (let i = 0; i < 200; i++) {
                results.push(core.spawnFromEdge(50));
            }
            const fromRight = results.some(p => p.x === 850 && p.y >= 0 && p.y <= 600);
            expect(fromRight).toBe(true);
        });

        it('spawns from bottom edge (side 2)', () => {
            const core = new CreatureCore(800, 600);
            const results = [];
            for (let i = 0; i < 200; i++) {
                results.push(core.spawnFromEdge(50));
            }
            const fromBottom = results.some(p => p.y === 650 && p.x >= 0 && p.x <= 800);
            expect(fromBottom).toBe(true);
        });

        it('spawns from left edge (side 3)', () => {
            const core = new CreatureCore(800, 600);
            const results = [];
            for (let i = 0; i < 200; i++) {
                results.push(core.spawnFromEdge(50));
            }
            const fromLeft = results.some(p => p.x === -50 && p.y >= 0 && p.y <= 600);
            expect(fromLeft).toBe(true);
        });

        it('uses custom margin', () => {
            const core = new CreatureCore(800, 600);
            const margin = 60;
            const results = [];
            for (let i = 0; i < 200; i++) {
                results.push(core.spawnFromEdge(margin));
            }
            const fromTop = results.some(p => p.y === -margin);
            const fromRight = results.some(p => p.x === 800 + margin);
            const fromBottom = results.some(p => p.y === 600 + margin);
            const fromLeft = results.some(p => p.x === -margin);
            expect(fromTop || fromRight || fromBottom || fromLeft).toBe(true);
        });

        it('works with margin 0', () => {
            const core = new CreatureCore(800, 600);
            const results = [];
            for (let i = 0; i < 200; i++) {
                results.push(core.spawnFromEdge(0));
            }
            // With margin 0, positions should be on canvas boundary
            const onBoundary = results.some(p =>
                (p.y === 0 && p.x >= 0 && p.x <= 800) ||
                (p.x === 800 && p.y >= 0 && p.y <= 600) ||
                (p.y === 600 && p.x >= 0 && p.x <= 800) ||
                (p.x === 0 && p.y >= 0 && p.y <= 600)
            );
            expect(onBoundary).toBe(true);
        });

        it('works with canvasWidth and canvasHeight of 0', () => {
            const core = new CreatureCore(0, 0);
            const pos = core.spawnFromEdge(50);
            // Should not throw, returns valid position
            expect(typeof pos.x).toBe('number');
            expect(typeof pos.y).toBe('number');
        });
    });

    describe('updateBlink', () => {
        it('decrements blinkTimer', () => {
            const core = new CreatureCore(800, 600);
            core.blinkTimer = 10;
            core.updateBlink();
            expect(core.blinkTimer).toBe(9);
        });

        it('starts blinking when blinkTimer reaches 0', () => {
            const core = new CreatureCore(800, 600);
            core.blinkTimer = 1;
            core.blinking = false;
            core.updateBlink();
            expect(core.blinking).toBe(true);
        });

        it('stays blinking while blinkTimer is between 0 and -blinkDuration', () => {
            const core = new CreatureCore(800, 600);
            core.blinkTimer = 0;
            core.blinking = true;
            core.updateBlink();
            expect(core.blinking).toBe(true);
        });

        it('stops blinking and resets timer after blink duration', () => {
            const core = new CreatureCore(800, 600);
            core.blinkTimer = -9;
            core.blinking = true;
            core.updateBlink(8, 80, 250);
            expect(core.blinking).toBe(false);
            expect(core.blinkTimer).toBeGreaterThanOrEqual(80);
        });

        it('does not start blinking when blinkTimer is positive', () => {
            const core = new CreatureCore(800, 600);
            core.blinkTimer = 50;
            core.blinking = false;
            core.updateBlink();
            expect(core.blinking).toBe(false);
        });

        it('updates eyeOffset based on wigglePhase', () => {
            const core = new CreatureCore(800, 600);
            core.wigglePhase = Math.PI / 2;
            core.blinkTimer = 50;
            core.updateBlink();
            expect(core.eyeOffset).toBeCloseTo(Math.sin(Math.PI / 2) * 2);
        });

        it('uses default blink duration when not specified', () => {
            const core = new CreatureCore(800, 600);
            core.blinkTimer = -10;
            core.blinking = true;
            core.updateBlink();
            expect(core.blinking).toBe(false);
            expect(core.blinkTimer).toBeGreaterThan(0);
        });

        it('handles blinkTimer transitioning from positive to negative', () => {
            const core = new CreatureCore(800, 600);
            core.blinkTimer = 1;
            core.blinking = false;
            core.updateBlink();
            expect(core.blinkTimer).toBe(0);
            // Next call should start blinking
            core.updateBlink();
            expect(core.blinking).toBe(true);
        });
    });

    describe('createTail', () => {
        it('creates a TailChain with correct segment count', () => {
            const core = new CreatureCore(800, 600);
            const tail = core.createTail(400, 300, 10, 8, {
                stiffness: 0.8,
                damping: 0.98,
                constraintIterations: 3
            });
            expect(tail.getSegments().length).toBe(10);
        });

        it('creates a TailChain anchored at given position', () => {
            const core = new CreatureCore(800, 600);
            const tail = core.createTail(100, 200, 5, 8, {
                stiffness: 0.8,
                damping: 0.98,
                constraintIterations: 3
            });
            const segs = tail.getSegments();
            expect(segs[0].x).toBe(100);
            expect(segs[0].y).toBe(200);
        });

        it('creates a TailChain with custom segment length', () => {
            const core = new CreatureCore(800, 600);
            const tail = core.createTail(0, 0, 3, 12, {
                stiffness: 0.8,
                damping: 0.98,
                constraintIterations: 3
            });
            expect(tail.segmentLength).toBe(12);
        });

        it('throws if segmentCount < 1', () => {
            const core = new CreatureCore(800, 600);
            expect(() => core.createTail(0, 0, 0, 8, {})).toThrow();
        });
    });

    describe('getBaseVisualProps', () => {
        it('returns object with shared visual properties', () => {
            const core = new CreatureCore(800, 600);
            core.radius = 20;
            core.blinking = false;
            core.eyeOffset = 1.5;
            const tailSegments = [{ x: 0, y: 0 }];

            const props = core.getBaseVisualProps(100, 200, tailSegments);
            expect(props.x).toBe(100);
            expect(props.y).toBe(200);
            expect(props.radius).toBe(20);
            expect(props.tailSegments).toBe(tailSegments);
            expect(props.blinking).toBe(false);
            expect(props.eyeOffset).toBe(1.5);
        });

        it('does not include mode-specific properties', () => {
            const core = new CreatureCore(800, 600);
            const props = core.getBaseVisualProps(0, 0, []);
            expect(props).not.toHaveProperty('caught');
            expect(props).not.toHaveProperty('caughtTime');
            expect(props).not.toHaveProperty('eyeSizeRatio');
        });
    });
});
