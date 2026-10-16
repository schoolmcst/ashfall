/* ================================================================== BATTLE PASS · SEASON 1: AFTERSHOCK
   100 tiers. Every match's XP also fills the pass (2,500 XP a tier). Two rows:
   - FREE row: DZ, free CHANCE BOX openings (standard / elite / prestige) and a few cosmetics
   - PREMIUM row: one pass-only cosmetic on every tier (camos, skins, stickers; tier 100 is the master skin)
   Premium is unlocked for everyone while the game is in beta (PASS.premiumFree). To sell it later, turn that off and
   set PROG.bp.prem = true when a purchase is confirmed (bpSetPremium); everything earned so far on the premium row is
   then handed out at once. Boxes and DZ stay on the free row on purpose, so paying never buys box openings.
   Saved inside ashfall.prog.v1 (PROG.bp, PROG.tok), so the save backup keeps it. */
const PASS = { season: 1, name: 'AFTERSHOCK', tiers: 100, tierXp: 2500, ends: '2026-12-31', premiumFree: true };
const BP_BOX = { 25: 'prestige', 50: 'prestige', 75: 'prestige', 100: 'prestige', 10: 'elite', 30: 'elite', 45: 'elite', 60: 'elite', 70: 'elite', 90: 'elite',
  5: 'std', 15: 'std', 20: 'std', 35: 'std', 40: 'std', 55: 'std', 65: 'std', 80: 'std', 85: 'std', 95: 'std' };
const BP_PREM = {}, BP_FREEIT = {};
for (const c of COSM) if (c.bp === PASS.season) (c.track === 'f' ? BP_FREEIT : BP_PREM)[c.tier] = c.id;
// what each tier gives on each row
function bpReward(t, prem) {
  if (prem) return BP_PREM[t] ? { type: 'item', id: BP_PREM[t] } : null;
  if (BP_FREEIT[t]) return { type: 'item', id: BP_FREEIT[t] };
  if (BP_BOX[t]) return { type: 'box', box: BP_BOX[t] };
  return { type: 'dz', n: 100 + 25 * Math.floor(t / 20) };
}
if (!PROG.bp || PROG.bp.s !== PASS.season) PROG.bp = { s: PASS.season, xp: 0, cf: 0, cp: 0, prem: false };
if (!PROG.tok) PROG.tok = { std: 0, elite: 0, prestige: 0 };
const bpPremium = () => PASS.premiumFree || !!PROG.bp.prem;
const bpTier = (xp = PROG.bp.xp) => Math.min(PASS.tiers, 1 + Math.floor(xp / PASS.tierXp));
function bpProgress() { const t = bpTier(); if (t >= PASS.tiers) return { t, into: 1, need: 1, frac: 1 }; const into = PROG.bp.xp - (t - 1) * PASS.tierXp; return { t, into, need: PASS.tierXp, frac: into / PASS.tierXp }; }
function bpGive(r) {
  if (!r) return;
  if (r.type === 'item') { if (!PROG.owned[r.id]) PROG.owned[r.id] = Date.now(); else PROG.dz += RAR[COS[r.id].r].refund; }
  else if (r.type === 'box') PROG.tok[r.box] = (PROG.tok[r.box] | 0) + 1;
  else if (r.type === 'dz') PROG.dz += r.n;
}
// hand out everything reached and not yet given (runs after XP, on load and when premium gets unlocked)
function bpSync() {
  const t = bpTier(), got = [];
  for (let i = PROG.bp.cf + 1; i <= t; i++) { const r = bpReward(i, false); bpGive(r); got.push(Object.assign({ t: i, prem: false }, r)); }
  PROG.bp.cf = Math.max(PROG.bp.cf, t);
  if (bpPremium()) { for (let i = PROG.bp.cp + 1; i <= t; i++) { const r = bpReward(i, true); bpGive(r); if (r) got.push(Object.assign({ t: i, prem: true }, r)); } PROG.bp.cp = Math.max(PROG.bp.cp, t); }
  if (got.length) saveProg();
  return got;
}
function bpGain(xp) { const from = bpTier(); PROG.bp.xp += Math.max(0, xp | 0); const got = bpSync(); return { xp, from, to: bpTier(), got }; }
function bpSetPremium(on) { PROG.bp.prem = !!on; saveProg(); return bpSync(); }   // the future purchase hook
try { bpSync(); } catch (e) {}
const bpDaysLeft = () => Math.max(0, Math.ceil((new Date(PASS.ends + 'T23:59:59') - Date.now()) / 864e5));
const BOX_NAME = { std: 'STANDARD', elite: 'ELITE', prestige: 'PRESTIGE' }, BOX_COL = { std: '#9aa3a9', elite: '#4aa3ff', prestige: '#f2b84b' };
const bpRewardName = r => !r ? '' : r.type === 'item' ? COS[r.id].name : r.type === 'box' ? BOX_NAME[r.box] + ' BOX' : r.n + ' DZ';
// a line for the match results screen
function bpResultsHtml(g) {
  if (!g) return '';
  const p = bpProgress(), items = g.got.filter(r => r.type === 'item').map(r => `<i style="color:${RAR[COS[r.id].r].col}">${COS[r.id].name}</i>`);
  return `<div class="bp-res"><b>BATTLE PASS</b><span>${g.to > g.from ? `TIER ${g.from} → <em>${g.to}</em>` : `TIER ${g.to}`}</span><div class="pg-bar sm"><s style="width:${p.frac * 100}%"></s></div>${items.length ? `<small>${items.join(' · ')} UNLOCKED</small>` : ''}</div>`;
}

