const CONFIG = Object.freeze({
  game: Object.freeze({
    duration: 60,
    spawnIntervalBase: 60,
    spawnIntervalMin: 20,
    spawnAccelerationRate: 300,
    spawnAccelerationStep: 5,
    doubleSpawnChance: 0.3,
    doubleSpawnThreshold: 600,
    tailSegments: 8
  }),
  animation: Object.freeze({
    spawnDelay: 60,
    tailSegments: 12
  }),
  visual: Object.freeze({
    fps: 60,
    particleCount: 8,
    particleGravity: 0.1,
    comboDisplayDuration: 1000
  }),
  audio: Object.freeze({
    catchSoundDuration: 0.1
  })
});

export { CONFIG };
