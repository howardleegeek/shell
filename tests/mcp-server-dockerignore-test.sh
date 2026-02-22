#!/usr/bin/env bash
set -euo pipefail
task_id="task-0001-mcp-docker-dockerignore"
export task_id
echo "Running test: $task_id"
if [ ! -f mcp-server/.dockerignore ]; then
  echo "ERROR: mcp-server/.dockerignore not found"
  exit 1
fi
grep -Fq "node_modules" mcp-server/.dockerignore || { echo "ERROR: expected 'node_modules' in .dockerignore"; exit 2; }
grep -Fq "dist" mcp-server/.dockerignore || { echo "ERROR: expected 'dist' in .dockerignore"; exit 3; }
grep -Fq ".git" mcp-server/.dockerignore || { echo "ERROR: expected '.git' in .dockerignore"; exit 4; }
echo "Test passed"
exit 0
