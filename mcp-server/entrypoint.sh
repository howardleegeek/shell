#!/bin/bash
set -euo pipefail

# Start Anvil in background
anvil --host 0.0.0.0 &
ANVIL_PID=$!

echo "Waiting for Anvil to start..."

# Wait for Anvil to be ready (max 10 seconds)
for i in {1..10}; do
    if curl -s http://localhost:8545 &gt;/dev/null; then
        echo "Anvil is ready"
        break
    fi
    sleep 1
done

# Check if Anvil started successfully
if ! curl -s http://localhost:8545 &gt;/dev/null; then
    echo "Error: Anvil failed to start"
    kill $ANVIL_PID || true
    exit 1
fi

echo "Starting MCP Server..."

# Start MCP Server in foreground
node dist/server.js --transport sse --port 3001

# Cleanup on exit
trap 'kill $ANVIL_PID || true' EXIT