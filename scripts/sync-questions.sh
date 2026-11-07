#!/usr/bin/env bash
#
# Sync the AWS AIF-C01 question bank from the upstream site into public/.
#
# Strategy (no token burn — pure curl + python3):
#   1. Fetch the homepage and auto-discover the app bundle (app.js?v=…).
#   2. Fetch app.js and auto-discover the JSON endpoint it fetches.
#   3. Download that JSON, validate schema and print stats.
#   4. If it differs from public/questions.json → backup + atomic replace.
#
# Usage:
#   bash scripts/sync-questions.sh
#
# Env overrides:
#   BASE_URL=https://aif.ammiratafabiano.dev   (upstream origin)
#   SYNC_ASSETS=1                              (also refresh icons/manifest/sounds)

set -euo pipefail

BASE_URL="${BASE_URL:-https://aif.ammiratafabiano.dev}"
SYNC_ASSETS="${SYNC_ASSETS:-0}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBLIC_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/public"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

log() { printf '\n\033[1;34m[sync]\033[0m %s\n' "$*"; }
warn() { printf '\n\033[1;33m[sync]\033[0m %s\n' "$*"; }

# ── 1. Discover the app bundle from the homepage ──────────────────────────────
HOME_HTML="$TMP_DIR/index.html"
log "Fetching homepage $BASE_URL/ …"
if curl -fsSL --retry 3 --retry-delay 2 --max-time 30 "$BASE_URL/" -o "$HOME_HTML"; then
  APP_SRC="$(grep -oE 'src="app\.js[^"]*"' "$HOME_HTML" | head -1 | sed -E 's/.*src="([^"]+)".*/\1/' || true)"
  if [[ -n "$APP_SRC" ]]; then
    APP_JS_URL="$BASE_URL/$APP_SRC"
    log "Discovered app bundle: $APP_SRC"
  else
    APP_JS_URL="$BASE_URL/app.js"
    warn "Could not discover app.js from homepage, falling back to $APP_JS_URL"
  fi
else
  APP_JS_URL="$BASE_URL/app.js"
  warn "Homepage fetch failed, assuming app.js at $APP_JS_URL"
fi

# ── 2. Discover the questions endpoint from app.js ────────────────────────────
APP_JS="$TMP_DIR/app.js"
log "Fetching app bundle …"
if curl -fsSL --retry 3 --retry-delay 2 --max-time 60 "$APP_JS_URL" -o "$APP_JS"; then
  QUESTIONS_PATH="$(grep -oE "fetch\(['\"][^'\"]+\.json['\"]\)" "$APP_JS" | head -1 | sed -E "s/.*fetch\(['\"]([^'\"]+)['\"]\).*/\1/" || true)"
  if [[ -n "$QUESTIONS_PATH" ]]; then
    QUESTIONS_URL="$BASE_URL/$QUESTIONS_PATH"
    log "Discovered questions endpoint: $QUESTIONS_PATH"
  else
    QUESTIONS_URL="$BASE_URL/questions.json"
    warn "Could not discover questions endpoint, falling back to $QUESTIONS_URL"
  fi
else
  QUESTIONS_URL="$BASE_URL/questions.json"
  warn "app.js fetch failed, assuming $QUESTIONS_URL"
fi

# ── 3. Download + validate the question bank ──────────────────────────────────
REMOTE="$TMP_DIR/questions.json"
log "Downloading $QUESTIONS_URL …"
curl -fsSL --retry 3 --retry-delay 2 --max-time 180 "$QUESTIONS_URL" -o "$REMOTE"
log "Downloaded $(wc -c < "$REMOTE" | tr -d ' ') bytes."

python3 - "$REMOTE" <<'PY'
import json, sys

path = sys.argv[1]
with open(path, encoding="utf-8") as f:
    data = json.load(f)

assert isinstance(data, list), "top-level value must be a JSON array"

# The upstream bank mixes sources (ExamTopics + SecExams), so the schema is
# heterogeneous. Only these four fields are guaranteed on every question.
required = ("url", "question", "options", "correct_answer")
missing = [(i, k) for i, q in enumerate(data) for k in required if k not in q]
if missing:
    print(f"ERROR: {len(missing)} missing required fields. First: {missing[:5]}")
    sys.exit(1)

print(f"OK: {len(data)} questions")
for field in ("question_no", "topic_question", "discussion", "vote_counts", "explanation", "source"):
    print(f"  {field}: {sum(1 for q in data if field in q)}/{len(data)}")
print(f"  hotspot: {sum(1 for q in data if q.get('is_hotspot'))}")
PY

# ── 4. Compare with local and update if needed ────────────────────────────────
LOCAL="$PUBLIC_DIR/questions.json"
if [[ -f "$LOCAL" ]] && cmp -s "$LOCAL" "$REMOTE"; then
  log "public/questions.json is already up to date (identical bytes)."
else
  if [[ -f "$LOCAL" ]]; then
    BACKUP="$LOCAL.bak.$(date +%Y%m%d%H%M%S)"
    cp "$LOCAL" "$BACKUP"
    log "Backed up previous file to $(basename "$BACKUP")."
  fi
  cp "$REMOTE" "$LOCAL"
  log "Updated public/questions.json ✔"
fi

# ── 5. Optional: refresh static assets (icons/manifest/sounds) ────────────────
if [[ "$SYNC_ASSETS" == "1" ]]; then
  log "Refreshing static assets …"
  for asset in manifest.json apple-touch-icon.png favicon.ico icon-192.png icon-512.png; do
    curl -fsSL --retry 3 --retry-delay 2 --max-time 60 "$BASE_URL/$asset" -o "$PUBLIC_DIR/$asset" \
      && echo "  ✔ $asset" || warn "  ✖ failed: $asset"
  done
  mkdir -p "$PUBLIC_DIR/sounds"
  for s in play_intro.mp3 question_bg.mp3 select_option.mp3 correct.mp3 wrong.mp3; do
    curl -fsSL --retry 3 --retry-delay 2 --max-time 60 "$BASE_URL/sounds/$s" -o "$PUBLIC_DIR/sounds/$s" \
      && echo "  ✔ sounds/$s" || warn "  ✖ failed: sounds/$s"
  done
fi

log "Done."
