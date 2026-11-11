/* ================================================================== HOTBOX HORDE: THE HOMESTEAD (1.2.99)
   The base on its open field: THE MOTHER PLANT in the middle, THE BUYER's van (sell buds, buy seeds and nutrients), the
   WORKBENCH (craft traps and guns, upgrade the bench for better guns) and THE PLANS board (expand the base by winning a
   RAID, buy upgrades). Everything you build here is saved and comes back next time. GROW PLOTS hold one plant each:
   PLANT a seed (R picks the strain), FEED it nutrients (+50% speed and buds), HARVEST it when it is ready. Plants grow
   in real time from the moment they are planted, game open or not. Pieces, plots and stock live in ashfall.hh.v1. */
const HH_STATIONS = [
  { id: 'buyer', n: 'THE BUYER', d: 'sell buds · buy seeds and nutrients', ix: 3, iz: 0, cells: [[3, -1], [3, 0], [3, 1]], col: '#7aff8a' },
  { id: 'bench', n: 'WORKBENCH', d: 'craft traps and guns', ix: -3, iz: 0, cells: [[-3, 0]], col: '#ffb84a' },
  { id: 'plans', n: 'THE PLANS', d: 'expand your base · upgrades', ix: 0, iz: -3, cells: [[0, -3]], col: '#8ad0ff' },
];
function hhGrowK(st) { if (!st || !st.st) return 0; const S0 = HH_STR(st.st); return clamp((Date.now() - st.t0) * (HH.growK || 1) / (S0.min * 60000) * (st.fed ? 1.5 : 1), 0, 1); }
function hhBaseSetup(H) {
  const s = H.s;
  // the stations
  for (const S0 of HH_STATIONS) {
    const c = hhCellPos(S0.ix, S0.iz), y = groundAt(c.x, c.z, H.by + 0.6), g = new THREE.Group(); g.position.set(c.x, y, c.z); H.grp.add(g);
    for (const [ix, iz] of S0.cells) H.res.add(`${ix},${iz}`);
    if (S0.id === 'buyer') { const v = hhVanMesh(0x6a3aa8); g.add(v); const aw = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 3.2), hhStd({ color: 0x7aff8a, roughness: 0.6 })); aw.position.set(-1.9, 2.5, 0.3); aw.rotation.z = 0.25; g.add(aw); const tb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 2.4), hhStd({ color: 0x3a2a1a, roughness: 0.8 })); tb.position.set(-1.7, 0.45, 0.3); g.add(tb); H.sboxes.push(mkBox(c.x, c.z, 2.2, 4.6, 2.4, { y })); }
    else if (S0.id === 'bench') { const wood = hhStd({ color: 0x7a5530, roughness: 0.8 }), steel = hhStd({ color: 0x5a6068, metalness: 0.7, roughness: 0.4 }); const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 1.0), wood); top.position.y = 0.95; g.add(top); for (const [x, z] of [[-1.1, -0.42], [1.1, -0.42], [-1.1, 0.42], [1.1, 0.42]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 0.08), wood); l.position.set(x, 0.47, z); g.add(l); } const vise = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.2), steel); vise.position.set(0.8, 1.12, 0.2); g.add(vise); const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.35), hhStd({ color: 0xc83a2a, roughness: 0.5 })); box.position.set(-0.6, 1.15, -0.1); g.add(box); const pb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.05), hhStd({ color: 0x9a8a6a, roughness: 0.9 })); pb.position.set(0, 1.65, -0.5); g.add(pb); for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.04), steel); t.position.set(-0.9 + i * 0.45, 1.7, -0.45); g.add(t); } H.sboxes.push(mkBox(c.x, c.z, 2.4, 1.1, 1.0, { y })); }
    else { const wood = hhStd({ color: 0x5a4028, roughness: 0.9 }); for (const x of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 0.12), wood); p.position.set(x, 1.1, 0); g.add(p); } const b = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.3, 0.08), hhStd({ color: 0x2a4a6a, roughness: 0.8 })); b.position.set(0, 1.55, 0); g.add(b); for (let i = 0; i < 4; i++) { const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.6), hhStd({ color: 0xe8eef0, roughness: 0.9, side: THREE.DoubleSide })); sh.position.set(-0.75 + i * 0.5, 1.55 + (i % 2) * 0.1, 0.05); sh.rotation.z = (i - 1.5) * 0.06; g.add(sh); } H.sboxes.push(mkBox(c.x, c.z, 2.4, 0.4, 2.2, { y })); }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    H.stations = H.stations || []; H.stations.push(Object.assign({}, S0, { x: c.x, z: c.z, y }));
  }
  for (const b of H.sboxes) boxes.push(b);
  // the ammo crate on its own cell next to the plant
  if (H.crate) { const c = hhCellPos(1, 1); H.crate.x = c.x; H.crate.z = c.z; H.crate.g.position.set(c.x, H.by, c.z); H.res.add('1,1'); }
  // everything you built, and what's growing
  for (const rec of s.base.pieces.slice()) { try { const a = hhSpec(rec.id, rec.ix, rec.iz, rec.lv, rec.dir, rec.up); if (a.key.split('|').some(k => H.slots.has(k))) continue; hhPieceMake(rec, true); } catch (e) { reportError(e); } }
  for (const p of H.pieces) if (p.id === 'plot') hhPlotVis(p);
  H.visT = 0; H.sel = null;
}
// a plot's plant, sized by how far it has grown
function hhPlotVis(p) {
  const H = M.hh, st = H.s.base.plots[p.key], k = hhGrowK(st);
  if (!st || !st.st) { if (p.plot.g) { p.plot.g.parent && p.plot.g.parent.remove(p.plot.g); p.plot.g = null; } return; }
  if (!p.plot.g || p.plot.strain !== st.st) { if (p.plot.g && p.plot.g.parent) p.plot.g.parent.remove(p.plot.g); const g = hhWeed(16, 0.62, HH_STR(st.st).col); g.position.set(p.cx, p.y + p.h, p.cz); g.rotation.y = (p.ix * 7 + p.iz * 3) % 6; H.grp.add(g); p.plot.g = g; p.plot.strain = st.st; }
  const g = p.plot.g; g.scale.setScalar(0.18 + 0.82 * k); for (const b of g.userData.buds) b.visible = k > 0.5; g.userData.bud.emissiveIntensity = k >= 1 ? 0.9 + Math.sin(NOW * 3) * 0.4 : 0.2;
}
function hhBestSeed(s) { for (let i = HH_STRAINS.length - 1; i >= 0; i--) if ((s.seeds[HH_STRAINS[i].id] | 0) > 0) return HH_STRAINS[i].id; return null; }
function hhNearPlot() { const H = M.hh; let best = null, bd = 2.3; for (const p of H.pieces) if (p.id === 'plot') { const d = Math.hypot(p.cx - P.x, p.cz - P.z); if (d < bd) { bd = d; best = p; } } return best; }
function hhPlotUse(p) {
  const H = M.hh, s = H.s, st = s.base.plots[p.key], k = hhGrowK(st);
  if (!st || !st.st) { const sd = H.sel && (s.seeds[H.sel] | 0) > 0 ? H.sel : hhBestSeed(s); if (!sd) { showMsg('NO SEEDS · BUY THEM FROM THE BUYER'); return; } s.seeds[sd]--; s.base.plots[p.key] = { st: sd, t0: Date.now(), fed: false }; hhPlotVis(p); try { showBanner(`PLANTED ${HH_STR(sd).n}`, `ready in about ${HH_STR(sd).min} minutes · feed it NUTRIENTS to speed it up`); burst(0.2, 600, 0.12, 'lowpass'); } catch (e) {} }
  else if (k >= 1) { const S0 = HH_STR(st.st), n = Math.round(S0.yld * (st.fed ? 1.5 : 1) * (1 + 0.2 * (H.lv.yield | 0))); s.buds[st.st] = (s.buds[st.st] | 0) + n; s.grown = (s.grown | 0) + 1; delete s.base.plots[p.key]; hhPlotVis(p); try { showBanner(`+${n} ${S0.n} BUDS`, `worth about $${Math.round(n * S0.price * hhMarket()).toLocaleString()} at THE BUYER today`); sfx.pickup(); chunks('wood', new THREE.Vector3(p.cx, p.y + 1, p.cz), 10, 3, 0.6); } catch (e) {} }
  else if (!st.fed && (s.inv.nutri | 0) > 0) { s.inv.nutri--; const done = (Date.now() - st.t0) / (HH_STR(st.st).min * 60000); st.t0 = Date.now() - done * HH_STR(st.st).min * 60000 / 1.5; st.fed = true; try { showMsg('FED · +50% SPEED AND BUDS'); tone(660, 0.15, 0.05, 'sine', 990); } catch (e) {} }
  else { showMsg(st.fed ? 'STILL GROWING · ALREADY FED' : 'STILL GROWING · NO NUTRIENTS (MISSIONS OR THE BUYER)'); return; }
  hhSave(s);
}
function hhBaseTick(dt, u) {
  const H = M.hh, s = H.s;
  if ((H.visT -= dt) <= 0) { H.visT = 0.5; for (const p of H.pieces) if (p.id === 'plot') hhPlotVis(p); }
  for (const n of H.nodes) if (n.hp <= 0 && n.regrow && NOW > n.regrow) { n.hp = n.max; n.regrow = 0; n.g.scale.setScalar(1); H.grp.add(n.g); }   // the yard's piles come back
  if (!playerAlive() || HH.build || HH.menu) return;
  // the stations
  let st = null; for (const S0 of H.stations) if (Math.hypot(S0.x - P.x, S0.z - P.z) < (S0.id === 'buyer' ? 3.6 : 2.6)) st = S0;
  if (st) { showMsgOnce(`${st.n} · PRESS ${actName('use')} · ${st.d}`); if (u && !HH.uH) { if (H.raid && H.phase === 'wave') showMsg('NOT DURING A RAID'); else hhMenuOpen(st.id); } return; }
  // the plots
  const p = hhNearPlot(); HH.nearPlot = p;
  if (p) { const ps = s.base.plots[p.key], k = hhGrowK(ps);
    if (!ps || !ps.st) { const sd = H.sel && (s.seeds[H.sel] | 0) > 0 ? H.sel : hhBestSeed(s); showMsgOnce(sd ? `GROW PLOT · ${actName('use')} PLANT ${HH_STR(sd).n} (${s.seeds[sd]} SEEDS) · ${actName('reload')} OTHER STRAIN` : 'GROW PLOT · NO SEEDS · BUY THEM FROM THE BUYER'); }
    else if (k >= 1) showMsgOnce(`${HH_STR(ps.st).n} IS READY · ${actName('use')} HARVEST`);
    else { const left = (1 - k) * HH_STR(ps.st).min * 60 / (ps.fed ? 1.5 : 1) / (HH.growK || 1); showMsgOnce(`${HH_STR(ps.st).n} · ${Math.floor(k * 100)}% · READY IN ${fmtT(left)}${!ps.fed && (s.inv.nutri | 0) > 0 ? ` · ${actName('use')} FEED NUTRIENTS (${s.inv.nutri})` : ''}`); }
    if (u && !HH.uH) hhPlotUse(p); }
}
addEventListener('keydown', e => {
  if (!M || !M.hh || !M.hh.base || G.state !== 'playing' || curScreen || HH.menu || HH.build || !HH.nearPlot || e.code !== bind('reload')) return;
  const H = M.hh, ps = H.s.base.plots[HH.nearPlot.key]; if (ps && ps.st) return;
  const own = HH_STRAINS.filter(x => (H.s.seeds[x.id] | 0) > 0); if (!own.length) return; const i = own.findIndex(x => x.id === H.sel); H.sel = own[(i + 1) % own.length].id; e.stopImmediatePropagation(); try { tone(600, 0.03, 0.03, 'square'); } catch (er) {}
}, true);
function hhBaseMarkers(out) {
  const H = M.hh; for (const S0 of H.stations) if (Math.hypot(S0.x - P.x, S0.z - P.z) < 45) out.push({ x: S0.x, y: S0.y + 3.1, z: S0.z, t: S0.n, c: S0.col });
  for (const p of H.pieces) if (p.id === 'plot') { const ps = H.s.base.plots[p.key], k = hhGrowK(ps); if (ps && ps.st && k >= 1) out.push({ x: p.cx, y: p.y + 2.4, z: p.cz, t: 'READY', c: '#7aff6a' }); else if (ps && ps.st && Math.hypot(p.cx - P.x, p.cz - P.z) < 12) out.push({ x: p.cx, y: p.y + 2.2, z: p.cz, t: `${Math.floor(k * 100)}%`, c: '#c8e8c0' }); }
}

