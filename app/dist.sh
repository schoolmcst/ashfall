#!/bin/bash
# Player downloads for the public DARKZONE app:
#   dist/DARKZONE-Setup-Windows.exe      (installer, per-user, desktop + Start menu shortcuts, uninstaller)
#   dist/DARKZONE-Mac-AppleSilicon.zip   (M1-M4)    dist/DARKZONE-Mac-Intel.zip
# Needs TOOLS=<dir> with 7zz, nsis/ (from electron-builder-binaries nsis-3.0.4.1) and rcodesign (apple-codesign).
# usage: TOOLS=... app/dist.sh [app version]
set -e
HERE=$(cd "$(dirname "$0")" && pwd); DL=$HERE/dl; OUT=$HERE/dist; EV=33.2.1; AV=${1:-1.1.0}; T=${TOOLS:?TOOLS dir}
mkdir -p "$DL"; for a in win32-x64 darwin-x64 darwin-arm64; do [ -f "$DL/electron-$a.zip" ] || curl -sSL -o "$DL/electron-$a.zip" "https://github.com/electron/electron/releases/download/v$EV/electron-v$EV-$a.zip"; done
rm -rf "$OUT"; mkdir -p "$OUT"; APPD=$OUT/appsrc; mkdir -p "$APPD/game"
cp "$HERE/main.js" "$HERE/preload.js" "$HERE/brand/darkzone.ico" "$HERE/brand/icon.png" "$APPD/"
printf '{ "name": "darkzone", "productName": "DARKZONE", "version": "%s", "main": "main.js", "channel": "public", "description": "DARKZONE - a first-person shooter" }\n' "$AV" > "$APPD/package.json"
sed 's#https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js#three.min.js#' "$HERE/../release/ashfall.html" > "$APPD/game/ashfall.html"
cp "$HERE/../tools/three.min.js" "$APPD/game/three.min.js"
python3 -c "import json;v=json.load(open('$HERE/../release/version.json'));json.dump({'version':v['version'],'notes':v.get('notes',[])},open('$APPD/game/version.json','w'))"
# ---- Windows installer
W=$OUT/win; mkdir -p "$W"; unzip -q "$DL/electron-win32-x64.zip" -d "$W"
mv "$W/electron.exe" "$W/DARKZONE.exe"; rm -f "$W/resources/default_app.asar"; cp -r "$APPD" "$W/resources/app"
NSISDIR="$T/nsis" "$T/nsis/linux/makensis" -V2 -DVERSION="$AV" -DSRC="$W" -DBRAND="$HERE/brand" -DOUTFILE="$OUT/DARKZONE-Setup-Windows.exe" "$HERE/installer/darkzone.nsi"
# ---- Mac (Apple Silicon and Intel): renamed app, our icon, ad-hoc signed so it opens with right-click > Open
for arch in arm64 x64; do
  M=$OUT/mac-$arch; mkdir -p "$M"; (cd "$M" && unzip -q "$DL/electron-darwin-$arch.zip")
  mv "$M/Electron.app" "$M/DARKZONE.app"; R="$M/DARKZONE.app/Contents"
  rm -f "$R/Resources/default_app.asar"; cp -r "$APPD" "$R/Resources/app"; cp "$HERE/brand/darkzone.icns" "$R/Resources/electron.icns"
  python3 - "$R/Info.plist" <<'PY'
import plistlib,sys
p=sys.argv[1]; d=plistlib.load(open(p,'rb'))
d.update(CFBundleName='DARKZONE', CFBundleDisplayName='DARKZONE', CFBundleIdentifier='com.schoolmcst.darkzone')
plistlib.dump(d, open(p,'wb'))
PY
  "$T/rcodesign" sign "$M/DARKZONE.app" >/dev/null 2>&1 || echo "warning: signing failed for $arch"
  printf 'DARKZONE for Mac\n\n1. Double-click the zip to unpack it, then drag DARKZONE into your Applications folder.\n2. The first time only: right-click DARKZONE and choose Open, then click Open again.\n   (macOS asks because the game is not from the App Store.)\n   If macOS says it is damaged, open Terminal and run:  xattr -cr /Applications/DARKZONE.app\n3. After that, open it like any other app. It downloads new patches by itself.\n' > "$M/READ ME FIRST.txt"
  NAME=$([ $arch = arm64 ] && echo AppleSilicon || echo Intel)
  (cd "$M" && zip -qry "$OUT/DARKZONE-Mac-$NAME.zip" DARKZONE.app "READ ME FIRST.txt")
done
ls -la "$OUT"/*.exe "$OUT"/*.zip
