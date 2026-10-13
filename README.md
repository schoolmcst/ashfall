# ASHFALL

A first-person shooter with 32 guns modelled in Blender, attachments, six bot modes, Survival,
and online multiplayer (Quick Play, private codes, games on your Wi-Fi). Windows and Mac.

## Play

Download the app for your computer from the **Releases** page of this repository:

| Computer | File |
|---|---|
| Windows | `ASHFALL-Windows.zip` |
| Mac with an M1/M2/M3/M4 chip | `ASHFALL-Mac-AppleSilicon.zip` |
| Older Intel Mac | `ASHFALL-Mac-Intel.zip` |

Unzip it and follow `READ ME FIRST.txt` inside. Updates download automatically every time you open the game.

### Online

Choose **Online Team Deathmatch** or **Online Free-for-All** in the lobby:

- **Quick Play** puts you in the first open public match, or starts one that the next player joins.
- **Private match code**: everyone in your group types the same code.
- **On your Wi-Fi**: games hosted on your home network appear in a list.

Up to 16 players per match. Bots fill empty spots and leave as people join.
If the host quits, another player takes over hosting automatically.

## Repository layout

- `game/src/` — the game source; `game/build.sh` builds `game/ashfall.html`.
- `game/test/` — headless tests (Playwright + Chromium).
- `hq/` — Blender scripts that model every gun and attachment.
- `app/` — the desktop app shell (Electron) and `pack.sh`, which builds the Windows and Mac zips.
- `release/` — what installed apps download: `version.json` and `ashfall.html`.
- `tools/release.sh` — publishes a patch.
