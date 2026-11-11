/* ================================================================== HOTBOX HORDE: GROWING 2 (1.2.102, the owner's list 1-10)
   Plants now grow step by step (st.p, st.lt, st.m: progress, last update, current speed) so care matters while they grow:
   WATER (a plant stays wet 10 min; dry plants grow at half speed; a sprinkler keeps them wet), PESTS (bugs show up now and
   then: half speed until you SPRAY them with 1 tree sap), FEED (nutrients, x1.5), GROW LIGHT, SPRINKLER and a GREENHOUSE
   canopy (+40% speed under it). Each harvest gets 1-5 QUALITY STARS from the care (fed, never dry, never bugged, under a
   light, in a greenhouse); stars raise the price (s.bq = total stars per strain). BREEDING: harvest a plant while a
   different ready strain grows within 2.5 m and you may get a HYBRID seed (ids 'x:a+b', registered in HH_STRAINS).
   CURING SHELF: cure 20 buds for 10 min -> CURED buds sell for +50%. THREE BUYERS (THE BUYER, DOC GREEN, AUNTIE KUSH) each
   like different strains; prices move through the day; a PRICE BOARD prop shows them. KITCHEN: bake BROWNIES (eat one at a
   mission's start: +30 health; or sell them to Auntie). BIG CONTRACTS: 40 buds of two strains within 3 days. */
