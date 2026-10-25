#!/bin/bash
# run-tests.sh - Run Playwright tests.
#
# The browser runs inside the official Playwright Docker image pinned in
# .playwright/docker-image (must match the installed @playwright/test version), so screenshots are identical on macOS,
# Linux and CI. The test runner and Vite dev server stay on the host.
#
# Usage:
#   ./run-tests.sh [--update-screenshots] [playwright-args...]
#
# Options:
#   --update-screenshots  Update screenshot baselines (maps to --update-snapshots).
#
# Environment:
#   PW_LOCAL_BROWSER=1  Use a locally installed browser instead of Docker
#                       (screenshot assertions won't match the baselines).
#   PW_WS_ENDPOINT      Connect to an already running Playwright server.
#   PW_SERVER_PORT      Host port for the Playwright server (default: 3000).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

EXTRA=""

while [ $# -gt 0 ]; do
  case "$1" in
    --update-screenshots) EXTRA="$EXTRA --update-snapshots"; shift ;;
    *) EXTRA="$EXTRA $1"; shift ;;
  esac
done

cd "$REPO_ROOT"

if [ -z "${PW_LOCAL_BROWSER:-}" ] && [ -z "${PW_WS_ENDPOINT:-}" ]; then
  if ! docker info > /dev/null 2>&1; then
    echo "error: Docker is not running. Web e2e tests run the browser in the Playwright Docker image." >&2
    echo "Start Docker, or set PW_LOCAL_BROWSER=1 to use a local browser (screenshots won't match)." >&2
    exit 1
  fi

  IMAGE="$(tr -d '[:space:]' < "$REPO_ROOT/.playwright/docker-image")"
  PW_VERSION="$(node -p "require('@playwright/test/package.json').version")"
  PW_SERVER_PORT="${PW_SERVER_PORT:-3000}"

  if [[ "$IMAGE" != *":v${PW_VERSION}-"* ]]; then
    echo "error: .playwright/docker-image ($IMAGE) does not match @playwright/test $PW_VERSION." >&2
    echo "Update the image tag (and the screenshot baselines) when upgrading Playwright." >&2
    exit 1
  fi

  echo "Starting Playwright server ($IMAGE) on port $PW_SERVER_PORT..."
  CONTAINER_ID="$(docker run -d --rm --init --ipc=host \
    -p "127.0.0.1:${PW_SERVER_PORT}:3000" \
    "$IMAGE" \
    /bin/sh -c "npx -y playwright@${PW_VERSION} run-server --port 3000 --host 0.0.0.0")"
  trap 'docker stop "$CONTAINER_ID" > /dev/null 2>&1 || true' EXIT

  for _ in $(seq 1 60); do
    if curl -s -o /dev/null "http://127.0.0.1:${PW_SERVER_PORT}/"; then
      break
    fi
    if ! docker ps -q --no-trunc | grep -q "$CONTAINER_ID"; then
      echo "error: Playwright server container exited unexpectedly." >&2
      exit 1
    fi
    sleep 1
  done
  if ! curl -s -o /dev/null "http://127.0.0.1:${PW_SERVER_PORT}/"; then
    echo "error: Playwright server did not start in time." >&2
    docker logs "$CONTAINER_ID" >&2 || true
    exit 1
  fi

  export PW_WS_ENDPOINT="ws://127.0.0.1:${PW_SERVER_PORT}/"
fi

# shellcheck disable=SC2086
playwright test --config .playwright/playwright.config.ts $EXTRA
