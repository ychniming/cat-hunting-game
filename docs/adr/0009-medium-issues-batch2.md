# ADR-0009: MEDIUM Issues Batch 2 - Real-Time Spawn Rhythm, Sound Event Warning, Creature Semantic Methods

**Status**: Accepted
**Date**: 2026-06-08

## Context

After the architecture fix batch (ADR-0008), code review identified 3 MEDIUM-level issues:

1. `gameTime` in GameMode was frame-based (incremented per update call), inconsistent with the real-time timer. Spawn rhythm and double-spawn threshold varied with frame rate.
2. `_soundEventMap` in Game silently ignored unknown sound events, making debugging difficult.
3. `Creature` class lacked semantic methods, while `AnimationCreature` had 17. This inconsistency made the codebase harder to maintain.

## Decision

### 1. Replace gameTime with elapsedSeconds

- Added `elapsedSeconds` getter to GameMode, computing real elapsed seconds from `_accumulatedMs`
- Replaced frame-based `gameTime++` with real-time `elapsedSeconds` in spawn logic
- Converted CONFIG values from frame-based to second-based:
  - `spawnAccelerationRate: 300` (frames) -> `spawnAccelerationRateSec: 5` (seconds)
  - `doubleSpawnThreshold: 600` (frames) -> `doubleSpawnThresholdSec: 10` (seconds)
- Removed old frame-based CONFIG keys
- Fixed game-end boundary: `_accumulatedMs` now updated when game ends naturally

### 2. Add console.warn for unknown sound events

- Modified `_renderAnimationFrame` to log `console.warn` when an unknown sound event is dispatched
- Known events (startCrawl, stopCrawl, playPause) continue to work silently

### 3. Add semantic methods to Creature

- Added 7 semantic methods: `addWiggleOffset`, `clampSpeed`, `getSpeed`, `incrementCaughtTime`, `shrinkRadius`, `isCaughtAnimationDone`, `isOutOfBounds`
- Refactored `update()` to use semantic methods instead of inline logic
- `clampSpeed` internally calls `getSpeed()` to avoid duplication
- Did NOT add `applyBoundaryForce` (Creature goes offscreen, doesn't use boundary force)

## Consequences

- **Positive**: Spawn rhythm is now frame-rate independent, matching the real-time timer
- **Positive**: Unknown sound events are visible in console for debugging
- **Positive**: Both Creature classes now use semantic methods, improving consistency
- **Positive**: Dead CONFIG keys removed, reducing confusion
- **Negative**: `elapsedSeconds >= 10` triggers double-spawn slightly earlier than old `gameTime > 600` (at 10s vs ~10.02s), negligible difference
