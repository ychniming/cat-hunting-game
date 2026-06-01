import { describe, it, expect } from 'vitest';
import { Particle } from '../src/particle.js';

describe('Particle', () => {
    describe('construction', () => {
        it('has life of 1', () => {
            const p = new Particle(100, 200);
            expect(p.life).toBe(1);
        });

        it('has positive size', () => {
            const p = new Particle(100, 200);
            expect(p.size).toBeGreaterThan(0);
        });
    });

    describe('update', () => {
        it('returns true while alive', () => {
            const p = new Particle(100, 200);
            expect(p.update()).toBe(true);
        });

        it('decreases life each update', () => {
            const p = new Particle(100, 200);
            const initialLife = p.life;
            p.update();
            expect(p.life).toBeLessThan(initialLife);
        });

        it('returns false when life depleted', () => {
            const p = new Particle(100, 200);
            p.life = 0.001;
            p.decay = 0.1;
            expect(p.update()).toBe(false);
        });

        it('applies gravity to vy', () => {
            const p = new Particle(100, 200);
            const initialVy = p.vy;
            p.update();
            expect(p.vy).toBeGreaterThan(initialVy);
        });
    });
});
