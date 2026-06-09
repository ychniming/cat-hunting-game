import { describe, it, expect } from 'vitest';
import { CONFIG } from '../src/config.js';

describe('CONFIG', () => {
  describe('structure', () => {
    it('has required top-level groups', () => {
      expect(CONFIG.game).toBeDefined();
      expect(CONFIG.animation).toBeDefined();
      expect(CONFIG.tail).toBeDefined();
      expect(CONFIG.visual).toBeDefined();
      expect(CONFIG.audio).toBeDefined();
    });
  });

  describe('game constraints', () => {
    it('duration is positive', () => {
      expect(CONFIG.game.duration).toBeGreaterThan(0);
    });

    it('spawn interval base is positive and >= min', () => {
      expect(CONFIG.game.spawnIntervalBaseSec).toBeGreaterThan(0);
      expect(CONFIG.game.spawnIntervalBaseSec).toBeGreaterThanOrEqual(CONFIG.game.spawnIntervalMinSec);
    });

    it('spawn interval min is positive', () => {
      expect(CONFIG.game.spawnIntervalMinSec).toBeGreaterThan(0);
    });

    it('spawn acceleration rate is positive', () => {
      expect(CONFIG.game.spawnAccelerationRateSec).toBeGreaterThan(0);
    });

    it('spawn acceleration step is positive', () => {
      expect(CONFIG.game.spawnAccelerationStepSec).toBeGreaterThan(0);
    });

    it('double spawn chance is between 0 and 1', () => {
      expect(CONFIG.game.doubleSpawnChance).toBeGreaterThanOrEqual(0);
      expect(CONFIG.game.doubleSpawnChance).toBeLessThanOrEqual(1);
    });

    it('double spawn threshold is positive', () => {
      expect(CONFIG.game.doubleSpawnThresholdSec).toBeGreaterThan(0);
    });

    it('tail segments is positive', () => {
      expect(CONFIG.game.tailSegments).toBeGreaterThan(0);
    });
  });

  describe('animation constraints', () => {
    it('spawn delay is positive', () => {
      expect(CONFIG.animation.spawnDelay).toBeGreaterThan(0);
    });

    it('tail segments is positive', () => {
      expect(CONFIG.animation.tailSegments).toBeGreaterThan(0);
    });

    it('animation has more tail segments than game for smoother look', () => {
      expect(CONFIG.animation.tailSegments).toBeGreaterThanOrEqual(CONFIG.game.tailSegments);
    });
  });

  describe('tail constraints', () => {
    it('stiffness is between 0 and 1', () => {
      expect(CONFIG.tail.stiffness).toBeGreaterThan(0);
      expect(CONFIG.tail.stiffness).toBeLessThanOrEqual(1);
    });

    it('damping is between 0 and 1', () => {
      expect(CONFIG.tail.damping).toBeGreaterThan(0);
      expect(CONFIG.tail.damping).toBeLessThanOrEqual(1);
    });

    it('constraint iterations is positive', () => {
      expect(CONFIG.tail.constraintIterations).toBeGreaterThan(0);
    });

    it('segment length is positive', () => {
      expect(CONFIG.tail.segmentLength).toBeGreaterThan(0);
    });

    it('base width ratio is between 0 and 1', () => {
      expect(CONFIG.tail.baseWidthRatio).toBeGreaterThan(0);
      expect(CONFIG.tail.baseWidthRatio).toBeLessThanOrEqual(1);
    });

    it('curl radius is positive', () => {
      expect(CONFIG.tail.curlRadius).toBeGreaterThan(0);
    });
  });

  describe('visual constraints', () => {
    it('fps is positive', () => {
      expect(CONFIG.visual.fps).toBeGreaterThan(0);
    });

    it('particle count is positive', () => {
      expect(CONFIG.visual.particleCount).toBeGreaterThan(0);
    });

    it('particle gravity is non-negative', () => {
      expect(CONFIG.visual.particleGravity).toBeGreaterThanOrEqual(0);
    });

    it('combo display duration is positive', () => {
      expect(CONFIG.visual.comboDisplayDuration).toBeGreaterThan(0);
    });

    it('max particles is positive and >= particle count', () => {
      expect(CONFIG.visual.maxParticles).toBeGreaterThan(0);
      expect(CONFIG.visual.maxParticles).toBeGreaterThanOrEqual(CONFIG.visual.particleCount);
    });
  });

  describe('audio constraints', () => {
    it('catch sound duration is positive', () => {
      expect(CONFIG.audio.catchSoundDuration).toBeGreaterThan(0);
    });
  });

  describe('immutability', () => {
    it('game values cannot be reassigned', () => {
      expect(() => { CONFIG.game.duration = 999; }).toThrow();
    });

    it('top-level groups cannot be reassigned', () => {
      expect(() => { CONFIG.game = {}; }).toThrow();
    });

    it('tail values cannot be reassigned', () => {
      expect(() => { CONFIG.tail.stiffness = 0; }).toThrow();
    });

    it('visual values cannot be reassigned', () => {
      expect(() => { CONFIG.visual.fps = 0; }).toThrow();
    });
  });
});
