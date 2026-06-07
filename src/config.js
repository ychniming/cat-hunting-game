const CONFIG = Object.freeze({
  game: Object.freeze({
    duration: 60,
    spawnIntervalBase: 60,
    spawnIntervalMin: 20,
    spawnAccelerationRateSec: 5,
    spawnAccelerationStep: 5,
    doubleSpawnChance: 0.3,
    doubleSpawnThresholdSec: 10,
    tailSegments: 16
  }),
  animation: Object.freeze({
    spawnDelay: 60,
    tailSegments: 20
  }),
  tail: Object.freeze({
    gravity: 0.15,
    stiffness: 0.8,
    damping: 0.98,
    constraintIterations: 3,
    segmentLength: 8,
    baseWidthRatio: 0.6,
    tipWidth: 1,
    curlRadius: 4
  }),
  visual: Object.freeze({
    fps: 60,
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
