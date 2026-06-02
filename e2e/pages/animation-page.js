export class AnimationPage {
    constructor(page) {
        this.page = page;
        this.canvas = page.locator('#gameCanvas');
        this.modeSwitch = page.locator('#modeSwitch');
        this.backToMenuBtn = page.locator('[data-action="switchMode"]');
        this.startScreen = page.locator('#startScreen');
        this.gameOverScreen = page.locator('#gameOverScreen');
        this.animationScreen = page.locator('#animationScreen');
    }

    async isCanvasVisible() {
        return await this.canvas.isVisible();
    }

    async isModeSwitchVisible() {
        return await this.modeSwitch.isVisible();
    }

    async isNoOverlayVisible() {
        const startVisible = await this.startScreen.isVisible();
        const gameOverVisible = await this.gameOverScreen.isVisible();
        const animSettingsVisible = await this.animationScreen.isVisible();
        return !startVisible && !gameOverVisible && !animSettingsVisible;
    }

    async goBackToMenu() {
        await this.backToMenuBtn.click();
    }

    async waitForCreatureOnCanvas(timeout = 10000) {
        await this.page.waitForFunction(
            () => {
                const canvas = document.querySelector('#gameCanvas');
                if (!canvas) return false;
                const ctx = canvas.getContext('2d');
                const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                const bgR = 245, bgG = 240, bgB = 232;
                let nonBgPixels = 0;
                for (let i = 0; i < data.length; i += 16) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    if (Math.abs(r - bgR) > 10 || Math.abs(g - bgG) > 10 || Math.abs(b - bgB) > 10) {
                        nonBgPixels++;
                    }
                }
                return nonBgPixels > 20;
            },
            undefined,
            { timeout }
        );
    }
}
