# ADR-0012: Canvas Coordinate DPI Scaling

**Status**: Accepted
**Date**: 2026-06-19

## Context

`InputHandler._getCanvasCoords` previously mapped CSS pixel coordinates directly to canvas coordinates without accounting for DPI scaling. When the canvas internal resolution (`canvas.width`/`canvas.height`) differs from its CSS display size (`getBoundingClientRect().width`/`height`), click/touch coordinates are incorrect. This affects:

- High DPI (Retina) displays where `canvas.width` may be 2x the CSS width
- CSS-scaled canvases (responsive layouts)
- Android TV via Cordova where viewport scaling may differ

The existing test explicitly asserted "does not scale coords" — treating the bug as a feature.

## Decision

Apply CSS-to-canvas coordinate scaling in `_getCanvasCoords`:

```javascript
const scaleX = rect.width > 0 ? this.canvas.width / rect.width : 1;
const scaleY = rect.height > 0 ? this.canvas.height / rect.height : 1;
return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
};
```

Key decisions:
- **Zero-size guard**: When `rect.width` or `rect.height` is 0 (canvas not rendered), fall back to scale=1 to prevent Infinity/NaN coordinates
- **Per-event calculation**: Scale factors are computed on each event (not cached) to handle dynamic resizing correctly
- **1:1 pass-through**: When canvas internal size equals CSS size, scaleX=scaleY=1, preserving existing behavior

## Consequences

- **Positive**: Correct click/touch coordinates on all DPI displays
- **Positive**: Fixes Android TV touch input when viewport is scaled
- **Positive**: Zero-size guard prevents crashes when canvas is hidden
- **Negative**: Slightly more computation per event (negligible — two divisions and two multiplications)
- **Negative**: Breaks any code that relied on the old unscaled behavior (none found outside tests)
