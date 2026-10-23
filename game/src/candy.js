/* ================================================================== MUNCHIE CANDY and the upgrade camos (zombies)
   MUNCHIE CANDY: pick a pack of 4 candies in the zombies lobby (10 to choose from). Each round one of them is in your
   pocket (shown by your perks); press the SCORESTREAK key (X / D-pad up) to eat it. One candy a round, used or not.
   UPGRADE CAMOS: a gun from the upgrader wears an animated camo that belongs to the map: NIGHTSHADE (purple veins,
   the hospital), HELLFIRE (molten cracks, THE WORKS) and JET STREAM (blue streaks, TERMINAL 9). */
const CANDY = [
  { id: 'sour', name: 'SOUR BLAST', col: '#b6ff3a', d: 'Every zombie within 8 m drops.' },
  { id: 'angel', name: 'GUMMY ANGEL', col: '#ffb3e6', d: 'The next time you go down, you get straight back up.' },
  { id: 'rock', name: 'ROCK CANDY', col: '#9ad8ff', d: 'Take half damage for 60 seconds.' },
  { id: 'fizz', name: 'FIZZY WHIZZ', col: '#ffe14a', d: 'Move 25% faster for 60 seconds.' },
  { id: 'rush', name: 'SUGAR RUSH', col: '#ff7a5a', d: 'Double points for 30 seconds.' },
  { id: 'rope', name: 'REFILL ROPE', col: '#ff4a4a', d: 'Full ammo for every gun you carry.' },
  { id: 'jack', name: 'JACKPOT WRAPPER', col: '#ffd23a', d: '+1,500 points, right now.' },
  { id: 'lolly', name: 'LUCKY LOLLY', col: '#c27aff', d: 'Your next mystery crate is free.' },
  { id: 'mint', name: 'MINT CONDITION', col: '#7affd0', d: 'Every window boarded up again, +300.' },
  { id: 'cloud', name: 'COTTON CLOUD', col: '#e8eaff', d: 'Zombies lose track of you for 12 seconds.' },
];
const CANDYD = Object.fromEntries(CANDY.map(c => [c.id, c]));
const MC = { pack: ['sour', 'angel', 'rock', 'rush'], pocket: null, round: -1, used: -1, rock: 0, fizz: 0, cloud: 0, angel: false, freeBox: false, pick: false };
try { const a = JSON.parse(localStorage.getItem('ashfall.candy') || 'null'); if (Array.isArray(a) && a.length === 4 && a.every(k => CANDYD[k])) MC.pack = a; } catch (e) {}
const mcSave = () => { try { localStorage.setItem('ashfall.candy', JSON.stringify(MC.pack)); } catch (e) {} };
function mcReset() { MC.pocket = null; MC.round = -1; MC.used = -1; MC.rock = MC.fizz = MC.cloud = 0; MC.angel = false; MC.freeBox = false; mcHud(true); }
// a new round: a candy from your pack goes in your pocket
function mcRound(r) {
  if (MC.round === r) return; MC.round = r;
  MC.pocket = MC.pack[(Math.random() * MC.pack.length) | 0]; mcHud(true);
}
function mcEat() {
  if (typeof M === 'undefined' || !M || M.mode !== 'zomb' || G.state !== 'playing' || !MC.pocket) return false;
  const c = CANDYD[MC.pocket]; MC.pocket = null; MC.used = MC.round;
  try { tone(1200, 0.08, 0.06, 'triangle'); tone(1600, 0.12, 0.05, 'triangle', undefined, { delay: 0.08 }); burst(0.2, 3000, 0.15, 'highpass'); } catch (e) {}
  showBanner(c.name, c.d);
  if (c.id === 'sour') { for (const e of enemies.slice()) if (e.zombie && !e.boss && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 8) { e.hp = 1; damageEnemy(e, 1e6, false, null, false, 'player'); } for (let i = 0; i < 14; i++) puff(P.x + rnd(-4, 4), P.y + rnd(0.3, 1.5), P.z + rnd(-4, 4), { color: 0xb6ff3a, size: 0.8, grow: 2, life: 1.2, op: 0.5 }); }
  if (c.id === 'angel') MC.angel = true;
  if (c.id === 'rock') MC.rock = NOW + 60;
  if (c.id === 'fizz') MC.fizz = NOW + 60;
  if (c.id === 'rush') { ZPU.fx.dbl = Math.max(ZPU.fx.dbl || 0, NOW) + 30; zpuHud(true); }
  if (c.id === 'rope') { for (const w of WEAPONS) if (w) { w.ammo = w.magSize; w.reserve = w.reserveMax; } }
  if (c.id === 'jack') { G.points += 1500; popScore('+1500', 'big', 'JACKPOT'); }
  if (c.id === 'lolly') MC.freeBox = true;
  if (c.id === 'mint') { try { zwFixAll(); } catch (e) {} G.points += 300; }
  if (c.id === 'cloud') MC.cloud = NOW + 12;
  mcHud(true); return true;
}
// going down with a GUMMY ANGEL in you
function mcRevive() { if (!MC.angel) return false; MC.angel = false; G.health = G.maxHp; G.spawnProt = 3; showBanner('GUMMY ANGEL', 'back on your feet'); for (const e of enemies) if (e.zombie && Math.hypot(e.group.position.x - P.x, e.group.position.z - P.z) < 6) { e.stunT = 2; e.atkT = 0; } return true; }
const mcRock = () => MC.rock > NOW, mcFizz = () => MC.fizz > NOW, mcCloud = () => MC.cloud > NOW;
function mcHud(force) {
  let h = $('mcHud');
  const on = typeof M !== 'undefined' && M && M.mode === 'zomb' && (G.state === 'playing' || G.state === 'paused');
  if (!h) { if (!on) return; h = document.createElement('div'); h.id = 'mcHud'; ($('hud') || document.body).appendChild(h); }
  if (h._on !== on) { h._on = on; h.style.display = on ? '' : 'none'; }
  if (!on) return;
  const timers = [['ROCK', MC.rock], ['FIZZ', MC.fizz], ['CLOUD', MC.cloud]].filter(t => t[1] > NOW).map(t => `${t[0]} ${Math.ceil(t[1] - NOW)}`).concat(MC.angel ? ['ANGEL'] : []).concat(MC.freeBox ? ['FREE CRATE'] : []);
  const key = (MC.pocket || '') + '|' + timers.join(); if (!force && h._k === key) return; h._k = key;
  const c = MC.pocket && CANDYD[MC.pocket];
  h.innerHTML = c ? `<div class="mc-c" style="--cc:${c.col}"><i></i><b>${c.name}</b><small>${actName('streak')} TO EAT</small></div>` : '<div class="mc-c none"><b>NO CANDY</b><small>NEXT ROUND</small></div>';
  if (timers.length) h.innerHTML += `<div class="mc-t">${timers.join(' · ')}</div>`;
}
function mcTick() { if (typeof M !== 'undefined' && M && M.mode === 'zomb') { if (typeof Z !== 'undefined' && Z.round > 0) mcRound(Z.round); mcHud(false); } else mcHud(false); }
// the lobby row and the picker
function mcRow() {
  return `<div class="cod-row"><small>MUNCHIE CANDY · YOUR PACK OF 4</small><b>${MC.pack.map(k => `<span style="color:${CANDYD[k].col}">${CANDYD[k].name}</span>`).join(' · ')}</b><span>one candy in your pocket each round · ${actName('streak')} to eat it</span><div class="arw"><button class="mini" data-act="z-candy" aria-label="Change your candy pack">EDIT</button></div></div>`;
}
function mcPicker() {
  const ov = document.createElement('div'); ov.className = 'pr-ov'; ov.id = 'mcPick';
  const draw = () => {
    ov.innerHTML = `<div class="pr-box mc-box"><small>MUNCHIE CANDY</small><b>PICK 4 FOR YOUR PACK</b><div class="mc-grid">` + CANDY.map(c => `<button class="mc-o${MC.pack.includes(c.id) ? ' on' : ''}" data-mc="${c.id}" style="--cc:${c.col}"><i></i><b>${c.name}</b><span>${c.d}</span></button>`).join('') + `</div><div class="pr-acts"><button class="btn primary" data-mcdone="1">DONE · ${MC.pack.length}/4</button></div></div>`;
    for (const b of ov.querySelectorAll('[data-mc]')) b.onclick = () => { const id = b.dataset.mc, i = MC.pack.indexOf(id); if (i >= 0) MC.pack.splice(i, 1); else { if (MC.pack.length >= 4) MC.pack.shift(); MC.pack.push(id); } try { sfx.ui(); } catch (e) {} draw(); };
    ov.querySelector('[data-mcdone]').onclick = () => { while (MC.pack.length < 4) { const f = CANDY.find(c => !MC.pack.includes(c.id)); MC.pack.push(f.id); } mcSave(); ov.remove(); try { renderZLobby(); } catch (e) {} };
  };
  draw(); document.body.appendChild(ov);
}

