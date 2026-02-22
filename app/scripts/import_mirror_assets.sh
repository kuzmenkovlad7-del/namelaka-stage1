#!/usr/bin/env bash
set -euo pipefail
SRC_DEFAULT="$HOME/projects/namelaka-clone/mirror/namelaka.ua/ua"
SRC="${1:-$SRC_DEFAULT}"
DST="$(cd "$(dirname "$0")/.." && pwd)/public/original-assets"
mkdir -p "$DST"
if [[ ! -d "$SRC" ]]; then
  echo "ERROR: source mirror not found: $SRC"
  exit 1
fi
rm -rf "$DST"/*
mkdir -p "$DST/assets" "$DST/media"
if [[ -f "$SRC/assets/logo.svg" ]]; then cp "$SRC/assets/logo.svg" "$DST/logo.svg"; fi
if [[ -f "$SRC/favicon.ico" ]]; then cp "$SRC/favicon.ico" "$(cd "$(dirname "$0")/.." && pwd)/public/favicon.ico"; fi
if [[ -d "$SRC/assets" ]]; then rsync -a "$SRC/assets/" "$DST/assets/"; fi
if [[ -d "$SRC/media" ]]; then rsync -a "$SRC/media/" "$DST/media/"; fi
echo "Imported assets to $DST"
