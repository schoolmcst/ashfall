# Working on ASHFALL (notes for Claude)

The owner (GitHub `schoolmcst`) asks for changes in chat; you make them, test them and ship them as a patch.

## Build and test
- `bash game/build.sh` concatenates `game/src/*` (order is in the script) into `game/ashfall.html` and syntax-checks it.
- Tests: `node game/test/run.js game/test/s_weapons.js` (also `s_modes.js`, `s_boot.js`). They need the global Playwright
  and Chromium at `/opt/pw-browsers`; the page is loaded with `#debug`, which exposes `window.__A` (game internals).
- Multiplayer: `node game/test/mp2.js` runs three players with real WebRTC and a local stand-in signalling server
  (`sigserver.js`); `game/test/mp.js` tests the claude.ai `room` version.

## Ship a patch (every installed app downloads it on next launch)
**The owner tests every change before players get it. Always two steps:**
1. Make the change in `game/src`, build, run the tests.
2. `tools/release.sh test <next version> "note" ...` then commit + push. This updates `release-test/`, which only the
   owner's "ASHFALL TEST" launcher reads (`Documents\ASHFALL Setup\ASHFALL TEST.cmd`; it starts the app with
   ASHFALL_UPDATE_BASE pointing at release-test/ and a separate profile folder). Tell the owner to open ASHFALL TEST.
3. Only when the owner says it is good: `tools/release.sh public`, commit + push. Every player gets it on next launch.
- Online matches only pair players on the same game version (the version is part of the match slot names).
- Only `app/main.js` / `app/preload.js` changes need a new app download (`app/pack.sh`, then upload the zips to a
  GitHub Release); raise `minApp` in `release/version.json` if a patch depends on a new app.

## Game architecture (short)
- Three.js r128 (from cdnjs; the app swaps in a local `three.min.js`). Coordinates: x right, y up, -z forward.
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
