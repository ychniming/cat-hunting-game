# V1: TailChain Verlet 物理链

## 目标
实现基于 Verlet 积分的尾巴物理链，替代当前的位置历史方法。

## 验收标准
- [ ] TailChain 类实现 Verlet 积分更新
- [ ] 距离约束保持链段长度
- [ ] 锚点跟随生物身体位置
- [ ] 可配置刚度、重力、阻尼
- [ ] 单元测试覆盖率 ≥ 80%

## 涉及文件
- 新增: `src/tail-chain.js`
- 新增: `tests/tail-chain.test.js`

## TDD 流程
1. RED: 写测试 — 构造、update、约束、getSegments、applyForce
2. GREEN: 实现 TailChain 类
3. REFACTOR: 优化约束求解

---

# V2: 锥形渐变渲染 + Bézier 平滑

## 目标
替换均匀线宽直线段渲染，实现锥形渐变线宽 + Bézier 曲线平滑。

## 验收标准
- [ ] renderTaperedTail 逐段递减线宽
- [ ] 使用 quadraticCurveTo 平滑连接
- [ ] renderCreature 内部调用新函数
- [ ] 单元测试验证渲染调用序列

## 涉及文件
- 修改: `src/creature-renderer.js`
- 修改: `tests/creature-renderer.test.js`

## 依赖
- V1 (TailChain 提供 segments 数据)

---

# V3: 集成到 Creature + AnimationCreature + 配置更新

## 目标
将 TailChain 集成到两种生物类中，更新配置。

## 验收标准
- [ ] Creature 使用 TailChain 替代 tailSegments 数组
- [ ] AnimationCreature 使用 TailChain 替代 tailSegments 数组
- [ ] CONFIG 新增 tail 配置节
- [ ] getVisualProps() 兼容现有渲染
- [ ] 所有现有测试通过

## 涉及文件
- 修改: `src/creature.js`
- 修改: `src/animation-creature.js`
- 修改: `src/config.js`
- 修改: `tests/creature.test.js`
- 修改: `tests/animation-creature.test.js`
- 修改: `tests/config.test.js`

## 依赖
- V1, V2

---

# V4: 状态感知尾巴行为 + 尖端卷曲

## 目标
尾巴物理参数随生物状态动态调整，末端卷曲增加生物感。

## 验收标准
- [ ] 暂停状态尾巴缓慢下垂（增大重力、降低刚度）
- [ ] 移动状态尾巴自然摆动
- [ ] 退出状态尾巴急促甩动
- [ ] 尖端卷曲效果渲染

## 涉及文件
- 修改: `src/animation-creature.js`
- 修改: `src/creature-renderer.js`

## 依赖
- V3

---

# V5: E2E 视觉验证 + 文档更新

## 目标
E2E 测试验证尾巴渲染正确，更新项目文档。

## 验收标准
- [ ] E2E 测试验证尾巴渲染元素存在
- [ ] CONTEXT.md 更新尾巴相关术语
- [ ] ADR 记录 Verlet 选型决策
- [ ] 整体测试覆盖率 ≥ 80%

## 涉及文件
- 修改: `e2e/canvas-rendering.spec.js`
- 修改: `CONTEXT.md`
- 新增: `docs/adr/0007-verlet-tail-physics.md`

## 依赖
- V3, V4
