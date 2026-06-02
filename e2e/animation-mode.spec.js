import { test, expect } from '@playwright/test';
import { MenuPage } from './pages/menu-page';
import { AnimationSettingsPage } from './pages/animation-settings-page';
import { AnimationPage } from './pages/animation-page';

test.describe('动画模式', () => {
    let menuPage, animSettings, animPage;

    test.beforeEach(async ({ page }) => {
        menuPage = new MenuPage(page);
        animSettings = new AnimationSettingsPage(page);
        animPage = new AnimationPage(page);
        await menuPage.goto();
        await menuPage.showAnimationSettings();
    });

    test('30分钟模式启动后隐藏设置界面', async () => {
        await animSettings.start30Min();
        await expect(animSettings.screen).toBeHidden();
    });

    test('1小时模式启动后隐藏设置界面', async () => {
        await animSettings.start1Hour();
        await expect(animSettings.screen).toBeHidden();
    });

    test('无限循环模式启动后隐藏设置界面', async () => {
        await animSettings.startInfinite();
        await expect(animSettings.screen).toBeHidden();
    });

    test('无限循环模式启动后显示模式切换按钮', async () => {
        await animSettings.startInfinite();
        await expect(animPage.modeSwitch).toBeVisible();
    });

    test('无限循环模式启动后主菜单隐藏', async () => {
        await animSettings.startInfinite();
        await expect(menuPage.startScreen).toBeHidden();
    });

    test('无限循环模式画布可见', async () => {
        await animSettings.startInfinite();
        await expect(animPage.canvas).toBeVisible();
    });

    test('无限循环模式下无覆盖层遮挡画布', async () => {
        await animSettings.startInfinite();
        const noOverlay = await animPage.isNoOverlayVisible();
        expect(noOverlay).toBe(true);
    });

    test('从动画模式返回菜单', async () => {
        await animSettings.startInfinite();
        await animPage.goBackToMenu();
        await expect(menuPage.startScreen).toBeVisible();
    });

    test('30分钟模式画布可见', async () => {
        await animSettings.start30Min();
        await expect(animPage.canvas).toBeVisible();
    });

    test('1小时模式画布可见', async () => {
        await animSettings.start1Hour();
        await expect(animPage.canvas).toBeVisible();
    });
});
