import { describe, it, expect, beforeEach } from 'vitest';
import { GameMode } from '../src/game-mode.js';

describe('GameMode', () => {
    let gameMode;

    beforeEach(() => {
        gameMode = new GameMode(800, 600);
    });

    describe('start', () => {
        it('sets running to true', () => {
            gameMode.start();
            expect(gameMode.running).toBe(true);
        });

        it('resets score to 0', () => {
            gameMode.score = 100;
            gameMode.start();
            expect(gameMode.score).toBe(0);
        });

        it('resets time to 60', () => {
            gameMode.time = 0;
            gameMode.start();
            expect(gameMode.time).toBe(60);
        });

        it('clears creatures', () => {
            gameMode.creatures = [{}];
            gameMode.start();
            expect(gameMode.creatures).toEqual([]);
        });
    });

    describe('stop', () => {
        it('sets running to false', () => {
            gameMode.start();
            gameMode.stop();
            expect(gameMode.running).toBe(false);
        });
    });

    describe('handleInput', () => {
        it('returns hit false when no creatures hit', () => {
            gameMode.start();
            const result = gameMode.handleInput(400, 300);
            expect(result.hit).toBe(false);
        });

        it('returns hit true when creature is clicked', () => {
            gameMode.start();
            const creature = gameMode.creatures[0] || (() => {
                gameMode.spawnTimer = 999;
                gameMode.update();
                return gameMode.creatures[0];
            })();
            if (creature) {
                creature.x = 400;
                creature.y = 300;
                creature.radius = 20;
                const result = gameMode.handleInput(400, 300);
                expect(result.hit).toBe(true);
            }
        });

        it('increments combo on hit', () => {
            gameMode.start();
            gameMode.spawnTimer = 999;
            for (let i = 0; i < 5; i++) gameMode.update();
            const creature = gameMode.creatures[0];
            if (creature) {
                creature.x = 400;
                creature.y = 300;
                creature.radius = 20;
                gameMode.handleInput(400, 300);
                expect(gameMode.combo).toBe(1);
            }
        });

        it('resets combo on miss', () => {
            gameMode.start();
            gameMode.combo = 5;
            gameMode.handleInput(0, 0);
            expect(gameMode.combo).toBe(0);
        });

        it('returns not running when stopped', () => {
            const result = gameMode.handleInput(400, 300);
            expect(result.hit).toBe(false);
        });
    });

    describe('isOver', () => {
        it('returns false when game is running', () => {
            gameMode.start();
            expect(gameMode.isOver()).toBe(false);
        });
    });

    describe('getState', () => {
        it('returns score, time, combo, maxCombo', () => {
            gameMode.start();
            const state = gameMode.getState();
            expect(state).toHaveProperty('score');
            expect(state).toHaveProperty('time');
            expect(state).toHaveProperty('combo');
            expect(state).toHaveProperty('maxCombo');
            expect(state).toHaveProperty('creatures');
            expect(state).toHaveProperty('particles');
        });
    });

    describe('particle limit', () => {
        it('trims particles when exceeding maxParticles', () => {
            gameMode.start();
            for (let i = 0; i < 30; i++) {
                gameMode.creatures.push({
                    x: 400, y: 300, radius: 20, alive: true, caught: false,
                    checkClick: (cx, cy) => true
                });
            }
            for (let i = 0; i < 30; i++) {
                gameMode.handleInput(400, 300);
            }
            expect(gameMode.particles.length).toBeLessThanOrEqual(200);
        });
    });
});
