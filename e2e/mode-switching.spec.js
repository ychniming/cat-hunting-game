import { test, expect } from '@playwright/test';
import { MenuPage } from './pages/menu-page';
import { AnimationSettingsPage } from './pages/animation-settings-page';
import { GamePage } from './pages/game-page';
import { AnimationPage } from './pages/animation-page';

test.describe('模式切换', () => {
    let menuPage, animSettings, gamePage, animPage;

    test.beforeEach(async ({ page }) => {
        menuPage = new MenuPage(page);
        animSettings = new AnimationSettingsPage(page);
        gamePage = new GamePage(page);
        animPage = new AnimationPage(page);
        await menuPage.goto();
    });

    test('从游戏模式返回菜单', async () => {
        await menuPage.startGameMode();
        await expect(gamePage.ui).toBeVisible();
        await gamePage.goBackToMenu();
        await expect(menuPage.startScreen).toBeVisible();
    });

    test('从动画模式返回菜单', async () => {
        await menuPage.showAnimationSettings();
        await animSettings.startInfinite();
        await expect(animPage.modeSwitch).toBeVisible();
        await animPage.goBackToMenu();
        await expect(menuPage.startScreen).toBeVisible();
    });

    test('游戏模式返回菜单后可重新进入游戏', async () => {
        await menuPage.startGameMode();
        await gamePage.goBackToMenu();
        await menuPage.startGameMode();
        await expect(gamePage.ui).toBeVisible();
        const timer = await gamePage.getTimer();
        expect(timer).toBe('60');
    });

    test('动画模式返回菜单后可进入游戏模式', async () => {
        await menuPage.showAnimationSettings();
        await animSettings.startInfinite();
        await animPage.goBackToMenu();
        await menuPage.startGameMode();
        await expect(gamePage.ui).toBeVisible();
    });

    test('游戏模式返回菜单后可进入动画模式', async () => {
        await menuPage.startGameMode();
        await gamePage.goBackToMenu();
        await menuPage.showAnimationSettings();
        await expect(animSettings.screen).toBeVisible();
    });

    test('动画设置返回后可进入游戏模式', async () => {
        await menuPage.showAnimationSettings();
        await animSettings.goBack();
        await menuPage.startGameMode();
        await expect(gamePage.ui).toBeVisible();
    });

    test('快速切换模式不会崩溃', async () => {
        await menuPage.startGameMode();
        await gamePage.goBackToMenu();
        await menuPage.showAnimationSettings();
        await animSettings.startInfinite();
        await animPage.goBackToMenu();
        await menuPage.startGameMode();
        await expect(gamePage.ui).toBeVisible();
    });

    test('多次切换模式后菜单仍然正常', async () => {
        for (let i = 0; i < 3; i++) {
            await menuPage.startGameMode();
            await gamePage.goBackToMenu();
        }
        await expect(menuPage.startScreen).toBeVisible();
        const title = await menuPage.getTitleText();
        expect(title).toContain('猫咪游戏');
    });
});
