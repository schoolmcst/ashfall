/* ================================================================== ONE IN THE CHAMBER and HEADSHOTS ONLY (1.2.83)
   ONE IN THE CHAMBER ('oic'): everyone gets a pistol with ONE bullet and no spare ammo. Every bullet kills. A kill gives
   you another bullet (a miss doesn't come back), and melee still works. Three lives each; lose them all and you watch.
   Last one standing wins. Online ('ooic'): the same guns and bullets, no lives limit, first to 15 kills wins the round.
   HEADSHOTS ONLY ('hso'): any gun, but only hits to the head count, and one headshot kills. Bodies, legs, grenades and
   melee do nothing. Bots play by the same rules (they only hit when they would have hit the head). Online: 'ohso'. */
const OIC_LIVES = 3;
function m6Setup() {
  M.oic = M.mode === 'oic' ? { k: 0, lives: OIC_LIVES } : null;
  M.hso = M.mode === 'hso' ? {} : null;
  if (M.oic) try { showBanner('ONE IN THE CHAMBER', `one bullet · every shot kills · a kill gives a bullet${M.online ? ' · first to 15' : ` · ${OIC_LIVES} lives`}`); } catch (e) {}
  if (M.hso) try { showBanner('HEADSHOTS ONLY', 'only the head counts · one headshot kills'); } catch (e) {}
}
const oicPistol = () => WEAPONS.find(w => w.def && w.def.cat === 'pi') || WEAPONS[1] || WEAPONS[0];
function oicArm() {
  try { equipClass({ only: 'sidearm', e: 'frag', k: 'none', factory: true }); } catch (e) {}
  G.grenades = 0; const w = oicPistol(); if (w) { w.ammo = 1; w.reserve = 0; } M.oic.k = G.kills; M.oic.armed = true;
}
// every frame of the match
function m6Update(dt) {
  if (M.oic) {
    const O = M.oic, alive = playerAlive();
    if (alive && !O.armed) oicArm(); if (!alive) O.armed = false;
    if (alive) { for (const w of WEAPONS) w.reserve = 0; if (G.kills > O.k) { const w = oicPistol(); if (w) w.ammo = Math.min((w.ammo | 0) + (G.kills - O.k), w.def && w.def.mag || 8); O.k = G.kills; } G.grenades = 0; }
    for (const e of enemies) { if (!e.entry || e.net) continue; if (!e.oicInit) { e.oicInit = 1; e.oicAmmo = 1; try { botGunProfile(e, 'sidearm'); } catch (er) {} } e.dmg = 999; }
    // offline: last one with lives left wins
    if (!M.online && !M.over) {
      const left = M.entries.filter(en => en.deaths < OIC_LIVES);
      if (left.length <= 1 && M.t > 3) { try { showBanner(left[0] === M.me ? 'LAST ONE STANDING' : 'OUT OF LIVES', left[0] === M.me ? 'you win' : (left[0] ? left[0].name + ' wins' : '')); } catch (e) {} endMatch(left[0] || null); }
    }
  }
}
// hooks
const oicCanFire = e => !M.oic || (e.oicAmmo | 0) > 0;
function oicBotFired(e) { if (M.oic) e.oicAmmo = Math.max(0, (e.oicAmmo | 0) - 1); }
function oicBotKill(by) { if (M.oic && by && by.entry && !by.net) by.oicAmmo = (by.oicAmmo | 0) + 1; }
const oicOut = en => !!(M.oic && !M.online && en && en.deaths >= OIC_LIVES);
// HEADSHOTS ONLY: a hit that isn't to the head does nothing; a head hit kills
function hsoDmg(dmg, head, boom) { if (!M.hso) return dmg; return head && !boom ? 999 : 0; }
function oicDmg(dmg, by, boom) { return M.oic && by === 'player' && !boom ? 999 : dmg; }
function m6Hud() {
  if (M.oic) { const w = oicPistol(), lv = Math.max(0, OIC_LIVES - (M.me.deaths | 0)); return `<b>${w ? w.ammo | 0 : 0}</b> BULLET${w && w.ammo === 1 ? '' : 'S'}${M.online ? '' : ` · <b>${lv}</b> ${lv === 1 ? 'LIFE' : 'LIVES'} LEFT · ${M.entries.filter(en => en.deaths < OIC_LIVES).length} IN`}`; }
  if (M.hso) return 'HEADSHOTS ONLY';
  return '';
}