/* ---------- the BATTLE PASS screen: 10 tiers a page, premium row on top, free row below, details on the left */
const BPV = { page: 0, sel: null, ret: 'lobby' };
function openBattlePass() {
  if (curScreen !== 'bpass') BPV.ret = curScreen || 'lobby';
  bpSync(); const t = bpTier(); BPV.page = Math.floor((t - 1) / 10); BPV.sel = { t, prem: true };
  renderBattlePass(); showScreen('bpass'); focusFirst(`#bpTrack [data-bpt="${t}p"]`);
}
function bpBack() { if (BPV.ret === 'lobby') toLobby(); else showScreen(BPV.ret || 'menu'); }
function bpCell(t, prem) {
  const r = bpReward(t, prem), tier = bpTier(), have = t <= tier && (!prem || bpPremium()), cur = t === tier + 1 || (t === tier && tier >= PASS.tiers), sel = BPV.sel && BPV.sel.t === t && BPV.sel.prem === prem;
  if (!r) return `<div class="bp-c empty"></div>`;
  let art = '', col = '#9aa3a9';
  if (r.type === 'item') { const c = COS[r.id]; col = RAR[c.r].col; art = c.kind === 'banner' ? `<span class="bp-art bn" style="background-image:url(${bannerUrl(c.id)})"></span>` : `<span class="bp-art${c.kind === 'sticker' || c.kind === 'charm' ? ' stk' : ''}" style="background-image:url(${swatchUrl(c.id)})"></span>`; }
  else if (r.type === 'box') { col = BOX_COL[r.box]; art = `<span class="bp-art box"><span class="bp-crate" style="--bc:${col}"><span>${BOX_NAME[r.box][0]}</span></span></span>`; }
  else art = `<span class="bp-art dz"><i class="dzi">DZ</i><b>${r.n}</b></span>`;
  return `<button class="bp-c${prem ? ' prem' : ''}${have ? ' got' : ''}${cur ? ' next' : ''}${sel ? ' on' : ''}" data-bpt="${t}${prem ? 'p' : 'f'}" style="--rc:${col}">${art}<small>${bpRewardName(r)}</small>${have ? '<i class="bp-ok">✓</i>' : ''}</button>`;
}
function renderBattlePass() {
  const p = bpProgress(), prem = bpPremium(), t0 = BPV.page * 10 + 1, days = bpDaysLeft();
  $('bpTop').innerHTML = progCardHtml();
  $('bpHead').innerHTML = `<div class="bp-tier"><small>TIER</small><b>${p.t}</b></div><div class="bp-prog"><div class="bp-prog-h"><span>${p.t >= PASS.tiers ? 'PASS COMPLETE' : `${p.into.toLocaleString()} / ${p.need.toLocaleString()} XP TO TIER ${p.t + 1}`}</span><span>${days} DAYS LEFT</span></div><div class="pg-bar"><s style="width:${p.frac * 100}%"></s></div>
<div class="bp-how">Every match fills the pass: the same XP as your level (kills, headshots, objectives, finishing and winning).</div></div>
<div class="bp-prem${prem ? ' on' : ''}"><b>PREMIUM</b>${PASS.premiumFree ? '<span>FREE DURING BETA</span>' : prem ? '<span>UNLOCKED</span>' : '<button class="btn primary" data-act="bp-buy">UNLOCK PREMIUM</button>'}</div>`;
  const cols = []; for (let t = t0; t < t0 + 10 && t <= PASS.tiers; t++) cols.push(t);
  $('bpTrack').innerHTML = `<div class="bp-rowl prem">PREMIUM</div>${cols.map(t => bpCell(t, true)).join('')}
<div class="bp-rowl tn"></div>${cols.map(t => `<div class="bp-tn${t <= p.t ? ' got' : ''}${t === p.t ? ' now' : ''}">${t}</div>`).join('')}
<div class="bp-rowl">FREE</div>${cols.map(t => bpCell(t, false)).join('')}`;
  $('bpPages').innerHTML = `<button class="btn" data-act="bp-prev"${BPV.page ? '' : ' disabled'}>&lsaquo;</button>${[...Array(10)].map((_, i) => `<button class="bp-pg${i === BPV.page ? ' on' : ''}${(i + 1) * 10 <= p.t ? ' got' : ''}" data-act="bp-page-${i}">${i * 10 + 1}-${i * 10 + 10}</button>`).join('')}<button class="btn" data-act="bp-next"${BPV.page < 9 ? '' : ' disabled'}>&rsaquo;</button>`;
  for (const b of $('bpTrack').querySelectorAll('[data-bpt]')) b.onclick = () => { const k = b.dataset.bpt; BPV.sel = { t: parseInt(k), prem: k.endsWith('p') }; sfx.ui(); renderBattlePass(); focusFirst(`#bpTrack [data-bpt="${k}"]`); };
  renderBpDetail();
}
function renderBpDetail() {
  const el = $('bpDetail'), s = BPV.sel; if (!el || !s) return;
  const r = bpReward(s.t, s.prem), tier = bpTier(), have = s.t <= tier && (!s.prem || bpPremium());
  if (!r) { el.innerHTML = ''; return; }
  let pic = '', head = '', acts = '';
  if (r.type === 'item') {
    const c = COS[r.id], gun = (WEAPONS && WEAPONS[0] && WEAPONS[0].def && WEAPONS[0].def.id) || 'marc';
    if (c.kind === 'banner') pic = bannerCardHtml(c.id, (typeof NET !== 'undefined' && NET.nick) || 'PLAYER', lvlInfo(PROG.xp).l, true);
    else { const g = c.kind === 'sticker' ? gunPic(gun, camoFor(gun), c.id, charmFor(gun)) : c.kind === 'charm' ? gunPic(gun, camoFor(gun), stickerFor(gun), c.id) : gunPic(gun, c.id, stickerFor(gun), charmFor(gun));
      pic = `<div class="bp-pic" data-pic="${g.key}">${g.url ? `<img src="${g.url}" alt="">` : ''}</div><div class="bp-sw${c.kind === 'sticker' || c.kind === 'charm' ? ' stk' : ''}" style="background-image:url(${swatchUrl(c.id)})"></div>`; }
    head = `<small style="color:${RAR[c.r].col}">${RAR[c.r].name} ${kindName(c)} · SEASON 1</small><b>${c.name}</b>`;
    if (have && PROG.owned[c.id]) acts = c.kind === 'banner' ? `<button class="btn primary" data-act="bp-eq-bn"${bannerFor() === c.id ? ' disabled' : ''}>${bannerFor() === c.id ? 'EQUIPPED' : 'EQUIP BANNER'}</button>` : `<button class="btn primary" data-act="bp-eq-${c.kind === 'sticker' ? 'stk' : c.kind === 'charm' ? 'chm' : 'camo'}">EQUIP ON ALL WEAPONS</button>`;
  } else if (r.type === 'box') {
    pic = `<div class="bp-pic box"><span class="bp-crate big" style="--bc:${BOX_COL[r.box]}"><span>${BOX_NAME[r.box][0]}</span></span></div>`;
    head = `<small style="color:${BOX_COL[r.box]}">FREE CHANCE BOX</small><b>${BOX_NAME[r.box]} BOX</b><p>One free opening of the ${BOX_NAME[r.box].toLowerCase()} box. Open it in REWARDS${PROG.tok[r.box] ? ` · you have ${PROG.tok[r.box]}` : ''}.</p>`;
    if ((PROG.tok[r.box] | 0) > 0) acts = `<button class="btn primary" data-act="rewards">GO TO REWARDS</button>`;
  } else {
    pic = `<div class="bp-pic dz"><i class="dzi">DZ</i><b>${r.n}</b></div>`;
    head = `<small>DZ</small><b>${r.n} DZ</b><p>Spend DZ on chance boxes in REWARDS.</p>`;
  }
  el.innerHTML = `${pic}<div class="bp-dh">${head}</div><div class="bp-st${have ? ' got' : ''}">${have ? 'UNLOCKED' : s.prem && !bpPremium() ? `PREMIUM · TIER ${s.t}` : `REACH TIER ${s.t}`} · ${s.prem ? 'PREMIUM ROW' : 'FREE ROW'}</div><div class="lk-acts">${acts}</div>`;
}
function bpAct(act) {
  if (act === 'bpass') { openBattlePass(); return true; }
  if (act === 'bp-back') { bpBack(); return true; }
  if (act === 'bp-prev' || act === 'bp-next' || act.startsWith('bp-page-')) {
    BPV.page = act === 'bp-prev' ? Math.max(0, BPV.page - 1) : act === 'bp-next' ? Math.min(9, BPV.page + 1) : +act.slice(8);
    BPV.sel = { t: BPV.page * 10 + 1, prem: true }; sfx.ui(); renderBattlePass(); focusFirst(act.startsWith('bp-page-') ? `[data-act="${act}"]` : `[data-act="${act}"]:not([disabled]), #bpTrack [data-bpt]`); return true;
  }
  if (act === 'bp-eq-bn') { const r = BPV.sel && bpReward(BPV.sel.t, BPV.sel.prem); if (r && r.type === 'item' && PROG.owned[r.id]) { PROG.banner = r.id; saveProg(); sfx.ui(); toast2('BANNER EQUIPPED'); renderBattlePass(); } return true; }
  if (act === 'bp-eq-camo' || act === 'bp-eq-stk' || act === 'bp-eq-chm') {
    const r = BPV.sel && bpReward(BPV.sel.t, BPV.sel.prem); if (!r || r.type !== 'item' || !PROG.owned[r.id]) return true;
    const slot = act === 'bp-eq-camo' ? PROG.equip : act === 'bp-eq-stk' ? PROG.stk : PROG.chm; slot.all = r.id; for (const g in slot.guns) if (!(COS[slot.guns[g]] && COS[slot.guns[g]].secret)) delete slot.guns[g];
    saveProg(); refreshHeldCamos(); sfx.ui(); toast2(COS[r.id].name + ' ON ALL WEAPONS'); renderBattlePass(); return true;
  }
  if (act === 'bp-buy') { toast2('PREMIUM IS NOT ON SALE YET'); return true; }
  return false;
}
(() => {
  const d = document.createElement('div'); d.id = 'bpass'; d.className = 'screen cod pg-scr hide';
  d.innerHTML = `<div class="cod-top"><div class="cod-title"><small>SEASON 1 · ${PASS.name}</small><b>BATTLE PASS</b></div><div style="flex:1"></div><div class="cod-card" id="bpTop"></div></div>
<div class="bp-body"><div class="bp-head" id="bpHead"></div><div class="bp-main"><div class="bp-detail rw-card" id="bpDetail"></div><div class="bp-right"><div class="bp-track" id="bpTrack"></div><div class="bp-pages" id="bpPages"></div></div></div></div>
<div class="cod-foot"><button class="btn" data-act="bp-back">&lsaquo; BACK</button><span class="padhint">B BACK</span></div>`;
  document.body.appendChild(d);
  const s = document.createElement('style');
  s.textContent = `.bp-body{flex:1;display:flex;flex-direction:column;gap:14px;padding:14px 3vw;min-height:0;overflow:auto;pointer-events:auto}
.bp-head{display:flex;align-items:center;gap:22px;padding:14px 18px;border:1px solid var(--line);background:linear-gradient(90deg,rgba(255,90,20,.14),rgba(10,12,13,.8) 45%)}
.bp-tier{text-align:center;min-width:76px}.bp-tier small{display:block;font-size:11px;letter-spacing:.3em;color:#ff8a4a}.bp-tier b{font-size:46px;line-height:1;color:#fff}
.bp-prog{flex:1;min-width:0}.bp-prog-h{display:flex;justify-content:space-between;font-size:12px;letter-spacing:.14em;color:#fff;margin-bottom:6px}.bp-prog-h span:last-child{color:var(--dim)}
.bp-prog .pg-bar{height:10px}.bp-how{margin-top:6px;font-size:11px;letter-spacing:.06em;color:var(--dim)}
.bp-prem{display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 16px;border:1px solid rgba(242,184,75,.4);min-width:160px}.bp-prem b{letter-spacing:.3em;color:#f2b84b;font-size:14px}.bp-prem span{font-size:11px;letter-spacing:.16em;color:#fff}
.bp-prem.on{background:rgba(242,184,75,.1)}
.bp-main{display:grid;grid-template-columns:minmax(260px,340px) 1fr;gap:16px;min-height:0}
.bp-detail{align-self:start}.bp-pic{height:120px;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 60%,rgba(255,120,40,.12),rgba(0,0,0,.5) 70%);border:1px solid var(--line)}
.bp-pic img{max-width:100%;max-height:100%}.bp-pic.dz{gap:10px;font-size:34px;font-weight:800;color:#fff}.bp-pic.dz .dzi{transform:scale(1.6)}
.bp-sw{height:46px;background-size:56px;border:1px solid rgba(0,0,0,.5);margin-top:-1px}.bp-sw.stk{background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#15181b}
.bp-dh small{display:block;font-size:11px;letter-spacing:.24em}.bp-dh b{display:block;font-size:24px;letter-spacing:.1em;color:#fff;margin-top:2px}.bp-dh p{margin:6px 0 0;font-size:12px;line-height:1.45;color:var(--dim)}
.bp-st{font-size:11px;letter-spacing:.2em;color:var(--dim);padding:8px 10px;border:1px dashed var(--line)}.bp-st.got{color:#7ef0a0;border-style:solid;border-color:rgba(126,240,160,.4)}
.bp-right{display:flex;flex-direction:column;gap:10px;min-width:0}
.bp-track{display:grid;grid-template-columns:64px repeat(10,minmax(0,1fr));gap:6px;align-items:stretch}
.bp-rowl{display:flex;align-items:center;font-size:10px;letter-spacing:.2em;color:var(--dim);writing-mode:horizontal-tb}.bp-rowl.prem{color:#f2b84b}
.bp-tn{text-align:center;font-size:12px;font-weight:700;color:var(--dim);padding:2px 0;border-bottom:3px solid rgba(255,255,255,.12)}.bp-tn.got{color:#fff;border-color:#ff7a2a}.bp-tn.now{color:#ff8a4a}
.bp-c{position:relative;pointer-events:auto;cursor:pointer;display:flex;flex-direction:column;align-items:stretch;gap:5px;padding:6px;min-height:132px;border:1px solid var(--line);border-bottom:3px solid var(--rc);background:rgba(10,12,13,.8);color:#fff;font-family:inherit;text-align:left}
.bp-c.prem{background:linear-gradient(180deg,rgba(242,184,75,.10),rgba(10,12,13,.85))}
.bp-c small{font-size:9px;letter-spacing:.04em;word-break:break-word;line-height:1.25;color:#fff;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bp-c .bp-art{display:block;height:80px;background-size:64px;border:1px solid rgba(0,0,0,.45)}.bp-c .bp-art.stk{background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#15181b}
.bp-c .bp-art.bn{background-size:cover;background-position:right center}.bp-detail .bn-card{max-width:none}
.bp-c .bp-art.dz{display:flex;align-items:center;justify-content:center;gap:6px;background:#15181b;font-size:16px;font-weight:800}.bp-c .bp-art.box{display:flex;align-items:center;justify-content:center;background:#15181b}
.bp-crate{position:relative;display:flex;align-items:center;justify-content:center;width:54px;height:42px;border:2px solid var(--bc);background:linear-gradient(160deg,#2b3036,#15181b);box-shadow:inset 0 0 0 4px rgba(0,0,0,.25)}
.bp-crate::before{content:"";position:absolute;left:-2px;right:-2px;top:34%;height:7px;background:var(--bc)}.bp-crate span{position:relative;font-weight:900;font-size:16px;color:#fff;text-shadow:0 0 4px #000}
.bp-crate.big{width:110px;height:84px;border-width:3px}.bp-crate.big::before{height:12px}.bp-crate.big span{font-size:30px}
.bp-c:not(.got){opacity:.62}.bp-c.next{opacity:1;box-shadow:0 0 0 1px #ff7a2a inset}.bp-c.got{opacity:1}
.bp-ok{position:absolute;top:4px;right:4px;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:12px;font-weight:900;background:#2fbf6a;color:#06150c}
.bp-c.on,.bp-c:focus{outline:2px solid var(--accent);outline-offset:1px;opacity:1}.bp-c.empty{background:none;border:1px dashed rgba(255,255,255,.06)}
.bp-pages{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.bp-pages .btn{width:auto;min-width:0;padding:8px 14px}
.bp-pg{pointer-events:auto;cursor:pointer;font-family:inherit;font-size:11px;letter-spacing:.08em;padding:8px 10px;border:1px solid var(--line);background:rgba(0,0,0,.4);color:var(--dim)}.bp-pg.got{color:#fff;border-bottom:2px solid #ff7a2a}
.bp-pg.on,.bp-pg:focus{outline:0;color:#111;background:var(--accent);border-color:var(--accent)}
.rw-free{background:rgba(242,184,75,.22)!important;color:#fff!important}
.bp-res{margin-top:8px;padding:8px 12px;border:1px solid rgba(255,122,42,.4);background:rgba(255,90,20,.08);display:grid;grid-template-columns:auto 1fr;gap:4px 12px;align-items:center}
.bp-res b{font-size:11px;letter-spacing:.24em;color:#ff8a4a}.bp-res span{font-size:12px;letter-spacing:.14em;color:#fff;text-align:right}.bp-res span em{font-style:normal;color:#ff8a4a}.bp-res .pg-bar{grid-column:1/-1}.bp-res small{grid-column:1/-1;font-size:11px;letter-spacing:.1em;color:#fff}.bp-res small i{font-style:normal}
@media (max-width:1100px){.bp-main{grid-template-columns:210px 1fr;gap:10px}.bp-pic{height:84px}.bp-dh b{font-size:18px}.bp-c{min-height:108px;padding:4px}.bp-c .bp-art{height:58px}.bp-track{grid-template-columns:44px repeat(10,minmax(0,1fr));gap:4px}.bp-rowl{font-size:8px;letter-spacing:.1em}.bp-head{gap:12px;padding:10px 12px}.bp-tier b{font-size:34px}.bp-prem{min-width:0}.bp-how{display:none}}`;
  document.head.appendChild(s);
})();
