#!/usr/bin/env bash
# Shell project init script - runs before LLM agent on cluster nodes
# v3: Aggressive strip — keep only what specs need, target <50 files

# Preserve OpenCode artifacts to keep Web3 capabilities functioning
# Do not delete the .opencode directory. If present, back it up instead.
if [ -d .opencode ]; then
  mkdir -p /tmp/.opencode-backup 2>/dev/null
  cp -r .opencode /tmp/.opencode-backup/ 2>/dev/null
fi
if [ -d web-ui/.opencode ]; then
  mkdir -p /tmp/.opencode-backup 2>/dev/null
  cp -r web-ui/.opencode /tmp/.opencode-backup/ 2>/dev/null
fi

# === AGGRESSIVE STRIP ===
# 100% success projects: ~10 files, 156KB
# Shell before strip: 626 files, 9.7MB — agents can't handle this
# Target: <50 files, <500KB

# Remove top-level dirs agents never need
rm -rf desktop/ demo/ schemas/ runner/ repo/ docs/ tests/ templates/ 2>/dev/null
rm -rf .github/ .git/hooks/ 2>/dev/null

# web-ui: keep ONLY config files + key source files agents reference
# Save the files we need FIRST using a temporary, uniquely-named directory
TMP_KEEP=$(mktemp -d 2>/dev/null || mktemp -d -t shell-keep)
mkdir -p "$TMP_KEEP" 2>/dev/null
cp web-ui/package.json "$TMP_KEEP/" 2>/dev/null
cp web-ui/wrangler.toml "$TMP_KEEP/" 2>/dev/null
cp web-ui/Dockerfile "$TMP_KEEP/" 2>/dev/null
cp web-ui/docker-compose.yaml "$TMP_KEEP/" 2>/dev/null
cp web-ui/tsconfig.json "$TMP_KEEP/" 2>/dev/null
cp web-ui/vite.config.ts "$TMP_KEEP/" 2>/dev/null

# Save key source files specs reference
mkdir -p "$TMP_KEEP/app/lib/services" 2>/dev/null
mkdir -p "$TMP_KEEP/app/lib/modules/llm/providers" 2>/dev/null
mkdir -p "$TMP_KEEP/app/utils" 2>/dev/null
cp web-ui/app/lib/services/mcpService.ts "$TMP_KEEP/app/lib/services/" 2>/dev/null
cp web-ui/app/lib/modules/llm/providers/minimax.ts "$TMP_KEEP/app/lib/modules/llm/providers/" 2>/dev/null
cp web-ui/app/utils/constants.ts "$TMP_KEEP/app/utils/" 2>/dev/null
cp web-ui/app/entry.server.tsx "$TMP_KEEP/app/" 2>/dev/null
cp web-ui/app/root.tsx "$TMP_KEEP/app/" 2>/dev/null

# Nuke web-ui entirely, restore only what we kept
rm -rf web-ui/ 2>/dev/null
mkdir -p web-ui/app/lib/services web-ui/app/lib/modules/llm/providers web-ui/app/utils 2>/dev/null
cp "$TMP_KEEP/package.json" web-ui/ 2>/dev/null
cp "$TMP_KEEP/wrangler.toml" web-ui/ 2>/dev/null
cp "$TMP_KEEP/Dockerfile" web-ui/ 2>/dev/null
cp "$TMP_KEEP/docker-compose.yaml" web-ui/ 2>/dev/null
cp "$TMP_KEEP/tsconfig.json" web-ui/ 2>/dev/null
cp "$TMP_KEEP/vite.config.ts" web-ui/ 2>/dev/null
cp "$TMP_KEEP/app/lib/services/mcpService.ts" web-ui/app/lib/services/ 2>/dev/null
cp "$TMP_KEEP/app/lib/modules/llm/providers/minimax.ts" web-ui/app/lib/modules/llm/providers/ 2>/dev/null
cp "$TMP_KEEP/app/utils/constants.ts" web-ui/app/utils/ 2>/dev/null
cp "$TMP_KEEP/app/entry.server.tsx" web-ui/app/ 2>/dev/null
cp "$TMP_KEEP/app/root.tsx" web-ui/app/ 2>/dev/null
rm -rf "$TMP_KEEP" 2>/dev/null

# Clean progress.txt — old error logs bloat prompt and cause retry death spiral
# Keep only last 10 lines (latest attempt summary)
if [ -f progress.txt ] && [ "$(wc -l < progress.txt)" -gt 10 ]; then
    tail -10 progress.txt > /tmp/progress-trim.txt
    mv /tmp/progress-trim.txt progress.txt
fi

echo "Shell init.sh: stripped to essential files only"
