import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FocusNavigator } from '../src/focus-navigator.js';

function createMockElement() {
    return {
        click: vi.fn(),
        classList: {
            _classes: new Set(),
            add(cls) { this._classes.add(cls); },
            remove(cls) { this._classes.delete(cls); },
            contains(cls) { return this._classes.has(cls); }
        }
    };
}

function createKeyEvent(key, repeat = false) {
    return { key, repeat, preventDefault: vi.fn() };
}

function createMockEventTarget() {
    const listeners = {};
    return {
        addEventListener: vi.fn((event, handler) => {
            listeners[event] = handler;
        }),
        removeEventListener: vi.fn((event, handler) => {
            delete listeners[event];
        }),
        getListeners: () => listeners,
        dispatchKeyDown: (key, repeat = false) => {
            const handler = listeners['keydown'];
            if (handler) handler({ key, repeat, preventDefault: vi.fn() });
        }
    };
}

describe('FocusNavigator', () => {
    let navigator;
    let onBack;
    let elements;
    let eventTarget;

    beforeEach(() => {
        onBack = vi.fn();
        eventTarget = createMockEventTarget();
        navigator = new FocusNavigator(onBack, eventTarget);
        elements = {
            btn1: createMockElement(),
            btn2: createMockElement(),
            btn3: createMockElement()
        };
    });

    afterEach(() => {
        navigator.destroy();
    });

    describe('registerGroup + activateGroup', () => {
        it('activates group and focuses first element', () => {
            navigator.registerGroup('menu', [elements.btn1, elements.btn2]);
            navigator.activateGroup('menu');
            expect(elements.btn1.classList.contains('focused')).toBe(true);
            expect(elements.btn2.classList.contains('focused')).toBe(false);
        });

        it('clears previous focus when activating new group', () => {
            navigator.registerGroup('menu', [elements.btn1, elements.btn2]);
            navigator.registerGroup('settings', [elements.btn3]);
            navigator.activateGroup('menu');
            expect(elements.btn1.classList.contains('focused')).toBe(true);
            navigator.activateGroup('settings');
            expect(elements.btn1.classList.contains('focused')).toBe(false);
            expect(elements.btn3.classList.contains('focused')).toBe(true);
        });

        it('handles activating unregistered group gracefully', () => {
            navigator.activateGroup('nonexistent');
            // no error thrown, no focus set
        });

        it('handles empty element array', () => {
            navigator.registerGroup('empty', []);
            navigator.activateGroup('empty');
            // no error thrown
        });
    });

    describe('direction key navigation', () => {
        beforeEach(() => {
            navigator.registerGroup('menu', [elements.btn1, elements.btn2, elements.btn3]);
            navigator.activateGroup('menu');
        });

        it('ArrowDown moves focus to next element', () => {
            navigator.handleKeyDown(createKeyEvent('ArrowDown'));
            expect(elements.btn1.classList.contains('focused')).toBe(false);
            expect(elements.btn2.classList.contains('focused')).toBe(true);
        });

        it('ArrowUp moves focus to previous element', () => {
            navigator.handleKeyDown(createKeyEvent('ArrowDown'));
            navigator.handleKeyDown(createKeyEvent('ArrowUp'));
            expect(elements.btn1.classList.contains('focused')).toBe(true);
            expect(elements.btn2.classList.contains('focused')).toBe(false);
        });

        it('ArrowRight also moves to next (alias for Down in vertical layout)', () => {
            navigator.handleKeyDown(createKeyEvent('ArrowRight'));
            expect(elements.btn2.classList.contains('focused')).toBe(true);
        });

        it('ArrowLeft also moves to previous (alias for Up in vertical layout)', () => {
            navigator.handleKeyDown(createKeyEvent('ArrowDown'));
            navigator.handleKeyDown(createKeyEvent('ArrowLeft'));
            expect(elements.btn1.classList.contains('focused')).toBe(true);
        });

        it('focus stops at first element when pressing Up', () => {
            navigator.handleKeyDown(createKeyEvent('ArrowUp'));
            expect(elements.btn1.classList.contains('focused')).toBe(true);
        });

        it('focus stops at last element when pressing Down', () => {
            navigator.handleKeyDown(createKeyEvent('ArrowDown'));
            navigator.handleKeyDown(createKeyEvent('ArrowDown'));
            navigator.handleKeyDown(createKeyEvent('ArrowDown'));
            expect(elements.btn3.classList.contains('focused')).toBe(true);
        });
    });

    describe('Enter key', () => {
        beforeEach(() => {
            navigator.registerGroup('menu', [elements.btn1, elements.btn2]);
            navigator.activateGroup('menu');
        });

        it('triggers click on focused element', () => {
            navigator.handleKeyDown(createKeyEvent('Enter'));
            expect(elements.btn1.click).toHaveBeenCalled();
        });

        it('triggers click on second element after navigating', () => {
            navigator.handleKeyDown(createKeyEvent('ArrowDown'));
            navigator.handleKeyDown(createKeyEvent('Enter'));
            expect(elements.btn2.click).toHaveBeenCalled();
        });
    });

    describe('Back key (Escape/Backspace)', () => {
        beforeEach(() => {
            navigator.registerGroup('menu', [elements.btn1]);
            navigator.activateGroup('menu');
        });

        it('Escape triggers onBack callback', () => {
            navigator.handleKeyDown(createKeyEvent('Escape'));
            expect(onBack).toHaveBeenCalled();
        });

        it('Backspace triggers onBack callback', () => {
            navigator.handleKeyDown(createKeyEvent('Backspace'));
            expect(onBack).toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('ignores non-navigation keys', () => {
            navigator.registerGroup('menu', [elements.btn1, elements.btn2]);
            navigator.activateGroup('menu');
            navigator.handleKeyDown(createKeyEvent('a'));
            navigator.handleKeyDown(createKeyEvent('Tab'));
            navigator.handleKeyDown(createKeyEvent('Space'));
            expect(elements.btn1.classList.contains('focused')).toBe(true);
        });

        it('ignores repeated key events', () => {
            navigator.registerGroup('menu', [elements.btn1, elements.btn2]);
            navigator.activateGroup('menu');
            navigator.handleKeyDown(createKeyEvent('ArrowDown', true));
            expect(elements.btn1.classList.contains('focused')).toBe(true);
        });

        it('does nothing when no group is active', () => {
            navigator.registerGroup('menu', [elements.btn1, elements.btn2]);
            // no activateGroup called
            navigator.handleKeyDown(createKeyEvent('ArrowDown'));
            navigator.handleKeyDown(createKeyEvent('Enter'));
            expect(elements.btn1.click).not.toHaveBeenCalled();
        });

        it('does nothing after destroy', () => {
            navigator.registerGroup('menu', [elements.btn1, elements.btn2]);
            navigator.activateGroup('menu');
            navigator.destroy();
            navigator.handleKeyDown(createKeyEvent('ArrowDown'));
            // btn1 still focused (no change after destroy)
            expect(elements.btn1.classList.contains('focused')).toBe(true);
        });

        it('clearFocus removes focus from current element', () => {
            navigator.registerGroup('menu', [elements.btn1]);
            navigator.activateGroup('menu');
            expect(elements.btn1.classList.contains('focused')).toBe(true);
            navigator.clearFocus();
            expect(elements.btn1.classList.contains('focused')).toBe(false);
        });
    });
});
