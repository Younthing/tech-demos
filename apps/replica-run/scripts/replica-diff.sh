#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PY="$ROOT/vendor/replica-skill/replica-diff"
OUT="$ROOT/replica/visual"
mkdir -p "$OUT" "$ROOT/replica/diffs"
cd "$ROOT"

pair() {
  local name="$1"
  python3 "$PY/imgdiff.py" \
    "replica/screens/${name}.png" \
    "replica/clone-screens/${name}.png" \
    --json --out "replica/diffs/${name}.png" \
    > "$OUT/${name}.json"
}

pair S01-desktop
pair S01-mobile
pair S04-desktop

python3 "$PY/parity.py" replica/features.csv \
  --visual "$OUT"/S01-desktop.json "$OUT"/S01-mobile.json "$OUT"/S04-desktop.json \
  --json > replica/parity.json

python3 "$PY/parity.py" replica/features.csv \
  --visual "$OUT"/S01-desktop.json "$OUT"/S01-mobile.json "$OUT"/S04-desktop.json \
  --markdown > replica/parity.md

echo "wrote replica/parity.json and replica/parity.md"
