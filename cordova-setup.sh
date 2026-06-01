#!/bin/bash
# Cordova Android 打包脚本

echo "=== 猫咪捕猎游戏 - Android 打包 ==="

# 安装依赖
npm install -g cordova

# 创建 Cordova 项目
cordova create cordova-app com.example.catgame "猫咪捕猎游戏"
cd cordova-app

# 添加 Android 平台
cordova platform add android

# 复制游戏文件到 www 目录
cp ../index.html www/
cp ../game.js www/
cp ../manifest.json www/
cp ../sw.js www/

# 修改 config.xml 添加全屏和横屏
cat > config.xml << 'EOF'
<?xml version='1.0' encoding='utf-8'?>
<widget id="com.example.catgame" version="1.0.0" xmlns="http://www.w3.org/ns/widgets">
    <name>猫咪捕猎游戏</name>
    <description>给猫咪玩的互动捕猎游戏</description>
    <author email="" href="">Cat Game Developer</author>
    <content src="index.html" />
    <access origin="*" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    <preference name="Fullscreen" value="true" />
    <preference name="Orientation" value="landscape" />
    <preference name="BackgroundColor" value="0xFFF5F0E8" />
    <preference name="KeepRunning" value="true" />
    <preference name="AndroidLaunchMode" value="singleTop" />
    <platform name="android">
        <allow-intent href="market:*" />
        <preference name="AndroidWindowSplashScreenAnimatedIcon" value="res/icon.png" />
        <preference name="AndroidWindowSplashScreenBackground" value="#f5f0e8" />
    </platform>
</widget>
EOF

# 构建 APK
cordova build android

echo "=== 构建完成 ==="
echo "APK 路径: platforms/android/app/build/outputs/apk/debug/app-debug.apk"
