import { test, expect } from '@playwright/test';
import { MenuPage } from './pages/menu-page';
import { AnimationSettingsPage } from './pages/animation-settings-page';

test.describe('菜单导航', () => {
    let menuPage;

    test.beforeEach(async ({ page }) => {
        menuPage = new MenuPage(page);
        await menuPage.goto();
    });

    test('页面加载后显示主菜单', async () => {
        await expect(menuPage.startScreen).toBeVisible();
    });

    test('主菜单标题正确显示', async () => {
        const title = await menuPage.getTitleText();
        expect(title).toContain('猫咪游戏');
    });

    test('主菜单包含游戏模式按钮', async () => {
        await expect(menuPage.gameModeBtn).toBeVisible();
        const text = await menuPage.gameModeBtn.textContent();
        expect(text).toContain('游戏模式');
    });

    test('主菜单包含动画模式按钮', async () => {
        await expect(menuPage.animationModeBtn).toBeVisible();
        const text = await menuPage.animationModeBtn.textContent();
        expect(text).toContain('动画模式');
    });

    test('点击动画模式按钮显示动画设置界面', async ({ page }) => {
        const animSettings = new AnimationSettingsPage(page);
        await menuPage.showAnimationSettings();
        await expect(animSettings.screen).toBeVisible();
    });

    test('动画设置界面有返回按钮', async ({ page }) => {
        const animSettings = new AnimationSettingsPage(page);
        await menuPage.showAnimationSettings();
        await expect(animSettings.backBtn).toBeVisible();
    });

    test('从动画设置返回主菜单', async ({ page }) => {
        const animSettings = new AnimationSettingsPage(page);
        await menuPage.showAnimationSettings();
        await animSettings.goBack();
        await expect(menuPage.startScreen).toBeVisible();
    });

    test('动画设置界面显示三个时长选项', async ({ page }) => {
        const animSettings = new AnimationSettingsPage(page);
        await menuPage.showAnimationSettings();
        await expect(animSettings.thirtyMinBtn).toBeVisible();
        await expect(animSettings.oneHourBtn).toBeVisible();
        await expect(animSettings.infiniteBtn).toBeVisible();
    });

    test('游戏画布始终存在', async ({ page }) => {
        const canvas = page.locator('#gameCanvas');
        await expect(canvas).toBeAttached();
    });

    test('初始状态游戏UI隐藏', async ({ page }) => {
        const ui = page.locator('#ui');
        await expect(ui).toBeHidden();
    });
});
