#!/usr/bin/env bash
# Shell project init script - runs before LLM agent on cluster nodes
# v2: Also strip large directories to speed up agent analysis

# Remove .opencode dir to prevent OpenCode plugin conflicts
rm -rf .opencode 2>/dev/null
rm -rf web-ui/.opencode 2>/dev/null

# Strip large directories agents don't need — reduces codebase scan time
# Agents only need: mcp-server/, web-ui/app/, web-ui/package.json, etc.
rm -rf desktop/ 2>/dev/null
rm -rf demo/ 2>/dev/null
rm -rf schemas/ 2>/dev/null
rm -rf runner/ 2>/dev/null
rm -rf repo/ 2>/dev/null
rm -rf docs/ 2>/dev/null
rm -rf web-ui/node_modules/ 2>/dev/null
rm -rf web-ui/.next/ 2>/dev/null
rm -rf web-ui/build/ 2>/dev/null
rm -rf web-ui/dist/ 2>/dev/null

echo "Shell init.sh: cleanup done (stripped non-essential dirs)"
