# ADR-0013: Runtime Config Injection via Dynamic Import

**Status**: Accepted
**Date**: 2026-06-19

## Context

`start.js` generates `src/runtime-config.js` with environment-specific overrides (e.g., reduced particle count for low-memory devices, production mode settings). However, no code in `src/` imported or used `RUNTIME_CONFIG`, making the entire runtime parameter injection feature ineffective.

The root cause: `CONFIG` was a static frozen object imported at module load time, with no mechanism to apply overrides.

## Decision

1. **`config.js` exports `createConfig(overrides)`** — a factory function that produces a frozen config with runtime overrides applied to the `visual` group. Supported override keys: `particleCount`, `maxParticles`.

2. **`main.js` uses dynamic `import()`** — attempts to load `runtime-config.js` at startup. If the file doesn't exist (e.g., running without `start.js`), falls back to default config via `createConfig()`.

3. **`Game` constructor accepts `config` parameter** — defaults to the static `CONFIG` for backward compatibility. All internal `CONFIG` references changed to `this.config`.

4. **`start.js` removes `fps` override** — `CONFIG.visual.fps` was deleted as dead config in a previous cleanup; the runtime override is updated to match.

```javascript
// main.js
let config;
try {
    const { RUNTIME_CONFIG } = await import('./runtime-config.js');
    config = createConfig(RUNTIME_CONFIG);
} catch {
    config = createConfig();
}
new Game(config);
```

## Consequences

- **Positive**: `start.js --mode prod` now actually reduces particle effects on low-memory devices
- **Positive**: Dynamic import gracefully handles missing `runtime-config.js` (no crash when running directly)
- **Positive**: `Game` constructor backward-compatible — existing code using `new Game()` still works
- **Positive**: `createConfig` is testable independently
- **Negative**: `main.js` is now async (uses top-level `await import()`), requires `<script type="module">` (already in place)
- **Negative**: Only `visual` group is overridable via `createConfig` — extending to other groups requires updating the function
