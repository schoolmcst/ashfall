/* ================================================================== NEW WEAPONS, STREAKS and BLUEPRINTS (1.2.85)
   CROSSBOW (marksman slot): silent; fires a heavy bolt that drops a little over distance. A bolt to the body kills
     (105), to the head always. Bolts stick in walls and floors for a while. Sights only (no muzzle, mag or ammo parts).
   THE BONG (launcher slot): lobs a glass shell that bursts in a small blast and leaves a SKUNK stink cloud (no aiming in
     it) for a few seconds. Two shells, slow reload.
   THROWING KNIFE (equipment): thrown fast and nearly straight; kills on any hit and sticks in what it hits.
   WATCHER DRONE (streak): 30 s of a drone over you - every enemy within 30 m shows on screen and the minimap, through walls.
   HOTBOX STRIKE (streak): three smoke canisters on the enemy: thick smoke, and anyone caught in it moves slower and aims
     worse for 8 s.
   BLUEPRINTS (Create a Class, the BLUEPRINTS button): ready-made builds - a gun with a set of attachments - that unlock as
     you level up (one every 4 levels). Using one sets that gun as the class's primary with those attachments. */
// (the weapon entries themselves are in armory.js's list, so they get the normal balance and stats treatment)
function procCrossbow() {
  const g = new THREE.Group(), Pl = VM.poly, St = VM.steel, M = VM.metal;
  g.add(seg([Pt(Bx(0.05, 0.06, 0.6), Pl, 0, -0.01, 0.0), Pt(Bx(0.04, 0.09, 0.1), Pl, 0, -0.06, 0.24, 0.3), Pt(Bx(0.05, 0.08, 0.18), Pl, 0, -0.02, 0.32),
    Pt(Bx(0.012, 0.012, 0.5), St, 0, 0.026, -0.12), Pt(Bx(0.024, 0.016, 0.1), St, 0, 0.05, 0.02), Pt(Bx(0.02, 0.05, 0.04), M, 0, -0.045, 0.1)], 'body'));
  const limbs = seg([Pt(Bx(0.42, 0.018, 0.03), St, 0, 0.018, -0.36), Pt(Bx(0.05, 0.018, 0.05), M, 0.2, 0.018, -0.33), Pt(Bx(0.05, 0.018, 0.05), M, -0.2, 0.018, -0.33)], 'limbs'); g.add(limbs);
  const str = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.003, 0.003), new THREE.MeshBasicMaterial({ color: 0xdddddd })); str.position.set(0, 0.022, -0.2); g.add(str);
  const bolt = seg([Pt(Bx(0.006, 0.006, 0.38), St, 0, 0.034, -0.2), Pt(Bx(0.02, 0.004, 0.03), VM.od || M, 0, 0.034, -0.02)], 'bolt'); g.add(bolt);
  const handL = makeHandL(0, -0.03, -0.18, 1); g.add(handL); g.add(makeHandR(0, -0.06, 0.13));
  g.userData = { rocket: bolt, handL, handLBase: handL.position.clone(), magReach: 0.15, len: 0.42, sightY: 0.07, adsZ: -0.3, railY: 0.06, opticZ: 0, muzzleY: 0.034, barrelR: 0.01 };
  return g;
}
function procBong() {
  const g = new THREE.Group(), glass = new THREE.MeshStandardMaterial({ color: 0x7affc0, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.55 }), St = VM.steel, Pl = VM.poly;
  g.add(seg([ZCyl(0.045, 0.5, glass, 0, 0.03, -0.05, 18), ZCyl(0.06, 0.08, glass, 0, 0.03, 0.22, 18), Pt(Bx(0.03, 0.09, 0.05), Pl, 0, -0.05, 0.12, 0.3), Pt(Bx(0.012, 0.03, 0.1), St, 0.04, 0.02, -0.08, 0, 0.7)], 'body'));
  const bowl = seg([Pt(Bx(0.03, 0.03, 0.03), St, 0.06, 0.05, -0.12)], 'rocket'); g.add(bowl);
  const handL = makeHandL(0, -0.0, -0.2, 1); g.add(handL); g.add(makeHandR(0, -0.05, 0.12));
  g.userData = { rocket: bowl, handL, handLBase: handL.position.clone(), magReach: 0.15, len: 0.3, sightY: 0.1, adsZ: -0.3, railY: 0.08, opticZ: 0, muzzleY: 0.03, barrelR: 0.045 };
  return g;
}
/* ---------- the new projectiles (updateProjectile hands these over) */
const W2_STUCK = [];
function w2Stick(m, p, dir) { const s = m.clone(); s.position.copy(p).addScaledVector(dir, -0.15); s.quaternion.copy(m.quaternion); scene.add(s); W2_STUCK.push({ s, t: NOW + 12 }); while (W2_STUCK.length > 24) { const o = W2_STUCK.shift(); scene.remove(o.s); } }
// true = the projectile is done
function w2ProjHit(g, hit, at0, dir) {
  if (g.proj === 'bolt' || g.proj === 'knife') {
    const ud = hit && hit.object.userData;
    if (ud && ud.enemy) { const head = !!ud.head; G.killSrc = g.proj === 'knife' ? 'knife' : g.proj === 'bolt' ? 'bolt' : ''; damageEnemy(ud.enemy, g.proj === 'knife' ? 999 : g.dmg * (head ? 2 : (ud.mult || 1)), head, dir, false, g.by || 'player'); G.killSrc = ''; if (g.by === undefined || g.by === 'player') { try { fbMarker(true, !enemies.includes(ud.enemy), head); sfx.hit(head); } catch (e) {} } }
    else if (ud && ud.brk !== undefined) brkHit(ud.brk, g.dmg);
    if (!(ud && ud.enemy)) { w2Stick(g.m, at0, dir); try { sfx.impact(at(at0.x, at0.z, 10), false); } catch (e) {} }
    return true;
  }
  if (g.proj === 'stink') {
    if (hit && hit.object.userData.enemy) damageEnemy(hit.object.userData.enemy, g.dmg * 0.3, false, dir);
    explode(at0, 'grenade', g.blast || 3.5, 0.45); try { smkCloud({ x: at0.x, y: at0.y, z: at0.z }, 'skunk', true); } catch (e) {}
    return true;
  }
  return false;
}
function w2Tick() { for (let i = W2_STUCK.length - 1; i >= 0; i--) if (NOW > W2_STUCK[i].t) { scene.remove(W2_STUCK[i].s); W2_STUCK.splice(i, 1); } }
function w2Clear() { for (const o of W2_STUCK) scene.remove(o.s); W2_STUCK.length = 0; }
// the knife: thrown like a fast projectile instead of a grenade
function knifeThrow() {
  if (G.grenades <= 0 || G.state !== 'playing') return; G.grenades--; G.throwT = 0.45; try { sfx.melee ? sfx.melee() : sfx.ui(); } catch (e) {}
  camera.updateMatrixWorld();
  const dir = new THREE.Vector3(0, 0.02, -1).normalize().applyQuaternion(camera.quaternion);
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.006, 0.24), new THREE.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.9, roughness: 0.25 }));
  m.position.copy(camera.position).addScaledVector(dir, 0.6); m.lookAt(m.position.clone().sub(dir)); scene.add(m);
  grenadesInFlight.push({ m, proj: 'knife', vx: dir.x * 32, vy: dir.y * 32 + 0.5, vz: dir.z * 32, grav: 6, life: 3, dmg: 999, trailT: 0, armed: 0, spinK: 1 });
}
/* ---------- streaks */
(() => {
  EQUIP.knife = { name: 'THROWING KNIFE', desc: 'Thrown fast and nearly straight. Kills on any hit and sticks in what it hits.', count: 2, max: 3, fuse: 0, color: 0xc8ccd0 };
  STREAKS.watcher = { name: 'WATCHER DRONE', cost: 800, cd: 60, desc: 'A drone over you for 30 s: every enemy within 30 m shows on screen and the minimap, through walls.' };
  STREAKS.hotstrike = { name: 'HOTBOX STRIKE', cost: 1250, cd: 75, desc: 'Three smoke canisters land on the enemy: thick smoke, and anyone in it is slowed and aims worse for 8 s.' };
  if (typeof STK_ICON !== 'undefined') { STK_ICON.watcher = '<circle cx="12" cy="12" r="3"/><path d="M3 9 L9 11 M21 9 L15 11 M3 15 L9 13 M21 15 L15 13"/>'; STK_ICON.hotstrike = '<circle cx="8" cy="14" r="4"/><circle cx="15" cy="12" r="5"/><path d="M12 3 V7"/>'; }
  STK2.watcher = () => { STK.watchT = 30; showBanner('WATCHER DRONE', 'enemies near you are marked for 30 s'); try { stkRadio(); } catch (e) {} };
  STK2.hotstrike = () => {
    const foes = enemies.filter(e => !isFriend(e) && (!e.entry || e.entry.alive !== false)), t = stkTargets(foes, 3); showBanner('HOTBOX STRIKE', 'smoke inbound'); try { stkRadio(); } catch (e) {}
    t.forEach((p, i) => STK.jobs.push({ t: 1.2 + i * 0.5, whistle: true, fn: () => { try { smkCloud({ x: p.x + rnd(-2, 2), y: 0.5, z: p.z + rnd(-2, 2) }, 'hotbox', true); } catch (e) {} for (const e of enemies) if (!isFriend(e) && Math.hypot(e.group.position.x - p.x, e.group.position.z - p.z) < 6) { e.slowT = 8; e.hazeT = 8; if (e.acc) e.acc *= 0.6; setTimeout(() => { if (e.acc) e.acc /= 0.6; }, 8000); } } }));
  };
})();
// WATCHER DRONE: marks like a UAV, but only near me
const w2Watched = e => (STK.watchT || 0) > 0 && !isFriend(e) && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 30;
function w2StreakTick(dt) { if (STK.watchT > 0) STK.watchT -= dt; }
/* ---------- blueprints */
const BLUEPRINTS = [
  { id: 'bp_nightowl', n: 'NIGHT OWL', gun: 'marc', a: { optic: 'acog4', muzzle: 'suppressor', magazine: 'extmag', underbarrel: 'vgrip' }, lvl: 4 },
  { id: 'bp_mule', n: 'THE MULE', gun: 'titan', a: { optic: 'reddot', magazine: 'lmgbig', underbarrel: 'bipod', stock: 'heavystock' }, lvl: 8 },
  { id: 'bp_alley', n: 'ALLEY CAT', gun: 'viper', a: { optic: 'reflex', muzzle: 'flashhider', barrel: 'short', stock: 'lightstock' }, lvl: 12 },
  { id: 'bp_ghost', n: 'GHOST PEPPER', gun: 'whisper', a: { optic: 'holo', muzzle: 'suppressor', ammo: 'subsonic', underbarrel: 'laser' }, lvl: 16 },
  { id: 'bp_farmer', n: 'THE FARMER', gun: 'breacher', a: { muzzle: 'choke', barrel: 'long', ammo: 'slug', underbarrel: 'taclight' }, lvl: 20 },
  { id: 'bp_eagle', n: 'HIGH EAGLE', gun: 'hawkeye', a: { optic: 'scope10', barrel: 'heavy', stock: 'tacstock', ammo: 'match' }, lvl: 24 },
  { id: 'bp_rasta', n: 'RASTA RIFLE', gun: 'kv47', a: { optic: 'holo', muzzle: 'comp', magazine: 'drum', underbarrel: 'agrip' }, lvl: 28 },
  { id: 'bp_dealer', n: 'THE DEALER', gun: 'sentinel', a: { optic: 'scope25', muzzle: 'brake', magazine: 'extmag', ammo: 'ap' }, lvl: 32 },
  { id: 'bp_quiet', n: 'QUIET STORM', gun: 'crossbow', a: { optic: 'scope25' }, lvl: 36 },
  { id: 'bp_cloud', n: 'CLOUD NINE', gun: 'gale', a: { optic: 'reddot', muzzle: 'suppressor', barrel: 'long', stock: 'tacstock' }, lvl: 40 },
];
const bpLvl = () => { try { return lvlInfo(PROG.xp).l | 0; } catch (e) { return 1; } };
function bpApply(bp) {
  const d = ARM[bp.gun]; if (!d) return false; const c = activeClass(); c.p = bp.gun; const out = {};
  for (const s in bp.a) { const a = ATT_BY_ID[bp.a[s]]; if (a && a.slot === s && attOK(a, d)) out[s] = a.id; }
  ATTS[bp.gun] = out; saveClasses(); return true;
}
function bpOpen() {
  const L = bpLvl();
  const o = document.createElement('div'); o.className = 'onb-ov'; o.innerHTML = `<div class="onb-box" style="max-width:860px"><small>CREATE A CLASS · ${activeClass().name}</small><b>BLUEPRINTS</b><p>Ready-made builds. One unlocks every 4 levels (you're level ${L}).</p><div class="onb-tiles">${BLUEPRINTS.map((b, i) => { const ok = L >= b.lvl && ARM[b.gun]; return `<button class="onb-t${ok ? '' : ' off'}" data-bp="${i}"${ok ? '' : ' disabled'}><b>${b.n}</b><span>${ARM[b.gun] ? ARM[b.gun].name : b.gun} · ${Object.values(b.a).map(id => ATT_BY_ID[id] ? ATT_BY_ID[id].name : id).join(' · ')}${ok ? '' : ` · LEVEL ${b.lvl}`}</span></button>`; }).join('')}</div><div class="onb-acts"><button class="btn" data-bp="x">CLOSE</button></div></div>`;
  document.body.appendChild(o);
  const close = () => { o.remove(); removeEventListener('keydown', k, true); }, k = e => { if (e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  addEventListener('keydown', k, true);
  for (const b of o.querySelectorAll('[data-bp]')) b.onclick = () => { if (b.dataset.bp === 'x') return close(); const bp = BLUEPRINTS[+b.dataset.bp]; if (bpApply(bp)) { close(); try { sfx.streak(); showBanner('BLUEPRINT', bp.n); renderLoadout(); } catch (e) {} } };
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-bpb]'); if (b) { try { sfx.ui(); } catch (er) {} bpOpen(); } });
(() => { const s = document.createElement('style'); s.textContent = '.onb-t.off{opacity:.4;cursor:default}'; document.head.appendChild(s); })();
