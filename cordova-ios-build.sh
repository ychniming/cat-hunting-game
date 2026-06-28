#!/usr/bin/env bash
# Cordova iOS Build Script for Cat Hunting Game
# Usage: ./cordova-ios-build.sh [--release] [--debug]
# Prerequisites: macOS, Xcode 16+, Node.js 18+, CocoaPods 1.15+
#
# This script MUST be run on macOS. It cannot build iOS on Windows.
# See docs/ios-build-guide.md for setup instructions.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$PROJECT_DIR/cordova-ios-build"
RELEASE=false

# --- Parse arguments ---
for arg in "$@"; do
    case "$arg" in
        --release) RELEASE=true ;;
        --debug)   RELEASE=false ;;
        *) echo "Unknown argument: $arg"; echo "Usage: $0 [--release|--debug]"; exit 1 ;;
    esac
done

# --- Verify macOS ---
if [[ "$(uname)" != "Darwin" ]]; then
    echo "ERROR: iOS builds require macOS with Xcode. Current OS: $(uname)"
    echo "See docs/ios-build-guide.md for alternatives (cloud Mac, GitHub Actions)."
    exit 1
fi

# --- Verify Xcode ---
if ! command -v xcodebuild &>/dev/null; then
    echo "ERROR: Xcode Command Line Tools not found."
    echo "Install via: xcode-select --install"
    exit 1
fi

# --- Verify CocoaPods ---
if ! command -v pod &>/dev/null; then
    echo "ERROR: CocoaPods not found."
    echo "Install via: sudo gem install cocoapods"
    exit 1
fi

# --- Verify Node ---
if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js not found. Install Node.js 18+."
    exit 1
fi

echo "=== Cordova iOS Build ==="
echo "Project: $PROJECT_DIR"
echo "Build:   $BUILD_DIR"
echo "Release: $RELEASE"
echo ""

# --- Ensure Node dependencies ---
if [ ! -d "$PROJECT_DIR/node_modules/@rollup/plugin-babel" ]; then
    echo "[0/6] Installing Node dependencies..."
    cd "$PROJECT_DIR"
    npm install
    echo "      Node dependencies installed"
fi

# --- Step 1: Create or update Cordova project ---
if [ ! -d "$BUILD_DIR/platforms/ios" ]; then
    echo "[1/6] Creating Cordova project..."
    rm -rf "$BUILD_DIR"
    npx --yes cordova@12 create "$BUILD_DIR" com.catgame.hunting CatHuntingGame
    echo "      Cordova project created"
else
    echo "[1/6] Cordova project exists, skipping create"
fi

cd "$BUILD_DIR"

# --- Step 2: Add iOS platform ---
if [ ! -d "$BUILD_DIR/platforms/ios" ]; then
    echo "[2/6] Adding iOS platform (cordova-ios 7.1+)..."
    npx --yes cordova@12 platform add ios@7.1.1
    echo "      iOS platform added"
else
    echo "[2/6] iOS platform exists, skipping add"
fi

# --- Step 3: Inject iOS preferences into config.xml ---
echo "[3/6] Configuring iOS preferences..."
CONFIG_PATH="$BUILD_DIR/config.xml"

# Use Python to safely patch config.xml (avoid sed encoding issues on macOS)
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import sys

config_path = sys.argv[1] if len(sys.argv) > 1 else "config.xml"
tree = ET.parse(config_path)
root = tree.getroot()

# Namespace prefix used by Cordova config.xml
ns = "http://www.w3.org/ns/widgets"
ET.register_namespace("", ns)

# iOS preferences to inject
ios_prefs = {
    "deployment-target": "13.0",
    "target-device": "universal",
    "TopActivityIndicator": "gray",
    "EnableViewportScale": "false",
    "StatusBarOverlaysWebView": "true",
    "StatusBarStyle": "lightcontent",
    "BackupWebStorage": "none",
    "DisallowOverscroll": "true",
    "Orientation": "all",
    "CordovaWebViewEngine": "CDVWKWebViewEngine",
    "ScrollEnabled": "false",
    "SuppressesIncrementalRendering": "true",
    "SplashScreenDelay": "500",
    "FadeSplashScreen": "true",
    "FadeSplashScreenDuration": "300",
    "ShowSplashScreenSpinner": "false",
}

# Find or create <platform name="ios"> element
ios_platform = None
for plat in root.findall(f"{{{ns}}}platform"):
    if plat.get("name") == "ios":
        ios_platform = plat
        break

if ios_platform is None:
    ios_platform = ET.SubElement(root, "platform")
    ios_platform.set("name", "ios")

# Inject preferences into <platform name="ios"> (only if not already present)
for name, value in ios_prefs.items():
    existing = None
    for pref in ios_platform.findall(f"{{{ns}}}preference"):
        if pref.get("name") == name:
            existing = pref
            break
    if existing is None:
        pref = ET.SubElement(ios_platform, "preference")
        pref.set("name", name)
        pref.set("value", value)

# Add ITSAppUsesNonExemptEncryption=false to avoid export compliance prompt
# via a config-file entry (Cordova iOS reads <access> and <allow-intent>)
# This is handled via the Info.plist patching step below.

# Add allow-navigation for local content (same as Android)
allow_nav = None
for an in root.findall(f"{{{ns}}}allow-navigation"):
    if an.get("href") == "*":
        allow_nav = an
        break
if allow_nav is None:
    an = ET.SubElement(root, "allow-navigation")
    an.set("href", "*")

