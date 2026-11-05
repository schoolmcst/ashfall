/* ================================================================== COMPACT FRONT END (1.2.77)
   The main menu and the lobby, tidied up: everything is still there, it just takes less room.
     TOP BAR  - the logo and your player card on one line, every tab on a slim second line (none scroll off any more).
     MENU     - MULTIPLAYER is the one big tile; CAMPAIGN, ZOMBIES, FEATURED and LAST TOKE sit in a 2 x 2 grid under it;
                THE STASH YARD, REPLAY, SETTINGS and EXIT are a row of small buttons. The tiles are put in that order with
                CSS (order), so the tiles other files add at runtime (campaign, featured, LAST TOKE) land in the right place.
                NEWS is a small panel in the bottom right, over the scene.
     LOBBY    - slimmer rows, a smaller PLAY button, the roster in two columns, the long online note as one dim line.
   Only styles (loaded last, so they win); no behaviour changes. */
(() => {
  const s = document.createElement('style'); s.id = 'uiCompact'; s.textContent = `
/* ---- the top bar: logo + card, tabs on their own slim row */
.screen.cod .cod-top{flex-wrap:wrap;row-gap:0;padding:10px 2.4vw 0;align-items:center}
.screen.cod .cod-top .cod-logo{font-size:22px;padding-bottom:0;order:0}
.screen.cod .cod-top .cod-title{order:0;padding-bottom:0}.screen.cod .cod-top .cod-title b{font-size:20px}.screen.cod .cod-top .cod-title small{font-size:9px}
.screen.cod .cod-top .cod-card{order:1;margin:0 0 0 auto;padding:4px 10px;transform:scale(.86);transform-origin:right center}
.screen.cod .cod-top .cod-nav{order:2;flex:0 0 100%;align-self:stretch;margin-top:6px;gap:0;border-top:1px solid rgba(255,255,255,.06)}
.screen.cod .cod-nav .cod-tab{font-size:11px;letter-spacing:.14em;padding:9px 9px 10px;border-bottom-width:2px}
@media (max-width:1300px){.screen.cod .cod-nav .cod-tab{letter-spacing:.06em;padding-left:6px;padding-right:6px;font-size:10.5px}}
/* ---- the main menu: a hero tile, a 2 x 2 grid, a row of small buttons */
#menu .cod-main{justify-content:flex-start;padding:2.4vh 2.4vw 0;max-width:500px;gap:10px}
#menu .cod-tiles{display:grid;grid-template-columns:repeat(12,1fr);gap:7px}
#menu .cod-tile{grid-column:span 6;padding:10px 12px 10px 16px;min-width:0;clip-path:polygon(0 0,100% 0,100% 78%,95% 100%,0 100%);background:linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.015));backdrop-filter:blur(3px)}
#menu .cod-tile::before{width:3px}
#menu .cod-tile small{font-size:8.5px;letter-spacing:.24em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#menu .cod-tile b{font-size:17px;letter-spacing:.14em;margin:3px 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#menu .cod-tile span{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;font-size:9px;line-height:1.35;letter-spacing:.1em;overflow:hidden}
#menu .cod-tile:hover,#menu .cod-tile:focus{transform:translateY(-2px)}
#menu .cod-tile.primary{order:0;grid-column:1/-1;padding:16px 18px 16px 22px;background:linear-gradient(110deg,rgba(224,180,74,.22),rgba(224,180,74,.04) 60%,rgba(255,255,255,.02))}
#menu .cod-tile.primary b{font-size:28px;letter-spacing:.2em}#menu .cod-tile.primary small{font-size:9.5px}#menu .cod-tile.primary span{font-size:10px}
#menu .cod-tile.primary::after{content:"\\203A";position:absolute;right:18px;top:50%;transform:translateY(-50%);font-size:34px;color:var(--accent);opacity:.8}
#menu .cod-tile.cp-tile{order:1}#menu .cod-tile.z-tile{order:2}#menu .cod-tile.feat-tile{order:3}#menu .cod-tile.br-tile{order:4}
#menu .cod-tile.rg-tile,#menu .cod-tile[data-act="replay"],#menu .cod-tile[data-act="settings"],#menu .cod-tile.exit{grid-column:span 4;padding:8px 8px 8px 12px;clip-path:none;text-align:center}
#menu .cod-tiles.ex4 .cod-tile.rg-tile,#menu .cod-tiles.ex4 .cod-tile[data-act="replay"],#menu .cod-tiles.ex4 .cod-tile[data-act="settings"],#menu .cod-tiles.ex4 .cod-tile.exit{grid-column:span 3}
#menu .cod-tile.rg-tile{order:5}#menu .cod-tile[data-act="replay"]{order:6}#menu .cod-tile[data-act="settings"]{order:7}#menu .cod-tile.exit{order:8}
#menu .cod-tile.rg-tile small,#menu .cod-tile.rg-tile span,#menu .cod-tile[data-act="replay"] small,#menu .cod-tile[data-act="replay"] span,#menu .cod-tile[data-act="settings"] small,#menu .cod-tile[data-act="settings"] span{display:none}
#menu .cod-tile.rg-tile b,#menu .cod-tile[data-act="replay"] b,#menu .cod-tile[data-act="settings"] b,#menu .cod-tile.exit b{font-size:10px;letter-spacing:.12em;margin:0;color:var(--ink)}
#menu .cod-tile.rg-tile::before,#menu .cod-tile[data-act="replay"]::before,#menu .cod-tile[data-act="settings"]::before,#menu .cod-tile.exit::before{display:none}
#menu .cod-tiles:empty{display:none}
/* the news: a small panel in the bottom right, over the scene */
#menu .cod-news{position:absolute;right:2.4vw;bottom:52px;width:min(330px,30vw);background:rgba(4,6,7,.72);backdrop-filter:blur(4px)}
#menu .cod-news .cn-h{padding:7px 12px;font-size:9.5px}#menu .cod-news .cn-body{max-height:24vh}
#menu .cod-news .cn-v{padding:7px 12px}#menu .cod-news .cn-v b{font-size:11px}#menu .cod-news .cn-v ul{font-size:10.5px;line-height:1.35;margin-top:3px}#menu .cod-news .cn-name{font-size:12px;margin-top:3px}
.screen.cod .cod-foot{padding:8px 2.4vw;font-size:9.5px}.screen.cod .cod-foot .lnk{font-size:10px}
@media (max-width:900px){#menu .cod-news{display:none}#menu .cod-main{max-width:none}}
/* ---- the lobby */
#lobby .cod-lob{grid-template-columns:minmax(330px,430px) 1fr;gap:2.4vw;padding:14px 2.4vw}
#lobby .cod-lcol{gap:6px}
#lobby .cod-go{padding:10px 8px!important;font-size:18px!important}#lobby .cod-go b{font-size:21px}#lobby .cod-go small{font-size:8.5px!important}#lobby .cod-go span{font-size:10px;letter-spacing:.3em}
#lobby .cod-arrow{width:44px;font-size:26px}
#lobby .cod-row{padding:8px 40px 8px 14px;border-left-width:3px;backdrop-filter:blur(3px)}
#lobby .cod-row small{font-size:8.5px;letter-spacing:.26em}#lobby .cod-row b{font-size:15px;letter-spacing:.14em;margin:3px 0 2px}#lobby .cod-row span{font-size:10px;letter-spacing:.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#lobby .cod-row.big b{font-size:18px}#lobby .cod-row>i{font-size:20px;right:12px}#lobby .cod-row .stk-ic{width:17px;height:17px}
#lobby .cod-row .arw{right:8px;gap:4px}#lobby .cod-row .arw .mini{height:24px;min-width:24px;padding:0 6px}
#lobby .net-hint,#lobby .net-svc,#lobby .net-count,#lobby .net-lan{font-size:9.5px;line-height:1.4;letter-spacing:.08em;margin:2px 2px 0}#lobby .net-hint{color:var(--dim)}#lobby .net-svc{margin-top:4px}
#lobby .lob-chat .pz-chat{height:78px;font-size:11px}#lobby .lob-chat .pz-h{font-size:9.5px}#lobby .lob-chat .pz-row input{padding:6px 8px;font-size:12px}#lobby .lob-chat .pz-qc .btn{padding:4px 8px;font-size:10px}
#lobby .lob-chat{padding:8px 10px}
#lobby .net-off{border:0;padding:2px 2px 0;font-size:10px;line-height:1.4;color:var(--dim);opacity:.75;background:none}
#lobby .cod-roster{width:min(440px,100%);gap:8px}
#lobby .ros-h{font-size:9.5px}#lobby .ros-team .tn{padding:6px 10px;font-size:9.5px}
#lobby .cod-roster>.ros-team{display:grid;grid-template-columns:1fr 1fr}#lobby .cod-roster>.ros-team .tn{grid-column:1/-1}
#lobby .ros-p{padding:4px 10px;font-size:11px;letter-spacing:.08em;min-width:0;white-space:nowrap;overflow:hidden}#lobby .cod-roster>.ros-team .ros-p{border-right:1px solid rgba(255,255,255,.04)}
#lobby .ros-p em{font-size:8.5px}#lobby .ros-p .lv{width:20px;height:15px;font-size:9px}
#lobby .cod-roster>.ros-team .ros-p.wide{grid-column:1/-1}
#lobby .ros-info{padding:10px 12px;font-size:11.5px;line-height:1.45}#lobby .ros-info b{font-size:11px}
#lobby .cod-foot{padding:7px 2.4vw}
/* the zombies lobby has many more rows: two columns of them on a wider left side */
#lobby.zl .cod-lob{grid-template-columns:minmax(520px,760px) minmax(300px,1fr)}
#lobby.zl .cod-lcol{display:grid;grid-template-columns:1fr 1fr;grid-auto-flow:row dense;gap:6px;align-content:start}
#lobby.zl .cod-lcol>*:first-child,#lobby.zl .cod-lcol>.wide{grid-column:1/-1}
#lobby.zl .cod-lcol>*{min-width:0;margin:0}
#lobby.zl .cod-row b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#lobby.zl .cod-row.wide b span{display:inline;font-size:inherit;letter-spacing:inherit}
@media (max-width:1100px){#lobby.zl .cod-lob{grid-template-columns:1fr}}
@media (max-width:900px){#lobby .cod-lob{grid-template-columns:1fr}}
`; document.head.appendChild(s);
  // EXIT GAME joins the row of small buttons (it was in a box of its own under the news)
  try { const q = document.getElementById('quitBtn'), row = document.querySelector('#menu .cod-tiles'); if (q && row && q.parentNode !== row) { const old = q.parentNode; row.appendChild(q); if (old && !old.children.length) old.remove(); } if (row && window.ASHFALL_APP) row.classList.add('ex4'); } catch (e) {}
})();
