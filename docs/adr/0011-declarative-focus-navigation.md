# ADR-0011: Declarative Focus Group Navigation for TV Remote

**Status**: Accepted
**Date**: 2026-06-19

## Context

The game targets Android TV via Cordova, where users navigate menus with a TV remote (D-pad). The existing input system (`InputHandler`) handles Canvas mouse/touch events only. A new navigation mechanism is needed that:

1. Supports Arrow keys (Up/Down/Left/Right) for menu navigation
2. Supports Enter for selection and Escape/Backspace for back navigation
3. Provides clear visual focus feedback
4. Works across all menu screens (main menu, animation settings, game over)
5. Does not interfere with game/animation Canvas input
6. Responds within 100ms

## Decision

### Declarative focus group navigation

Each menu screen defines an ordered group of focusable elements. Arrow keys move linearly within the group. This approach was chosen over:

- **DOM focus management**: Too much browser-specific behavior (scroll-into-view, focus rings)
- **Spatial navigation**: Over-engineered for a simple linear menu layout
- **Third-party library**: Violates zero-dependency principle

### Independent FocusNavigator module

A new `FocusNavigator` class, separate from `InputHandler`:

- Listens to `keydown` events on a configurable `eventTarget` (defaults to `document`)
- Manages focus groups via `registerGroup(name, elements)` and `activateGroup(name)`
- Adds/removes `.focused` CSS class on elements
- Calls `element.click()` on Enter and `onBack` callback on Escape/Backspace
- Boundary behavior: first element ArrowUp does nothing, last element ArrowDown does nothing
- Default: first element in group receives focus on `activateGroup`

### Game mode ignores arrow keys

When the game or animation Canvas is active, `FocusNavigator.clearFocus()` is called. Arrow keys have no effect. Only Escape/Backspace triggers back navigation (return to menu).

### Visual feedback: orange highlight border

- `.btn` has `border: 3px solid transparent` (reserves space, prevents layout shift)
- `.btn.focused` sets `border-color: #ff6b35 !important`
- CSS transition: `border-color 100ms ease` (within 100ms response requirement)

### Screen change integration via UIController

`UIController` accepts an `onScreenChange` callback, invoked at the end of `showScreen(name)`. `Game` uses this callback to call `FocusNavigator.activateGroup()` or `clearFocus()` depending on the screen.

### Standard event.key only

Only handles `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`, `Escape`, `Backspace`. Cordova Android TV maps remote buttons to these standard keys.

## Consequences

- **Positive**: Zero-dependency, lightweight (~80 lines) navigation module
- **Positive**: Clear separation of concerns — InputHandler for Canvas, FocusNavigator for menus
- **Positive**: Event response is synchronous DOM manipulation (< 1ms), well within 100ms budget
- **Positive**: CSS transition at 100ms provides smooth but snappy visual feedback
- **Positive**: Cordova Android TV compatible out of the box
- **Negative**: Linear navigation only — 2D grid layouts would require spatial navigation
- **Negative**: Focus groups must be re-registered if DOM changes dynamically (not currently needed)
