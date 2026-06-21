import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---- Use vi.hoisted to set up globals BEFORE imports are evaluated ----
const { mockCanvas, mockElements, mockGetElementById, callTracker } = vi.hoisted(() => {
    const callTracker = { count: 0 };

    const mockCanvas = {
        id: 'gameCanvas',
        style: {},
        classList: { add: vi.fn(), remove: vi.fn() },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 800, height: 600 })),
        getContext: vi.fn(() => ({
            fillStyle: '',
            fillRect: vi.fn(),
            clearRect: vi.fn(),
            drawImage: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),
            closePath: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            scale: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            quadraticCurveTo: vi.fn(),
            bezierCurveTo: vi.fn(),
            ellipse: vi.fn(),
            clip: vi.fn(),
            globalAlpha: 1,
            fillText: vi.fn(),
            measureText: vi.fn(() => ({ width: 10 })),
            font: '',
            textAlign: '',
            textBaseline: '',
        })),
        _gameInstance: null,
        width: 800,
        height: 600,
    };

    function createMockElement(id) {
        const listeners = {};
        return {
            id,
            style: {},
            classList: { add: vi.fn(), remove: vi.fn() },
            addEventListener: vi.fn((event, handler) => {
                listeners[event] = handler;
            }),
            removeEventListener: vi.fn((event, handler) => {
                if (listeners[event] === handler) delete listeners[event];
            }),
            getListeners: () => listeners,
            querySelectorAll: vi.fn(() => []),
        };
    }

    const debugLogChildren = [];
    const mockDebugLog = {
        id: 'debugLog',
        style: {},
        childNodes: debugLogChildren,
        appendChild: vi.fn((node) => {
            debugLogChildren.push(node);
            return node;
        }),
        removeChild: vi.fn((node) => {
            const idx = debugLogChildren.indexOf(node);
            if (idx !== -1) debugLogChildren.splice(idx, 1);
            return node;
        }),
    };

    const mockElements = {
        gameCanvas: mockCanvas,
        startScreen: createMockElement('startScreen'),
        gameOverScreen: createMockElement('gameOverScreen'),
        animationScreen: createMockElement('animationScreen'),
        ui: createMockElement('ui'),
        modeSwitch: createMockElement('modeSwitch'),
        score: { textContent: '' },
        time: { textContent: '' },
        comboDisplay: { textContent: '', classList: { add: vi.fn(), remove: vi.fn() } },
        finalScore: { textContent: '' },
        maxCombo: { textContent: '' },
        debugLog: mockDebugLog,
    };

    const mockGetElementById = vi.fn((id) => {
        callTracker.count++;
        return mockElements[id] || null;
    });

    // Set up globals BEFORE game.js is imported
    global.document = {
        getElementById: mockGetElementById,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        createElement: vi.fn((tag) => ({ tagName: tag, textContent: '' })),
    };

    global.window = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        innerWidth: 800,
        innerHeight: 600,
        AudioContext: vi.fn(),
        webkitAudioContext: vi.fn(),
    };

    global.requestAnimationFrame = vi.fn((cb) => {
        return setTimeout(cb, 16);
    });
    global.cancelAnimationFrame = vi.fn((id) => {
        clearTimeout(id);
    });

    // Mock clearTimeout as a spy so we can assert on it
    const origClearTimeout = global.clearTimeout;
    global.clearTimeout = vi.fn((id) => {
        origClearTimeout(id);
    });

    return { mockCanvas, mockElements, mockGetElementById, callTracker };
});

// ---- Mock all Game dependencies ----
vi.mock('../src/config.js', () => ({
    CONFIG: {
        game: { duration: 60, spawnIntervalBaseSec: 1.0, spawnIntervalMinSec: 0.33, spawnAccelerationRateSec: 5, spawnAccelerationStepSec: 0.08, doubleSpawnChance: 0.3, doubleSpawnThresholdSec: 10, tailSegments: 16 },
        animation: { spawnDelay: 60, tailSegments: 20 },
        tail: { stiffness: 0.8, damping: 0.98, constraintIterations: 3, segmentLength: 8, baseWidthRatio: 0.6 },
        visual: { particleCount: 8, particleGravity: 0.1, comboDisplayDuration: 1000, maxParticles: 200 },
        audio: { catchSoundDuration: 0.1 }
    }
}));

