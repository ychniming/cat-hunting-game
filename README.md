# 🐱 猫咪捕猎游戏

基于 B站猫咪动画视频改造的交互式捕猎游戏。

## 游戏特色

- 🎯 **极简风格** - 还原原视频的米白背景 + 黑色蝌蚪生物
- 📱 **全平台支持** - 手机、平板、电脑、电视都能玩
- 🐾 **猫咪友好** - 大点击区域，适合猫爪拍打
- 🎮 **连击系统** - 连续捕捉获得更高分数
- 🔊 **音效反馈** - 捕捉成功时播放提示音

## 文件结构

```
猫咪动画改造游戏/
├── index.html          # 游戏主页面
├── game.js             # 游戏核心逻辑
├── manifest.json       # PWA 配置
├── sw.js               #  Service Worker
├── package.json        # 项目配置
├── cordova-setup.ps1   # Android 打包脚本 (PowerShell)
├── cordova-setup.sh    # Android 打包脚本 (Bash)
├── extract_frames.py   # 视频帧提取工具
├── assets/
│   ├── frames/         # 视频关键帧
│   ├── sprites/        # 游戏精灵图
│   ├── backgrounds/    # 背景图
│   └── sounds/         # 音效文件
└── README.md
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
- 安装 [Node.js](https://nodejs.org/)
- 安装 [Android Studio](https://developer.android.com/studio) (包含 SDK)
- 配置 `ANDROID_SDK_ROOT` 环境变量

**打包步骤:**

```powershell
# PowerShell
.\cordova-setup.ps1
```

或

```bash
# Git Bash / WSL
bash cordova-setup.sh
```

APK 输出路径: `cordova-app/platforms/android/app/build/outputs/apk/debug/app-debug.apk`

### 3. 部署到服务器

将以下文件上传到任意静态托管服务：
- `index.html`
- `game.js`
- `manifest.json`
- `sw.js`

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

- HTML5 Canvas
- Vanilla JavaScript (ES6+)
- PWA (Progressive Web App)
- Cordova (Android 打包)

## 素材来源

- 视频: B站 "给我家猫咪看的动画"
- 生物设计: 基于视频中的黑色蝌蚪状生物
- 音效: Web Audio API 生成

## License

MIT
