export class GamePage {
    constructor(page) {
        this.page = page;
        this.canvas = page.locator('#gameCanvas');
        this.ui = page.locator('#ui');
        this.scoreDisplay = page.locator('#score');
        this.timerDisplay = page.locator('#time');
        this.comboDisplay = page.locator('#comboDisplay');
        this.modeSwitch = page.locator('#modeSwitch');
        this.backToMenuBtn = page.locator('[data-action="switchMode"]');
    }

    async isUIVisible() {
        return await this.ui.isVisible();
    }

    async isCanvasVisible() {
        return await this.canvas.isVisible();
    }

    async getScore() {
        return await this.scoreDisplay.textContent();
    }

    async getTimer() {
        return await this.timerDisplay.textContent();
    }

    async isComboVisible() {
        const cls = await this.comboDisplay.getAttribute('class');
        return cls?.includes('show') ?? false;
    }

    async getComboText() {
        return await this.comboDisplay.textContent();
    }

    async isModeSwitchVisible() {
        return await this.modeSwitch.isVisible();
    }

    async clickCanvas(x, y) {
        await this.canvas.click({ position: { x, y } });
    }

    async clickCanvasCenter() {
        const box = await this.canvas.boundingBox();
        if (!box) return;
        await this.canvas.click({
            position: { x: box.width / 2, y: box.height / 2 },
        });
    }

    async goBackToMenu() {
        await this.backToMenuBtn.click();
    }

    async waitForScoreUpdate(expectedScore, timeout = 5000) {
        await this.page.waitForFunction(
            (sel, val) => document.querySelector(sel)?.textContent === val,
            '#score',
            String(expectedScore),
            { timeout }
        );
    }

    async waitForTimerChange(timeout = 5000) {
        const initial = await this.getTimer();
        await this.page.waitForFunction(
            (sel, prev) => document.querySelector(sel)?.textContent !== prev,
            '#time',
            initial,
            { timeout }
        );
    }
}
