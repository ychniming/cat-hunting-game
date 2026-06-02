export class GameOverPage {
    constructor(page) {
        this.page = page;
        this.screen = page.locator('#gameOverScreen');
        this.finalScore = page.locator('#finalScore');
        this.maxCombo = page.locator('#maxCombo');
        this.restartBtn = page.locator('[data-action="restart"]');
        this.menuBtn = page.locator('#gameOverScreen [data-action="showMenu"]');
        this.title = page.locator('#gameOverScreen h1');
    }

    async isVisible() {
        return await this.screen.isVisible();
    }

    async getFinalScore() {
        return await this.finalScore.textContent();
    }

    async getMaxCombo() {
        return await this.maxCombo.textContent();
    }

    async restart() {
        await this.restartBtn.click();
    }

    async goBackToMenu() {
        await this.menuBtn.click();
    }

    async getTitleText() {
        return await this.title.textContent();
    }
}