Object.assign(HH_PROPS, {
  cure: { n: 'CURING SHELF', w: 1.4, d: 0.5, h: 1.6, col: '#ffcf4a', cost: { wood: 40, metal: 10 }, buy: 1, st: 1, d0: 'cure 20 buds for 10 min: they sell for 50% more' },
  prices: { n: 'PRICE BOARD', w: 1.6, d: 0.3, h: 2.2, col: '#7aff8a', cost: { wood: 20, battery: 1 }, buy: 1 },
  kitchen: { n: 'KITCHEN', w: 1.6, d: 0.8, h: 1.0, col: '#ff9a6a', cost: { metal: 25, stone: 20, battery: 1 }, buy: 1, st: 1, d0: 'bake brownies' },
  greenhouse: { n: 'GREENHOUSE', w: 6, d: 6, h: 3.2, col: '#bfffe0', cost: { wood: 60, metal: 30, stone: 20 }, buy: 1, noBox: 1, over: 1 },
});
HH_GROWP.push('cure', 'kitchen', 'greenhouse', 'prices');
const HH_WET_MS = 10 * 60000, HH_CURE_MS = 10 * 60000;
const HH_BUYERS = [{ id: 'buyer', n: 'THE BUYER', like: [], k: 1 }, { id: 'doc', n: 'DOC GREEN', like: ['blue', 'north', 'x'], k: 1.4, other: 0.8 }, { id: 'auntie', n: 'AUNTIE KUSH', like: ['og', 'haze', 'milk', 'brownie'], k: 1.4, other: 0.8 }];
const HH_HYN = { og: 'OG', haze: 'HAZE', blue: 'DREAM', north: 'LIGHTS', milk: 'MILK' };
function hhHybrid(id) {
  if (!id || !id.startsWith('x:') || HH_STRAINS.some(s => s.id === id)) return; const [a, b] = id.slice(2).split('+'), A = HH_STR(a), B = HH_STR(b); if (!A || !B) return;
  const c = new THREE.Color(A.col).lerp(new THREE.Color(B.col), 0.5).getHex();
  HH_STRAINS.push({ id, n: `${HH_HYN[a] || a.toUpperCase()} ${HH_HYN[b] || b.toUpperCase()}`, min: Math.round((A.min + B.min) / 2), yld: Math.max(A.yld, B.yld), price: Math.round((A.price + B.price) / 2 * 1.4), seed: 0, col: c, hy: 1 });
}
const _hhLoad2 = hhLoad;
hhLoad = function () { const s = _hhLoad2.apply(this, arguments); s.bq = s.bq || {}; s.cbud = s.cbud || {}; s.brownie = s.brownie | 0; for (const k of [...Object.keys(s.seeds), ...Object.keys(s.buds), ...Object.keys(s.cbud)]) hhHybrid(k); return s; };
/* ---------- growth step by step */
function hhRate(st) { return (st.sp || 1) * (st.gh || 1) * (Date.now() < (st.wt || 0) ? 1 : 0.5) * (st.bug ? 0.5 : 1) * (st.fed ? 1.5 : 1); }
hhGrowK = function (st) {
  if (!st || !st.st) return 0; const S0 = HH_STR(st.st);
  if (st.p === undefined) { st.p = clamp((Date.now() - st.t0) * (HH.growK || 1) / (S0.min * 60000) * (st.fed ? 1.5 : 1), 0, 1); st.lt = Date.now(); if (st.wt === undefined) st.wt = Date.now() + HH_WET_MS; }
  return clamp(st.p + (Date.now() - st.lt) * (HH.growK || 1) * hhRate(st) / (S0.min * 60000), 0, 1);
};
function hhGrowStep(st) { if (!st || !st.st) return; const k = hhGrowK(st), now = Date.now(); if (now > (st.wt || 0)) st.dry = (st.dry || 0) + (now - Math.max(st.lt, st.wt || 0)); st.p = k; st.lt = now; }
function hhStars(st) { let n = 1; if (st.fed) n++; if ((st.dry || 0) < 120000) n++; if (!st.bugged) n++; if ((st.yb || 1) > 1 || (st.gh || 1) > 1) n++; return Math.min(5, n); }
hhPlotUse = function (p) {
  const H = M.hh, s = H.s, st = s.base.plots[p.key], k = hhGrowK(st);
  if (!st || !st.st) { const sd = H.sel && (s.seeds[H.sel] | 0) > 0 ? H.sel : hhBestSeed(s); if (!sd) { showMsg('NO SEEDS · BUY THEM FROM THE BUYER'); return; } s.seeds[sd]--; s.base.plots[p.key] = { st: sd, t0: Date.now(), p: 0, lt: Date.now(), wt: Date.now() + HH_WET_MS, fed: false }; hhPlotVis(p); try { showBanner(`PLANTED ${HH_STR(sd).n}`, `ready in about ${HH_STR(sd).min} minutes · keep it watered · feed it NUTRIENTS`); burst(0.2, 600, 0.12, 'lowpass'); } catch (e) {} }
  else if (k >= 1) {
    hhGrowStep(st); const S0 = HH_STR(st.st), n = Math.round(S0.yld * (st.fed ? 1.5 : 1) * (1 + 0.2 * (H.lv.yield | 0)) * (st.yb || 1)), stars = hhStars(st);
    s.buds[st.st] = (s.buds[st.st] | 0) + n; s.bq[st.st] = (s.bq[st.st] | 0) + n * stars; s.grown = (s.grown | 0) + 1;
    let extra = '';   // BREEDING: a different strain ready next to it
    const mate = H.props.find(o => o !== p && o.k === 'plot' && Math.hypot(o.x - p.x, o.z - p.z) < 2.5 && s.base.plots[o.key] && s.base.plots[o.key].st && s.base.plots[o.key].st !== st.st && hhGrowK(s.base.plots[o.key]) >= 1);
    if (mate && !st.st.startsWith('x:') && !s.base.plots[mate.key].st.startsWith('x:') && Math.random() < 0.4) { const id = 'x:' + [st.st, s.base.plots[mate.key].st].sort().join('+'); hhHybrid(id); s.seeds[id] = (s.seeds[id] | 0) + 1; extra = ` · NEW HYBRID SEED: ${HH_STR(id).n}!`; try { sfx.streak(); } catch (e) {} }
    delete s.base.plots[p.key]; hhPlotVis(p);
    try { showBanner(`+${n} ${S0.n} BUDS · ${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}`, `${stars >= 4 ? 'top shelf' : stars >= 3 ? 'good stuff' : 'could be better: water, feed, light, no bugs'}${extra}`); sfx.pickup(); chunks('wood', new THREE.Vector3(p.x, p.y + 0.8, p.z), 10, 3, 0.6); } catch (e) {}
  }
  else if (st.bug) { if (!hhPay(s, { sap: 1 })) { showMsg('BUGS! SPRAYING NEEDS 1 TREE SAP'); return; } hhGrowStep(st); st.bug = 0; hhPlotVis(p); try { showMsg('SPRAYED · THE BUGS ARE GONE'); burst(0.4, 3000, 0.08, 'highpass'); } catch (e) {} }
  else if (Date.now() > (st.wt || 0)) { hhGrowStep(st); st.wt = Date.now() + HH_WET_MS; try { showMsg('WATERED · WET FOR 10 MINUTES'); burst(0.6, 900, 0.07, 'lowpass'); } catch (e) {} }
  else if (!st.fed && (s.inv.nutri | 0) > 0) { hhGrowStep(st); s.inv.nutri--; st.fed = true; try { showMsg('FED · +50% SPEED AND BUDS'); tone(660, 0.15, 0.05, 'sine', 990); } catch (e) {} }
  else { showMsg(st.fed ? 'STILL GROWING · WET AND FED' : 'STILL GROWING · NO NUTRIENTS (MISSIONS OR THE BUYER)'); return; }
  hhSave(s);
};
// bugs and water drops on the plant
const _hhPV = hhPlotVis;
hhPlotVis = function (pr) {
  _hhPV.apply(this, arguments); const st = M.hh.s.base.plots[pr.key];
  if (pr.plant && st && st.bug && !pr.bugs) { const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: 0x111111 }); for (let i = 0; i < 10; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), m); b.position.set(rnd(-0.3, 0.3), rnd(0.2, 1.1), rnd(-0.3, 0.3)); g.add(b); } pr.plant.add(g); pr.bugs = g; }
  if (pr.bugs && (!st || !st.bug || !pr.plant || pr.bugs.parent !== pr.plant)) { if (pr.bugs.parent) pr.bugs.parent.remove(pr.bugs); pr.bugs = null; }
  if (pr.bugs) pr.bugs.children.forEach((b, i) => { b.position.x += Math.sin(NOW * 9 + i) * 0.004; b.position.y += Math.cos(NOW * 7 + i) * 0.004; });
  if (pr.plant && st) { const dry = Date.now() > (st.wt || 0); pr.plant.userData.leafDry = dry; }
};
/* ---------- the base: speed boosts, water, bugs, prompts */
const _hhBT2 = hhBaseTick;
hhBaseTick = function (dt, u) {
  const H = M.hh, s = H.s;
  if ((H.g2T = (H.g2T || 0) - dt) <= 0) { H.g2T = 0.5;
    const ghs = H.props.filter(o => o.k === 'greenhouse');
    for (const pr of H.props) if (pr.k === 'plot') { const st = s.base.plots[pr.key]; if (!st || !st.st) continue; hhGrowStep(st);
      st.gh = ghs.some(g => Math.abs(pr.x - g.x) < g.w / 2 && Math.abs(pr.z - g.z) < g.d / 2) ? 1.4 : 1;
      if (H.props.some(o => o.k === 'sprinkler' && Math.hypot(o.x - pr.x, o.z - pr.z) < 3.5)) st.wt = Date.now() + HH_WET_MS;
      if (!st.bug && hhGrowK(st) < 1 && Math.random() < 0.5 / 1200) { st.bug = 1; st.bugged = 1; hhPlotVis(pr); try { showMsg('BUGS ON A PLANT! PRESS USE ON IT TO SPRAY (1 TREE SAP)'); } catch (e) {} } }
    for (const pr of H.props) if (pr.k === 'prices') hhPriceBoard(pr);
  }
  const r = _hhBT2.apply(this, arguments);
  if (playerAlive() && !HH.build && !HH.menu && HH.nearPlot) { const st = s.base.plots[HH.nearPlot.key]; if (st && st.st && hhGrowK(st) < 1) { const S0 = HH_STR(st.st), k = hhGrowK(st), left = (1 - k) * S0.min * 60 / hhRate(st) / (HH.growK || 1), dry = Date.now() > (st.wt || 0);
    showMsgOnce(`${S0.n} · ${Math.floor(k * 100)}% · READY IN ${fmtT(left)}${st.bug ? ` · BUGS! ${actName('use')} SPRAY` : dry ? ` · DRY! ${actName('use')} WATER` : !st.fed && (s.inv.nutri | 0) > 0 ? ` · ${actName('use')} FEED` : ' · WET'}${st.gh > 1 ? ' · GREENHOUSE' : ''}`); } }
  return r;
};
const _hhBM2 = hhBaseMarkers;
hhBaseMarkers = function (out) { _hhBM2(out); const H = M.hh; for (const pr of H.props) if (pr.k === 'plot') { const st = H.s.base.plots[pr.key]; if (st && st.st && hhGrowK(st) < 1 && (st.bug || Date.now() > (st.wt || 0)) && Math.hypot(pr.x - P.x, pr.z - P.z) < 30) out.push({ x: pr.x, y: pr.y + 1.9, z: pr.z, t: st.bug ? 'BUGS' : 'DRY', c: st.bug ? '#ff6a4a' : '#6ad8ff' }); } };
/* ---------- prices: three buyers, moving through the day, quality and curing */
function hhLikes(b, id) { return b.like.includes(id) || (id.startsWith('x:') && b.like.includes('x')); }
function hhPrice(id, b, cured) {
  const S0 = HH_STR(id), s = M && M.hh ? M.hh.s : hhLoad(), n = s.buds[id] | 0, stars = n ? (s.bq[id] || n * 3) / n : 3, h = new Date().getHours() + new Date().getMinutes() / 60;
  const wob = 1 + 0.12 * Math.sin(h * Math.PI / 3 + id.length * 1.7), base = id === 'brownie' ? 140 : S0.price;
  return Math.round(base * hhMarket() * wob * (b ? (hhLikes(b, id) ? b.k : b.other || 1) : 1) * (id === 'brownie' ? 1 : 0.7 + 0.12 * stars) * (cured ? 1.5 : 1));
}
function hhPriceBoard(pr) {
  if (!pr.board) { const c = document.createElement('canvas'); c.width = 512; c.height = 512; const t = new THREE.CanvasTexture(c); const m = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.45), new THREE.MeshBasicMaterial({ map: t })); m.position.set(0, 1.45, 0.08); pr.g.add(m); pr.board = { c, t };
    const post = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.55, 0.08), hhStd({ color: 0x1a1a1a })); post.position.set(0, 1.45, 0.02); pr.g.add(post); for (const x of [-0.7, 0.7]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), hhStd({ color: 0x1a1a1a })); l.position.set(x, 0.4, 0); pr.g.add(l); } }
  if (pr.boardT && NOW - pr.boardT < 20) return; pr.boardT = NOW;
  const x = pr.board.c.getContext('2d'); x.fillStyle = '#081008'; x.fillRect(0, 0, 512, 512); x.fillStyle = '#7aff8a'; x.font = 'bold 34px monospace'; x.fillText("TODAY'S PRICES", 24, 52); x.font = '22px monospace'; x.fillStyle = '#9ab89a'; x.fillText('STRAIN          BUYER  DOC  AUNTIE', 24, 92);
  HH_STRAINS.slice(0, 9).forEach((S0, i) => { x.fillStyle = ['#e8ffe8', '#d8b0ff'][i % 2]; x.fillText(`${S0.n.slice(0, 14).padEnd(15)} ${String(hhPrice(S0.id, HH_BUYERS[0])).padStart(5)} ${String(hhPrice(S0.id, HH_BUYERS[1])).padStart(4)} ${String(hhPrice(S0.id, HH_BUYERS[2])).padStart(6)}`, 24, 130 + i * 38); });
  pr.board.t.needsUpdate = true;
}
/* ---------- the BUYER menu: three buyers, cured buds, brownies, the big contract */
function hhContract(s) {
  const now = Date.now(); if (s.contract && s.contract.until > now) return s.contract;
  const pool = ['og', 'haze', 'blue', 'north'], a = pool[(Math.random() * 4) | 0], b = pool.filter(x => x !== a)[(Math.random() * 3) | 0];
  s.contract = { ids: [a, b], need: 40, have: 0, until: now + 3 * 86400000, pay: Math.round((HH_STR(a).price + HH_STR(b).price) * 20 * 1.8) }; hhSave(s); return s.contract;
}
const _hhMR2 = hhMenuRender;
hhMenuRender = function () {
  _hhMR2.apply(this, arguments); const o = $('hhMenu'), H = M && M.hh; if (!o || !H) return; const s = H.s, box = o.querySelector('.hh-mbox'); if (!box) return;
  if (HH.menu === 'buyer') {
    const old = [...box.querySelectorAll('.hh-sec')].find(e => (e.querySelector('h4') || {}).textContent === 'SELL YOUR BUDS'); if (!old) return;
    const have = [...HH_STRAINS.filter(x => s.buds[x.id] > 0).map(x => [x.id, false]), ...HH_STRAINS.filter(x => s.cbud[x.id] > 0).map(x => [x.id, true]), ...(s.brownie ? [['brownie', false]] : [])];
    const row = (id, cured) => { const n = id === 'brownie' ? s.brownie : cured ? s.cbud[id] : s.buds[id], nm = id === 'brownie' ? 'BROWNIES' : (cured ? 'CURED ' : '') + HH_STR(id).n, st = id === 'brownie' || cured ? '' : ` · ${((s.bq[id] || n * 3) / n).toFixed(1)}★`;
      return `<div class="hh-li hh-li4"><b>${nm}</b><span>${n}${st}</span>${HH_BUYERS.map(b => `<button class="mini${hhLikes(b, id) ? ' like' : ''}" data-hm="sellb:${b.id}|${id}|${cured ? 1 : 0}">${b.n.split(' ').pop()} $${(hhPrice(id, b, cured) * n).toLocaleString()}</button>`).join('')}</div>`; };
    const C = hhContract(s), left = Math.max(0, Math.ceil((C.until - Date.now()) / 3600000));
    const sec = document.createElement('div'); sec.className = 'hh-sec'; sec.innerHTML = `<h4>SELL · THREE BUYERS (highlighted = they pay 40% more for it)</h4>${have.length ? have.map(([id, c]) => row(id, c)).join('') : '<p>No buds yet. Plant seeds in GROW PLOTS and harvest them when they are ready.</p>'}` +
      `<h4 style="margin-top:10px">BIG CONTRACT · ${left} H LEFT</h4><div class="hh-li"><b>${C.need} ${HH_STR(C.ids[0]).n} OR ${HH_STR(C.ids[1]).n}</b><span>${C.have} / ${C.need} delivered · pays $${C.pay.toLocaleString()} + 2 rare seeds</span><button class="mini" data-hm="contract:1">DELIVER</button></div>`;
    old.replaceWith(sec);
  }
  if (HH.menu === 'kitchen') {
    box.innerHTML = `<small>KITCHEN</small><b>BAKE</b><div class="hh-minv"><span>BROWNIES <b>${s.brownie}</b></span><span>BUDS <b>${Object.values(s.buds).reduce((a, b) => a + (b | 0), 0)}</b></span><span>NUTRIENTS <b>${s.inv.nutri | 0}</b></span></div>
      <div class="hh-sec"><h4>RECIPES</h4><div class="hh-li"><b>A TRAY OF BROWNIES</b><span>4 buds (the cheapest first) + 1 NUTRIENTS · AUNTIE KUSH pays best</span><button class="mini" data-hm="bake:1">BAKE</button><button class="mini" data-hm="bake:5">×5</button></div>
      <div class="hh-li"><b>EAT ONE ON MISSIONS</b><span>${s.eat ? 'ON' : 'OFF'} · at the start of a mission you eat a brownie: 130 health</span><button class="mini" data-hm="eat:1">${s.eat ? 'TURN OFF' : 'TURN ON'}</button></div></div><div class="onb-acts"><button class="btn" data-hm="close">CLOSE (${actName('use')} / ESC)</button></div>`;
  }
};
const _hhMD2 = hhMenuDo;
hhMenuDo = function (a, v) {
  const H = M.hh, s = H.s;
  if (a === 'sellb') { const [bid, id, c] = v.split('|'), b = HH_BUYERS.find(x => x.id === bid), cured = c === '1', n = id === 'brownie' ? s.brownie : cured ? s.cbud[id] | 0 : s.buds[id] | 0; if (!n) return; const got = hhPrice(id, b, cured) * n;
    if (id === 'brownie') s.brownie = 0; else if (cured) s.cbud[id] = 0; else { s.buds[id] = 0; s.bq[id] = 0; }
    s.cash += got; s.sold = (s.sold | 0) + got; hhSave(s); try { showMsg(`SOLD TO ${b.n} · +$${got.toLocaleString()}`); sfx.pickup(); tone(880, 0.1, 0.05, 'triangle', 1320); } catch (e) {} hhMenuRender(); return; }
  if (a === 'contract') { const C = hhContract(s); for (const id of C.ids) { const n = Math.min(s.buds[id] | 0, C.need - C.have); if (n > 0) { const q = (s.bq[id] || 0) / Math.max(1, s.buds[id]); s.buds[id] -= n; s.bq[id] = Math.round(q * s.buds[id]); C.have += n; } }
    if (C.have >= C.need) { s.cash += C.pay; const sd = Math.random() < 0.3 ? 'milk' : 'north'; s.seeds[sd] = (s.seeds[sd] | 0) + 2; s.contract = null; try { showBanner('CONTRACT DONE', `+$${C.pay.toLocaleString()} · +2 ${HH_STR(sd).n} SEEDS`); sfx.streak(); } catch (e) {} } hhSave(s); hhMenuRender(); return; }
  if (a === 'bake') { let made = 0; for (let i = 0; i < +v; i++) { const cheap = HH_STRAINS.filter(x => s.buds[x.id] > 0).sort((x, y) => x.price - y.price); let need = 4; const take = []; for (const x of cheap) { const t = Math.min(need, s.buds[x.id]); take.push([x.id, t]); need -= t; if (!need) break; } if (need || (s.inv.nutri | 0) < 1) break; for (const [id, t] of take) s.buds[id] -= t; s.inv.nutri--; s.brownie++; made++; }
    try { showMsg(made ? `BAKED ${made} TRAY${made > 1 ? 'S' : ''} OF BROWNIES` : 'NEEDS 4 BUDS AND 1 NUTRIENTS'); if (made) sfx.pickup(); } catch (e) {} hhSave(s); hhMenuRender(); return; }
  if (a === 'eat') { s.eat = !s.eat; hhSave(s); hhMenuRender(); return; }
  return _hhMD2.apply(this, arguments);
};
// the curing shelf: a station without a menu (USE puts a batch in, or takes it out when it's done)
const _hhMO2 = hhMenuOpen;
hhMenuOpen = function (kind) {
  if (kind !== 'cure') return _hhMO2.apply(this, arguments);
  const H = M.hh, s = H.s, C = s.cure;
  if (C) { const left = HH_CURE_MS - (Date.now() - C.t0); if (left > 0) { showMsg(`CURING ${C.n} ${HH_STR(C.id).n} · READY IN ${fmtT(left / 1000)}`); return; } s.cbud[C.id] = (s.cbud[C.id] | 0) + C.n; s.cure = null; hhSave(s); try { showBanner(`+${C.n} CURED ${HH_STR(C.id).n}`, 'they sell for 50% more'); sfx.pickup(); } catch (e) {} return; }
  const best = HH_STRAINS.filter(x => s.buds[x.id] > 0).sort((x, y) => y.price - x.price)[0]; if (!best) { showMsg('CURING SHELF · NO BUDS TO CURE'); return; }
  const n = Math.min(20, s.buds[best.id]), q = (s.bq[best.id] || 0) / s.buds[best.id]; s.buds[best.id] -= n; s.bq[best.id] = Math.round(q * s.buds[best.id]); s.cure = { id: best.id, n, t0: Date.now() }; hhSave(s);
  try { showMsg(`CURING ${n} ${best.n} · READY IN 10 MIN`); burst(0.2, 800, 0.08, 'lowpass'); } catch (e) {}
};
// a brownie at the start of a mission
const _hhTick2 = hhTick;
hhTick = function (dt) {
  const H = M.hh, first = H && !H.placed; const r = _hhTick2.apply(this, arguments);
  if (first && H && !H.base && H.s.eat && H.s.brownie > 0) { H.s.brownie--; hhSave(H.s); G.maxHp = 130; G.health = 130; try { showMsg('ATE A BROWNIE · 130 HEALTH'); } catch (e) {} }
  return r;
};
/* ---------- the new props' meshes */
const _hhPM2 = hhPropMesh;
hhPropMesh = function (k) {
  if (!['cure', 'prices', 'kitchen', 'greenhouse'].includes(k)) return _hhPM2(k);
  const g = new THREE.Group(), add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; }, B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const wood = hhStd({ color: 0x8a5a32, roughness: 0.85 }), steel = hhStd({ color: 0x9aa0a8, metalness: 0.7, roughness: 0.35 });
  if (k === 'cure') { for (const x of [-0.66, 0.66]) add(B(0.06, 1.6, 0.45), wood, x, 0.8, 0); const glass = hhStd({ color: 0xd8f0ff, transparent: true, opacity: 0.5, roughness: 0.05 }), lid = hhStd({ color: 0x3a3a3a, metalness: 0.6 }), bud = hhStd({ color: 0x6a9a3a, roughness: 0.8 }); for (const y of [0.35, 0.85, 1.35]) { add(B(1.3, 0.04, 0.45), wood, 0, y, 0); for (let i = 0; i < 5; i++) { const x = -0.5 + i * 0.25; add(new THREE.CylinderGeometry(0.08, 0.08, 0.26, 10), glass, x, y + 0.15, 0); add(new THREE.CylinderGeometry(0.085, 0.085, 0.04, 10), lid, x, y + 0.3, 0); add(new THREE.SphereGeometry(0.055, 6, 5), bud, x, y + 0.08, 0); } } }
  else if (k === 'prices') { /* drawn by hhPriceBoard */ }
  else if (k === 'kitchen') { add(B(1.6, 0.9, 0.75), hhStd({ color: 0xe8e8e0, roughness: 0.5 }), 0, 0.45, 0); add(B(1.62, 0.05, 0.78), hhStd({ color: 0x3a3a3a, roughness: 0.3 }), 0, 0.92, 0); add(B(0.6, 0.45, 0.04), hhStd({ color: 0x111111, roughness: 0.2 }), -0.4, 0.45, 0.39); for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 12), hhStd({ color: 0x222222 }), 0.3 + (i % 2) * 0.35, 0.95, -0.15 + ((i / 2) | 0) * 0.3); add(B(0.4, 0.05, 0.3), hhStd({ color: 0x5a3a1a, roughness: 0.6 }), -0.3, 0.97, 0); }
  else { const glass = hhStd({ color: 0xcff8ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false }); for (const [x, z] of [[-2.95, -2.95], [2.95, -2.95], [-2.95, 2.95], [2.95, 2.95], [0, -2.95], [0, 2.95], [-2.95, 0], [2.95, 0]]) add(B(0.08, 3.0, 0.08), steel, x, 1.5, z);
    for (const s of [-1, 1]) { const r = add(B(3.2, 0.03, 6.0), glass, s * 1.5, 3.25, 0); r.rotation.z = s * -0.18; r.castShadow = false; } add(B(0.1, 0.1, 6), steel, 0, 3.52, 0); for (const z of [-2.95, 2.95]) { const w = add(B(6, 0.9, 0.03), glass, 0, 0.45, z); w.castShadow = false; } for (const x of [-2.95, 2.95]) { const w = add(B(0.03, 0.9, 6), glass, x, 0.45, 0); w.castShadow = false; } }
  return g;
};
(() => { const s = document.createElement('style'); s.textContent = `.hh-li.hh-li4{grid-template-columns:180px 1fr auto auto auto}.hh-li .mini.like{border-color:#7aff8a;color:#7aff8a}`; document.head.appendChild(s); })();
