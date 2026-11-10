/* ================================================================== LAST TOKE ONLINE: STASH BOXES, STASH CARDS, VAULT BOSSES (1.2.93 follow-up)
   Everything rides in presence field `bn` (brnPres / brnRemote).
   STASH BOXES: online, each player makes the box for their own death and the host makes its bots' boxes; the box (id,
     place, items) goes out as bn.sb, the items people take as bn.st ("id:index"). Online a gun swap leaves your old gun
     behind (it can't go into someone else's box).
   STASH CARDS: the host runs every card (its bots' and real players'): bn.sc = [id, team, x, y, z, carrier]. A player
     walking over a card asks for it (bn.scp), carries it, and holds USE at a beacon (bn.scr = [card, beacon, seq]). The
     host brings back a bot itself, or tells the dead player (bn.sru = [[peer, beacon, seq]]): they float back in.
   VAULT BOSSES: the host runs them and sends bn.vb = [[vault, x, y, z, yaw, hp, shots]]; the others draw stand-ins
     and send the damage they do to each as bn.vh = [[vault, total]]; the host's boss shoots at whoever is nearest. */
const BRN = { boxSeq: 0, myBoxes: [], takes: [], cards: new Map(), claim: null, reupOut: null, reupSeq: 0, sru: [], sruSeen: 0, bosses: new Map(), bossDmg: {}, seenDmg: new Map(), boxSeen: new Set() };
const brnOn = () => !!(M && M.br && M.online);
// codes for box items in presence
const brnItemOut = it => it.k === 'gun' ? ['g', it.gun, it.tier] : it.k === 'ammo' ? ['a', it.t, it.n] : it.k === 'heal' ? ['h', it.h] : ['p'];
const brnItemIn = a => a[0] === 'g' && ARM[a[1]] ? { k: 'gun', gun: a[1], tier: clamp(a[2] | 0, 0, 3) } : a[0] === 'a' && BRL_AMMO[a[1]] ? { k: 'ammo', t: a[1], n: clamp(a[2] | 0, 1, 300) } : a[0] === 'h' && BRL_HEAL[a[1]] ? { k: 'heal', h: a[1] } : { k: 'plate' };
// a box I made (my death, or the host's bot): give it an id and send it
function brnBoxMade(b) { if (!brnOn()) return; b.id = String(NET.me || 'x').slice(-4) + '_' + (++BRN.boxSeq); BRN.boxSeen.add(b.id); BRN.myBoxes.push(b); if (BRN.myBoxes.length > 10) BRN.myBoxes.shift(); }
function brnTake(b, i) { if (brnOn() && b.id) { BRN.takes.push(b.id + ':' + i); if (BRN.takes.length > 80) BRN.takes.shift(); } }
/* ---------- cards (host side): the carrier as a key everyone understands */
const brnCarrierKey = c => !c.by ? '' : c.by === 'player' ? 'H' : c.by.net ? 'p:' + c.by.net : 'b:' + ((c.by.entry && c.by.entry.name) || '');
/* ---------- out */
function brnPres() {
  if (!brnOn()) return undefined; const o = {};
  if (BRN.myBoxes.length) o.sb = BRN.myBoxes.map(b => [b.id, Math.round(b.x * 10) / 10, Math.round(b.y * 10) / 10, Math.round(b.z * 10) / 10, b.items.map(brnItemOut), b.name]);
  if (BRN.takes.length) o.st = BRN.takes.slice(-60);
  if (netHostNow()) {
    if (typeof BRSQ !== 'undefined' && BRSQ.cards.length) o.sc = BRSQ.cards.map(c => [c.nid || (c.nid = 'c' + (++BRN.reupSeq)), c.team, Math.round(c.x * 10) / 10, Math.round(c.y * 10) / 10, Math.round(c.z * 10) / 10, brnCarrierKey(c)]);
    if (BRN.sru.length) o.sru = BRN.sru.slice(-6);
    const vb = []; for (const e of (typeof BRB !== 'undefined' ? BRB.bosses : [])) if (enemies.includes(e)) vb.push([e.bossBR.i, Math.round(e.group.position.x * 10) / 10, Math.round(e.group.position.y * 10) / 10, Math.round(e.group.position.z * 10) / 10, Math.round(e.group.rotation.y * 100) / 100, Math.round(e.hp), e.shots | 0]);
    if (vb.length || (BRB && BRB.bosses.length)) o.vb = vb;
  } else {
    if (BRN.claim) o.scp = BRN.claim;
    if (BRN.reupOut) o.scr = BRN.reupOut;
    const vh = Object.entries(BRN.bossDmg).map(([i, d]) => [+i, Math.round(d)]); if (vh.length) o.vh = vh;
  }
  return o;
}
/* ---------- in */
function brnRemote(R, o, fromHost) {
  if (!brnOn() || !o || typeof o !== 'object') return;
  // boxes and takes
  if (Array.isArray(o.sb)) for (const a of o.sb) { if (!Array.isArray(a) || BRN.boxSeen.has(String(a[0]))) continue; const id = String(a[0]).slice(0, 24); BRN.boxSeen.add(id);
    const items = Array.isArray(a[4]) ? a[4].slice(0, 20).map(brnItemIn) : []; try { const b = briBoxDrop({ name: String(a[5] || 'A').replace(/'S$/, '').slice(0, 20) }, netNum(a[1], -ARENA, ARENA), netNum(a[2], -60, 260), netNum(a[3], -ARENA, ARENA), items); if (b) b.id = id; } catch (e) {} }
  if (Array.isArray(o.st)) for (const s of o.st) { const [id, i] = String(s).split(':'); const b = BRI.boxes.find(x => x.id === id); if (b && b.items[i | 0]) b.items[i | 0].t = true; }
  // cards (from the host)
  if (fromHost && !netHostNow()) {
    const seen = new Set();
    if (Array.isArray(o.sc)) for (const a of o.sc) { const id = String(a[0]); seen.add(id); let c = BRN.cards.get(id);
      if (!c) { const g = new THREE.Group(); scene.add(g); const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.02), new THREE.MeshStandardMaterial({ color: 0x113311, emissive: 0x5dff7a, emissiveIntensity: 1.4 })); g.add(m); const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 6, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0x5dff7a, transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 3; g.add(beam); c = { id, g }; BRN.cards.set(id, c); }
      c.team = a[1] | 0; c.x = netNum(a[2], -ARENA, ARENA); c.y = netNum(a[3], -60, 260); c.z = netNum(a[4], -ARENA, ARENA); c.by = String(a[5] || ''); }
    for (const [id, c] of BRN.cards) if (!seen.has(id)) { if (c.g.parent) c.g.parent.remove(c.g); BRN.cards.delete(id); if (BRN.claim === id) BRN.claim = null; }
    // the host brought me back
    if (Array.isArray(o.sru)) for (const a of o.sru) { if (String(a[0]) !== String(NET.me) || (a[2] | 0) <= BRN.sruSeen) continue; BRN.sruSeen = a[2] | 0; const b = BRSQ.beacons[a[1] | 0]; if (b && !playerAlive()) { G.brReup = true; try { brsqReup({ en: M.me, g: { parent: null } }, b); } catch (e) {} G.brReup = false; } }
    // vault bosses: stand-ins
    if (Array.isArray(o.vb)) { const live = new Set(); for (const a of o.vb) { const i = a[0] | 0; live.add(i); let e = BRN.bosses.get(i);
        if (!e) { e = makeEnemy('heavy', +a[1], +a[3]); Object.assign(e, { proxyBoss: i, team: 99, name: 'VAULT BOSS', hp: 1e9, maxHp: 650, shots: 0 }); try { const lmg = ARMORY.find(d => d.cat === 'lmg'); if (lmg) botGunVisual(e, lmg, {}, null); } catch (er) {} enemies.push(e); BRN.bosses.set(i, e); }
        const g = e.group.position; g.set(lerp(g.x, +a[1], 0.4), +a[2], lerp(g.z, +a[3], 0.4)); e.group.rotation.y = +a[4]; e.bossHp = +a[5]; if ((a[6] | 0) !== e.shots) { e.shots = a[6] | 0; e.rig.flash.visible = true; e.flashT = 0.06; try { sfx.enemy(at(g.x, g.z, 20)); } catch (er) {} } }
      for (const [i, e] of BRN.bosses) if (!live.has(i)) { const k = enemies.indexOf(e); if (k >= 0) enemies.splice(k, 1); scene.remove(e.group); BRN.bosses.delete(i); try { showBanner('VAULT BOSS DOWN', ''); } catch (er) {} } }
  }
  // the host: claims, re-ups and boss damage from the players
  if (netHostNow() && R && R.bot) {
    if (o.scp && typeof BRSQ !== 'undefined') { const c = BRSQ.cards.find(c => c.nid === String(o.scp)); if (c && !c.by && c.team === R.bot.team) c.by = R.bot; }
    if (Array.isArray(o.scr) && (o.scr[2] | 0) > (R.scrSeen | 0)) { R.scrSeen = o.scr[2] | 0; const c = BRSQ.cards.find(c => c.nid === String(o.scr[0]) && c.by === R.bot), b = BRSQ.beacons[o.scr[1] | 0]; if (c && b) brsqReup(c, b); }
    if (Array.isArray(o.vh)) for (const [i, d] of o.vh) { const key = R.peer + ':' + i, prev = BRN.seenDmg.get(key) || 0, add = Math.max(0, Math.min(2000, d - prev)); BRN.seenDmg.set(key, d); const e = BRB.bosses.find(b => b.bossBR.i === (i | 0)); if (e && add && enemies.includes(e)) { e.awake = true; try { damageEnemy(e, add, false, null, false, R.bot); } catch (er) {} } }
  }
}
/* ---------- every frame (from brUpdate): the client's side of the cards */
function brnTick(dt) {
  if (!brnOn() || netHostNow()) return;
  const u = kb('use') || pad.use; let mine = null;
  for (const [id, c] of BRN.cards) {
    const me = c.by === 'p:' + NET.me; if (me) { c.x = P.x; c.y = P.y; c.z = P.z; mine = c; }
    c.g.position.set(c.x, c.y + (c.by ? 2.1 : 0.9), c.z); c.g.rotation.y += dt * 2; c.g.visible = !me;
    if (!c.by && c.team === M.myTeam && playerAlive() && Math.hypot(P.x - c.x, P.z - c.z) < 1.5 && Math.abs(P.y - c.y) < 2) { BRN.claim = id; try { showMsgOnce('STASH CARD · take it to a RE-UP BEACON'); } catch (e) {} }
  }
  if (BRN.claim && (!BRN.cards.has(BRN.claim) || (BRN.cards.get(BRN.claim).by && BRN.cards.get(BRN.claim).by !== 'p:' + NET.me))) BRN.claim = null;
  if (mine && playerAlive()) { const b = brsqBeacon(P.x, P.z);
    if (b && Math.hypot(b.x - P.x, b.z - P.z) < 2.2) { if (u) { b.holdT += dt; if (b.holdT >= 3) { b.holdT = 0; BRN.reupOut = [mine.id, BRSQ.beacons.indexOf(b), ++BRN.reupSeq]; try { showBanner('RE-UP', 'your squadmate is floating back in'); brpEvt('reup'); } catch (e) {} } } else b.holdT = 0;
      try { G.interactTxt = u ? `RE-UP · ${Math.round(b.holdT / 3 * 100)}%` : `HOLD ${actName('use')} TO BRING YOUR SQUADMATE BACK`; showMsgOnce(G.interactTxt); } catch (e) {} } }
}
// the round ends
function brnClear() { for (const [, c] of BRN.cards) if (c.g.parent) c.g.parent.remove(c.g); BRN.cards.clear(); for (const [, e] of BRN.bosses) { const k = enemies.indexOf(e); if (k >= 0) enemies.splice(k, 1); scene.remove(e.group); } BRN.bosses.clear(); BRN.myBoxes = []; BRN.takes = []; BRN.claim = null; BRN.reupOut = null; BRN.sru = []; BRN.bossDmg = {}; BRN.seenDmg.clear(); BRN.boxSeen.clear(); }
// hits on a boss stand-in go to the host
const _brnDmg = damageEnemy;
damageEnemy = function (e, dmg, head, dir, boom, by = 'player') {
  if (e && e.proxyBoss !== undefined) { if (by === 'player') { BRN.bossDmg[e.proxyBoss] = (BRN.bossDmg[e.proxyBoss] || 0) + dmg * (head ? 1.5 : 1); try { hitMarker && hitMarker(false); } catch (er) {} } return false; }
  return _brnDmg(e, dmg, head, dir, boom, by);
};
