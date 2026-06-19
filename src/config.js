const CONFIG = Object.freeze({
  game: Object.freeze({
    duration: 60,
    spawnIntervalBaseSec: 1.0,
    spawnIntervalMinSec: 0.33,
    spawnAccelerationRateSec: 5,
    spawnAccelerationStepSec: 0.08,
    doubleSpawnChance: 0.3,
    doubleSpawnThresholdSec: 10,
    tailSegments: 16
  }),
  animation: Object.freeze({
    spawnDelay: 120,
    tailSegments: 20
  }),
  tail: Object.freeze({
    stiffness: 0.8,
    damping: 0.98,
    constraintIterations: 3,
    segmentLength: 8,
    baseWidthRatio: 0.6
  }),
  visual: Object.freeze({
    particleCount: 8,
    particleGravity: 0.1,
    comboDisplayDuration: 1000,
    maxParticles: 200
  }),
  audio: Object.freeze({
    catchSoundDuration: 0.1
  })
});

export { CONFIG };
