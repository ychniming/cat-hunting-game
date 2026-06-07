import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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
            gameMode._time = 0;
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

        it('returns true when not running and time is 0', () => {
            gameMode.start();
            gameMode.running = false;
            gameMode._time = 0;
            expect(gameMode.isOver()).toBe(true);
        });

        it('returns false when not running but time remains', () => {
            gameMode.start();
            gameMode.stop();
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

    describe('real-time based timer', () => {
        let nowSpy;

        beforeEach(() => {
            nowSpy = vi.spyOn(performance, 'now');
        });

        afterEach(() => {
            nowSpy.mockRestore();
        });

        it('decrements time based on real elapsed seconds, not frame count', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // 1 real second has passed
            nowSpy.mockReturnValue(1000);
            gameMode.update();

            expect(gameMode.time).toBe(59);
        });

        it('does not decrement time within the same second', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // Multiple updates within the first second
            nowSpy.mockReturnValue(500);
            gameMode.update();
            nowSpy.mockReturnValue(999);
            gameMode.update();

            expect(gameMode.time).toBe(60);
        });

        it('works correctly at 120fps (high refresh rate)', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // 120 frames in 1 real second (120Hz screen)
            for (let i = 0; i < 120; i++) {
                nowSpy.mockReturnValue((i + 1) * (1000 / 120));
                gameMode.update();
            }

            // Should only decrement by 1 second, not 2
            expect(gameMode.time).toBe(59);
        });

        it('works correctly at 30fps (low performance device)', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // 30 frames in 1 real second (30fps)
            for (let i = 0; i < 30; i++) {
                nowSpy.mockReturnValue((i + 1) * (1000 / 30));
                gameMode.update();
            }

            // Should decrement by exactly 1 second
            expect(gameMode.time).toBe(59);
        });

        it('ends game when real time reaches duration', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            nowSpy.mockReturnValue(60 * 1000);
            gameMode.update();

            expect(gameMode.time).toBe(0);
            expect(gameMode.running).toBe(false);
            expect(gameMode.isOver()).toBe(true);
        });

        it('time never goes below 0', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            nowSpy.mockReturnValue(120000); // 2 minutes elapsed
            gameMode.update();

            expect(gameMode.time).toBe(0);
            expect(gameMode.running).toBe(false);
        });

        it('time displays 0 when game ends exactly at duration', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            nowSpy.mockReturnValue(59999);
            gameMode.update();
            expect(gameMode.time).toBe(1);

            nowSpy.mockReturnValue(60000);
            gameMode.update();
            expect(gameMode.time).toBe(0);
        });

        it('counts down from 60 to 0 over 60 real seconds', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            for (let second = 1; second <= 60; second++) {
                nowSpy.mockReturnValue(second * 1000);
                gameMode.update();
                expect(gameMode.time).toBe(60 - second);
            }

            expect(gameMode.running).toBe(false);
            expect(gameMode.isOver()).toBe(true);
        });

        it('pauses timer when game is paused', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // Advance 1 second
            nowSpy.mockReturnValue(1000);
            gameMode.update();
            expect(gameMode.time).toBe(59);

            // Pause the game
            gameMode.pause();

            // Advance 10 more seconds while paused
            nowSpy.mockReturnValue(11000);
            gameMode.update(); // should be no-op since not running

            // Time should still be 59
            expect(gameMode.time).toBe(59);
        });

        it('resumes timer correctly after pause', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // Advance 1 second
            nowSpy.mockReturnValue(1000);
            gameMode.update();
            expect(gameMode.time).toBe(59);

            // Pause
            nowSpy.mockReturnValue(1500);
            gameMode.pause();

            // 5 seconds pass while paused
            nowSpy.mockReturnValue(6500);

            // Resume
            gameMode.resume();
            expect(gameMode.time).toBe(59);

            // 1 more second after resume
            nowSpy.mockReturnValue(7500);
            gameMode.update();

            // Total real running time: 1s (before pause) + 1s (after resume) = 2s
            expect(gameMode.time).toBe(58);
        });

        it('resets timer correctly on restart', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            nowSpy.mockReturnValue(30000);
            gameMode.update();
            expect(gameMode.time).toBe(30);

            // Restart at a later real time
            nowSpy.mockReturnValue(50000);
            gameMode.start();
            expect(gameMode.time).toBe(60);
            expect(gameMode.running).toBe(true);
        });

        it('stop accumulates elapsed time for accurate time reading', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            nowSpy.mockReturnValue(5000);
            gameMode.update();
            gameMode.stop();

            // After stop, time should reflect 5 seconds elapsed
            expect(gameMode.time).toBe(55);
            expect(gameMode.running).toBe(false);
        });

        it('does not count paused time toward game duration', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // Play for 10 seconds
            nowSpy.mockReturnValue(10000);
            gameMode.update();
            expect(gameMode.time).toBe(50);

            // Pause immediately at t=10000
            gameMode.pause();

            // 30 seconds pass while paused (now at t=40000)
            nowSpy.mockReturnValue(40000);

            // Resume
            gameMode.resume();

            // Play for 10 more seconds (now at t=50000)
            nowSpy.mockReturnValue(50000);
            gameMode.update();

            // Total running time: 10s + 10s = 20s, so time should be 40
            expect(gameMode.time).toBe(40);
        });

        it('pause is no-op when already paused', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            nowSpy.mockReturnValue(1000);
            gameMode.update();
            expect(gameMode.time).toBe(59);

            gameMode.pause();
            const timeAfterPause = gameMode.time;

            // Calling pause again should not change anything
            nowSpy.mockReturnValue(5000);
            gameMode.pause();
            expect(gameMode.time).toBe(timeAfterPause);
        });

        it('resume is no-op when already running', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            nowSpy.mockReturnValue(1000);
            gameMode.update();
            expect(gameMode.time).toBe(59);

            // Resume while already running should not break timer
            gameMode.resume();

            nowSpy.mockReturnValue(2000);
            gameMode.update();
            expect(gameMode.time).toBe(58);
        });

        it('resume does not restart when time is 0', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            nowSpy.mockReturnValue(60000);
            gameMode.update();
            expect(gameMode.time).toBe(0);
            expect(gameMode.running).toBe(false);

            // Resume should not work when time is 0
            gameMode.resume();
            expect(gameMode.running).toBe(false);
        });

        it('resize updates canvas dimensions', () => {
            gameMode.start();
            gameMode.resize(1024, 768);
            expect(gameMode.canvasWidth).toBe(1024);
            expect(gameMode.canvasHeight).toBe(768);
        });

        it('resize updates creature canvas dimensions', () => {
            gameMode.start();
            gameMode.spawnTimer = 999;
            gameMode.update();
            const creature = gameMode.creatures[0];
            if (creature) {
                gameMode.resize(1024, 768);
                expect(creature.canvasWidth).toBe(1024);
                expect(creature.canvasHeight).toBe(768);
            }
        });
    });
});
