#!/bin/bash
# build-ios-app.sh - build the example app for the iOS simulator.
#
# Debug by default: the app loads its JS bundle from Metro, so one build serves
# every JS change, and CI caches it by a hash of the native code (see
# e2e-argent.yml). CONFIGURATION=Release embeds the bundle instead. Needs macOS
# with Xcode. Logs go to stderr; stdout gets `APP_PATH=<path>`.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
IOS_DIR="$REPO_ROOT/apps/example/ios"
DERIVED_DATA="$IOS_DIR/build/argent"
CONFIGURATION="${CONFIGURATION:-Debug}"
APP_PATH="$DERIVED_DATA/Build/Products/${CONFIGURATION}-iphonesimulator/EnrichedTextInputExample.app"

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "Error: xcodebuild not found. Building the iOS app needs macOS with Xcode." >&2
  exit 1
fi

if [ ! -d "$IOS_DIR/Pods" ]; then
  echo "=== Installing pods ===" >&2
  (cd "$IOS_DIR" && pod install) >&2
fi

echo "=== Building EnrichedTextInputExample ($CONFIGURATION, iphonesimulator) ===" >&2
# The hosted machines are Apple Silicon, so arm64 is the only slice we need.
xcodebuild \
  -workspace "$IOS_DIR/EnrichedTextInputExample.xcworkspace" \
  -scheme EnrichedTextInputExample \
  -configuration "$CONFIGURATION" \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath "$DERIVED_DATA" \
  ARCHS=arm64 ONLY_ACTIVE_ARCH=NO COMPILER_INDEX_STORE_ENABLE=NO \
  build >&2

[ -d "$APP_PATH" ] || { echo "Error: build finished but $APP_PATH is missing" >&2; exit 1; }
echo "APP_PATH=$APP_PATH"