/* ---------- upgrade camos */
const ZU_CAMO = { blackwell: ['NIGHTSHADE', 0x9a4aff, 'veins'], works: ['HELLFIRE', 0xff6a14, 'cracks'], terminal9: ['JET STREAM', 0x3ab8ff, 'streaks'], mauiwowie: ['TROPIC THUNDER', 0xff3ab0, 'veins'] };
const ZUC = { tex: {} };
function zuCamoTex(map) {
  if (ZUC.tex[map]) return ZUC.tex[map];
  const [, col, kind] = ZU_CAMO[map] || ZU_CAMO.blackwell, c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), R = makeRng(strHash('zuc' + map));
  const hex = '#' + col.toString(16).padStart(6, '0');
  g.fillStyle = kind === 'streaks' ? '#0a1420' : kind === 'cracks' ? '#140805' : '#0c0614'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = hex; g.shadowColor = hex; g.shadowBlur = 8; g.lineCap = 'round';
  if (kind === 'streaks') { for (let i = 0; i < 26; i++) { const y = R() * 256, x = R() * 256, l = 30 + R() * 90; g.lineWidth = 1 + R() * 3; g.globalAlpha = 0.5 + R() * 0.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + l * 0.15); g.stroke(); } }
  else for (let i = 0; i < (kind === 'cracks' ? 16 : 22); i++) {   // branching lines
    let x = R() * 256, y = R() * 256, a = R() * TAU; g.lineWidth = kind === 'cracks' ? 2.5 : 1.6; g.globalAlpha = 0.7 + R() * 0.3; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 9; k++) { a += (R() - 0.5) * 1.4; x += Math.cos(a) * 14; y += Math.sin(a) * 14; g.lineTo(x, y); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.repeat.set(2, 2);
  return (ZUC.tex[map] = t);
}
function zuCamoMat(mt) {
  const map = ZU_CAMO[curMap] ? curMap : 'blackwell', col = ZU_CAMO[map][1], tex = zuCamoTex(map), c = mt.clone();
  if (c.isMeshStandardMaterial || c.isMeshPhysicalMaterial) { c.map = tex; c.color = new THREE.Color(0xffffff); c.emissive = new THREE.Color(col); c.emissiveMap = tex; c.emissiveIntensity = 1.1; c.metalness = 0.55; c.roughness = 0.35; c.needsUpdate = true; }
  else if (c.color) c.color.set(col);
  return c;
}
function zuCamoTick(dt) { for (const k in ZUC.tex) { const t = ZUC.tex[k]; t.offset.x += dt * (k === 'terminal9' ? 0.12 : 0.03); t.offset.y += dt * (k === 'works' ? 0.05 : 0.02); } }
(() => { const s = document.createElement('style'); s.textContent = `#mcHud{position:absolute;right:28px;bottom:150px;display:flex;flex-direction:column;align-items:flex-end;gap:4px;pointer-events:none}
.mc-c{display:flex;flex-direction:column;align-items:flex-end;padding:6px 10px 6px 34px;position:relative;background:rgba(0,0,0,.5);border:1px solid var(--cc,#555)}.mc-c i{position:absolute;left:8px;top:50%;width:18px;height:12px;margin-top:-6px;background:var(--cc);border-radius:3px;box-shadow:0 0 8px var(--cc)}.mc-c i::before,.mc-c i::after{content:"";position:absolute;top:2px;width:6px;height:8px;background:var(--cc);clip-path:polygon(0 50%,100% 0,100% 100%)}.mc-c i::before{left:-5px}.mc-c i::after{right:-5px;transform:scaleX(-1)}
.mc-c b{font-size:12px;letter-spacing:.16em;color:#fff}.mc-c small{font-size:9px;letter-spacing:.2em;color:var(--cc)}.mc-c.none{opacity:.5;padding-left:10px}.mc-c.none small{color:#aaa}.mc-t{font-size:10px;letter-spacing:.16em;color:#fff;text-shadow:0 0 4px #000}
.mc-box{width:min(760px,94vw)}.mc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:12px 0 16px;text-align:left}
.mc-o{position:relative;pointer-events:auto;cursor:pointer;font-family:inherit;color:#fff;background:rgba(255,255,255,.03);border:1px solid var(--line);padding:10px 10px 10px 40px;text-align:left}.mc-o i{position:absolute;left:12px;top:14px;width:18px;height:12px;background:var(--cc);border-radius:3px}.mc-o b{display:block;letter-spacing:.16em;font-size:13px}.mc-o span{font-size:11px;color:var(--dim)}.mc-o.on{border-color:var(--cc);background:color-mix(in srgb,var(--cc) 14%,transparent)}.mc-o:hover,.mc-o:focus{outline:0;border-color:var(--accent)}`; document.head.appendChild(s); })();
