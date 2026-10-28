#!/usr/bin/env bash
#
# Creates two throwaway apps (a bare React Native app and a Vite React app)
# next to a built library .tgz artifact, links the artifact into both, and
# swaps in known-good test content so the artifact can be smoke-tested
# end-to-end before a release.
#
# Usage:
#   scripts/create-release-apps.sh /path/to/react-native-enriched-html-package.tgz

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <path-to-tgz>" >&2
  exit 1
fi

TGZ_INPUT="$1"

if [ ! -f "$TGZ_INPUT" ]; then
  echo "error: tarball not found: $TGZ_INPUT" >&2
  exit 1
fi

TGZ_PATH="$(cd "$(dirname "$TGZ_INPUT")" && pwd)/$(basename "$TGZ_INPUT")"
TARGET_DIR="$(dirname "$TGZ_PATH")"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/release-templates"

MOBILE_APP_NAME="MyMobileApp"
WEB_APP_NAME="my-react-app"
MOBILE_APP_DIR="$TARGET_DIR/$MOBILE_APP_NAME"
WEB_APP_DIR="$TARGET_DIR/$WEB_APP_NAME"

if [ -e "$MOBILE_APP_DIR" ]; then
  echo "error: $MOBILE_APP_DIR already exists, remove it first" >&2
  exit 1
fi

if [ -e "$WEB_APP_DIR" ]; then
  echo "error: $WEB_APP_DIR already exists, remove it first" >&2
  exit 1
fi

echo "==> Using tarball: $TGZ_PATH"
echo "==> Creating apps in: $TARGET_DIR"

echo "==> [1/6] Creating mobile app ($MOBILE_APP_NAME)"
(cd "$TARGET_DIR" && npx @react-native-community/cli init "$MOBILE_APP_NAME" --skip-install)

echo "==> [2/6] Creating web app ($WEB_APP_NAME)"
(cd "$TARGET_DIR" && npm create vite@latest "$WEB_APP_NAME" -- --template react --eslint --no-immediate)

echo "==> [3/6] Linking tarball into mobile app"
(cd "$MOBILE_APP_DIR" && yarn add "$TGZ_PATH")

echo "==> [3/6] Linking tarball into web app"
(cd "$WEB_APP_DIR" && yarn add "$TGZ_PATH")

echo "==> [4/6] Writing test content"
cp "$TEMPLATES_DIR/App.native.tsx" "$MOBILE_APP_DIR/App.tsx"
cp "$TEMPLATES_DIR/App.web.jsx" "$WEB_APP_DIR/src/App.jsx"
cp "$TEMPLATES_DIR/App.web.css" "$WEB_APP_DIR/src/App.css"

echo "==> [5/6] Installing mobile app"
(cd "$MOBILE_APP_DIR" && yarn && cd ios && bundle install && bundle exec pod install && cd ..)

echo "==> [6/6] Installing web app"
(cd "$WEB_APP_DIR" && yarn)

if [ -t 1 ]; then
  BOLD=$'\033[1m'; GREEN=$'\033[32m'; CYAN=$'\033[36m'; RESET=$'\033[0m'
else
  BOLD=""; GREEN=""; CYAN=""; RESET=""
fi

echo ""
echo "${GREEN}${BOLD}✓ Apps are ready!${RESET}"
echo "${BOLD}Mobile app:${RESET} ${CYAN}$MOBILE_APP_DIR${RESET}"
echo "${BOLD}Web app:   ${RESET} ${CYAN}$WEB_APP_DIR${RESET}"
