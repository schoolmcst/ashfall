// what the game page can ask the app for (nothing else from the computer is exposed)
const { contextBridge, ipcRenderer } = require('electron');
const info = ipcRenderer.sendSync('app-info');
let lan = [], lanT = 0;
contextBridge.exposeInMainWorld('ASHFALL_APP', {
  version: info.version, appVersion: info.appVersion, justUpdated: info.justUpdated, notes: info.notes,
  lan: {
    announce: g => ipcRenderer.send('lan-announce', { slot: String(g.slot), name: String(g.name), mode: String(g.mode), n: g.n | 0 }),
    games: () => { const now = Date.now(); if (now - lanT > 1500) { lanT = now; lan = ipcRenderer.sendSync('lan-games'); } return lan; },
  },
});
