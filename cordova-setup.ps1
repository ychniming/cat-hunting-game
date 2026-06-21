# Cordova Android Build Script for Cat Hunting Game
# Usage: .\cordova-setup.ps1 [-BuildDir "C:\cordova-build"] [-Release]
# Prerequisites: Node.js, JDK 17, Android SDK, Cordova CLI

param(
    [string]$ProjectDir = $PSScriptRoot,
    [string]$BuildDir = "$ProjectDir\cordova-build",
    [switch]$Release = $true,
    [string]$Keystore = "$BuildDir\cat-game-release.keystore",
    [string]$KeyAlias = "catgame",
    [string]$StorePass = $env:CAT_KEYSTORE_STOREPASS,
    [string]$KeyPass = $env:CAT_KEYSTORE_KEYPASS,
    [string]$DebugKeystore = "$BuildDir\cat-game-debug.keystore",
    [string]$DebugKeyAlias = "catgamedebug",
    [string]$DebugStorePass = $env:CAT_DEBUG_KEYSTORE_STOREPASS,
    [string]$DebugKeyPass = $env:CAT_DEBUG_KEYSTORE_KEYPASS
)

# Backwards compatibility: if no env vars and no explicit password, fall back to the
# original development keystore password. For production builds, set CAT_KEYSTORE_STOREPASS
# and CAT_KEYSTORE_KEYPASS environment variables.
if (-not $StorePass) { $StorePass = "catgame123" }
if (-not $KeyPass) { $KeyPass = "catgame123" }
if (-not $DebugStorePass) { $DebugStorePass = "catgame123" }
if (-not $DebugKeyPass) { $DebugKeyPass = "catgame123" }
if (-not ($env:CAT_KEYSTORE_STOREPASS -or $env:CAT_KEYSTORE_KEYPASS)) {
    Write-Warning "Using hardcoded fallback keystore password. Set CAT_KEYSTORE_STOREPASS and CAT_KEYSTORE_KEYPASS for production builds."
}

# --- Environment Setup ---
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$env:ANDROID_HOME = "$ProjectDir\android-sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:GRADLE_USER_HOME = "$ProjectDir\.gradle"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\build-tools\36.0.0;$ProjectDir\gradle\gradle-8.14.2\bin;" + [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

Write-Host "=== Cordova Android Build ===" -ForegroundColor Cyan
Write-Host "Project: $ProjectDir"
Write-Host "Build:   $BuildDir"
Write-Host "Release: $Release"

# --- Ensure Node dependencies (Babel/Rollup) are installed ---
if (-not (Test-Path "$ProjectDir\node_modules\@rollup\plugin-babel")) {
    Write-Host "[0/7] Installing Node dependencies..." -ForegroundColor Yellow
    Set-Location $ProjectDir
    npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    Write-Host "      Node dependencies installed" -ForegroundColor Green
}

# --- Step 1: Create or update Cordova project ---
if (-not (Test-Path "$BuildDir\platforms\android")) {
    Write-Host "`n[1/7] Creating Cordova project..." -ForegroundColor Yellow
    if (Test-Path $BuildDir) { Remove-Item $BuildDir -Recurse -Force }
    npx --yes cordova@12 create $BuildDir com.catgame.hunting CatHuntingGame 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "cordova create failed" }
} else {
    Write-Host "`n[1/7] Cordova project exists, skipping create" -ForegroundColor Green
}

Set-Location $BuildDir

# --- Step 2: Add Android platform if needed ---
if (-not (Test-Path "$BuildDir\platforms\android")) {
    Write-Host "[2/7] Adding Android platform (v12 for API 22 compat)..." -ForegroundColor Yellow
    npx --yes cordova@12 platform add android@12 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "cordova platform add failed" }
} else {
    Write-Host "[2/7] Android platform exists, skipping add" -ForegroundColor Green
}

# Ensure minSdk is set to 22 for Android 5.1+ / Android TV 6.0 compatibility
$configPath = "$BuildDir\config.xml"
[xml]$config = Get-Content $configPath -Encoding UTF8
$existingPref = $config.widget.preference | Where-Object { $_.name -eq "android-minSdkVersion" }
if ($existingPref) {
    if ($existingPref.value -ne "22") {
        $existingPref.SetAttribute("value", "22")
        $config.Save($configPath)
        Write-Host "      Updated minSdkVersion to 22" -ForegroundColor Green
    } else {
        Write-Host "      minSdkVersion already 22" -ForegroundColor Green
    }
} else {
    $pref = $config.CreateElement("preference")
    $pref.SetAttribute("name", "android-minSdkVersion")
    $pref.SetAttribute("value", "22")
    $config.widget.AppendChild($pref) | Out-Null
    $config.Save($configPath)
    Write-Host "      Set minSdkVersion to 22" -ForegroundColor Green
}

