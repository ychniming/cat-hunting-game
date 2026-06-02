export class MenuPage {
    constructor(page) {
        this.page = page;
        this.startScreen = page.locator('#startScreen');
        this.gameModeBtn = page.locator('[data-action="startGameMode"]');
        this.animationModeBtn = page.locator('[data-action="showAnimationSettings"]');
        this.title = page.locator('#startScreen h1');
    }

    async goto() {
        await this.page.goto('/');
    }

    async isVisible() {
        return await this.startScreen.isVisible();
    }

    async startGameMode() {
        await this.gameModeBtn.click();
    }

    async showAnimationSettings() {
        await this.animationModeBtn.click();
    }

    async getTitleText() {
        return await this.title.textContent();
    }
}