/* ---------- RAIDS: win one to expand the base */
function hhRaidStart() {
  const H = M.hh, s = H.s, lv = s.base.lv, nx = HH_BASELV[lv]; if (!nx || H.raid) return;
  if (s.cash < nx.cost) { showMsg(`YOU NEED $${nx.cost.toLocaleString()}`); return; }
  hhMenuClose(); H.raid = { to: lv + 1, cost: nx.cost }; H.phase = 'prep'; H.t = 40; H.wave = 0; H.waves = 2 + lv; H.D = HH_DIFF[Math.min(3, lv - 1)]; H.plant.hp = H.plant.max;
  for (const R of H.rifts) R.g.visible = true;
  try { showBanner('RAID INCOMING', `hold THE MOTHER PLANT for ${H.waves} waves to expand to level ${lv + 1} · first wave in 40 s · build!`); tone(60, 1.2, 0.16, 'sawtooth', 40); } catch (e) {}
}
function hhRaidEnd(won) {
  const H = M.hh, s = H.s, R = H.raid; if (!R) return;
  for (const e of H.mobs) { const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); scene.remove(e.group); } H.mobs = []; H.toSpawn = 0;
  for (const q of H.spits) scene.remove(q.s); H.spits = [];
  H.raid = null; H.phase = 'free'; H.wave = 0; H.plant.hp = H.plant.max; for (const r of H.rifts) r.g.visible = false;
  if (won) { s.cash -= R.cost; s.base.lv = R.to; try { showBanner(`THE HOMESTEAD IS LEVEL ${R.to}`, `more room to build · up to ${HH_BASELV[R.to - 1].plots} grow plots`); sfx.streak(); brpXP(1500 * R.to, 'HOTBOX HORDE · RAID WON'); } catch (e) {} }
  else try { showBanner('RAID LOST', 'the burnouts got to her · she pulls through · try again when you are ready'); } catch (e) {}
  hhSave(s);
}

