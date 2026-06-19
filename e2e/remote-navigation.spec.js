import { test, expect } from '@playwright/test';

test.describe('遥控器焦点导航', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('页面加载后主菜单第一个按钮自动获得焦点', async ({ page }) => {
        const firstBtn = page.locator('#startScreen .btn').first();
        await expect(firstBtn).toHaveClass(/focused/);
    });

    test('方向键下移动焦点到下一个按钮', async ({ page }) => {
        const buttons = page.locator('#startScreen .btn');
        await expect(buttons.nth(0)).toHaveClass(/focused/);

        await page.keyboard.press('ArrowDown');
        await expect(buttons.nth(1)).toHaveClass(/focused/);
        await expect(buttons.nth(0)).not.toHaveClass(/focused/);
    });

    test('方向键上移动焦点到上一个按钮', async ({ page }) => {
        const buttons = page.locator('#startScreen .btn');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowUp');
        await expect(buttons.nth(0)).toHaveClass(/focused/);
    });

    test('焦点在第一个元素按上不动', async ({ page }) => {
        const buttons = page.locator('#startScreen .btn');
        await page.keyboard.press('ArrowUp');
        await expect(buttons.nth(0)).toHaveClass(/focused/);
    });

    test('焦点在最后一个元素按下不动', async ({ page }) => {
        const buttons = page.locator('#startScreen .btn');
        const count = await buttons.count();
        // Navigate to last button
        for (let i = 0; i < count - 1; i++) {
            await page.keyboard.press('ArrowDown');
        }
        await page.keyboard.press('ArrowDown');
        await expect(buttons.nth(count - 1)).toHaveClass(/focused/);
    });

    test('Enter键触发当前焦点按钮操作 - 进入动画设置', async ({ page }) => {
        // First button is game mode, second is animation settings
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        const animScreen = page.locator('#animationScreen');
        await expect(animScreen).toBeVisible();
    });

    test('动画设置界面焦点自动落在第一个按钮', async ({ page }) => {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        const animButtons = page.locator('#animationScreen .btn');
        await expect(animButtons.nth(0)).toHaveClass(/focused/);
    });

    test('Escape键从动画设置返回主菜单', async ({ page }) => {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await expect(page.locator('#animationScreen')).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(page.locator('#startScreen')).toBeVisible();
    });

    test('返回后主菜单焦点自动落在第一个按钮', async ({ page }) => {
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        await page.keyboard.press('Escape');

        const buttons = page.locator('#startScreen .btn');
        await expect(buttons.nth(0)).toHaveClass(/focused/);
    });

    test('Enter键启动游戏模式', async ({ page }) => {
        await page.keyboard.press('Enter');
        const ui = page.locator('#ui');
        await expect(ui).toBeVisible();
    });

    test('游戏中Escape键返回菜单', async ({ page }) => {
        await page.keyboard.press('Enter');
        await expect(page.locator('#ui')).toBeVisible();

        await page.keyboard.press('Escape');
        await expect(page.locator('#startScreen')).toBeVisible();
    });

    test('焦点按钮显示橙色高亮边框', async ({ page }) => {
        const firstBtn = page.locator('#startScreen .btn').first();
        await expect(firstBtn).toHaveClass(/focused/);

        const borderColor = await firstBtn.evaluate((el) => {
            return window.getComputedStyle(el).borderColor;
        });
        // border-color should contain #ff6b35 components (255, 107, 53)
        expect(borderColor).toContain('255');
        expect(borderColor).toContain('107');
        expect(borderColor).toContain('53');
    });

    test('鼠标点击和键盘导航可混合使用', async ({ page }) => {
        // Click animation mode button to enter settings
        await page.locator('#startScreen .btn').nth(1).click();
        await expect(page.locator('#animationScreen')).toBeVisible();

        // Use keyboard Escape to go back to menu
        await page.keyboard.press('Escape');
        await expect(page.locator('#startScreen')).toBeVisible();

        // Keyboard focus should be on first button
        const buttons = page.locator('#startScreen .btn');
        await expect(buttons.nth(0)).toHaveClass(/focused/);
    });
});
