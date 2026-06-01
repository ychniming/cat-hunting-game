# 能力计划：架构模块化重构

## CAPABILITY

将猫咪动画改造游戏从单文件（game.js 1088行）架构重构为按领域概念拆分的模块化架构，使每个模块具有明确的接口和独立的可测试性，同时保持游戏模式和动画模式的运行时行为完全不变。

## CONSTRAINTS

### 固定规则（不变量）

1. **行为等价**：重构后游戏模式和动画模式的运行时行为必须与当前完全一致——相同的生物移动、相同的计分逻辑、相同的音效触发
2. **零依赖原则**（ADR 0004）：不引入外部库/框架，纯原生 JavaScript + ES Modules
3. **双模式独立**（ADR 0001）：游戏模式与动画模式的逻辑必须可独立修改
4. **生物行为独立**（ADR 0002）：Creature 和 AnimationCreature 保持独立实现
5. **程序化音频**（ADR 0003）：不引入外部音频文件
6. **PWA 兼容**：Service Worker 缓存策略需覆盖新增的模块文件

### 范围边界

- **在范围内**：模块拆分、渲染去重、Game 类职责分离、UI 解耦、状态机深化、CONFIG 分组、测试引入
- **不在范围内**：新功能添加、UI 视觉重设计、性能优化、Cordova 打包流程变更

### 信任边界

- 模块间通过 import/export 通信，不通过全局变量
- UI 层不直接访问游戏状态，通过 UIController 接口

### 数据所有权

- GameMode 拥有游戏模式状态（score, combo, time, creatures）
- AnimationMode 拥有动画模式状态（animationCreature, spawnTimer, duration）
- UIController 拥有 DOM 引用和显示逻辑
- SoundManager 拥有 AudioContext 和音量层级

## IMPLEMENTATION CONTRACT

### 参与者（Actors）

| 参与者 | 角色 |
|--------|------|
| Game（编排层） | 组合各模块，驱动游戏循环 |
| GameMode | 管理游戏模式生命周期：生成、计分、连击 |
| AnimationMode | 管理动画模式生命周期：生物生成、音效触发 |
| Creature | 游戏模式生物行为 |
| AnimationCreature | 动画模式生物行为 + 状态机 |
| CreatureRenderer | 共享渲染逻辑 |
| Particle | 粒子效果 |
| SoundManager | 音频管理（保持统一，内部分区） |
| UIController | DOM 操作封装 |
| InputHandler | 鼠标/触摸事件处理 |
| CONFIG | 分组配置常量 |

### 表面（Surfaces）

```
index.html
  └─ <script type="module" src="src/main.js">
       └─ Game (编排)
            ├─ GameMode
            │    ├─ Creature[]
            │    └─ InputHandler
            ├─ AnimationMode
            │    └─ AnimationCreature
            ├─ CreatureRenderer
            ├─ Particle[]
            ├─ SoundManager
            └─ UIController
```

### 状态与转换

**Game 编排层状态**：
```
menu → game_mode → menu
menu → animation_mode → menu
game_mode → game_over → menu
```

**AnimationCreature 状态机**（ADR 0005，深化后）：
```
entering → moving ⇄ pausing → exiting
                └──────→ exiting
```

### 接口定义

#### CreatureRenderer

```javascript
// 输入：生物视觉属性
{
  x, y,                    // 位置
  radius,                  // 头部半径
  tailSegments,            // 尾巴段数组
  wigglePhase,             // 摆动相位
  vx, vy,                  // 速度（用于尾巴方向）
  blinking,                // 是否眨眼
  eyeOffset,               // 瞳孔偏移
  eyeSizeRatio,            // 眼睛大小比例
  eyeSpacingRatio,         // 眼睛间距比例
  caught,                  // 是否被捕捉（游戏模式特效）
  caughtTime               // 捕捉动画进度
}
```

#### UIController

```javascript
showScreen(name)           // 'menu' | 'game' | 'animation' | 'gameOver'
updateScore(score)
updateTimer(time)
showCombo(combo)
hideCombo()
showAnimationSettings()
```

#### GameMode

```javascript
start()
stop()
update()
handleInput(x, y)          // 返回 { hit, combo, score }
getState()                 // 返回 { score, time, combo, maxCombo, creatures, particles }
isOver()
```

#### AnimationMode

```javascript
start(duration)
stop()
update()                   // 返回 { creature, soundEvents: ['startCrawl'|'stopCrawl'|'playPause'] }
getState()                 // 返回 { creature, spawnTimer, duration, elapsed }
isExpired()
```

### 数据模型影响

- 无数据库变更
- Service Worker 缓存列表需更新（新增模块文件路径）
- manifest.json 无变更

### 安全/策略约束

- 无用户数据收集，无认证需求
- 音频需用户交互后才能播放（浏览器策略），init() 必须在用户交互回调中调用

## NON-GOALS

- 不添加新游戏功能（如新生物类型、新音效）
- 不改变视觉风格或 UI 布局
- 不引入构建工具（Webpack/Vite）——使用浏览器原生 ES Modules
- 不改变 Cordova 打包流程
- 不引入 TypeScript（保持纯 JavaScript）

## OPEN QUESTIONS

1. **ES Modules 兼容性**：原生 ES Modules 需要通过 HTTP 服务器访问（不能 file://），当前项目已有 `python -m http.server`，但 Service Worker 缓存策略需要更新。是否需要添加 fallback？
2. **SoundManager 拆分粒度**：当前规模下 SoundManager 两种模式共处尚可容忍。是现在拆分为 GameAudio + AnimationAudio，还是保留统一接口但内部分区？
3. **测试框架选择**：纯 JavaScript 项目无 node_modules，需要选择测试方案：
   - 方案A：引入 Vitest（轻量，需 Node.js）
   - 方案B：使用浏览器内测试（无需 Node.js，但 CI 集成困难）
   - 方案C：引入 minimal npm devDependencies（Vitest + jsdom）

## HANDOFF

- **状态**：能力计划已就绪，可进入议题拆分
- **下一步**：使用 `to-issues` 技能将能力计划拆分为垂直切片议题
- **推荐 ECC 车道**：`to-issues` → `tdd-workflow` → `code-reviewer`
