# Issue #5: Game 类职责分离

## What to build

将 Game 类拆分为 GameMode（游戏模式逻辑）、AnimationMode（动画模式逻辑）、UIController（DOM 操作封装）、InputHandler（输入处理）。Game 退化为薄编排层，组合以上模块。这是重构的核心切片，解决 God Class 问题。

## Acceptance criteria

- [ ] `src/game-mode.js` 导出 GameMode 类，封装游戏模式生成、计分、连击逻辑
- [ ] `src/animation-mode.js` 导出 AnimationMode 类，封装动画模式生物生命周期和音效触发
- [ ] `src/ui-controller.js` 导出 UIController 类，封装所有 DOM 操作
- [ ] `src/input-handler.js` 导出 InputHandler 类，封装鼠标/触摸事件
- [ ] `src/game.js` 仅做编排（组合模块 + 驱动游戏循环）
- [ ] GameMode 接口：start(), stop(), update(), handleInput(x,y), getState(), isOver()
- [ ] AnimationMode 接口：start(duration), stop(), update(), getState(), isExpired()
- [ ] UIController 接口：showScreen(name), updateScore(score), updateTimer(time), showCombo(combo), hideCombo()
- [ ] 每个模块的单元测试通过
- [ ] 游戏在浏览器中运行行为不变

## Blocked by

- Issue #2 (CreatureRenderer)
- Issue #3 (生物/粒子模块提取)
- Issue #4 (SoundManager 提取)

## Type

HITL (需要确认接口设计)
