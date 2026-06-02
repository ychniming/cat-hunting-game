export class AnimationSettingsPage {
    constructor(page) {
        this.page = page;
        this.screen = page.locator('#animationScreen');
        this.thirtyMinBtn = page.locator('[data-action="startAnimationMode"][data-param="30min"]');
        this.oneHourBtn = page.locator('[data-action="startAnimationMode"][data-param="1hour"]');
        this.infiniteBtn = page.locator('[data-action="startAnimationMode"][data-param="infinite"]');
        this.backBtn = page.locator('#animationScreen [data-action="showMenu"]');
        this.title = page.locator('#animationScreen h2');
    }

    async isVisible() {
        return await this.screen.isVisible();
    }

    async start30Min() {
        await this.thirtyMinBtn.click();
    }

    async start1Hour() {
        await this.oneHourBtn.click();
    }

    async startInfinite() {
        await this.infiniteBtn.click();
    }

    async goBack() {
        await this.backBtn.click();
    }

    async getTitleText() {
        return await this.title.textContent();
    }
}
