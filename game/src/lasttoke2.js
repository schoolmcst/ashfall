/* ================================================================== LAST TOKE, deeper (1.2.85)
   ARMOR PLATES  - up to 3 plates on (150 extra health, taken first by bullets and blasts, not by the cloud). Carry up to
                   5; crates give 1-2, a supply drop 3. PLATE (4, LB on a controller) puts one on (1 s, no shooting).
                   Bots wear the plates their crates give them too.
   CASH          - $400 a kill, $100 a crate, more for contracts. Spend it at the BUY STATIONS (USE): a plate $500,
                   ammo $250, full health $300, a UAV $1500, a SELF-REVIVE kit $2500 (the next time you'd go out you get
                   back up instead), a SQUAD REDEPLOY $4000 (dead squadmates come back next to you).
   CONTRACTS     - tablets round the island (USE to take one, one at a time): BOUNTY marks an enemy for 90 s - kill them
                   for $1500 and a plate; SCAVENGER marks 3 caches - grab them all for $1000, a plate and an epic gun.
   THE STORM     - once a match, a storm rolls in for 80 s: thick fog, rain, thunder and lightning, and the noise covers
                   footsteps and gunfire (bots hear half as far).
   SUPPLY DROPS  - at the start of the 2nd and 3rd circles a plane drops a red SUPPLY DROP crate inside the circle (marked
                   for everyone): a sniper, LMG or marksman rifle, full health and 3 plates.
   RANKED LAST TOKE ('rbr', online) - your placement and kills move your SR.
   Online: the host's storm and drops travel like the rest of the round (the drop is just another crate in the 'b' pack;
   the storm in the host's presence as wx). Plates, cash and contracts are each player's own. */
