#!/bin/bash
# Builds the ASHFALL desktop apps from the game build + the Electron runtimes (no npm needed).
# usage: pack.sh <game version> [app version]
set -e
GV=${1:?game version}; AV=${2:-1.0.0}
HERE=$(cd "$(dirname "$0")" && pwd); DL=${DL:-$HERE/dl}; OUT=${OUT:-$HERE/dist}; GAME=$HERE/../game/ashfall.html; THREE=$HERE/../tools/three.min.js; EV=33.2.1
mkdir -p "$DL"; for a in win32-x64 darwin-x64 darwin-arm64; do [ -f "$DL/electron-$a.zip" ] || curl -sSL -o "$DL/electron-$a.zip" "https://github.com/electron/electron/releases/download/v$EV/electron-v$EV-$a.zip"; done
rm -rf "$OUT"; mkdir -p "$OUT"
# the app folder that goes inside every build
APPD=$OUT/appsrc; mkdir -p "$APPD/game"
cp "$HERE/main.js" "$HERE/preload.js" "$APPD/"
cat > "$APPD/package.json" <<EOF
{ "name": "ashfall", "productName": "ASHFALL", "version": "$AV", "main": "main.js", "description": "ASHFALL - a first-person shooter" }
EOF
sed 's#https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js#three.min.js#' "$GAME" > "$APPD/game/ashfall.html"
cp "$THREE" "$APPD/game/three.min.js"
python3 - "$GV" "$APPD/game/version.json" "$HERE/notes.json" <<'PY'
import json,sys,os
notes = json.load(open(sys.argv[3])) if os.path.exists(sys.argv[3]) else []
json.dump({"version": sys.argv[1], "notes": notes}, open(sys.argv[2], "w"))
PY
# ---- Windows
W=$OUT/ASHFALL-Windows; mkdir -p "$W"; unzip -q "$DL/electron-win32-x64.zip" -d "$W"
mv "$W/electron.exe" "$W/ASHFALL.exe"; rm -f "$W/resources/default_app.asar"; cp -r "$APPD" "$W/resources/app"
cp "$HERE/README-Windows.txt" "$W/READ ME FIRST.txt"
(cd "$OUT" && zip -qry ASHFALL-Windows.zip ASHFALL-Windows)
# ---- Mac (Apple Silicon and Intel)
for arch in arm64 x64; do
  M=$OUT/mac-$arch; mkdir -p "$M"; (cd "$M" && unzip -q "$DL/electron-darwin-$arch.zip")
  mv "$M/Electron.app" "$M/ASHFALL.app"; R="$M/ASHFALL.app/Contents"
  rm -f "$R/Resources/default_app.asar"; cp -r "$APPD" "$R/Resources/app"
  python3 - "$R/Info.plist" <<'PY'
import plistlib,sys
p=sys.argv[1]; d=plistlib.load(open(p,'rb'))
d['CFBundleName']='ASHFALL'; d['CFBundleDisplayName']='ASHFALL'; d['CFBundleIdentifier']='com.schoolmcst.ashfall'
plistlib.dump(d, open(p,'wb'))
PY
  cp "$HERE/README-Mac.txt" "$M/READ ME FIRST.txt"
  NAME=$([ $arch = arm64 ] && echo AppleSilicon || echo Intel)
  (cd "$M" && zip -qry "$OUT/ASHFALL-Mac-$NAME.zip" ASHFALL.app "READ ME FIRST.txt")
done
ls -la "$OUT"/*.zip
