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
- 1.2.78 PUBLIC: movement.js SLIDE (sprint + crouch; mvSlide takes over P.vx/vz while P.slideT > 0; slide-jump keeps speed)
  and MANTLE (jump at a ledge 0.55-2.15 m above the feet, with room on top; mvLedge/mvMantle, P.mantle animates the climb,
  no firing). The state object is MOV (MV is map voting). Test s_slidemantle steps updatePlayer at a fixed 60 fps.
- 1.2.79 PUBLIC: squads.js LAST TOKE DUOS / SQUADS (offline vs bots; the LAST TOKE tile opens sqPicker). M.squad = 2|4;
  squadmates share entry.team (floor(i / squad)), isFriend() counts M.squad. Downed instead of killed while a squadmate
  stands (sqPlayerDown from hurtPlayer, sqBotDown from damageEnemy; e.sqFinal skips it for the bleed-out kill), 15 s bleed,
  3.5 s revive (USE by me, sqBotGoal for bots), sqGroup lands squads together, last squad standing ends it in brUpdate.
  Online LAST TOKE is still solo. Test: s_squads.
- 1.2.80 PUBLIC: ping.js PINGS (bind 'ping' = Z, middle mouse, pad 14 D-PAD LEFT): pingPick aims at an enemy / loot crate /
  vehicle / the spot; markers go through markerList (ping: 1); bot teammates answer (lkp / goal) and botCallout pings for
  you; online in presence `pg` = [seq, kind, x, y, z], shown to team-mode teammates. Test: s_ping.
- 1.2.81 PUBLIC (owner said send it): duel.js THE HOTBOX DUEL (offline LAST TOKE on stashisle: first death before phase 2 -> a 1v1 in the walled
  pit DUEL_PEN at (54,-20) vs a dead bot, winner back to the island; duelTake from hurtPlayer; crates/spawns/grass skip
  the pit). Bots climb (mvBotTryClimb in the stuck check, mvBotClimb in the bots' loop, mvLedgeAt shared). buildSpawns
  covers the whole PLAYRECT now (was +-41). ONLINE LAST TOKE DUOS / SQUADS: modes obr2/obr4 (def.squad); squad from
  sqNetPick (presence tm), host bots via sqNetBotTeam; presence dn/rv/rb (sqNetPres/sqNetApply); host names the winner
  as winTxt 'SQ:<team>'. Online parts are untested against a real server. Tests: s_duel, s_botclimb, s_sqnet.
- 1.2.82 PUBLIC (owner said send it): online Prop Hunt and online LAST TOKE never applied the host's state on joiners (phUpdate / brUpdate did not
  call netObjApply): a joining hunter sat on a frozen 20 s blindfold, BR joiners never saw the cloud or crates. Fixed.
  partyRedirect (party.js): a party leader starting an offline mode with friends in the party takes everyone into the
  online version (quickPlay(only)). Squad hits from squadmates are ignored on the receiving side too.
