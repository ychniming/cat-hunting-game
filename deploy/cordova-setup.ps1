# Cordova Android 打包脚本 (PowerShell)

Write-Host "=== 猫咪捕猎游戏 - Android 打包 ===" -ForegroundColor Green

# 检查 Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 安装 Cordova
npm install -g cordova

# 创建 Cordova 项目
if (Test-Path "cordova-app") {
    Remove-Item -Recurse -Force "cordova-app"
}

cordova create cordova-app com.example.catgame "猫咪捕猎游戏"
Set-Location cordova-app

# 添加 Android 平台
cordova platform add android

# 复制游戏文件
Copy-Item ../index.html www/
Copy-Item ../game.js www/
Copy-Item ../manifest.json www/
Copy-Item ../sw.js www/

# 创建 config.xml
$configXml = @"
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
        <preference name="AndroidWindowSplashScreenBackground" value="#f5f0e8" />
    </platform>
</widget>
"@

Set-Content -Path "config.xml" -Value $configXml -Encoding UTF8

# 构建 APK
Write-Host "=== 开始构建 APK ===" -ForegroundColor Yellow
cordova build android

Write-Host "=== 构建完成 ===" -ForegroundColor Green
Write-Host "APK 路径: platforms/android/app/build/outputs/apk/debug/app-debug.apk"

Set-Location ..
