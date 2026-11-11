#!/bin/bash
cd "$(dirname "$0")"
OUT=${OUT:-ashfall.html}
cat src/head.html src/{savebak,core,terrain,samples_data,samples,audio2,gfx1,tex,realtex,world,nav,pbr,gundata,modeldata,models,models2,maps,props,props2,map_docks,map_town,map_metro,map2_kit,map2_yard,map2_shoot,map2_terminal,map2_spire,map2_dust,map2_snow,map2_pier,map2_ridge,furnish,map2_dress,map2_hospital,map2_green,map_works,map_airport,map_island,map_ship,map_tide,map_bay,map_hotbox,map_disp,map_fest,hqdata,mapshots,map_night,map_stash,map_stash2,map_new,map_homestead,map_stashw,breakable,fieldup,movers,armory,classes,tactical,nades2,fx,game1,finisher,movement,wallbang,game2,stats,news,match,modes2,modes3,modes4,modes5,brintro,brloot,brsquad,brbots,brfight,brisle,brprog,brnet,brextra,lasttoke2,modes6,modes7,rejoin,lcodes,photo,vehicles,squads,ping,duel,inf,gf,brain,botroles,botguns,lobby,rules,ragdoll,deathcam,potg,polish,streaks,streaks2,weapons2,access,perf,perfmode,post,feedback,bench,attach,p2p,net,mapvote,plobby,pubplay,party,social,chat,voice,comms,matchflow,music,replay,secretvids,progress,progress2,grind,bpass,weekly,growop,growbreed,tourney,crewhouse,meta2,events2,tools,homecoming,onboard,horde,hhbase,zombies,zcoop,zdoors,zperks,zvoice,zstory,zmaps,zmap_bay,zextras,candy,camp,camp_story,camp_story2,launch,zspecial,zspecial2,osk,uicompact,ui,touch,lang,squadvox,clipshare,crewwalk,editor,campcoop,zww_bay,mapscreen,padmore}.js src/tail.html > $OUT
python3 - "$OUT" <<'PY'
import sys,re
s=open(sys.argv[1]).read()
i=s.index("window.__ashfallBoot = ()"); j=s.index("</script>",i)
open('/tmp/_chk.js','w').write(s[i:j])
PY
node --check /tmp/_chk.js && echo OK $(wc -c < $OUT)
