# ADR-0008: 架构修复与深化批次

## 状态

已接受

## 上下文

项目从单文件重构为 ES 模块后，审查发现 5 个架构问题和 8 个游戏 Bug。主要问题包括：帧率依赖计时、Creature/AnimationCreature 代码重复、状态机浅模块、Game 上帝循环、SoundManager 守卫散落。

## 决策

### Bug 修复
- **真实时间计时**：GameMode 使用 `performance.now()` 替代帧计数，`time` 改为 getter 实时计算
- **声音事件时序**：AnimationMode 中死亡检查提前到状态变化判断之前，形成互斥分支
- **comboTimeout 同步**：Game.handleInput 中 miss 时立即清除 timeout
- **SoundManager 守卫集中**：提取 `_ensureContext()` 方法，4 个公开方法各减 2 行
- **SoundManager destroy 清理**：移除 `destroy()` 中对 `crawlFilter` 的冗余 disconnect

### 架构深化
- **生物核心组合**：提取 `CreatureCore` 类，Creature 和 AnimationCreature 通过组合共享边缘生成、眨眼更新、尾巴创建、视觉属性
- **状态机接口深化**：AnimationCreature 新增 17 个语义方法（steerToward, decelerate, resetPattern 等），状态类不再直接写入 creature 内部字段
- **Game 循环拆分**：loop() 拆分为 `_renderGameFrame()` + `_renderAnimationFrame()`，音频事件用映射替代 switch-case
- **模块级实例化移除**：`new Game()` 从 game.js 移到 main.js

## 后果

- 测试从 247 增长到 389，覆盖率 >80%
- 状态类只依赖语义接口，物理实现可独立变化
- Creature 和 AnimationCreature 共享代码通过 CreatureCore，修改眨眼/尾巴只需改一处
- GameMode.time 为 getter，外部读取始终获得实时值
- gameTime 仍基于帧计数用于生成节奏，不影响计时准确性