/* ---------- the station menus */
function hhMenuOpen(kind) {
  if (HH.menu) return; HH.menu = kind; G.menuOpen = true; hhBuildMode(false);
  const o = document.createElement('div'); o.className = 'onb-ov hh-menu'; o.id = 'hhMenu'; document.body.appendChild(o);
  o.addEventListener('click', e => { const b = e.target.closest('[data-hm]'); if (!b) return; const [a, v] = b.dataset.hm.split(':'); hhMenuDo(a, v); });
  hhMenuRender(); try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  HH.mkey = e => { if (!HH.menu) return; if (e.code === 'Escape' || e.code === bind('use')) { e.preventDefault(); e.stopImmediatePropagation(); hhMenuClose(); } };
  addEventListener('keydown', HH.mkey, true); try { sfx.ui(); } catch (e) {}
}
function hhMenuClose() { if (!HH.menu) return; HH.menu = null; G.menuOpen = false; const o = $('hhMenu'); if (o) o.remove(); if (HH.mkey) removeEventListener('keydown', HH.mkey, true); HH.mkey = null; HH.uH = true; try { if (G.state === 'playing') lockPointer(); } catch (e) {} }
function hhMenuRender() {
  const o = $('hhMenu'), H = M && M.hh; if (!o || !H) return; const s = H.s, mk = hhMarket(), btn = (act, txt, off) => `<button class="mini${off ? ' off' : ''}" data-hm="${act}"${off ? ' disabled' : ''}>${txt}</button>`;
  const inv = `<div class="hh-minv"><span style="color:#7aff8a">$${s.cash.toLocaleString()}</span>${[...HH_MATS, ...HH_CMATS].map(k => `<span>${HH_ALLN(k)} <b>${s.inv[k] | 0}</b></span>`).join('')}</div>`;
  let body = '';
  if (HH.menu === 'buyer') {
    const buds = HH_STRAINS.filter(x => s.buds[x.id] > 0), total = buds.reduce((t, x) => t + Math.round(s.buds[x.id] * x.price * mk), 0);
    body = `<small>THE BUYER · TODAY HE PAYS ${Math.round(mk * 100)}%</small><b>SELL · BUY</b>${inv}<div class="hh-sec"><h4>SELL YOUR BUDS</h4>${buds.length ? buds.map(x => `<div class="hh-li"><b>${x.n}</b><span>${s.buds[x.id]} buds · $${Math.round(x.price * mk)} each</span>${btn('sell:' + x.id, `SELL · $${Math.round(s.buds[x.id] * x.price * mk).toLocaleString()}`)}</div>`).join('') + `<div class="hh-li"><b>EVERYTHING</b><span></span>${btn('sell:all', `SELL ALL · $${total.toLocaleString()}`)}</div>` : '<p>No buds yet. Plant seeds in GROW PLOTS (build them in build mode) and harvest them when they are ready.</p>'}</div>` +
      `<div class="hh-sec"><h4>SEEDS AND SUPPLIES</h4>${HH_STRAINS.filter(x => x.seed).map(x => `<div class="hh-li"><b>${x.n} SEED</b><span>grows in ${x.min} min · ${x.yld} buds · you have ${s.seeds[x.id] | 0}</span>${btn('seed:' + x.id, `$${x.seed}`, s.cash < x.seed)}</div>`).join('')}<div class="hh-li"><b>MOTHER'S MILK SEED</b><span>the best there is · only from missions (FRIED and up)</span><span></span></div><div class="hh-li"><b>NUTRIENTS</b><span>feed a plant: +50% speed and buds · you have ${s.inv.nutri | 0}</span>${btn('nutri:1', '$80', s.cash < 80)}</div></div>`;
  } else if (HH.menu === 'bench') {
    const bl = s.base.bench, nb = HH_BENCH[bl];
    body = `<small>WORKBENCH · LEVEL ${bl} · YOUR GUNS COME OUT ${HH_TIER[bl - 1].n}</small><b>CRAFT</b>${inv}` +
      `<div class="hh-sec"><h4>TRAPS</h4>${Object.entries(HH_TRAPS).map(([k, t]) => `<div class="hh-li"><b>${t.n} <i>×${s.traps[k] | 0}</i></b><span>${t.d} · ${hhCostTxt(t.cost, s)}</span>${btn('trap:' + k, 'CRAFT', !hhHas(s, t.cost))}${btn('trap5:' + k, '×5', !hhHas(s, Object.fromEntries(Object.entries(t.cost).map(([a, b]) => [a, b * 5]))))}</div>`).join('')}</div>` +
      `<div class="hh-sec"><h4>WEAPONS · LAST ${HH_GUN_DUR} MISSIONS</h4>${HH_GUNS.map(g => `<div class="hh-li"><b>${g.n}</b><span>${hhGunDef(g).name} · ${hhCostTxt(g.cost, s)}</span>${btn('gun:' + g.id, 'CRAFT', !hhHas(s, g.cost))}</div>`).join('')}</div>` +
      `<div class="hh-sec"><h4>YOUR ARSENAL</h4>${s.arsenal.length ? s.arsenal.map((g, i) => `<div class="hh-li"><b style="color:${HH_TIER[g.tier].css}">${HH_TIER[g.tier].n} ${HH_GUNS.find(x => x.id === g.id).n}</b><span>${g.dur} missions left${s.eq === i ? ' · EQUIPPED' : ''}</span>${btn('eq:' + i, s.eq === i ? 'UNEQUIP' : 'EQUIP')}${btn('scrapgun:' + i, 'SCRAP +3')}</div>`).join('') : '<p>Nothing yet. Craft a gun above, then equip it (here or in the lobby) and take it on a mission.</p>'}</div>` +
      (nb ? `<div class="hh-sec"><h4>UPGRADE THE BENCH</h4><div class="hh-li"><b>LEVEL ${bl + 1}</b><span>guns come out ${HH_TIER[bl].n} (+${Math.round((HH_TIER[bl].k - 1) * 100)}% damage)</span>${btn('bench:1', `$${nb.cost.toLocaleString()}`, s.cash < nb.cost)}</div></div>` : '');
  } else {
    const lv = s.base.lv, L = HH_BASELV[lv - 1], nx = HH_BASELV[lv], plots = H.pieces.filter(p => p.id === 'plot').length;
    body = `<small>THE PLANS · THE HOMESTEAD LEVEL ${lv}</small><b>EXPAND</b>${inv}<div class="hh-sec"><h4>YOUR BASE</h4><p>Build area ${L.r * 2 + 1} × ${L.r * 2 + 1} cells (${(L.r * 2 + 1) * 3} m) · grow plots ${plots} / ${L.plots} · ${H.pieces.length} pieces</p>` +
      (nx ? `<div class="hh-li"><b>EXPAND TO LEVEL ${lv + 1}</b><span>build area ${(nx.r * 2 + 1) * 3} m · ${nx.plots} grow plots · $${nx.cost.toLocaleString()} · you have to hold off a RAID: ${2 + lv} waves at your base</span>${btn('raid:1', 'START THE RAID', s.cash < nx.cost)}</div>` : '<p>Your base is as big as it gets.</p>') + `</div>` +
      `<div class="hh-sec"><h4>UPGRADES</h4>${HH_UPG.map(u => { const l = s.lv[u.id] | 0; return `<div class="hh-li"><b>${u.n} · ${l} / 5</b><span>${u.d}</span>${l >= 5 ? btn('x', 'MAX', true) : btn('up:' + u.id, `$${hhUpCost(l).toLocaleString()}`, s.cash < hhUpCost(l))}</div>`; }).join('')}</div>`;
  }
  o.innerHTML = `<div class="onb-box hh-mbox">${body}<div class="onb-acts"><button class="btn" data-hm="close">CLOSE (${actName('use')} / ESC)</button></div></div>`;
}
function hhMenuDo(a, v) {
  const H = M.hh, s = H.s, mk = hhMarket();
  if (a === 'close') { hhMenuClose(); return; }
  if (a === 'sell') { let got = 0; for (const x of HH_STRAINS) if ((v === 'all' || v === x.id) && s.buds[x.id] > 0) { got += Math.round(s.buds[x.id] * x.price * mk); s.buds[x.id] = 0; } s.cash += got; s.sold = (s.sold | 0) + got; try { showMsg(`SOLD · +$${got.toLocaleString()}`); sfx.pickup(); tone(880, 0.1, 0.05, 'triangle', 1320); } catch (e) {} }
  if (a === 'seed') { const x = HH_STR(v); if (s.cash >= x.seed) { s.cash -= x.seed; s.seeds[v] = (s.seeds[v] | 0) + 1; try { sfx.pickup(); } catch (e) {} } }
  if (a === 'nutri' && s.cash >= 80) { s.cash -= 80; s.inv.nutri = (s.inv.nutri | 0) + 1; }
  if (a === 'trap' || a === 'trap5') { const t = HH_TRAPS[v], n = a === 'trap5' ? 5 : 1; for (let i = 0; i < n; i++) if (hhPay(s, t.cost)) s.traps[v] = (s.traps[v] | 0) + 1; try { sfx.pickup(); burst(0.12, 2000, 0.08, 'bandpass'); } catch (e) {} }
  if (a === 'gun') { const g = HH_GUNS.find(x => x.id === v); if (hhPay(s, g.cost)) { s.arsenal.push({ id: v, tier: Math.min(2, s.base.bench - 1), dur: HH_GUN_DUR }); if (s.eq < 0) s.eq = s.arsenal.length - 1; try { showMsg(`CRAFTED ${HH_TIER[Math.min(2, s.base.bench - 1)].n} ${g.n}`); sfx.pickup(); } catch (e) {} } }
  if (a === 'eq') { const i = +v; s.eq = s.eq === i ? -1 : i; }
  if (a === 'scrapgun') { const i = +v; s.arsenal.splice(i, 1); s.inv.scrap = (s.inv.scrap | 0) + 3; if (s.eq === i) s.eq = -1; else if (s.eq > i) s.eq--; }
  if (a === 'bench') { const nb = HH_BENCH[s.base.bench]; if (nb && s.cash >= nb.cost) { s.cash -= nb.cost; s.base.bench++; try { showMsg(`WORKBENCH LEVEL ${s.base.bench}`); sfx.streak(); } catch (e) {} } }
  if (a === 'up') { const l = s.lv[v] | 0; if (l < 5 && s.cash >= hhUpCost(l)) { s.cash -= hhUpCost(l); s.lv[v] = l + 1; try { sfx.pickup(); } catch (e) {} } }
  if (a === 'raid') { hhSave(s); hhRaidStart(); return; }
  hhSave(s); hhMenuRender();
}
(() => { const s = document.createElement('style'); s.textContent = `.hh-menu .hh-mbox{width:min(760px,94vw);max-height:88vh;overflow:auto;text-align:left}
.hh-minv{display:flex;flex-wrap:wrap;gap:6px 12px;margin:8px 0 4px;font-size:11px;letter-spacing:.1em;opacity:.9}.hh-minv b{color:#fff}
.hh-sec{margin-top:12px}.hh-sec h4{margin:0 0 6px;font-size:11px;letter-spacing:.24em;color:#c8a0ff}.hh-sec p{font-size:12px;opacity:.8;margin:4px 0}
.hh-li{display:grid;grid-template-columns:200px 1fr auto auto;gap:8px;align-items:center;padding:6px 8px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);margin-bottom:4px}
.hh-li b{font-size:12px;letter-spacing:.08em}.hh-li b i{font-style:normal;color:#7aff8a;margin-left:4px}.hh-li span{font-size:11px;opacity:.8}.hh-li .mini{min-width:70px}.hh-li .mini.off{opacity:.4}`; document.head.appendChild(s); })();