- REAL MULTIPLAYER TESTS WORK HERE NOW: test/mp_lib.js (N browsers, WebRTC, the local sigserver). Chromium needs
  --disable-features=LocalNetworkAccessChecks (else ws://127.0.0.1 is blocked) and --no-proxy-server; the page is served
  as http://localhost:39990. mp_allmodes.js runs every online mode with 2 players (join, see, state sync, a kill);
  mp_ph.js (Prop Hunt timers through a swap), mp_partyfollow.js (party follows into quick play, out, and from a tile).
  The old mp_*.js / app_*.js tests still use game.test and fail to connect until moved onto mp_lib.js.
- 1.2.83 TEST (batch 1 of the owner's 60-item list): modes6.js ONE IN THE CHAMBER (oic/ooic) and HEADSHOTS ONLY (hso/ohso);
  rejoin.js (REJOIN tile from a saved slot when you drop out; stand-in bots take a leaver's name/team/score, rjJoined gives
  it back; own counts are NET.k/NET.d); social.js INVITE (socInvite sits in a friend's inbox with inv:1 -> JOIN toast);
  lcodes.js loadout codes (DZ1-…); photo.js PHOTO MODE from the pause menu (G.state 'photo'). Tests: s_m6, s_batch1,
  mp_rejoin, mp_invite. The owner asked for all 60 ideas ("do it all"): batches 2-7 follow (fights, LAST TOKE, weapons,
  modes, progress, the rest).
- 1.2.84 TEST (batches 2+3): wallbang.js (bullets through thin boxes, WB_PEN per class), breakable.js (seeded wooden cover
  on every MP map, BRK; presence bk), movement.js PRONE/DIVE (bind prone = B), fieldup.js FIELD UPGRADES (T; class.fu;
  cover = a BRK 'shield', presence fc), tactical.js DECOY / MOTION SENSOR / TROPHY (new EQUIP), movers.js JUMP PADS +
  ZIPLINES (stashisle only). lasttoke2.js: armor plates (bind plate = 4, G.armor), cash + BUY STATIONS (G.menuOpen stops the
  pause-on-unlock), contracts (bounty/scavenger), the storm (host presence wx), supply drops (BR tier 3), RANKED LAST TOKE
  'rbr' (rankMatch uses placement). Tests: s_wallbang, s_breakable, s_prone, s_fieldup, s_tactical, s_movers, s_lasttoke2.
- 1.2.85 PUBLIC (batches 4-7a): weapons2.js (CROSSBOW, THE BONG launcher, throwing knife EQUIP.knife, WATCHER and HOTBOX
  STRIKE streaks, BLUEPRINTS); modes7.js KNIFE FIGHT / ESCORT THE PLUG ('X') / THE HEIST ('Y') / GROW WARS (+ online o*).
  progress2.js TROPHIES screen (TRO state; 49 achievements in PROG.cnt/PROG.ach with 'ach_*' banners, tracers PROG.trc,
  kill effects PROG.kfx, emotes on J with presence em, podium on results, prestige tokens shop, heatmaps PROG.heat);
  G.killSrc ('wall'/'knife'/'bolt'/'veh') is set around those damageEnemy calls. crewhouse.js CREW WARS; Season 3 HIGH TIMES
  (BP3_ITEMS generated in progress.js). events2.js: FROSTY NUGS winter event + EVENTS CALENDAR (click the event strip),
  LIVING MAPS weather (AMB; ambTick in updateFx), STASH HOUSE RADIO (S.radio, radioStep; music loop steps at radioStepLen).
  tools.js AIM TRAINER (range pause menu) + HUD EDITOR (S.hud). rules.js custom match RULES (cfg.rules -> M.feat; wraps
  equipClass). tourney.js THE CUP (TOUR in ashfall.tour.v1; cfg.names/cfg.tour). touch.js, lang.js (S.lang, a
  MutationObserver swaps exact strings), squadvox.js (wraps sqBotDown/sqBotUp/sqPlayerDown/damageEnemy), clipshare.js
  (.dzclip files + webm video), zspecial2.js (SCREAMER/SPITTER/BRUTE, zombies TRIALS, ZOMBIES CUSTOM GAME ZCUS: Z.custom
  never sets a best), growbreed.js (6 HYBRIDS, g.breed), map_new.js THE TRIM HOUSE + SKATE PARK (6v6).
  Files loaded after ui.js (touch, lang, squadvox, clipshare) must not be named as consts in window.__A (TDZ).
  Tests: s_weapons2, s_modes7, s_progress2, s_tools, s_batch7.
- 1.2.86 PUBLIC (batch 7b, the last of the 60): map_stashw.js WINTER STASH ISLAND (same id 'stashisle', getters on env/
  grass/name/place; batches swapped to snow after build; by date Dec-Feb or FROSTY NUGS; ISLE_W.force for tests).
  crewwalk.js the WALK-IN STASH HOUSE (hidden map 'crewhouse', run as mode 'range' with cfg.house; rangeStart/rangeTick/
  rangeHud/musWanted wrapped; USE spots: door, radio, arcade = aim trainer, crew wars board). map_bay.js + zmap_bay.js
  ZOMBIES CHAPTER 7 BAYVIEW (the finale; same plan as the two ships so doors/perks/windows match; boss THE CHAIRMAN; text
  cont 'THE END'). editor.js MAP EDITOR (CUSTOM > MAP EDITOR; ashfall.maps.v1, 5 slots, DZM1- codes, plays as hidden
  'edit_map', offline only). camp_story2.js CAMPAIGN CHAPTER 2 SECOND HARVEST (c2m1 trimhouse, c2m2 skatepark, c2m3
  bayview; new CCHARS 'driver'). campcoop.js CAMPAIGN CO-OP for 2 (P2P.aside('code','camp','cc'+code); host runs the
  mission, the friend draws proxies (e.ccProx, no entry so updateBots skips them), hits go as hs records, hunting proxies
  shoot the friend locally, the friend follows CAMP.i and the end). Fixed: camp escort tick ran past its last waypoint.
  window.__A is built in ui.js BEFORE later files wrap functions: export lazy lambdas (ccPlayL etc.), not the functions.
  Tests: s_batch7b, s_zbay, s_editor, s_camp (MISSION=c2m1/2/3), mp_campcoop.
- 1.2.90 TEST (released to TEST APP): island v3 + map + controller + LAST TOKE intro.
  terrain.js: a height field (TERR, TH(x,z)) on maps that want one (only stashisle); groundAt starts from TH, buildNav uses
  it as the floor, terrSlope (in resolve(.., slope) and vehicles) stops climbs steeper than ~42 degrees, the ground mesh is
  added to the ray chunks. BUILD_YOFF raises everything placed while building a POI on its pad (mkBox, batchAdd, rayAdd,
  lampLight; NOT placeProp, it goes through batchAdd). map_stash2.js: STASH_POIS each sit on a flat pad at its own height
  (town 8, school 12, radio hill 26, estate 14 cliff, lighthouse 18 sea cliff, quarry pit 9 / rim 15, docks 1.2 ...),
  stashNat (coast, hills, peaks) + STASH_RAMPS (roads up). Crates go only on loot spots when a map has them (quality q).
  mapscreen.js: the MAP (M / D-pad down in LAST TOKE or on terrain): height-shaded picture, POI names, cloud now/next,
  squad, vehicles, pings; click/A sets a waypoint; a banner when you walk into a POI. padmore.js: controller on the map,
  emote wheel (hold D-pad left), map editor, HUD editor and B-closes for the newer overlays (s_pad uses a fake gamepad).
  brintro.js: LAST TOKE WARM-UP (B.phase -3, 20 s / 30 s online, random good gun, free respawns, kills reset after, no
  crates, USE skips offline) -> THE BONG HIT (B.phase -2: a cinematic on THE HOTBOX CLOUD at y 210 above the map, me or the
  squad passing it round, JUMP skips; all enemies hidden locally while it plays) -> THE FLOAT IN (B.phase -1: start ~150 m
  up, steer, CROUCH dives, soft landing; nobody can be hurt while floating; e.brFloat on bots, host-run; squads start and
  land together, so sqGroup is skipped). Tests skip it: run.js / mp_lib set window.BR_SKIPINTRO unless INTRO=1.
  Fixed: online remote players' height was clamped to 0-12 m (net.js), wrong on hills; the LAST TOKE line (alive, cloud)
  was never shown in the top bar. Tests: s_pad, mp_brintro (online intro), s_isle2.
- 1.2.89 TEST: STASH ISLAND REMADE at 390.98 m square = 152,865 m² (STASH_A 200, STASH_H 195.49), original layout
  (not a copy of any other game's map). map_stash2.js: stashBld (2-3 storey buildings: rooms with 1.8 m doorways, a
  switchback stairwell along the north wall - north doors go at the east end of that wall -, open windows, walkable
  roofs with a parapet, loot spots in STASH_LOOT), stashHall (warehouses with a mezzanine), stashTiers/stashRamp
  (raised ground with visible ramps), the ESTATE cliff (solid pieces either side of a roofed tunnel + THE CELLAR rooms).
  Nav on huge maps (ARENA > 120): flow fields Int16, cache 12, BFS stops at 190 steps (~95 m). Crates have a height
  (brCrate y; the 'b' pack is 5 numbers a crate, up to 200); 120 crates, ~65% on loot spots. BR_PHASES_BIG (5 phases).
  Moved for the new island: DUEL_PEN, MOVERS.stashisle, VH_SPOTS (18), LT buy spots (6) and contracts (12), 90
  breakables. Test: s_isle2 (size, every loot spot reachable by bots, pictures).
- 1.2.88 TEST: EDIT HUD button fixed (settings actions only reach lnAct for sv-/bk-/er-; hud-edit is now a ui.js case), also in the pause menu.
- 1.2.87 PUBLIC (the follow-ups): campaign co-op friend can finish action steps (CC_ACT go/use/multi/pick/carry/search/
  photo: the client's suppressed campStepDone sends rq [step, seq]; the host finishes it). MAP EDITOR online: pick MY MAP
  in a private match (plobby MAP list, edPrivPick); the host sends its code as presence ec every 10th update (edNetCode);
  clients edNetGot -> edDefine -> netSwitchMap. zww_bay.js THE GREEN LIGHTNING (BAYVIEW wonder weapon, chains up to 7 /
  12 upgraded; wraps zwwFire/zwwTick/zwwClear). Tests: mp_campcoop (GO by the friend), mp_editmap, mp_zcoop2 (zombies
  co-op on mp_lib; the old mp_zomb.js predates the Chromium network flags and can't connect), s_zwwbay.
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
