# ADR 0015: Cordova iOS 构建

**Date:** 2026-06-21
**Status:** Accepted

## Context

猫咪捕猎游戏已完成 Android APK 打包（见 [ADR 0014](./0014-cordova-android-build.md)）。现需生成 iOS 安装包（IPA）以支持 iPhone/iPad。

**关键约束：iOS 构建必须在 macOS 上完成。** Apple 强制要求 Xcode（仅 macOS）进行编译和代码签名。当前开发环境为 Windows，无法直接生成 IPA。

## Decision

采用 **Cordova + 一键构建脚本** 方案，在 Windows 上完成所有可做的准备工作，Mac 端执行一条命令出包。

### 构建架构

```
Windows (开发机)                    macOS (构建机)
┌─────────────────────┐            ┌──────────────────────────┐
│ src/ (ES模块)        │            │ cordova-ios-build.sh     │
│ cordova-index.html   │  ────→     │   ↓                      │
│ rollup.config.mjs    │   git push │ cordova create + ios@7.1 │
│ cordova-ios-build.sh │            │   ↓                      │
│ docs/ios-build-guide │            │ rollup + babel → app.js  │
└─────────────────────┘            │   ↓                      │
                                   │ cordova build ios         │
                                   │   ↓                      │
                                   │ Xcode Archive → IPA       │
                                   └──────────────────────────┘
```

### 技术选型

| 组件 | 版本 | 理由 |
|------|------|------|
| cordova-ios | 7.1.1 | 支持 Xcode 16，CocoaPods 依赖管理，LaunchScreen.storyboard |
| iOS 部署目标 | 13.0 | App Store 2025 年最低要求；覆盖 99%+ 活跃设备 |
| Cordova CLI | 12.x | 与 Android 构建保持一致，通过 npx 调用 |
| WKWebView | CDVWKWebViewEngine | iOS 唯一支持的现代 WebView（UIWebView 已废弃） |
| 签名方式 | Personal Team（免费）/ Distribution（$99/年） | 根据分发需求选择 |

### 与 Android 构建的复用

iOS 构建脚本复用 Android 构建的所有前端资源：
- **同一份 `cordova-index.html`**：加载 `cordova.js` + `app.js`，跨平台通用
- **同一份 `rollup.config.mjs`**：Babel 转译目标为 Chrome 39 / Android 5.1，覆盖 iOS 13 的 WKWebView（Safari 13 引擎，完全兼容 ES5）
- **同一份 `src/` 源码**：游戏逻辑无需任何 iOS 专属修改
- **同一调试机制**：`window.__CAT_DEBUG__` 运行时标志，release=false / debug=true

### iOS 专属配置

通过 `cordova-ios-build.sh` 在 `config.xml` 中注入：

```xml
<preference name="deployment-target" value="13.0" />
<preference name="target-device" value="universal" />
<preference name="CordovaWebViewEngine" value="CDVWKWebViewEngine" />
<preference name="StatusBarStyle" value="lightcontent" />
<preference name="DisallowOverscroll" value="true" />
<preference name="Orientation" value="all" />
<preference name="BackupWebStorage" value="none" />
<preference name="ScrollEnabled" value="false" />
<!-- 启动屏 -->
<preference name="SplashScreenDelay" value="500" />
<preference name="FadeSplashScreen" value="true" />
<preference name="FadeSplashScreenDuration" value="300" />
```

并在 `Info.plist` 中设置 `ITSAppUsesNonExemptEncryption=false`，避免每次提交 App Store 时的出口合规弹窗。

### 签名方案

| 场景 | 账号类型 | 成本 | 限制 |
|------|---------|------|------|
| 真机自测 | Personal Team（免费 Apple ID） | ¥0 | 7天过期，最多3个App，无IPA导出 |
| TestFlight 内测 | Individual | $99/年 | 最多10000测试用户 |
| App Store 上架 | Individual / Organization | $99/年 | 需通过审核 |

## Consequences

### 正面

- 一条命令在 Mac 上完成全部构建
- 前端代码 100% 跨平台复用，零 iOS 专属代码
- 与 Android 构建流程对称，维护成本低
- 支持 Xcode 自动管理签名（免费或付费均适用）

### 负面

- **无法在 Windows 上生成 IPA**：这是 Apple 的硬性限制，非项目缺陷
- 需要 Mac 硬件或云 Mac 服务（MacStadium / GitHub Actions macOS runner）
- 免费签名 7 天过期，长期测试需付费账号
- iOS 不支持 `<uses-feature>` 声明（Android TV 兼容配置仅适用于 Android）

### Mitigation

- `cordova-ios-build.sh` 在脚本开头检测操作系统，非 macOS 立即报错退出
- 提供完整的签名配置文档（见 `docs/ios-build-guide.md`）
- 支持 GitHub Actions macOS runner 作为无 Mac 硬件的替代方案

## Verification

待 Mac 环境执行后验证：
1. `./cordova-ios-build.sh --debug` 成功生成 Xcode 项目
2. Xcode 中选择真机 + Personal Team 签名后 Run 成功
3. 游戏主菜单按钮点击正常切换模式
4. 游戏模式 60 秒计时、得分、连击正常
5. 动画模式无限循环播放正常

## References

- [Apple Developer Program](https://developer.apple.com/programs/)
- [Cordova iOS Guide](https://cordova.apache.org/docs/en/latest/guide/platforms/ios/)
- [cordova-ios GitHub](https://github.com/apache/cordova-ios)
- [Xcode Signing Guide](https://developer.apple.com/support/code-signing/)
