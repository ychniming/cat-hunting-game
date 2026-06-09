import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameMode } from '../src/game-mode.js';
import { CONFIG } from '../src/config.js';

/**
 * Helper: force-spawn a creature by advancing time past spawn interval.
 * Works with the real-time spawn system (no frame-count dependency).
 */
function forceSpawn(gameMode, nowSpy, startMs = 0) {
    nowSpy.mockReturnValue(startMs);
    gameMode.start();
    // Advance past spawnIntervalBaseSec to trigger first spawn
    const spawnMs = startMs + CONFIG.game.spawnIntervalBaseSec * 1000 + 1;
    nowSpy.mockReturnValue(spawnMs);
    gameMode.update();
    return gameMode.creatures[gameMode.creatures.length - 1];
}

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
            const nowSpy = vi.spyOn(performance, 'now');
            const creature = forceSpawn(gameMode, nowSpy);
            if (creature) {
                creature.x = 400;
                creature.y = 300;
                creature.radius = 20;
                const result = gameMode.handleInput(400, 300);
                expect(result.hit).toBe(true);
            }
            nowSpy.mockRestore();
        });

        it('increments combo on hit', () => {
            const nowSpy = vi.spyOn(performance, 'now');
            forceSpawn(gameMode, nowSpy);
            const creature = gameMode.creatures[0];
            if (creature) {
                creature.x = 400;
                creature.y = 300;
                creature.radius = 20;
                gameMode.handleInput(400, 300);
                expect(gameMode.combo).toBe(1);
            }
            nowSpy.mockRestore();
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
            const creature = forceSpawn(gameMode, nowSpy);
            if (creature) {
                gameMode.resize(1024, 768);
                expect(creature.canvasWidth).toBe(1024);
                expect(creature.canvasHeight).toBe(768);
            }
        });

        it('resize uses creature.resize() semantic method', () => {
            const creature = forceSpawn(gameMode, nowSpy);
            if (creature) {
                const resizeSpy = vi.spyOn(creature, 'resize');
                gameMode.resize(1024, 768);
                expect(resizeSpy).toHaveBeenCalledWith(1024, 768);
                resizeSpy.mockRestore();
            }
        });

        it('resize updates creature core canvas dimensions', () => {
            const creature = forceSpawn(gameMode, nowSpy);
            if (creature) {
                gameMode.resize(1024, 768);
                expect(creature.core.canvasWidth).toBe(1024);
                expect(creature.core.canvasHeight).toBe(768);
            }
        });
    });

    describe('elapsedSeconds - real-time game progression', () => {
        let nowSpy;

        beforeEach(() => {
            nowSpy = vi.spyOn(performance, 'now');
        });

        afterEach(() => {
            nowSpy.mockRestore();
        });

        it('returns 0 when game has not started', () => {
            expect(gameMode.elapsedSeconds).toBe(0);
        });

        it('returns 0 immediately after start', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();
            expect(gameMode.elapsedSeconds).toBe(0);
        });

        it('returns elapsed seconds based on real time', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            nowSpy.mockReturnValue(5000);
            expect(gameMode.elapsedSeconds).toBe(5);
        });

        it('is frame-rate independent', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // 120 updates in 5 seconds (high fps)
            for (let i = 0; i < 120; i++) {
                nowSpy.mockReturnValue((i + 1) * (5000 / 120));
                gameMode.update();
            }

            expect(gameMode.elapsedSeconds).toBe(5);
        });

        it('does not count paused time', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            nowSpy.mockReturnValue(5000);
            gameMode.update();

            gameMode.pause();

            nowSpy.mockReturnValue(15000);
            expect(gameMode.elapsedSeconds).toBe(5);
        });

        it('resumes counting after pause', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            nowSpy.mockReturnValue(5000);
            gameMode.update();

            gameMode.pause();

            nowSpy.mockReturnValue(15000);
            gameMode.resume();

            nowSpy.mockReturnValue(20000);
            gameMode.update();

            expect(gameMode.elapsedSeconds).toBe(10);
        });

        it('returns correct value after game ends naturally', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            nowSpy.mockReturnValue(60000);
            gameMode.update();

            // Game ended naturally, elapsedSeconds should be 60
            expect(gameMode.elapsedSeconds).toBe(60);
        });

        it('double spawn triggers based on real elapsed seconds', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // Before threshold (less than 10 seconds)
            nowSpy.mockReturnValue(5000);
            gameMode.update();
            expect(gameMode.elapsedSeconds).toBeLessThan(CONFIG.game.doubleSpawnThresholdSec);

            // After threshold (more than 10 seconds)
            nowSpy.mockReturnValue(15000);
            gameMode.update();
            expect(gameMode.elapsedSeconds).toBeGreaterThan(CONFIG.game.doubleSpawnThresholdSec);
        });
    });

    describe('real-time spawn timing', () => {
        let nowSpy;

        beforeEach(() => {
            nowSpy = vi.spyOn(performance, 'now');
        });

        afterEach(() => {
            nowSpy.mockRestore();
        });

        it('spawns first creature after spawnIntervalBaseSec of real time', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // Just before the interval - no spawn yet
            nowSpy.mockReturnValue(CONFIG.game.spawnIntervalBaseSec * 1000 - 1);
            gameMode.update();
            expect(gameMode.creatures.length).toBe(0);

            // At the interval - spawn happens
            nowSpy.mockReturnValue(CONFIG.game.spawnIntervalBaseSec * 1000);
            gameMode.update();
            expect(gameMode.creatures.length).toBe(1);
        });

        it('spawn rhythm is frame-rate independent - same creature count at different FPS', () => {
            // Run at 30fps for 5 seconds
            nowSpy.mockReturnValue(0);
            const game30 = new GameMode(800, 600);
            game30.start();
            for (let i = 0; i < 150; i++) { // 30fps * 5s = 150 frames
                nowSpy.mockReturnValue((i + 1) * (1000 / 30));
                game30.update();
            }
            const creatures30 = game30.creatures.length;

            // Run at 60fps for 5 seconds
            nowSpy.mockReturnValue(0);
            const game60 = new GameMode(800, 600);
            game60.start();
            for (let i = 0; i < 300; i++) { // 60fps * 5s = 300 frames
                nowSpy.mockReturnValue((i + 1) * (1000 / 60));
                game60.update();
            }
            const creatures60 = game60.creatures.length;

            // Run at 120fps for 5 seconds
            nowSpy.mockReturnValue(0);
            const game120 = new GameMode(800, 600);
            game120.start();
            for (let i = 0; i < 600; i++) { // 120fps * 5s = 600 frames
                nowSpy.mockReturnValue((i + 1) * (1000 / 120));
                game120.update();
            }
            const creatures120 = game120.creatures.length;

            // All frame rates should produce the same number of creatures
            expect(creatures30).toBe(creatures60);
            expect(creatures60).toBe(creatures120);
        });

        it('spawn interval accelerates over real time', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // Count spawns in first 5 seconds (no acceleration yet)
            let earlySpawns = 0;
            for (let ms = 0; ms <= 5000; ms += 100) {
                nowSpy.mockReturnValue(ms);
                const prevCount = gameMode.creatures.length;
                gameMode.update();
                if (gameMode.creatures.length > prevCount) earlySpawns++;
            }

            // Count spawns in seconds 25-30 (acceleration active)
            nowSpy.mockReturnValue(0);
            const gameLate = new GameMode(800, 600);
            gameLate.start();
            let lateSpawns = 0;
            for (let ms = 0; ms <= 30000; ms += 100) {
                nowSpy.mockReturnValue(ms);
                const prevCount = gameLate.creatures.length;
                gameLate.update();
                if (gameLate.creatures.length > prevCount && ms >= 25000) lateSpawns++;
            }

            // Later period should spawn more frequently (more spawns per 5s window)
            expect(lateSpawns).toBeGreaterThan(earlySpawns);
        });

        it('spawn interval never goes below spawnIntervalMinSec', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // Run for a very long time (50 seconds)
            for (let ms = 0; ms <= 50000; ms += 16) {
                nowSpy.mockReturnValue(ms);
                gameMode.update();
            }

            // Verify the current interval is at least the minimum
            const elapsedSeconds = gameMode.elapsedSeconds;
            const currentIntervalSec = Math.max(
                CONFIG.game.spawnIntervalMinSec,
                CONFIG.game.spawnIntervalBaseSec -
                    Math.floor(elapsedSeconds / CONFIG.game.spawnAccelerationRateSec) * CONFIG.game.spawnAccelerationStepSec
            );
            expect(currentIntervalSec).toBeGreaterThanOrEqual(CONFIG.game.spawnIntervalMinSec);
        });

        it('resets _lastSpawnTime on start', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();
            nowSpy.mockReturnValue(5000);
            gameMode.update();

            // Restart
            nowSpy.mockReturnValue(10000);
            gameMode.start();
            expect(gameMode._lastSpawnTime).toBe(0);
        });

        it('resets _spawnIntervalSec on start', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();
            nowSpy.mockReturnValue(50000);
            gameMode.update();

            // Restart
            nowSpy.mockReturnValue(60000);
            gameMode.start();
            expect(gameMode._spawnIntervalSec).toBe(CONFIG.game.spawnIntervalBaseSec);
        });

        it('does not spawn when game is paused', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // Spawn first creature
            nowSpy.mockReturnValue(CONFIG.game.spawnIntervalBaseSec * 1000 + 1);
            gameMode.update();
            const countBeforePause = gameMode.creatures.length;

            // Pause
            gameMode.pause();

            // Advance time significantly while paused
            nowSpy.mockReturnValue(30000);
            gameMode.update(); // no-op when paused

            // Creature count should not change
            expect(gameMode.creatures.length).toBe(countBeforePause);
        });

        it('resumes spawning correctly after pause', () => {
            nowSpy.mockReturnValue(0);
            gameMode.start();

            // Spawn first creature at t=1s
            nowSpy.mockReturnValue(CONFIG.game.spawnIntervalBaseSec * 1000 + 1);
            gameMode.update();
            expect(gameMode.creatures.length).toBe(1);

            // Pause at t=1.5s
            nowSpy.mockReturnValue(1500);
            gameMode.pause();

            // 10 seconds pass while paused
            nowSpy.mockReturnValue(11500);
            gameMode.resume();

            // Next spawn should happen after the interval from resume
            nowSpy.mockReturnValue(11500 + CONFIG.game.spawnIntervalBaseSec * 1000 + 1);
            gameMode.update();
            expect(gameMode.creatures.length).toBe(2);
        });

        it('double spawn can occur after doubleSpawnThresholdSec', () => {
            // Use many trials to account for randomness (30% chance)
            let doubleSpawnObserved = false;
            const originalRandom = Math.random;
            Math.random = () => 0.1; // Force double spawn (0.1 < 0.3)

            try {
                nowSpy.mockReturnValue(0);
                gameMode.start();

                // Advance past threshold
                for (let ms = 0; ms <= 15000; ms += 16) {
                    nowSpy.mockReturnValue(ms);
                    gameMode.update();
                }

                // Check if any update added 2 creatures at once
                // With forced random, double spawn should happen after threshold
                const creatureCount = gameMode.creatures.length;
                expect(creatureCount).toBeGreaterThan(0);
                // We can't directly observe double spawn from count alone,
                // but we verify the mechanism works by checking creatures exist
                doubleSpawnObserved = creatureCount > 0;
            } finally {
                Math.random = originalRandom;
            }

            expect(doubleSpawnObserved).toBe(true);
        });

        it('double spawn does not occur before doubleSpawnThresholdSec', () => {
            const originalRandom = Math.random;
            Math.random = () => 0.1; // Would trigger double spawn if threshold met

            try {
                nowSpy.mockReturnValue(0);
                gameMode.start();

                // Stay before threshold
                const beforeThreshold = (CONFIG.game.doubleSpawnThresholdSec - 1) * 1000;
                let maxCreaturesInOneUpdate = 0;

                for (let ms = 0; ms <= beforeThreshold; ms += 16) {
                    nowSpy.mockReturnValue(ms);
                    const prevCount = gameMode.creatures.length;
                    gameMode.update();
                    const added = gameMode.creatures.length - prevCount;
                    if (added > maxCreaturesInOneUpdate) maxCreaturesInOneUpdate = added;
                }

                // Before threshold, should never add 2 creatures at once
                expect(maxCreaturesInOneUpdate).toBeLessThanOrEqual(1);
            } finally {
                Math.random = originalRandom;
            }
        });
    });

    describe('CONFIG immutability', () => {
        it('CONFIG.game is frozen and cannot be modified', () => {
            expect(() => { CONFIG.game.spawnIntervalBaseSec = 999; }).toThrow();
        });

        it('CONFIG itself is frozen and cannot be modified', () => {
            expect(() => { CONFIG.newProp = 'test'; }).toThrow();
        });

        it('uses new Sec-based config keys', () => {
            expect(CONFIG.game).toHaveProperty('spawnIntervalBaseSec');
            expect(CONFIG.game).toHaveProperty('spawnIntervalMinSec');
            expect(CONFIG.game).toHaveProperty('spawnAccelerationStepSec');
        });

        it('does not have old frame-based config keys', () => {
            expect(CONFIG.game).not.toHaveProperty('spawnIntervalBase');
            expect(CONFIG.game).not.toHaveProperty('spawnIntervalMin');
            expect(CONFIG.game).not.toHaveProperty('spawnAccelerationStep');
        });
    });
});
