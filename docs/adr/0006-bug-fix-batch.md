# ADR-0006: Bug 修复批次 - 12个已知问题

## 状态

已接受

## 上下

项目从单文件 `game.js` 重构为 ES 模块架构后，审查发现 12 个 bug，涵盖渲染、状态机、音频、输入和资源管理。

## 决策

### 渲染修复
- **游戏结束画面保留**：`gameOver` 模式纳入渲染分支，但跳过 update，使结束画面叠加在游戏画面上
- **状态转换帧连续更新**：移除 `AnimationCreature.update()` 中状态转换时的 early return，确保位置和尾段每帧更新

### 状态机修复
- **PausingState 渐停**：`enter()` 不再归零速度，由 `update()` 的 0.9 衰减实现自然减速
- **ExitingState 缓存出口**：出口点在 `enter()` 中计算一次并缓存，避免每帧重算导致路径抖动

### 音频修复
- **背景音乐停止/重启**：`stopBackgroundMusic()` 清除 setTimeout 并淡出增益；`startBackgroundMusic()` 恢复增益值
- **爬行音效安全清理**：`stopCrawlSound()` 添加 try/catch 和 crawlGain.disconnect()
- **捕捉音效频率**：使用 `600 + min(combo, 10) * 80` 替代 `800 + combo * 50`，增大音调变化感知

### 输入修复
- **坐标转换简化**：移除不必要的 Canvas/CSS 尺寸缩放计算，直接使用 `clientX - rect.left`

### 资源管理
- **resize 传播**：`GameMode.resize()` 和 `AnimationMode.resize()` 更新现有生物的 canvasWidth/canvasHeight
- **死代码清理**：移除 `GameMode.comboTimeout`、`SoundManager.bgMusicOscillators`、根目录遗留 `game.js`

## 后果

- 所有 144 个测试通过，语句覆盖率 80.3%
- 音频资源管理更健壮，但 SoundManager 仍缺少 `destroy()` 方法（记录为待改进项）
- `Game` 类在模块级别自动实例化，影响可测试性（记录为待改进项）
