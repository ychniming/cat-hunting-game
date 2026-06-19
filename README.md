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
- [JDK 17](https://adoptium.net/) (Eclipse Temurin)
- Android SDK (platforms;android-36, build-tools;36.0.0, platform-tools)
- [Cordova CLI](https://cordova.apache.org/) 13+

**环境变量:**
```
JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17-hotspot
ANDROID_HOME=<SDK路径>
ANDROID_SDK_ROOT=<SDK路径>
```

**构建步骤:**

```powershell
# 1. 安装 Cordova CLI
npm install -g cordova

# 2. 创建 Cordova 项目（需在非中文路径下）
cordova create <构建目录> com.catgame.hunting CatHuntingGame

# 3. 添加 Android 平台
cd <构建目录>
cordova platform add android

# 4. 复制游戏文件到 www 目录
Copy-Item -Recurse -Force <项目目录>\index.html www\
Copy-Item -Recurse -Force <项目目录>\src www\src

# 5. 构建 Debug APK
cordova build android

# 6. 构建 Release APK（需先生成签名密钥）
keytool -genkeypair -v -keystore release.keystore -alias catgame \
  -keyalg RSA -keysize 2048 -validity 10000
cordova build android --release
```

**APK 输出路径:**
- Debug: `<构建目录>/platforms/android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `<构建目录>/platforms/android/app/build/outputs/apk/release/app-release.apk`

**当前构建配置:**
| 属性 | 值 |
|------|-----|
| 包名 | com.catgame.hunting |
| 最低 SDK | 24 (Android 7.0) |
| 目标 SDK | 36 (Android 16) |
| 权限 | INTERNET, WAKE_LOCK |
| 横屏 | landscape |
| 全屏 | true |

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
