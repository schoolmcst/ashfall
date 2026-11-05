# Working on ASHFALL (notes for Claude)

The owner (GitHub `schoolmcst`) asks for changes in chat; you make them, test them and ship them as a patch.

## Build and test
- `bash game/build.sh` concatenates `game/src/*` (order is in the script) into `game/ashfall.html` and syntax-checks it.
- Tests: `node game/test/run.js game/test/s_weapons.js` (also `s_modes.js`, `s_boot.js`). They need the global Playwright
  and Chromium at `/opt/pw-browsers`; the page is loaded with `#debug`, which exposes `window.__A` (game internals).
- Multiplayer: `node game/test/mp2.js` runs three players with real WebRTC and a local stand-in signalling server
  (`sigserver.js`); `game/test/mp.js` tests the claude.ai `room` version.

## Ship a patch (every installed app downloads it on next launch)
**The game is in BETA.** Every release is a beta: the title screen, version tag and patch-notes popup say BETA. Keep it that way until the owner says otherwise.
**The owner tests every change before players get it. Always two steps:**
1. Make the change in `game/src`, build, run the tests.
2. `tools/release.sh test <next version> "note" ...` then commit + push. This updates `release-test/`, which only the
   owner's separate **TEST APP** reads (installed from `Downloads\TEST APP Setup`, built with
   `CHANNEL=test app/pack.sh`; its package.json has `"channel": "test"`, so it reads release-test/, keeps its own saves
   and shows a TEST APP tag). Tell the owner to open TEST APP.
3. Only when the owner says it is good: `tools/release.sh public`, commit + push. Every player gets it on next launch.
- Online matches only pair players on the same game version (the version is part of the match slot names).
- Only `app/main.js` / `app/preload.js` changes need a new app download (`app/pack.sh`, then upload the zips to a
  GitHub Release); raise `minApp` in `release/version.json` if a patch depends on a new app.

## Game architecture (short)
- Three.js r128 (from cdnjs; the app swaps in a local `three.min.js`). Coordinates: x right, y up, -z forward.
- Maps: `maps.js` (registry, `loadMap`, building kit: blk/slab/wall/stairs/ramp/rail/container...), one file per map
  (`map_docks.js`, `map_town.js`, `map_metro.js`; the original is `buildWorld` in `world.js`, id `ruins`). Each map has a
  `layout` (spawns, hardpoints, flags, sites; points can carry `y`), `env` (sky/sun/fog), `navPts` for tests.
  `nav.js` is a 0.5 m grid with up to 3 floors per cell; stairs/ramps are flagged so bots climb them only head-on.
  Boxes can have a bottom (`y`) so you can walk under floors. Check a map with `MAP=<id> node game/test/run.js
  game/test/s_map.js` (plan + views + reachability) and `s_navsim.js` (bots walking between points).
- Online: the host picks the map (`netSwitchMap`), publishes `mp`/`ho` in presence; others follow; it rotates each round.
- `armory.js` 32 guns (`ARMORY`, `ARM[id]`); `HQDATA` (in `hqdata.js`, generated) holds the Blender meshes; `attach.js`
  attachments, loadout menu and 3D preview; `match.js` modes and bots; `net.js` online play; `p2p.js` WebRTC transport for
  the app (host-star, Quick Play slots, host migration); `ui.js` screens, input, main loop.
- Online: each player publishes their own state as "presence"; the victim's game owns its health (hits are records in the
  shooter's presence). In the app the host also runs bots that fill teams to 6 (FFA 8) and sends them as extra players.

## Blender models
- Scripts in `hq/` run inside Blender on the owner's second monitor. `watcher.py` (started once in Blender's Python
  console) runs any `Documents\ashfall\hq\jobs\*.py`. Drop job files through the device bridge; never click on or take
  focus from the owner's main monitor — they game on it.
