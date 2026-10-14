/* ================================================================== match start: loading screen + class pick freeze
   Every match opens on a 5 second loading screen with a picture of the map. Online matches then hold everyone for
   15 seconds to pick a class (nobody can move or shoot, bots wait, and players can still join to fill the lobby);
   then the match starts for everyone at once. G.holdT counts down the whole wait; G.loadT just the loading screen. */
const LOAD_SECS = 5, PICK_SECS = 15;
const LOAD_TIPS = ['Aim down sights for a perfect first shot - keep firing and the spread blooms.', 'Two or more enemies in your spawn moves it to your other spawn area.', 'Scorestreaks: earn points without dying, use them with X or D-pad up.',
  'Stuns only blind people looking at them - turn away!', 'Press Y / Q in the lobby to choose the modes in your playlist.', 'Your friend code is in Settings > Account. Friends can join your party with it.',
  'Each scope zoom has its own sensitivity in Settings > Controls.', 'Hold E (X on a controller) to plant or defuse in Search & Destroy.'];
function matchHold(pick) {
  G.loadT = LOAD_SECS; G.holdT = LOAD_SECS + (pick ? PICK_SECS : 0); G.pickShown = false;
  mouseDown = false; mouseAds = false; showLoadScreen(); try { rpStart(); } catch (e) {}
}
function showLoadScreen() {
  const el = $('loadscr'); if (!el) return;
  const shots = (typeof MAPSHOTS !== 'undefined' && MAPSHOTS[curMap]) || [], m = MAPS[curMap] || {};
  $('lsImg').style.backgroundImage = shots.length ? `url(${shots[(Math.random() * shots.length) | 0]})` : 'none';
  $('lsMap').textContent = m.name || ''; $('lsPlace').textContent = m.place || '';
  $('lsMode').textContent = M && M.def ? M.def.name.replace(/^ONLINE /, '') : '';
  $('lsTip').textContent = LOAD_TIPS[(Math.random() * LOAD_TIPS.length) | 0];
  el.classList.remove('hide', 'out'); el._t = 0;
}
function hideLoadScreen() { const el = $('loadscr'); if (el && !el.classList.contains('hide')) { el.classList.add('out'); setTimeout(() => el.classList.add('hide'), 450); } }
// called every frame while a match is running
function updateHold(dt) {
  if (!(G.holdT > 0)) return false;
  G.holdT -= dt; G.loadT = Math.max(0, (G.loadT || 0) - dt);
  const bar = $('lsBar'); if (bar && G.loadT > 0) bar.style.width = ((1 - G.loadT / LOAD_SECS) * 100).toFixed(1) + '%';
  if (G.loadT <= 0) hideLoadScreen();
  if (G.loadT <= 0 && G.holdT > 0 && !G.pickShown && G.state === 'playing') { G.pickShown = true; openClassPick(); }
  if (G.pickShown && curScreen === 'classpick') { const t = $('cpTime'); if (t) t.textContent = Math.ceil(G.holdT); }
  if (G.holdT <= 0) { G.holdT = 0; if (curScreen === 'classpick') showScreen(null); if (G.state === 'playing') lockPointer(); showBanner('GO', M && M.def ? modeGoalText() : ''); try { sfx.streak(); } catch (e) {} }
  return G.holdT > 0;
}
const holding = () => G.holdT > 0;
function openClassPick() {
  hadLock = false; try { document.exitPointerLock && document.exitPointerLock(); } catch (e) {}
  const gun = M && M.mode === 'gun';
  $('cpList').innerHTML = gun ? `<div class="cp-gun">GUN GAME · everyone starts on the ${ARM[GUN_LADDER[0]].name}</div>` : CLASSES.map((c, i) => `<button class="cp-c${i === ACTIVE_CLASS ? ' on' : ''}" data-cp="${i}"><small>${i + 1}</small><b>${c.name}</b><span>${ARM[c.p].name} · ${ARM[c.s].name}</span><span>${EQUIP[c.e].name}</span><span class="cp-perks">${perksOf(c).map(k => PERKS[k].name).join(" · ")}</span></button>`).join('');
  for (const b of $('cpList').querySelectorAll('[data-cp]')) b.onclick = () => cpPick(+b.dataset.cp);
  showScreen('classpick'); focusFirst(gun ? '#classpick .btn' : '#cpList .on');
}
function cpPick(i) {
  if (!CLASSES[i]) return;
  ACTIVE_CLASS = i; saveClasses(); updateClassUI(); sfx.ui();
  if (!(M && M.mode === 'gun')) { equipClass(activeClass()); G.grenades = EQUIP[G.equip].count; }
  for (const b of $('cpList').querySelectorAll('[data-cp]')) b.classList.toggle('on', +b.dataset.cp === i);
}
(() => {
  const s = document.createElement('style');
  s.textContent = `#loadscr{position:fixed;inset:0;z-index:40;background:#07090a;display:flex;flex-direction:column;justify-content:flex-end;transition:opacity .45s}#loadscr.out{opacity:0}
#lsImg{position:absolute;inset:0;background-size:cover;background-position:center;filter:saturate(1.05) contrast(1.05)}#loadscr::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(5,6,7,.95) 0%,rgba(5,6,7,.35) 40%,rgba(5,6,7,.1) 70%)}
.ls-info{position:relative;z-index:1;padding:0 6vw 7vh}.ls-mode{font-size:13px;letter-spacing:.4em;color:var(--accent)}.ls-map{font-size:clamp(38px,6vw,72px);font-weight:800;letter-spacing:.14em;margin:6px 0 2px}.ls-place{font-size:13px;letter-spacing:.2em;color:var(--dim)}
.ls-bar{margin-top:22px;height:3px;background:rgba(255,255,255,.12);max-width:520px}.ls-bar i{display:block;height:100%;width:0;background:var(--accent)}.ls-tip{margin-top:12px;font-size:13px;letter-spacing:.06em;color:var(--dim);max-width:640px}
.cpp{width:min(980px,94vw)}#cpList{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;padding:16px 26px}
.cp-c{pointer-events:auto;cursor:pointer;text-align:left;font-family:inherit;color:var(--ink);padding:14px;border:1px solid var(--line);background:rgba(255,255,255,.04);display:flex;flex-direction:column;gap:4px;position:relative}
.cp-c small{position:absolute;right:10px;top:8px;font-size:11px;color:var(--dim)}.cp-c b{font-size:15px;letter-spacing:.18em}.cp-c span{font-size:11px;letter-spacing:.08em;color:var(--dim)}.cp-c:hover,.cp-c:focus{outline:0;border-color:rgba(224,180,74,.6)}.cp-c.on{border-color:var(--accent);background:rgba(224,180,74,.12)}
.cp-t{display:flex;align-items:baseline;gap:12px;padding:18px 26px 0}.cp-t b{font-size:15px;letter-spacing:.4em;color:var(--accent)}.cp-t span{margin-left:auto;font-size:12px;letter-spacing:.3em;color:var(--dim)}.cp-t em{font-style:normal;font-size:30px;color:#fff;margin-left:6px}
.cp-c .cp-perks{color:var(--accent);opacity:.85}.cp-gun{grid-column:1/-1;padding:20px;text-align:center;letter-spacing:.2em;color:var(--dim)}`;
  document.head.appendChild(s);
})();
