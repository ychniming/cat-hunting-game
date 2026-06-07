import { describe, it, expect } from 'vitest';
import { CONFIG } from '../src/config.js';

describe('CONFIG', () => {
  describe('structure', () => {
    it('has game group', () => {
      expect(CONFIG.game).toBeDefined();
    });

    it('has animation group', () => {
      expect(CONFIG.animation).toBeDefined();
    });

    it('has visual group', () => {
      expect(CONFIG.visual).toBeDefined();
    });

    it('has audio group', () => {
      expect(CONFIG.audio).toBeDefined();
    });
  });

  describe('game group', () => {
    it('has duration', () => {
      expect(CONFIG.game.duration).toBe(60);
    });

    it('has spawnIntervalBase', () => {
      expect(CONFIG.game.spawnIntervalBase).toBe(60);
    });

    it('has spawnIntervalMin', () => {
      expect(CONFIG.game.spawnIntervalMin).toBe(20);
    });

    it('has spawnAccelerationRateSec', () => {
      expect(CONFIG.game.spawnAccelerationRateSec).toBe(5);
    });

    it('has spawnAccelerationStep', () => {
      expect(CONFIG.game.spawnAccelerationStep).toBe(5);
    });

    it('has doubleSpawnChance', () => {
      expect(CONFIG.game.doubleSpawnChance).toBe(0.3);
    });

    it('has doubleSpawnThresholdSec', () => {
      expect(CONFIG.game.doubleSpawnThresholdSec).toBe(10);
    });

    it('has tailSegments', () => {
      expect(CONFIG.game.tailSegments).toBe(16);
    });
  });

  describe('animation group', () => {
    it('has spawnDelay', () => {
      expect(CONFIG.animation.spawnDelay).toBe(60);
    });

    it('has tailSegments', () => {
      expect(CONFIG.animation.tailSegments).toBe(20);
    });
  });

  describe('tail group', () => {
    it('has gravity', () => {
      expect(CONFIG.tail.gravity).toBe(0.15);
    });

    it('has stiffness', () => {
      expect(CONFIG.tail.stiffness).toBe(0.8);
    });

    it('has damping', () => {
      expect(CONFIG.tail.damping).toBe(0.98);
    });

    it('has constraintIterations', () => {
      expect(CONFIG.tail.constraintIterations).toBe(3);
    });

    it('has segmentLength', () => {
      expect(CONFIG.tail.segmentLength).toBe(8);
    });

    it('has baseWidthRatio', () => {
      expect(CONFIG.tail.baseWidthRatio).toBe(0.6);
    });

    it('has tipWidth', () => {
      expect(CONFIG.tail.tipWidth).toBe(1);
    });

    it('has curlRadius', () => {
      expect(CONFIG.tail.curlRadius).toBe(4);
    });
  });

  describe('visual group', () => {
    it('has fps', () => {
      expect(CONFIG.visual.fps).toBe(60);
    });

    it('has particleCount', () => {
      expect(CONFIG.visual.particleCount).toBe(8);
    });

    it('has particleGravity', () => {
      expect(CONFIG.visual.particleGravity).toBe(0.1);
    });

    it('has comboDisplayDuration', () => {
      expect(CONFIG.visual.comboDisplayDuration).toBe(1000);
    });
  });

  describe('audio group', () => {
    it('has catchSoundDuration', () => {
      expect(CONFIG.audio.catchSoundDuration).toBe(0.1);
    });
  });

  describe('immutability', () => {
    it('game values cannot be reassigned', () => {
      expect(() => { CONFIG.game.duration = 999; }).toThrow();
    });

    it('top-level groups cannot be reassigned', () => {
      expect(() => { CONFIG.game = {}; }).toThrow();
    });
  });
});
