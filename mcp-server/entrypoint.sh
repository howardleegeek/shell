#!/usr/bin/env bash
set -euo pipefail

echo "task_id: S78-mcp-docker-foundry"

# Start Anvil in the background
anvil --host 0.0.0.0 &
ANVIL_PID=$!

cleanup() {
  echo "[ENTRYPOINT] Cleaning up background processes..."
  if [[ -n "${ANVIL_PID:-}" ]]; then
    kill "$ANVIL_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "[ENTRYPOINT] Waiting for Anvil to become ready (max 10s)..."
MAX_WAIT=10
COUNT=0
until curl -sSf http://localhost:8545 >/dev/null; do
  COUNT=$((COUNT+1))
  if [ "$COUNT" -ge "$MAX_WAIT" ]; then
    echo "[ENTRYPOINT] Anvil did not become ready in time"
    exit 1
  fi
  sleep 1
done

echo "[ENTRYPOINT] Anvil ready. Starting MCP Server..."
node dist/server.js --transport sse --port 3001
