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

    showScreen(name) {
        this.elements.startScreen.style.display = 'none';
        this.elements.gameOverScreen.style.display = 'none';
        this.elements.animationScreen.style.display = 'none';
        this.elements.ui.style.display = 'none';
        this.elements.modeSwitch.style.display = 'none';

        switch(name) {
            case 'menu':
                this.elements.startScreen.style.display = 'flex';
                break;
            case 'game':
                this.elements.ui.style.display = 'flex';
                this.elements.modeSwitch.style.display = 'block';
                break;
            case 'animation':
                this.elements.modeSwitch.style.display = 'block';
                break;
            case 'animationSettings':
                this.elements.animationScreen.style.display = 'flex';
                break;
            case 'gameOver':
                this.elements.gameOverScreen.style.display = 'flex';
                break;
        }
    }

    updateScore(score) {
        this.elements.score.textContent = score;
    }

    updateTimer(time) {
        this.elements.time.textContent = time;
    }

    showCombo(combo) {
        const display = this.elements.comboDisplay;
        if (combo >= 2) {
            display.textContent = `${combo} 连击!`;
            display.classList.add('show');
        }
    }

    hideCombo() {
        this.elements.comboDisplay.classList.remove('show');
    }

    showGameOver(score, maxCombo) {
        this.elements.finalScore.textContent = score;
        this.elements.maxCombo.textContent = maxCombo;
        this.showScreen('gameOver');
    }
}

export { UIController };