# --- Step 3: Bundle game JS for Cordova (IIFE + Babel ES5 transpile) ---
Write-Host "[3/7] Bundling game JS with Rollup + Babel..." -ForegroundColor Yellow
if (Test-Path "$BuildDir\www\src") { Remove-Item "$BuildDir\www\src" -Recurse -Force }
Copy-Item "$ProjectDir\src" "$BuildDir\www\src" -Recurse -Force
npx --yes rollup -c "$ProjectDir\rollup.config.mjs" 2>&1 | Tee-Object -FilePath "$BuildDir\rollup.log"
if ($LASTEXITCODE -ne 0) { throw "Rollup bundle failed" }
if (-not (Test-Path "$BuildDir\www\app.js")) {
    throw "Rollup bundle failed: app.js not generated. See $BuildDir\rollup.log"
}
Write-Host "      Generated app.js ($([math]::Round((Get-Item "$BuildDir\www\app.js").Length / 1KB, 1)) KB)" -ForegroundColor Green

# Copy Cordova-specific index.html (uses app.js + cordova.js)
Copy-Item "$ProjectDir\cordova-index.html" "$BuildDir\www\index.html" -Force
Write-Host "      Copied Cordova index.html" -ForegroundColor Green

# Inject runtime debug flag so release builds hide the on-screen debug panel.
$debugFlag = if ($Release) { 'false' } else { 'true' }
$indexHtmlPath = "$BuildDir\www\index.html"
$indexHtml = Get-Content $indexHtmlPath -Raw -Encoding UTF8
if ($indexHtml -notmatch '__CAT_DEBUG__') {
    $indexHtml = $indexHtml -replace '(<script src="cordova\.js"></script>)', "`$1`n    <script>window.__CAT_DEBUG__ = $debugFlag;</script>"
    [System.IO.File]::WriteAllText($indexHtmlPath, $indexHtml, [System.Text.Encoding]::UTF8)
    Write-Host "      Injected __CAT_DEBUG__=$debugFlag" -ForegroundColor Green
} else {
    Write-Host "      __CAT_DEBUG__ already injected" -ForegroundColor Green
}

# --- Step 3b: Patch Cordova's FileUpdater to work around Node fs.cpSync bug on Windows with non-ASCII paths ---
Write-Host "[3b/7] Patching Cordova FileUpdater for Node fs.cpSync bug..." -ForegroundColor Yellow
$fileUpdaterPath = "$BuildDir\node_modules\cordova-common\src\FileUpdater.js"
if (Test-Path $fileUpdaterPath) {
    $fileUpdater = Get-Content $fileUpdaterPath -Raw -Encoding UTF8
    if ($fileUpdater -match 'fs\.cpSync\(path\.join\(rootDir, sourcePath\), targetFullPath, \{ recursive: true \}\)') {
        $fileUpdater = $fileUpdater -replace 'fs\.cpSync\(path\.join\(rootDir, sourcePath\), targetFullPath, \{ recursive: true \}\)', @"
        // Workaround for Node.js fs.cpSync bug on Windows with non-ASCII paths,
        // which incorrectly throws "The operation completed successfully" (ERROR_SUCCESS).
        fs.copyFileSync(path.join(rootDir, sourcePath), targetFullPath)
"@
        [System.IO.File]::WriteAllText($fileUpdaterPath, $fileUpdater, [System.Text.Encoding]::UTF8)
        Write-Host "      Patched FileUpdater.js" -ForegroundColor Green
    } else {
        Write-Host "      FileUpdater.js already patched or unchanged" -ForegroundColor Green
    }
} else {
    Write-Warning "      FileUpdater.js not found; cordova prepare may fail on non-ASCII paths"
}

# --- Step 4: Cordova prepare ---
Write-Host "[4/7] Running cordova prepare..." -ForegroundColor Yellow
cordova prepare android --verbose 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "cordova prepare failed" }

# --- Step 5: MANUAL SYNC - Cordova prepare skips index.html ---
Write-Host "[5/7] Manual sync: forcing index.html + app.js into assets/www/..." -ForegroundColor Yellow
$assetsWww = "$BuildDir\platforms\android\app\src\main\assets\www"
python -c @"
import shutil, os
# Sync index.html
src = r'$BuildDir\www\index.html'
dst = r'$assetsWww\index.html'
shutil.copy2(src, dst)
print('  index.html synced')
# Sync bundled app.js
appSrc = r'$BuildDir\www\app.js'
appDst = os.path.join(r'$assetsWww', 'app.js')
if os.path.exists(appSrc):
    shutil.copy2(appSrc, appDst)
    print(f'  app.js synced ({os.path.getsize(appSrc)} bytes)')
