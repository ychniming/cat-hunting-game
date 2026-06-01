# Issue #1: ES Module 基础设施 + CONFIG 分组

## What to build

建立模块化基础设施，将项目从单文件 `<script src="game.js">` 迁移到 ES Module 架构。创建 `src/` 目录结构，将 CONFIG 按领域分组提取为独立模块，配置 Vitest 测试框架，更新 Service Worker 缓存列表。完成后游戏行为完全不变，但代码已具备模块化基础。

## Acceptance criteria

- [ ] `index.html` 使用 `<script type="module" src="src/main.js">`
- [ ] `src/` 目录结构已创建
- [ ] CONFIG 按领域分组（game / animation / visual / audio）
- [ ] Service Worker 缓存列表包含所有新模块路径
- [ ] Vitest 已配置并可运行
- [ ] CONFIG 分组测试通过
- [ ] 游戏在浏览器中运行行为不变

## Blocked by

None - can start immediately

## Type

AFK
