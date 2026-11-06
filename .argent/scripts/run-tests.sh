#!/bin/bash
# run-tests.sh - boot the Argent Cloud simulator, install the example app, and
# run Argent e2e tests on it.
#
# GitHub Actions only: .github/workflows/e2e-argent.yml acquires the machine
# first (acquire-machine.sh) and then calls this script. The repository has one
# shared Argent Cloud key, so the tests do not run anywhere else.
#
# Usage:
#   ./run-tests.sh --platform ios-remote [options] [test ...]
#
# Platforms:
#   ios-remote  iOS simulator on Argent Cloud.
#   Hosted Android goes in as an `android-remote` case once Argent Cloud offers it.
#
# Options:
#   --update-baselines  Write snapshot baselines instead of comparing them.
#   --app <path>        Install this .app instead of building one.
#   --output <dir>      Where failure screenshots and diffs go (default .argent/artifacts).
#   test ...            E2E test files or directories. Defaults to every suite.
#
# Layout: each suite is a directory in .argent/e2e/. Tests in <suite>/ run with
# the default text size, tests in <suite>/accessibility/ with a large one (the
# Maestro `accessibility` tag).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT" # argent uses the working directory as the project root

E2E_ROOT=".argent/e2e"
SUITES="enrichedInput enrichedText"

PLATFORM=""
UPDATE_BASELINES=""
APP_PATH=""
OUTPUT=".argent/artifacts"
TARGETS=()

while [ $# -gt 0 ]; do
  case "$1" in
    --platform)         PLATFORM="$2"; shift 2 ;;
    --update-baselines) UPDATE_BASELINES="true"; shift ;;
    --app)              APP_PATH="$2"; shift 2 ;;
    --output)           OUTPUT="$2"; shift 2 ;;
    -*)                 echo "Error: unknown option $1" >&2; exit 2 ;;
    *)                  TARGETS+=("$1"); shift ;;
  esac
done

if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "Error: Argent e2e tests run only in GitHub Actions, because the repository has one" >&2
  echo "shared Argent Cloud key. Push your branch and start the 'E2E (Argent Cloud)' workflow:" >&2
  echo "  yarn e2e   (or: gh workflow run e2e-argent.yml --ref <branch>)" >&2
  exit 1
fi

if ! command -v argent >/dev/null 2>&1; then
  echo "Error: argent CLI not found. Install it with: npm install -g @swmansion/argent" >&2
  exit 1
fi

case "$PLATFORM" in
  ios-remote) SETUP="$SCRIPT_DIR/setup-ios-remote.sh" ;;
  *)          echo "Error: --platform must be ios-remote" >&2; exit 2 ;;
esac

DEVICE_ID=$("$SETUP" | tee /dev/stderr | grep "^DEVICE_ID=" | cut -d= -f2)
[ -n "$DEVICE_ID" ] || { echo "Error: $SETUP printed no DEVICE_ID" >&2; exit 1; }
UDID="${DEVICE_ID#remote:}"

# --- per-platform device commands (add the android-remote ones here) ----------

install_app() {
  case "$PLATFORM" in
    ios-remote)
      if [ -z "$APP_PATH" ]; then
        APP_PATH=$("$SCRIPT_DIR/build-ios-app.sh" | grep "^APP_PATH=" | cut -d= -f2-)
      fi
      echo "=== Uploading and installing $APP_PATH ===" >&2
      sim-remote simctl install "$UDID" "$APP_PATH"
      ;;
  esac
}

set_font_scale() {
  case "$1" in
    default) ios_size="large" ;;
    large)   ios_size="accessibility-large" ;;
    *) echo "set_font_scale: unknown size '$1'" >&2; return 1 ;;
  esac
  case "$PLATFORM" in
    ios-remote) sim-remote simctl ui "$UDID" content_size "$ios_size" ;;
  esac
}

KEEPALIVE_PID=""
cleanup() {
  set_font_scale default || true
  [ -n "$KEEPALIVE_PID" ] && kill "$KEEPALIVE_PID" 2>/dev/null || true
}
trap cleanup EXIT

# Argent drives the hosted simulator over its own stream, so keep the
# sim-remote idle timer (15 min) from releasing the machine mid-run.
sim-remote keepalive 3h >/dev/null 2>&1 &
KEEPALIVE_PID=$!

# A released machine is erased, so every run installs the app.
install_app

# --- pick the tests -----------------------------------------------------------

