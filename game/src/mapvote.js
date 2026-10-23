/* ================================================================== map voting (online, between rounds)
   When an online round ends the host offers three maps (not the one just played). Everyone votes on the results screen
   ('mv' in their state); the host counts the real players' votes when the intermission ends and loads the winner
   (a tie: one of the tied maps at random; nobody voted: one of the three at random). Private matches with a fixed map
   skip the vote. The host's three maps travel as 'vo'. */
const MV = { opts: null, mine: '', shown: '' };
const mvOn = () => M && M.online && NET.app && !(NET.priv && NET.priv.cfg && NET.priv.cfg.mp && NET.priv.cfg.mp !== 'random');
function mvStart() {
  MV.mine = ''; NET.mv = ''; MV.shown = '';
  if (!mvOn()) { MV.opts = null; return; }
  if (NET.room && NET.room.host) { const pool = MAP_ORDER.filter(id => !MAPS[id].hidden && id !== curMap).sort(() => Math.random() - 0.5); MV.opts = pool.slice(0, 3); }
}
const mvOptions = () => (NET.room && NET.room.host ? MV.opts : NET.voHost) || null;
function mvCount() {
  const o = mvOptions(), n = {}; if (!o) return n; for (const id of o) n[id] = 0;
  if (NET.mv && n[NET.mv] !== undefined) n[NET.mv]++;
  for (const R of NET.rem.values()) if (!R.isBot && R.mv && n[R.mv] !== undefined) n[R.mv]++;
  return n;
}
// the host, when the intermission ends: the map to load (null = no vote this time)
function mvWinner() {
  const o = MV.opts; if (!o || !o.length || !mvOn()) return null;
  const n = mvCount(), top = Math.max(...o.map(id => n[id])), best = o.filter(id => n[id] === top);
  return best[(Math.random() * best.length) | 0];
}
function mvEnd() { MV.opts = null; MV.mine = ''; NET.mv = ''; NET.voHost = null; MV.shown = ''; const b = $('mapVote'); if (b) b.remove(); }
function mvVote(id) { const o = mvOptions(); if (!o || !o.includes(id)) return; MV.mine = id; NET.mv = id; try { sfx.ui(); } catch (e) {} mvRender(true); }
function mvRender(force) {
  const o = mvOptions(), res = $('results');
  if (!o || !res || res.classList.contains('hide') || G.state !== 'over') return;
  let box = $('mapVote');
  if (!box) { box = document.createElement('div'); box.id = 'mapVote'; const nx = $('resNext'); nx.parentNode.insertBefore(box, nx.nextSibling); }
  const n = mvCount(), key = o.join() + '|' + JSON.stringify(n) + '|' + MV.mine;
  if (!force && MV.shown === key) return; MV.shown = key;
  const total = Object.values(n).reduce((s, v) => s + v, 0);
  box.innerHTML = `<div class="mv-h">VOTE FOR THE NEXT MAP <small>${total} VOTE${total === 1 ? '' : 'S'}</small></div><div class="mv-row">` + o.map((id, i) => {
    const m = MAPS[id] || {}, pic = (typeof MAPSHOTS !== 'undefined' && MAPSHOTS[id] && MAPSHOTS[id][0]) || '';
    return `<button class="mv-c${MV.mine === id ? ' on' : ''}" data-mv="${id}" style="${pic ? `background-image:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.75)),url(${pic})` : ''}"><b>${m.name || id}</b><small>${m.place || ''}</small><em>${n[id] || 0}</em></button>`;
  }).join('') + '</div>';
  for (const b of box.querySelectorAll('[data-mv]')) b.onclick = () => mvVote(b.dataset.mv);
}
(() => { const s = document.createElement('style'); s.textContent = `#mapVote{margin:10px 0 4px;pointer-events:auto}#mapVote .mv-h{font-size:11px;letter-spacing:.24em;color:var(--accent);margin-bottom:6px}#mapVote .mv-h small{float:right;color:var(--dim)}
#mapVote .mv-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.mv-c{position:relative;height:96px;cursor:pointer;font-family:inherit;text-align:left;display:flex;flex-direction:column;justify-content:flex-end;padding:8px 10px;border:1px solid var(--line);background:#15181b center/cover;color:#fff}
.mv-c b{font-size:14px;letter-spacing:.14em;text-shadow:0 1px 3px #000}.mv-c small{font-size:10px;letter-spacing:.06em;color:rgba(255,255,255,.75);text-shadow:0 1px 3px #000}
.mv-c em{position:absolute;top:6px;right:8px;font-style:normal;font-weight:800;font-size:18px;text-shadow:0 1px 3px #000}
.mv-c:hover,.mv-c:focus{outline:0;border-color:rgba(224,180,74,.7)}.mv-c.on{border:2px solid var(--accent);box-shadow:0 0 12px rgba(224,180,74,.45)}`; document.head.appendChild(s); })();
