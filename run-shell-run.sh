#!/bin/bash
# Run shell-run from the project directory

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

exec node "$PROJECT_DIR/runner/src/index.js" "$@"
