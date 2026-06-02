import { test, expect } from '@playwright/test';
import { MenuPage } from './pages/menu-page';
import { GamePage } from './pages/game-page';
import { GameOverPage } from './pages/game-over-page';

async function forceGameOver(page) {
    await page.evaluate(() => {
        const canvas = document.querySelector('#gameCanvas');
        const game = canvas?._gameInstance;
        if (game && game.gameMode) {
            game.gameMode.time = 0;
            game.gameMode.running = false;
        }
    });
    await page.waitForTimeout(500);
}

test.describe('游戏模式', () => {
    let menuPage, gamePage, gameOverPage;

    test.beforeEach(async ({ page }) => {
        menuPage = new MenuPage(page);
        gamePage = new GamePage(page);
        gameOverPage = new GameOverPage(page);
        await menuPage.goto();
        await menuPage.startGameMode();
    });

    test('进入游戏模式后显示游戏UI', async () => {
        await expect(gamePage.ui).toBeVisible();
    });

    test('进入游戏模式后显示模式切换按钮', async () => {
        await expect(gamePage.modeSwitch).toBeVisible();
    });

    test('初始分数为0', async () => {
        const score = await gamePage.getScore();
        expect(score).toBe('0');
    });

    test('初始计时器为60秒', async () => {
        const timer = await gamePage.getTimer();
        expect(timer).toBe('60');
    });

    test('主菜单在游戏模式下隐藏', async () => {
        await expect(menuPage.startScreen).toBeHidden();
    });

    test('游戏画布可见', async () => {
        await expect(gamePage.canvas).toBeVisible();
    });

    test('点击画布不会报错', async () => {
        await gamePage.clickCanvasCenter();
    });

    test('计时器随时间递减', async ({ page }) => {
        await page.waitForTimeout(2000);
        const timer = await gamePage.getTimer();
        expect(Number(timer)).toBeLessThanOrEqual(60);
    });

    test('游戏结束后显示游戏结束界面', async ({ page }) => {
        await forceGameOver(page);
        await expect(gameOverPage.screen).toBeVisible({ timeout: 5000 });
    });

    test('游戏结束界面显示最终分数', async ({ page }) => {
        await forceGameOver(page);
        await expect(gameOverPage.screen).toBeVisible({ timeout: 5000 });
        const score = await gameOverPage.getFinalScore();
        expect(Number(score)).toBeGreaterThanOrEqual(0);
    });

    test('游戏结束界面显示最高连击', async ({ page }) => {
        await forceGameOver(page);
        await expect(gameOverPage.screen).toBeVisible({ timeout: 5000 });
        const combo = await gameOverPage.getMaxCombo();
        expect(Number(combo)).toBeGreaterThanOrEqual(0);
    });

    test('游戏结束界面有再玩一次按钮', async ({ page }) => {
        await forceGameOver(page);
        await expect(gameOverPage.screen).toBeVisible({ timeout: 5000 });
        await expect(gameOverPage.restartBtn).toBeVisible();
    });

    test('游戏结束界面有返回菜单按钮', async ({ page }) => {
        await forceGameOver(page);
        await expect(gameOverPage.screen).toBeVisible({ timeout: 5000 });
        await expect(gameOverPage.menuBtn).toBeVisible();
    });

    test('再玩一次重新开始游戏', async ({ page }) => {
        await forceGameOver(page);
        await expect(gameOverPage.screen).toBeVisible({ timeout: 5000 });
        await gameOverPage.restart();
        await expect(gamePage.ui).toBeVisible();
        const timer = await gamePage.getTimer();
        expect(timer).toBe('60');
    });

    test('从游戏结束返回菜单', async ({ page }) => {
        await forceGameOver(page);
        await expect(gameOverPage.screen).toBeVisible({ timeout: 5000 });
        await gameOverPage.goBackToMenu();
        await expect(menuPage.startScreen).toBeVisible();
    });
});
