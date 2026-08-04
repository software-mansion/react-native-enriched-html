#!/bin/bash
# run-tests-ci-android.sh - CI-only script for running Android E2E tests.
#
# Designed to run inside reactivecircus/android-emulator-runner's `script` context
# where the emulator is already booted. Builds the app, installs it, and runs
# maestro tests.
#
# The emulator serial is passed via EMULATOR_SERIAL (defaults to emulator-5554).

set -euo pipefail

MIN_MAESTRO_VERSION="2.3.0"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Error: maestro CLI not found." >&2
  exit 1
fi

MAESTRO_VERSION=$(maestro --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
if [ "$(printf '%s\n' "$MIN_MAESTRO_VERSION" "$MAESTRO_VERSION" | sort -V | head -n1)" != "$MIN_MAESTRO_VERSION" ]; then
  echo "Error: maestro $MAESTRO_VERSION is too old, minimum required is $MIN_MAESTRO_VERSION" >&2
  exit 1
fi

SERIAL="${EMULATOR_SERIAL:-emulator-5554}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MAESTRO_ROOT="$REPO_ROOT/.maestro"
SCREENSHOT_ROOT="$MAESTRO_ROOT"

echo "=== Waiting for emulator to be ready ==="
adb -s "$SERIAL" wait-for-device
until adb -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | grep -q "^1$"; do
  sleep 2
done

adb -s "$SERIAL" shell pm disable-user --user 0 com.google.android.inputmethod.latin 2>/dev/null || true
adb -s "$SERIAL" shell settings put secure spell_checker_enabled 0

echo "=== Building and installing app ==="
yarn example android --device "$SERIAL"

set_font_scale() {
  case "$1" in
    default) adb -s "$SERIAL" shell settings put system font_scale 1.0 ;;
    large)   adb -s "$SERIAL" shell settings put system font_scale 1.5 ;;
  esac
}

trap 'set_font_scale default' EXIT
set_font_scale default

FLOWS=".maestro/enrichedInput/flows .maestro/enrichedText/flows"
ASSETS_DIR="$MAESTRO_ROOT/assets"
[ -d "$ASSETS_DIR" ] && FLOWS="$ASSETS_DIR $FLOWS"

EXTRA="--env SCREENSHOT_ROOT=$SCREENSHOT_ROOT --exclude-tags ios-only"

run_maestro() {
  local tmp rc
  tmp=$(mktemp)
  local cmd
  cmd=$(printf '%q ' maestro test "$@")
  script -qec "$cmd" /dev/null 2>&1 | tee "$tmp"
  rc=${PIPESTATUS[0]}
  if [ "$rc" -ne 0 ] && grep -q "did not match any Flows" "$tmp"; then
    echo "warn: no flows matched the tag filter — treating as success" >&2
    rc=0
  fi
  rm -f "$tmp"
  return "$rc"
}

set +e

echo "=== Running maestro tests ==="
# shellcheck disable=SC2086
run_maestro --device "$SERIAL" --exclude-tags accessibility $EXTRA $FLOWS
EXIT_REGULAR=$?

echo "=== Running maestro accessibility tests ==="
set_font_scale large
# shellcheck disable=SC2086
run_maestro --device "$SERIAL" --include-tags accessibility $EXTRA $FLOWS
EXIT_A11Y=$?

set -e

exit $(( EXIT_REGULAR != 0 || EXIT_A11Y != 0 ))