else:
    print('  WARNING: app.js not found!')
# Remove default template artifacts and raw ES6 sources
for d in ['css', 'js', 'img', 'src']:
    p = os.path.join(r'$assetsWww', d)
    if os.path.exists(p):
        shutil.rmtree(p)
        print(f'  Removed {d}/')
"@ 2>&1

# Verify
$firstLine = (Get-Content "$assetsWww\index.html" -Head 1).Trim()
if ($firstLine -ne "<!DOCTYPE html>") {
    throw "CRITICAL: assets/www/index.html is still the Cordova default template!"
}
if (-not (Test-Path "$assetsWww\app.js")) {
    throw "CRITICAL: assets/www/app.js is missing!"
}
Write-Host "      Verified: assets/www has game page + bundled app.js" -ForegroundColor Green

# --- Step 5b: PATCH AndroidManifest.xml for TV compatibility ---
Write-Host "[5b/7] Patching AndroidManifest.xml for TV..." -ForegroundColor Yellow
$manifestPath = "$BuildDir\platforms\android\app\src\main\AndroidManifest.xml"
$manifest = Get-Content $manifestPath -Raw

# Add touchscreen not-required before <application>
if ($manifest -notmatch 'android\.hardware\.touchscreen') {
    $manifest = $manifest -replace '(<application)', "<uses-feature android:name=`"android.hardware.touchscreen`" android:required=`"false`" />`n    `$1"
    Write-Host "      Added touchscreen not-required" -ForegroundColor Green
}

# Add leanback not-required before <application>
if ($manifest -notmatch 'android\.software\.leanback') {
    $manifest = $manifest -replace '(<application)', "<uses-feature android:name=`"android.software.leanback`" android:required=`"false`" />`n    `$1"
    Write-Host "      Added leanback not-required" -ForegroundColor Green
}

# Add LEANBACK_LAUNCHER intent filter to MainActivity if not present
if ($manifest -notmatch 'LEANBACK_LAUNCHER') {
    $leanbackFilter = @"
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
"@
    $manifest = $manifest -replace '(</activity>)', "$leanbackFilter`n        `$1"
    Write-Host "      Added LEANBACK_LAUNCHER intent filter" -ForegroundColor Green
}

# Write manifest without UTF-8 BOM to avoid Android parser issues
[System.IO.File]::WriteAllText($manifestPath, $manifest, [System.Text.Encoding]::UTF8)
Write-Host "      Manifest patched for TV compatibility" -ForegroundColor Green

# --- Step 5c: PATCH gradle.properties for non-ASCII path support ---
Write-Host "[5c/7] Patching gradle.properties for Chinese path..." -ForegroundColor Yellow
$gradlePropsPath = "$BuildDir\platforms\android\gradle.properties"
$gradleProps = Get-Content $gradlePropsPath -Raw
if ($gradleProps -notmatch 'android\.overridePathCheck') {
    Add-Content $gradlePropsPath "`nandroid.overridePathCheck=true" -Encoding UTF8
    Write-Host "      Added android.overridePathCheck=true" -ForegroundColor Green
} else {
    Write-Host "      Path check override already exists" -ForegroundColor Green
}

# --- Step 6: Build APK ---
Write-Host "[6/7] Building APK..." -ForegroundColor Yellow
Set-Location "$BuildDir\platforms\android"
$gradleTask = if ($Release) { 'assembleRelease' } else { 'assembleDebug' }

# Prefer the project's Gradle wrapper, fall back to system gradle if absent.
$gradlew = if ($IsWindows -or $env:OS -eq 'Windows_NT') { '.\\gradlew.bat' } else { './gradlew' }
if (Test-Path $gradlew) {
    Write-Host "      Using Gradle wrapper: $gradlew" -ForegroundColor Green
    & $gradlew $gradleTask --no-daemon 2>&1
} else {
    Write-Host "      Gradle wrapper not found, using system gradle" -ForegroundColor Yellow
    gradle $gradleTask --no-daemon 2>&1
}
if ($LASTEXITCODE -ne 0) { throw "Gradle build failed" }

