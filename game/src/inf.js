/* ================================================================== CONTACT HIGH (infected)
   Everyone starts as a SURVIVOR (team 0) with their own class. After a few seconds one player turns: the INFECTED
   (team 1) have no guns, run faster and kill with one hit up close; anyone they kill joins them. The infected win
   when nobody is left to infect; the survivors win if anyone is still standing when time runs out.
   Offline: one match, the first infected is a bot. Online the host picks the first infected (a real player or a bot)
   and sends ['i', state, first, survivors, infected, seconds left, round]; everyone turns themselves when they die. */
const INF = { grace: 8, roundT: 300 };
function infSetup() {
  if (M.mode !== 'inf') { M.inf = null; if (M.infMe || $('infVig')) infMe(false); return; }
  if (M.cfg.time) { M.cfg.infLen = M.cfg.time * 60; M.cfg.time = 0; }   // the round clock is ours (the generic time limit would pick the winner by headcount)
  M.inf = { state: 'grace', t: INF.grace, left: M.cfg.infLen || INF.roundT, first: '', round: (M.inf && M.inf.round || 0) + 1, end: '' };
  M.myTeam = 0; if (M.me) M.me.team = 0; infMe(false);
  for (const en of M.entries) if (!en.isPlayer && (!M.online || en.botLabel)) { en.team = 0; if (en.bot) { en.bot.team = 0; en.bot.infHp = false; infDress(en.bot); } }
  M.teamScore = [0, 0]; M.cfg.score = M.online ? 1 : 999;
  infMarkers();
}
// the player's own state: infected = no gun, faster, a green edge on the screen
function infMe(on) {
  M.infMe = !!on;
  try { if (viewmodel) viewmodel.visible = !on; } catch (e) {}
  let v = $('infVig'); if (!v) { v = document.createElement('div'); v.id = 'infVig'; document.body.appendChild(v); }
  v.style.opacity = on ? 1 : 0;
}
function infDress(e) {
  if (!e || !e.rig) return;
  const inf = e.team === 1; e.inf = inf;
  if (e.rig.gun) e.rig.gun.visible = !inf;
  if (inf) { e.speed = Math.max(e.speed, 6.2); e.hold = 0; e.acc = 0; if (!e.infHp && !e.net) { e.infHp = true; e.maxHp = (M.maxHp || 100) * 1.5; e.hp = e.maxHp; } }
  infTint(e, inf);
  let a = e.group.getObjectByName('infAura');
  if (inf && !a) { a = new THREE.Sprite(new THREE.SpriteMaterial({ map: infAuraTex(), color: 0x7aff4a, transparent: true, depthWrite: false, opacity: 0.55, blending: THREE.AdditiveBlending })); a.name = 'infAura'; a.scale.set(1.6, 2.4, 1); a.position.y = 1.1; e.group.add(a); }
  if (a) a.visible = inf;
}
function infAuraTex() { if (infAuraTex.t) return infAuraTex.t; const c = document.createElement('canvas'); c.width = 64; c.height = 96; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 48, 4, 32, 48, 44); gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 96); return (infAuraTex.t = new THREE.CanvasTexture(c)); }
// friend triangles follow the player's team (it changes when you turn)
function infMarkers() {
  for (const e of enemies) { const m = e.group.getObjectByName('mark'); const want = M.def.teams && e.team === M.myTeam; if (m && !want) e.group.remove(m); if (!m && want) e.group.add(friendlyMarker()); }
}
function infTurn(en, who) {   // a survivor became infected
  if (!M.inf || en.team === 1) return;
  en.team = 1;
  if (en.isPlayer) { M.myTeam = 1; M.me.team = 1; infMe(true); showBanner('YOU ARE INFECTED', 'no guns · run them down · one hit kills'); infMarkers(); }
  else if (en.bot) { en.bot.team = 1; infDress(en.bot); infMarkers(); }
  feedLine(`${nameHtml(en)} <span class="fw">☣</span> ${en.isPlayer ? 'TURNED' : 'TURNED'}`);
}
const infCount = () => { const n = [0, 0]; for (const en of M.entries) n[en.team === 1 ? 1 : 0]++; return n; };
function infUpdate(dt) {
  const I = M.inf; if (!I) return;
  for (const e of enemies) if (!!e.inf !== (e.team === 1)) infDress(e);
  if (M.online && !netHostNow()) { netObjApply(); return; }
  if (I.state === 'grace') {
    I.t -= dt;
    if (I.t <= 0) {
      const pool = M.entries.filter(en => en.team === 0 && (en.isPlayer || en.bot || en.netPeer)), pick = (M.online ? pool : pool.filter(en => !en.isPlayer))[(Math.random() * Math.max(1, (M.online ? pool : pool.filter(en => !en.isPlayer)).length)) | 0];
      if (pick) { I.first = pick.isPlayer ? (M.online ? NET.me : 'player') : pick.botLabel || pick.netPeer || pick.name; if (!pick.netPeer) infTurn(pick); if (!pick.isPlayer && pick.bot) { pick.bot.hp = pick.bot.maxHp = M.maxHp * 3; } }
      I.state = 'live'; showBanner('THE INFECTION HAS STARTED', `${pick ? (pick.isPlayer ? 'YOU are' : pick.name + ' is') : 'someone is'} infected · survive ${Math.round(I.left / 60)} minutes`); try { sfx.streak(); } catch (e) {}
    }
  } else if (I.state === 'live') {
    I.left -= dt; const n = infCount();
    if (n[0] === 0) infEnd(1); else if (I.left <= 0) infEnd(0);
  }
  const n = infCount(); if (I.state !== 'done') M.teamScore = M.online ? [0, 0] : [n[0], n[1]];   // online the score only says who won (the round-end check reads it)
}
function infEnd(t) {
  const I = M.inf; I.state = 'done'; I.end = t ? 'infected' : 'survivors';
  if (M.online) { M.teamScore = t ? [0, 1] : [1, 0]; return; }   // the round's end check (net.js) sees it
  M.teamScore = t ? [0, 1] : [1, 0]; endMatch(t);
}
function infPack() { const I = M.inf, n = infCount(); return ['i', ['grace', 'live', 'done'].indexOf(I.state), I.first, n[0], n[1], Math.ceil(I.left), I.round, Math.ceil(I.t), M.teamScore[0], M.teamScore[1]]; }
function infApply(o) {
  const I = M.inf; if (!I) return;
  const st = ['grace', 'live', 'done'][o[1] | 0] || 'grace', first = typeof o[2] === 'string' ? o[2] : '';
  if (st === 'live' && I.state === 'grace') showBanner('THE INFECTION HAS STARTED', first === NET.me ? 'YOU are infected' : 'run');
  if (first && first === NET.me && M.myTeam === 0 && I.state !== 'live' && st === 'live') infTurn(M.me);
  I.state = st; I.first = first; I.left = +o[5] || 0; I.t = +o[7] || 0; M.teamScore = [+o[8] | 0, +o[9] | 0];
}
function infHud() {
  const I = M.inf; if (!I) return '';
  const n = infCount(), mm = Math.floor(Math.max(0, I.left) / 60), ss = String(Math.floor(Math.max(0, I.left) % 60)).padStart(2, '0');
  if (I.state === 'grace') return `INFECTION IN ${Math.ceil(I.t)} · SPREAD OUT`;
  return `${M.myTeam === 1 ? 'YOU ARE INFECTED · ' : ''}SURVIVORS ${n[0]} · INFECTED ${n[1]} · ${mm}:${ss} LEFT`;
}
// infected bots: no guns, they chase the nearest survivor and hit up close
function infGoal(e, set) {
  let best = null, bd = 1e9; const ex = e.group.position.x, ez = e.group.position.z;
  if (playerAlive() && M.myTeam === 0) { const d = Math.hypot(P.x - ex, P.z - ez); if (d < bd) { bd = d; best = { x: P.x, z: P.z, y: P.y }; } }
  for (const o of enemies) if (o.team === 0) { const d = Math.hypot(o.group.position.x - ex, o.group.position.z - ez); if (d < bd) { bd = d; best = { x: o.group.position.x, z: o.group.position.z, y: o.group.position.y }; } }
  return best ? set(best, 0.4) : null;
}
function infBotMelee(e, dt, tp, dist) {
  e.meleeCd = (e.meleeCd || 0) - dt;
  if (!tp || dist > 2.0 || e.meleeCd > 0 || e.stunT > 0) return;
  e.meleeCd = 0.85; try { sfx.thud(at(e.group.position.x, e.group.position.z, 12)); } catch (err) {}
  if (e.tgt === 'P') { if (!(G.spawnProt > 0)) { G.killer = e; hurtPlayer(e.meleeDmg || 150, e.group.position.x, e.group.position.z); } }
  else if (e.tgt && e.tgt.group) damageEnemy(e.tgt, e.meleeDmg || 150, false, new THREE.Vector3(e.tgt.group.position.x - e.group.position.x, 0, e.tgt.group.position.z - e.group.position.z).normalize(), false, e);
}
(() => { const s = document.createElement('style'); s.textContent = '#infVig{position:fixed;inset:0;pointer-events:none;z-index:5;opacity:0;transition:opacity .6s;box-shadow:inset 0 0 160px 40px rgba(90,255,60,.35)}'; document.head.appendChild(s); })();

// infected bodies turn sickly green (own copies of the materials, made once per body; survivors keep the shared ones)
function infTint(e, on) {
  if (!!e.infTinted === !!on) return;
  e.rig.root.traverse(o => {
    if (!o.isMesh || !o.material || o.userData.hitbox) return;
    if (on) { if (!o.userData.matOrig) o.userData.matOrig = o.material; const m = o.userData.matOrig.clone(); if (m.color) m.color.lerp(new THREE.Color(0x6aa83a), 0.55); if (m.emissive) { m.emissive.setHex(0x1f5a0c); m.emissiveIntensity = 0.6; } o.material = m; }
    else if (o.userData.matOrig) { o.material.dispose(); o.material = o.userData.matOrig; }
  });
  e.infTinted = !!on;
}
