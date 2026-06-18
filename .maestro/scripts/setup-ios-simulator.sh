#!/bin/bash
set -euo pipefail

DEVICE_TYPE="com.apple.CoreSimulator.SimDeviceType.iPhone-17"
IOS_VERSION="26.2"
RUNTIME="com.apple.CoreSimulator.SimRuntime.iOS-$(echo "$IOS_VERSION" | tr '.' '-')"
RUNTIME_LABEL="iOS $IOS_VERSION"
DEVICE_NAME="iPhone17-iOS${IOS_VERSION}-Enriched"

if ! xcrun simctl list runtimes | grep -q "$RUNTIME"; then
  echo "Error: $RUNTIME_LABEL runtime not found."
  echo "Install it in Xcode."
  exit 1
fi

if ! xcrun simctl list devices | grep -q "$DEVICE_NAME ("; then
  echo "Creating simulator '$DEVICE_NAME'..."
  xcrun simctl create "$DEVICE_NAME" "$DEVICE_TYPE" "$RUNTIME"
fi

UDID=$(xcrun simctl list devices | grep "$DEVICE_NAME (" | head -1 | grep -oE '[A-F0-9-]{36}')

if [ -z "$UDID" ]; then
  echo "Error: Could not find UDID for '$DEVICE_NAME'"
  exit 1
fi

# disable automatic text manipulation: auto-correction, spelling-check and auto-capitalization
SIM_PREFS_DIR="$HOME/Library/Developer/CoreSimulator/Devices/$UDID/data/Library/Preferences"
mkdir -p "$SIM_PREFS_DIR"

PLIST="$SIM_PREFS_DIR/com.apple.keyboard.preferences.plist"

/usr/libexec/PlistBuddy -c "Add :KeyboardAutocorrection bool false" "$PLIST" 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Set :KeyboardAutocorrection bool false" "$PLIST"

/usr/libexec/PlistBuddy -c "Add :KeyboardCheckSpelling bool false" "$PLIST" 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Set :KeyboardCheckSpelling bool false" "$PLIST"

/usr/libexec/PlistBuddy -c "Add :KeyboardAutocapitalization bool false" "$PLIST" 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Set :KeyboardAutocapitalization bool false" "$PLIST"

STATE=$(xcrun simctl list devices | grep "$UDID" | grep -oE '\(Booted\)|\(Shutdown\)' || true)
if [ "$STATE" != "(Booted)" ]; then
  echo "Booting '$DEVICE_NAME' ($UDID)..."
  xcrun simctl boot "$UDID"
fi

open -a Simulator

echo "Simulator ready: $DEVICE_NAME ($UDID)"
echo "DEVICE_ID=$UDID"
