import { CONFIG } from './config.js';
import { GameMode } from './game-mode.js';
import { AnimationMode } from './animation-mode.js';
import { SoundManager } from './sound-manager.js';
import { UIController } from './ui-controller.js';
import { InputHandler } from './input-handler.js';
import { FocusNavigator } from './focus-navigator.js';
import { renderCreature } from './creature-renderer.js';

class Game {
    constructor(config = CONFIG) {
        this.config = config;
        this.canvas = document.getElementById('gameCanvas');
        this.canvas._gameInstance = this;
        this.ctx = this.canvas.getContext('2d');
        this.mode = 'menu';
        this._currentScreen = 'menu';

        this.gameMode = new GameMode(this.canvas.width, this.canvas.height);
        this.animationMode = new AnimationMode(this.canvas.width, this.canvas.height);
        this.soundManager = new SoundManager();

        this.focusNavigator = new FocusNavigator(() => this._handleBack());
        this._registerFocusGroups();

        this.ui = new UIController((screenName) => this._onScreenChange(screenName));
        this.inputHandler = new InputHandler(this.canvas, (x, y) => this.handleInput(x, y));

        this._soundEventMap = {
            startCrawl: () => this.soundManager.startCrawlSound(),
            stopCrawl: () => this.soundManager.stopCrawlSound(),
            playPause: () => this.soundManager.playPauseSound()
        };

        this._actionHandlers = {
            startGameMode: () => this.startGameMode(),
            startAnimationMode: (param) => this.startAnimationMode(param),
            showAnimationSettings: () => this.showAnimationSettings(),
            restart: () => this.restart(),
            switchMode: () => this.switchMode(),
            showMenu: () => this.showMenu()
        };

        // Bind button events directly to their container elements. Document-level
        // event delegation is unreliable on some Android WebViews because touch/click
        // events may not bubble all the way to document, or may be suppressed by
        // global CSS such as `touch-action: none`.
        this._touchHandled = false;

        this._handleAction = (e) => {
            // When a touch handler fires, ignore the subsequent synthetic click
            // so the same press does not trigger the action twice.
            if (e.type === 'click' && this._touchHandled) {
                this._touchHandled = false;
                return;
            }

            const target = e.target || e.srcElement;
            if (!target) return;

            const btn = target.closest ? target.closest('[data-action]') : null;
            if (!btn) return;

            if (e.type === 'touchend' || e.type === 'touchstart') {
                this._touchHandled = true;
                // Reset the guard after the synthetic click window has passed.
                if (this._touchGuardTimeout) clearTimeout(this._touchGuardTimeout);
                this._touchGuardTimeout = setTimeout(() => {
                    this._touchHandled = false;
                }, 350);
            }

            this._runAction(btn.dataset.action, btn.dataset.param, e.type);
        };

        this._bindButtons();
        this._setupGlobalButtonHandler();
        this._debugLog('game init');

        this._handleResize = () => this.resize();
        this.resize();
        window.addEventListener('resize', this._handleResize);

        this._rafId = null;
        this.loop = this.loop.bind(this);
        this._rafId = requestAnimationFrame(this.loop);

        // Activate initial focus group for the start screen
        this.focusNavigator.activateGroup('menu');
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gameMode.resize(this.canvas.width, this.canvas.height);
        this.animationMode.resize(this.canvas.width, this.canvas.height);
    }

    startGameMode() {
        this.mode = 'game';
        this.gameMode.start();
        this.soundManager.stopAll();
        this.ui.showScreen('game');
        this.ui.updateScore(0);
        this.ui.updateTimer(this.config.game.duration);
    }

    startAnimationMode(duration) {
        this.mode = 'animation';
        this.animationMode.start(duration);
        this.soundManager.startBackgroundMusic();
        this.ui.showScreen('animation');
    }

    restart() {
        if (this.mode === 'game' || this.mode === 'gameOver') {
            this.startGameMode();
        }
    }

    switchMode() {
        this.soundManager.stopAll();
        this.showMenu();
    }

    showMenu() {
        this.mode = 'menu';
        this.gameMode.stop();
        this.animationMode.stop();
        this.soundManager.stopAll();
        this.ui.showScreen('menu');
    }

    showAnimationSettings() {
        this.ui.showScreen('animationSettings');
    }

    _registerFocusGroups() {
        const queryBtns = (id) => {
            const el = document.getElementById(id);
            return (el && el.querySelectorAll) ? Array.prototype.slice.call(el.querySelectorAll('.btn')) : [];
        };

        this.focusNavigator.registerGroup('menu', queryBtns('startScreen'));
        this.focusNavigator.registerGroup('animationSettings', queryBtns('animationScreen'));
        this.focusNavigator.registerGroup('gameOver', queryBtns('gameOverScreen'));
    }

    _bindButtons() {
        // Direct listeners on button containers are more reliable than document
        // delegation on Android WebViews. We listen to click, touchend and
        // touchstart so that remote controls (Enter/OK -> click) and touch
        // screens (touchstart is the most responsive and reliable) all work.
        const containerIds = ['startScreen', 'animationScreen', 'gameOverScreen', 'modeSwitch'];
        this._buttonContainers = [];
        for (var i = 0; i < containerIds.length; i++) {
            const id = containerIds[i];
            const el = document.getElementById(id);
            if (!el || !el.addEventListener) continue;
            this._buttonContainers.push(el);
            el.addEventListener('click', this._handleAction, false);
            el.addEventListener('touchstart', this._handleAction, { passive: true });
            el.addEventListener('touchend', this._handleAction, false);
        }
    }

