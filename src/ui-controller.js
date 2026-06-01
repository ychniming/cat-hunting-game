class UIController {
    constructor() {
        this.elements = {
            startScreen: document.getElementById('startScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            animationScreen: document.getElementById('animationScreen'),
            ui: document.getElementById('ui'),
            modeSwitch: document.getElementById('modeSwitch'),
            score: document.getElementById('score'),
            time: document.getElementById('time'),
            comboDisplay: document.getElementById('comboDisplay'),
            finalScore: document.getElementById('finalScore'),
            maxCombo: document.getElementById('maxCombo')
        };
    }

    _safeSetDisplay(key, value) {
        const el = this.elements[key];
        if (el) el.style.display = value;
    }

    _safeSetText(key, value) {
        const el = this.elements[key];
        if (el) el.textContent = value;
    }

    _safeAddClass(key, cls) {
        const el = this.elements[key];
        if (el) el.classList.add(cls);
    }

    _safeRemoveClass(key, cls) {
        const el = this.elements[key];
        if (el) el.classList.remove(cls);
    }

    showScreen(name) {
        this._safeSetDisplay('startScreen', 'none');
        this._safeSetDisplay('gameOverScreen', 'none');
        this._safeSetDisplay('animationScreen', 'none');
        this._safeSetDisplay('ui', 'none');
        this._safeSetDisplay('modeSwitch', 'none');

        switch(name) {
            case 'menu':
                this._safeSetDisplay('startScreen', 'flex');
                break;
            case 'game':
                this._safeSetDisplay('ui', 'flex');
                this._safeSetDisplay('modeSwitch', 'block');
                break;
            case 'animation':
                this._safeSetDisplay('modeSwitch', 'block');
                break;
            case 'animationSettings':
                this._safeSetDisplay('animationScreen', 'flex');
                break;
            case 'gameOver':
                this._safeSetDisplay('gameOverScreen', 'flex');
                break;
        }
    }

    updateScore(score) {
        this._safeSetText('score', score);
    }

    updateTimer(time) {
        this._safeSetText('time', time);
    }

    showCombo(combo) {
        if (combo >= 2) {
            this._safeSetText('comboDisplay', `${combo} 连击!`);
            this._safeAddClass('comboDisplay', 'show');
        }
    }

    hideCombo() {
        this._safeRemoveClass('comboDisplay', 'show');
    }

    showGameOver(score, maxCombo) {
        this._safeSetText('finalScore', score);
        this._safeSetText('maxCombo', maxCombo);
        this.showScreen('gameOver');
    }
}

export { UIController };
