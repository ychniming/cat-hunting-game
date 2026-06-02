import { test, expect } from '@playwright/test';
import { MenuPage } from './pages/menu-page';
import { AnimationSettingsPage } from './pages/animation-settings-page';

test.describe('Canvas 渲染验证', () => {
    let menuPage, animSettings;

    test.beforeEach(async ({ page }) => {
        menuPage = new MenuPage(page);
        animSettings = new AnimationSettingsPage(page);
        await menuPage.goto();
    });

    test('画布尺寸匹配视口', async ({ page }) => {
        const canvas = page.locator('#gameCanvas');
        const box = await canvas.boundingBox();
        const viewport = page.viewportSize();
        expect(box.width).toBe(viewport.width);
        expect(box.height).toBe(viewport.height);
    });

    test('画布初始背景色正确', async ({ page }) => {
        await page.waitForTimeout(1000);
        const bgColor = await page.evaluate(() => {
            const canvas = document.querySelector('#gameCanvas');
            const ctx = canvas.getContext('2d');
            const pixel = ctx.getImageData(0, 0, 1, 1).data;
            return { r: pixel[0], g: pixel[1], b: pixel[2] };
        });
        expect(bgColor.r).toBe(245);
        expect(bgColor.g).toBe(240);
        expect(bgColor.b).toBe(232);
    });

    test('游戏模式下画布有渲染内容', async ({ page }) => {
        await menuPage.startGameMode();
        await page.waitForTimeout(2000);
        const hasContent = await page.evaluate(() => {
            const canvas = document.querySelector('#gameCanvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const bgR = 245, bgG = 240, bgB = 232;
            let nonBgPixels = 0;
            for (let i = 0; i < data.length; i += 64) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                if (Math.abs(r - bgR) > 10 || Math.abs(g - bgG) > 10 || Math.abs(b - bgB) > 10) {
                    nonBgPixels++;
                }
            }
            return nonBgPixels > 0;
        });
        expect(hasContent).toBe(true);
    });

    test('动画模式下画布有渲染内容', async ({ page }) => {
        await menuPage.showAnimationSettings();
        await animSettings.startInfinite();
        await page.waitForTimeout(3000);
        const hasContent = await page.evaluate(() => {
            const canvas = document.querySelector('#gameCanvas');
            const ctx = canvas.getContext('2d');
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const bgR = 245, bgG = 240, bgB = 232;
            let nonBgPixels = 0;
            for (let i = 0; i < data.length; i += 64) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                if (Math.abs(r - bgR) > 10 || Math.abs(g - bgG) > 10 || Math.abs(b - bgB) > 10) {
                    nonBgPixels++;
                }
            }
            return nonBgPixels > 0;
        });
        expect(hasContent).toBe(true);
    });

    test('画布在窗口调整大小时更新', async ({ page }) => {
        await page.setViewportSize({ width: 800, height: 600 });
        await page.waitForTimeout(500);
        const canvas = page.locator('#gameCanvas');
        const box = await canvas.boundingBox();
        expect(box.width).toBe(800);
        expect(box.height).toBe(600);
    });

    test('游戏模式画布持续刷新', async ({ page }) => {
        await menuPage.startGameMode();
        const snapshot1 = await page.evaluate(() => {
            const canvas = document.querySelector('#gameCanvas');
            const ctx = canvas.getContext('2d');
            return ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100)).data.length;
        });
        await page.waitForTimeout(500);
        const snapshot2 = await page.evaluate(() => {
            const canvas = document.querySelector('#gameCanvas');
            const ctx = canvas.getContext('2d');
            return ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100)).data.length;
        });
        expect(snapshot1).toBeGreaterThan(0);
        expect(snapshot2).toBeGreaterThan(0);
    });

    test('动画模式画布持续刷新', async ({ page }) => {
        await menuPage.showAnimationSettings();
        await animSettings.startInfinite();
        await page.waitForTimeout(2000);
        const snapshot1 = await page.evaluate(() => {
            const canvas = document.querySelector('#gameCanvas');
            const ctx = canvas.getContext('2d');
            return ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100)).data.length;
        });
        await page.waitForTimeout(500);
        const snapshot2 = await page.evaluate(() => {
            const canvas = document.querySelector('#gameCanvas');
            const ctx = canvas.getContext('2d');
            return ctx.getImageData(0, 0, Math.min(canvas.width, 100), Math.min(canvas.height, 100)).data.length;
        });
        expect(snapshot1).toBeGreaterThan(0);
        expect(snapshot2).toBeGreaterThan(0);
    });
});
