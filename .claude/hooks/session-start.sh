#!/bin/bash
# Prepares cloud sessions for the app and the video-editing toolchain.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

npm install --no-audit --no-fund
pip install -q -r requirements.txt

# The kit's cut scripts use `-/filter_complex`, which needs ffmpeg 7+; the
# system ffmpeg is older, so put ffmpeg-static (7.x) first on PATH.
FFMPEG_STATIC="$CLAUDE_PROJECT_DIR/node_modules/ffmpeg-static/ffmpeg"
if [ -x "$FFMPEG_STATIC" ]; then
  BIN_DIR="$CLAUDE_PROJECT_DIR/.cache/bin"
  mkdir -p "$BIN_DIR"
  ln -sf "$FFMPEG_STATIC" "$BIN_DIR/ffmpeg"
  echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi
