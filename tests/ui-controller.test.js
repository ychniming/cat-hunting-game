import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UIController } from '../src/ui-controller.js';

function createMockElement() {
    return {
        style: { display: '' },
        textContent: '',
        classList: {
            _classes: new Set(),
            add(cls) { this._classes.add(cls); },
            remove(cls) { this._classes.delete(cls); },
            contains(cls) { return this._classes.has(cls); }
        }
    };
}

describe('UIController', () => {
    let mockElements;
    let origGetById;

    beforeEach(() => {
        mockElements = {};
        const ids = [
            'startScreen', 'gameOverScreen', 'animationScreen',
            'ui', 'modeSwitch', 'score', 'time',
            'comboDisplay', 'finalScore', 'maxCombo'
        ];
        for (const id of ids) {
            mockElements[id] = createMockElement();
        }

        origGetById = globalThis.document?.getElementById;
        if (!globalThis.document) {
            globalThis.document = { getElementById: null };
        }
        globalThis.document.getElementById = (id) => mockElements[id] || null;
    });

    afterEach(() => {
        if (origGetById) {
            globalThis.document.getElementById = origGetById;
        } else {
            delete globalThis.document;
        }
    });

    describe('showScreen', () => {
        it('shows startScreen for menu', () => {
            const controller = new UIController();
            controller.showScreen('menu');
            expect(mockElements.startScreen.style.display).toBe('flex');
        });

        it('shows ui and modeSwitch for game', () => {
            const controller = new UIController();
            controller.showScreen('game');
            expect(mockElements.ui.style.display).toBe('flex');
            expect(mockElements.modeSwitch.style.display).toBe('block');
        });

        it('shows modeSwitch for animation', () => {
            const controller = new UIController();
            controller.showScreen('animation');
            expect(mockElements.modeSwitch.style.display).toBe('block');
        });

        it('shows animationScreen for animationSettings', () => {
            const controller = new UIController();
            controller.showScreen('animationSettings');
            expect(mockElements.animationScreen.style.display).toBe('flex');
        });

        it('shows gameOverScreen for gameOver', () => {
            const controller = new UIController();
            controller.showScreen('gameOver');
            expect(mockElements.gameOverScreen.style.display).toBe('flex');
        });

        it('hides all screens before showing one', () => {
            const controller = new UIController();
            controller.showScreen('menu');
            controller.showScreen('game');
            expect(mockElements.startScreen.style.display).toBe('none');
            expect(mockElements.ui.style.display).toBe('flex');
        });
    });

    describe('updateScore', () => {
        it('updates score text', () => {
            const controller = new UIController();
            controller.updateScore(42);
            expect(mockElements.score.textContent).toBe(42);
        });
    });

    describe('updateTimer', () => {
        it('updates timer text', () => {
            const controller = new UIController();
            controller.updateTimer(30);
            expect(mockElements.time.textContent).toBe(30);
        });
    });

    describe('showCombo', () => {
        it('shows combo text when combo >= 2', () => {
            const controller = new UIController();
            controller.showCombo(3);
            expect(mockElements.comboDisplay.textContent).toContain('3');
            expect(mockElements.comboDisplay.classList.contains('show')).toBe(true);
        });

        it('does not show combo when combo < 2', () => {
            const controller = new UIController();
            controller.showCombo(1);
            expect(mockElements.comboDisplay.classList.contains('show')).toBe(false);
        });
    });

    describe('hideCombo', () => {
        it('removes show class', () => {
            const controller = new UIController();
            controller.showCombo(3);
            controller.hideCombo();
            expect(mockElements.comboDisplay.classList.contains('show')).toBe(false);
        });
    });

    describe('showGameOver', () => {
        it('updates final score and max combo', () => {
            const controller = new UIController();
            controller.showGameOver(100, 5);
            expect(mockElements.finalScore.textContent).toBe(100);
            expect(mockElements.maxCombo.textContent).toBe(5);
            expect(mockElements.gameOverScreen.style.display).toBe('flex');
        });
    });

    describe('null safety', () => {
        it('showScreen does not throw when element is null', () => {
            mockElements.startScreen = null;
            const controller = new UIController();
            expect(() => controller.showScreen('menu')).not.toThrow();
        });

        it('updateScore does not throw when score element is null', () => {
            mockElements.score = null;
            const controller = new UIController();
            expect(() => controller.updateScore(42)).not.toThrow();
        });

        it('updateTimer does not throw when time element is null', () => {
            mockElements.time = null;
            const controller = new UIController();
            expect(() => controller.updateTimer(30)).not.toThrow();
        });

        it('showCombo does not throw when comboDisplay is null', () => {
            mockElements.comboDisplay = null;
            const controller = new UIController();
            expect(() => controller.showCombo(3)).not.toThrow();
        });

        it('hideCombo does not throw when comboDisplay is null', () => {
            mockElements.comboDisplay = null;
            const controller = new UIController();
            expect(() => controller.hideCombo()).not.toThrow();
        });

        it('showGameOver does not throw when finalScore is null', () => {
            mockElements.finalScore = null;
            const controller = new UIController();
            expect(() => controller.showGameOver(100, 5)).not.toThrow();
        });
    });
});
