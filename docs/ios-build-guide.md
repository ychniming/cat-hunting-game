# iOS 打包指南

> **重要：iOS 打包必须在 macOS 上完成。** Apple 强制要求 Xcode（仅 macOS）进行编译和签名。
> 当前 Windows 环境已完成所有准备工作，拿到 Mac 后按本指南执行即可。

## 一、前提条件

### 1.1 硬件要求

| 项目 | 最低要求 | 推荐 |
|------|---------|------|
| Mac 电脑 | 任意能运行 macOS 13+ 的 Mac | M1/M2/M3 Mac |
| iOS 设备 | iPhone/iPad（iOS 13+） | 同左 |
| USB 线 | 连接 Mac 与 iOS 设备 | 同左 |

### 1.2 软件要求

| 软件 | 最低版本 | 安装方式 |
|------|---------|---------|
| macOS | Ventura 13 | — |
| Xcode | 16.0 | Mac App Store |
| Node.js | 18.0 | [nodejs.org](https://nodejs.org/) |
| CocoaPods | 1.15 | `sudo gem install cocoapods` |
| Python 3 | 3.8 | 系统自带或 python.org |

### 1.3 Apple 开发者账号

根据你的分发需求选择：

| 方案 | 费用 | 能做什么 | 限制 |
|------|------|---------|------|
| **免费 Apple ID** | ¥0 | 真机调试（Build & Run） | 7天过期，最多3个App，不能导出IPA |
| **Individual** | $99/年 | TestFlight + App Store 上架 | 需实名认证 |
| **Organization** | $99/年 | 团队协作 + App Store | 需D-U-N-S编号 |

**如果只是自己手机上玩，用免费 Apple ID 即可。**

---

## 二、环境准备（Mac 端，一次性）

### 2.1 安装 Xcode

1. 打开 Mac App Store，搜索 "Xcode"，安装（约 12GB）
2. 安装完成后打开一次 Xcode，同意许可协议
3. 安装命令行工具：
   ```bash
   xcode-select --install
   ```

### 2.2 安装 CocoaPods

```bash
sudo gem install cocoapods
pod --version  # 应输出 1.15+
```

### 2.3 安装 Node.js

```bash
# 用 Homebrew 安装（推荐）
brew install node
node --version  # 应输出 v18+
```

### 2.4 添加 Apple ID 到 Xcode

1. 打开 Xcode → Settings (Cmd+,) → Accounts
2. 点 "+" → 添加你的 Apple ID
3. 登录后会在 "Personal Team" 下显示你的账号

---

## 三、一键构建

### 3.1 获取项目代码

```bash
git clone <你的仓库地址>
cd 猫咪动画改造游戏
npm install
```

### 3.2 执行构建

```bash
# Debug 构建（真机调试，用免费 Apple ID）
chmod +x cordova-ios-build.sh
./cordova-ios-build.sh --debug

# Release 构建（App Store 上架，需付费账号）
./cordova-ios-build.sh --release
```

脚本会自动完成：
1. 创建 Cordova 项目
2. 添加 iOS 平台（cordova-ios 7.1.1）
3. 注入 iOS 配置（部署目标、WKWebView、启动屏等）
4. 用 Rollup + Babel 打包游戏代码为 ES5 兼容的 `app.js`
5. 复制 `cordova-index.html` 并注入调试标志
6. 运行 `cordova prepare ios`
7. 手动同步 `index.html` + `app.js` 到 iOS 项目
8. 修补 `Info.plist`（出口合规声明）
9. 执行 `cordova build ios`

构建成功后输出：
```
=== iOS debug BUILD COMPLETE ===

Xcode project: /path/to/cordova-ios-build/platforms/ios/CatHuntingGame.xcworkspace
```

---

## 四、在 Xcode 中签名并运行

### 4.1 打开 Xcode 项目

```bash
open cordova-ios-build/platforms/ios/CatHuntingGame.xcworkspace
```

> **必须打开 `.xcworkspace`，不是 `.xcodeproj`。** 后者缺少 CocoaPods 依赖。

### 4.2 配置签名

1. 左侧导航选择 `CatHuntingGame` 项目
2. 选择 `CatHuntingGame` Target
3. 切到 **Signing & Capabilities** 标签
4. 勾选 **Automatically manage signing**
5. Team 下拉选择你的 **Personal Team**（免费 Apple ID）
6. 如果提示 "Failed to register bundle identifier"，修改 Bundle Identifier 为唯一值，如 `com.yourname.cathunting`

### 4.3 连接设备并运行

1. 用 USB 线连接 iPhone/iPad 到 Mac
2. 在 Xcode 顶部设备下拉菜单中选择你的设备
3. 首次需要在设备上信任开发者：
   - iPhone 设置 → 通用 → VPN与设备管理 → 点击你的 Apple ID → 信任
4. 点击 ▶️ Run（Cmd+R）编译并安装到设备

### 4.4 验证游戏功能

安装后应自动启动，验证：
- [ ] 主菜单显示"游戏模式"和"动画模式"按钮
- [ ] 点击"游戏模式"进入 60 秒捕猎
- [ ] 点击屏幕能捕获目标，得分增加
- [ ] 点击"动画模式"选择时长后开始播放
- [ ] "返回菜单"按钮能回到主菜单

---

## 五、App Store 上架（需 $99/年账号）

### 5.1 Archive 打包

```bash
# 1. 先运行 release 构建
./cordova-ios-build.sh --release

# 2. 在 Xcode 中 Archive
open cordova-ios-build/platforms/ios/CatHuntingGame.xcworkspace
# Xcode → Product → Archive
```

### 5.2 导出 IPA

1. Archive 完成后自动打开 Organizer
2. 选择最新 Archive → **Distribute App**
3. 选择 **App Store Connect** → **Upload**
4. 按提示完成上传

### 5.3 App Store Connect

1. 登录 [App Store Connect](https://appstoreconnect.apple.com/)
2. 我的 App → 新建 App
3. 填写名称、语言、Bundle ID、SKU
4. 上传构建版本（从 Xcode 上传的会自动出现）
5. 填写截图、描述、关键词等信息
6. 提交审核

---

## 六、应用图标

iOS 需要一个 1024×1024 的 PNG 图标。cordova-ios 7+ 会自动从 1024 生成所有其他尺寸。

### 6.1 准备图标

1. 制作一个 1024×1024 像素的 PNG 图片（无圆角、无透明通道）
2. 放到项目的 `res/icon/ios/icon-1024.png`

### 6.2 在 config.xml 中声明

构建脚本会自动检测并添加以下配置到 `config.xml`：
```xml
<platform name="ios">
    <icon src="res/icon/ios/icon-1024.png" width="1024" height="1024" />
</platform>
```

如果未提供图标，Cordova 会使用默认图标，不影响构建。

---

## 七、常见问题

### Q1: `pod install` 失败

```bash
cd cordova-ios-build/platforms/ios
pod repo update
pod install
```

如果仍失败，删除 platforms 重新构建：
```bash
rm -rf cordova-ios-build
./cordova-ios-build.sh --debug
```

### Q2: "Building for iOS Simulator, but linking dylib built for iOS"

Xcode 15+ 模拟器架构变化导致。解决方案：
- 确保使用 cordova-ios 7.1+
- 或在 Build Settings 设置 `EXCLUDED_ARCHS[sdk=iphonesimulator*] = arm64`

### Q3: "Cannot find type 'CDVPlugin' in scope"

Swift 版本不一致。在 `platforms/ios/Podfile` 中统一：
```ruby
config.build_settings['SWIFT_VERSION'] = '5.0'
```

### Q4: 签名错误 "Failed to register bundle identifier"

Bundle ID 冲突。在 Xcode → Signing & Capabilities 中改为唯一值，如 `com.你的名字.cathunting`。

### Q5: 免费签名 7 天后过期

这是 Apple 对免费账号的限制。解决方案：
- 重新在 Xcode 中 Run 一次即可续期
- 或购买 $99/年 Apple Developer Program

### Q6: 按钮点击无反应

游戏已针对旧版 WebView 做了多重兼容处理（直接容器监听 + 全局 onclick 回退 + 触摸事件）。iOS WKWebView（Safari 13+）完全支持这些机制。如果仍有问题：
1. 用 USB 连接 iPhone，在 Mac 上打开 Safari → Develop → 你的设备
2. 查看 Console 是否有 JS 错误
3. 检查底部 `#debugLog` 面板（debug 构建会显示）

---

## 八、无 Mac 替代方案

### GitHub Actions（云构建）

在仓库中添加 `.github/workflows/ios-build.yml`：

```yaml
name: iOS Build
on:
  workflow_dispatch:
jobs:
  build:
    runs-on: macos-15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm install
      - run: chmod +x cordova-ios-build.sh
      - run: ./cordova-ios-build.sh --debug
      - uses: actions/upload-artifact@v4
        with:
          name: ios-app
          path: cordova-ios-build/platforms/ios/
```

> 注意：GitHub Actions 无法签名，生成的 App 只能在模拟器运行。真机签名需要在 Mac 上配置证书。

### 云 Mac 服务

| 服务 | 价格 | 特点 |
|------|------|------|
| MacStadium | $30+/月 | 专属 Mac，可远程桌面 |
| MacInCloud | $20+/月 | 按小时租用 |
| AWS EC2 Mac | ~$1/小时 | 按需启动，最低租24小时 |
| GitHub Actions | 免费2000分钟/月 | 无 Mac 硬件首选 |