    _runAction(action, param, source) {
        const handler = this._actionHandlers[action];
        if (!handler) return;

        if (typeof console !== 'undefined' && console.log) {
            console.log('CatHuntingGame: button action [' + action + '] from ' + source);
        }
        this._debugLog('btn:' + action + ':' + source);

        handler(param);
    }

    _setupGlobalButtonHandler() {
        // Expose a global helper used by inline onclick attributes as a fallback
        // when addEventListener-based event handling fails on a particular WebView.
        if (typeof window !== 'undefined') {
            window._catGame = this;
            window._catHandleBtnClick = (action, param, event) => {
                if (event) {
                    event.preventDefault ? event.preventDefault() : (event.returnValue = false);
                    event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
                }
                this._runAction(action, param, 'inline');
                return false;
            };
        }
    }

    _isDebugEnabled() {
        if (typeof window === 'undefined') return false;
        if (typeof window.__CAT_DEBUG__ !== 'undefined') return window.__CAT_DEBUG__;
        return true;
    }

    _debugLog(message) {
        if (!this._isDebugEnabled()) return;
        if (typeof document === 'undefined') return;
        const el = document.getElementById('debugLog');
        if (!el) return;
        el.style.display = 'block';
        const line = document.createElement('div');
        line.textContent = new Date().toLocaleTimeString() + ' ' + message;
        el.appendChild(line);
        if (el.childNodes.length > 30) {
            el.removeChild(el.firstChild);
        }
    }

    _onScreenChange(screenName) {
        this._currentScreen = screenName;
        if (screenName === 'game' || screenName === 'animation') {
            this.focusNavigator.clearFocus();
        } else {
            this.focusNavigator.activateGroup(screenName);
        }
    }

    _handleBack() {
        if (this._currentScreen !== 'menu') {
            this.showMenu();
        }
    }

    handleInput(x, y) {
        if (this.mode !== 'game') return;

        const result = this.gameMode.handleInput(x, y);

        if (result.hit) {
            this.ui.showCombo(result.combo);
            this.soundManager.playCatchSound(result.combo);

            if (this._comboTimeout) clearTimeout(this._comboTimeout);
            this._comboTimeout = setTimeout(() => this.ui.hideCombo(), this.config.visual.comboDisplayDuration);
        } else {
            this.ui.hideCombo();
            if (this._comboTimeout) clearTimeout(this._comboTimeout);
            this._comboTimeout = null;
        }

        this.ui.updateScore(result.score);
        this.ui.updateTimer(this.gameMode.time);
    }

    loop() {
        if (this._destroyed) return;
        this.ctx.fillStyle = '#f5f0e8';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.mode === 'game' || this.mode === 'gameOver') {
            this._renderGameFrame();
        } else if (this.mode === 'animation') {
            this._renderAnimationFrame();
        }

        this._rafId = requestAnimationFrame(this.loop);
    }

    _renderGameFrame() {
        if (this.mode === 'game') {
            this.gameMode.update();

            if (this.gameMode.isOver()) {
                this.ui.showGameOver(this.gameMode.score, this.gameMode.maxCombo);
                this.mode = 'gameOver';
            }

            if (this.gameMode.time !== this._lastTime) {
                this.ui.updateTimer(this.gameMode.time);
                this._lastTime = this.gameMode.time;
            }
        }

        const state = this.gameMode.getState();
        for (const creature of state.creatures) {
            renderCreature(this.ctx, creature.getVisualProps());
        }
        for (const particle of state.particles) {
            particle.draw(this.ctx);
        }
    }

    _renderAnimationFrame() {
        const result = this.animationMode.update();

        for (const event of result.soundEvents) {
            const handler = this._soundEventMap[event];
            if (handler) {
                handler();
            } else {
                console.warn(`Unknown sound event: ${event}`);
            }
        }

        if (result.expired) {
            this.showMenu();
        }

        const animState = this.animationMode.getState();
        if (animState.creature) {
            renderCreature(this.ctx, animState.creature.getVisualProps());
        }
    }

    destroy() {
        this._destroyed = true;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        window.removeEventListener('resize', this._handleResize);
        if (this._buttonContainers) {
            for (var i = 0; i < this._buttonContainers.length; i++) {
                var el = this._buttonContainers[i];
                if (el && el.removeEventListener) {
                    el.removeEventListener('click', this._handleAction, false);
                    el.removeEventListener('touchstart', this._handleAction, { passive: true });
                    el.removeEventListener('touchend', this._handleAction, false);
                }
            }
            this._buttonContainers = [];
        }
        if (typeof window !== 'undefined') {
            window._catGame = null;
            window._catHandleBtnClick = null;
        }
        this.inputHandler.destroy();
        this.focusNavigator.destroy();
        if (this._comboTimeout) {
            clearTimeout(this._comboTimeout);
            this._comboTimeout = null;
        }
        if (this._touchGuardTimeout) {
            clearTimeout(this._touchGuardTimeout);
            this._touchGuardTimeout = null;
        }
        this.soundManager.destroy();
        this.gameMode.stop();
        this.animationMode.stop();
        this.canvas._gameInstance = null;
    }
}

export { Game };
