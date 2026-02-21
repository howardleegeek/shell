#!/usr/bin/env bash
set -euo pipefail

# Start web-ui dev server in background, then launch tauri dev
GRAND_DIR=$(pwd)

# Start web-ui dev server
(cd ../web-ui && pnpm dev) &
WEB_UI_PID=$!

# Wait briefly to give the dev server time to start before tauri tries to load it
sleep 1

# Start tauri dev for the desktop app
(cd ../desktop && cargo tauri dev)

# Cleanup background processes if still running when script ends
if ps -p ${WEB_UI_PID} > /dev/null 2>&1; then
  kill ${WEB_UI_PID} 2>/dev/null || true
fi
