# Issue #2: CreatureRenderer 提取 + 渲染去重

## What to build

提取 Creature 和 AnimationCreature 共享的渲染逻辑为独立的 CreatureRenderer 模块。两种生物的 draw() 方法委托给 CreatureRenderer，消除 ADR 0002 承认的渲染代码重复。修改眼睛样式只需改一处。

## Acceptance criteria

- [ ] `src/creature-renderer.js` 导出 renderCreature(ctx, visualProps) 函数
- [ ] Creature.draw() 委托给 CreatureRenderer
- [ ] AnimationCreature.draw() 委托给 CreatureRenderer
- [ ] CreatureRenderer 测试覆盖渲染参数计算逻辑
- [ ] 渲染输出与重构前视觉一致
- [ ] 游戏在浏览器中运行行为不变

## Blocked by

- Issue #1 (ES Module 基础设施)

## Type

AFK
