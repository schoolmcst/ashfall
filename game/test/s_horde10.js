// HOTBOX HORDE batch G (53-60): minimap, wave preview, damage numbers, ghost cost + ring, custom games, backup, big bases, type markers
module.exports = async p => { const r = {}; try { await run(p, r); } catch (e) { r.FAIL = String(e).slice(0, 400); } return r; };
const run = async (p, r) => {
  const SH = process.env.SHOTS || '/tmp', ev = (f, a) => p.evaluate(f, a);
  const shot = async (n, ms) => { await ev(() => { window.__A.G.noRender = false; }); await p.waitForTimeout(ms || 1800); await p.screenshot({ path: SH + '/hh10_' + n + '.png' }); await ev(() => { window.__A.G.noRender = true; }); };
  const boot = async () => { await p.waitForTimeout(9000); await ev(() => { const A = window.__A; A.G.holdT = 0.01; A.G.loadT = 0; for (const e of A.enemies) if (e.entry) { e.acc = 0; e.dmg = 0; } }); await p.waitForTimeout(1500); await ev(() => { const A = window.__A; if (A.G.state === 'paused') { A.G.state = 'playing'; A.showScreen(null); } A.G.health = A.G.maxHp = 1e9; }); };
  await ev(() => { for (const o of document.querySelectorAll('.onb-ov,#hcSplash,.app-notes')) o.remove(); try { localStorage.removeItem('ashfall.hh.v1'); } catch (e) {} const A = window.__A, s = A.hhL.load(); s.tutSeen = 1; s.tutDone = 1; s.cash = 50000; Object.assign(s.inv, { wood: 900, stone: 600, metal: 600, scrap: 100, wire: 40, battery: 40, nutri: 20, sap: 40 }); s.mis = 7; A.hhL.save(s); A.showScreen('menu'); A.hhOpenL(); for (const o of document.querySelectorAll('.onb-ov')) o.remove(); });
  for (const a of ['hhq-cus', 'hhq-wav', 'hhq-spd', 'hhq-spd', 'hhq-spd', 'hhq-mat', 'hhq-mk']) await ev(a => window.__A.actions(a), a);
  r.cus = await ev(() => { const s = window.__A.hhL.load(); return [s.cus, s.marks, [...document.querySelectorAll('.hhq-row b')].map(b => b.textContent)]; });
  await p.waitForTimeout(400); await p.screenshot({ path: SH + '/hh10_lobby.png' });
  // a custom defend mission
  const inv0 = await ev(() => window.__A.hhL.load().inv.wood);
  await ev(() => { window.__A.G.noRender = true; window.__A.actions('hh-start'); }); await boot();
  r.mission = await ev(inv0 => { const A = window.__A, H = A.HHM_GET(); return { kind: H.kind, waves: H.waves, cus: !!H.cus, pay: H.D.pay, woodUp: H.s.inv.wood - inv0 }; }, inv0);
  await p.waitForTimeout(800);
  r.preview = await ev(() => { const el = document.getElementById('hhPrev'); return el && el.style.display !== 'none' ? el.innerText.replace(/\n/g, ' | ') : null; });
  const q0 = await ev(() => JSON.stringify(window.__A.HHM_GET().nextQ.q));
  await ev(() => { window.__A.HHM_GET().t = 0.01; }); await p.waitForTimeout(1500);
  r.waveMatches = await ev(q0 => { const H = window.__A.HHM_GET(); return JSON.stringify(H.queue) === q0 ? 'same as the preview' : 'DIFFERENT ' + JSON.stringify(H.queue).slice(0, 80); }, q0);
  // mobs near me: speed, badges, damage numbers, minimap
  r.mobs = await ev(() => { const A = window.__A, H = A.HHM_GET(); const ms = []; for (const k of ['burnout', 'sprinter', 'smasher', 'spitter']) ms.push(A.hhMobL(k, A.P.x + 4 + ms.length, A.P.z - 5, A.P.y)); const sp = ms[0].speed; A.damageEnemy(ms[2], 37, false, null, false, 'player'); A.damageEnemy(ms[3], 55, true, null, false, 'player'); return { speed: Math.round(sp * 100) / 100, badges: ms.filter(e => e.hhqB).length, nums: document.querySelectorAll('#dmgNums b').length }; });
  await ev(() => { const A = window.__A; A.P.yaw = Math.PI * 0.1; A.P.pitch = -0.05; });
  await shot('mission', 2200);
  // the end: custom = no best, materials handed back
  r.end = await ev(inv0 => { const A = window.__A, H = A.HHM_GET(); for (const e of H.mobs.slice()) A.damageEnemy(e, 1e6, false, null, false, 'world'); A.hhEndL(true); const s = A.hhL.load(); return { best: s.best[7] || null, unl: s.unl[7] || null, woodBack: s.inv.wood - inv0 }; }, inv0);
  await p.waitForTimeout(1500);
  // backup: export, change the save, import the code back
  r.backup = await ev(() => { const A = window.__A; A.leaveGame(); const code = A.hhqExportL(), s = A.hhL.load(); const cash0 = s.cash; s.cash = 1; A.hhL.save(s); const bad = A.hhqImportL('DZH1-nonsense'), err = A.hhqImportL(code); return { len: code.length, prefix: code.slice(0, 5), bad, err, cashBack: A.hhL.load().cash === cash0, bak: !!localStorage.getItem('ashfall.hh.bak') }; });
  await ev(() => { window.__A.hhOpenL(); window.__A.actions('hhq-bk'); }); await p.waitForTimeout(500); await p.screenshot({ path: SH + '/hh10_backup.png' });
  await ev(() => { const o = document.getElementById('hhqBk'); if (o) o.remove(); });
  // THE HOMESTEAD: ring in build mode, red cost, a big base and the frame cost
  await ev(() => { const s = window.__A.hhL.load(); s.cus.on = 0; s.base.lv = 5; s.inv.metal = 5; window.__A.hhL.save(s); window.__A.G.noRender = true; window.__A.actions('hh-base'); }); await boot();
  r.base = await ev(() => { const A = window.__A, H = A.HHM_GET(); A.hhL.build(true); const L = A.hhL.pieces(); A.HH_GET().piece = L.findIndex(x => x.id === 'wall'); A.HH_GET().mat = 'metal'; return { lv: H.s.base.lv }; });
  await p.waitForTimeout(1500);
  r.ghost = await ev(() => ({ ring: !!(window.__A.HHQ_GET().ring && window.__A.HHQ_GET().ring.visible), red: !!document.querySelector('#hhMats .hhq-no') }));
  // 160 walls + floors, then frames with and without frozen matrices
  r.big = await ev(async () => { const A = window.__A, H = A.HHM_GET(); let n = 0; for (let ix = -8; ix <= 8; ix += 2) for (let iz = -8; iz <= 8; iz += 2) { if (Math.abs(ix) < 2 && Math.abs(iz) < 2) continue; for (let lv = 0; lv < 2; lv++) { try { A.hhL.place; } catch (e) {} const rec = { id: lv ? 'floor' : 'wall', ix, iz, lv: 0, dir: (ix + iz) & 3, up: !!lv, mat: 'stone' }; try { const before = H.pieces.length; window.__A.HHM_GET && 0; H.s.base.pieces.push(rec); n++; } catch (e) {} } }
    return n; });
  await ev(() => { const A = window.__A; A.leaveGame(); }); await p.waitForTimeout(600);
  await ev(() => { window.__A.hhOpenL(); window.__A.G.noRender = true; window.__A.actions('hh-base'); }); await boot(); await p.waitForTimeout(2500);
  r.frames = await ev(async () => { const A = window.__A, H = A.HHM_GET(); A.HH_GET().build = false; A.G.noRender = false; const t = async () => { await new Promise(r => setTimeout(r, 1500)); const t0 = performance.now(); for (let i = 0; i < 12; i++) A.renderFrame ? A.renderFrame() : A.renderer.render(A.scene, A.camera); return Math.round((performance.now() - t0) / 12); };
    const frozen = H.pieces.filter(p => p.frozen).length, a = await t(); for (const p of H.pieces) for (const m of p.meshes) m.matrixAutoUpdate = true; const b = await t(); for (const p of H.pieces) for (const m of p.meshes) { m.updateMatrix(); m.matrixAutoUpdate = false; } const c = await t(); for (const p of H.pieces) for (const m of p.meshes) m.matrixAutoUpdate = true; const d = await t(); A.G.noRender = true; return { pieces: H.pieces.length, frozen, msFrozen: [a, c], msNot: [b, d], calls: A.renderer.info.render.calls }; });
  await ev(() => { const A = window.__A; A.P.x = 0; A.P.z = 30; A.P.yaw = 0; A.P.pitch = -0.25; A.HH_GET().build = true; });
  await shot('base', 2500);
  r.radar = await ev(() => { const c = document.querySelector('#radar, canvas#radar'); if (!c) return null; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0) n++; return n; });
};
