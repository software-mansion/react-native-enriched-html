#!/bin/bash
# run-tests-ci-android.sh - CI-only script for running Android E2E tests.
#
# Designed to run inside reactivecircus/android-emulator-runner's `script` context
# where the emulator is already booted. Builds the app, installs it, and runs
# maestro tests.
#
# The emulator serial is passed via EMULATOR_SERIAL (defaults to emulator-5554).

set -euo pipefail

SERIAL="${EMULATOR_SERIAL:-emulator-5554}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MAESTRO_ROOT="$REPO_ROOT/.maestro"
SCREENSHOT_ROOT="$MAESTRO_ROOT"
BUNDLE_ID="swmansion.enriched.example"

DEFAULT_MAESTRO_RUNNER="$HOME/.maestro-runner/bin/maestro-runner"
if [ -n "${MAESTRO_RUNNER:-}" ]; then
  MAESTRO_BIN="$MAESTRO_RUNNER"
elif [ -x "$DEFAULT_MAESTRO_RUNNER" ]; then
  MAESTRO_BIN="$DEFAULT_MAESTRO_RUNNER"
elif command -v maestro-runner >/dev/null 2>&1; then
  MAESTRO_BIN="$(command -v maestro-runner)"
else
  echo "Error: maestro-runner not found." >&2
  exit 1
fi

echo "=== Using maestro-runner: $MAESTRO_BIN ==="
"$MAESTRO_BIN" --version || true

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
DRIVER_ARGS="--driver devicelab"

run_maestro() {
  local tmp rc attempt max_attempts=3
  for attempt in $(seq 1 "$max_attempts"); do
    tmp=$(mktemp)
    local cmd
    # shellcheck disable=SC2086
    cmd=$(printf '%q ' "$MAESTRO_BIN" --platform android --device "$SERIAL" $DRIVER_ARGS $EXTRA "$@" test $FLOWS)
    script -qec "$cmd" /dev/null 2>&1 | tee "$tmp"
    rc=${PIPESTATUS[0]}

    if [ "$rc" -eq 0 ]; then
      rm -f "$tmp"
      return 0
    fi

    if sed 's/\x1b\[[0-9;]*[a-zA-Z]//g; s/\r//g' "$tmp" | grep -Eqi "did not match any [Ff]lows|no flows matched"; then
      echo "warn: no flows matched the tag filter — treating as success" >&2
      rm -f "$tmp"
      return 0
    fi

    if [ "$attempt" -lt "$max_attempts" ] && sed 's/\x1b\[[0-9;]*[a-zA-Z]//g; s/\r//g' "$tmp" | grep -Eqi 'failed to create driver|driver crashed on startup|DeviceLab driver crashed'; then
      echo "warn: driver crashed on startup (attempt $attempt/$max_attempts), retrying in 10s..." >&2
      local sock="/tmp/devicelab-driver-${SERIAL}.sock"
      adb -s "$SERIAL" forward --remove "localfilesystem:$sock" 2>/dev/null || true
      adb -s "$SERIAL" shell am force-stop dev.devicelab.driver.android.test 2>/dev/null || true
      sleep 10
      rm -f "$tmp"
      continue
    fi

    rm -f "$tmp"
    return "$rc"
  done
}

set +e

echo "=== Running maestro tests ==="
run_maestro --exclude-tags accessibility
EXIT_REGULAR=$?

echo "=== Running maestro accessibility tests ==="
set_font_scale large
run_maestro --include-tags accessibility
EXIT_A11Y=$?

set -e

exit $(( EXIT_REGULAR != 0 || EXIT_A11Y != 0 ))
