# 猫咪捕猎游戏

基于 B站猫咪动画视频改造的交互式捕猎游戏。

## 游戏特色

- 极简风格 - 还原原视频的米白背景 + 黑色蝌蚪生物
- 全平台支持 - 手机、平板、电脑、电视都能玩
- 猫咪友好 - 大点击区域，适合猫爪拍打
- 连击系统 - 连续捕捉获得更高分数
- 音效反馈 - 捕捉成功时播放提示音

## 文件结构

```
猫咪动画改造游戏/
├── index.html              # 游戏主页面
├── cordova-index.html      # Cordova 专用入口（加载 app.js + cordova.js）
├── rollup.config.mjs       # Rollup + Babel 打包配置（ESM）
├── src/                    # ES模块源码
│   ├── main.js             # 入口，实例化Game
│   ├── game.js             # 游戏主循环与模式切换
│   ├── config.js           # 配置常量
│   ├── game-mode.js        # 游戏模式逻辑
│   ├── animation-mode.js   # 动画模式逻辑
│   ├── creature.js         # 游戏模式生物
│   ├── animation-creature.js # 动画模式生物
│   ├── creature-core.js    # 生物核心共享模块
│   ├── creature-states.js  # 动画生物状态机
│   ├── creature-renderer.js # 生物渲染
│   ├── tail-chain.js       # Verlet积分尾巴物理链
│   ├── particle.js         # 粒子效果
│   ├── sound-manager.js    # 音频管理
│   ├── input-handler.js    # 输入处理
│   ├── focus-navigator.js  # 焦点导航
│   └── ui-controller.js    # UI控制
├── tests/                  # 测试文件
├── deploy/                 # 部署配置
│   ├── manifest.json       # PWA配置
│   └── sw.js               # Service Worker
├── assets/                 # 素材目录
│   └── frames/             # 视频关键帧
├── docs/                   # 文档目录
│   └── adr/                # 架构决策记录
├── package.json            # 项目配置
├── cordova-setup.ps1       # Android打包脚本 (PowerShell)
└── extract_frames.py       # 视频帧提取工具
```

## 运行方式

### 1. 网页版 (推荐)

```bash
# 启动本地服务器
python -m http.server 8080

# 浏览器打开
http://localhost:8080
```

### 2. Android APK

**前提条件:**
- [Node.js](https://nodejs.org/) v18+
- [JDK 17](https://adoptium.net/) Eclipse Temurin，安装到 `C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot`（脚本会覆盖 `JAVA_HOME`）
- Android SDK，安装到项目内 `android-sdk/`（脚本会覆盖 `ANDROID_HOME`），并包含 `build-tools;36.0.0` 与 `platforms;android-33`
- 不需要全局 Cordova CLI；脚本通过 `npx --yes cordova@12` 自动调用

**环境变量:**
脚本内部会硬编码/覆盖以下路径，请确保路径存在或修改 `cordova-setup.ps1` 对应行：
```
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot
ANDROID_HOME=<项目根目录>\android-sdk
ANDROID_SDK_ROOT=<项目根目录>\android-sdk
```

**一键构建（推荐）:**

```powershell
# Release APK（签名）
.\cordova-setup.ps1 -Release

# Debug APK
.\cordova-setup.ps1 -Release:$false
```

首次 Release 构建会自动生成 `cordova-build/cat-game-release.keystore` 并用默认密码签名。生产环境请设置环境变量：

```powershell
$env:CAT_KEYSTORE_STOREPASS = "your-store-password"
$env:CAT_KEYSTORE_KEYPASS = "your-key-password"
```

**APK 输出路径:**
- Release: `cat-hunting-game-v1.0.0-release.apk`
- Debug: `cat-hunting-game-v1.0.0-debug.apk`

**当前构建配置:**
| 属性 | 值 |
|------|-----|
| 包名 | com.catgame.hunting |
| 最低 SDK | 22 (Android 5.1) |
| 目标 SDK | 33 (Android 13) |
| Cordova Android | 12.0.0 |
| 权限 | INTERNET |
| JS 转译 | Rollup + Babel (目标 Chrome 39 / Android 5.1 WebView) |

**已知陷阱:**

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 应用卡在 "Device is Ready" | `cordova prepare` 跳过 `index.html`，APK 内仍是默认模板 | 脚本已用 Python `shutil.copy2` 自动覆盖 `assets/www/index.html` |
| 电视上无法安装/显示 | 缺少 `LEANBACK_LAUNCHER` 和触摸屏声明 | 脚本自动在 `AndroidManifest.xml` 中注入 TV 兼容声明 |
| 应用启动后“屡次停止运行” | 旧版 System WebView（Android 5.1–7.0）无法解析 ES6+ 语法 | 脚本使用 Rollup + Babel 将 `src/` 语法转译为 ES5；不再打包 core-js，避免 `require` 泄漏到浏览器 IIFE |
| 安装后按钮点击无反应 | 事件委托在旧 WebView 中不可靠、CSS `touch-action: none` 吞掉触摸事件、canvas 覆盖按钮、Babel 之前打包的 core-js polyfills 以 CommonJS `require` 形式注入导致运行时异常 | 直接监听按钮容器事件、为按钮设置 `pointer-events: auto` 与 `z-index`、canvas 绝对定位并置于底层、所有按钮保留 `onclick` 全局备选、InputHandler 的 touchstart 使用 `{ passive: false }` |
| `cordova prepare` 报 “The operation completed successfully” | Node.js `fs.cpSync` 在非 ASCII 路径下的 bug | 脚本自动补丁 `cordova-common/src/FileUpdater.js` |
| aapt2 编码警告 | 中文路径导致 aapt2 解析错误 | 已在 `gradle.properties` 中启用 `android.overridePathCheck=true`，警告不影响构建结果 |

### 3. 部署到服务器

将以下文件上传到任意静态托管服务：
- `index.html`
- `src/` 目录
- `deploy/manifest.json`
- `deploy/sw.js`

支持: GitHub Pages, Vercel, Netlify, 腾讯云 COS, 阿里云 OSS 等

## 游戏玩法

1. 点击"开始游戏"
2. 黑色小生物会从屏幕边缘出现
3. 点击或拍打它们来捕捉
4. 连续捕捉触发连击，获得更高分数
5. 60秒倒计时结束后显示最终得分

## TV 适配建议

- 在 Android TV 上安装后，建议使用遥控器或连接鼠标
- 也可以直接在电视浏览器中打开网页版
- 全屏模式体验最佳

## 技术栈

- HTML5 Canvas 2D
- Vanilla JavaScript (ES6+)
- Web Audio API (程序化音效)
- PWA (Progressive Web App)
- Apache Cordova (Android 打包)

## 素材来源

- 视频: B站 "给我家猫咪看的动画"
- 生物设计: 基于视频中的黑色蝌蚪状生物
- 音效: Web Audio API 生成

## License

MIT
