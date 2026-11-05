#!/bin/bash
# repack-ios-app.sh - put this checkout's JS into a prebuilt Release simulator app.
#
# Usage: repack-ios-app.sh <source.app> <output.app>
#
# The cached Release .app (build-ios-app.sh, cached by a hash of the native code)
# carries the JS bundle of the commit it was built from. This script rebuilds
# the bundle from the current checkout and swaps it in, the way Xcode's "Bundle
# React Native code and images" phase builds it, so JS-only changes need no
# macOS build. The idea is Expo's repack (docs.expo.dev/build-reference/repack),
# which needs an Expo project; this does the same with plain React Native.
#
# Runs on Linux and macOS. Refuses to produce an app that would not run:
#   - the new Hermes bytecode must have the same version as the bundle Xcode
#     built, or the app's Hermes engine would reject it at launch;
#   - the app must not seal its resources (_CodeSignature, build-ios-app.sh
#     builds without signing) or use the RCTUseAssetCatalog image catalog,
#     which only macOS tools can compile.

set -euo pipefail

[ $# -eq 2 ] || { echo "Usage: $0 <source.app> <output.app>" >&2; exit 2; }
SRC_APP="$1"
OUT_APP="$2"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROJECT_ROOT="$REPO_ROOT/apps/example"

die() { echo "Error: $*" >&2; exit 1; }

[ -f "$SRC_APP/main.jsbundle" ] || die "$SRC_APP has no main.jsbundle. Is it a Release build?"
[ ! -d "$SRC_APP/_CodeSignature" ] || die "$SRC_APP is signed, so its resources are sealed and a new bundle would break the seal. Build it with CODE_SIGNING_ALLOWED=NO (build-ios-app.sh does)."
[ ! -d "$SRC_APP/RNAssets.bundle" ] || die "$SRC_APP uses the RCTUseAssetCatalog image catalog, which only macOS (actool) can build."

RN_DIR="$(cd "$PROJECT_ROOT" && node -p "require('path').dirname(require.resolve('react-native/package.json'))")"
case "$(uname -s)-$(uname -m)" in
  Linux-x86_64) HERMES_BIN=linux64-bin ;;
  Darwin-*)     HERMES_BIN=osx-bin ;;
  *) die "no hermesc for $(uname -s) $(uname -m)" ;;
esac
HERMESC="$(cd "$PROJECT_ROOT" && RN_DIR="$RN_DIR" node -p "require('path').join(require('path').dirname(require.resolve('hermes-compiler/package.json', {paths: [process.env.RN_DIR]})), 'hermesc', '$HERMES_BIN', 'hermesc')")"
[ -x "$HERMESC" ] || die "hermesc not found at $HERMESC"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "=== Bundling the JS (Release) ===" >&2
# Same arguments as react-native-xcode.sh for a Release build with Hermes.
(
  cd "$PROJECT_ROOT"
  node "$RN_DIR/scripts/bundle.js" bundle \
    --entry-file index.js \
    --platform ios \
    --dev false \
    --reset-cache \
    --bundle-output "$TMP/main.jsbundle.js" \
    --assets-dest "$TMP/assets-dest" \
    --minify false \
    --config-cmd "'node' '$RN_DIR/cli.js' config"
) >&2

echo "=== Compiling it to Hermes bytecode ===" >&2
"$HERMESC" -emit-binary -max-diagnostic-width=80 -O -out "$TMP/main.jsbundle" "$TMP/main.jsbundle.js" >&2

# Hermes bytecode starts with an 8-byte magic number and a 4-byte version.
hbc_version() {
  node -e '
    const b = require("fs").readFileSync(process.argv[1]);
    const MAGIC = 0x1f1903c103bc1fc6n;
    if (b.length < 12 || b.readBigUInt64LE(0) !== MAGIC) { console.log("not-hbc"); process.exit(0); }
    console.log(b.readUInt32LE(8));
  ' "$1"
}
OLD_VERSION="$(hbc_version "$SRC_APP/main.jsbundle")"
NEW_VERSION="$(hbc_version "$TMP/main.jsbundle")"
[ "$OLD_VERSION" != "not-hbc" ] || die "the bundle in $SRC_APP is not Hermes bytecode. Is Hermes off?"
if [ "$OLD_VERSION" != "$NEW_VERSION" ]; then
  die "hermesc ($HERMESC) makes bytecode version $NEW_VERSION, but the app's Hermes engine expects $OLD_VERSION. The npm hermes-compiler and the app's hermes-engine differ: rebuild the app (bump APP_CACHE_VERSION in e2e-argent.yml)."
fi

echo "=== Writing $OUT_APP (bytecode version $NEW_VERSION) ===" >&2
rm -rf "$OUT_APP"
mkdir -p "$(dirname "$OUT_APP")"
cp -R "$SRC_APP" "$OUT_APP"
cp "$TMP/main.jsbundle" "$OUT_APP/main.jsbundle"
# Image assets the JS requires: replace the old set with the new one.
rm -rf "$OUT_APP/assets"
if [ -n "$(ls -A "$TMP/assets-dest" 2>/dev/null)" ]; then
  cp -R "$TMP/assets-dest/." "$OUT_APP/"
fi
echo "Repacked $(basename "$OUT_APP") with the JS of $(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo 'this checkout')." >&2
