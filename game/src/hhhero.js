/* ================================================================== HOTBOX HORDE: HEROES, GEAR AND CREW (1.2.107, the owner's list 45-55)
   HERO LEVELS 1-20 (XP from missions, +1% damage a level) and a SKILL TREE per hero (ARMOUR +15 health, FIREPOWER +6%
   damage, SCAVENGER +12% harvest; 3 tiers each, one point a level). HERO ABILITIES on FIELD UPGRADE (T): BUILDER instant
   metal wall, GUNNER 8 s burst (+60% damage), SCRAPPER ground pound, MEDIC heal bomb. New schematics: CROSSBOW, THE TRIMMER
   DMR, SEED SPITTER (grenade launcher) and the wonder weapon THE BONG. Crafted guns roll a PERK (CRIT, AMMO SAVER, VAMPIRE,
   SLOWING) and can be REPAIRED (+3 missions). MELEE weapons to craft: BAT, MACHETE, SCYTHE (more melee damage and harvest).
   SURVIVORS: every grower you rescue moves into your base (+5% buds each, up to 6). CREW ORDERS on STREAK (X): GUARD,
   FOLLOW, HARVEST, REPAIR (at the base, guarding crew also water dry plants and fix walls). Your crew keeps its names and
   levels up with every mission (better aim, more health). */
