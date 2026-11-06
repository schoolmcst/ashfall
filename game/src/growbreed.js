/* ================================================================== GROW OP BREEDING (1.2.88)
   THE BREEDING TABLE in the Grow Op: put in one seed each of two strains you've harvested before, wait 2 hours
   (real time, like the plants) and you get 2 seeds of their HYBRID. Six hybrids to find, each with its own look,
   grow time and payout (a quarter more XP and DZ than its parents), and its own strain camo on the first harvest.
   Mixing two strains with no hybrid gives a seed of one of the parents back. */
const HYBRIDS = [
  ['og', 'blue', 'ogblue', 'OG BLUEBERRY', '#56b0c8', 'blobs'], ['og', 'sour', 'ogdiesel', 'OG DIESEL', '#9ac840', 'splinter'], ['blue', 'haze', 'bluehaze', 'BLUEBERRY HAZE', '#7a80ff', 'hex'],
  ['sour', 'haze', 'sourhaze', 'SOUR HAZE', '#c090a0', 'fleck'], ['haze', 'north', 'purplelights', 'PURPLE LIGHTS', '#8aa8ff', 'cracked'], ['north', 'cure', 'greenlights', 'GREEN LIGHTS', '#4affb0', 'hex'],
];
const BREED_T = 2 * HOUR;
const hxc = h => parseInt(h.slice(1), 16), mixc = (a, b, k = 0.5) => { const A = new THREE.Color(a), B = new THREE.Color(b); return '#' + A.lerp(B, k).getHexString(); };
for (const [a, b, id, name, col, pat] of HYBRIDS) {
  const A = STRAIN[a], B = STRAIN[b];
  const s = { id, name, h: Math.round((A.h + B.h) / 2), col, leaf: mixc(A.leaf, B.leaf), bud: mixc(A.bud, B.bud), xp: Math.round((A.xp + B.xp) / 2 * 1.25), dz: Math.round((A.dz + B.dz) / 2 * 1.25), desc: `A hybrid of ${A.name} and ${B.name}. Only from the breeding table.`, hy: [a, b] };
  STRAINS.push(s); STRAIN[id] = s;
  const c = hxc(col), it = { id: 'gr_' + id, name: name + ' STRAIN', kind: 'camo', r: 2, grow: id, g: Object.assign({ t: pat, c: [hxc(A.leaf), c, hxc(B.bud), 0x0a140c] }, pat === 'hex' ? { line: c } : {}) };
  COSM.push(it); COS[it.id] = it;
}
const breedOf = (a, b) => HYBRIDS.find(h => (h[0] === a && h[1] === b) || (h[0] === b && h[1] === a));
function breedStart(a, b) {
  const g = growLoad(); if (g.breed || a === b || !g.done[a] || !g.done[b] || (g.seeds[a] | 0) < 1 || (g.seeds[b] | 0) < 1) return false;
  g.seeds[a]--; g.seeds[b]--; g.breed = { a, b, t: Date.now() }; growSave(); try { sfx.ui(); } catch (e) {} return true;
}
function breedLeft() { const g = growLoad(); return g.breed ? Math.max(0, BREED_T - (Date.now() - g.breed.t)) : 0; }
function breedCollect() {
  const g = growLoad(); if (!g.breed || breedLeft() > 0) return null; const { a, b } = g.breed, h = breedOf(a, b); g.breed = null;
  let out; if (h) { g.seeds[h[2]] = (g.seeds[h[2]] | 0) + 2; g.found = g.found || {}; const first = !g.found[h[2]]; g.found[h[2]] = 1; out = { id: h[2], n: 2, first }; }
  else { const k = Math.random() < 0.5 ? a : b; g.seeds[k] = (g.seeds[k] | 0) + 1; out = { id: k, n: 1, none: true }; }
  growSave(); try { showBanner(out.none ? 'NO HYBRID' : (out.first ? 'NEW HYBRID · ' : 'BRED · ') + STRAIN[out.id].name, out.none ? `those two don't cross · 1 ${STRAIN[out.id].name} seed back` : `+2 ${STRAIN[out.id].name} SEEDS · plant them in a pot`); sfx.streak(); } catch (e) {}
  return out;
}
const BRD = { a: null, b: null };
function breedHtml() {
  const g = growLoad(), base = STRAINS.filter(s => g.done[s.id]);
  if (g.breed) { const L = breedLeft(), h = breedOf(g.breed.a, g.breed.b), found = h && g.found && g.found[h[2]];
    return `<div class="br-box"><div class="gr-sh"><b>BREEDING TABLE</b><small>${STRAIN[g.breed.a].name} × ${STRAIN[g.breed.b].name}</small></div><span>${L > 0 ? `${growFmt(L)} LEFT` : 'READY'} · ${found ? STRAIN[h[2]].name : 'an unknown hybrid?'}</span><div class="gr-bar"><s style="width:${((1 - L / BREED_T) * 100).toFixed(1)}%;background:#c070ff"></s></div>${L > 0 ? '' : '<button class="gr-b big" data-brd="get">COLLECT</button>'}</div>`; }
  const pick = (k, cur) => base.map(s => `<button class="gr-b${cur === s.id ? ' on' : ''}" style="--c:${s.col}" data-brd="${k}:${s.id}"${(g.seeds[s.id] | 0) < 1 ? ' disabled' : ''}>${s.name} · ${g.seeds[s.id] | 0}</button>`).join('');
  const h = BRD.a && BRD.b ? breedOf(BRD.a, BRD.b) : null, known = h && g.found && g.found[h[2]];
  return `<div class="br-box"><div class="gr-sh"><b>BREEDING TABLE</b><small>one seed each of two strains you've harvested · ${growFmt(BREED_T)} · ${Object.keys(g.found || {}).length} / ${HYBRIDS.length} hybrids found</small></div>
  ${base.length < 2 ? '<span>harvest two different strains to start breeding</span>' : `<div class="br-row"><small>PARENT 1</small>${pick('a', BRD.a)}</div><div class="br-row"><small>PARENT 2</small>${pick('b', BRD.b)}</div>
  <button class="gr-b big" data-brd="go"${BRD.a && BRD.b && BRD.a !== BRD.b ? '' : ' disabled'}>BREED${BRD.a && BRD.b ? ` · ${known ? STRAIN[h[2]].name : '???'}` : ''}</button>`}</div>`;
}
function breedWire(root) {
  for (const b of root.querySelectorAll('[data-brd]')) b.onclick = () => { const v = b.dataset.brd;
    if (v === 'go') { if (breedStart(BRD.a, BRD.b)) { BRD.a = BRD.b = null; } }
    else if (v === 'get') breedCollect(); else { const [k, id] = v.split(':'); BRD[k] = BRD[k] === id ? null : id; try { sfx.ui(); } catch (e) {} }
    growRender(); };
}
(() => { const old = growRender; growRender = function () { const r = old.apply(this, arguments); try { const st = $('grStrains'); if (st) { let d = $('grBreed'); if (!d) { d = document.createElement('div'); d.id = 'grBreed'; st.parentNode.insertBefore(d, st); } d.innerHTML = breedHtml(); breedWire(d); } } catch (e) {} return r; }; })();
(() => { const s = document.createElement('style'); s.textContent = `#grBreed{margin:10px 0}.br-box{padding:10px 12px;border:1px solid rgba(192,112,255,.4);background:rgba(192,112,255,.05);text-align:left}.br-box>span{font-size:11px;color:var(--dim);display:block;margin:4px 0}.br-row{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:5px 0}.br-row small{width:70px;font-size:9px;letter-spacing:.2em;color:var(--dim)}.gr-b.on{outline:2px solid var(--c,#c070ff)}`; document.head.appendChild(s); })();
