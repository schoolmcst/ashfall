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
