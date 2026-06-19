const DEFAULTS = {
  game: {
    duration: 60,
    spawnIntervalBaseSec: 1.0,
    spawnIntervalMinSec: 0.33,
    spawnAccelerationRateSec: 5,
    spawnAccelerationStepSec: 0.08,
    doubleSpawnChance: 0.3,
    doubleSpawnThresholdSec: 10,
    tailSegments: 16
  },
  animation: {
    spawnDelay: 120,
    tailSegments: 20
  },
  tail: {
    stiffness: 0.8,
    damping: 0.98,
    constraintIterations: 3,
    segmentLength: 8,
    baseWidthRatio: 0.6
  },
  visual: {
    particleCount: 8,
    particleGravity: 0.1,
    comboDisplayDuration: 1000,
    maxParticles: 200
  },
  audio: {
    catchSoundDuration: 0.1
  }
};

const CONFIG = Object.freeze({
  game: Object.freeze({ ...DEFAULTS.game }),
  animation: Object.freeze({ ...DEFAULTS.animation }),
  tail: Object.freeze({ ...DEFAULTS.tail }),
  visual: Object.freeze({ ...DEFAULTS.visual }),
  audio: Object.freeze({ ...DEFAULTS.audio }),
});

/**
 * Create a config with runtime overrides applied to the visual group.
 * Supported override keys: particleCount, maxParticles.
 * Returns a new frozen config; does not mutate CONFIG.
 */
function createConfig(overrides = {}) {
  const visual = {
    ...DEFAULTS.visual,
    particleCount: overrides.particleCount ?? DEFAULTS.visual.particleCount,
    maxParticles: overrides.maxParticles ?? DEFAULTS.visual.maxParticles,
  };
  return Object.freeze({
    game: Object.freeze({ ...DEFAULTS.game }),
    animation: Object.freeze({ ...DEFAULTS.animation }),
    tail: Object.freeze({ ...DEFAULTS.tail }),
    visual: Object.freeze(visual),
    audio: Object.freeze({ ...DEFAULTS.audio }),
  });
}

export { CONFIG, createConfig };
