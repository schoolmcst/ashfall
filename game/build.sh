#!/bin/bash
cd "$(dirname "$0")"
OUT=${OUT:-ashfall.html}
cat src/head.html src/{savebak,core,samples_data,samples,gfx1,tex,realtex,world,nav,pbr,gundata,modeldata,models,models2,maps,props,props2,map_docks,map_town,map_metro,map2_kit,map2_yard,map2_shoot,map2_terminal,map2_spire,map2_dust,map2_snow,map2_pier,map2_ridge,furnish,map2_dress,map2_hospital,hqdata,mapshots,armory,classes,fx,game1,game2,stats,news,match,brain,botroles,botguns,lobby,ragdoll,deathcam,polish,streaks,perf,bench,attach,p2p,net,plobby,pubplay,party,social,chat,voice,comms,matchflow,music,replay,secretvids,progress,grind,bpass,homecoming,zombies,zcoop,zdoors,osk,ui}.js src/tail.html > $OUT
python3 - "$OUT" <<'PY'
import sys,re
s=open(sys.argv[1]).read()
i=s.index("window.__ashfallBoot = ()"); j=s.index("</script>",i)
open('/tmp/_chk.js','w').write(s[i:j])
PY
node --check /tmp/_chk.js && echo OK $(wc -c < $OUT)
