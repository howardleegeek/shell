#!/usr/bin/env bash
# Shell project init script - runs before LLM agent on cluster nodes
# v3: Aggressive strip — keep only what specs need, target <50 files

# Remove .opencode dir to prevent OpenCode plugin conflicts
rm -rf .opencode 2>/dev/null
rm -rf web-ui/.opencode 2>/dev/null

# === AGGRESSIVE STRIP ===
# 100% success projects: ~10 files, 156KB
# Shell before strip: 626 files, 9.7MB — agents can't handle this
# Target: <50 files, <500KB

# Remove top-level dirs agents never need
rm -rf desktop/ demo/ schemas/ runner/ repo/ docs/ tests/ templates/ 2>/dev/null
rm -rf .github/ .git/hooks/ 2>/dev/null

# web-ui: keep ONLY config files + key source files agents reference
# Save the files we need FIRST
mkdir -p /tmp/shell-keep 2>/dev/null
cp web-ui/package.json /tmp/shell-keep/ 2>/dev/null
cp web-ui/wrangler.toml /tmp/shell-keep/ 2>/dev/null
cp web-ui/Dockerfile /tmp/shell-keep/ 2>/dev/null
cp web-ui/docker-compose.yaml /tmp/shell-keep/ 2>/dev/null
cp web-ui/tsconfig.json /tmp/shell-keep/ 2>/dev/null
cp web-ui/vite.config.ts /tmp/shell-keep/ 2>/dev/null

# Save key source files specs reference
mkdir -p /tmp/shell-keep/app/lib/services 2>/dev/null
mkdir -p /tmp/shell-keep/app/lib/modules/llm/providers 2>/dev/null
mkdir -p /tmp/shell-keep/app/utils 2>/dev/null
cp web-ui/app/lib/services/mcpService.ts /tmp/shell-keep/app/lib/services/ 2>/dev/null
cp web-ui/app/lib/modules/llm/providers/minimax.ts /tmp/shell-keep/app/lib/modules/llm/providers/ 2>/dev/null
cp web-ui/app/utils/constants.ts /tmp/shell-keep/app/utils/ 2>/dev/null
cp web-ui/app/entry.server.tsx /tmp/shell-keep/app/ 2>/dev/null
cp web-ui/app/root.tsx /tmp/shell-keep/app/ 2>/dev/null

# Nuke web-ui entirely, restore only what we kept
rm -rf web-ui/ 2>/dev/null
mkdir -p web-ui/app/lib/services web-ui/app/lib/modules/llm/providers web-ui/app/utils 2>/dev/null
cp /tmp/shell-keep/package.json web-ui/ 2>/dev/null
cp /tmp/shell-keep/wrangler.toml web-ui/ 2>/dev/null
cp /tmp/shell-keep/Dockerfile web-ui/ 2>/dev/null
cp /tmp/shell-keep/docker-compose.yaml web-ui/ 2>/dev/null
cp /tmp/shell-keep/tsconfig.json web-ui/ 2>/dev/null
cp /tmp/shell-keep/vite.config.ts web-ui/ 2>/dev/null
cp /tmp/shell-keep/app/lib/services/mcpService.ts web-ui/app/lib/services/ 2>/dev/null
cp /tmp/shell-keep/app/lib/modules/llm/providers/minimax.ts web-ui/app/lib/modules/llm/providers/ 2>/dev/null
cp /tmp/shell-keep/app/utils/constants.ts web-ui/app/utils/ 2>/dev/null
cp /tmp/shell-keep/app/entry.server.tsx web-ui/app/ 2>/dev/null
cp /tmp/shell-keep/app/root.tsx web-ui/app/ 2>/dev/null
rm -rf /tmp/shell-keep 2>/dev/null

# Clean progress.txt — old error logs bloat prompt and cause retry death spiral
# Keep only last 10 lines (latest attempt summary)
if [ -f progress.txt ] && [ "$(wc -l < progress.txt)" -gt 10 ]; then
    tail -10 progress.txt > /tmp/progress-trim.txt
    mv /tmp/progress-trim.txt progress.txt
fi

echo "Shell init.sh: stripped to essential files only"
