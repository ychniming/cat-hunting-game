import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputHandler } from '../src/input-handler.js';

function createMockCanvas(width, height, cssWidth, cssHeight) {
    const listeners = {};
    return {
        width,
        height,
        addEventListener: vi.fn((event, handler) => {
            listeners[event] = handler;
        }),
        removeEventListener: vi.fn((event, handler) => {
            delete listeners[event];
        }),
        getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: cssWidth,
            height: cssHeight
        }),
        getListeners: () => listeners
    };
}

describe('InputHandler', () => {
    let canvas;
    let onInput;
    let handler;

    beforeEach(() => {
        canvas = createMockCanvas(800, 600, 800, 600);
        onInput = vi.fn();
        handler = new InputHandler(canvas, onInput);
    });

    it('registers mousedown and touchstart listeners', () => {
        expect(canvas.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
        expect(canvas.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
    });

    it('calls onInput with correct coords for 1:1 scale', () => {
        const listeners = canvas.getListeners();
        listeners.mousedown({ clientX: 100, clientY: 200 });
        expect(onInput).toHaveBeenCalledWith(100, 200);
    });

    it('falls back to 1:1 mapping when rect size is 0', () => {
        const zeroCanvas = createMockCanvas(800, 600, 0, 0);
        const zeroOnInput = vi.fn();
        const zeroHandler = new InputHandler(zeroCanvas, zeroOnInput);
        const listeners = zeroCanvas.getListeners();

        listeners.mousedown({ clientX: 100, clientY: 200 });
        expect(zeroOnInput).toHaveBeenCalledWith(100, 200);
    });

    it('scales coords when canvas internal size differs from CSS size', () => {
        const scaledCanvas = createMockCanvas(1600, 1200, 800, 600);
        const scaledOnInput = vi.fn();
        const scaledHandler = new InputHandler(scaledCanvas, scaledOnInput);
        const listeners = scaledCanvas.getListeners();

        listeners.mousedown({ clientX: 100, clientY: 200 });
        expect(scaledOnInput).toHaveBeenCalledWith(200, 400);
    });

    it('scales touch events when canvas internal size differs from CSS size', () => {
        const scaledCanvas = createMockCanvas(1600, 1200, 800, 600);
        const scaledOnInput = vi.fn();
        const scaledHandler = new InputHandler(scaledCanvas, scaledOnInput);
        const listeners = scaledCanvas.getListeners();

        listeners.touchstart({
            preventDefault: vi.fn(),
            touches: [{ clientX: 400, clientY: 300 }]
        });
        expect(scaledOnInput).toHaveBeenCalledWith(800, 600);
    });

    it('handles multiple touches', () => {
        const listeners = canvas.getListeners();
        listeners.touchstart({
            preventDefault: vi.fn(),
            touches: [
                { clientX: 100, clientY: 200 },
                { clientX: 300, clientY: 400 }
            ]
        });
        expect(onInput).toHaveBeenCalledTimes(2);
    });

    it('destroy removes event listeners', () => {
        handler.destroy();
        expect(canvas.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
        expect(canvas.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
    });

    it('calls preventDefault on touch events', () => {
        const listeners = canvas.getListeners();
        const preventDefault = vi.fn();
        listeners.touchstart({
            preventDefault,
            touches: [{ clientX: 100, clientY: 200 }]
        });
        expect(preventDefault).toHaveBeenCalled();
    });
});
