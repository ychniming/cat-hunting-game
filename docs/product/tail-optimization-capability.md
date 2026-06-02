# 尾巴物理动画优化 - 能力计划

## CAPABILITY

将生物尾巴从「位置历史 + 均匀线宽 + 直线段」升级为「Verlet 物理链 + 锥形渐变 + Bézier 平滑」的程序化动画系统，使尾巴运动自然流畅、视觉表现接近参考动画帧中的蝌蚪尾巴效果。

### 核心能力

1. **Verlet 积分物理链** — 尾巴各节点通过距离约束连接，自然响应身体运动和重力
2. **锥形渐变绘制** — 从根部到尖端线宽递减，模拟真实尾巴形态
3. **Bézier 曲线平滑** — 使用二次/三次贝塞尔曲线替代直线段，消除折线感
4. **状态感知行为** — 尾巴物理参数随生物状态（移动/暂停/退出）动态调整
5. **尖端卷曲效果** — 尾巴末端自然卷曲，增加生物感

## CONSTRAINTS

### 不变量 (Invariants)

- `renderCreature(ctx, props)` 函数签名不变 — 所有渲染变更在函数内部完成
- `getVisualProps()` 返回结构兼容 — 新增字段，不删除现有字段
- 零外部依赖 — 不引入任何 npm 包，纯 Canvas 2D 实现
- 性能预算 — 单生物尾巴渲染 < 0.5ms（60fps 下 16.67ms 帧预算的 3%）
- 测试覆盖率 ≥ 80% — 新增代码必须有单元测试

### 约束 (Constraints)

- Canvas 2D API 限制 — 无 GPU 着色器，渐变线宽需逐段绘制
- 移动端性能 — 需在低端 Android 设备上流畅运行（Cordova 目标）
- 向后兼容 — `tailSegments` 数组格式需保持 `{x, y}` 结构供现有代码读取
- 配置冻结 — `CONFIG` 使用 `Object.freeze()`，新增配置需同样冻结

### 边界条件 (Boundaries)

- 尾巴节点数：游戏模式 8→16，动画模式 12→20
- 线宽范围：根部 `radius * 0.6` → 尖端 `1px`
- Verlet 约束迭代：2-4 次（平衡精度与性能）
- 重力影响：可配置，默认 `0.15`

## IMPLEMENTATION CONTRACT

### 新增模块: `src/tail-chain.js`

```
class TailChain {
    constructor(anchorX, anchorY, segmentCount, segmentLength, config)
    update(anchorX, anchorY, dt): void
    getSegments(): Array<{x, y}>
    applyForce(fx, fy): void
    setStiffness(value): void
    setGravity(value): void
}
```

- Verlet 积分更新位置
- 距离约束保持链段长度
- 锚点跟随生物身体
- 可配置刚度、重力、阻尼

### 修改模块: `src/creature-renderer.js`

```
新增函数:
- renderTaperedTail(ctx, segments, baseWidth, tipWidth): void
  逐段绘制锥形线宽，使用 quadraticCurveTo 平滑连接
- renderTailTipCurl(ctx, segments, curlRadius): void
  在尾巴末端绘制卷曲效果
```

- `renderCreature` 内部调用新函数替代旧逻辑
- 移除 `wigglePhase`/`tailWiggleScale`/`tailWiggleFreq` 渲染时计算
- 尾巴物理摆动由 TailChain 自身处理

### 修改模块: `src/creature.js`

- 用 `TailChain` 实例替代 `tailSegments` 数组
- `update()` 中调用 `tailChain.update(this.x, this.y)`
- `getVisualProps()` 返回 `tailChain.getSegments()` 作为 `tailSegments`

### 修改模块: `src/animation-creature.js`

- 同 `creature.js` 的修改模式
- 状态感知：根据 `this.state` 调整 TailChain 参数

### 修改模块: `src/config.js`

- 新增 `tail` 配置节：
  ```js
  tail: Object.freeze({
      gravity: 0.15,
      stiffness: 0.8,
      damping: 0.98,
      constraintIterations: 3,
      gameSegments: 16,
      animationSegments: 20,
      segmentLength: 8,
      baseWidthRatio: 0.6,
      tipWidth: 1,
      curlRadius: 4
  })
  ```

## NON-GOALS

- 不实现 3D 尾巴渲染（保持 Canvas 2D）
- 不实现毛发/纹理效果（保持纯色填充）
- 不实现多尾巴变体（所有生物统一尾巴样式）
- 不实现尾巴碰撞检测（纯视觉优化）
- 不引入物理引擎库（自实现 Verlet）

## OPEN QUESTIONS

1. ~~Verlet 链段长度是否应随 radius 缩放？~~ → 是，`segmentLength = radius * 0.4`
2. 尾巴尖端卷曲在暂停状态下是否应更明显？→ 待实现后视觉评估
3. 游戏模式被捕捉时尾巴是否需要特殊动画？→ 低优先级，P2 阶段考虑

## HANDOFF

### 实现顺序（垂直切片）

| 切片 | 内容 | 涉及文件 | 依赖 |
|------|------|---------|------|
| V1 | TailChain Verlet 物理链 + 单元测试 | `tail-chain.js`, `tail-chain.test.js` | 无 |
| V2 | 锥形渐变渲染 + Bézier 平滑 + 单元测试 | `creature-renderer.js`, `creature-renderer.test.js` | V1 |
| V3 | 集成到 Creature + AnimationCreature + 配置更新 | `creature.js`, `animation-creature.js`, `config.js` | V1, V2 |
| V4 | 状态感知尾巴行为 + 尖端卷曲 | `animation-creature.js`, `creature-renderer.js` | V3 |
| V5 | E2E 视觉验证 + 文档更新 | `e2e/`, `docs/` | V3, V4 |

### 验收标准

- [ ] 尾巴从根部到尖端线宽递减，视觉呈锥形
- [ ] 尾巴曲线平滑无折线，使用 Bézier 插值
- [ ] 尾巴自然响应身体运动，有惯性和延迟
- [ ] 暂停状态尾巴缓慢下垂，移动状态尾巴自然摆动
- [ ] 所有新增代码测试覆盖率 ≥ 80%
- [ ] 单生物渲染性能 < 0.5ms