# --- Step 6b: Patch built APK with latest www/index.html and app.js ---
Write-Host "[6b/7] Patching built APK with latest www assets..." -ForegroundColor Yellow
$builtApk = if ($Release) {
    "$BuildDir\platforms\android\app\build\outputs\apk\release\app-release-unsigned.apk"
} else {
    "$BuildDir\platforms\android\app\build\outputs\apk\debug\app-debug.apk"
}
$patchedApk = "$BuildDir\platforms\android\app\build\outputs\apk\app-patched.apk"
$zipalign = "$env:ANDROID_HOME\build-tools\36.0.0\zipalign.exe"

python -c @"
import zipfile, os, subprocess, sys
src_apk = r'$builtApk'
dst_apk = r'$patchedApk'
www_dir = r'$BuildDir\www'
if not os.path.exists(src_apk):
    print('ERROR: built APK not found at', src_apk)
    sys.exit(1)
with zipfile.ZipFile(src_apk, 'r') as zin:
    with zipfile.ZipFile(dst_apk, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == 'assets/www/index.html':
                with open(os.path.join(www_dir, 'index.html'), 'rb') as f:
                    data = f.read()
                print('  Patched index.html')
            elif item.filename == 'assets/www/app.js':
                with open(os.path.join(www_dir, 'app.js'), 'rb') as f:
                    data = f.read()
                print('  Patched app.js')
            zout.writestr(item, data)
aligned_apk = dst_apk + '.aligned'
subprocess.run([r'$zipalign', '-p', '-f', '4', dst_apk, aligned_apk], check=True)
os.replace(aligned_apk, dst_apk)
print('  APK aligned')
"@ 2>&1
if ($LASTEXITCODE -ne 0) { throw "APK patching failed" }

# --- Step 7: Sign / finalize APK ---
$outputApk = $null
if ($Release) {
    if (-not $StorePass -or -not $KeyPass) {
        throw "Release build requires CAT_KEYSTORE_STOREPASS and CAT_KEYSTORE_KEYPASS environment variables (or pass -StorePass/-KeyPass)"
    }

    Write-Host "[7/7] Signing Release APK..." -ForegroundColor Yellow
    $signed = "$BuildDir\platforms\android\app\build\outputs\apk\release\app-release.apk"

    if (-not (Test-Path $Keystore)) {
        Write-Host "      Generating new keystore..." -ForegroundColor Yellow
        keytool -genkeypair -v -keystore $Keystore -alias $KeyAlias -keyalg RSA -keysize 2048 -validity 10000 -storepass $StorePass -keypass $KeyPass -dname "CN=Cat Game" 2>&1 | Out-Null
    }

    apksigner sign --ks $Keystore --ks-key-alias $KeyAlias --ks-pass pass:$StorePass --key-pass pass:$KeyPass --out $signed $patchedApk 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "APK signing failed" }

    $outputApk = "$ProjectDir\cat-hunting-game-v1.0.0-release.apk"
    Copy-Item $signed $outputApk -Force
    $size = [math]::Round((Get-Item $outputApk).Length / 1MB, 2)
    Write-Host "`n=== BUILD SUCCESS ===" -ForegroundColor Green
    Write-Host "Output: $outputApk ($size MB)" -ForegroundColor Green
} else {
    Write-Host "[7/7] Signing Debug APK..." -ForegroundColor Yellow
    $signed = "$BuildDir\platforms\android\app\build\outputs\apk\debug\app-debug-signed.apk"

    if (-not (Test-Path $DebugKeystore)) {
        Write-Host "      Generating new debug keystore..." -ForegroundColor Yellow
        keytool -genkeypair -v -keystore $DebugKeystore -alias $DebugKeyAlias -keyalg RSA -keysize 2048 -validity 10000 -storepass $DebugStorePass -keypass $DebugKeyPass -dname "CN=Cat Game Debug" 2>&1 | Out-Null
    }

    apksigner sign --ks $DebugKeystore --ks-key-alias $DebugKeyAlias --ks-pass pass:$DebugStorePass --key-pass pass:$DebugKeyPass --out $signed $patchedApk 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Debug APK signing failed" }

    $outputApk = "$ProjectDir\cat-hunting-game-v1.0.0-debug.apk"
    Copy-Item $signed $outputApk -Force
    $size = [math]::Round((Get-Item $outputApk).Length / 1MB, 2)
    Write-Host "`n=== DEBUG BUILD SUCCESS ===" -ForegroundColor Green
    Write-Host "Output: $outputApk ($size MB)" -ForegroundColor Green
}

Write-Host "`nNext steps:"
Write-Host "  1. Install APK on device: adb install '$outputApk'"
Write-Host "  2. Or copy to USB for TV installation"
Write-Host "  3. If crash persists, capture logs: adb logcat -d | findstr /i catgame"
Set-Location $ProjectDir
