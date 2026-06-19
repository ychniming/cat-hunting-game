# ADR-0014: Cordova Android Build with Out-of-Tree Project

## Status

Accepted

## Context

The game project needs to be packaged as an Android APK for distribution. The project is a pure frontend Canvas game with no build tools, using ES modules directly in the browser. We need a packaging solution that:

1. Wraps the web app in a native Android shell
2. Supports landscape orientation and fullscreen mode
3. Generates a signed release APK
4. Doesn't pollute the source tree with build artifacts

## Decision

Use Apache Cordova (cordova-android@15.0.0) with an **out-of-tree build directory** strategy:

- The Cordova project is created in a non-Chinese-path directory (`C:\Users\...\cat-game-build`) separate from the source tree
- Game files are copied to the Cordova `www/` directory via `cordova prepare`
- The source tree only contains `cordova-setup.ps1` as a reference script
- Build artifacts (android-sdk/, gradle/, *.apk, *.keystore) are excluded via `.gitignore`

### Build Configuration

| Property | Value | Rationale |
|----------|-------|-----------|
| Package ID | `com.catgame.hunting` | Reverse domain convention |
| minSdkVersion | 24 (Android 7.0) | Covers 98%+ of devices |
| targetSdkVersion | 36 (Android 16) | Latest API level requirement |
| compileSdkVersion | 36 | Match target SDK |
| Orientation | landscape | Game designed for wide screens |
| Fullscreen | true | Immersive gameplay |
| Permissions | INTERNET, WAKE_LOCK | Minimal permissions; WAKE_LOCK keeps screen on |

### Signing

- Self-signed RSA 2048-bit key, validity 10000 days
- Keystore stored outside source tree, excluded from git
- Release APK signed via `apksigner` (build-tools/36.0.0)

## Consequences

### Positive

- Source tree remains clean; no Android build files in version control
- Standard Cordova workflow; any developer can rebuild by following README
- Chinese path issues avoided by using out-of-tree build directory
- Minimal permissions reduce user privacy concerns

### Negative

- Two-step build process: copy files to www, then build
- Out-of-tree directory means build config isn't version-controlled directly
- Self-signed certificate won't work for Google Play (requires Google Play App Signing)
- Chinese app name may display incorrectly on some devices (aapt encoding)

### Mitigation

- README.md documents the complete build process with exact commands
- config.xml in the Cordova project captures all Android configuration
- For Play Store distribution, migrate to Google Play App Signing
