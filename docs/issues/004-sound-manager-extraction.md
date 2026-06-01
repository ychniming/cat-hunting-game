# Issue #4: SoundManager 提取

## What to build

将 SoundManager 类移到独立文件，保留统一接口（不拆分为 GameAudio/AnimationAudio），内部用方法前缀区分两种模式的音频逻辑。

## Acceptance criteria

- [ ] `src/sound-manager.js` 导出 SoundManager 类
- [ ] SoundManager 接口不变（init, startBackgroundMusic, stopBackgroundMusic, startCrawlSound, stopCrawlSound, playPauseSound, playCatchSound, setVolume, stopAll）
- [ ] SoundManager 单元测试覆盖音量层级和播放逻辑
- [ ] 游戏在浏览器中运行行为不变

## Blocked by

- Issue #1 (ES Module 基础设施)

## Type

AFK
