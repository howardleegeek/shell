#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKDIR="$(mktemp -d /tmp/shell-init-gate.XXXXXX)"
trap 'rm -rf "$WORKDIR"' EXIT

fail() {
  echo "[init-gate] $1" >&2
  exit 1
}

assert_exists() {
  local path="$1"
  [[ -e "$path" ]] || fail "Expected path to exist: $path"
}

assert_missing() {
  local path="$1"
  [[ ! -e "$path" ]] || fail "Expected path to be removed: $path"
}

snapshot_manifest() {
  local root="$1"
  (
    cd "$root"
    find . -type f -not -path './.git/*' | LC_ALL=C sort | while read -r rel; do
      sha256sum "$rel"
    done
  )
}

mkdir -p "$WORKDIR/work"

git -C "$REPO_ROOT" archive --format=tar HEAD | tar -xf - -C "$WORKDIR/work"

(
  cd "$WORKDIR/work"
  bash init.sh
)

FIRST_MANIFEST="$WORKDIR/first.manifest"
SECOND_MANIFEST="$WORKDIR/second.manifest"

snapshot_manifest "$WORKDIR/work" > "$FIRST_MANIFEST"

(
  cd "$WORKDIR/work"
  bash init.sh
)

snapshot_manifest "$WORKDIR/work" > "$SECOND_MANIFEST"

diff -u "$FIRST_MANIFEST" "$SECOND_MANIFEST" >/dev/null || fail "init.sh is not deterministic across repeated runs"

assert_exists "$WORKDIR/work/init.sh"
assert_exists "$WORKDIR/work/progress.txt"
assert_exists "$WORKDIR/work/web-ui/package.json"
assert_exists "$WORKDIR/work/web-ui/app/root.tsx"
assert_exists "$WORKDIR/work/web-ui/app/entry.server.tsx"
assert_exists "$WORKDIR/work/web-ui/app/lib/services/mcpService.ts"
assert_exists "$WORKDIR/work/web-ui/app/utils/constants.ts"

assert_missing "$WORKDIR/work/desktop"
assert_missing "$WORKDIR/work/demo"
assert_missing "$WORKDIR/work/schemas"
assert_missing "$WORKDIR/work/runner"
assert_missing "$WORKDIR/work/repo"
assert_missing "$WORKDIR/work/docs"
assert_missing "$WORKDIR/work/templates"
assert_missing "$WORKDIR/work/.github"

FILE_COUNT="$(find "$WORKDIR/work" -type f -not -path '*/.git/*' | wc -l | tr -d ' ')"
[[ "$FILE_COUNT" -le 50 ]] || fail "Expected <= 50 files after init.sh, got $FILE_COUNT"

echo "[init-gate] deterministic init cleanup gate passed"