REGULAR=()
A11Y=()
has_tests() { [ -f "$1" ] || ls "$1"/*.yaml >/dev/null 2>&1; }

if [ ${#TARGETS[@]} -eq 0 ]; then
  for suite in $SUITES; do
    has_tests "$E2E_ROOT/$suite" && REGULAR+=("$E2E_ROOT/$suite")
    has_tests "$E2E_ROOT/$suite/accessibility" && A11Y+=("$E2E_ROOT/$suite/accessibility")
  done
else
  for t in "${TARGETS[@]}"; do
    case "$t" in
      */accessibility|*/accessibility/|*/accessibility/*) A11Y+=("$t") ;;
      *) REGULAR+=("$t") ;;
    esac
  done
fi

EXTRA=()
[ -n "$UPDATE_BASELINES" ] && EXTRA+=(--update-baselines)

FAILED=0

# Argent Cloud's port forwarder sometimes answers HTTP 504 (Gateway Timeout),
# mostly right after the simulator boots. Argent needs it to launch the app
# (it opens a tunnel for its native devtools) and does not retry, so the test
# errors at its first step. A test that failed that way runs once more; a test
# that failed for any other reason is never retried.
INFRA_ERROR='port forwarder|Service dependency failed|HTTP 50[234]'

notice_infra() {
  local msg="$1"
  if [ "${GITHUB_ACTIONS:-}" = "true" ]; then echo "::warning title=Argent Cloud::$msg" >&2; else echo "Warning: $msg" >&2; fi
}

# Open and close one tunnel until the port forwarder answers, so the first test
# does not pay for its cold start.
warm_up_port_forwarder() {
  local attempt port=65431
  for attempt in 1 2 3 4 5; do
    if sim-remote reverse start "$UDID" "$port" >/dev/null 2>&1; then
      sim-remote reverse stop "$UDID" "$port" >/dev/null 2>&1 || true
      [ "$attempt" -gt 1 ] && echo "The Argent Cloud port forwarder answered on attempt $attempt." >&2
      return 0
    fi
    sleep $((attempt * 5))
  done
  notice_infra "The Argent Cloud port forwarder did not answer during warm-up; tests may hit HTTP 504 errors."
}

# Prints the test files whose failure was an Argent Cloud error, from the
# "Failed e2e tests" summary of `argent e2e run` (each entry ends with a
# "re-run: argent e2e run <file> ..." line).
infra_failures() {
  sed 's/\x1b\[[0-9;]*m//g' "$1" | awk -v re="$INFRA_ERROR" '
    /^Failed e2e tests/ { in_summary = 1; next }
    in_summary && /^  [^ ]/ { entry = "" }
    in_summary { entry = entry "\n" $0 }
    in_summary && /^ *re-run: argent e2e run / {
      if (entry ~ re) { for (i = 1; i <= NF; i++) if ($i == "run") { print $(i + 1); break } }
      entry = ""
    }'
}

# Runs `argent e2e run` on one test file or directory, printing its output and
# keeping a copy in $1.
argent_run() {
  local log="$1" target="$2" out="$3" rc
  set +e
  argent e2e run "$target" --platform "$PLATFORM" --device "$DEVICE_ID" --output "$out" \
    ${EXTRA[@]+"${EXTRA[@]}"} 2>&1 | tee "$log"
  rc=${PIPESTATUS[0]}
  set -e
  return "$rc"
}

run_argent() {
  local target="$1" rel out tmp rc retry_tmp infra other f
  # argent adds <test>/ itself, so a file run uses the directory of the file.
  rel="${target#"$E2E_ROOT"/}"
  [ -f "$target" ] && rel="$(dirname "$rel")"
  out="$OUTPUT/${rel%/}"
  tmp=$(mktemp)
  rc=0
  argent_run "$tmp" "$target" "$out" || rc=$?

  if [ "$rc" -ne 0 ] && grep -q "no device resolved" "$tmp"; then
    echo "hint: Argent did not see the remote simulator. Its tool-server may have started" >&2
    echo "      before sim-remote was on PATH; 'argent server stop' makes the next run restart it." >&2
  fi

  if [ "$rc" -ne 0 ]; then
    infra=$(infra_failures "$tmp")
    if [ -n "$infra" ]; then
      # Failures in the summary that were not Argent Cloud errors stay failures.
      other=$(( $(grep -c '^ *re-run: argent e2e run ' "$tmp" || true) - $(printf '%s\n' "$infra" | grep -c . || true) ))
      [ "$other" -gt 0 ] && FAILED=1
      for f in $infra; do
        notice_infra "$f failed with an Argent Cloud error (port forwarder); running it once more."
        retry_tmp=$(mktemp)
        if argent_run "$retry_tmp" "$f" "$OUTPUT/$(dirname "${f#"$E2E_ROOT"/}")"; then
          echo "=== $f passed on the second attempt ===" >&2
        else
          FAILED=1
        fi
        rm -f "$retry_tmp"
      done
      rm -f "$tmp"
      return
    fi
  fi
  rm -f "$tmp"
  [ "$rc" -eq 0 ] || FAILED=1
}

# A previous run could have died before its EXIT trap fired.
set_font_scale default

warm_up_port_forwarder

if [ ${#REGULAR[@]} -gt 0 ]; then
  echo "=== Running argent e2e tests ===" >&2
  for t in "${REGULAR[@]}"; do run_argent "$t"; done
fi

if [ ${#A11Y[@]} -gt 0 ]; then
  echo "=== Running argent accessibility e2e tests ===" >&2
  set_font_scale large
  for t in "${A11Y[@]}"; do run_argent "$t"; done
  set_font_scale default
fi

exit "$FAILED"