- Output JSON lands in `Documents\ashfall\hq\out\`; `hq/hqpack.py` packs them into `game/src/hqdata.js`.

## Where things stand (handoff, Nov 2026)
- TEST APP has 1.2.64 (zombies chapter 6 THE HIGH TIDE: map_tide.js, ZMAPCFG.hightide, THE DISCO BONG, THE CRUISE DIRECTOR)
  and 1.2.63 (BLOOM & COLOUR: post.js - bloom, grading, FXAA, sharpen; setting `post` off/low/high + `bloom`), on top of
  1.2.62 (THE MARY JANE), 1.2.61 (DISPENSARY ROW, SMOKE OUT, RE-UP, PUFF PUFF PASS) and 1.2.60 (Season 2, save codes...).
  The owner said "send it": 1.2.64 (with everything since 1.2.59) is promoted to release/ on the claude branch; it
  reaches players once that branch is merged into main.
- After that: 1.2.65 (frame-drop fix: post.js keeps its targets across dynamic resolution; SHADOW BRIGHTNESS), 1.2.66
  (scanned surface families in realtex.js: paintm/steelp/plaster/tile/fabric/planks, greyscale + matched roughness) and
  1.2.67 (GUNSMITH 2.0: 7 attachments, drag/zoom INSPECT on the preview, 8 weed charms; test s_gunsmith.js). All of it
  is PUBLIC as 1.2.67 (owner said "send it").
- 1.2.68 + 1.2.69 are PUBLIC (owner said send it).
- 1.2.68: growop.js (THE GROW OP), modes4.js (PROP HUNT ph/oph), map_hotbox.js (zombies ENDLESS, ZMAPCFG.hotbox.classic),
  map_night.js (4 night remasters in rotation), prestige 11-20 + PRES_CHARMS, replay theatre (RP_LIB in replay.js), feedback.js
  (hit markers, kill sounds, streak glow), accessibility (post.js COLOUR FILTER, subtitles, AIM ASSIST STRENGTH).
- 1.2.69: modes5.js LAST TOKE (battle royale 'br', offline only so far), crewhouse.js (CREW STASH HOUSE on the leaderboard
  CREW tab; crew points travel on friend cards: cp/ck/ckw), WATCH a friend (specWatch in net.js; spectators publish spec:1 and
  are skipped by inRoom). Prop Hunt online and WATCH are untested here (mp tests cannot reach the signalling server).
  Tests: s_growop, s_prophunt, s_zhotbox, s_theatre, s_crewhouse, s_lasttoke.
- 1.2.70-1.2.71 PUBLIC: online LAST TOKE (obr; host packs ['b', ...], players' opened crates in presence `bo`), Prop Hunt
  online pack code is 'q' (not 'h', that is hardpoint), optimize pass (warmShaders, light pool zlpMatch in MP, no canvas MSAA
  with post on, menu 60 fps cap, rpPlanShot renders off-screen).
- 1.2.72-1.2.74 PUBLIC (owner said send it). 1.2.72: onboard.js (WELCOME card + STASH YARD training for new players, READY card, NEW MODES card for returning players
  keyed `ashfall.newmodes`, menu tiles #featTile/#brTile, FEATURED THIS WEEK mode: FEAT_WEEKS, M.feat {lowgrav, bighead,
  pistols}, 2x XP), replay.js rpAutoClip (best multi-kill saved as a clip), growop.js growZRound/GROW_ZBOSS (zombies seeds).
- 1.2.73: map_stash.js STASH ISLAND (brOnly, arena 64 = 128 m nav grid, play +-60). ARENA is now a per-map `let`
  (world.js) set by setArena() in nav.js from map.arena (default 44); the ruins builder uses RUIN_A. On a big map
  flowField builds at most one new field a frame (FLOWB); callers walk straight that frame. pickMapFor sends LAST TOKE
  'random' to stashisle (offline and online via NET.mode). Menu cards (data-menu) close when a match starts.
- 1.2.74: vehicles.js GOLF CART + DIRT BIKE in LAST TOKE (VH_SPOTS per map, else 4 seeded spots). vhPlayer() takes over
  updatePlayer (and the camera) while driving; no shooting (isFiring); ram damage; crash and explosion damage (vhBlast in
  explode); online the driver sends presence `vh` = [id, x, z, yaw, speed, hp]. Bots do not drive. Tests: s_stashisle,
  s_vehicles, _isle_bots (no-render bot sim).
- 1.2.75 PUBLIC: LAST TOKE is 16 players (match.js and lobby.js capped FFA counts at 12). BR bots now really use brGoal
  (botGoal only called m2Goal for kc/dom/ru before: they ignored the circle and crates). Bots drive: vhBotWant (from brGoal
  when far from the circle), vhBotDrive (in the bots' loop, skips walking and shooting), vhPhys shared with the player;
  the host sends its bots' vehicles as presence `vb`. Free vehicles are white squares on the radar. Test: s_botdrive.
- 1.2.76 PUBLIC (owner asked; said send it): the plain UAV shows enemies on the minimap only (stkMarks needs STK.vuav; the ADVANCED UAV
  still marks them on screen). LAST TOKE loot crates are not drawn on the minimap (drawRadar skips t === 'LOOT'); their
  on-screen LOOT tags stay. Test: s_uavradar.
- 1.2.77 PUBLIC (owner said send it; menu and lobby too cluttered, keep everything): uicompact.js is a style sheet loaded last. Top bar has
  the logo + card on one line and every tab on a slim second line. Menu: MULTIPLAYER hero tile, CAMPAIGN/ZOMBIES/FEATURED/
  LAST TOKE 2x2, STASH YARD/REPLAY/SETTINGS(/EXIT in the app, class ex4) as small buttons; tile order is CSS `order`, so
  runtime-inserted tiles land right; NEWS is a small bottom-right panel. Lobby: slimmer rows, two-column roster (direct
  .ros-team children of .cod-roster only, not the party box), compact notes and chat; the zombies lobby (#lobby.zl, set in
  renderZLobby) lays its rows out in two columns, `.cod-row.wide` spans both. Pictures: _menushot.js, _applobshot.js.
- 1.2.78 TEST: movement.js SLIDE (sprint + crouch; mvSlide takes over P.vx/vz while P.slideT > 0; slide-jump keeps speed)
  and MANTLE (jump at a ledge 0.55-2.15 m above the feet, with room on top; mvLedge/mvMantle, P.mantle animates the climb,
  no firing). The state object is MOV (MV is map voting). Test s_slidemantle steps updatePlayer at a fixed 60 fps.
- 1.2.79 TEST: squads.js LAST TOKE DUOS / SQUADS (offline vs bots; the LAST TOKE tile opens sqPicker). M.squad = 2|4;
  squadmates share entry.team (floor(i / squad)), isFriend() counts M.squad. Downed instead of killed while a squadmate
  stands (sqPlayerDown from hurtPlayer, sqBotDown from damageEnemy; e.sqFinal skips it for the bleed-out kill), 15 s bleed,
  3.5 s revive (USE by me, sqBotGoal for bots), sqGroup lands squads together, last squad standing ends it in brUpdate.
  Online LAST TOKE is still solo. Test: s_squads.
- Poly Haven is reachable from the cloud environment `ashfall` (allowed hosts dl.polyhaven.org, api.polyhaven.com). To see
  real scans in tests, download them to a folder and run with PHCACHE=<folder>; `_texcmp.js` makes texture pictures.
- The apps download from **main**. Work done on a claude/* branch reaches TEST APP only once it is merged into main.
- Before/after graphics pictures: `MAPS=a,b SHOTS=dir node game/test/run.js game/test/_postcmp.js`.
- The owner asked for Unreal Engine once: not possible here (no editor; would be a full rewrite and break patching).
  The visual upgrade path is post.js, better materials and the Blender models instead.
- Cloud containers may lack the test paths: link /opt/node-tools/node_modules/playwright to
  /home/claude/.npm-global/lib/node_modules/playwright and the newest /opt/pw-browsers/chromium-*/chrome-linux64/chrome to
  /opt/pw-browsers/chromium-1194/chrome-linux/chrome. The mp_* tests could not reach the local signalling server there.
- Open: the owner saw red error boxes once. The error box now has COPY REPORT; ask for the pasted report.
- Owner's rules: everything stays BETA; weed/drug theme; built-in voices only; gold is only the weapon-grind reward;
  lots of pictures and time estimates in replies; never click or take focus on the owner's main monitor.
- Leave secretvids.js and the SECRET_PACK block in progress.js untouched and never bring them up.
- Tests that cover the newest work: s_ztide.js, s_season2.js, s_launch.js, s_modes3.js, mp_modes3.js, s_zship.js, s_zisle.js.
