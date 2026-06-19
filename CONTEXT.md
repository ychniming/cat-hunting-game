# 猫咪动画改造游戏 - 项目上下文

## 项目概述

将 B站猫咪动画视频（BV1jFUkBPEZA）改造为互动游戏和观赏动画。
目标用户：猫咪（观赏/互动）和猫主人（操作设置）。

## 核心术语表

| 术语 | 定义 | 使用场景 |
|------|------|---------|
| **生物核心** (CreatureCore) | 深模块：共享的生物基础逻辑 + 物理工具方法（clampSpeed, getSpeed, addVelocityOffset），边缘生成、眨眼更新、尾巴创建、视觉属性 | Creature 和 AnimationCreature 的组合模块，物理方法遵循不可变模式 |
| **语义方法** (Semantic Method) | 生物上的动作方法（steerToward, decelerate, addWiggleOffset, clampSpeed, resize, stopVelocity等），外部通过这些方法间接操作生物 | Creature 和 AnimationCreature 共享的接口模式 |
| **生物** (Creature) | 黑色圆形头部、白色大眼睛、带摆动尾巴的蝌蚪状生物 | 游戏模式和动画模式的核心元素 |
| **游戏模式** (Game Mode) | 60秒计时挑战，点击捕捉生物获得分数 | 给猫咪或人玩的互动模式 |
| **动画模式** (Animation Mode) | 无限循环播放生物移动，无交互纯观赏 | 给猫咪看的电视动画 |
| **观众** (Viewer) | 动画模式下的观看者（通常是猫咪） | 与"玩家"区分 |
| **玩家** (Player) | 游戏模式下的互动者（人或猫咪） | 与"观众"区分 |
| **停留时间** (Dwell Time) | 生物在屏幕上的总生命周期 | 动画模式关键参数 |
| **移动模式** (Movement Pattern) | 生物的移动行为类型 | 漫游 / 边缘爬行 / 穿越屏幕 |
| **尾巴链** (TailChain) | 基于 Verlet 积分的物理链，模拟尾巴运动 | 生物尾巴的物理引擎 |
| **锥形渲染** (Tapered Rendering) | 从根部到尖端线宽递减的绘制方式 | 尾巴视觉呈现 |
| **速度匹配拖拽** (Velocity-Matched Drag) | 尾巴段速度趋向锚点速度的力，慢则推、快则拉 | 让尾巴自然跟随头部移动 |
| **状态感知物理** (State-Aware Physics) | 尾巴物理参数随生物状态动态调整 | 退出时增加刚度让尾巴紧跟身体 |
| **焦点导航** (Focus Navigation) | 遥控器方向键在菜单按钮间移动焦点的导航方式 | Android TV 遥控器、键盘方向键导航菜单 |
| **焦点组** (Focus Group) | 同一屏幕内可聚焦元素的有序集合，方向键在组内线性移动 | 每个菜单屏幕对应一个焦点组 |
| **焦点指示器** (Focus Indicator) | 当前焦点元素的视觉反馈（橙色高亮边框 #ff6b35） | 遥控器导航时标识当前选中按钮 |
| **Cordova 构建** (Cordova Build) | 使用 Apache Cordova 将 Web 应用打包为 Android APK 的流程 | 独立于源码树的构建目录，通过 cordova prepare 注入 www 资源 |
| **签名密钥** (Signing Key) | Android APK 发布签名的 RSA 2048-bit 密钥对 | 存储在 .keystore 文件中，已加入 .gitignore |

## 领域边界

### 游戏模式边界
- 时间边界：固定60秒回合
- 交互边界：点击/触屏捕捉
- 得分边界：基础分10分，连击最高10倍
- 生物数量边界：同时最多3-4个

### 动画模式边界
- 时间边界：用户可选30分钟/1小时/无限
- 交互边界：完全禁用（除退出按钮）
- 生物数量边界：同时最多1个
- 音频边界：背景音乐+爬行音效+停顿音效

## 关键决策

### 已确认决策
1. **双模式架构** - 游戏模式与动画模式完全独立
2. **Canvas渲染** - HTML5 Canvas 2D，不引入游戏引擎
3. **Web Audio API** - 程序化生成音效，不依赖外部音频文件
4. **PWA + Cordova** - 网页版为主，Android APK为辅助
5. **Verlet 积分尾巴** - 自实现物理链，不引入物理引擎库
6. **真实时间计时** - 游戏模式使用 performance.now() 而非帧计数，生成节奏也基于真实时间
7. **生物核心组合** - Creature 和 AnimationCreature 通过 CreatureCore 组合共享逻辑
8. **语义方法接口** - 状态类和内部逻辑通过语义方法操作生物，不直接访问内部字段
9. **声音事件映射** - 未知声音事件触发 console.warn，便于调试
10. **声明式焦点导航** - 遥控器/键盘方向键导航菜单，声明式焦点组，边界不动，默认首按钮
11. **Cordova 独立构建目录** - Android 构建项目放在源码树外（C:\Users\...\cat-game-build），避免中文路径和构建产物污染源码

### 待迭代决策
1. 生物停留时间随机范围（当前：5-15秒）
2. 音量大小（当前：主音量50%）
3. 生物移动速度（当前：1.5-3.5像素/帧）

## 技术栈

- **渲染**：HTML5 Canvas 2D
- **音频**：Web Audio API
- **构建**：纯前端，无构建工具
- **打包**：Cordova（Android）
- **部署**：静态托管（GitHub Pages/Vercel等）

## 文件结构

```
猫咪动画改造游戏/
├── index.html          # 主页面，包含所有UI层
├── src/                # ES模块源码
│   ├── main.js         # 入口，实例化Game
│   ├── game.js         # 游戏主循环与模式切换
│   ├── config.js       # 配置常量（时间属性以Sec后缀表示秒数）
│   ├── game-mode.js    # 游戏模式逻辑（真实时间计时+生成节奏）
│   ├── animation-mode.js # 动画模式逻辑
│   ├── creature.js     # 游戏模式生物（含语义方法+resize）
│   ├── animation-creature.js # 动画模式生物（含语义方法+resize+stopVelocity+状态机）
│   ├── creature-core.js # 生物核心深模块（共享逻辑+不可变物理工具方法）
│   ├── creature-states.js # 动画生物状态机定义
│   ├── creature-renderer.js # 生物渲染函数
│   ├── tail-chain.js   # Verlet 积分尾巴物理链
│   ├── particle.js     # 粒子效果
│   ├── sound-manager.js # 音频管理（守卫集中）
│   ├── input-handler.js # 输入处理（Canvas鼠标/触摸）
│   ├── focus-navigator.js # 焦点导航（遥控器/键盘方向键）
│   └── ui-controller.js # UI控制
├── tests/              # 测试文件
├── package.json        # 项目元数据
├── cordova-setup.ps1   # Android打包脚本
├── extract_frames.py   # 视频帧提取工具
├── deploy/             # 部署配置
│   ├── manifest.json   # PWA配置
│   └── sw.js           # Service Worker
├── assets/             # 素材目录
│   └── frames/         # 视频关键帧
├── docs/               # 文档目录
│   ├── adr/            # 架构决策记录
│   └── issues/         # 问题追踪
└── CONTEXT.md          # 本文件
```

## 设计原则

1. **猫咪优先** - 所有设计决策以猫咪体验为首要考量
2. **极简风格** - 还原原视频的米白背景+黑色生物风格
3. **零依赖** - 不引入外部库，减少加载时间和维护成本
4. **渐进增强** - 核心功能先实现，高级特性后续迭代