# Add access origin
access = None
for acc in root.findall(f"{{{ns}}}access"):
    if acc.get("origin") == "*":
        access = acc
        break
if access is None:
    acc = ET.SubElement(root, "access")
    acc.set("origin", "*")

tree.write(config_path, encoding="UTF-8", xml_declaration=True)
print("      iOS preferences injected")
PYEOF

# --- Step 4: Bundle game JS with Rollup + Babel ---
echo "[4/6] Bundling game JS with Rollup + Babel..."
rm -rf "$BUILD_DIR/www/src"
cp -R "$PROJECT_DIR/src" "$BUILD_DIR/www/src"
cd "$BUILD_DIR"
npx --yes rollup -c "$PROJECT_DIR/rollup.config.mjs"
if [ ! -f "$BUILD_DIR/www/app.js" ]; then
    echo "ERROR: Rollup bundle failed: app.js not generated."
    exit 1
fi
APP_JS_SIZE=$(du -h "$BUILD_DIR/www/app.js" | cut -f1)
echo "      Generated app.js ($APP_JS_SIZE)"

# Copy Cordova-specific index.html and inject debug flag
cp "$PROJECT_DIR/cordova-index.html" "$BUILD_DIR/www/index.html"
echo "      Copied Cordova index.html"

DEBUG_FLAG="true"
if [ "$RELEASE" = true ]; then
    DEBUG_FLAG="false"
fi

export BUILD_DIR DEBUG_FLAG
python3 << 'PYEOF'
import os
import re
path = os.path.join(os.environ['BUILD_DIR'], 'www', 'index.html')
debug_flag = os.environ['DEBUG_FLAG']
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()
if '__CAT_DEBUG__' not in html:
    html = re.sub(r'(<script src="cordova\.js"></script>)', r'\1\n    <script>window.__CAT_DEBUG__ = ' + debug_flag + ';</script>', html)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'      Injected __CAT_DEBUG__={debug_flag}')
else:
    print('      __CAT_DEBUG__ already injected')
PYEOF

# --- Step 5: Run cordova prepare + manual sync ---
echo "[5/6] Running cordova prepare..."
cd "$BUILD_DIR"
npx --yes cordova@12 prepare ios

# Manual sync: force index.html + app.js into platforms/ios/www/
# (same workaround as Android - cordova prepare may skip index.html)
IOS_WWW="$BUILD_DIR/platforms/ios/www"
cp "$BUILD_DIR/www/index.html" "$IOS_WWW/index.html"
cp "$BUILD_DIR/www/app.js" "$IOS_WWW/app.js"

# Remove default template artifacts
for d in css js img src; do
    rm -rf "$IOS_WWW/$d"
done

# Verify
if ! head -1 "$IOS_WWW/index.html" | grep -q "<!DOCTYPE html>"; then
    echo "ERROR: platforms/ios/www/index.html is still the Cordova default template!"
    exit 1
fi
if [ ! -f "$IOS_WWW/app.js" ]; then
    echo "ERROR: platforms/ios/www/app.js is missing!"
    exit 1
fi
echo "      Verified: platforms/ios/www has game page + bundled app.js"

# Patch Info.plist: add ITSAppUsesNonExemptEncryption=false
INFO_PLIST="$BUILD_DIR/platforms/ios/CatHuntingGame/Info.plist"
if [ -f "$INFO_PLIST" ]; then
    /usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$INFO_PLIST" 2>/dev/null || true
    echo "      Patched Info.plist (ITSAppUsesNonExemptEncryption=false)"
fi

# --- Step 6: Build ---
echo "[6/6] Building iOS app..."
cd "$BUILD_DIR"

BUILD_TYPE="debug"
if [ "$RELEASE" = true ]; then
    BUILD_TYPE="release"
fi

# cordova build ios runs pod install + xcodebuild automatically
npx --yes cordova@12 build ios --"$BUILD_TYPE" --device

echo ""
echo "=== iOS $BUILD_TYPE BUILD COMPLETE ==="
echo ""
echo "Xcode project: $BUILD_DIR/platforms/ios/CatHuntingGame.xcworkspace"
echo ""
if [ "$RELEASE" = true ]; then
    echo "Next steps for App Store distribution:"
    echo "  1. Open Xcode: open \"$BUILD_DIR/platforms/ios/CatHuntingGame.xcworkspace\""
    echo "  2. Select the CatHuntingGame target"
    echo "  3. Product → Archive"
    echo "  4. Window → Organizer → Distribute App"
    echo ""
    echo "  Or from command line:"
    echo "    xcodebuild -workspace CatHuntingGame.xcworkspace -scheme CatHuntingGame -archivePath build/CatHuntingGame.xcarchive archive"
    echo "    xcodebuild -exportArchive -archivePath build/CatHuntingGame.xcarchive -exportOptionsPlist exportOptions.plist -exportPath build/ipa"
else
    echo "Next steps for device testing:"
    echo "  1. Open Xcode: open \"$BUILD_DIR/platforms/ios/CatHuntingGame.xcworkspace\""
    echo "  2. Connect iPhone via USB"
    echo "  3. Select your device in the device dropdown"
    echo "  4. Sign in with Apple ID: Xcode → Settings → Accounts"
    echo "  5. Select your Personal Team under Signing & Capabilities"
    echo "  6. Click Run (Cmd+R)"
    echo ""
    echo "  Note: Free Apple ID builds expire after 7 days."
fi
echo ""
echo "For signing setup details, see: docs/ios-build-guide.md"
