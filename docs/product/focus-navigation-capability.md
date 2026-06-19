# 电视遥控器焦点导航 - 能力计划

## CAPABILITY

为游戏添加遥控器/键盘方向键菜单导航能力，使 Android TV 遥控器用户可通过方向键在菜单按钮间移动焦点、确认键选择选项、返回键返回上级菜单，实现所有菜单界面（主菜单、动画设置、游戏结束、动画播放中）的无缝遥控器操作。

### 核心能力

1. **声明式焦点组导航** — 每个菜单屏幕定义一个有序焦点组，方向键在组内线性移动焦点
2. **焦点视觉指示** — 当前焦点按钮显示橙色高亮边框（#ff6b35），远距离清晰可辨
3. **确认键触发** — Enter 键触发当前焦点按钮的 `data-action` 行为
4. **返回键导航** — Escape/Backspace 键执行返回上级菜单操作
5. **屏幕切换自动聚焦** — 屏幕切换时自动激活对应焦点组，焦点默认落在第一个按钮

## CONSTRAINTS

### 不变量 (Invariants)

- 零外部依赖 — 不引入任何 npm 包，纯 DOM + CSS 实现
- `InputHandler` 职责不变 — Canvas 鼠标/触摸输入与焦点导航完全独立
- `UIController.showScreen(name)` 签名不变 — FocusNavigator 通过回调获知屏幕切换
- 现有鼠标/触摸操作不受影响 — 遥控器导航是增量能力，不替代现有输入
- 事件处理延迟 < 1ms — 同步 DOM 操作在同一帧完成
- CSS 过渡时间 ≤ 100ms — 焦点边框出现/消失的过渡动画不超过 100ms

### 约束 (Constraints)

- 标准 `event.key` — 只处理 ArrowUp/Down/Left/Right、Enter、Escape、Backspace
- 游戏模式忽略方向键 — 游戏进行中方向键无效，仅返回键有效
- 焦点边界不动 — 第一个元素按上无效，最后一个元素按下无效
- 无二次确认 — 返回键直接返回，不弹确认提示

### 边界条件 (Boundaries)

- 焦点组数量：4（menu、animationSettings、gameOver、game/animation 中的 modeSwitch）
- 每组焦点元素：2-4 个
- 焦点指示器：3px 橙色边框（#ff6b35）
- CSS 过渡：border-color 100ms ease

## IMPLEMENTATION CONTRACT

### 新增模块: `src/focus-navigator.js`

```js
class FocusNavigator {
    constructor(onScreenChange)
    // 注册焦点组
    registerGroup(screenName, elements): void
    // 激活指定屏幕的焦点组，焦点默认在第一个元素
    activateGroup(screenName): void
    // 清除当前焦点（屏幕切换时调用）
    clearFocus(): void
    // 处理键盘事件
    handleKeyDown(event): void
    // 销毁，移除事件监听
    destroy(): void
}
```

- 监听 `document.addEventListener('keydown', ...)`
- 方向键在当前焦点组内移动焦点索引
- Enter 键触发当前焦点元素的 `click()` 事件
- Escape/Backspace 键根据当前屏幕执行返回操作
- 焦点切换时同步更新 DOM 元素的 CSS class

### 修改模块: `src/ui-controller.js`

```js
// 新增：屏幕切换回调
constructor(onScreenChange)
// showScreen 执行后调用 onScreenChange(name)
showScreen(name) {
    // ... 现有逻辑 ...
    if (this._onScreenChange) this._onScreenChange(name);
}
```

### 修改模块: `src/game.js`

```js
// 新增：实例化 FocusNavigator
constructor() {
    // ... 现有逻辑 ...
    this.ui = new UIController((screenName) => {
        this.focusNavigator.activateGroup(screenName);
    });
    this.focusNavigator = new FocusNavigator();
    // 注册焦点组
    this.focusNavigator.registerGroup('menu', [...]);
    this.focusNavigator.registerGroup('animationSettings', [...]);
    this.focusNavigator.registerGroup('gameOver', [...]);
}
```

### 修改文件: `index.html`

- 新增 `.btn.focused` CSS 样式（橙色边框 + 过渡动画）
- 为可聚焦按钮添加 `data-focusable` 属性（可选，也可通过选择器自动发现）

## NON-GOALS

- 不实现空间导航（2D 位置计算最近邻）— 菜单全是纵向布局，不需要
- 不实现焦点循环回绕 — 按钮少，边界清晰
- 不实现游戏模式中的方向键操作 — 游戏核心是点击捕捉，方向键无法映射
- 不检测遥控器连接状态 — Web 层面无法区分"断开"和"用户没按键"
- 不处理非标准按键码 — 现代 WebView 标准按键码足够
- 不实现 Canvas 内虚拟焦点 — 当前所有菜单都是 HTML DOM 元素

## OPEN QUESTIONS

无 — 所有关键决策已在 grill-with-docs 会话中确认。

## HANDOFF

### 实现顺序（垂直切片）

| 切片 | 内容 | 涉及文件 | 依赖 |
|------|------|---------|------|
| V1 | FocusNavigator 核心逻辑 + 单元测试 | `focus-navigator.js`, `focus-navigator.test.js` | 无 |
| V2 | 焦点视觉样式 + UIController 回调集成 | `index.html`, `ui-controller.js` | V1 |
| V3 | Game 类集成 + 焦点组注册 + 集成测试 | `game.js`, `game.test.js` | V1, V2 |
| V4 | E2E 遥控器导航测试 + 视觉验证 | `e2e/remote-navigation.spec.js` | V3 |

### 验收标准

- [ ] 方向键可在所有菜单的按钮间移动焦点
- [ ] 焦点按钮显示橙色高亮边框，未焦点按钮无边框
- [ ] Enter 键可触发当前焦点按钮的操作
- [ ] Escape/Backspace 键可返回上级菜单
- [ ] 游戏模式中方向键无效，返回键有效
- [ ] 屏幕切换时焦点自动落在第一个按钮
- [ ] 焦点到达边界时不动（不循环）
- [ ] 现有鼠标/触摸操作不受影响
- [ ] 事件处理延迟 < 1ms
- [ ] CSS 过渡 ≤ 100ms
- [ ] 所有新增代码测试覆盖率 ≥ 80%
