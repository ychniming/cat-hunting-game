# ADR-0014: Cordova Android Build with In-Project Out-of-Tree Directory

## Status

Accepted

## Context

The game project needs to be packaged as an Android APK for distribution on phones and Android TV. The project is a pure frontend Canvas game written in modern ES modules (ES6+). We need a packaging solution that:

1. Wraps the web app in a native Android shell
2. Supports Android 5.1+ (API 22) phones and Android TV 6.0+
3. Generates both signed release and debug APKs
4. Keeps build artifacts out of version control
5. Works on a Windows host whose project path contains Chinese characters

## Decision

Use Apache Cordova (`cordova-android@12.0.0`) with an **in-project out-of-tree build directory** strategy:

- The Cordova project is created in `$ProjectDir/cordova-build` so it is excluded from git but still inside the project tree
- Game ES modules are bundled into a single IIFE `app.js` with Rollup + Babel, targeting Chrome 39 / Android 5.1 WebView compatibility
- Babel transpiles syntax (classes, async/await, arrow functions, etc.) and bundles its own helpers; no `core-js` runtime polyfills are included, avoiding CommonJS `require()` leakage into the browser IIFE bundle. Runtime API gaps are filled with small manual polyfills (`Element.prototype.closest`/`matches`) and ES5-compatible rewrites (`Array.from` → `slice.call`, `.includes` → `.indexOf`)
- Button interactions are protected by multiple fallbacks: direct container listeners for click/touch events, global `window._catHandleBtnClick` for inline `onclick`, and `{ passive: false }` touch handling in `InputHandler`
- `cordova prepare` is used to copy resources, followed by a manual sync step to guarantee `index.html` and `app.js` land in `assets/www/`
- The source tree only contains `cordova-setup.ps1` and `rollup.config.mjs` as build orchestration
- Build artifacts (`cordova-build/`, `android-sdk/`, `gradle/`, `*.apk`, `*.keystore`, `.gradle/`) are excluded via `.gitignore`

### Build Configuration

| Property | Value | Rationale |
|----------|-------|-----------|
| Package ID | `com.catgame.hunting` | Reverse domain convention |
| minSdkVersion | 22 (Android 5.1) | Supports the user's Android TV 6.0 and older phones |
| targetSdkVersion | 33 (Android 13) | Default for cordova-android@12; satisfies current build requirements |
| compileSdkVersion | 33 | Match target SDK |
| Orientation | default | Both phone and TV use natural orientation |
| Permissions | INTERNET | Minimal permissions |
| TV support | `LEANBACK_LAUNCHER`, touchscreen not required | Allows installation and launch on Android TV |

### Signing

- Self-signed RSA 2048-bit key, validity 10000 days
- Keystore stored inside `cordova-build/`, excluded from git
- Release APK signed via `apksigner` (build-tools/36.0.0)
- For production, set `CAT_KEYSTORE_STOREPASS` and `CAT_KEYSTORE_KEYPASS` environment variables

## Consequences

### Positive

- Source tree remains clean; build files are excluded from version control
- Single `cordova-setup.ps1` command builds and signs the APK
- ES6+ source code is transpiled to ES5-compatible output, so the game runs on old System WebViews
- TV compatibility declarations allow installation on Android TV via leanback launcher
- Build directory inside the project avoids cross-drive permission issues

### Negative

- Two-step build process: bundle JS, then Cordova build
- Self-signed certificate won't work for Google Play (requires Google Play App Signing)
- `cordova prepare` silently skips `index.html` during sync to `assets/www/`, leaving the default Cordova template in the APK
- aapt2 emits encoding warnings when SDK path contains Chinese characters (non-fatal)
- Bundled `app.js` is larger (~90 KB) because of Babel helpers

### Known Issues & Workarounds

| Issue | Root Cause | Workaround |
|-------|-----------|------------|
| App stuck on "Device is Ready" | `cordova prepare` treats `index.html` as platform-generated and refuses to overwrite it in `assets/www/` | Use Python `shutil.copy2` to manually copy `www/index.html` → `assets/www/index.html` after `cordova prepare` |
| Default template files in APK | `cordova platform add` creates `css/`, `js/`, `img/` in `assets/www/` | Delete these directories before building |
| App crashes on launch with "屡次停止运行" | Old System WebView (Android 5.1–7.0) cannot parse ES6+ syntax (`class`, `async/await`, `??`, `?.`, `const`/`let`) | Use Rollup + Babel to transpile all game JS to ES5 |
| Buttons are unresponsive after launch | Multiple compounding causes: (1) bundled `core-js` polyfills leaked CommonJS `require()` into the IIFE, causing a runtime exception before event listeners were attached; (2) document-level event delegation is unreliable on old Android WebViews; (3) global `touch-action: none` suppressed button touches; (4) canvas was stacked above buttons; (5) InputHandler touchstart was passive, making `preventDefault()` ineffective | Remove `core-js`; use Babel syntax-only transpilation; bind click/touchend/touchstart directly on button containers; set `touch-action: manipulation` on body/buttons and `touch-action: none` only on canvas; position canvas absolutely with `z-index: 1`; give buttons `position: relative`, `z-index: 1`, `pointer-events: auto`; add inline `onclick` fallback calling `window._catHandleBtnClick`; use `{ passive: false }` for InputHandler touchstart |
| Gradle wrapper not found / build error not thrown | PowerShell did not reference `gradlew.bat` in the current directory and error check was incomplete | Use `.\\gradlew.bat` and wrap build failure in `if ($LASTEXITCODE -ne 0) { throw ... }` |
| `cordova prepare` fails with "The operation completed successfully" on Windows | Node.js `fs.cpSync` bug when copying files under paths with non-ASCII characters | Patch `cordova-common/src/FileUpdater.js` to use `fs.copyFileSync` for file copies |
| aapt2 encoding warnings | Chinese characters in Android SDK / project path | Warnings are non-fatal; build succeeds with `android.overridePathCheck=true` |

### Mitigation

- README.md documents the complete build process with exact commands
- `cordova-build/config.xml` captures all Android configuration
- `rollup.config.mjs` captures the transpilation target and polyfill strategy
- Build script (`cordova-setup.ps1`) includes the manual sync, Babel bundle, FileUpdater patch, and manifest patch steps

## Verification

Latest build (2026-06-20) produced:

| APK | Size | Signing |
|-----|------|---------|
| `cat-hunting-game-v1.0.0-release.apk` | 2.55 MB | v1 (JAR), v2, v3 |
| `cat-hunting-game-v1.0.0-debug.apk` | 2.98 MB | debug signature |

`aapt dump badging` confirms:
- Package: `com.catgame.hunting`, versionCode `10000`, versionName `1.0.0`
- `sdkVersion:'22'` (Android 5.1+)
- `targetSdkVersion:'33'`
- `leanback-launchable-activity` present
- `uses-feature-not-required` for both `android.hardware.touchscreen` and `android.software.leanback`

Bundled `assets/www/app.js` contains no `const`/`let`/arrow functions/ES6 classes; Babel helpers and the `_catHandleBtnClick` fallback are present.