HH_GUNS.push(
  { id: 'xbow', n: 'CROSSBOW', cat: 'mr', gid: 'crossbow', cost: { wood: 30, metal: 20, scrap: 8, wire: 3 } },
  { id: 'dmr', n: 'THE TRIMMER DMR', cat: 'mr', gid: 'arbiter', cost: { metal: 35, scrap: 12, wire: 2, battery: 1 } },
  { id: 'gl', n: 'SEED SPITTER', cat: 'la', gid: 'thumper', cost: { metal: 40, scrap: 16, battery: 3 } },
  { id: 'bong', n: 'THE BONG · WONDER WEAPON', cat: 'la', gid: 'bongcannon', cost: { metal: 60, scrap: 30, battery: 6, wire: 6, sap: 10 } },
);
const HH_PERKS = { crit: { n: 'CRIT', d: '+25% damage' }, saver: { n: 'AMMO SAVER', d: 'kills give ammo back' }, vamp: { n: 'VAMPIRE', d: 'hits heal you a little' }, slow: { n: 'SLOWING', d: 'hits slow burnouts (combo damage)' } };
const HH_MELEE = { bat: { n: 'BASEBALL BAT', k: 1.6, h: 1.25, cost: { wood: 25 } }, machete: { n: 'MACHETE', k: 2, h: 1.5, cost: { metal: 15, wood: 10 } }, scythe: { n: 'SCYTHE', k: 2.6, h: 2, cost: { metal: 30, scrap: 6 } } };
const HH_SKILLS = { armor: { n: 'ARMOUR', d: '+15 health a tier' }, fire: { n: 'FIREPOWER', d: '+6% damage a tier' }, craft: { n: 'SCAVENGER', d: '+12% harvest a tier' } };
const HH_ABIL = { builder: { n: 'INSTANT WALL', cd: 25 }, gunner: { n: 'BURST', cd: 40 }, scrapper: { n: 'GROUND POUND', cd: 25 }, medic: { n: 'HEAL BOMB', cd: 35 } };
const HH_ORDERS = ['guard', 'follow', 'harvest', 'repair'], HH_ORDN = { guard: 'GUARD THE PLANT', follow: 'FOLLOW ME', harvest: 'HARVEST', repair: 'REPAIR' };
const HH_CREWN = ['ROACH', 'DUTCH', 'SAGE', 'KUSHY', 'BLAZE', 'MOSS', 'PEPPER', 'JUNIPER', 'RIZZO', 'TANK', 'LOTUS', 'GHOSTY'];
const hhHLv = xp => Math.min(20, 1 + Math.floor(Math.sqrt((xp | 0) / 150)));
const hhCLv = xp => Math.min(10, 1 + Math.floor((xp | 0) / 3));
function hhHero2(s) { s.hx = s.hx || {}; s.sk = s.sk || {}; const h = s.hero; s.sk[h] = Object.assign({ armor: 0, fire: 0, craft: 0 }, s.sk[h]); const lv = hhHLv(s.hx[h]), sk = s.sk[h], spent = sk.armor + sk.fire + sk.craft; return { h, lv, sk, pts: Math.max(0, lv - 1 - spent), xp: s.hx[h] | 0 }; }
HH.order = 'guard';
/* ---------- mission start: health, crew names and levels, survivors at the base */
const _hhSetup7 = hhSetup;
hhSetup = function () {
  const s0 = hhLoad(); if (!s0.crewN) { s0.crewN = HH_CREWN.slice().sort(() => Math.random() - 0.5).slice(0, 3); hhSave(s0); }
  let i = 0; for (const en of M.entries) if (!en.isPlayer) en.name = s0.crewN[i++ % 3];
  const r = _hhSetup7.apply(this, arguments), H = M.hh; if (!H) return r; HH.abT = 0; HH.burstT = 0; HH.order = 'guard';
  const hs = hhHero2(H.s); H.heroLv = hs.lv; H.sk = hs.sk;
  if (H.base) hhSurvivors(H);
  return r;
};
const _hhTick7 = hhTick;
hhTick = function (dt) {
  const H = M.hh, first = H && !H.placed, r = _hhTick7.apply(this, arguments); if (!H || M.over) return r;
  if (first) { const add = 15 * (H.sk.armor | 0); if (add) { G.maxHp = Math.max(G.maxHp || 100, 100) + add; G.health = G.maxHp; }
    for (const e of enemies) if (e.entry && !e.entry.isPlayer) { const lv = hhCLv((H.s.crew || {})[e.entry.name]); e.acc = (e.acc || 0.5) * (1 + 0.04 * (lv - 1)); e.maxHp = (e.maxHp || 100) * (1 + 0.08 * (lv - 1)); e.hp = e.maxHp; } }
  HH.abT = Math.max(0, (HH.abT || 0) - dt); HH.burstT = Math.max(0, (HH.burstT || 0) - dt);
  hhCrewWork(dt);
  return r;
};
/* ---------- damage: levels, skills, burst, perks, melee */
const _hhDmg7 = damageEnemy;
damageEnemy = function (e, dmg, head, dir, boom, by) {
  const H = M && M.hh; let perk = null;
  if (e && e.hhMob && H && by === 'player') {
    dmg *= 1 + 0.01 * ((H.heroLv | 0) - 1) + 0.06 * (H.sk ? H.sk.fire | 0 : 0); if (HH.burstT > 0) dmg *= 1.6;
    if (G.meleeT > 0 && H.s.melee && HH_MELEE[H.s.melee]) dmg *= HH_MELEE[H.s.melee].k;
    else if (H.gun && H.gun.perk && WEAPONS[G.cur] && WEAPONS[G.cur].def && WEAPONS[G.cur].def.id === H.gunId) { perk = H.gun.perk; if (perk === 'crit') dmg *= 1.25; if (perk === 'slow') e.slowT = Math.max(e.slowT || 0, 0.6); if (perk === 'vamp') G.health = Math.min(G.maxHp || 100, G.health + 1.5); }
  }
  const res = _hhDmg7.apply(this, [e, dmg, head, dir, boom, by]);
  if (perk === 'saver' && res && e.hhMob) { const w = WEAPONS[G.cur]; if (w) w.reserve = Math.min(w.reserveMax || w.def.reserve, (w.reserve | 0) + Math.ceil((w.magSize | 0) / 3)); }
  return res;
};
const _hhHv7 = hhHarvest;
hhHarvest = function () { const H = M.hh, before = Object.assign({}, H.s.inv), r = _hhHv7.apply(this, arguments), k = (1 + 0.12 * (H.sk ? H.sk.craft | 0 : 0)) * (H.s.melee && HH_MELEE[H.s.melee] ? HH_MELEE[H.s.melee].h : 1) - 1; if (k > 0) for (const m of HH_MATS) { const d = (H.s.inv[m] | 0) - (before[m] | 0); if (d > 0) hhGive(m, Math.round(d * k)); } return r; };
/* ---------- hero abilities (FIELD UPGRADE key) */
function hhAbility() {
  const H = M.hh; if (!H || !playerAlive() || HH.build || HH.menu) return; const A = HH_ABIL[H.hero]; if (HH.abT > 0) { showMsg(`${A.n} · READY IN ${Math.ceil(HH.abT)} s`); return; }
  if (H.hero === 'builder') { const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), dir = Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 1 : 3) : (fz > 0 ? 2 : 0), ix = Math.round((P.x - H.org.x) / HH_C), iz = Math.round((P.z - H.org.z) / HH_C), fl = Math.max(0, Math.round(((P.y || 0) - H.by) / HH_LV)), a = hhSpec('wall', ix, iz, fl, dir);
    if (!hhValid(a)) { showMsg("NO ROOM FOR A WALL THERE"); return; } const rec = { id: 'wall', ix, iz, lv: fl, dir, mat: 'metal' }; hhPieceMake(rec); if (H.base) { H.s.base.pieces.push(rec); hhSave(H.s); } }
  else if (H.hero === 'gunner') { HH.burstT = 8; }
  else if (H.hero === 'scrapper') { for (const e of H.mobs.slice()) { const g = e.group.position, d = Math.hypot(g.x - P.x, g.z - P.z); if (d < 5) { const L = d || 1; if (!e.K.boss) for (let k = 0; k < 5; k++) { g.x += (g.x - P.x) / L * 0.6; g.z += (g.z - P.z) / L * 0.6; resolve(g, 0.42, g.y, true); } e.slowT = 1.5; try { damageEnemy(e, 150, false, null, true, 'player'); } catch (er) {} } } try { chunks('dust', new THREE.Vector3(P.x, P.y + 0.2, P.z), 24, 6, 0.6); G.shake = Math.max(G.shake, 0.04); } catch (er) {} }
  else { G.health = Math.min(G.maxHp || 100, G.health + 60); for (const e of enemies) if (e.entry && e.team === M.myTeam && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 7) e.hp = Math.min(e.maxHp, e.hp + 80); if (H.plant && Math.hypot(H.plant.x - P.x, H.plant.z - P.z) < 7) H.plant.hp = Math.min(H.plant.max, H.plant.hp + H.plant.max * 0.1); try { for (let i = 0; i < 10; i++) chunks('dust', new THREE.Vector3(P.x + rnd(-3, 3), P.y + 1, P.z + rnd(-3, 3)), 2, 1, 0.8); } catch (er) {} }
  HH.abT = A.cd; try { showBanner(A.n, `${HH_HEROES.find(h => h.id === H.hero).n} ability · ready again in ${A.cd} s`); sfx.streak(); } catch (e) {}
}
/* ---------- crew orders (STREAK key) and crew work */
function hhOrderNext() { const i = HH_ORDERS.indexOf(HH.order); HH.order = HH_ORDERS[(i + 1) % HH_ORDERS.length]; try { showBanner(`CREW: ${HH_ORDN[HH.order]}`, HH.order === 'harvest' ? 'they gather wood, stone and metal for you' : HH.order === 'repair' ? 'they fix damaged walls' + (M.hh.base ? ' and water dry plants' : '') : HH.order === 'follow' ? 'they stay with you' : 'they stay round the plant'); sfx.ui(); } catch (e) {} }
addEventListener('keydown', e => {
  if (!M || !M.hh || G.state !== 'playing' || curScreen || HH.menu || HH.build || e.repeat) return;
  if (e.code === bind('field')) { e.stopImmediatePropagation(); hhAbility(); }
  else if (e.code === bind('streak')) { e.stopImmediatePropagation(); hhOrderNext(); }
}, true);
function hhCrewTask(e) {
  const H = M.hh, g = e.group.position, o = HH.order;
  if (o === 'harvest') { let best = null, bd = 1e9; for (const n of H.nodes) if (n.hp > 0) { const d = Math.hypot(n.x - g.x, n.z - g.z); if (d < bd) { bd = d; best = n; } } return best ? { k: 'node', t: best, x: best.x, z: best.z, y: best.y } : null; }
  if (o === 'repair' || (H.base && o === 'guard' && !H.raid)) { let best = null, bd = 1e9; for (const p of H.pieces) if (p.mat && p.hp < p.max - 1) { const d = Math.hypot(p.cx - g.x, p.cz - g.z); if (d < bd) { bd = d; best = p; } } if (best) return { k: 'fix', t: best, x: best.cx, z: best.cz, y: best.y };
    if (H.base && H.props) for (const pr of H.props) if (pr.k === 'plot') { const st = H.s.base.plots[pr.key]; if (st && st.st && Date.now() > (st.wt || 0) && hhGrowK(st) < 1) return { k: 'water', t: pr, x: pr.x, z: pr.z, y: pr.y }; } }
  return null;
}
const _hhGoal7 = hhGoal;
hhGoal = function (e, keep, near, set) {
  const H = M.hh; if (H.phase === 'wave' && e.tg) return _hhGoal7.apply(this, arguments);
  if (HH.order === 'follow' && playerAlive()) { if (keep && e.goal && Math.hypot(e.goal.x - P.x, e.goal.z - P.z) < 5) return e.goal; const a = Math.random() * TAU; return set(near({ x: P.x + Math.cos(a) * 3, z: P.z + Math.sin(a) * 3, y: P.y || 0 }, 2), rnd(1, 2)); }
  const T = hhCrewTask(e); if (T) { e.hhTask = T; if (keep && e.goal && Math.hypot(e.goal.x - T.x, e.goal.z - T.z) < 2) return e.goal; return set(near({ x: T.x + 1.2, z: T.z + 1.2, y: T.y }, 1.5), 3); }
  e.hhTask = null; return _hhGoal7.apply(this, arguments);
};
function hhCrewWork(dt) {
  const H = M.hh; for (const e of enemies) { if (!e.entry || e.entry.isPlayer || !e.hhTask) continue; const T = e.hhTask, g = e.group.position; if (Math.hypot(T.x - g.x, T.z - g.z) > 2.8) continue;
    if (T.k === 'node') { if ((e.hvT = (e.hvT || 0) - dt) <= 0 && T.t.hp > 0) { e.hvT = 3; T.t.hp--; hhGive(T.t.k, 5); T.t.g.scale.setScalar(0.55 + 0.45 * T.t.hp / T.t.max); if (T.t.hp <= 0) { if (T.t.g.parent) T.t.g.parent.remove(T.t.g); T.t.regrow = H.base ? NOW + 120 : 0; e.hhTask = null; } try { chunks('wood', new THREE.Vector3(T.x, T.y + 0.5, T.z), 3, 2, 0.4); } catch (er) {} } }
    else if (T.k === 'fix') { T.t.hp = Math.min(T.t.max, T.t.hp + 30 * dt); if (T.t.hp >= T.t.max - 1) { for (const m of T.t.meshes) if (m.userData.c0 !== undefined) m.material.color.setHex(m.userData.c0); e.hhTask = null; } }
    else if (T.k === 'water') { const st = H.s.base.plots[T.t.key]; if (st) { hhGrowStep(st); st.wt = Date.now() + 10 * 60000; hhSave(H.s); } e.hhTask = null; try { showMsg(`${e.entry.name} WATERED A PLANT`); } catch (er) {} } }
}
/* ---------- survivors at the base */
function hhSurvivors(H) {
  const n = Math.min(6, H.s.surv | 0); H.survivors = [];
  for (let i = 0; i < n; i++) { const a = i / Math.max(1, n) * TAU + 0.5, o = openNear(H.org.x + Math.cos(a) * 6.5, H.org.z + Math.sin(a) * 6.5), y = groundAt(o.x, o.z, H.by + 0.6), G0 = hhGrowerMake(o.x, o.z, y); G0.g.rotation.y = Math.atan2(H.org.x - o.x, H.org.z - o.z); H.survivors.push(G0); }
}
const _hhPU7 = hhPlotUse;
hhPlotUse = function (p) { const s = M.hh.s, b0 = Object.assign({}, s.buds), r = _hhPU7.apply(this, arguments), k = 0.05 * Math.min(6, s.surv | 0); if (k > 0) for (const id in s.buds) { const d = (s.buds[id] | 0) - (b0[id] | 0); if (d > 0) s.buds[id] += Math.round(d * k); } return r; };
/* ---------- the end of a mission: hero XP, crew XP, survivors */
const _hhEnd7 = hhEnd;
hhEnd = function (won) {
  const H = M.hh; if (!H || H.over) return _hhEnd7.apply(this, arguments); const s = H.s;
  s.hx = s.hx || {}; const lv0 = hhHLv(s.hx[H.hero]); s.hx[H.hero] = (s.hx[H.hero] | 0) + Math.round((won ? 200 : 60) * H.D.pay + H.kills * 2); const lv1 = hhHLv(s.hx[H.hero]);
  s.crew = s.crew || {}; for (const en of M.entries) if (!en.isPlayer) s.crew[en.name] = (s.crew[en.name] | 0) + 1;
  if (won && H.kind === 'rescue') s.surv = Math.min(6, (s.surv | 0) + 3);
  const r = _hhEnd7.apply(this, arguments); if (lv1 > lv0) try { setTimeout(() => showBanner(`${HH_HEROES.find(h => h.id === H.hero).n} · LEVEL ${lv1}`, 'a new skill point in the lobby'), 600); } catch (e) {}
  return r;
};
/* ---------- the WORKBENCH: perks, repair, melee */
const _hhMD7 = hhMenuDo;
hhMenuDo = function (a, v) {
  const H = M.hh, s = H.s;
  if (a === 'gun') { const n0 = s.arsenal.length, r = _hhMD7.apply(this, arguments); if (s.arsenal.length > n0) { const g = s.arsenal[s.arsenal.length - 1], ks = Object.keys(HH_PERKS); g.perk = ks[(Math.random() * ks.length) | 0]; hhSave(s); hhMenuRender(); } return r; }
  if (a === 'repair') { const g = s.arsenal[+v]; if (g && hhPay(s, { scrap: 4, metal: 10 })) { g.dur += 3; try { showMsg('REPAIRED · +3 MISSIONS'); sfx.pickup(); } catch (e) {} } hhSave(s); hhMenuRender(); return; }
  if (a === 'melee') { const m = HH_MELEE[v]; if (m && s.melee !== v && hhPay(s, m.cost)) { s.melee = v; try { showMsg(`CRAFTED A ${m.n}`); sfx.pickup(); } catch (e) {} } hhSave(s); hhMenuRender(); return; }
  return _hhMD7.apply(this, arguments);
};
const _hhMR7 = hhMenuRender;
hhMenuRender = function () {
  _hhMR7.apply(this, arguments); if (HH.menu !== 'bench') return; const o = $('hhMenu'), H = M && M.hh; if (!o || !H) return; const s = H.s, box = o.querySelector('.hh-mbox');
  const ars = [...box.querySelectorAll('.hh-sec')].find(e => (e.querySelector('h4') || {}).textContent === 'YOUR ARSENAL');
  if (ars) [...ars.querySelectorAll('.hh-li')].forEach((li, i) => { const g = s.arsenal[i]; if (!g) return; const sp = li.querySelector('span'); if (sp && g.perk) sp.textContent += ` · PERK: ${HH_PERKS[g.perk].n} (${HH_PERKS[g.perk].d})`; li.insertAdjacentHTML('beforeend', `<button class="mini" data-hm="repair:${i}">REPAIR +3</button>`); });
  const acts = box.querySelector('.onb-acts'), sec = document.createElement('div'); sec.className = 'hh-sec';
  sec.innerHTML = `<h4>MELEE · YOURS: ${s.melee ? HH_MELEE[s.melee].n : 'KNIFE'}</h4>${Object.entries(HH_MELEE).map(([k, m]) => `<div class="hh-li"><b>${m.n}</b><span>melee x${m.k} on burnouts · harvest x${m.h} · ${hhCostTxt(m.cost, s)}</span><button class="mini${s.melee === k ? ' off' : ''}" data-hm="melee:${k}"${s.melee === k ? ' disabled' : ''}>${s.melee === k ? 'YOURS' : 'CRAFT'}</button></div>`).join('')}`;
  if (acts) box.insertBefore(sec, acts);
};
/* ---------- the lobby: hero level + skill tree, crew, survivors */
const _hhRender7 = hhRender;
hhRender = function () {
  const r = _hhRender7.apply(this, arguments), s = hhLoad(), sel = $('lobSel'); if (!sel) return r; const hs = hhHero2(s), next = 150 * Math.pow(hs.lv, 2);
  sel.insertAdjacentHTML('beforeend', `<div class="cod-row wide"><small>${HH_HEROES.find(h => h.id === s.hero).n} · LEVEL ${hs.lv} / 20 · ${hs.xp.toLocaleString()}${hs.lv < 20 ? ' / ' + next.toLocaleString() : ''} XP · ${hs.pts} SKILL POINT${hs.pts === 1 ? '' : 'S'} · ABILITY ${HH_ABIL[s.hero].n} (${actName('field')})</small><div class="hh-ups">${Object.entries(HH_SKILLS).map(([k, S0]) => `<div class="hh-up"><small>${S0.n}</small><b>TIER ${hs.sk[k]} / 3</b><span>${S0.d}</span><button class="mini hh-buy" data-act="hh-sk-${k}"${hs.pts < 1 || hs.sk[k] >= 3 ? ' disabled' : ''}>${hs.sk[k] >= 3 ? 'MAX' : 'LEARN'}</button></div>`).join('')}</div></div>` +
    `<div class="cod-row wide"><small>YOUR CREW · ORDERS ON ${actName('streak')}</small><span>${(s.crewN || ['?', '?', '?']).map(n => `<b class="hh-crew">${n[0]}</b>${n} · LEVEL ${hhCLv((s.crew || {})[n])}`).join(' &nbsp; ')}${s.surv ? ` · SURVIVORS AT THE BASE: ${Math.min(6, s.surv)} (+${Math.min(6, s.surv) * 5}% buds)` : ''}</span></div>`);
  return r;
};
const _hhAct7 = hhAct;
hhAct = function (act) {
  if (HHL.on && curScreen === 'lobby' && act.startsWith('hh-sk-')) { const s = hhLoad(), hs = hhHero2(s), k = act.slice(6); if (hs.pts > 0 && hs.sk[k] < 3) { hs.sk[k]++; hhSave(s); try { sfx.pickup(); } catch (e) {} } hhRender(`[data-act="${act}"]`); return true; }
  return _hhAct7.apply(this, arguments);
};
// the ability and the crew order on the HUD
const _hhDT7 = hhDomTick;
hhDomTick = function () { _hhDT7.apply(this, arguments); const m = $('hhMats'), H = M.hh; if (!m || !H) return; let t = m.querySelector('.hh-abil'); if (!t) { t = document.createElement('div'); t.className = 'hh-cost hh-abil'; m.appendChild(t); } const A = HH_ABIL[H.hero], s = `${actName('field')} ${A.n} ${HH.abT > 0 ? Math.ceil(HH.abT) + ' s' : 'READY'}${HH.burstT > 0 ? ' · BURST!' : ''} · ${actName('streak')} CREW: ${HH_ORDN[HH.order]}`; if (t.textContent !== s) t.textContent = s; };
(() => { const st = document.createElement('style'); st.textContent = `.hh-crew{display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;border-radius:50%;background:#7a4ab8;color:#fff;margin-right:4px;font-size:10px}`; document.head.appendChild(st); })();
