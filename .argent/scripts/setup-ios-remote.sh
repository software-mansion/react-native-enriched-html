#!/bin/bash
# setup-ios-remote.sh - boot the iOS simulator on the Argent Cloud machine.
#
# Expects a sim-remote session that holds a machine: in CI, the workflow runs
# acquire-machine.sh first. Logs go to stderr. The only line on stdout is
# `DEVICE_ID=remote:<UDID>`, the id that `argent e2e run --device` takes.
#
# Environment overrides:
#   IOS_VERSION        iOS runtime of the simulator (default 26.2, same as Maestro)
#   IOS_DEVICE_TYPE    simctl device type (default iPhone 17)

set -euo pipefail

log() { echo "$@" >&2; }
die() { log "Error: $*"; exit 1; }

IOS_VERSION="${IOS_VERSION:-26.2}"
IOS_DEVICE_TYPE="${IOS_DEVICE_TYPE:-com.apple.CoreSimulator.SimDeviceType.iPhone-17}"
RUNTIME="com.apple.CoreSimulator.SimRuntime.iOS-${IOS_VERSION//./-}"
DEVICE_NAME="iPhone17-iOS${IOS_VERSION}-Enriched"

command -v sim-remote >/dev/null 2>&1 || die "sim-remote not found on PATH"

# --- session and machine ------------------------------------------------------

if ! MACHINES=$(sim-remote list-machines 2>&1); then
  die "no Argent Cloud session ($MACHINES). Run .argent/scripts/acquire-machine.sh first."
fi
if [ "$MACHINES" = "No machines." ]; then
  die "the Argent Cloud session holds no machine. It may have been released after 15 idle minutes; run .argent/scripts/acquire-machine.sh again."
fi

# --- simulator ----------------------------------------------------------------

# Prints the UDID of the simulator called $1, or nothing.
find_udid() {
  sim-remote simctl list devices --json | node -e '
    const name = process.argv[1];
    const { devices } = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const hit = Object.values(devices).flat().find((d) => d.name === name && d.isAvailable !== false);
    if (hit) process.stdout.write(hit.udid);
  ' "$1"
}

# Capture first: under pipefail, `grep -q` closing the pipe early fails the pipeline.
RUNTIMES="$(sim-remote simctl list runtimes)"
if ! grep -q "$RUNTIME" <<<"$RUNTIMES"; then
  log "Error: the machine has no iOS $IOS_VERSION runtime. Available runtimes:"
  log "$RUNTIMES"
  die "pick one with IOS_VERSION=<version>. Baselines are tied to the runtime, so re-record them when you change it."
fi

UDID="$(find_udid "$DEVICE_NAME")"
if [ -z "$UDID" ]; then
  log "Creating simulator '$DEVICE_NAME'..."
  UDID="$(sim-remote simctl create "$DEVICE_NAME" "$IOS_DEVICE_TYPE" "$RUNTIME")"
fi
[ -n "$UDID" ] || die "could not find or create '$DEVICE_NAME'"

log "Booting '$DEVICE_NAME' ($UDID)..."
sim-remote simctl bootstatus "$UDID" -b >&2

# Same keyboard settings as .maestro/scripts/setup-ios-simulator.sh. We cannot
# edit the simulator's plist directly on a hosted machine, so write it through
# `defaults` inside the simulator.
for key in KeyboardAutocorrection KeyboardCheckSpelling KeyboardAutocapitalization; do
  sim-remote simctl spawn "$UDID" defaults write com.apple.keyboard.preferences "$key" -bool NO >&2
done

log "Simulator ready: $DEVICE_NAME ($UDID) on Argent Cloud"
echo "DEVICE_ID=remote:$UDID"