vi.mock('../src/game-mode.js', () => {
    class MockGameMode {
        constructor() {
            this.start = vi.fn();
            this.stop = vi.fn();
            this.handleInput = vi.fn(() => ({ hit: false, combo: 0, score: 0 }));
            this.update = vi.fn();
            this.isOver = vi.fn(() => false);
            this.getState = vi.fn(() => ({ creatures: [], particles: [], score: 0, time: 60, combo: 0, maxCombo: 0 }));
            this.resize = vi.fn();
            this.running = false;
            this.score = 0;
            this.time = 60;
            this.combo = 0;
            this.maxCombo = 0;
        }
    }
    return { GameMode: MockGameMode };
});

vi.mock('../src/animation-mode.js', () => {
    class MockAnimationMode {
        constructor() {
            this.start = vi.fn();
            this.stop = vi.fn();
            this.update = vi.fn(() => ({ soundEvents: [], expired: false }));
            this.getState = vi.fn(() => ({ creature: null }));
            this.resize = vi.fn();
            this.running = false;
        }
    }
    return { AnimationMode: MockAnimationMode };
});

vi.mock('../src/sound-manager.js', () => {
    class MockSoundManager {
        constructor() {
            this.startBackgroundMusic = vi.fn();
            this.stopBackgroundMusic = vi.fn();
            this.startCrawlSound = vi.fn();
            this.stopCrawlSound = vi.fn();
            this.playPauseSound = vi.fn();
            this.playCatchSound = vi.fn();
            this.stopAll = vi.fn();
            this.destroy = vi.fn();
        }
    }
    return { SoundManager: MockSoundManager };
});

vi.mock('../src/ui-controller.js', () => {
    class MockUIController {
        constructor(onScreenChange) {
            this._onScreenChange = onScreenChange;
            this.showScreen = vi.fn((name) => {
                if (this._onScreenChange) this._onScreenChange(name);
            });
            this.showCombo = vi.fn();
            this.hideCombo = vi.fn();
            this.updateScore = vi.fn();
            this.updateTimer = vi.fn();
            this.showGameOver = vi.fn((score, maxCombo) => {
                this.showScreen('gameOver');
            });
        }
    }
    return { UIController: MockUIController };
});

vi.mock('../src/input-handler.js', () => {
    class MockInputHandler {
        constructor() {
            this.destroy = vi.fn();
        }
    }
    return { InputHandler: MockInputHandler };
});

vi.mock('../src/focus-navigator.js', () => {
    class MockFocusNavigator {
        constructor() {
            this.registerGroup = vi.fn();
            this.activateGroup = vi.fn();
            this.clearFocus = vi.fn();
            this.handleKeyDown = vi.fn();
            this.destroy = vi.fn();
        }
    }
    return { FocusNavigator: MockFocusNavigator };
});

vi.mock('../src/creature-renderer.js', () => ({
    renderCreature: vi.fn(),
}));

// ---- Import Game AFTER mocks are set up ----
// This import will trigger new Game() if it exists at module level
import { Game } from '../src/game.js';
// Capture the call count right after import - if new Game() was at module level,
// getElementById would have been called during import
const importTimeCallCount = callTracker.count;

// ---- Tests ----

