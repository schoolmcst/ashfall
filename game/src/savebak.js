/* ================================================================== save backup: your stats and setup can't be lost
   Everything the game saves (career stats, classes, settings, friends, callsign...) lives in localStorage. A second
   copy is kept in IndexedDB (a separate store, with its own space) and refreshed every few seconds of play. When the
   game starts and localStorage is missing something, or holds a career with fewer matches than the backup, the backup
   is put back and the page reloads once. Replays are kept in IndexedDB too, so they never crowd out the stats. */
const SB = { db: null, ready: null, last: '' };
const SB_KEEP = k => /^ashfall\./.test(k) || k === 'dz_seen_update';
SB.ready = new Promise(res => {
  try {
    const rq = indexedDB.open('darkzone-save', 1);
    rq.onupgradeneeded = () => { rq.result.createObjectStore('kv'); };
    rq.onsuccess = () => { SB.db = rq.result; res(SB.db); };
    rq.onerror = rq.onblocked = () => res(null);
  } catch (e) { res(null); }
});
function sbGet(key) { return SB.ready.then(db => db ? new Promise(r => { try { const q = db.transaction('kv').objectStore('kv').get(key); q.onsuccess = () => r(q.result); q.onerror = () => r(undefined); } catch (e) { r(undefined); } }) : undefined); }
function sbPut(key, val) { return SB.ready.then(db => db ? new Promise(r => { try { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(val, key); t.oncomplete = () => r(true); t.onerror = t.onabort = () => r(false); } catch (e) { r(false); } }) : false); }
function sbSnapshot() { const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (SB_KEEP(k)) o[k] = localStorage.getItem(k); } } catch (e) {} return o; }
// merge into the backup: a key that went missing keeps its saved copy, and a career never goes back to fewer matches
function sbBackup() {
  const o = Object.assign({}, SB.bak || {}), cur = sbSnapshot();
  for (const [k, v] of Object.entries(cur)) if (!(/^ashfall\.stats\./.test(k) && o[k] && sbMatches(o[k]) > sbMatches(v))) o[k] = v;
  const s = JSON.stringify(o); if (s === SB.last || s === '{}') return;
  SB.last = s; SB.bak = o; sbPut('local', { t: Date.now(), keys: o });
}
const sbMatches = raw => { try { const o = JSON.parse(raw || 'null'); return o ? (o.matches | 0) + (o.kills | 0) / 1e6 : -1; } catch (e) { return -1; } };
// on start: restore anything the backup has that localStorage lost
const sbRestored = sbGet('local').then(b => {
  if (!b || !b.keys) return false;
  SB.bak = Object.assign({}, b.keys);
  let changed = false;
  try {
    for (const [k, v] of Object.entries(b.keys)) {
      const cur = localStorage.getItem(k);
      const lost = cur === null || (/^ashfall\.stats\./.test(k) && sbMatches(v) > sbMatches(cur));
      if (lost && v !== null) { localStorage.setItem(k, v); changed = true; }
    }
  } catch (e) { return false; }
  if (changed) { let again = false; try { again = sessionStorage.getItem('dz_restored') === '1'; sessionStorage.setItem('dz_restored', '1'); } catch (e) {} if (!again) { location.reload(); return true; } }
  return false;
});
sbRestored.then(r => { if (!r) { sbBackup(); setInterval(sbBackup, 5000); addEventListener('pagehide', sbBackup); addEventListener('beforeunload', sbBackup); } });
