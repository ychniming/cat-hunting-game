import { CONFIG } from './config.js';
import { GameMode } from './game-mode.js';
import { AnimationMode } from './animation-mode.js';
import { SoundManager } from './sound-manager.js';
import { UIController } from './ui-controller.js';
import { InputHandler } from './input-handler.js';
import { renderCreature } from './creature-renderer.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas._gameInstance = this;
        this.ctx = this.canvas.getContext('2d');
        this.mode = 'menu';

        this.gameMode = new GameMode(this.canvas.width, this.canvas.height);
        this.animationMode = new AnimationMode(this.canvas.width, this.canvas.height);
        this.soundManager = new SoundManager();
        this.ui = new UIController();
        this.inputHandler = new InputHandler(this.canvas, (x, y) => this.handleInput(x, y));

        this._actionHandlers = {
            startGameMode: () => this.startGameMode(),
            startAnimationMode: (param) => this.startAnimationMode(param),
            showAnimationSettings: () => this.showAnimationSettings(),
            restart: () => this.restart(),
            switchMode: () => this.switchMode(),
            showMenu: () => this.showMenu()
        };

        this._handleAction = (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;
            const param = btn.dataset.param;
            const handler = this._actionHandlers[action];
            if (handler) handler(param);
        };

        document.addEventListener('click', this._handleAction);

        this._handleResize = () => this.resize();
        this.resize();
        window.addEventListener('resize', this._handleResize);

        this._rafId = null;
        this.loop = this.loop.bind(this);
        this._rafId = requestAnimationFrame(this.loop);
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
        this.ui.updateTimer(CONFIG.game.duration);
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

    handleInput(x, y) {
        if (this.mode !== 'game') return;

        const result = this.gameMode.handleInput(x, y);

        if (result.hit) {
            this.ui.showCombo(result.combo);
            this.soundManager.playCatchSound(result.combo);

            if (this._comboTimeout) clearTimeout(this._comboTimeout);
            this._comboTimeout = setTimeout(() => this.ui.hideCombo(), CONFIG.visual.comboDisplayDuration);
        } else {
            this.ui.hideCombo();
            if (this._comboTimeout) {
                clearTimeout(this._comboTimeout);
                this._comboTimeout = null;
            }
        }

        this.ui.updateScore(result.score);
        this.ui.updateTimer(this.gameMode.time);
    }

    loop() {
        if (this._destroyed) return;
        this.ctx.fillStyle = '#f5f0e8';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.mode === 'game' || this.mode === 'gameOver') {
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
        } else if (this.mode === 'animation') {
            const result = this.animationMode.update();

            for (const event of result.soundEvents) {
                switch(event) {
                    case 'startCrawl':
                        this.soundManager.startCrawlSound();
                        break;
                    case 'stopCrawl':
                        this.soundManager.stopCrawlSound();
                        break;
                    case 'playPause':
                        this.soundManager.playPauseSound();
                        break;
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

        this._rafId = requestAnimationFrame(this.loop);
    }

    destroy() {
        this._destroyed = true;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        window.removeEventListener('resize', this._handleResize);
        document.removeEventListener('click', this._handleAction);
        this.inputHandler.destroy();
        if (this._comboTimeout) {
            clearTimeout(this._comboTimeout);
            this._comboTimeout = null;
        }
        this.soundManager.destroy();
        this.gameMode.stop();
        this.animationMode.stop();
    }
}

export { Game };
new Game();
