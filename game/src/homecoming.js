/* ================================================================== PROJECT HOMECOMING (1.2.0): the major update splash
   Shown once to every player the first time they open the game on this version (app or browser). */
const HC_VER = '1.2.0', HC_KEY = 'dz_seen_update';
const HC_CARDS = [
  ['SOCIAL', 'Friend requests, see who is online and join them, and a friends leaderboard.'],
  ['PARTIES', 'Squad up and stay together: your party is always on the same team.'],
  ['MATCH START', 'Loading screen with the map, then 15 seconds to pick your class before the fight.'],
  ['SPAWNS', 'Two spawn areas per team that switch when enemies push in, plus spawn protection.'],
  ['GUNS', 'Every gun rebalanced, attachments that do what they say, advanced stats.'],
  ['REPLAY', 'Rewatch your last match on a tactical map with the full kill feed.'],
  ['MUSIC', 'An original soundtrack for the menus and lobby.'],
  ['CONTROLS', 'Sensitivity for every scope zoom, controller remapping, rename your classes.']
];
function hcShow(force) {
  let seen = null; try { seen = localStorage.getItem(HC_KEY); } catch (e) {}
  if (!force && seen === HC_VER) return false;
  if (!force && !(typeof PROG !== 'undefined' && PROG.xp > 0)) { try { localStorage.setItem(HC_KEY, HC_VER); } catch (e) {} return false; }   // brand-new players don't get an old update's splash
  try { localStorage.setItem(HC_KEY, HC_VER); } catch (e) {}
  const shots = typeof MAPSHOTS !== 'undefined' ? Object.values(MAPSHOTS).flat() : [];
  const m = document.createElement('div'); m.id = 'hcSplash';
  m.innerHTML = `<div class="hc-bg"${shots.length ? ` style="background-image:url(${shots[(Math.random() * shots.length) | 0]})"` : ''}></div>
<div class="hc-in"><div class="hc-kick">MAJOR UPDATE · ${HC_VER} BETA</div><h1>PROJECT<br><em>HOMECOMING</em></h1>
<p class="hc-sub">The biggest update DARKZONE has had. Bring your friends home.</p>
<div class="hc-grid">${HC_CARDS.map(([h, t], i) => `<div class="hc-c" style="animation-delay:${0.35 + i * 0.07}s"><b>${h}</b><span>${t}</span></div>`).join('')}</div>
<button class="btn primary hc-go" id="hcGo">LET'S GO</button><div class="hc-hint">ENTER / A TO CONTINUE · FULL PATCH NOTES IN NEWS</div></div>`;
  document.body.appendChild(m);
  const close = () => { if (!m.isConnected) return; m.classList.add('out'); setTimeout(() => m.remove(), 500); removeEventListener('keydown', key, true); try { sfx.ui(); } catch (e) {} };
  const key = e => { if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  addEventListener('keydown', key, true); $('hcGo').onclick = close;
  let held = true;   // wait for the controller buttons to be released first
  const poll = () => { if (!m.isConnected) return; const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(g => g) : null;
    const a = gp && gp.buttons[0] && gp.buttons[0].pressed; if (!a) held = false; else if (!held) { close(); return; } requestAnimationFrame(poll); };
  requestAnimationFrame(poll);
  setTimeout(() => { try { $('hcGo').focus(); } catch (e) {} }, 60);
  try { sfx.streak(); } catch (e) {}
  return true;
}
const hcWait = setInterval(() => { if (typeof G !== 'undefined' && G.state === 'menu' && $('menu') && !$('menu').classList.contains('hide')) { clearInterval(hcWait); setTimeout(() => hcShow(false), 700); } }, 400);
(() => {
  const s = document.createElement('style');
  s.textContent = `#hcSplash{position:fixed;inset:0;z-index:250;display:flex;align-items:center;justify-content:center;background:#050607;overflow:auto;animation:hcIn .6s ease both;transition:opacity .5s}#hcSplash.out{opacity:0}
.hc-bg{position:fixed;inset:0;background-size:cover;background-position:center;opacity:.32;filter:saturate(.8);animation:hcZoom 18s ease-out both}#hcSplash::before{content:"";position:fixed;inset:0;background:radial-gradient(circle at 50% 40%,rgba(5,6,7,.2),rgba(5,6,7,.92) 75%);z-index:0}
.hc-in{position:relative;z-index:1;text-align:center;padding:28px 16px;max-width:1040px;width:100%;box-sizing:border-box}
.hc-kick{display:inline-block;font-size:12px;letter-spacing:.45em;color:#0b0c0d;background:var(--accent);padding:6px 14px;animation:hcUp .6s .1s both}
#hcSplash h1{margin:16px 0 6px;font-size:clamp(44px,8.5vw,108px);line-height:.92;letter-spacing:.12em;font-weight:900;color:#fff;animation:hcUp .7s .18s both}#hcSplash h1 em{font-style:normal;color:var(--accent);text-shadow:0 0 40px rgba(224,180,74,.35)}
.hc-sub{color:var(--dim);letter-spacing:.18em;font-size:14px;margin:12px 0 26px;animation:hcUp .6s .28s both}
.hc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;text-align:left;margin-bottom:26px}
.hc-c{background:rgba(12,14,15,.78);border:1px solid var(--line);border-top:2px solid var(--accent);padding:12px 14px;animation:hcUp .5s both}.hc-c b{display:block;font-size:13px;letter-spacing:.3em;color:var(--accent);margin-bottom:5px}.hc-c span{font-size:13px;line-height:1.45;color:#d9dcde}
.hc-go{display:inline-block;width:auto;min-width:0;text-align:center;font-size:18px;letter-spacing:.4em;padding:14px 48px;animation:hcUp .6s .9s both}.hc-hint{margin-top:12px;font-size:11px;letter-spacing:.25em;color:var(--dim);animation:hcUp .6s 1s both}
@keyframes hcIn{from{opacity:0}}@keyframes hcUp{from{opacity:0;transform:translateY(18px)}}@keyframes hcZoom{from{transform:scale(1.12)}}`;
  document.head.appendChild(s);
})();