describe('Game', () => {
    let game;

    beforeEach(() => {
        // Reset canvas mock
        mockCanvas._gameInstance = null;

        // Reset call counts for per-test tracking
        mockGetElementById.mockClear();
        global.document.addEventListener.mockClear();
        global.document.removeEventListener.mockClear();
        global.window.addEventListener.mockClear();
        global.window.removeEventListener.mockClear();
        global.requestAnimationFrame.mockClear();
        global.cancelAnimationFrame.mockClear();
        global.clearTimeout.mockClear();

        // Reset container event listener mocks
        ['startScreen', 'animationScreen', 'gameOverScreen', 'modeSwitch'].forEach((id) => {
            mockElements[id].addEventListener.mockClear();
            mockElements[id].removeEventListener.mockClear();
        });

        // Reset debug log mock
        mockElements.debugLog.style.display = '';
        mockElements.debugLog.childNodes.length = 0;
        mockElements.debugLog.appendChild.mockClear();
        mockElements.debugLog.removeChild.mockClear();
        delete global.window.__CAT_DEBUG__;
    });

    afterEach(() => {
        if (game) {
            try { game.destroy(); } catch (e) { /* already destroyed */ }
            game = null;
        }
    });

    // ---- Problem 1: Module-level auto-instantiation ----

    describe('module-level instantiation', () => {
        it('importing Game does not auto-instantiate (no side effects on import)', () => {
            // If new Game() was at module level, getElementById would have been
            // called during the import. The Game constructor calls getElementById
            // for gameCanvas and UIController calls it for each UI element.
            // If no auto-instantiation, importTimeCallCount should be 0.
            expect(importTimeCallCount).toBe(0);
        });

        it('Game class is exported as a constructor', () => {
            expect(Game).toBeDefined();
            expect(typeof Game).toBe('function');
        });

        it('Game constructor creates instance when explicitly called', () => {
            game = new Game();
            expect(game).toBeInstanceOf(Game);
            expect(mockCanvas._gameInstance).toBe(game);
        });
    });

    // ---- Problem 2: comboTimeout synchronization ----

    describe('comboTimeout synchronization', () => {
        beforeEach(() => {
            game = new Game();
            game.mode = 'game';
            game.gameMode.running = true;
        });

        it('clears comboTimeout immediately on miss (!hit)', () => {
            // First, simulate a hit to set up comboTimeout
            game.gameMode.handleInput = vi.fn(() => ({
                hit: true, combo: 3, score: 100
            }));
            game.handleInput(400, 300);

            // _comboTimeout should be set
            expect(game._comboTimeout).not.toBeNull();
            const hitTimeout = game._comboTimeout;

            // Now simulate a miss - comboTimeout should be cleared immediately
            game.gameMode.handleInput = vi.fn(() => ({
                hit: false, combo: 0, score: 100
            }));
            game.handleInput(0, 0);

            // clearTimeout should have been called for the combo timeout
            expect(global.clearTimeout).toHaveBeenCalledWith(hitTimeout);
            // _comboTimeout should be null after miss
            expect(game._comboTimeout).toBeNull();
        });

        it('hides combo display on miss', () => {
            game.gameMode.handleInput = vi.fn(() => ({
                hit: false, combo: 0, score: 50
            }));

            game.handleInput(0, 0);

            expect(game.ui.hideCombo).toHaveBeenCalled();
        });

        it('resets comboTimeout to null on miss even if no prior timeout existed', () => {
            // No prior hit, so _comboTimeout is undefined
            game._comboTimeout = undefined;
            game.gameMode.handleInput = vi.fn(() => ({
                hit: false, combo: 0, score: 0
            }));

            game.handleInput(0, 0);

            expect(game._comboTimeout).toBeNull();
        });

        it('sets new comboTimeout on hit after a miss', () => {
            // Miss first
            game.gameMode.handleInput = vi.fn(() => ({
                hit: false, combo: 0, score: 0
            }));
            game.handleInput(0, 0);

            // Then hit
            game.gameMode.handleInput = vi.fn(() => ({
                hit: true, combo: 1, score: 10
            }));
            game.handleInput(400, 300);

            // A new timeout should be set
            expect(game._comboTimeout).not.toBeNull();
        });

        it('combo display and GameMode.combo stay in sync on rapid hit-then-miss', () => {
            // Hit
            game.gameMode.handleInput = vi.fn(() => ({
                hit: true, combo: 5, score: 50
            }));
            game.handleInput(400, 300);
            expect(game.ui.showCombo).toHaveBeenCalledWith(5);

            // Immediate miss
            game.gameMode.handleInput = vi.fn(() => ({
                hit: false, combo: 0, score: 50
            }));
            game.handleInput(0, 0);

            // comboTimeout should be cleared, combo hidden
            expect(game._comboTimeout).toBeNull();
            expect(game.ui.hideCombo).toHaveBeenCalled();
        });
    });

    // ---- Destroy / no leaks ----

    describe('destroy', () => {
        beforeEach(() => {
            game = new Game();
        });

        it('removes button container event listeners', () => {
            game.destroy();
            expect(mockElements.startScreen.removeEventListener).toHaveBeenCalledWith('click', game._handleAction, false);
            expect(mockElements.startScreen.removeEventListener).toHaveBeenCalledWith('touchstart', game._handleAction, { passive: true });
            expect(mockElements.startScreen.removeEventListener).toHaveBeenCalledWith('touchend', game._handleAction, false);
        });

        it('removes window resize event listener', () => {
            game.destroy();
            expect(global.window.removeEventListener).toHaveBeenCalledWith('resize', game._handleResize);
        });

        it('cancels animation frame', () => {
            game.destroy();
            expect(global.cancelAnimationFrame).toHaveBeenCalled();
            expect(game._rafId).toBeNull();
        });

        it('clears comboTimeout on destroy', () => {
            // Simulate an active comboTimeout
            const fakeTimeoutId = 12345;
            game._comboTimeout = fakeTimeoutId;

            game.destroy();

            expect(global.clearTimeout).toHaveBeenCalledWith(fakeTimeoutId);
            expect(game._comboTimeout).toBeNull();
        });

        it('sets _destroyed flag to stop game loop', () => {
            game.destroy();
            expect(game._destroyed).toBe(true);
        });

        it('calls destroy on inputHandler', () => {
            const destroySpy = vi.spyOn(game.inputHandler, 'destroy');
            game.destroy();
            expect(destroySpy).toHaveBeenCalled();
        });

        it('calls destroy on soundManager', () => {
            const destroySpy = vi.spyOn(game.soundManager, 'destroy');
            game.destroy();
            expect(destroySpy).toHaveBeenCalled();
        });

        it('stops gameMode and animationMode', () => {
            const stopGameSpy = vi.spyOn(game.gameMode, 'stop');
            const stopAnimSpy = vi.spyOn(game.animationMode, 'stop');
            game.destroy();
            expect(stopGameSpy).toHaveBeenCalled();
            expect(stopAnimSpy).toHaveBeenCalled();
        });

        it('does not leak when destroy called multiple times', () => {
            game.destroy();
            expect(() => game.destroy()).not.toThrow();
        });

        it('clears canvas._gameInstance on destroy', () => {
            expect(game.canvas._gameInstance).toBe(game);
            game.destroy();
            expect(game.canvas._gameInstance).toBeNull();
        });
    });

    // ---- handleInput general behavior ----

    describe('handleInput', () => {
        beforeEach(() => {
            game = new Game();
            game.mode = 'game';
            game.gameMode.running = true;
        });

        it('does nothing when mode is not game', () => {
            game.mode = 'menu';
            game.gameMode.handleInput = vi.fn();

            game.handleInput(400, 300);

            expect(game.gameMode.handleInput).not.toHaveBeenCalled();
        });

        it('delegates to gameMode.handleInput and updates UI on hit', () => {
            game.gameMode.handleInput = vi.fn(() => ({
                hit: true, combo: 2, score: 20
            }));

            game.handleInput(400, 300);

            expect(game.gameMode.handleInput).toHaveBeenCalledWith(400, 300);
            expect(game.ui.showCombo).toHaveBeenCalledWith(2);
            expect(game.ui.updateScore).toHaveBeenCalledWith(20);
        });

        it('plays catch sound on hit', () => {
            game.gameMode.handleInput = vi.fn(() => ({
                hit: true, combo: 3, score: 30
            }));

            game.handleInput(400, 300);

            expect(game.soundManager.playCatchSound).toHaveBeenCalledWith(3);
        });

        it('clears previous comboTimeout before setting new one on consecutive hits', () => {
            game.gameMode.handleInput = vi.fn(() => ({
                hit: true, combo: 1, score: 10
            }));

            game.handleInput(400, 300);
            const firstTimeout = game._comboTimeout;

            game.gameMode.handleInput = vi.fn(() => ({
                hit: true, combo: 2, score: 20
            }));
            game.handleInput(400, 300);

            // Previous timeout should have been cleared
            expect(global.clearTimeout).toHaveBeenCalledWith(firstTimeout);
            // New timeout should be different
            expect(game._comboTimeout).not.toBe(firstTimeout);
        });

        it('updates timer after handleInput', () => {
            game.gameMode.handleInput = vi.fn(() => ({
                hit: true, combo: 1, score: 10
            }));
            game.gameMode.time = 55;

            game.handleInput(400, 300);

            expect(game.ui.updateTimer).toHaveBeenCalledWith(55);
        });
    });

    // ---- Mode switching ----

    describe('mode switching', () => {
        beforeEach(() => {
            game = new Game();
        });

        it('startGameMode sets mode to game', () => {
            game.startGameMode();
            expect(game.mode).toBe('game');
        });

        it('startAnimationMode sets mode to animation', () => {
            game.startAnimationMode('30min');
            expect(game.mode).toBe('animation');
        });

        it('showMenu sets mode to menu', () => {
            game.showMenu();
            expect(game.mode).toBe('menu');
        });

        it('restart in game mode calls startGameMode', () => {
            game.mode = 'game';
            const spy = vi.spyOn(game, 'startGameMode');
            game.restart();
            expect(spy).toHaveBeenCalled();
        });

        it('restart in gameOver mode calls startGameMode', () => {
            game.mode = 'gameOver';
            const spy = vi.spyOn(game, 'startGameMode');
            game.restart();
            expect(spy).toHaveBeenCalled();
        });

        it('restart in menu mode does nothing', () => {
            game.mode = 'menu';
            const spy = vi.spyOn(game, 'startGameMode');
            game.restart();
            expect(spy).not.toHaveBeenCalled();
        });

        it('switchMode stops sounds and shows menu', () => {
            game.switchMode();
            expect(game.soundManager.stopAll).toHaveBeenCalled();
            expect(game.mode).toBe('menu');
        });
    });

    // ---- Game loop and rendering ----

    describe('loop', () => {
        beforeEach(() => {
            game = new Game();
        });

        it('does not render when destroyed', () => {
            game._destroyed = true;
            global.requestAnimationFrame.mockClear();
            game.loop();
            // Should not call requestAnimationFrame again
            expect(global.requestAnimationFrame).not.toHaveBeenCalled();
        });

        it('requests next frame when not destroyed', () => {
            game.mode = 'menu';
            game.loop();
            expect(global.requestAnimationFrame).toHaveBeenCalledWith(game.loop);
        });

        it('renders game frame when mode is game', () => {
            game.mode = 'game';
            const spy = vi.spyOn(game, '_renderGameFrame');
            game.loop();
            expect(spy).toHaveBeenCalled();
        });

        it('renders game frame when mode is gameOver', () => {
            game.mode = 'gameOver';
            const spy = vi.spyOn(game, '_renderGameFrame');
            game.loop();
            expect(spy).toHaveBeenCalled();
        });

        it('renders animation frame when mode is animation', () => {
            game.mode = 'animation';
            const spy = vi.spyOn(game, '_renderAnimationFrame');
            game.loop();
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('_renderGameFrame', () => {
        beforeEach(() => {
            game = new Game();
        });

        it('updates gameMode when mode is game', () => {
            game.mode = 'game';
            game._renderGameFrame();
            expect(game.gameMode.update).toHaveBeenCalled();
        });

        it('shows game over when gameMode is over', () => {
            game.mode = 'game';
            game.gameMode.isOver = vi.fn(() => true);
            game.gameMode.score = 100;
            game.gameMode.maxCombo = 5;
            game._renderGameFrame();
            expect(game.ui.showGameOver).toHaveBeenCalledWith(100, 5);
            expect(game.mode).toBe('gameOver');
        });

        it('updates timer when time changes', () => {
            game.mode = 'game';
            game.gameMode.time = 55;
            game._lastTime = 60;
            game._renderGameFrame();
            expect(game.ui.updateTimer).toHaveBeenCalledWith(55);
            expect(game._lastTime).toBe(55);
        });

        it('does not update timer when time has not changed', () => {
            game.mode = 'game';
            game.gameMode.time = 55;
            game._lastTime = 55;
            game._renderGameFrame();
            expect(game.ui.updateTimer).not.toHaveBeenCalled();
        });

        it('does not update gameMode when mode is gameOver', () => {
            game.mode = 'gameOver';
            game._renderGameFrame();
            expect(game.gameMode.update).not.toHaveBeenCalled();
        });

        it('renders creatures from game state', () => {
            game.mode = 'game';
            const mockCreature = { getVisualProps: vi.fn(() => ({ x: 100, y: 200 })) };
            game.gameMode.getState = vi.fn(() => ({
                creatures: [mockCreature],
                particles: []
            }));
            game._renderGameFrame();
            expect(mockCreature.getVisualProps).toHaveBeenCalled();
        });

        it('renders particles from game state', () => {
            game.mode = 'game';
            const mockParticle = { draw: vi.fn() };
            game.gameMode.getState = vi.fn(() => ({
                creatures: [],
                particles: [mockParticle]
            }));
            game._renderGameFrame();
            expect(mockParticle.draw).toHaveBeenCalledWith(game.ctx);
        });
    });

    describe('_renderAnimationFrame', () => {
        beforeEach(() => {
            game = new Game();
            game.mode = 'animation';
        });

        it('updates animationMode', () => {
            game._renderAnimationFrame();
            expect(game.animationMode.update).toHaveBeenCalled();
        });

        it('plays startCrawl sound event', () => {
            game.animationMode.update = vi.fn(() => ({
                soundEvents: ['startCrawl'],
                expired: false
            }));
            game._renderAnimationFrame();
            expect(game.soundManager.startCrawlSound).toHaveBeenCalled();
        });

        it('plays stopCrawl sound event', () => {
            game.animationMode.update = vi.fn(() => ({
                soundEvents: ['stopCrawl'],
                expired: false
            }));
            game._renderAnimationFrame();
            expect(game.soundManager.stopCrawlSound).toHaveBeenCalled();
        });

        it('plays playPause sound event', () => {
            game.animationMode.update = vi.fn(() => ({
                soundEvents: ['playPause'],
                expired: false
            }));
            game._renderAnimationFrame();
            expect(game.soundManager.playPauseSound).toHaveBeenCalled();
        });

        it('shows menu when animation expires', () => {
            game.animationMode.update = vi.fn(() => ({
                soundEvents: [],
                expired: true
            }));
            const spy = vi.spyOn(game, 'showMenu');
            game._renderAnimationFrame();
            expect(spy).toHaveBeenCalled();
        });

        it('renders animation creature when present', () => {
            const mockCreature = { getVisualProps: vi.fn(() => ({ x: 100, y: 200 })) };
            game.animationMode.getState = vi.fn(() => ({
                creature: mockCreature
            }));
            game.animationMode.update = vi.fn(() => ({
                soundEvents: [],
                expired: false
            }));
            game._renderAnimationFrame();
            expect(mockCreature.getVisualProps).toHaveBeenCalled();
        });

        it('warns on unknown sound event', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            game.animationMode.update = vi.fn(() => ({
                soundEvents: ['unknownEvent'],
                expired: false
            }));
            game._renderAnimationFrame();
            expect(warnSpy).toHaveBeenCalledWith('Unknown sound event: unknownEvent');
            warnSpy.mockRestore();
        });

        it('does not warn on known sound events', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            game.animationMode.update = vi.fn(() => ({
                soundEvents: ['startCrawl', 'stopCrawl', 'playPause'],
                expired: false
            }));
            game._renderAnimationFrame();
            expect(warnSpy).not.toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        it('does not render when no creature', () => {
            game.animationMode.getState = vi.fn(() => ({
                creature: null
            }));
            game.animationMode.update = vi.fn(() => ({
                soundEvents: [],
                expired: false
            }));
            game._renderAnimationFrame();
            // Should not throw or call renderCreature with null
        });
    });

    // ---- showAnimationSettings ----

    describe('showAnimationSettings', () => {
        beforeEach(() => {
            game = new Game();
        });

        it('shows animation settings screen', () => {
            game.showAnimationSettings();
            expect(game.ui.showScreen).toHaveBeenCalledWith('animationSettings');
        });
    });

    // ---- resize ----

    describe('resize', () => {
        beforeEach(() => {
            game = new Game();
        });

        it('updates canvas dimensions from window', () => {
            global.window.innerWidth = 1024;
            global.window.innerHeight = 768;
            game.resize();
            expect(game.canvas.width).toBe(1024);
            expect(game.canvas.height).toBe(768);
        });

        it('resizes gameMode and animationMode', () => {
            game.resize();
            expect(game.gameMode.resize).toHaveBeenCalled();
            expect(game.animationMode.resize).toHaveBeenCalled();
        });
    });

    // ---- Focus Navigation Integration ----

    describe('focus navigation integration', () => {
        beforeEach(() => {
            game = new Game();
        });

        it('creates FocusNavigator and registers focus groups', () => {
            expect(game.focusNavigator).toBeDefined();
            expect(game.focusNavigator.registerGroup).toHaveBeenCalledWith('menu', expect.any(Array));
            expect(game.focusNavigator.registerGroup).toHaveBeenCalledWith('animationSettings', expect.any(Array));
            expect(game.focusNavigator.registerGroup).toHaveBeenCalledWith('gameOver', expect.any(Array));
        });

        it('activates menu focus group on showMenu', () => {
            game.showMenu();
            expect(game.focusNavigator.activateGroup).toHaveBeenCalledWith('menu');
        });

        it('clears focus when entering game mode', () => {
            game.startGameMode();
            expect(game.focusNavigator.clearFocus).toHaveBeenCalled();
        });

        it('clears focus when entering animation mode', () => {
            game.startAnimationMode('30min');
            expect(game.focusNavigator.clearFocus).toHaveBeenCalled();
        });

        it('activates animationSettings group on showAnimationSettings', () => {
            game.showAnimationSettings();
            expect(game.focusNavigator.activateGroup).toHaveBeenCalledWith('animationSettings');
        });

        it('activates gameOver group on showGameOver', () => {
            game.ui.showGameOver(100, 5);
            expect(game.focusNavigator.activateGroup).toHaveBeenCalledWith('gameOver');
        });

        it('back handler returns to menu from game mode', () => {
            game.mode = 'game';
            game._currentScreen = 'game';
            game._handleBack();
            expect(game.mode).toBe('menu');
        });

        it('back handler does nothing from menu mode', () => {
            game.mode = 'menu';
            const modeBefore = game.mode;
            game._handleBack();
            expect(game.mode).toBe(modeBefore);
        });

        it('back handler returns to menu from gameOver screen', () => {
            game.mode = 'gameOver';
            game._currentScreen = 'gameOver';
            game._handleBack();
            expect(game.mode).toBe('menu');
        });

        it('back handler returns to menu from animationSettings screen', () => {
            game.mode = 'menu';
            game._currentScreen = 'animationSettings';
            game._handleBack();
            expect(game.mode).toBe('menu');
        });

        it('destroy calls focusNavigator.destroy', () => {
            game.destroy();
            expect(game.focusNavigator.destroy).toHaveBeenCalled();
        });
    });

    // ---- Button action handling ----

    describe('button action handling', () => {
        beforeEach(() => {
            game = new Game();
        });

        function fakeEvent(type, target) {
            return {
                type,
                target,
                preventDefault: vi.fn(),
                stopPropagation: vi.fn(),
            };
        }

        function fakeButton(action, param) {
            const el = document.createElement ? document.createElement('button') : {
                dataset: {},
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            };
            el.dataset = { action, param };
            el.closest = vi.fn((selector) => {
                if (selector === '[data-action]' && el.dataset.action) return el;
                return null;
            });
            return el;
        }

        it('binds click, touchstart and touchend listeners to button containers', () => {
            expect(mockElements.startScreen.addEventListener).toHaveBeenCalledWith('click', game._handleAction, false);
            expect(mockElements.startScreen.addEventListener).toHaveBeenCalledWith('touchstart', game._handleAction, { passive: true });
            expect(mockElements.startScreen.addEventListener).toHaveBeenCalledWith('touchend', game._handleAction, false);
            expect(mockElements.animationScreen.addEventListener).toHaveBeenCalledWith('click', game._handleAction, false);
            expect(mockElements.gameOverScreen.addEventListener).toHaveBeenCalledWith('click', game._handleAction, false);
            expect(mockElements.modeSwitch.addEventListener).toHaveBeenCalledWith('click', game._handleAction, false);
        });

        it('triggers action handler on click', () => {
            const spy = vi.spyOn(game, 'startGameMode');
            const btn = fakeButton('startGameMode');
            const handlers = mockElements.startScreen.getListeners();
            handlers.click(fakeEvent('click', btn));
            expect(spy).toHaveBeenCalled();
        });

        it('triggers action handler on touchstart', () => {
            const spy = vi.spyOn(game, 'showAnimationSettings');
            const btn = fakeButton('showAnimationSettings');
            const handlers = mockElements.startScreen.getListeners();
            handlers.touchstart(fakeEvent('touchstart', btn));
            expect(spy).toHaveBeenCalled();
        });

        it('triggers action handler on touchend', () => {
            const spy = vi.spyOn(game, 'showAnimationSettings');
            const btn = fakeButton('showAnimationSettings');
            const handlers = mockElements.startScreen.getListeners();
            handlers.touchend(fakeEvent('touchend', btn));
            expect(spy).toHaveBeenCalled();
        });

        it('ignores synthetic click after a touchend', () => {
            const spy = vi.spyOn(game, 'startGameMode');
            const btn = fakeButton('startGameMode');
            const handlers = mockElements.startScreen.getListeners();
            handlers.touchend(fakeEvent('touchend', btn));
            expect(spy).toHaveBeenCalledTimes(1);
            handlers.click(fakeEvent('click', btn));
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('does nothing when target has no data-action ancestor', () => {
            const spy = vi.spyOn(game, 'startGameMode');
            const unrelated = {
                dataset: {},
                closest: vi.fn(() => null),
            };
            const handlers = mockElements.startScreen.getListeners();
            handlers.click(fakeEvent('click', unrelated));
            expect(spy).not.toHaveBeenCalled();
        });

        it('passes data-param to the action handler', () => {
            const spy = vi.spyOn(game, 'startAnimationMode');
            const btn = fakeButton('startAnimationMode', '30min');
            const handlers = mockElements.animationScreen.getListeners();
            handlers.click(fakeEvent('click', btn));
            expect(spy).toHaveBeenCalledWith('30min');
        });
    });

    // ---- Debug logging ----

    describe('debug logging', () => {
        beforeEach(() => {
            game = new Game();
        });

        it('writes to debug panel when __CAT_DEBUG__ is true', () => {
            global.window.__CAT_DEBUG__ = true;
            game._debugLog('test message');
            expect(mockElements.debugLog.style.display).toBe('block');
            expect(mockElements.debugLog.appendChild).toHaveBeenCalled();
        });

        it('writes to debug panel by default when __CAT_DEBUG__ is undefined', () => {
            game._debugLog('test message');
            expect(mockElements.debugLog.style.display).toBe('block');
            expect(mockElements.debugLog.appendChild).toHaveBeenCalled();
        });

        it('does not write to debug panel when __CAT_DEBUG__ is false', () => {
            global.window.__CAT_DEBUG__ = false;
            mockElements.debugLog.appendChild.mockClear();
            game._debugLog('test message');
            expect(mockElements.debugLog.appendChild).not.toHaveBeenCalled();
        });
    });
});
