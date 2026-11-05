#!/bin/bash
# acquire-machine.sh - log in to Argent Cloud and wait for a free machine.
#
# CI only (GitHub Actions). The repository has a single Argent Cloud API key,
# shared by every run, so a run that finds the machine busy waits for it here
# and says who most likely holds it.
#
# Environment:
#   SIM_REMOTE_API_KEY  the repository secret (required)
#   MAX_WAIT_MINUTES    how long to wait for a free machine (default 30)
#   POLL_SECONDS        seconds between two attempts (default 30)
#   GH_TOKEN            optional; lets the script name the run that holds the machine

set -euo pipefail

MAX_WAIT_MINUTES="${MAX_WAIT_MINUTES:-30}"
POLL_SECONDS="${POLL_SECONDS:-30}"
SUMMARY="${GITHUB_STEP_SUMMARY:-/dev/null}"

error()  { echo "::error title=Argent Cloud::$*"; }
notice() { echo "::notice title=Argent Cloud::$*"; }

if [ "${GITHUB_ACTIONS:-}" != "true" ]; then
  echo "Error: Argent Cloud runs only in GitHub Actions. Push your branch and start the" >&2
  echo "'E2E (Argent Cloud)' workflow: yarn e2e (or gh workflow run e2e-argent.yml --ref <branch>)" >&2
  exit 1
fi

if [ -z "${SIM_REMOTE_API_KEY:-}" ]; then
  error "The SIM_REMOTE_API_KEY secret is not set. A repository admin adds it in Settings > Secrets and variables > Actions."
  exit 1
fi

# --- login (no machine yet) ---------------------------------------------------

if ! out=$(sim-remote login --no-acquire 2>&1); then
  case "$out" in
    *"authentication failed"*)
      error "Argent Cloud rejected the API key. Check the SIM_REMOTE_API_KEY secret. ($out)" ;;
    *"protocol mismatch"*)
      error "sim-remote is too old for the Argent Cloud server. Re-run the job to get the latest release. ($out)" ;;
    *)
      error "Login to Argent Cloud failed: $out" ;;
  esac
  exit 1
fi
unset SIM_REMOTE_API_KEY

# --- who has the machine? -----------------------------------------------------

explain_busy() {
  echo "All Argent Cloud machines of the team are in use."
  local held
  held=$(sim-remote list-machines 2>/dev/null || true)
  if [ -n "$held" ] && [ "$held" != "No machines." ]; then
    echo "Machines held with this API key (by another session):"
    echo "$held" | sed 's/^/  /'
  fi

  local runs=""
  if [ -n "${GH_TOKEN:-}" ] && [ -n "${GITHUB_REPOSITORY:-}" ] && command -v gh >/dev/null 2>&1; then
    runs=$(gh run list -R "$GITHUB_REPOSITORY" --workflow e2e-argent.yml --status in_progress \
      --event workflow_dispatch --json databaseId,number,headBranch,startedAt,url \
      --jq ".[] | select(.databaseId != ${GITHUB_RUN_ID:-0}) | \"#\(.number) on \(.headBranch), started \(.startedAt): \(.url)\"" \
      2>/dev/null || true)
  fi
  if [ -n "$runs" ]; then
    echo "Other runs of this workflow in progress (one of them most likely holds the machine):"
    echo "$runs" | sed 's/^/  /'
  else
    echo "No other run of this workflow is in progress. The machine may be held by a run that was"
    echo "killed before it could release it; the server frees such a machine within about 16 minutes."
  fi

  {
    echo "### Argent Cloud machine busy"
    echo
    echo "This run waited for a free machine (up to ${MAX_WAIT_MINUTES} min)."
    [ -n "$runs" ] && { echo; echo "Runs in progress:"; echo "$runs" | sed 's/^/- /'; }
    echo
  } >>"$SUMMARY"
}

# --- acquire ------------------------------------------------------------------

start=$(date +%s)
deadline=$(( start + MAX_WAIT_MINUTES * 60 ))
explained=""

while true; do
  if out=$(sim-remote acquire --no-wait 2>&1); then
    waited=$(( ($(date +%s) - start) / 60 ))
    [ -n "$out" ] && echo "$out"
    if [ -n "$explained" ]; then
      notice "Got a machine after waiting ${waited} min."
      echo "Got a machine after ${waited} min." >>"$SUMMARY"
    else
      echo "Got an Argent Cloud machine."
    fi
    exit 0
  fi

  case "$out" in
    *"no simulator is available"*)
      if [ -z "$explained" ]; then
        explain_busy
        echo "::warning title=Argent Cloud::Machine busy, waiting up to ${MAX_WAIT_MINUTES} min for it to free up. See the log of this step for who holds it."
        explained=1
      fi
      ;;
    *"server is busy"*|*"timed out"*|*"could not reach"*|*"machine is offline"*)
      echo "Argent Cloud is not answering right now, retrying: $out"
      ;;
    *)
      error "Could not reserve a machine: $out"
      exit 1
      ;;
  esac

  now=$(date +%s)
  if [ "$now" -ge "$deadline" ]; then
    error "No Argent Cloud machine became free within ${MAX_WAIT_MINUTES} min. Re-run this workflow when the run that holds it has finished, or raise max-wait-minutes."
    echo "**No machine became free within ${MAX_WAIT_MINUTES} min. The tests did not run.**" >>"$SUMMARY"
    exit 1
  fi
  echo "Still waiting for a machine: $(( (now - start) / 60 )) min elapsed, $(( (deadline - now) / 60 )) min left."
  sleep "$POLL_SECONDS"
done
