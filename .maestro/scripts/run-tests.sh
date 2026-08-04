#!/bin/bash
# run-tests.sh - set up a device, build the example app, and run Maestro flows.
#
# Usage:
#   ./run-tests.sh --platform <ios|android> [--update-screenshots] [--rebuild] [flow ...]
#
# Options:
#   --platform            Required. Target platform: ios or android.
#   --update-screenshots  Refresh baselines.
#   --rebuild             Force a rebuild and install, even if the app is
#                         already installed on the device.
#   flow ...              One or more Maestro flow files or directories to run.
#                         Defaults to all component suites if omitted.
#
# Examples:
#   ./run-tests.sh --platform ios
#   ./run-tests.sh --platform android --update-screenshots .maestro/enrichedInput/flows/core_controls_smoke.yaml
#   ./run-tests.sh --platform ios --rebuild
#
# Uses the local maestro-runner binary:
#   Android → --driver devicelab
#   iOS     → default driver
#
# In CI on Android, driver startup crashes are retried twice (3 runs total).

set -euo pipefail

DEFAULT_MAESTRO_RUNNER="$HOME/.maestro-runner/bin/maestro-runner"

if [ -n "${MAESTRO_RUNNER:-}" ]; then
  MAESTRO_BIN="$MAESTRO_RUNNER"
elif [ -x "$DEFAULT_MAESTRO_RUNNER" ]; then
  MAESTRO_BIN="$DEFAULT_MAESTRO_RUNNER"
elif command -v maestro-runner >/dev/null 2>&1; then
  MAESTRO_BIN="$(command -v maestro-runner)"
else
  echo "Error: maestro-runner not found." >&2
  echo "Install it locally (expected at $DEFAULT_MAESTRO_RUNNER) or set MAESTRO_RUNNER." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MAESTRO_ROOT="$REPO_ROOT/.maestro"
SCREENSHOT_ROOT="$MAESTRO_ROOT"
BUNDLE_ID="swmansion.enriched.example"

PLATFORM=""
UPDATE_SCREENSHOTS=""
REBUILD=""
FLOWS=""

while [ $# -gt 0 ]; do
  case "$1" in
    --platform)           PLATFORM="$2"; shift 2 ;;
    --update-screenshots) UPDATE_SCREENSHOTS="true"; shift ;;
    --rebuild)            REBUILD="true"; shift ;;
    *)                    FLOWS="${FLOWS:+$FLOWS }$1"; shift ;;
  esac
done

[ -z "$FLOWS" ] && FLOWS=".maestro/enrichedInput/flows .maestro/enrichedText/flows"

case "$PLATFORM" in
  ios)     SETUP="$SCRIPT_DIR/setup-ios-simulator.sh" ;;
  android) SETUP="$SCRIPT_DIR/setup-android-emulator.sh" ;;
  *)       echo "Error: --platform must be ios or android" >&2; exit 1 ;;
esac

DEVICE_ID=$("$SETUP" | tee /dev/stderr | grep "^DEVICE_ID=" | cut -d= -f2)

# Android uses DeviceLab; iOS keeps the runner default driver.
DRIVER_ARGS=""
if [ "$PLATFORM" = android ]; then
  DRIVER_ARGS="--driver devicelab"
fi

echo "=== Using maestro-runner: $MAESTRO_BIN ==="
"$MAESTRO_BIN" --version || true
if [ -n "$DRIVER_ARGS" ]; then
  echo "=== Driver: devicelab (android) ==="
else
  echo "=== Driver: default (ios) ==="
fi

app_installed() {
  if [ "$PLATFORM" = ios ]; then
    xcrun simctl listapps "$DEVICE_ID" 2>/dev/null | grep -q "$BUNDLE_ID"
  else
    adb -s "$DEVICE_ID" shell pm list packages "$BUNDLE_ID" 2>/dev/null | grep -q "$BUNDLE_ID"
  fi
}

# Adjusts the system's text-size setting.
set_font_scale() {
  case "$1" in
    default) ios_size="large";               android_scale="1.0" ;;
    large)   ios_size="accessibility-large"; android_scale="1.5" ;;
    *) echo "set_font_scale: unknown size '$1'" >&2; return 1 ;;
  esac
  if [ "$PLATFORM" = ios ]; then
    xcrun simctl ui "$DEVICE_ID" content_size "$ios_size"
  else
    adb -s "$DEVICE_ID" shell settings put system font_scale "$android_scale"
  fi
}

# Guarantees the font scale is restored on any exit.
# Without this, the accessibility tests below would leave the device
# in a scaled-up state.
trap 'set_font_scale default' EXIT

