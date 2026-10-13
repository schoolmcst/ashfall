#!/bin/bash
# Publish a game patch: every installed app downloads it the next time it opens.
# usage: tools/release.sh 1.0.1 "What changed" "Another change" ...   then commit + push.
set -e
V=${1:?version like 1.0.1}; shift
ROOT=$(cd "$(dirname "$0")/.." && pwd)
bash "$ROOT/game/build.sh"
cp "$ROOT/game/ashfall.html" "$ROOT/release/ashfall.html"
python3 - "$ROOT/release" "$V" "$@" <<'PY'
import hashlib, json, sys
d, v, notes = sys.argv[1], sys.argv[2], sys.argv[3:]
h = hashlib.sha256(open(d + '/ashfall.html', 'rb').read()).hexdigest()
json.dump({"version": v, "notes": notes, "sha256": h, "minApp": "1.0.0"}, open(d + '/version.json', 'w'), indent=1)
print('release', v, h[:12], notes)
PY
