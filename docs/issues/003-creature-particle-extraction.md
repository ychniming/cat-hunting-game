# Issue #3: 生物/粒子模块提取

## What to build

将 Creature、AnimationCreature、Particle 类各自移到独立文件，通过 import/export 接线。每个类保持原有接口不变，仅改变文件位置和模块导入方式。

## Acceptance criteria

- [ ] `src/creature.js` 导出 Creature 类
- [ ] `src/animation-creature.js` 导出 AnimationCreature 类
- [ ] `src/particle.js` 导出 Particle 类
- [ ] 每个模块的单元测试通过
- [ ] 游戏在浏览器中运行行为不变

## Blocked by

- Issue #1 (ES Module 基础设施)

## Type

AFK