if [ -n "$REBUILD" ] || ! app_installed; then
  [ -n "$REBUILD" ] && echo "=== rebuild requested, building and installing ==="
  [ -z "$REBUILD" ] && echo "=== App ($BUNDLE_ID) not found, building and installing ==="
  if [ "$PLATFORM" = ios ]; then
    yarn example ios --udid "$DEVICE_ID"
  else
    yarn example android --device "$DEVICE_ID"
  fi
else
  echo "=== App ($BUNDLE_ID) already installed, skipping build ==="
fi

EXTRA="--env SCREENSHOT_ROOT=$SCREENSHOT_ROOT"
[ -n "$UPDATE_SCREENSHOTS" ] && EXTRA="$EXTRA --env UPDATE_SCREENSHOTS=true"

# Exclude tests tagged for the other platform.
case "$PLATFORM" in
  ios)     EXTRA="$EXTRA --exclude-tags android-only" ;;
  android) EXTRA="$EXTRA --exclude-tags ios-only" ;;
esac

# Maestro resolves addMedia paths by walking the workspace inputs. Since assets
# live outside the flows directory, always include it so media files are found.
ASSETS_DIR="$MAESTRO_ROOT/assets"
[ -d "$ASSETS_DIR" ] && FLOWS="$ASSETS_DIR $FLOWS"

# A previous run could have died before its EXIT trap fired (e.g. SIGKILL),
# leaving the device scaled. Force a known state before the normal tests.
set_font_scale default

# maestro-runner exits non-zero when the tag filter matches zero flows. That's
# not a real failure for us (e.g. running a single flow that has no
# accessibility variant), and letting it propagate aborts later test suites.
is_ci_android() {
  [ "$PLATFORM" = android ] && { [ -n "${CI:-}" ] || [ -n "${GITHUB_ACTIONS:-}" ]; }
}

is_driver_startup_crash() {
  # Strip ANSI escape sequences and carriage returns before matching — `script`
  # wraps output in terminal control codes that can trip up grep.
  sed 's/\x1b\[[0-9;]*[a-zA-Z]//g; s/\r//g' "$1" | grep -Eqi 'failed to create driver|driver crashed on startup|DeviceLab driver crashed'
}

cleanup_devicelab_driver() {
  [ "$PLATFORM" != android ] && return 0
  local sock="/tmp/devicelab-driver-${DEVICE_ID}.sock"
  adb -s "$DEVICE_ID" forward --remove "localfilesystem:$sock" 2>/dev/null || true
  adb -s "$DEVICE_ID" shell am force-stop dev.devicelab.driver.android.test 2>/dev/null || true
  sleep 8
}

run_maestro() {
  local max_attempts rc tmp attempt=1 delayed_retry=0
  if [ -n "${MAESTRO_MAX_RETRIES:-}" ]; then
    max_attempts="$MAESTRO_MAX_RETRIES"
  elif is_ci_android; then
    max_attempts=3 # 1 initial run + 2 retries
  else
    max_attempts=1
  fi

  while true; do
    tmp=$(mktemp)
    # `script` allocates a pseudo-TTY so the runner keeps
    # ANSI colors when piped through `tee`.
    # Global flags (--device, --driver, --env, tags) come before `test`.
    if [[ "$OSTYPE" == darwin* ]]; then
      # shellcheck disable=SC2086
      script -q /dev/null "$MAESTRO_BIN" --platform "$PLATFORM" --device "$DEVICE_ID" $DRIVER_ARGS $EXTRA "$@" test $FLOWS 2>&1 | tee "$tmp"
    else
      local cmd
      # shellcheck disable=SC2086
      cmd=$(printf '%q ' "$MAESTRO_BIN" --platform "$PLATFORM" --device "$DEVICE_ID" $DRIVER_ARGS $EXTRA "$@" test $FLOWS)
      script -qc "$cmd" /dev/null 2>&1 | tee "$tmp"
    fi
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

    if is_driver_startup_crash "$tmp"; then
      if [ "$attempt" -lt "$max_attempts" ]; then
        echo "warn: driver crashed on startup (attempt $attempt/$max_attempts), retrying..." >&2
        cleanup_devicelab_driver
        attempt=$((attempt + 1))
        rm -f "$tmp"
        continue
      fi
      if [ "$delayed_retry" -eq 0 ] && is_ci_android; then
        echo "warn: driver still failing, waiting before delayed retry..." >&2
        delayed_retry=1
        cleanup_devicelab_driver
        sleep 10
        rm -f "$tmp"
        continue
      fi
    fi

    rm -f "$tmp"
    return "$rc"
  done
}

set +e

echo "=== Running maestro tests ==="
run_maestro --exclude-tags accessibility
EXIT_REGULAR=$?

# These are the tests that require changing the system's settings
# - something maestro cannot run internally
echo "=== Running maestro accessibility tests ==="
set_font_scale large

run_maestro --include-tags accessibility
EXIT_A11Y=$?

set -e

exit $(( EXIT_REGULAR != 0 || EXIT_A11Y != 0 ))
