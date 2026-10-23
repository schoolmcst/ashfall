/* ================================================================== accessibility: colour-blind team colours, ADS field of view
   COLOUR-BLIND MODE swaps the red / blue team colours (scoreboard, kill feed, radar, markers, objectives, UAV, bags,
   grow spots) for pairs that stay apart for each kind of colour blindness. ADS FIELD OF VIEW: AFFECTED zooms in from
   your FOV (wider FOV, wider scopes), INDEPENDENT always zooms in by the same amount whatever your FOV. */
const CB_PAL = {
  off: ['#5aaeff', '#ff5a4a'],
  deut: ['#3d9bff', '#ffb000'],   // deuteranopia (green-weak): blue and amber
  prot: ['#4aa8ff', '#ffd23a'],   // protanopia (red-weak): blue and yellow, reds look dark to them
  trit: ['#2fd6c4', '#ff3a6e'],   // tritanopia (blue-weak): teal and pink-red
};
function cbApply() {
  const p = CB_PAL[S.cbMode] || CB_PAL.off;
  TEAM_COL[0] = p[0]; TEAM_COL[1] = p[1];
  try { friendlyMarker.tex = null; } catch (e) {}
  try { if (typeof kcIcon === 'function') kcIcon.c = {}; } catch (e) {}
  document.documentElement.style.setProperty('--friend', p[0]); document.documentElement.style.setProperty('--enemy', p[1]);
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
  document.documentElement.style.setProperty('--enemy-rgb', rgb(p[1]));
}
const cbEnemy = () => TEAM_COL[1], cbFriend = () => TEAM_COL[0];
(() => { const s = document.createElement('style'); s.textContent = '#uavMarks i{border-color:var(--enemy,#ff4a3a)!important;background:rgba(var(--enemy-rgb,255,74,58),.35)!important;box-shadow:0 0 6px rgba(var(--enemy-rgb,255,60,40),.8)!important}#uavMarks i.adv{background:var(--enemy,#ff4a3a)!important}'; document.head.appendChild(s); })();
try { cbApply(); } catch (e) {}
// the zoom when aiming: affected by your FOV (the old way) or the same at any FOV
const adsFovFor = (w, baseFov) => S.adsFov === 'independent' ? w.adsFov : w.adsFov * baseFov / 75;
