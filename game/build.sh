#!/bin/bash
cd "$(dirname "$0")"
OUT=${OUT:-ashfall.html}
cat src/head.html src/{core,samples_data,samples,gfx1,tex,realtex,world,nav,pbr,gundata,modeldata,models,models2,maps,props,map_docks,map_town,map_metro,hqdata,armory,classes,fx,game1,game2,stats,match,lobby,ragdoll,deathcam,polish,streaks,perf,bench,attach,p2p,net,plobby,ui}.js src/tail.html > $OUT
python3 - "$OUT" <<'PY'
import sys,re
s=open(sys.argv[1]).read()
i=s.index("window.__ashfallBoot = ()"); j=s.index("</script>",i)
open('/tmp/_chk.js','w').write(s[i:j])
PY
node --check /tmp/_chk.js && echo OK $(wc -c < $OUT)
