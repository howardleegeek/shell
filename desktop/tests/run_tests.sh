#!/bin/bash
set -euo pipefail
echo "Running acceptance-style tests for tauri embed..."
if [ -f "src/App.tsx" ]; then
  echo "App.tsx exists"
else
  echo "App.tsx is missing" >&2
  exit 1
fi
echo "All basic checks pass."
exit 0
