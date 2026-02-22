#!/usr/bin/env bash
# Shell project init script - runs before LLM agent on cluster nodes
# Fixes: OpenCode crashes when .opencode/ dir has incompatible plugins

# Remove .opencode dir to prevent OpenCode plugin conflicts
rm -rf .opencode 2>/dev/null
rm -rf web-ui/.opencode 2>/dev/null

# Install web-ui deps if needed
if [ -f web-ui/package.json ] && [ ! -d web-ui/node_modules ]; then
    cd web-ui && npm install --no-audit --no-fund 2>/dev/null && cd ..
fi

echo "Shell init.sh: cleanup done"
