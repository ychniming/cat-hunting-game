# Issue #6: AnimationCreature 状态机深化

## What to build

将 AnimationCreature 的 switch/case 状态机重构为显式状态对象 + 转换表。每个状态是独立对象，包含 enter()/update()/exit() 方法和允许的转换。这是 ADR 0005 状态机设计的自然深化。

## Acceptance criteria

- [ ] 定义 AnimationState 基类/接口：enter(), update(), exit(), transitions
- [ ] 实现 EnteringState, MovingState, PausingState, ExitingState
- [ ] 状态转换表集中定义，可一眼看出完整状态图
- [ ] AnimationCreature 只维护 currentState 引用，委托调用
- [ ] 状态转换测试覆盖所有路径（entering→moving, moving→pausing, pausing→moving, moving→exiting, pausing→exiting）
- [ ] 添加新状态只需创建状态对象 + 添加转换规则
- [ ] 游戏在浏览器中运行行为不变

## Blocked by

- Issue #3 (生物/粒子模块提取)

## Type

AFK
