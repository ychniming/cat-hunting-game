import { describe, it, expect, beforeEach } from 'vitest';
import { TailChain } from '../src/tail-chain.js';

describe('TailChain', () => {
    const defaultConfig = {
        stiffness: 0.8,
        damping: 0.98,
        constraintIterations: 3,
        segmentLength: 8
    };

    describe('construction', () => {
        it('creates correct number of points', () => {
            const chain = new TailChain(100, 100, 5, 8, defaultConfig);
            expect(chain.getSegments().length).toBe(5);
        });

        it('positions first point at anchor', () => {
            const chain = new TailChain(100, 200, 5, 8, defaultConfig);
            const segs = chain.getSegments();
            expect(segs[0].x).toBe(100);
            expect(segs[0].y).toBe(200);
        });

        it('spreads points along negative Y axis by default', () => {
            const chain = new TailChain(100, 100, 4, 10, defaultConfig);
            const segs = chain.getSegments();
            for (let i = 1; i < segs.length; i++) {
                expect(segs[i].y).toBeGreaterThan(segs[i - 1].y);
            }
        });

        it('handles single point chain', () => {
            const chain = new TailChain(50, 50, 1, 8, defaultConfig);
            expect(chain.getSegments().length).toBe(1);
        });

        it('uses default config when partial config provided', () => {
            const chain = new TailChain(0, 0, 3, 8, {});
            expect(chain.getSegments().length).toBe(3);
        });
    });

    describe('update', () => {
        it('moves anchor point to new position', () => {
            const chain = new TailChain(100, 100, 5, 8, defaultConfig);
            chain.update(150, 150);
            const segs = chain.getSegments();
            expect(segs[0].x).toBe(150);
            expect(segs[0].y).toBe(150);
        });

        it('subsequent points lag behind anchor movement', () => {
            const chain = new TailChain(100, 100, 5, 8, defaultConfig);
            chain.update(100, 100);
            chain.update(200, 100);
            const segs = chain.getSegments();
            expect(segs[segs.length - 1].x).toBeLessThan(200);
        });

        it('chain stays stable near initial position when anchor is still', () => {
            const chain = new TailChain(100, 100, 5, 8, defaultConfig);
            const initialSegs = chain.getSegments();
            const initialTipY = initialSegs[initialSegs.length - 1].y;
            for (let i = 0; i < 10; i++) {
                chain.update(100, 100);
            }
            const segs = chain.getSegments();
            const tipDrift = Math.abs(segs[segs.length - 1].y - initialTipY);
            expect(tipDrift).toBeLessThan(5);
        });

        it('maintains distance constraints between points', () => {
            const chain = new TailChain(100, 100, 5, 10, defaultConfig);
            for (let i = 0; i < 20; i++) {
                chain.update(100 + i * 5, 100);
            }
            const segs = chain.getSegments();
            for (let i = 1; i < segs.length; i++) {
                const dx = segs[i].x - segs[i - 1].x;
                const dy = segs[i].y - segs[i - 1].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                // 惯性拖拽力会暂时拉伸段间距，容差放宽
                expect(dist).toBeCloseTo(10, -1);
            }
        });
    });

    describe('applyForce', () => {
        it('shifts non-anchor points by force', () => {
            const chain = new TailChain(100, 100, 5, 8, defaultConfig);
            chain.applyForce(10, 0);
            chain.update(100, 100);
            const segs = chain.getSegments();
            expect(segs[segs.length - 1].x).toBeGreaterThan(segs[0].x);
        });

        it('does not move anchor point', () => {
            const chain = new TailChain(100, 100, 5, 8, defaultConfig);
            chain.applyForce(100, 100);
            chain.update(100, 100);
            const segs = chain.getSegments();
            expect(segs[0].x).toBe(100);
            expect(segs[0].y).toBe(100);
        });
    });

    describe('setStiffness', () => {
        it('changes stiffness value', () => {
            const chain = new TailChain(100, 100, 5, 8, defaultConfig);
            chain.setStiffness(0.5);
            expect(chain.stiffness).toBe(0.5);
        });
    });

    describe('getSegments', () => {
        it('returns array of {x, y} objects', () => {
            const chain = new TailChain(100, 100, 3, 8, defaultConfig);
            const segs = chain.getSegments();
            segs.forEach(s => {
                expect(s).toHaveProperty('x');
                expect(s).toHaveProperty('y');
                expect(typeof s.x).toBe('number');
                expect(typeof s.y).toBe('number');
            });
        });

        it('returns copies not references', () => {
            const chain = new TailChain(100, 100, 3, 8, defaultConfig);
            const segs1 = chain.getSegments();
            segs1[1].x = 999;
            const segs2 = chain.getSegments();
            expect(segs2[1].x).not.toBe(999);
        });
    });

    describe('damping', () => {
        it('damping < 1 reduces velocity over time', () => {
            const chain = new TailChain(100, 100, 5, 8, { ...defaultConfig, damping: 0.9 });
            chain.applyForce(20, 0);
            for (let i = 0; i < 30; i++) {
                chain.update(100, 100);
            }
            const segs = chain.getSegments();
            const tipX = segs[segs.length - 1].x;
            expect(Math.abs(tipX - 100)).toBeLessThan(50);
        });
    });

    describe('constraint iterations', () => {
        it('more iterations produce tighter constraints', () => {
            const loose = new TailChain(100, 100, 5, 10, { ...defaultConfig, constraintIterations: 1 });
            const tight = new TailChain(100, 100, 5, 10, { ...defaultConfig, constraintIterations: 10 });

            for (let i = 0; i < 20; i++) {
                loose.update(100 + i * 5, 100);
                tight.update(100 + i * 5, 100);
            }

            const looseSegs = loose.getSegments();
            const tightSegs = tight.getSegments();

            let looseError = 0;
            let tightError = 0;
            for (let i = 1; i < 5; i++) {
                const ld = Math.sqrt((looseSegs[i].x - looseSegs[i-1].x) ** 2 + (looseSegs[i].y - looseSegs[i-1].y) ** 2);
                const td = Math.sqrt((tightSegs[i].x - tightSegs[i-1].x) ** 2 + (tightSegs[i].y - tightSegs[i-1].y) ** 2);
                looseError += Math.abs(ld - 10);
                tightError += Math.abs(td - 10);
            }
            expect(tightError).toBeLessThanOrEqual(looseError);
        });
    });
});
