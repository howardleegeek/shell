#!/bin/sh
set -e

# Start Anvil in the background
anvil --host 0.0.0.0 &
ANVIL_PID=$!

# Wait for Anvil readiness (try up to 10 seconds)
READY=0
for i in $(seq 1 10); do
  if curl -sS -X POST -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
     http://127.0.0.1:8545 >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 1
done

if [ "$READY" -eq 0 ]; then
  echo "Anvil not ready within timeout" >&2
  kill "$ANVIL_PID" 2>/dev/null || true
  exit 1
fi

# Start MCP Server
exec node dist/server.js --transport sse --port 3001
