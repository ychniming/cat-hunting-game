# ADR-0010: Tech Debt Cleanup - CreatureCore Deepening, Encapsulation, Real-Time Spawn, NaN Root Cause, Constraint Tests

**Status**: Accepted
**Date**: 2026-06-09

## Context

After ADR-0008 (architecture fix batch) and ADR-0009 (medium issues batch 2), a comprehensive tech debt audit identified 6 high-priority issues that violated established architectural principles:

1. **CreatureCore shallow module**: Shared physics methods (clampSpeed, getSpeed, addVelocityOffset) were duplicated in Creature and AnimationCreature instead of being centralized in CreatureCore.
2. **Encapsulation breach**: `resize()` in GameMode and AnimationMode directly wrote to `creature.canvasWidth/Height` and `creature.core.canvasWidth/Height`, violating the semantic method principle (ADR-0008/0009).
3. **PausingState direct field access**: `creature.vx = 0; creature.vy = 0;` in PausingState bypassed semantic methods.
4. **Frame-based spawn timer**: `spawnTimer` used frame counting despite the real-time timer system established in ADR-0009. CONFIG keys still used frame-based values (`spawnIntervalBase: 60`).
5. **NaN defensive code masking root cause**: 4 `isFinite()` checks in AnimationCreature masked a division-by-zero bug in `clampSpeed` when `speed === 0`.
6. **Mirror tests in config.test.js**: Tests asserted exact CONFIG values (e.g., `toBe(60)`), providing no protection against value changes that break invariants.

## Decision

### 1. Deepen CreatureCore with immutable physics methods

- Moved `clampSpeed(vx, vy, maxSpeed)`, `getSpeed(vx, vy)`, `addVelocityOffset(vx, vy, dvx, dvy)` to CreatureCore
- All methods follow immutable pattern: return new `{vx, vy}` objects, never mutate inputs
- Creature and AnimationCreature delegate to `this.core` for these methods
- Added `speed > 0` guard in `clampSpeed` to prevent division-by-zero NaN

### 2. Add resize() semantic method

- Added `resize(canvasWidth, canvasHeight)` to both Creature and AnimationCreature
- Method updates both `this.canvasWidth/Height` and `this.core.canvasWidth/Height`
- GameMode and AnimationMode now call `creature.resize(w, h)` instead of direct field access

### 3. Add stopVelocity() semantic method

- Added `stopVelocity()` to AnimationCreature: sets `this.vx = 0; this.vy = 0`
- PausingState now calls `creature.stopVelocity()` instead of direct field access
- Creature class does not need stopVelocity (game creatures are caught, not paused)

### 4. Convert spawn timer to real-time

- Replaced frame-based `spawnTimer`/`spawnInterval` with `_lastSpawnTime`/`_spawnIntervalSec`
- Spawn interval computed from `elapsedSeconds` using `Math.max(minSec, baseSec - floor(elapsed/rateSec)*stepSec)`
- CONFIG keys renamed with `Sec` suffix: `spawnIntervalBaseSec: 1.0`, `spawnIntervalMinSec: 0.33`, `spawnAccelerationStepSec: 0.08`
- Removed old frame-based CONFIG keys

### 5. Fix NaN root cause, remove defensive code

- Root cause: `clampSpeed` divided by `speed` when `speed === 0`, producing NaN
- Fix: Added `speed > 0` guard before division
- Removed 4 `isFinite()` checks in AnimationCreature that masked this bug
- NaN now cannot occur at the source, making defensive checks unnecessary

### 6. Replace mirror tests with constraint tests

- config.test.js rewritten to assert invariant relationships:
  - Duration and intervals are positive
  - `spawnIntervalBaseSec >= spawnIntervalMinSec`
  - `animation.tailSegments >= game.tailSegments`
  - `maxParticles >= particleCount`
  - Speed and size ranges are valid (min <= max)
- Added immutability tests (Object.isFrozen verification)
- Removed exact value assertions that provided no regression protection

## Consequences

- **Positive**: CreatureCore is now a deep module with reusable physics methods, reducing duplication
- **Positive**: All external code uses semantic methods to operate on creatures, consistent with ADR-0008/0009
- **Positive**: Spawn rhythm is fully frame-rate independent, matching the real-time timer
- **Positive**: NaN root cause fixed; defensive code removed, making bugs surface earlier
- **Positive**: Constraint tests protect invariant relationships regardless of CONFIG value changes
- **Negative**: Slightly more method call overhead (delegation to core), negligible for this project
- **Negative**: CONFIG key renames require updating all consumers (tests, game-mode.js)