const LT = { plates: 0, cash: 0, kills: 0, plateT: 0, plateH: false, buyOpen: false, selfRev: false, contract: null, tablets: [], stations: [], storm: null, stormDone: false, rain: null, flashT: 0, uH: false };
const LT_BUY = [
  { k: 'plate', n: 'ARMOR PLATE', c: 500, d: '+1 plate (carry up to 5)' },
  { k: 'ammo', n: 'AMMO', c: 250, d: 'full ammo and 2 grenades' },
  { k: 'heal', n: 'FULL HEALTH', c: 300, d: 'back to full health' },
  { k: 'uav', n: 'UAV', c: 1500, d: 'enemies on your minimap for 25 s' },
  { k: 'self', n: 'SELF-REVIVE KIT', c: 2500, d: 'the next time you would go out, you get back up' },
  { k: 'squad', n: 'SQUAD REDEPLOY', c: 4000, d: 'dead squadmates come back next to you (squads)' },
  { k: 'drop', n: 'LOADOUT DROP', c: 4000, d: 'a crate falls with the class you picked in the LAST TOKE lobby' },
];
const ltOn = () => !!(M && M.br && M.mode === 'br');
function ltSeed(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; }; }
/* ---------- setup (from brSetup) */
function ltSetup() {
  LT.plates = 1; LT.cash = 0; LT.kills = G.kills | 0; LT.plateT = 0; LT.selfRev = false; LT.contract = null; LT.storm = null; LT.stormDone = false; LT.flashT = 0; G.armor = 0; ltCloseBuy();
  for (const o of LT.stations.concat(LT.tablets)) if (o.g && o.g.parent) o.g.parent.remove(o.g); LT.stations = []; LT.tablets = [];
  const B = M.br, rand = ltSeed(curMap + ':lt'), pr = PLAYRECT;
  const spots = curMap === 'stashisle' ? [[0, -60], [-110, 0], [110, -60], [0, 110], [-60, 0], [60, 0]] : [0, 1].map(() => [pr[0] + 8 + rand() * (pr[1] - pr[0] - 16), pr[2] + 8 + rand() * (pr[3] - pr[2] - 16)]);
  for (const [x, z] of spots) { const o = openNear(x, z); LT.stations.push({ x: o.x, z: o.z, g: ltKiosk(o.x, o.z, 'BUY', '#5dff7a') }); }
  const n = curMap === 'stashisle' ? 12 : 3;
  for (let i = 0, t = 0; i < n && t < 60; t++) { const o = openNear(pr[0] + 6 + rand() * (pr[1] - pr[0] - 12), pr[2] + 6 + rand() * (pr[3] - pr[2] - 12)); if (LT.tablets.some(q => Math.hypot(q.x - o.x, q.z - o.z) < 15) || (typeof duelIn === 'function' && duelIn(o.x, o.z, 2))) continue; LT.tablets.push({ x: o.x, z: o.z, used: false, g: ltKiosk(o.x, o.z, 'JOB', '#ffb03a', true) }); i++; }
  B.stormAt = 150 + rand() * 120;
}
function ltKiosk(x, z, label, col, small) {
  const g = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(small ? 0.5 : 0.9, small ? 1.0 : 1.7, small ? 0.4 : 0.6), new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.5, metalness: 0.5 }));
  body.position.y = small ? 0.5 : 0.85; g.add(body);
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const x2 = c.getContext('2d'); x2.fillStyle = '#05080a'; x2.fillRect(0, 0, 128, 64); x2.fillStyle = col; x2.font = 'bold 34px sans-serif'; x2.textAlign = 'center'; x2.fillText(label, 64, 44);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
  const s = new THREE.Mesh(new THREE.PlaneGeometry(small ? 0.46 : 0.8, small ? 0.23 : 0.4), new THREE.MeshBasicMaterial({ map: t }));
  s.position.set(0, small ? 0.85 : 1.45, (small ? 0.2 : 0.3) + 0.01); g.add(s); const s2 = s.clone(); s2.rotation.y = Math.PI; s2.position.z = -s.position.z; g.add(s2);
  const lt = new THREE.Mesh(new THREE.BoxGeometry(small ? 0.52 : 0.92, 0.04, small ? 0.42 : 0.62), new THREE.MeshBasicMaterial({ color: col })); lt.position.y = small ? 1.02 : 1.72; g.add(lt);
  g.position.set(x, groundAt(x, z, 1), z); (M.br.group || scene).add(g); return g;
}
/* ---------- every frame (from brUpdate) */
function ltTick(dt) {
  if (!ltOn()) return;
  const B = M.br, alive = playerAlive();
  // cash for kills
  if (G.kills > LT.kills) { LT.cash += 400 * (G.kills - LT.kills); LT.kills = G.kills; }
  // plating
  const pk = kb('plate') || (pad.on && pad.plate);
  if (pk && !LT.plateH && alive && LT.plates > 0 && G.armor < 150 && LT.plateT <= 0) { LT.plateT = 1.0; try { sfx.reload && sfx.reload(); } catch (e) {} }
  LT.plateH = pk;
  if (LT.plateT > 0) { LT.plateT -= dt; if (LT.plateT <= 0 && alive) { LT.plates--; G.armor = Math.min(150, (G.armor | 0) + 50); try { achAdd('plates'); } catch (e) {} try { sfx.pickup(); } catch (e) {} } }
  // buy stations and tablets: USE
  const u = kb('use') || pad.use, press = u && !LT.uH; LT.uH = u;
  if (alive && !LT.buyOpen) {
    const st = LT.stations.find(s => Math.hypot(P.x - s.x, P.z - s.z) < 1.8);
    if (st) { G.interactTxt = `BUY STATION · $${LT.cash} · PRESS ${actName('use')}`; try { showMsg(G.interactTxt); } catch (e) {} if (press) ltOpenBuy(); }
    const tb = !LT.contract && LT.tablets.find(s => !s.used && Math.hypot(P.x - s.x, P.z - s.z) < 1.6);
    if (tb) { G.interactTxt = `CONTRACT · PRESS ${actName('use')} TO TAKE IT`; try { showMsg(G.interactTxt); } catch (e) {} if (press) ltTakeContract(tb); }
  }
  if (LT.buyOpen && (!alive || G.state !== 'playing')) ltCloseBuy();
  ltContractTick(dt);
  // the storm
  const host = !M.online || netHostNow();
  if (host && !LT.storm && !LT.stormDone && M.t > (B.stormAt || 9e9)) ltStorm(true);
  if (LT.storm) { LT.storm.t -= dt; if (LT.storm.t <= 0 && host) ltStorm(false); ltStormFx(dt); }
  // supply drops land
  for (const c of B.crates) if (c.fall > 0) { c.fall = Math.max(0, c.fall - dt * 6); c.g.position.y = (c.y || 0) + c.fall; if (c.chute) { c.chute.visible = c.fall > 0.2; c.chute.position.y = 2.2; } if (c.fall === 0) try { sfx.thud(Object.assign({ vol: 1 }, at(c.x, c.z, 30))); } catch (e) {} }
  if (B.plane) { B.plane.t += dt; const P0 = B.plane; P0.m.position.set(P0.x0 + P0.dx * P0.t * 28, 60, P0.z0 + P0.dz * P0.t * 28); if (P0.t > 8) { B.group.remove(P0.m); B.plane = null; } }
  // the HUD
  const el = $('ltHud'); if (el) { const txt = `$${LT.cash} · PLATES ${LT.plates} · ARMOR ${Math.round(G.armor || 0)}${LT.plateT > 0 ? ' · PLATING…' : ''}${LT.selfRev ? ' · SELF-REVIVE' : ''}${LT.contract ? ' · ' + ltContractTxt() : ''}${typeof brlHud === 'function' ? brlHud() : ''}`; if (el._t !== txt) { el._t = txt; el.innerHTML = txt; } el.style.display = alive || LT.contract ? 'block' : 'none'; }
}
const ltPlating = () => LT.plateT > 0;
/* ---------- armour: the damage plates take first */
function ltArmorTake(dmg) { if (!ltOn() || !(G.armor > 0)) return dmg; const a = Math.min(G.armor, dmg); G.armor -= a; if (a > 0) try { sfx.impact && sfx.impact({ vol: 0.5 }, true); } catch (e) {} return dmg - a; }
function ltBotArmor(e, dmg, by) { if (!ltOn() || !(e.armor > 0) || by === 'cloud') return dmg; const a = Math.min(e.armor, dmg); e.armor -= a; return dmg - a; }
// a crate opened: plates and cash (brOpen calls this)
function ltCrate(c, who) {
  if (who === 'player') { LT.cash += 100; const n = c.tier >= 3 ? 3 : 1 + (Math.random() < 0.4 ? 1 : 0); LT.plates = Math.min(5, LT.plates + n); if (c.tier >= 3) { G.armor = 150; try { achAdd('drops'); } catch (e) {} } }
  else if (who && who.group) who.armor = Math.min(150, (who.armor | 0) + 50 * Math.min(3, c.tier + 1));
}
/* ---------- the buy station */
function ltOpenBuy() {
  if (LT.buyOpen) return; LT.buyOpen = true; G.menuOpen = true;   // freeing the mouse doesn't pause the game
  const o = document.createElement('div'); o.className = 'onb-ov lt-buy'; o.id = 'ltBuy';
  const render = () => { o.innerHTML = `<div class="onb-box"><small>BUY STATION · YOU HAVE <b style="display:inline;font-size:inherit;letter-spacing:inherit;color:#7aff8a">$${LT.cash}</b></small><b>BUY</b><div class="onb-tiles">${LT_BUY.map((b, i) => `<button class="onb-t${LT.cash < b.c || (b.k === 'squad' && !(M.squad > 1)) ? ' off' : ''}" data-lb="${i}"><b>${i + 1} · ${b.n} · $${b.c}</b><span>${b.d}</span></button>`).join('')}</div><div class="onb-acts"><button class="btn" data-lb="x">CLOSE (ESC)</button></div></div>`;
    for (const b of o.querySelectorAll('[data-lb]')) b.onclick = () => { if (b.dataset.lb === 'x') return ltCloseBuy(); ltBuy(+b.dataset.lb); render(); }; };
  render(); document.body.appendChild(o);
  try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  LT.key = e => { if (!LT.buyOpen) return; if (e.code === 'Escape' || e.code === bind('use')) { e.preventDefault(); e.stopPropagation(); ltCloseBuy(); return; } const n = +e.key; if (n >= 1 && n <= LT_BUY.length) { e.preventDefault(); e.stopPropagation(); ltBuy(n - 1); render(); } };
  addEventListener('keydown', LT.key, true);
}
function ltCloseBuy() { LT.buyOpen = false; G.menuOpen = false; const o = $('ltBuy'); if (o) o.remove(); if (LT.key) removeEventListener('keydown', LT.key, true); LT.key = null; try { if (G.state === 'playing' && typeof lockPointer === 'function') lockPointer(); } catch (e) {} }
function ltBuy(i) {
  const b = LT_BUY[i]; if (!b || LT.cash < b.c || !playerAlive()) return false;
  if (b.k === 'squad' && !(M.squad > 1)) return false;
  if (b.k === 'plate' && LT.plates >= 5) return false;
  LT.cash -= b.c;
  if (b.k === 'plate') LT.plates++;
  if (b.k === 'ammo') { for (const w of WEAPONS) if (w.def) { w.ammo = w.mag || w.ammo; w.reserve = (w.mag || 30) * 4; } G.grenades = Math.max(G.grenades | 0, 2); }
  if (b.k === 'heal') G.health = G.maxHp || 100;
  if (b.k === 'uav') { STK.uavT = Math.max(STK.uavT, 25); }
  if (b.k === 'self') LT.selfRev = true;
  if (b.k === 'squad') ltRedeploy();
  if (b.k === 'drop') { try { brpDropBuy(); } catch (e) { reportError(e); } }
  try { sfx.pickup(); showMsg(b.n + ' BOUGHT'); } catch (e) {}
  return true;
}
// squad redeploy: dead squadmate bots come back next to me
function ltRedeploy() {
  let n = 0;
  for (const en of M.entries) if (!en.isPlayer && en.team === M.myTeam && en.alive === false) { const o = openNear(P.x + rnd(-3, 3), P.z + rnd(-3, 3)); try { const e = spawnBot(en, { x: o.x, z: o.z, y: 0 }); if (e) { e.brTier = -1; botGunProfile(e, 'sidearm'); } n++; } catch (er) {} }
  try { showBanner('SQUAD REDEPLOYED', n ? `${n} squadmate${n > 1 ? 's' : ''} back in` : 'nobody to bring back'); } catch (e) {}
}
// self-revive: from hurtPlayer, after the squads and duel checks
function ltSelfRevive() { if (!ltOn() || !LT.selfRev || brWarmNow()) return false; LT.selfRev = false; G.health = 50; G.spawnProt = 1.5; try { showBanner('SELF-REVIVE', 'back on your feet'); sfx.streak(); } catch (e) {} return true; }
/* ---------- contracts */
function ltTakeContract(tb) {
  tb.used = true; tb.g.visible = false;
  const foes = enemies.filter(e => e.entry && e.entry.alive !== false && !isFriend(e) && !e.duel);
  if (Math.random() < 0.5 && foes.length) { const t = foes[(Math.random() * foes.length) | 0]; LT.contract = { k: 'bounty', e: t, en: t.entry, t: 90 }; try { showBanner('BOUNTY', `${t.entry.name} is marked for 90 s · $1500`); } catch (e) {} }
  else { const caches = []; for (let i = 0; i < 3; i++) { const a = Math.random() * TAU, d = 18 + Math.random() * 18, o = openNear(tb.x + Math.cos(a) * d, tb.z + Math.sin(a) * d); const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.45), new THREE.MeshStandardMaterial({ color: 0x2a3a1a, emissive: 0x3aff6a, emissiveIntensity: 0.4 })); m.position.set(o.x, groundAt(o.x, o.z, 1) + 0.18, o.z); M.br.group.add(m); caches.push({ x: o.x, z: o.z, m, got: false }); }
    LT.contract = { k: 'scav', caches, t: 150 }; try { showBanner('SCAVENGER', 'grab the 3 marked caches · $1000 + an epic gun'); } catch (e) {} }
  try { sfx.ui(); } catch (e) {}
}
function ltContractTick(dt) {
  const C = LT.contract; if (!C) return; C.t -= dt;
  if (C.k === 'bounty') {
    const gone = !enemies.includes(C.e) || C.en.alive === false;
    if (gone) { const mine = C.en.lastBy === 'player'; LT.contract = null; if (mine) { try { achAdd('contracts'); } catch (e) {} LT.cash += 1500; LT.plates = Math.min(5, LT.plates + 1); try { showBanner('BOUNTY DONE', '+$1500 · +1 plate'); sfx.streak(); } catch (e) {} } else try { showMsg('BOUNTY FAILED · SOMEONE ELSE GOT THEM'); } catch (e) {} return; }
  } else if (C.k === 'scav') {
    for (const c of C.caches) if (!c.got && playerAlive() && Math.hypot(P.x - c.x, P.z - c.z) < 1.5) { c.got = true; if (c.m.parent) c.m.parent.remove(c.m); try { sfx.pickup(); showMsg(`CACHE ${C.caches.filter(q => q.got).length} / 3`); } catch (e) {} }
    if (C.caches.every(c => c.got)) { try { achAdd('contracts'); } catch (e) {} LT.contract = null; LT.cash += 1000; LT.plates = Math.min(5, LT.plates + 1); try { const d = brGun(2); equipClass({ p: d.id, s: 'sidearm', e: 'frag', k: 'none', factory: true }); showBanner('SCAVENGER DONE', `+$1000 · +1 plate · ${d.name}`); sfx.streak(); } catch (e) {} return; }
  }
  if (C.t <= 0) { if (C.caches) for (const c of C.caches) if (c.m.parent) c.m.parent.remove(c.m); LT.contract = null; try { showMsg('CONTRACT RAN OUT'); } catch (e) {} }
}
function ltContractTxt() { const C = LT.contract; if (!C) return ''; return C.k === 'bounty' ? `BOUNTY ${Math.ceil(C.t)} s` : `CACHES ${C.caches.filter(c => c.got).length}/3 · ${Math.ceil(C.t)} s`; }
// markers: stations, unused tablets, the contract (from brMarkers)
function ltMarkers(out) {
  if (!ltOn()) return;
  for (const s of LT.stations) if (Math.hypot(s.x - P.x, s.z - P.z) < 40) out.push({ x: s.x, y: 2.2, z: s.z, t: 'BUY', c: '#5dff7a' });
  const C = LT.contract;
  if (C && C.k === 'bounty' && enemies.includes(C.e)) out.push({ x: C.e.group.position.x, y: C.e.group.position.y + 2.4, z: C.e.group.position.z, t: 'BOUNTY', c: '#ff4a3a' });
  if (C && C.k === 'scav') for (const c of C.caches) if (!c.got) out.push({ x: c.x, y: 1.2, z: c.z, t: 'CACHE', c: '#3aff6a' });
  for (const c of M.br.crates) if (!c.open && c.tier >= 3) out.push({ x: c.x, y: (c.g.position.y || 0) + 1.6, z: c.z, t: 'SUPPLY DROP', c: '#ff4a3a' });
}
/* ---------- the storm */
function ltStorm(on) {
  if (on && !LT.storm) {
    LT.storm = { t: 80, fog0: scene.fog ? scene.fog.density : 0, next: 3 }; LT.stormDone = true;
    try { showBanner('A STORM IS ROLLING IN', 'fog, rain and thunder for 80 s · it covers your footsteps'); } catch (e) {}
    if (!LT.rain) { const n = 900, pos = new Float32Array(n * 6); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); LT.rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x9ab0c8, transparent: true, opacity: 0.35, fog: false })); LT.rain.frustumCulled = false; LT.rain.userData.seed = Array.from({ length: n }, () => [Math.random() * 40 - 20, Math.random() * 20, Math.random() * 40 - 20]); }
    scene.add(LT.rain);
  } else if (!on && LT.storm) {
    if (scene.fog) scene.fog.density = LT.storm.fog0; if (LT.rain && LT.rain.parent) LT.rain.parent.remove(LT.rain); LT.storm = null;
    try { showMsg('THE STORM HAS PASSED'); } catch (e) {}
  }
}
function ltStormFx(dt) {
  const S0 = LT.storm; if (!S0) return;
  if (scene.fog) scene.fog.density = lerp(scene.fog.density, Math.max(S0.fog0 * 7, 0.034), Math.min(1, dt));
  if (LT.rain) { const p = LT.rain.geometry.attributes.position.array, sd = LT.rain.userData.seed, cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
    for (let i = 0; i < sd.length; i++) { const s = sd[i]; s[1] -= dt * 22; if (s[1] < -4) s[1] += 24; const x = cx + s[0], y = cy + s[1], z = cz + s[2]; p[i * 6] = x; p[i * 6 + 1] = y; p[i * 6 + 2] = z; p[i * 6 + 3] = x + 0.05; p[i * 6 + 4] = y - 0.6; p[i * 6 + 5] = z; }
    LT.rain.geometry.attributes.position.needsUpdate = true; }
  S0.next -= dt;
  if (S0.next <= 0) { S0.next = 6 + Math.random() * 8; LT.flashT = 0.25; try { sfx.explode({ vol: 0.35, pan: Math.random() * 2 - 1, delay: 0.6 + Math.random() }); } catch (e) {} }
  if (LT.flashT > 0) { LT.flashT -= dt; const k = LT.flashT > 0.15 || (LT.flashT > 0.05 && LT.flashT < 0.1) ? 1 : 0; if (typeof hemi !== 'undefined' && hemi) { hemi.userData.base = hemi.userData.base || hemi.intensity; hemi.intensity = hemi.userData.base * (1 + k * 2.5); } }
  else if (typeof hemi !== 'undefined' && hemi && hemi.userData.base) hemi.intensity = hemi.userData.base;
}
const ltHearK = () => (LT.storm ? 0.5 : 1);
function ltWx() { return LT.storm ? 1 : LT.stormDone ? 2 : 0; }
function ltWxApply(v) { if (v === 1 && !LT.storm) ltStorm(true); if (v !== 1 && LT.storm) ltStorm(false); if (v === 2) LT.stormDone = true; }
/* ---------- supply drops (the host, at the start of the 2nd and 3rd circles) */
function ltDrop() {
  const B = M.br, t = B.to || { x: B.cx, z: B.cz, r: B.r * 0.6 }, a = Math.random() * TAU, d = Math.random() * t.r * 0.6, o = openNear(t.x + Math.cos(a) * d, t.z + Math.sin(a) * d);
  const c = brCrate(o.x, o.z, 3, TERR.on ? TH(o.x, o.z) : 0); c.id = B.crates.length; B.crates.push(c); ltDropFx(c);
  const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 6), new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.6 })), dx = Math.sign(o.x) || 1;
  B.plane = { m, t: 0, x0: o.x - dx * 110, z0: o.z, dx, dz: 0 }; m.rotation.y = Math.PI / 2; B.group.add(m);
  try { showBanner('SUPPLY DROP', 'a red crate is coming down inside the circle'); } catch (e) {}
}
function ltDropFx(c) { c.fall = 45; c.g.position.y = (c.y || 0) + 45; const ch = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 6, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xff4a3a, side: THREE.DoubleSide, roughness: 0.8 })); ch.position.y = 2.2; c.g.add(ch); c.chute = ch; }
function ltClear() { ltCloseBuy(); if (LT.storm) ltStorm(false); LT.contract = null; G.armor = 0; }
(() => {
  BR_TIERS.push({ n: 'SUPPLY DROP', col: 0xff4a3a, cats: ['sr', 'lmg', 'mr'] });
  const d = document.createElement('div'); d.id = 'ltHud'; ($('hud') || document.body).appendChild(d);
  const s = document.createElement('style'); s.textContent = '#ltHud{position:absolute;left:28px;bottom:122px;font-size:11px;letter-spacing:.14em;color:#d8f0d0;text-shadow:0 0 4px #000;pointer-events:none;display:none}.lt-buy .onb-t.off{opacity:.4}'; document.head.appendChild(s);
})();
