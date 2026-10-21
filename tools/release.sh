#!/bin/bash
# Patches go out in two steps.
#   tools/release.sh test 1.0.1 "note" ...   -> release-test/ : only the owner's "ASHFALL TEST" launcher gets it
#   tools/release.sh public                  -> copies the tested release-test/ to release/ : every player gets it
# Commit + push after each step. Never run "public" until the owner has tested and said yes.
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd); MODE=${1:?test or public}
if [ "$MODE" = public ]; then
  [ -f "$ROOT/release-test/version.json" ] || { echo "nothing in release-test"; exit 1; }
  cp "$ROOT/release-test/ashfall.html" "$ROOT/release-test/version.json" "$ROOT/release/"
  echo "promoted $(python3 -c "import json;print(json.load(open('$ROOT/release/version.json'))['version'])") to everyone"; exit 0
fi
[ "$MODE" = test ] || { echo "usage: release.sh test <version> notes... | release.sh public"; exit 1; }
V=${2:?version like 1.0.1}; shift 2
# the main-menu NEWS panel: every public release so far plus this one
(cd "$ROOT" && python3 -c 'import json,sys,datetime; print(json.dumps({"version": sys.argv[1], "notes": sys.argv[2:], "date": datetime.date.today().isoformat()}))' "$V" "$@" | python3 tools/mknews.py)
bash "$ROOT/game/build.sh"
cp "$ROOT/game/ashfall.html" "$ROOT/release-test/ashfall.html"
python3 - "$ROOT/release-test" "$V" "$@" <<'PY'
import hashlib, json, sys
d, v, notes = sys.argv[1], sys.argv[2], sys.argv[3:]
h = hashlib.sha256(open(d + '/ashfall.html', 'rb').read()).hexdigest()
json.dump({"version": v, "notes": notes, "sha256": h, "minApp": "1.0.0"}, open(d + '/version.json', 'w'), indent=1)
print('test release', v, h[:12], notes)
PY
