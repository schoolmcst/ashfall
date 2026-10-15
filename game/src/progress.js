/* ================================================================== LEVELS, DZ, CAMOS & SKINS, LOCKER, REWARDS
   - Levels 1-100 from XP earned in matches (kills, headshots, objectives, finishing and winning; online x1.25)
   - Every level pays DZ; every 5th level gives a gun STICKER; level 100 gives the DARKZONE GOLD skin
   - Camos and the other skins only come from CHANCE BOXES (odds shown on screen), bought with DZ; duplicates pay
     DZ back. DZ is only ever earned in-game.
   - Camos (patterns), skins (finishes) and stickers are cosmetic only and work on every gun
   Saved under ashfall.prog.v1, so the save backup keeps it safe across updates. */
const PROG_KEY = 'ashfall.prog.v1', MAXLVL = 100, BOX_COST = 500;
const RAR = [
  { name: 'COMMON', col: '#a7b0b6', odds: 60, refund: 50 },
  { name: 'RARE', col: '#4aa3ff', odds: 27, refund: 150 },
  { name: 'EPIC', col: '#b46cff', odds: 10, refund: 400 },
  { name: 'LEGENDARY', col: '#f2b84b', odds: 3, refund: 1000 },
  { name: 'SECRET', col: '#ff2a4a', odds: 0.5, refund: 5000 },
];
// kind: camo = pattern, skin = finish. lvl: unlocked at that level, else found in chance boxes
const COSM = [
  // ---- DARKZONE GOLD is the max-level skin; everything else comes from chance boxes
  { id: 'woodland', name: 'WOODLAND', kind: 'camo', r: 0, g: { t: 'blobs', c: [0x4a5a32, 0x2f3b22, 0x6b6a3e, 0x1d211a] } },
  { id: 'desert', name: 'DESERT', kind: 'camo', r: 0, g: { t: 'blobs', c: [0xc2a878, 0x9c8158, 0xd8c49a, 0x6e5a3e] } },
  { id: 'arctic', name: 'ARCTIC', kind: 'camo', r: 0, g: { t: 'blobs', c: [0xdfe5ea, 0xb7c0c8, 0xf5f7f9, 0x8d98a3] } },
  { id: 'olive', name: 'OLIVE DRAB', kind: 'skin', r: 0, g: { t: 'solid', c: [0x4b5233], fx: 'grain' }, m: { rough: 0.75, metal: 0.05 } },
  { id: 'dragon', name: 'DRAGON SCALE', kind: 'camo', r: 2, g: { t: 'hex', c: [0x5a0f0c, 0x8e1a12, 0xc23a18, 0xf2b84b], line: 0xf2b84b }, m: { rough: 0.35, metal: 0.6 } },
  { id: 'urban', name: 'URBAN', kind: 'camo', r: 0, g: { t: 'blobs', c: [0x7d8288, 0x5a5f66, 0xa4a9ad, 0x34383d] } },
  { id: 'blackops', name: 'BLACK OPS', kind: 'skin', r: 0, g: { t: 'solid', c: [0x16171a], fx: 'grain' }, m: { rough: 0.8, metal: 0.1 } },
  { id: 'tiger', name: 'TIGER STRIPE', kind: 'camo', r: 1, g: { t: 'tiger', c: [0x5d6a3c, 0x1c2216, 0x8a8250] } },
  { id: 'hexolive', name: 'HEX OLIVE', kind: 'camo', r: 1, g: { t: 'hex', c: [0x3e4a2c, 0x4f5c37, 0x5f6b42, 0x2b3320], line: 0x1d2416 } },
  { id: 'rosegold', name: 'ROSE GOLD', kind: 'skin', r: 3, g: { t: 'solid', c: [0xd8957a], fx: 'engrave' }, m: { rough: 0.18, metal: 1 } },
  { id: 'cobalt', name: 'COBALT', kind: 'skin', r: 1, g: { t: 'solid', c: [0x1f4fa8], fx: 'brushed' }, m: { rough: 0.3, metal: 0.75 } },
  { id: 'redtiger', name: 'RED TIGER', kind: 'camo', r: 1, g: { t: 'tiger', c: [0x8e1d16, 0x1a0b09, 0xc24a2a] } },
  { id: 'digurban', name: 'DIGITAL URBAN', kind: 'camo', r: 1, g: { t: 'digital', c: [0x80858b, 0x55595f, 0xb0b4b8, 0x2d3034] } },
  { id: 'carbon', name: 'CARBON FIBER', kind: 'skin', r: 2, g: { t: 'carbon', c: [0x15171a, 0x3a3f46] }, m: { rough: 0.25, metal: 0.3 } },
  { id: 'inferno', name: 'INFERNO', kind: 'skin', r: 3, g: { t: 'marble', c: [0x120605, 0x2a0d08], glow: 0xff5a14, vein: 0.16 }, m: { rough: 0.45, metal: 0.2, anim: 'scroll', emis: 2.2 } },
  { id: 'damascus', name: 'DAMASCUS STEEL', kind: 'skin', r: 2, g: { t: 'damascus', c: [0x3a3d42, 0x9aa1a8] }, m: { rough: 0.22, metal: 1 } },
  { id: 'icemarble', name: 'ICE MARBLE', kind: 'skin', r: 2, g: { t: 'marble', c: [0xdfeef6, 0x7fb8d8], vein: 0.06 }, m: { rough: 0.15, metal: 0.1 } },
  { id: 'chrome', name: 'CHROME', kind: 'skin', r: 2, g: { t: 'solid', c: [0xd6dbe0], fx: 'bands' }, m: { rough: 0.06, metal: 1 } },
  { id: 'obsidian', name: 'OBSIDIAN', kind: 'skin', r: 2, g: { t: 'solid', c: [0x0b0b0e], fx: 'bands' }, m: { rough: 0.08, metal: 0.5 } },
  { id: 'dzgold', name: 'DARKZONE GOLD', kind: 'skin', r: 3, lvl: 100, g: { t: 'solid', c: [0xe9b949], fx: 'engrave' }, m: { rough: 0.14, metal: 1 } },
  { id: 'jungle', name: 'JUNGLE', kind: 'camo', r: 0, g: { t: 'blobs', c: [0x2c4a26, 0x1b2e17, 0x46663a, 0x0f1a0d] } },
  { id: 'night', name: 'NIGHT OPS', kind: 'camo', r: 0, g: { t: 'blobs', c: [0x2a3346, 0x1a2130, 0x3e4a63, 0x0e121b] } },
  { id: 'dwoods', name: 'DIGITAL WOODS', kind: 'camo', r: 0, g: { t: 'digital', c: [0x4c5a34, 0x323d24, 0x6f7448, 0x1f241a] } },
  { id: 'ddesert', name: 'DIGITAL DESERT', kind: 'camo', r: 0, g: { t: 'digital', c: [0xbfa577, 0x95794f, 0xd9c69c, 0x6a573a] } },
  { id: 'splgrey', name: 'SPLINTER', kind: 'camo', r: 0, g: { t: 'splinter', c: [0x6d7075, 0x4b4e52, 0x8e9196, 0x2f3134] } },
  { id: 'sandstorm', name: 'SANDSTORM', kind: 'camo', r: 0, g: { t: 'blobs', c: [0xa89c86, 0x857a66, 0xc4baa6, 0x5c5446] } },
  { id: 'digarctic', name: 'DIGITAL ARCTIC', kind: 'camo', r: 1, g: { t: 'digital', c: [0xe3e8ec, 0xaeb8c1, 0xffffff, 0x7d8a96] } },
  { id: 'splred', name: 'RED SPLINTER', kind: 'camo', r: 1, g: { t: 'splinter', c: [0x7a1c18, 0x4a100d, 0xa63326, 0x220807] } },
  { id: 'hexgrey', name: 'HEX STEEL', kind: 'camo', r: 1, g: { t: 'hex', c: [0x50555b, 0x62676e, 0x757a80, 0x3c4045], line: 0x22252a }, m: { rough: 0.4, metal: 0.55 } },
  { id: 'crimson', name: 'CRIMSON', kind: 'skin', r: 1, g: { t: 'solid', c: [0x9e1b1f], fx: 'brushed' }, m: { rough: 0.3, metal: 0.7 } },
  { id: 'leopard', name: 'LEOPARD', kind: 'camo', r: 1, g: { t: 'leopard', c: [0xc59a5a, 0x7a5228, 0x1e140b] } },
  { id: 'marble', name: 'WHITE MARBLE', kind: 'skin', r: 1, g: { t: 'marble', c: [0xe8e6e1, 0x5d5a55], vein: 0.05 }, m: { rough: 0.2, metal: 0.05 } },
  { id: 'sakura', name: 'SAKURA', kind: 'camo', r: 1, g: { t: 'blobs', c: [0xf0c9d4, 0xd98aa3, 0xfbe6ec, 0x9c4d66] } },
  { id: 'hexneon', name: 'NEON HEX', kind: 'camo', r: 2, g: { t: 'hex', c: [0x0d1117, 0x111821, 0x16202b, 0x0a0d12], line: 0x2ee6ff, glowLine: true }, m: { rough: 0.35, metal: 0.4, anim: 'pulse', emis: 2.4 } },
  { id: 'toxic', name: 'TOXIC', kind: 'camo', r: 2, g: { t: 'splinter', c: [0x1c2318, 0x2a3324, 0x0f130d, 0x7dff3a], glowIdx: 3 }, m: { rough: 0.5, metal: 0.1, anim: 'pulse', emis: 1.8 } },
  { id: 'magma', name: 'MAGMA', kind: 'skin', r: 2, g: { t: 'marble', c: [0x1a1412, 0x2c211c], glow: 0xff7a1a, vein: 0.09 }, m: { rough: 0.6, metal: 0.1, emis: 1.8 } },
  { id: 'diamond', name: 'DIAMOND', kind: 'skin', r: 3, g: { t: 'facets', c: [0x1d4f7a, 0xe6f6ff] }, m: { rough: 0.06, metal: 0.25, anim: 'twinkle', emis: 1.5 } },
  { id: 'plasma', name: 'PLASMA', kind: 'skin', r: 3, g: { t: 'plasma', c: [0x1a0638, 0x7a2cff, 0xff3cf0] }, m: { rough: 0.3, metal: 0.2, anim: 'scroll', emis: 2.0 } },
  { id: 'circuit', name: 'CIRCUIT', kind: 'skin', r: 3, g: { t: 'circuit', c: [0x0a1410, 0x39ff9c] }, m: { rough: 0.35, metal: 0.4, anim: 'scroll', emis: 2.6 } },
  { id: 'void', name: 'VOID', kind: 'skin', r: 3, g: { t: 'stars', c: [0x05040b, 0xffffff], dense: 0.012, nebula: 0x3a1c7a }, m: { rough: 0.25, metal: 0.3, anim: 'twinkle', emis: 2.0 } },
];
// ---- 100 more camos (chance boxes): [name, pattern, rarity, colours, extra pattern options, material options]
const CAMO_PACK = [
  ['FOREST FLECK', 'fleck', 0, [0x5b6b3a, 0x3b4a26, 0x7a7a48, 0x22281a]], ['DESERT FLECK', 'fleck', 0, [0xc4a97c, 0x9e8259, 0xdcc79c, 0x6d593c]], ['SNOW FLECK', 'fleck', 0, [0xe6ebef, 0xbcc5cd, 0x96a2ad, 0x6f7b86]],
  ['MULTI TERRAIN', 'multicam', 0, [0x8a7d5c, 0x6b6a45, 0x4e5636, 0xb7a77f]], ['ALPINE MULTI', 'multicam', 0, [0xdfe4e8, 0xb8c1c9, 0x8e9aa5, 0xffffff]], ['BLACK MULTI', 'multicam', 0, [0x2b2d30, 0x1a1b1d, 0x3c3f43, 0x0f1011]],
  ['DRY GRASS', 'brush', 0, [0xb9a46e, 0x8f7c4c, 0xd2c08a, 0x6a5a36]], ['RIVER REED', 'brush', 0, [0x5d6b45, 0x3f4a2e, 0x7d8a5c, 0x2a3220]], ['ASH', 'brush', 0, [0x6e6e6e, 0x4c4c4c, 0x8f8f8f, 0x2e2e2e]],
  ['MUD SPLAT', 'splat', 0, [0x6b5a42, 0x4a3d2c, 0x8a7558, 0x2d251a]], ['CONCRETE', 'splat', 0, [0x9a9a96, 0x7c7c78, 0xb5b5b1, 0x5a5a57]], ['GREY STRIPE', 'stripes', 0, [0x5a5f66, 0x3b3f45]],
  ['SAND STRIPE', 'stripes', 0, [0xc2a878, 0xa38b5f]], ['OLIVE CHECK', 'check', 0, [0x4b5233, 0x3a4027]], ['DUSK WAVES', 'waves', 0, [0x3a3f52, 0x4e5470, 0x2a2e3d]],
  ['TAN WAVES', 'waves', 0, [0xc8b48a, 0xb09a6c, 0x8f7c55]], ['TOPO GREEN', 'topo', 0, [0x55623f, 0x2f3824, 0x6b784f]], ['TOPO SAND', 'topo', 0, [0xc9b38a, 0x7a6544, 0xb39c70]],
  ['CRACKED EARTH', 'cracked', 0, [0x9c7b55, 0x4a3826, 0xb6956c]], ['SLATE TRI', 'tri', 0, [0x50565e, 0x5f666f, 0x434950, 0x6c737c]], ['FIELD TRI', 'tri', 0, [0x4c5a34, 0x5d6b42, 0x3d4a2a, 0x6b7650]],
  ['STONE SCALES', 'scales', 0, [0x77797c, 0x5a5c5f, 0x3a3c3e]], ['DARK FOREST', 'blobs', 0, [0x223321, 0x152214, 0x34482f, 0x0b130b]], ['AUTUMN', 'blobs', 0, [0x8a5a2b, 0x5e3a1a, 0xb07a3a, 0x3a2410]],
  ['SWAMP', 'blobs', 0, [0x4a4f2e, 0x2f3320, 0x666b3f, 0x1d2014]], ['COASTAL', 'blobs', 0, [0x7f8f96, 0x5d6c73, 0xa6b4ba, 0x3c484e]], ['MARSH', 'digital', 0, [0x5a5f3c, 0x3c4029, 0x787d52, 0x252818]],
  ['RUST DIGITAL', 'digital', 0, [0x8a4b2a, 0x5e321b, 0xa86a43, 0x3a1d0e]], ['NAVY DIGITAL', 'digital', 0, [0x2a3a55, 0x1b273b, 0x3e5172, 0x0f1622]], ['SAND SPLINTER', 'splinter', 0, [0xb8a27a, 0x8f7a55, 0xd0bd96, 0x655537]],
  ['GREEN SPLINTER', 'splinter', 0, [0x4f5d37, 0x37422a, 0x6a774b, 0x232b1a]], ['TAN DOTS', 'dots', 0, [0xbca57a, 0x8f7a55]], ['GREY ZEBRA', 'zebra', 0, [0x9a9ea3, 0x3a3d41]],
  ['GUNMETAL', 'solid', 0, [0x4a4f55], { fx: 'brushed' }, { rough: 0.35, metal: 0.8 }], ['DARK EARTH', 'solid', 0, [0x7d6a4f], { fx: 'grain' }, { rough: 0.8, metal: 0.05 }],
  ['TIGER ZEBRA', 'zebra', 1, [0xd9a441, 0x1c140a]], ['WHITE TIGER', 'zebra', 1, [0xeeeeee, 0x202020]], ['ICE MULTI', 'multicam', 1, [0xcfe8f5, 0x9cc8e0, 0x6aa3c4, 0xffffff]],
  ['RED FLECK', 'fleck', 1, [0x8e2a22, 0x5e1a14, 0xb5453a, 0x2e0b08]], ['BLUE FLECK', 'fleck', 1, [0x2c4f7c, 0x1c3555, 0x4a74a8, 0x0e1a2c]], ['PURPLE WAVES', 'waves', 1, [0x4a2a6a, 0x6b3f96, 0x2e1a44]],
  ['SUNSET WAVES', 'waves', 1, [0xe0703a, 0xf0a23c, 0xa83a4a, 0x5a1e3a]], ['OCEAN WAVES', 'waves', 1, [0x1f5f8b, 0x2f86b5, 0x174466, 0x7fc7e3]], ['MINT CHECK', 'check', 1, [0x8fd9b6, 0x4fa384]],
  ['RACING CHECK', 'check', 1, [0xf2f2f2, 0x111111]], ['CANDY STRIPE', 'stripes', 1, [0xf2f2f2, 0xd62e3a]], ['HAZARD', 'stripes', 1, [0xf2c230, 0x151515]],
  ['BLUE TRI', 'tri', 1, [0x1e3a6b, 0x2c5291, 0x16294a, 0x3f6fb8]], ['AMBER TRI', 'tri', 1, [0xb06a1c, 0xd38a2e, 0x7e4a12, 0xe8a84a]], ['COPPER SCALES', 'scales', 1, [0xc07a46, 0x8a4f26, 0x4a2a12], {}, { rough: 0.3, metal: 0.8 }],
  ['JADE SCALES', 'scales', 1, [0x3f9b74, 0x256b4f, 0x123a2a]], ['POP SPLAT', 'splat', 1, [0xf2f2f2, 0xe63946, 0x1d70b8, 0xf4c430]], ['INK SPLAT', 'splat', 1, [0xe8e4da, 0x111111, 0x333333]],
  ['TOPO RED', 'topo', 1, [0x6a1e1a, 0xe0a080, 0x8a2a22]], ['TOPO BLUE', 'topo', 1, [0x1a2f4a, 0x8ec5ff, 0x24406a]], ['BRUSH RED', 'brush', 1, [0x7a1c18, 0x4a100d, 0xa63326, 0x220807]],
  ['BRUSH BLUE', 'brush', 1, [0x1f3b63, 0x132640, 0x2f5a94, 0x0b1525]], ['PINK DIGITAL', 'digital', 1, [0xf0b6c8, 0xd6829f, 0xfbe2ea, 0x9c4d66]], ['LIME DIGITAL', 'digital', 1, [0x9fd13a, 0x6a9a1e, 0xc8ef6a, 0x3a5a0e]],
  ['AQUA FADE', 'fade', 1, [0x1fa3a3, 0x8a3ad6]], ['FIRE FADE', 'fade', 1, [0xd62e1f, 0xf2c230]], ['POLKA', 'dots', 1, [0x151515, 0xf2f2f2]],
  ['CRACKED ICE', 'cracked', 1, [0xcfeaf7, 0x5aa6cf, 0xeaf7ff]], ['HONEY GOLD', 'honey', 1, [0xd99a2b, 0xf2c25a, 0x6a4210], {}, { rough: 0.3, metal: 0.6 }], ['GRAPHITE HONEY', 'honey', 1, [0x3a3d42, 0x5a5e64, 0x1a1c1f], {}, { rough: 0.35, metal: 0.6 }],
  ['NEON WAVES', 'waves', 2, [0x0b0d1a, 0x1a1f3a, 0x00e5ff], { glowIdx: 2 }, { anim: 'scroll', emis: 2 }], ['NEON STRIPES', 'stripes', 2, [0x0b0b10, 0xff2fd6], { glowIdx: 1 }, { anim: 'pulse', emis: 2 }],
  ['LAVA CRACK', 'cracked', 2, [0x1a0d08, 0xff6a14, 0x2a140c], { glow: 1 }, { anim: 'pulse', emis: 2.2 }], ['TOXIC HONEY', 'honey', 2, [0x111a10, 0x1c2a1a, 0x7dff3a], { glow: 1 }, { anim: 'pulse', emis: 2 }],
  ['CYBER TRI', 'tri', 2, [0x0d1220, 0x16203a, 0x1f2d52, 0x00b8d9]], ['GLITCH', 'glitch', 2, [0x0b0c10, 0x1a1d26, 0xff2fd6, 0x00e5ff], { glow: 1 }, { anim: 'scroll', emis: 2 }],
  ['RGB GLITCH', 'glitch', 2, [0x0d0d0d, 0xff3030, 0x30ff60, 0x3080ff], { glow: 1 }, { emis: 1.8 }], ['SYNTHWAVE', 'fade', 2, [0xff2fd6, 0x2a1aa8], { glow: 1 }, { anim: 'scroll', emis: 1.2 }],
  ['AURORA', 'fade', 2, [0x1fd6a3, 0x5a2ad6], { glow: 1 }, { anim: 'scroll', emis: 1.2 }], ['TOPO NEON', 'topo', 2, [0x07120f, 0x39ff9c, 0x0d1f1a], { glow: 1 }, { anim: 'pulse', emis: 2.2 }],
  ['GOLD SCALES', 'scales', 2, [0xe6b84a, 0xa07820, 0x5a3e0a], {}, { rough: 0.22, metal: 0.85 }], ['DRAGON FLECK', 'fleck', 2, [0x5a0f0c, 0xc23a18, 0xf2b84b, 0x220504]],
  ['CAMO GOLD', 'multicam', 2, [0xc9a24a, 0x8a6a24, 0x5e4614, 0xf2d27a], {}, { rough: 0.3, metal: 0.7 }], ['CHROME TIGER', 'zebra', 2, [0xdfe4e8, 0x2a2d31], {}, { rough: 0.1, metal: 0.9 }],
  ['BLOOD SPLAT', 'splat', 2, [0x1a1a1a, 0x8e0f12, 0xc21a1f]], ['MIDNIGHT DOTS', 'dots', 2, [0x0b0f1f, 0x7fa8ff], { glow: 1 }, { anim: 'twinkle', emis: 1.8 }],
  ['ARCTIC CRACK', 'cracked', 2, [0xeaf4fa, 0x4aa8e0, 0xd0e6f2], { glow: 1 }, { anim: 'pulse', emis: 1.4 }], ['DUNE HONEY', 'honey', 2, [0xb89a6a, 0xd2b98a, 0x5a4428]],
  ['COBRA', 'scales', 2, [0x2a4a1a, 0x1a2e10, 0xd9c23a]], ['NEON BRUSH', 'brush', 2, [0x0d0d14, 0x2a1a44, 0xff2fd6, 0x00e5ff]],
  ['PIXEL STORM', 'digital', 2, [0x2a1a44, 0x4a2a7a, 0x00e5ff, 0x0d0a18]], ['HOLOFOIL', 'holo', 2, [0x000000], { dark: 0.1 }, { anim: 'scroll', emis: 0.8, rough: 0.2, metal: 0.5 }],
  ['PRISM', 'holo', 3, [0x000000], { dark: 0 }, { anim: 'scroll', emis: 1.3, rough: 0.12, metal: 0.6 }], ['BLACK HOLO', 'holo', 3, [0x050505], { dark: 0.55 }, { anim: 'scroll', emis: 1.4, rough: 0.15, metal: 0.6 }],
  ['SOLAR FLARE', 'plasma', 3, [0x2a0600, 0xff5a14, 0xffe14d], {}, { anim: 'scroll', emis: 2 }], ['OCEANIC', 'plasma', 3, [0x021a2a, 0x0aa3c4, 0x9ef0ff], {}, { anim: 'scroll', emis: 2 }],
  ['VENOM', 'plasma', 3, [0x061a06, 0x39d61a, 0xc8ff3a], {}, { anim: 'scroll', emis: 2 }], ['NEON CIRCUIT', 'circuit', 3, [0x0a0612, 0xff2fd6], {}, { anim: 'scroll', emis: 2.6 }],
  ['GOLD CIRCUIT', 'circuit', 3, [0x120d04, 0xf2c14e], {}, { anim: 'scroll', emis: 2.2, metal: 0.6 }], ['STARFALL', 'stars', 3, [0x05060f, 0xffffff], { dense: 0.02, nebula: 0x1a4a8a }, { anim: 'twinkle', emis: 2 }],
  ['MOLTEN GOLD', 'marble', 3, [0x3a2a0a, 0x6a4e14], { glow: 0xffd23f, vein: 0.12 }, { anim: 'scroll', emis: 2, metal: 0.5 }], ['FROSTBITE', 'facets', 3, [0x3a6f9a, 0xf2fbff], {}, { anim: 'twinkle', emis: 1.4, rough: 0.05, metal: 0.5 }],
  ['EMERALD', 'facets', 3, [0x0e5a3a, 0x7af2c0], {}, { anim: 'twinkle', emis: 1.4, rough: 0.05, metal: 0.5 }], ['RUBY', 'facets', 3, [0x6a0a16, 0xff8aa0], {}, { anim: 'twinkle', emis: 1.4, rough: 0.05, metal: 0.5 }],
  ['OBSIDIAN FLAME', 'cracked', 3, [0x08080a, 0xff4a14, 0x18181c], { glow: 1 }, { anim: 'pulse', emis: 2.4 }],
];
// ---- SECRET set: never shown anywhere until you own one, 0.5% from any box, locked to the gun it dropped for
const SECRET_PACK = [
  ['BLOODLINE', 'plasma', [0x0a0000, 0x8e0000, 0xff2a2a], {}, { anim: 'scroll', emis: 2.4 }], ['ECLIPSE', 'stars', [0x000000, 0xffd27a], { dense: 0.05, nebula: 0xb07a18 }, { anim: 'twinkle', emis: 2.2 }],
  ['SPECTRE', 'holo', [0x000000], { dark: 0.3 }, { anim: 'scroll', emis: 2, rough: 0.1, metal: 0.7 }], ['ABYSS', 'marble', [0x020208, 0x0a0a1a], { glow: 0x3a5aff, vein: 0.1 }, { anim: 'scroll', emis: 2.4 }],
  ['ARCHANGEL', 'facets', [0xd9c08a, 0xffffff], {}, { anim: 'twinkle', emis: 1.6, rough: 0.05, metal: 0.9 }], ['REAPER', 'circuit', [0x050505, 0xff1a1a], {}, { anim: 'scroll', emis: 2.8 }],
];
const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '_');
for (const [name, t, r, c, gx, mx] of CAMO_PACK) COSM.push({ id: 'c_' + slug(name), name, kind: 'camo', r, g: Object.assign({ t, c }, gx || {}), m: mx });
for (const [name, t, c, gx, mx] of SECRET_PACK) COSM.push({ id: 'x_' + slug(name), name, kind: 'camo', r: 4, secret: true, g: Object.assign({ t, c }, gx || {}), m: mx });
// ---- gun STICKERS: one every 5 levels (level 100 is the DARKZONE GOLD skin above)
const STICKER_DEFS = [
  [5, 'gg', 'GG', 0, 'text', ['#ffffff', '#16a34a'], 'GG'], [10, 'star', 'LONE STAR', 0, 'star', ['#f2c94c', '#8a5a00']], [15, 'bolt', 'LIGHTNING', 0, 'bolt', ['#ffe14d', '#1f2937']], [20, 'target', 'BULLSEYE', 0, 'target', ['#ef4444', '#ffffff']],
  [25, 'skull', 'SKULL', 1, 'skull', ['#f3f0e6', '#111111']], [30, 'ace', 'ACE OF SPADES', 1, 'spade', ['#111111', '#ffffff']], [35, 'beta', 'BETA TESTER', 1, 'text', ['#0b0c0d', '#e0b44a'], 'BETA'], [40, 'flame', 'FLAME', 1, 'flame', ['#ff5a14', '#ffd23f']], [45, 'shield', 'SHIELD', 1, 'shield', ['#2563eb', '#f8fafc']],
  [50, 'wings', 'WINGS', 2, 'wings', ['#e5e7eb', '#e0b44a']], [55, 'rad', 'RADIATION', 2, 'rad', ['#facc15', '#111111']], [60, 'eye', 'ALL SEEING EYE', 2, 'eye', ['#7c3aed', '#f5f3ff']], [65, 'hs', 'HEADSHOT', 2, 'text', ['#ffffff', '#dc2626'], 'HEADSHOT'], [70, 'crown', 'CROWN', 2, 'crown', ['#f2b84b', '#b91c1c']],
  [75, 'dzlogo', 'DZ EMBLEM', 3, 'dz', ['#e0b44a', '#0b0c0d']], [80, 'phoenix', 'PHOENIX', 3, 'phoenix', ['#ff6a1a', '#ffd23f']], [85, 'gem', 'DIAMOND', 3, 'gem', ['#7dd3fc', '#e0f2fe']], [90, 'gskull', 'GOLD SKULL', 3, 'skull', ['#f2c14e', '#3b2a05']], [95, 'vet', 'VETERAN', 3, 'text', ['#0b0c0d', '#f2b84b'], 'VETERAN'],
];
for (const [lvl, id, name, r, d, c, txt] of STICKER_DEFS) COSM.push({ id: 'st_' + id, name, kind: 'sticker', r, lvl, g: { t: 'sticker', d, c, txt } });
const COS = Object.fromEntries(COSM.map(c => [c.id, c]));
const LEVEL_ITEM = Object.fromEntries(COSM.filter(c => c.lvl).map(c => [c.lvl, c.id]));
const BOX_POOL = COSM.filter(c => !c.lvl && c.kind !== 'sticker' && !c.secret);

/* ---------- saved progress */
const progBlank = () => ({ v: 1, xp: 0, dz: 0, owned: {}, equip: { all: null, guns: {} }, stk: { all: null, guns: {} }, daily: { last: '', streak: 0 }, boxes: 0, drops: [], lastGain: null, init: false });
let PROG = progBlank();
try { const o = JSON.parse(localStorage.getItem(PROG_KEY) || 'null'); if (o && o.v === 1) PROG = Object.assign(progBlank(), o, { equip: Object.assign({ all: null, guns: {} }, o.equip || {}), stk: Object.assign({ all: null, guns: {} }, o.stk || {}) }); } catch (e) {}
function saveProg() { try { localStorage.setItem(PROG_KEY, JSON.stringify(PROG)); } catch (e) {} }

/* ---------- XP curve: level n -> n+1 takes 1000 + 100*(n-1) XP (level 100 is about 180 matches) */
const xpNeed = l => 1000 + 100 * (l - 1);
const XP_AT = (() => { const a = [0, 0]; for (let l = 1; l < MAXLVL; l++) a[l + 1] = a[l] + xpNeed(l); return a; })();
function lvlOf(xp) { let l = 1; while (l < MAXLVL && xp >= XP_AT[l + 1]) l++; return l; }
function lvlInfo(xp) { const l = lvlOf(xp); if (l >= MAXLVL) return { l, into: 1, need: 1, frac: 1 }; const into = xp - XP_AT[l], need = xpNeed(l); return { l, into, need, frac: into / need }; }
const levelDz = l => 100 + (l % 10 === 0 ? 250 : 0);
// pay out every level between two XP totals: DZ, plus the level item
function grantLevels(fromXp, toXp) {
  const a = lvlOf(fromXp), b = lvlOf(toXp), out = { dz: 0, items: [], from: a, to: b };
  for (let l = a + 1; l <= b; l++) { out.dz += levelDz(l); const it = LEVEL_ITEM[l]; if (it && !PROG.owned[it]) { PROG.owned[it] = Date.now(); out.items.push(it); } }
  PROG.dz += out.dz; return out;
}
// first run: a welcome box, and past careers count toward a starting level (capped at 25)
if (!PROG.init) {
  try {
    const st = [STATS, STATS_ON], k = st.reduce((s, x) => s + (x.kills | 0), 0), m = st.reduce((s, x) => s + (x.matches | 0), 0), w = st.reduce((s, x) => s + (x.wins | 0), 0);
    const xp = Math.min(XP_AT[25], k * 60 + m * 300 + w * 500); PROG.xp = xp; const g = grantLevels(0, xp);
    PROG.welcome = { xp, lvl: g.to, items: g.items };
  } catch (e) {}
  PROG.dz += BOX_COST; PROG.init = true; saveProg();
}

/* ---------- match XP (called when a match is filed in the career) */
function progMatchXP(won, partial) {
  if (!MS || G.bench) return null;
  const online = !!(M && M.online), rows = [];
  const add = (label, n) => { if (n > 0) rows.push([label, Math.round(n)]); };
  add('KILLS ×' + MS.kills, MS.kills * 100);
  add('HEADSHOTS ×' + MS.heads, MS.heads * 50);
  const obj = (MS.plants | 0) + (MS.defuses | 0) + (MS.caps | 0) + (MS.returns | 0);
  add('OBJECTIVES ×' + obj, obj * 250);
  add('HARDPOINT TIME', (MS.hpTime | 0) * 5);
  if (!partial) {
    if (M && M.mode === 'surv') add('WAVES SURVIVED', (G.wave | 0) * 150);
    else { add('MATCH COMPLETE', 500); if (won === 1) add('VICTORY', 1000); else if (won === 0) add('DRAW', 400); }
  }
  let sum = rows.reduce((s, r) => s + r[1], 0);
  if (online && sum) { const b = Math.round(sum * 0.25); rows.push(['ONLINE BONUS +25%', b]); sum += b; }
  if (!sum) return null;
  const before = PROG.xp; PROG.xp = Math.min(XP_AT[MAXLVL], PROG.xp + sum);
  const g = grantLevels(before, PROG.xp);
  PROG.lastGain = { xp: sum, rows, before, after: PROG.xp, from: g.from, to: g.to, dz: g.dz, items: g.items, t: Date.now() };
  saveProg(); return PROG.lastGain;
}
function progResultsHtml(gain) {
  if (!gain) return '';
  const a = lvlInfo(gain.before), b = lvlInfo(gain.after), up = gain.to > gain.from;
  return `<div class="pg-res"><div class="pg-res-h"><b>+${gain.xp.toLocaleString()} XP</b>${up ? `<em>LEVEL UP · ${gain.from} → ${gain.to}</em>` : ''}</div>
<div class="pg-res-bar"><span class="pg-lv">${b.l}</span><div class="pg-bar"><i style="width:${(up ? 0 : a.frac) * 100}%"></i><s style="width:${b.frac * 100}%"></s></div><span class="pg-lv nx">${Math.min(MAXLVL, b.l + 1)}</span></div>
<div class="pg-res-rows">${gain.rows.map(r => `<span>${r[0]}<b>+${r[1].toLocaleString()}</b></span>`).join('')}</div>
${up ? `<div class="pg-res-up">+${gain.dz} DZ${gain.items.map(id => ` · <i style="color:${RAR[COS[id].r].col}">${COS[id].name}</i> UNLOCKED`).join('')}</div>` : ''}</div>`;
}
// level badge + XP bar + DZ for the player cards
function progCardHtml() {
  const i = lvlInfo(PROG.xp);
  return `<div class="pg-card"><span class="pg-badge">${i.l}</span><div class="pg-cardr"><div class="pg-bar sm"><s style="width:${i.frac * 100}%"></s></div><small>${i.l >= MAXLVL ? 'MAX LEVEL' : `${i.into.toLocaleString()} / ${i.need.toLocaleString()} XP`}</small></div><span class="pg-dz">${dzIcon()}${PROG.dz.toLocaleString()}</span></div>`;
}
const dzIcon = () => '<i class="dzi">DZ</i>';

/* ---------- camo / skin textures (tile seamlessly; generated once per item and size) */
const COS_TEX = {}, COS_MAT = {}, COS_ANIM = [];
const hx3 = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const strHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
function fbmT(R, base, oct) { const fs = []; for (let i = 0; i < oct; i++) fs.push(tileNoise(base << i, R)); return (x, y) => { let a = 0, amp = 0.5, t = 0; for (const f of fs) { a += f(x, y) * amp; t += amp; amp *= 0.5; } return a / t; }; }
// wrapped nearest points (Voronoi) for splinter / leopard
function wrapPts(R, n) { const p = []; for (let i = 0; i < n; i++) p.push([R(), R(), (R() * 4) | 0]); return p; }
function nearest(p, u, v, cheb) {
  let d1 = 9, d2 = 9, k = 0;
  for (let i = 0; i < p.length; i++) { let dx = Math.abs(u - p[i][0]), dy = Math.abs(v - p[i][1]); if (dx > 0.5) dx = 1 - dx; if (dy > 0.5) dy = 1 - dy; const d = cheb ? Math.max(dx * 1.4, dy) + Math.min(dx, dy) * 0.25 : Math.hypot(dx, dy); if (d < d1) { d2 = d1; d1 = d; k = i; } else if (d < d2) d2 = d; }
  return { d1, d2, k };
}
// fn(u, v) -> [r, g, b, glow 0..1]
function cosmPaint(c, N) {
  const g = c.g, R = makeRng(strHash(c.id)), C = (g.c || []).map(hx3), mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  let fn;
  if (g.t === 'blobs' || g.t === 'digital') {
    const n1 = fbmT(R, 3, 3), n2 = fbmT(R, 4, 3), n3 = fbmT(R, 6, 2), q = g.t === 'digital' ? 40 : 0;
    fn = (u, v) => { if (q) { u = Math.floor(u * q) / q; v = Math.floor(v * q) / q; } let col = C[0]; if (n1(u, v) > 0.54) col = C[1]; if (n2(u, v) > 0.6) col = C[2]; if (n3(u, v) > 0.64) col = C[3]; return [col[0], col[1], col[2], 0]; };
  } else if (g.t === 'tiger') {
    const n = fbmT(R, 4, 3), m = fbmT(R, 5, 2);
    fn = (u, v) => { const s = Math.sin((u * 5 + n(u, v) * 1.1 + v * 1) * Math.PI * 2); const col = s > 0.35 && m(u, v) > 0.36 ? C[1] : s < -0.75 ? C[2] : C[0]; return [col[0], col[1], col[2], 0]; };
  } else if (g.t === 'hex') {
    const cols = 8, rows = 10, shade = []; for (let i = 0; i < cols * rows; i++) shade.push((R() * 3) | 0);
    const L = hx3(g.line || 0x000000);
    fn = (u, v) => {
      const X = u * cols, Y = v * rows; let d1 = 9, d2 = 9, k = 0;
      for (let j = Math.floor(Y) - 1; j <= Math.floor(Y) + 1; j++) for (let i = Math.floor(X) - 1; i <= Math.floor(X) + 1; i++) {
        const cx = i + 0.5 + (((j % 2) + 2) % 2) * 0.5, cy = j + 0.5, d = Math.hypot(X - cx, (Y - cy) * 1.15);
        if (d < d1) { d2 = d1; d1 = d; k = (((i % cols) + cols) % cols) + (((j % rows) + rows) % rows) * cols; } else if (d < d2) d2 = d;
      }
      const edge = d2 - d1 < 0.09, col = edge ? L : C[shade[k]];
      return [col[0], col[1], col[2], edge && g.glowLine ? 1 : 0];
    };
  } else if (g.t === 'splinter') {
    const p = wrapPts(R, 26);
    fn = (u, v) => { const r = nearest(p, u, v, true), idx = p[r.k][2], col = C[idx]; return [col[0], col[1], col[2], g.glowIdx === idx ? 1 : 0]; };
  } else if (g.t === 'leopard') {
    const p = wrapPts(R, 20), n = fbmT(R, 8, 2);
    fn = (u, v) => { const r = nearest(p, u, v, false), w = 0.07 + n(u, v) * 0.03, col = r.d1 < w * 0.55 ? C[1] : r.d1 < w ? C[2] : C[0]; return [col[0], col[1], col[2], 0]; };
  } else if (g.t === 'carbon') {
    fn = (u, v) => { const P = 24, cx = Math.floor(u * P), cy = Math.floor(v * P), fu = u * P - cx, fv = v * P - cy, d = (cx + cy) & 1; const s = d ? Math.sin(fu * Math.PI) : Math.sin(fv * Math.PI); const col = mix(C[0], C[1], 0.15 + s * 0.6); return [col[0], col[1], col[2], 0]; };
  } else if (g.t === 'damascus') {
    const n = fbmT(R, 3, 4);
    fn = (u, v) => { const t = 0.5 + 0.5 * Math.sin((v * 9 + n(u, v) * 2.4) * Math.PI * 2); const col = mix(C[0], C[1], Math.pow(t, 2.2)); return [col[0], col[1], col[2], 0]; };
  } else if (g.t === 'marble') {
    const n = fbmT(R, 3, 5), G2 = g.glow ? hx3(g.glow) : null, vw = g.vein || 0.06;
    fn = (u, v) => { const t = Math.abs(Math.sin((u * 2 + v * 3 + n(u, v) * 3.2) * Math.PI)); const b = mix(C[0], C[1], n(v, u) * 0.6); if (t < vw) { const k = 1 - t / vw; if (G2) { const col = mix(b, G2, k); return [col[0], col[1], col[2], k]; } const col = mix(b, C[1], k); return [col[0], col[1], col[2], 0]; } return [b[0], b[1], b[2], 0]; };
  } else if (g.t === 'stars') {
    const n = fbmT(R, 3, 4), neb = g.nebula ? hx3(g.nebula) : null, cells = 64, star = new Float32Array(cells * cells); for (let i = 0; i < star.length; i++) star[i] = R() < (g.dense || 0.02) ? 0.4 + R() * 0.6 : 0;
    fn = (u, v) => { const cx = Math.floor(u * cells), cy = Math.floor(v * cells), fu = u * cells - cx - 0.5, fv = v * cells - cy - 0.5, s = star[cy * cells + cx], k = s ? Math.max(0, 1 - Math.hypot(fu, fv) * 3.2) * s : 0; let b = C[0]; if (neb) b = mix(b, neb, Math.max(0, n(u, v) - 0.45) * 2.2); if (g.light) b = mix(C[0], [255, 255, 255], n(u, v) * 0.3); const col = mix(b, C[1], k); return [col[0], col[1], col[2], k]; };
  } else if (g.t === 'plasma') {
    const n = fbmT(R, 3, 4), m = fbmT(R, 2, 3);
    fn = (u, v) => { const t = 0.5 + 0.5 * Math.sin((n(u, v) * 3 + m(u, v) * 2) * Math.PI * 2); const col = t < 0.5 ? mix(C[0], C[1], t * 2) : mix(C[1], C[2], (t - 0.5) * 2); return [col[0], col[1], col[2], Math.max(0, t - 0.35) * 1.4]; };
  } else if (g.t === 'circuit') {
    const P = 16, h = [], vv = [], pads = []; for (let i = 0; i < P * P; i++) { h.push(R() < 0.45); vv.push(R() < 0.4); pads.push(R() < 0.12); }
    fn = (u, v) => { const cx = Math.floor(u * P), cy = Math.floor(v * P), fu = u * P - cx, fv = v * P - cy, i = cy * P + cx; let on = (h[i] && Math.abs(fv - 0.5) < 0.07) || (vv[i] && Math.abs(fu - 0.5) < 0.07); if (pads[i] && Math.hypot(fu - 0.5, fv - 0.5) < 0.18) on = true; const col = on ? C[1] : C[0]; return [col[0], col[1], col[2], on ? 1 : 0]; };
  } else if (g.t === 'facets') {   // cut gem: flat facets lit from one side, bright edges, sparkles
    const p = wrapPts(R, 34), sh = p.map(() => Math.pow(R(), 1.6) * 1.1), sp = fbmT(R, 32, 1);
    fn = (u, v) => { const r = nearest(p, u, v, false), k = sh[r.k], edge = r.d2 - r.d1 < 0.012; let col = mix(C[0], C[1], Math.min(1, k)); if (k > 0.95) col = mix(col, [255, 255, 255], (k - 0.95) * 3); if (edge) col = mix(col, [255, 255, 255], 0.75); const s2 = sp(u, v) > 0.83 ? (sp(u, v) - 0.83) * 6 : 0; if (s2) col = mix(col, [255, 255, 255], Math.min(1, s2)); return [col[0], col[1], col[2], Math.min(1, (edge ? 0.35 : 0) + s2)]; };
  } else if (g.t === 'zebra') {
    const n = fbmT(R, 3, 4);
    fn = (u, v) => { const s2 = Math.sin((u * 6 + n(u, v) * 2.6) * Math.PI * 2); const col = s2 > 0.1 ? C[1] : C[0]; return [col[0], col[1], col[2], 0]; };
  } else if (g.t === 'fleck') {   // flecktarn: clusters of small dots
    const a = fbmT(R, 16, 2), b = fbmT(R, 20, 2), c2 = fbmT(R, 24, 2), m = fbmT(R, 3, 2);
    fn = (u, v) => { let col = C[0]; if (a(u, v) > 0.6 && m(u, v) > 0.4) col = C[1]; if (b(u, v) > 0.62) col = C[2]; if (c2(u, v) > 0.66 && m(v, u) > 0.45) col = C[3]; return [col[0], col[1], col[2], 0]; };
  } else if (g.t === 'multicam') {   // soft blended blobs with small brush marks
    const a = fbmT(R, 3, 4), b = fbmT(R, 5, 3), c2 = fbmT(R, 12, 2);
    fn = (u, v) => { const t1 = Math.min(1, Math.max(0, (a(u, v) - 0.45) * 5)), t2 = Math.min(1, Math.max(0, (b(u, v) - 0.55) * 6)); let col = mix(mix(C[0], C[1], t1), C[2], t2); if (c2(u, v) > 0.7) col = C[3]; return [col[0], col[1], col[2], 0]; };
  } else if (g.t === 'waves') {
    const n = fbmT(R, 2, 3), k = C.length;
    fn = (u, v) => { const t = ((v * 4 + Math.sin(u * Math.PI * 2 * 2) * 0.35 + n(u, v) * 0.6) % 1 + 1) % 1, col = C[Math.floor(t * k) % k]; return [col[0], col[1], col[2], g.glowIdx !== undefined && Math.floor(t * k) % k === g.glowIdx ? 1 : 0]; };
  } else if (g.t === 'glitch') {   // horizontal bars and offset blocks
    const rows = 48, bars = []; for (let i = 0; i < rows; i++) bars.push([R(), (R() * C.length) | 0, R() * 0.5]);
    fn = (u, v) => { const i = Math.floor(v * rows), b = bars[i], seg = Math.floor(((u + b[2]) % 1) * 6), on = (seg + i) % 3 === 0 && b[0] > 0.45, col = on ? C[b[1]] : C[0]; return [col[0], col[1], col[2], on && b[1] === C.length - 1 && g.glow ? 1 : 0]; };
  } else if (g.t === 'tri') {   // triangle grid
    const P = 8, sh = []; for (let i = 0; i < P * P * 2; i++) sh.push((R() * C.length) | 0);
    fn = (u, v) => { const X = u * P, Y = v * P, cx = Math.floor(X), cy = Math.floor(Y), up = (X - cx) + (Y - cy) < 1 ? 0 : 1, idx = sh[(cy * P + cx) * 2 + up], col = C[idx]; return [col[0], col[1], col[2], 0]; };
  } else if (g.t === 'honey') {   // bevelled honeycomb
    const cols = 10, rows = 12;
    fn = (u, v) => { const X = u * cols, Y = v * rows; let d1 = 9, d2 = 9, cxB = 0, cyB = 0; for (let j = Math.floor(Y) - 1; j <= Math.floor(Y) + 1; j++) for (let i = Math.floor(X) - 1; i <= Math.floor(X) + 1; i++) { const cx = i + 0.5 + (((j % 2) + 2) % 2) * 0.5, cy = j + 0.5, d = Math.hypot(X - cx, (Y - cy) * 1.15); if (d < d1) { d2 = d1; d1 = d; cxB = X - cx; cyB = Y - cy; } else if (d < d2) d2 = d; } const e = d2 - d1, bev = e < 0.1 ? 0 : e < 0.22 ? 0.5 + (cxB - cyB) * 0.8 : 0.8; const col = e < 0.1 ? C[2] : mix(C[0], C[1], Math.min(1, Math.max(0, bev))); return [col[0], col[1], col[2], e < 0.1 && g.glow ? 1 : 0]; };
  } else if (g.t === 'brush') {   // long brush strokes
    const a = tileNoise(3, R, 40), b = tileNoise(4, R, 48), c2 = tileNoise(5, R, 56);
    fn = (u, v) => { let col = C[0]; if (a(u, v) > 0.6) col = C[1]; if (b(u, v) > 0.64) col = C[2]; if (c2(u, v) > 0.7) col = C[3] || C[1]; return [col[0], col[1], col[2], 0]; };
  } else if (g.t === 'fade') {   // two-tone fade with grain
    const n = fbmT(R, 4, 3);
    fn = (u, v) => { const t = Math.min(1, Math.max(0, 0.5 + 0.5 * Math.sin(u * Math.PI * 2) + (n(u, v) - 0.5) * 0.5)), col = mix(C[0], C[1], t); return [col[0], col[1], col[2], g.glow ? t * 0.8 : 0]; };
  } else if (g.t === 'check') {
    const n = fbmT(R, 3, 3);
    fn = (u, v) => { const P = 8, w = (n(u, v) - 0.5) * 0.25, on = (Math.floor((u + w) * P) + Math.floor((v - w) * P)) & 1, col = on ? C[1] : C[0]; return [col[0], col[1], col[2], 0]; };
  } else if (g.t === 'dots') {
    fn = (u, v) => { const P = 10, fu = u * P % 1 - 0.5, fv = (v * P + (Math.floor(u * P) & 1) * 0.5) % 1 - 0.5, on = Math.hypot(fu, fv) < 0.28, col = on ? C[1] : C[0]; return [col[0], col[1], col[2], on && g.glow ? 1 : 0]; };
  } else if (g.t === 'splat') {   // paint splatter
    const p = wrapPts(R, 40), rs = p.map(() => 0.012 + R() * 0.05);
    fn = (u, v) => { let col = C[0]; for (let i = 0; i < p.length; i++) { let dx = Math.abs(u - p[i][0]), dy = Math.abs(v - p[i][1]); if (dx > 0.5) dx = 1 - dx; if (dy > 0.5) dy = 1 - dy; if (dx * dx + dy * dy < rs[i] * rs[i]) { col = C[1 + (p[i][2] % (C.length - 1))]; break; } } return [col[0], col[1], col[2], 0]; };
  } else if (g.t === 'stripes') {
    fn = (u, v) => { const t = ((u + v) * 6 % 1 + 1) % 1, k = C.length, col = C[Math.floor(t * k)]; return [col[0], col[1], col[2], g.glowIdx !== undefined && Math.floor(t * k) === g.glowIdx ? 1 : 0]; };
  } else if (g.t === 'topo') {   // contour lines
    const n = fbmT(R, 3, 4);
    fn = (u, v) => { const h = n(u, v) * 14, line = Math.abs(h - Math.round(h)) < 0.08, col = line ? C[1] : mix(C[0], C[2] || C[0], (h % 2) / 2); return [col[0], col[1], col[2], line && g.glow ? 1 : 0]; };
  } else if (g.t === 'scales') {
    fn = (u, v) => { const P = 10, y = v * P, row = Math.floor(y), x = u * P + (row & 1) * 0.5, fx = x % 1 - 0.5, fy = y - row, d = Math.hypot(fx, fy), rim = d > 0.42 && d < 0.5, col = rim ? C[2] : mix(C[0], C[1], Math.min(1, d * 1.6)); return [col[0], col[1], col[2], rim && g.glow ? 1 : 0]; };
  } else if (g.t === 'cracked') {   // voronoi cracks (lava, dry earth)
    const p = wrapPts(R, 30), n = fbmT(R, 6, 2);
    fn = (u, v) => { const r = nearest(p, u, v, false), crack = r.d2 - r.d1 < 0.018, col = crack ? C[1] : mix(C[0], C[2] || C[0], n(u, v) * 0.7); return [col[0], col[1], col[2], crack && g.glow ? 1 : 0]; };
  } else if (g.t === 'holo') {   // shifting rainbow foil
    const n = fbmT(R, 3, 3), hsl = (h, l) => { const f = (k) => { const a = 0.9 * Math.min(l, 1 - l), kk = (k + h * 12) % 12; return 255 * (l - a * Math.max(-1, Math.min(kk - 3, 9 - kk, 1))); }; return [f(0), f(8), f(4)]; };
    fn = (u, v) => { const h = ((Math.sin(u * Math.PI * 2) * 0.25 + Math.sin(v * Math.PI * 2) * 0.25 + n(u, v) * 1.2) % 1 + 1) % 1, col = mix(hsl(h, 0.55), C[0] || [0, 0, 0], g.dark || 0); return [col[0], col[1], col[2], 0.6]; };
  } else {   // solid finishes: brushed metal, engraving or chrome-like reflection bands (never flat)
    const n = tileNoise(64, R, 4), br = tileNoise(3, R, 160), sc = fbmT(R, 3, 4), fx = g.fx || 'grain';
    fn = (u, v) => {
      let k = 0.94 + n(u, v) * 0.1;
      if (fx === 'brushed' || fx === 'engrave') k = 0.82 + br(u, v) * 0.3;
      if (fx === 'engrave') { const t = Math.abs(Math.sin((u * 3 + v * 2 + sc(u, v) * 2.6) * Math.PI * 2)); if (t < 0.07) k *= 0.55; else if (t < 0.12) k *= 1.18; }
      if (fx === 'bands') k = 0.55 + 0.6 * Math.pow(0.5 + 0.5 * Math.sin((v * 3 + sc(u, v) * 0.8) * Math.PI * 2), 2) + br(u, v) * 0.08;
      return [Math.min(255, C[0][0] * k), Math.min(255, C[0][1] * k), Math.min(255, C[0][2] * k), 0];
    };
  }
  const cc = document.createElement('canvas'); cc.width = cc.height = N;
  const cx = cc.getContext('2d'), img = cx.createImageData(N, N);
  let ec = null, eimg = null, glowAny = false;
  const emis = new Uint8ClampedArray(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = fn(x / N, y / N), i = (y * N + x) * 4; img.data[i] = r[0]; img.data[i + 1] = r[1]; img.data[i + 2] = r[2]; img.data[i + 3] = 255; if (r[3] > 0) { emis[y * N + x] = Math.min(255, r[3] * 255); glowAny = true; } }
  cx.putImageData(img, 0, 0);
  if (glowAny) { ec = document.createElement('canvas'); ec.width = ec.height = N; const ex = ec.getContext('2d'); eimg = ex.createImageData(N, N); for (let i = 0; i < N * N; i++) { const k = emis[i] / 255; eimg.data[i * 4] = img.data[i * 4] * k; eimg.data[i * 4 + 1] = img.data[i * 4 + 1] * k; eimg.data[i * 4 + 2] = img.data[i * 4 + 2] * k; eimg.data[i * 4 + 3] = 255; } ex.putImageData(eimg, 0, 0); }
  return { cc, ec };
}
/* ---------- sticker art (transparent, with a white die-cut border) */
function stickerPaint(c, N) {
  const g = c.g, cv = document.createElement('canvas'); cv.width = cv.height = N;
  const x = cv.getContext('2d'), A = g.c[0], B = g.c[1], S = N / 128;
  x.save(); x.scale(S, S); x.lineJoin = 'round'; x.lineCap = 'round';
  const P = (pts) => { x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); };
  const star = (cx, cy, ro, ri, n = 5, rot = -Math.PI / 2) => { const pts = []; for (let i = 0; i < n * 2; i++) { const r = i % 2 ? ri : ro, a = rot + i * Math.PI / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } P(pts); };
  const skull = () => { x.beginPath(); x.arc(64, 54, 36, Math.PI * 0.85, Math.PI * 2.15); x.lineTo(88, 92); x.lineTo(40, 92); x.closePath(); };
  const spade = () => { x.beginPath(); x.moveTo(64, 14); x.bezierCurveTo(30, 48, 14, 62, 26, 82); x.bezierCurveTo(36, 96, 54, 92, 60, 84); x.lineTo(52, 112); x.lineTo(76, 112); x.lineTo(68, 84); x.bezierCurveTo(74, 92, 92, 96, 102, 82); x.bezierCurveTo(114, 62, 98, 48, 64, 14); x.closePath(); };
  const flame = (k = 1, oy = 0) => { x.beginPath(); x.moveTo(64, 10 + oy); x.bezierCurveTo(64 + 10 * k, 40 + oy, 100 * k + 64 * (1 - k), 52 + oy, 92 * k + 64 * (1 - k), 86); x.bezierCurveTo(88 * k + 64 * (1 - k), 108, 74, 118, 64, 118); x.bezierCurveTo(54, 118, 40 * k + 64 * (1 - k), 108, 36 * k + 64 * (1 - k), 86); x.bezierCurveTo(30 * k + 64 * (1 - k), 64 + oy, 52, 52 + oy, 56, 30 + oy); x.bezierCurveTo(60, 44 + oy, 66, 40 + oy, 64, 10 + oy); x.closePath(); };
  const shield = () => { x.beginPath(); x.moveTo(64, 12); x.lineTo(106, 26); x.bezierCurveTo(106, 70, 92, 98, 64, 116); x.bezierCurveTo(36, 98, 22, 70, 22, 26); x.closePath(); };
  const wing = (dir) => { x.beginPath(); x.moveTo(64, 70); x.bezierCurveTo(64 + dir * 20, 40, 64 + dir * 44, 30, 64 + dir * 60, 34); x.lineTo(64 + dir * 52, 48); x.lineTo(64 + dir * 58, 52); x.lineTo(64 + dir * 46, 64); x.lineTo(64 + dir * 50, 70); x.lineTo(64 + dir * 36, 78); x.bezierCurveTo(64 + dir * 24, 84, 64 + dir * 10, 82, 64, 70); x.closePath(); };
  const crown = () => P([[18, 96], [14, 38], [42, 64], [64, 26], [86, 64], [114, 38], [110, 96]]);
  const gem = () => P([[30, 44], [46, 24], [82, 24], [98, 44], [64, 110]]);
  const hex = () => { const pts = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push([64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54]); } P(pts); };
  const badge = () => { const w = g.txt.length > 5 ? 120 : g.txt.length > 3 ? 104 : 88; x.beginPath(); const r = 14, x0 = 64 - w / 2, y0 = 40, h = 48; x.moveTo(x0 + r, y0); x.arcTo(x0 + w, y0, x0 + w, y0 + h, r); x.arcTo(x0 + w, y0 + h, x0, y0 + h, r); x.arcTo(x0, y0 + h, x0, y0, r); x.arcTo(x0, y0, x0 + w, y0, r); x.closePath(); };
  // the silhouette (used for the white border) and the art on top
  const shape = {
    text: badge, star: () => star(64, 66, 54, 22), bolt: () => P([[72, 8], [26, 72], [58, 72], [46, 120], [102, 50], [68, 50]]), target: () => { x.beginPath(); x.arc(64, 64, 52, 0, Math.PI * 2); },
    skull, spade, flame: () => flame(1), shield, wings: () => { x.beginPath(); wing(1); x.fill(); wing(-1); x.fill(); x.beginPath(); x.arc(64, 72, 16, 0, Math.PI * 2); },
    rad: () => { x.beginPath(); x.arc(64, 64, 54, 0, Math.PI * 2); }, eye: () => { x.beginPath(); x.moveTo(8, 64); x.quadraticCurveTo(64, 10, 120, 64); x.quadraticCurveTo(64, 118, 8, 64); x.closePath(); },
    crown, dz: hex, phoenix: () => { x.beginPath(); wing(1); x.fill(); wing(-1); x.fill(); flame(0.6, 10); }, gem,
  }[g.d] || (() => star(64, 64, 54, 22));
  // border: the silhouette, fat white stroke
  x.fillStyle = '#ffffff'; x.strokeStyle = '#ffffff'; x.lineWidth = 12; shape(); x.fill(); x.stroke();
  x.fillStyle = A; shape(); x.fill();
  x.fillStyle = B; x.strokeStyle = B;
  const T = (t, sz, y = 66) => { x.font = `900 ${sz}px Arial, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 64, y); };
  if (g.d === 'text') { x.fillStyle = B; T(g.txt, g.txt.length > 5 ? 19 : g.txt.length > 3 ? 26 : 32, 65); }
  else if (g.d === 'star') { star(64, 66, 30, 12); x.fill(); }
  else if (g.d === 'bolt') { x.lineWidth = 3; P([[72, 8], [26, 72], [58, 72], [46, 120], [102, 50], [68, 50]]); x.stroke(); }
  else if (g.d === 'target') { for (const [r, f] of [[40, B], [28, A], [16, B], [6, A]]) { x.fillStyle = f; x.beginPath(); x.arc(64, 64, r, 0, Math.PI * 2); x.fill(); } }
  else if (g.d === 'skull') { x.beginPath(); x.arc(50, 56, 10, 0, Math.PI * 2); x.arc(78, 56, 10, 0, Math.PI * 2); x.fill(); P([[64, 66], [58, 78], [70, 78]]); x.fill(); x.fillRect(46, 84, 4, 8); x.fillRect(56, 84, 4, 8); x.fillRect(67, 84, 4, 8); x.fillRect(78, 84, 4, 8); }
  else if (g.d === 'spade') { x.fillStyle = B; T('A', 26, 62); }
  else if (g.d === 'flame') { x.fillStyle = B; x.save(); x.translate(64, 80); x.scale(0.55, 0.55); x.translate(-64, -80); flame(1); x.fill(); x.restore(); }
  else if (g.d === 'shield') { x.lineWidth = 9; x.beginPath(); x.moveTo(40, 50); x.lineTo(64, 72); x.lineTo(88, 50); x.stroke(); x.beginPath(); x.moveTo(40, 72); x.lineTo(64, 94); x.lineTo(88, 72); x.stroke(); }
  else if (g.d === 'wings' || g.d === 'phoenix') { if (g.d === 'wings') { x.beginPath(); x.arc(64, 72, 12, 0, Math.PI * 2); x.fill(); } else { x.save(); x.translate(64, 92); x.scale(0.5, 0.5); x.translate(-64, -92); flame(0.6, 10); x.fill(); x.restore(); } }
  else if (g.d === 'rad') { for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 3; x.beginPath(); x.moveTo(64, 64); x.arc(64, 64, 44, a - 0.5, a + 0.5); x.closePath(); x.fill(); } x.fillStyle = A; x.beginPath(); x.arc(64, 64, 14, 0, Math.PI * 2); x.fill(); x.fillStyle = B; x.beginPath(); x.arc(64, 64, 8, 0, Math.PI * 2); x.fill(); }
  else if (g.d === 'eye') { x.beginPath(); x.arc(64, 64, 24, 0, Math.PI * 2); x.fill(); x.fillStyle = A; x.beginPath(); x.arc(64, 64, 11, 0, Math.PI * 2); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(56, 56, 5, 0, Math.PI * 2); x.fill(); }
  else if (g.d === 'crown') { for (const [cx, cy] of [[14, 38], [64, 26], [114, 38]]) { x.beginPath(); x.arc(cx, cy, 7, 0, Math.PI * 2); x.fill(); } x.fillRect(22, 80, 84, 8); }
  else if (g.d === 'dz') { x.fillStyle = B; T('DZ', 44, 66); }
  else if (g.d === 'gem') { x.globalAlpha = 0.55; P([[46, 24], [64, 44], [30, 44]]); x.fill(); P([[82, 24], [98, 44], [64, 44]]); x.fill(); P([[64, 44], [98, 44], [64, 110]]); x.fill(); x.globalAlpha = 1; }
  x.restore();
  return { cc: cv, ec: null };
}
// the sticker on a gun: a small decal on each side of the receiver, placed on the actual surface
const STK_TEX = {}, stkRay = new THREE.Raycaster();
function stickerMat(id) { if (STK_TEX[id]) return STK_TEX[id]; const t = new THREE.CanvasTexture(cosmCanvas(id, 128).cc); t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.max(1, Math.min(S.anis | 0, MAXANIS)); const m = new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.35, roughness: 0.55, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }); return (STK_TEX[id] = m); }
function applySticker(g, id) {
  if (!g) return;
  if (g.userData.stk) { for (const m of g.userData.stk) m.parent && m.parent.remove(m); g.userData.stk = null; }
  if (!id || !COS[id]) return;
  g.updateMatrixWorld(true);
  const body = []; g.traverse(o => { if (!o.isMesh || !o.visible || o.isSprite) return; for (let p = o; p && p !== g; p = p.parent) if (p.name === 'attachments' || /^hand/.test(p.name)) return; if (o.material && (o.material.transparent || o.material.blending === THREE.AdditiveBlending)) return; body.push(o); });
  if (!body.length) return;
  const inv = new THREE.Matrix4().copy(g.matrixWorld).invert(), box = new THREE.Box3(), tmp = new THREE.Box3();
  for (const o of body) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); tmp.copy(o.geometry.boundingBox).applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); box.union(tmp); }
  const sz = box.getSize(new THREE.Vector3()), size = clamp(sz.y * 0.32, 0.028, 0.055), mat = stickerMat(id), out = [];
  for (const side of [1, -1]) {
    let placed = null;
    for (const [fy, fz] of [[0.62, 0.12], [0.55, 0.05], [0.7, 0.2], [0.5, -0.05], [0.6, 0.3]]) {
      const y = box.min.y + sz.y * fy, z = box.min.z + sz.z * (0.5 + fz);
      const from = new THREE.Vector3(side > 0 ? box.max.x + 0.2 : box.min.x - 0.2, y, z).applyMatrix4(g.matrixWorld), to = new THREE.Vector3(0, y, z).applyMatrix4(g.matrixWorld);
      stkRay.set(from, to.sub(from).normalize()); stkRay.far = 1;
      const hit = stkRay.intersectObjects(body, false)[0];
      if (hit) { placed = g.worldToLocal(hit.point.clone()); break; }
    }
    if (!placed) continue;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
    m.position.copy(placed); m.position.x += side * 0.0015; m.rotation.y = side * Math.PI / 2; m.renderOrder = 2; m.userData.att = true; m.name = 'sticker';
    g.add(m); out.push(m);
  }
  g.userData.stk = out;
}
function stickerFor(gunId) { const own = PROG.stk.guns && PROG.stk.guns[gunId]; if (own === 'none') return null; const id = own || PROG.stk.all; return id && PROG.owned[id] && COS[id] ? id : null; }
function cosmCanvas(id, N) { const k = id + '@' + N; return COS_TEX[k] || (COS_TEX[k] = COS[id].kind === 'sticker' ? stickerPaint(COS[id], N) : cosmPaint(COS[id], N)); }
// the material a cosmetic puts on the gun
function cosmMat(id) {
  if (COS_MAT[id]) return COS_MAT[id];
  const c = COS[id], m = c.m || {}, { cc, ec } = cosmCanvas(id, 256);
  const tex = new THREE.CanvasTexture(cc); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.encoding = THREE.sRGBEncoding; tex.anisotropy = Math.max(1, Math.min(S.anis | 0, MAXANIS));
  const opt = { map: tex, roughness: m.rough !== undefined ? m.rough : 0.62, metalness: m.metal !== undefined ? m.metal : 0.12, envMapIntensity: 1.2 };
  if (ec) { const et = new THREE.CanvasTexture(ec); et.wrapS = et.wrapT = THREE.RepeatWrapping; et.encoding = THREE.sRGBEncoding; Object.assign(opt, { emissiveMap: et, emissive: new THREE.Color(0xffffff), emissiveIntensity: m.emis || 1.5 }); }
  const mat = new THREE.MeshStandardMaterial(opt); mat.userData.cosm = id;
  try { addFresnel(mat); } catch (e) {}
  if (m.anim) COS_ANIM.push({ mat, anim: m.anim, base: m.emis || 1.5 });
  return (COS_MAT[id] = mat);
}
let cosT = 0;
function cosmTick(dt) {
  try { thumbTick(); } catch (e) {}
  if (!COS_ANIM.length) return; cosT += dt;
  for (const a of COS_ANIM) {
    if (a.anim === 'scroll') { a.mat.map.offset.x = (cosT * 0.03) % 1; a.mat.map.offset.y = (cosT * 0.012) % 1; }
    else if (a.anim === 'pulse') a.mat.emissiveIntensity = a.base * (0.65 + 0.35 * Math.sin(cosT * 2.4));
    else if (a.anim === 'twinkle') a.mat.emissiveIntensity = a.base * (0.6 + 0.4 * Math.sin(cosT * 7) * Math.sin(cosT * 2.3));
  }
}

/* ---------- putting a cosmetic on a gun model (first person and the previews) */
// camos cover the painted body; skins (finishes) also cover the bare steel
function cosmSlots(kind) { const a = [VM.metal, VM.metalStd, VM.poly, VM.tan, VM.od, VM.grey, VM.wood]; if (kind === 'skin') a.push(VM.steel, VM.steelStd); return new Set(a.filter(Boolean)); }
function applyCamo(g, id) {
  if (!g) return;
  const c = id && COS[id], slots = c ? cosmSlots(c.kind) : null, mat = c ? cosmMat(id) : null;
  g.traverse(o => {
    if (!o.isMesh || o.userData.att) return;
    for (let p = o; p && p !== g; p = p.parent) if (p.name === 'attachments' || /^hand/.test(p.name)) return;
    if (o.userData.cBase === undefined) { if (!c) return; o.userData.cBase = o.material; }
    const base = o.userData.cBase;
    o.material = c && slots.has(base) ? mat : base;
  });
  g.userData.camo = id || null;
}
// which cosmetic a gun wears: its own pick, else the all-weapons pick (only if owned)
// which camo a gun wears: its own pick, else the all-weapons pick (owned only). Secret camos only on the gun they dropped for
const secretKey = (id, gun) => id + '@' + gun;
function ownsFor(id, gunId) { const c = COS[id]; return !!c && (c.secret ? !!PROG.owned[secretKey(id, gunId)] : !!PROG.owned[id]); }
function camoFor(gunId) { const own = PROG.equip.guns && PROG.equip.guns[gunId]; if (own === 'none') return null; const id = own || PROG.equip.all; if (!id || !COS[id]) return null; if (COS[id].secret && own !== id) return null; return ownsFor(id, gunId) ? id : null; }
function refreshHeldCamos() { try { (WEAPONS || []).forEach((w, i) => { if (gunObjs[i] && w && w.def) { applyCamo(gunObjs[i], camoFor(w.def.id)); applySticker(gunObjs[i], stickerFor(w.def.id)); } }); } catch (e) {} }
const ownedCount = () => Object.keys(PROG.owned).filter(k => COS[k.split('@')[0]]).length;
const publicCount = () => COSM.filter(c => !c.secret).length;

/* ---------- weapon pictures for the Locker (rendered one per frame, cached per gun + camo + sticker) */
const THUMB = { cache: {}, q: [], scene: null, cam: null, rt: null, buf: null };
const thumbKey = id => id + '|' + camoFor(id) + '|' + stickerFor(id);
function gunThumb(id) { const k = thumbKey(id); if (THUMB.cache[k]) return THUMB.cache[k]; if (!THUMB.q.includes(id)) THUMB.q.push(id); return null; }
function thumbTick() {
  if (curScreen !== 'locker' || !THUMB.q.length) return;
  const id = THUMB.q.shift(), def = ARM[id]; if (!def) return;
  const W = 300, H = 120;
  try {
    if (!THUMB.scene) {
      THUMB.scene = new THREE.Scene(); THUMB.scene.environment = scene.environment || null;
      THUMB.scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x3a3226, 1.7)); const d1 = new THREE.DirectionalLight(0xfff2e0, 3.2); d1.position.set(1, 2, 2); THUMB.scene.add(d1);
      THUMB.cam = new THREE.PerspectiveCamera(24, W / H, 0.01, 10); THUMB.rt = new THREE.WebGLRenderTarget(W, H); THUMB.rt.texture.encoding = THREE.sRGBEncoding; THUMB.buf = new Uint8Array(W * H * 4);
    }
    const g = buildGunModel(def, true), st = computeStats(def, null);
    attachVisuals(g, def, false, g.userData.len + st.lenAdd, null); applyCamo(g, camoFor(id)); applySticker(g, stickerFor(id));
    g.traverse(o => { if (o.name && /^hand/.test(o.name)) o.visible = false; }); if (g.userData.flash) g.userData.flash.visible = false;
    const holder = new THREE.Group(); holder.add(g); THUMB.scene.add(holder); g.updateMatrixWorld(true);
    const box = new THREE.Box3(); g.traverse(o => { if (o.isMesh && !(o.material && o.material.blending === THREE.AdditiveBlending)) { let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) vis = false; if (vis) box.expandByObject(o); } });
    const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()); g.position.sub(c);
    holder.rotation.set(0.08, -Math.PI / 2, 0);
    const size = Math.max(sz.z, sz.y * 2.5, 0.2), hf = Math.atan(Math.tan(12 * Math.PI / 180) * THUMB.cam.aspect);
    THUMB.cam.position.set(0, 0, size / (2 * Math.tan(hf)) * 1.08); THUMB.cam.lookAt(0, 0, 0);
    const prevT = renderer.getRenderTarget(), prevCC = renderer.getClearColor(new THREE.Color()), prevCA = renderer.getClearAlpha();
    renderer.setRenderTarget(THUMB.rt); renderer.setClearColor(0x000000, 0); renderer.clear(); updateGunShader(); renderer.render(THUMB.scene, THUMB.cam);
    renderer.readRenderTargetPixels(THUMB.rt, 0, 0, W, H, THUMB.buf); renderer.setRenderTarget(prevT); renderer.setClearColor(prevCC, prevCA);
    THUMB.scene.remove(holder);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d'), img = cx.createImageData(W, H), row = W * 4;
    for (let y = 0; y < H; y++) img.data.set(THUMB.buf.subarray((H - 1 - y) * row, (H - y) * row), y * row);
    cx.putImageData(img, 0, 0); const url = cv.toDataURL(); THUMB.cache[thumbKey(id)] = url;
    const el = document.querySelector('#lkBody [data-thumb="' + id + '"]'); if (el) el.innerHTML = `<img src="${url}" alt="">`;
  } catch (e) {}
}

/* ---------- chance boxes and daily reward */
const BOXES = [
  { id: 'std', name: 'STANDARD', cost: 500, odds: [59.5, 27, 10, 3, 0.5], col: '#9aa3a9', desc: 'Every camo and skin can drop.' },
  { id: 'elite', name: 'ELITE', cost: 1200, odds: [25, 52, 17, 5.5, 0.5], col: '#4aa3ff', desc: 'Mostly rare, better epic and legendary odds.' },
  { id: 'prestige', name: 'PRESTIGE', cost: 2500, odds: [0, 50, 38, 11.5, 0.5], col: '#f2b84b', desc: 'No commons. The best legendary odds.' },
];
const BOXK = Object.fromEntries(BOXES.map(b => [b.id, b])), SECRET_POOL = COSM.filter(c => c.secret);
const pickR = a => a[(Math.random() * a.length) | 0];
function rollRarity(box) { let r = Math.random() * 100, last = 0; for (let i = 0; i < box.odds.length; i++) { if (box.odds[i] <= 0) continue; last = i; if (r < box.odds[i]) return i; r -= box.odds[i]; } return last; }
function rollBox(boxId) {
  const box = BOXK[boxId] || BOXES[0], rar = rollRarity(box);
  if (rar === 4) return { it: pickR(SECRET_POOL), gun: pickR(lockerGuns()).id };
  return { it: pickR(BOX_POOL.filter(c => c.r === rar)) };
}
function openBox(boxId) {
  const box = BOXK[boxId] || BOXES[0]; if (PROG.dz < box.cost) return null;
  PROG.dz -= box.cost; PROG.boxes++;
  const roll = rollBox(box.id), it = roll.it, key = it.secret ? secretKey(it.id, roll.gun) : it.id, dup = !!PROG.owned[key], refund = dup ? RAR[it.r].refund : 0;
  if (dup) PROG.dz += refund; else PROG.owned[key] = Date.now();
  PROG.drops.unshift({ id: it.id, gun: roll.gun || null, dup, t: Date.now() }); PROG.drops = PROG.drops.slice(0, 8);
  saveProg(); return { it, gun: roll.gun || null, dup, refund, box };
}
const dayKey = d => { const x = d || new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
const dailyAmount = streak => 100 + 25 * (Math.min(7, Math.max(1, streak)) - 1);
function dailyState() {
  const today = dayKey(), y = new Date(); y.setDate(y.getDate() - 1);
  const ready = PROG.daily.last !== today, next = ready ? (PROG.daily.last === dayKey(y) ? PROG.daily.streak + 1 : 1) : PROG.daily.streak;
  return { ready, streak: next, amount: dailyAmount(next) };
}
function claimDaily() { const s = dailyState(); if (!s.ready) return 0; PROG.daily = { last: dayKey(), streak: s.streak }; PROG.dz += s.amount; saveProg(); return s.amount; }

/* ---------- LOCKER: pick a gun, then its camos (owned only), with a separate OTHER COSMETICS page for stickers */
const LK = { view: 'guns', gun: null, sel: null, tab: 'camo', ret: 'lobby' };
const cosmSwatch = (id, N = 64) => { try { return cosmCanvas(id, N).cc.toDataURL(); } catch (e) { return ''; } };
const SWATCH = {};
function swatchUrl(id) { return SWATCH[id] || (SWATCH[id] = cosmSwatch(id, 72)); }
function lockerGuns() { return ARMORY.filter(d => CATS[d.cat] && (CATS[d.cat].slot === 'primary' || CATS[d.cat].slot === 'secondary')); }
function howToGet(c) { return c.lvl ? 'REACH LEVEL ' + c.lvl : 'FOUND IN CHANCE BOXES'; }
const kindName = c => c.secret ? 'CAMO' : c.kind === 'camo' ? 'CAMO' : c.kind === 'skin' ? 'SKIN' : 'STICKER';
function openLocker() {
  if (curScreen !== 'locker' && curScreen !== 'rewards') LK.ret = curScreen || 'lobby';
  LK.view = 'guns'; if (!LK.gun || !ARM[LK.gun]) LK.gun = activeClass().p;
  renderLocker(); showScreen('locker'); focusFirst('#lkBody [data-lkgun="' + LK.gun + '"]');
}
function lockerBack() { if (curScreen === 'locker' && LK.view === 'gun') { LK.view = 'guns'; renderLocker(); focusFirst('#lkBody [data-lkgun="' + LK.gun + '"]'); } else progBack(); }
// items a gun can wear on this page
function gunItems(gunId, tab) {
  if (tab === 'other') return COSM.filter(c => c.kind === 'sticker' && PROG.owned[c.id]);
  return COSM.filter(c => (c.kind === 'camo' || c.kind === 'skin') && ownsFor(c.id, gunId)).sort((a, b) => (b.r - a.r) || a.name.localeCompare(b.name));
}
function tileHtml(c, on, eq, extra) {
  return `<button class="lk-t${on ? ' on' : ''}${eq ? ' eq' : ''}${c.secret ? ' sec' : ''}" data-lk="${c.id}" style="--rc:${RAR[c.r].col}"><span class="lk-sw${c.kind === 'sticker' ? ' stk' : ''}" style="background-image:url(${swatchUrl(c.id)})"></span><b>${c.name}</b><small>${eq ? 'EQUIPPED' : extra || RAR[c.r].name + ' ' + kindName(c)}</small></button>`;
}
function renderLocker() {
  $('lkTop').innerHTML = progCardHtml();
  const body = $('lkBody');
  if (LK.view === 'guns') {
    $('lkFilters').innerHTML = `<span class="lk-crumb">SELECT A WEAPON</span>`;
    const cats = []; for (const d of lockerGuns()) { if (!cats.includes(d.cat)) cats.push(d.cat); }
    body.className = 'lk-guns';
    body.innerHTML = `<div class="lk-count">${ownedCount()} / ${publicCount()} COLLECTED${Object.keys(PROG.owned).some(k => k.includes('@')) ? ' · + SECRET' : ''}</div>` + cats.map(cat => `<div class="lk-cat"><small>${CATS[cat].name}</small><div class="lk-gg">${lockerGuns().filter(d => d.cat === cat).map(d => {
      const cm = camoFor(d.id), st = stickerFor(d.id), n = gunItems(d.id, 'camo').length;
      const th = gunThumb(d.id);
      return `<button class="lk-gun" data-lkgun="${d.id}" style="${cm ? `--rc:${RAR[COS[cm].r].col}` : ''}"><em>${n} CAMO${n === 1 ? '' : 'S'}</em><span class="lk-gimg" data-thumb="${d.id}">${th ? `<img src="${th}" alt="">` : ''}</span><b>${d.name}</b><small>${cm ? COS[cm].name : 'FACTORY'}${st ? ' · ' + COS[st].name : ''}</small></button>`;
    }).join('')}</div></div>`).join('');
    for (const b of body.querySelectorAll('[data-lkgun]')) b.onclick = () => { LK.gun = b.dataset.lkgun; LK.view = 'gun'; LK.tab = 'camo'; LK.sel = camoFor(LK.gun); sfx.ui(); renderLocker(); focusFirst('#lkGrid .on, #lkGrid button'); };
    PV.want = null; return;
  }
  // one gun: preview + its camos, or its other cosmetics
  const d = ARM[LK.gun], cur = camoFor(LK.gun), curS = stickerFor(LK.gun), items = gunItems(LK.gun, LK.tab), other = LK.tab === 'other';
  const sel = LK.sel && COS[LK.sel] ? COS[LK.sel] : null, isStk = sel && sel.kind === 'sticker', on = sel && (isStk ? curS === sel.id : cur === sel.id);
  $('lkFilters').innerHTML = `<button class="cod-tab" data-act="lk-back">&lsaquo; WEAPONS</button><button class="cod-tab${!other ? ' on' : ''}" data-lktab="camo">CAMOS</button><button class="cod-tab${other ? ' on' : ''}" data-lktab="other">OTHER COSMETICS</button>`;
  body.className = 'lk-body';
  body.innerHTML = `<div class="lk-left"><div class="lk-gun-h"><small>${CATS[d.cat].name}</small><b>${d.name}</b></div><canvas id="lkPrev" width="480" height="200"></canvas><div id="lkInfo"></div><div class="lk-acts" id="lkActs2"></div></div><div class="lk-right"><div class="lk-sub">${other ? 'STICKERS · ONE PER GUN' : 'CAMOS & SKINS · YOU OWN ' + items.length}</div><div class="lk-grid" id="lkGrid"></div></div>`;
  $('lkInfo').innerHTML = sel ? `<div class="lk-name" style="--rc:${RAR[sel.r].col}"><small>${RAR[sel.r].name} ${kindName(sel)}</small><b>${sel.name}</b></div>${sel.secret ? `<div class="lk-secret">SECRET · ONLY FOR THE ${d.name}${typeof SECRET_VID !== 'undefined' && SECRET_VID[sel.id] ? ' <button class="mini lk-rv" data-act="lk-reveal">▶ PLAY REVEAL</button>' : ''}</div>` : ''}
<div class="lk-acts"><button class="btn primary" data-act="lk-apply"${on ? ' disabled' : ''}>${on ? 'EQUIPPED' : 'EQUIP ON ' + d.name}</button>${sel.secret ? '' : `<button class="btn" data-act="lk-all">EQUIP ON ALL WEAPONS</button>`}</div>`
    : `<div class="lk-name"><small>${other ? 'NO STICKER' : 'NO CAMO'}</small><b>${other ? 'NONE' : 'FACTORY FINISH'}</b></div>`;
  $('lkActs2').innerHTML = other ? `<button class="btn" data-act="lk-clear-stk"${!curS ? ' disabled' : ''}>REMOVE STICKER</button>` : `<button class="btn" data-act="lk-clear"${!cur ? ' disabled' : ''}>REMOVE CAMO</button>`;
  $('lkGrid').innerHTML = `<button class="lk-t${!LK.sel ? ' on' : ''}" data-lk=""><span class="lk-sw0">—</span><b>${other ? 'NONE' : 'FACTORY'}</b><small>DEFAULT</small></button>` +
    items.map(c => tileHtml(c, LK.sel === c.id, other ? curS === c.id : cur === c.id)).join('') +
    (items.length ? '' : `<div class="lk-empty">${other ? 'Level up to earn stickers: one every 5 levels.' : 'No camos yet. Open chance boxes in REWARDS to get some.'}<button class="btn" data-act="rewards">GO TO REWARDS</button></div>`);
  for (const b of $('lkGrid').querySelectorAll('[data-lk]')) b.onclick = () => { LK.sel = b.dataset.lk || null; sfx.ui(); renderLocker(); focusFirst('#lkGrid [data-lk="' + (LK.sel || '') + '"]'); };
  for (const b of $('lkFilters').querySelectorAll('[data-lktab]')) b.onclick = () => { LK.tab = b.dataset.lktab; LK.sel = LK.tab === 'other' ? curS : cur; sfx.ui(); renderLocker(); focusFirst('#lkFilters .on'); };
  PV.key = ''; PV.want = { def: d, ovr: null, camo: isStk ? cur : (other ? cur : (LK.sel || null)), stk: isStk ? sel.id : curS };
}
function lockerAct(act) {
  const slot = LK.sel && COS[LK.sel] && COS[LK.sel].kind === 'sticker' ? PROG.stk : PROG.equip;
  if (act === 'lk-apply' && LK.sel && ownsFor(LK.sel, LK.gun)) { slot.guns[LK.gun] = LK.sel; saveProg(); refreshHeldCamos(); sfx.ui(); renderLocker(); focusFirst('#lkGrid .on'); return true; }
  if (act === 'lk-all' && LK.sel && PROG.owned[LK.sel] && !COS[LK.sel].secret) {
    slot.all = LK.sel; for (const g in slot.guns) if (!(COS[slot.guns[g]] && COS[slot.guns[g]].secret)) delete slot.guns[g];   // secret picks stay on their gun
    saveProg(); refreshHeldCamos(); sfx.ui(); renderLocker(); focusFirst('#lkGrid .on'); toast2('EQUIPPED ON ALL WEAPONS'); return true;
  }
  if (act === 'lk-clear-stk') { PROG.stk.guns[LK.gun] = 'none'; saveProg(); LK.sel = null; refreshHeldCamos(); sfx.ui(); renderLocker(); return true; }
  if (act === 'lk-clear') { PROG.equip.guns[LK.gun] = 'none'; saveProg(); LK.sel = null; refreshHeldCamos(); sfx.ui(); renderLocker(); return true; }
  if (act === 'lk-reveal' && LK.sel) { playSecretReveal(LK.sel, () => focusFirst('[data-act="lk-reveal"]')); return true; }
  if (act === 'lk-back') { lockerBack(); return true; }
  if (act === 'rw-back') { progBack(); return true; }
  if (act === 'locker') { openLocker(); return true; }
  if (act === 'rewards') { openRewards(); return true; }
  if (act === 'rw-daily') { const n = claimDaily(); if (n) { try { sfx.streak(); } catch (e) {} toast2('+' + n + ' DZ DAILY REWARD'); } renderRewards(); focusFirst('[data-act^="rw-box-"]'); return true; }
  if (/^rw-box-(std|elite|prestige)$/.test(act)) { boxOpen(act.slice(7)); return true; }
  if (/^rw-see-(std|elite|prestige)$/.test(act)) { boxContents(act.slice(7)); return true; }
  if (act === 'rw-see-close') { const o = $('boxSee'); if (o) o.remove(); focusFirst('[data-act^="rw-box-"]'); return true; }
  if (act === 'rw-box-close') { boxClose(); return true; }
  if (act === 'rw-box-equip') {
    const r = BOXV.res;
    if (r && !r.dup) { if (r.it.secret) { PROG.equip.guns[r.gun] = r.it.id; toast2(r.it.name + ' ON ' + ARM[r.gun].name); } else { PROG.equip.all = r.it.id; for (const g in PROG.equip.guns) if (!(COS[PROG.equip.guns[g]] && COS[PROG.equip.guns[g]].secret)) delete PROG.equip.guns[g]; toast2(r.it.name + ' ON ALL WEAPONS'); } saveProg(); refreshHeldCamos(); }
    boxClose(); return true;
  }
  return false;
}
function progBack() { if (LK.ret === 'lobby') toLobby(); else showScreen(LK.ret || 'menu'); }
function toast2(t) { try { const el = document.createElement('div'); el.className = 'pg-toast'; el.textContent = t; document.body.appendChild(el); setTimeout(() => el.classList.add('out'), 1800); setTimeout(() => el.remove(), 2400); } catch (e) {} }

/* ---------- REWARDS screen */
function openRewards() { if (curScreen !== 'locker' && curScreen !== 'rewards') LK.ret = curScreen || 'lobby'; renderRewards(); showScreen('rewards'); focusFirst(dailyState().ready ? '[data-act="rw-daily"]' : '[data-act="rw-box-std"]'); }
const oddsHtml = box => RAR.map((r, i) => box.odds[i] > 0 && i < 4 ? `<span style="--rc:${r.col}"><i></i>${r.name}<b>${box.odds[i]}%</b></span>` : '').join('');
function renderRewards() {
  const ds = dailyState(), info = lvlInfo(PROG.xp);
  $('rwTop').innerHTML = progCardHtml();
  $('rwDaily').innerHTML = `<small>DAILY REWARD</small><b>${dzIcon()}${ds.amount}</b><div class="rw-days">${[1, 2, 3, 4, 5, 6, 7].map(n => `<i class="${n < ds.streak || (!ds.ready && n <= ds.streak) ? 'got' : n === ds.streak && ds.ready ? 'now' : ''}">${dailyAmount(n)}</i>`).join('')}</div>
<span>${ds.ready ? `DAY ${ds.streak} OF YOUR STREAK · COME BACK TOMORROW FOR MORE` : `CLAIMED TODAY · DAY ${ds.streak} STREAK · BACK TOMORROW`}</span><button class="btn primary" data-act="rw-daily"${ds.ready ? '' : ' disabled'}>${ds.ready ? 'CLAIM' : 'CLAIMED'}</button>`;
  $('rwBox').innerHTML = `<small>CHANCE BOXES · CAMOS ONLY COME FROM BOXES</small><div class="rw-boxes">${BOXES.map(b => `<div class="rw-bx" style="--bc:${b.col}"><div class="rw-boximg"><div class="rw-crate"><span>${b.name.slice(0, 1)}</span></div></div><b>${b.name}</b><p>${b.desc}</p>
<div class="rw-odds">${oddsHtml(b)}</div><button class="btn primary" data-act="rw-box-${b.id}"${PROG.dz < b.cost ? ' disabled' : ''}>OPEN · ${dzIcon()}${b.cost.toLocaleString()}</button><button class="btn" data-act="rw-see-${b.id}">VIEW CONTENTS</button></div>`).join('')}</div>
<p>A duplicate pays DZ back (${RAR.slice(0, 4).map(r => r.refund.toLocaleString()).join(' / ')}).</p>
${PROG.drops.length ? `<div class="rw-drops"><small>LAST OPENED</small>${PROG.drops.slice(0, 6).map(d => COS[d.id] ? `<span style="--rc:${RAR[COS[d.id].r].col}"><img src="${swatchUrl(d.id)}" alt="">${COS[d.id].name}${d.gun ? ' · ' + ARM[d.gun].name : ''}${d.dup ? ' <em>DUPLICATE</em>' : ''}</span>` : '').join('')}</div>` : ''}`;
  const rows = []; for (let l = Math.min(MAXLVL, info.l + 1), n = 0; l <= MAXLVL && n < 12; l++, n++) rows.push(l);
  $('rwTrack').innerHTML = `<small>LEVEL REWARDS · LEVEL ${info.l}${info.l < MAXLVL ? ` · ${(info.need - info.into).toLocaleString()} XP TO NEXT` : ''}</small>` + (info.l >= MAXLVL ? '<div class="rw-lv max">MAX LEVEL REACHED</div>' : rows.map(l => {
    const it = LEVEL_ITEM[l] && COS[LEVEL_ITEM[l]];
    return `<div class="rw-lv${it ? ' item' : ''}"${it ? ` style="--rc:${RAR[it.r].col}"` : ''}><span class="pg-badge">${l}</span><span class="rw-dz">${dzIcon()}${levelDz(l)}</span>${it ? `<span class="rw-it"><img src="${swatchUrl(it.id)}" alt=""><b>${it.name}</b><small>${RAR[it.r].name} ${kindName(it)}</small></span>` : ''}</div>`;
  }).join('')) + `<div class="rw-how">XP: kill 100 · headshot +50 · objective 250 · match 500 · win +1000 · online +25%</div>`;
}
// everything a box can drop (secret ones stay hidden)
function boxContents(id) {
  const box = BOXK[id] || BOXES[0], old = $('boxSee'); if (old) old.remove();
  const ov = document.createElement('div'); ov.id = 'boxSee';
  ov.innerHTML = `<div class="bs-in" style="--bc:${box.col}"><div class="bs-h"><div><small>CONTENTS</small><b>${box.name} BOX</b></div><span>${dzIcon()}${box.cost.toLocaleString()}</span><button class="btn" data-act="rw-see-close">CLOSE</button></div><div class="bs-body">` +
    RAR.map((r, i) => {
      if (!(box.odds[i] > 0)) return '';
      if (i === 4) return '';   // the secret set is never listed
      const list = BOX_POOL.filter(c => c.r === i);
      return `<div class="bs-sec" style="--rc:${r.col}"><h4>${r.name} · ${box.odds[i]}% · ${list.length} ITEMS</h4><div class="bs-grid">${list.map(c => `<div class="bs-t${PROG.owned[c.id] ? ' own' : ''}"><img src="${swatchUrl(c.id)}" alt=""><b>${c.name}</b><small>${kindName(c)}${PROG.owned[c.id] ? ' · OWNED' : ''}</small></div>`).join('')}</div></div>`;
    }).join('') + `</div></div>`;
  document.body.appendChild(ov); setTimeout(() => focusFirst('#boxSee button'), 30);
}
// a secret camo's reveal animation (rendered in Blender), full screen; click / Enter / A skips
function playSecretReveal(id, done) {
  const src = typeof SECRET_VID !== 'undefined' && SECRET_VID[id];
  if (!src) { if (done) done(); return false; }
  const ov = document.createElement('div'); ov.id = 'secVid';
  ov.innerHTML = `<video playsinline autoplay></video><span>CLICK TO SKIP</span>`;
  document.body.appendChild(ov);
  const v = ov.querySelector('video'); let fin = false;
  const end = () => { if (fin) return; fin = true; removeEventListener('keydown', key, true); ov.classList.add('out'); setTimeout(() => ov.remove(), 350); if (done) done(); };
  const key = e => { if (['Enter', 'Space', 'Escape'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); end(); } };
  addEventListener('keydown', key, true); ov.onclick = end; v.onended = end; v.onerror = end;
  v.src = src; v.volume = Math.max(0, Math.min(1, (S.master / 100) * (S.sfx / 100)));   // follows MASTER and EFFECTS volume const pl = v.play(); if (pl && pl.catch) pl.catch(() => { v.muted = true; v.play().catch(end); });
  setTimeout(end, 9000);   // never get stuck
  const poll = () => { if (fin) return; const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(g => g) : null; if (gp && gp.buttons[0] && gp.buttons[0].pressed && v.currentTime > 0.6) { end(); return; } requestAnimationFrame(poll); }; requestAnimationFrame(poll);
  return true;
}
// box opening: a reel of items spins and stops on the prize (a secret shows as ??? until it lands)
const BOXV = { res: null };
function boxOpen(id) {
  const res = openBox(id); if (!res) return; BOXV.res = res;
  const show = c => c.secret ? `<div class="bx-c sec" style="--rc:${RAR[4].col}"><span class="bx-q">?</span><b>???</b></div>` : `<div class="bx-c" style="--rc:${RAR[c.r].col}"><img src="${swatchUrl(c.id)}" alt=""><b>${c.name}</b></div>`;
  const reel = []; for (let i = 0; i < 34; i++) { if (i === 29) { reel.push(res.it); continue; } let c = rollBox(id).it; if (c.secret) c = pickR(BOX_POOL.filter(x => x.r === 3)); reel.push(c); }
  const ov = document.createElement('div'); ov.id = 'boxOv';
  ov.innerHTML = `<div class="bx-in"><small>${res.box.name} BOX</small><div class="bx-win"><div class="bx-reel" id="bxReel">${reel.map(show).join('')}</div><i class="bx-mark"></i></div>
<div class="bx-res hide" id="bxRes" style="--rc:${RAR[res.it.r].col}"><small>${RAR[res.it.r].name} ${kindName(res.it)}${res.gun ? ' · FOR THE ' + ARM[res.gun].name : ''}</small><div class="bx-big"><img src="${swatchUrl(res.it.id)}" alt=""></div><b>${res.it.name}</b><span>${res.dup ? `DUPLICATE · +${res.refund.toLocaleString()} DZ BACK` : res.it.secret ? 'SECRET FIND · ONLY YOUR ' + ARM[res.gun].name + ' CAN WEAR IT' : 'NEW · ADDED TO YOUR LOCKER'}</span>
<div class="bx-acts">${res.dup ? '' : `<button class="btn primary" data-act="rw-box-equip">${res.it.secret ? 'EQUIP ON ' + ARM[res.gun].name : 'EQUIP ON ALL WEAPONS'}</button>`}<button class="btn" data-act="rw-box-close">${res.dup ? 'OK' : 'LATER'}</button></div></div></div>`;
  document.body.appendChild(ov); try { sfx.ui(); } catch (e) {}
  const el = ov.querySelector('#bxReel'), cw = 132;
  requestAnimationFrame(() => { el.style.transition = 'transform 4.2s cubic-bezier(.12,.72,.1,1)'; el.style.transform = `translateX(${-(29 * cw) + (el.parentNode.clientWidth / 2 - cw / 2) - (Math.random() * 60 - 30)}px)`; });
  let ticks = 0; const tk = setInterval(() => { try { sfx.click && sfx.click(); } catch (e) {} if (++ticks > 22) clearInterval(tk); }, 160);
  const reveal = () => { const r = ov.querySelector('#bxRes'); if (!r) return; r.classList.remove('hide'); ov.classList.add('done', 'r' + res.it.r); try { (res.it.r >= 2 ? sfx.streak : sfx.ui)(); } catch (e) {} const f = r.querySelector('button'); if (f) f.focus(); };
  setTimeout(() => { if (res.it.secret && !res.dup) playSecretReveal(res.it.id, reveal); else reveal(); }, 4400);
  BOXV.ov = ov;
}
function boxClose() { if (BOXV.ov) BOXV.ov.remove(); BOXV.ov = null; BOXV.res = null; if (curScreen === 'rewards') { renderRewards(); focusFirst('[data-act^="rw-box-"]'); } }

/* ---------- screens and styles */
(() => {
  const mk = (id, html) => { const d = document.createElement('div'); d.id = id; d.className = 'screen cod pg-scr hide'; d.innerHTML = html; document.body.appendChild(d); };
  mk('locker', `<div class="cod-top"><div class="cod-title"><small>COSMETICS</small><b>LOCKER</b></div><nav class="cod-nav" id="lkFilters"></nav><div class="cod-card" id="lkTop"></div></div>
<div id="lkBody" class="lk-guns"></div><div class="cod-foot"><button class="btn" data-act="lk-back">&lsaquo; BACK</button><span class="padhint">B BACK</span></div>`);
  mk('rewards', `<div class="cod-top"><div class="cod-title"><small>DZ · LEVELS · BOXES</small><b>REWARDS</b></div><div style="flex:1"></div><div class="cod-card" id="rwTop"></div></div>
<div class="rw-body rw2"><div class="rw-col"><div class="rw-card" id="rwDaily"></div><div class="rw-card rw-track" id="rwTrack"></div></div><div class="rw-card" id="rwBox"></div></div>
<div class="cod-foot"><button class="btn" data-act="rw-back">&lsaquo; BACK</button><span class="padhint">B BACK</span></div>`);
  const s = document.createElement('style');
  s.textContent = `
.pg-card{display:flex;align-items:center;gap:10px}.pg-badge{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;padding:0 4px;box-sizing:border-box;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:linear-gradient(160deg,#f2c85a,#a8781e);color:#120e05;font-weight:900;font-size:13px;letter-spacing:0}
.pg-cardbar{margin-top:6px;min-width:110px}.pg-cardm{min-width:0}.pg-cardm .cs{max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.res-side{display:flex;flex-direction:column;gap:10px;min-width:0}#resXP .pg-res{margin:0;padding:10px 12px}#resXP .pg-res-h b{font-size:18px}#resXP .pg-res-rows{gap:4px 12px;font-size:10px}.pg-cardr{display:flex;flex-direction:column;gap:4px;min-width:120px}.pg-cardr small{font-size:9px;letter-spacing:.14em;color:var(--dim)}
.pg-bar{position:relative;height:6px;background:rgba(233,230,216,.14);overflow:hidden;flex:1}.pg-bar.sm{height:4px}.pg-bar i,.pg-bar s{position:absolute;left:0;top:0;bottom:0;text-decoration:none}.pg-bar s{background:var(--accent);transition:width 1.2s ease}.pg-bar i{background:rgba(224,180,74,.35);z-index:1}
.pg-dz,.rw-dz{display:inline-flex;align-items:center;gap:6px;font-weight:800;color:#fff;letter-spacing:.06em}.dzi{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#7cf0ff,#1b8fb0 60%,#0b4d61);color:#04212b;font-weight:900;font-size:8px;line-height:1;font-style:normal;letter-spacing:0;flex:0 0 22px;box-shadow:0 0 10px rgba(80,220,255,.35)}
.pg-res{margin:14px 0 4px;padding:12px 16px;border:1px solid var(--line);background:rgba(0,0,0,.4)}.pg-res-h{display:flex;align-items:baseline;gap:16px;margin-bottom:8px}.pg-res-h b{font-size:22px;color:var(--accent);letter-spacing:.08em}.pg-res-h em{font-style:normal;font-size:12px;letter-spacing:.3em;color:#0b0c0d;background:var(--accent);padding:4px 10px;animation:pgPop .6s .4s both}
.pg-res-bar{display:flex;align-items:center;gap:10px}.pg-lv{font-weight:900;color:#fff;min-width:24px;text-align:center}.pg-lv.nx{color:var(--dim)}
.pg-res-rows{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:10px;font-size:11px;letter-spacing:.14em;color:var(--dim)}.pg-res-rows b{color:#fff;margin-left:6px}.pg-res-up{margin-top:8px;font-size:12px;letter-spacing:.16em;color:#fff}.pg-res-up i{font-style:normal;font-weight:800}
@keyframes pgPop{from{opacity:0;transform:scale(.7)}}
.pg-scr .cod-foot{display:flex;align-items:center;gap:18px}
.lk-body,.rw-body{flex:1;display:grid;grid-template-columns:minmax(320px,500px) 1fr;gap:24px;padding:18px 3vw;min-height:0;overflow:auto;pointer-events:auto}
.lk-left{display:flex;flex-direction:column;gap:12px}.lk-gun{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid var(--line);background:rgba(0,0,0,.45);letter-spacing:.2em}
#lkPrev{width:100%;max-width:480px;aspect-ratio:12/5;background:radial-gradient(ellipse at 50% 60%,rgba(224,180,74,.10),rgba(0,0,0,.55) 70%);border:1px solid var(--line)}
.lk-name small{display:block;font-size:11px;letter-spacing:.32em;color:var(--rc,var(--dim))}.lk-name b{font-size:26px;letter-spacing:.12em;color:#fff}
.lk-acts{display:flex;flex-wrap:wrap;gap:10px}.lk-acts .btn{width:auto;min-width:0;padding:11px 16px;font-size:12px}.lk-lock{padding:10px 12px;border:1px dashed var(--line);color:var(--dim);letter-spacing:.2em;font-size:12px}.lk-count{font-size:11px;letter-spacing:.3em;color:var(--dim)}
.lk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(128px,1fr));gap:10px;align-content:start}
.lk-t{position:relative;display:flex;flex-direction:column;align-items:stretch;gap:6px;padding:8px;border:1px solid var(--line);border-bottom:3px solid var(--rc,#555);background:rgba(10,12,13,.75);color:#fff;cursor:pointer;pointer-events:auto;text-align:left;font-family:inherit}
.lk-t .lk-sw,.lk-t .lk-sw0{display:block;height:64px;background-size:72px;border:1px solid rgba(0,0,0,.4)}.lk-t .lk-sw0{display:flex;align-items:center;justify-content:center;color:var(--dim);background:#1b1d20}
.lk-t b{font-size:11px;letter-spacing:.12em}.lk-t small{font-size:9px;letter-spacing:.2em;color:var(--rc,var(--dim))}
.lk-t .lk-sw.stk{background-size:contain;background-repeat:no-repeat;background-position:center;background-color:#15181b}.lk-t.locked .lk-sw{filter:grayscale(.85) brightness(.45)}.lk-t.locked::after{content:"🔒";position:absolute;top:30px;left:50%;transform:translateX(-50%);font-size:18px;opacity:.85}
.lk-t.on,.lk-t:focus{outline:2px solid var(--accent);outline-offset:1px}.lk-t.eq::before{content:"EQUIPPED";position:absolute;top:12px;left:12px;font-size:8px;letter-spacing:.2em;background:var(--accent);color:#0b0c0d;padding:2px 5px;z-index:1}
.rw-col{display:flex;flex-direction:column;gap:16px}.rw-card{padding:16px 18px;border:1px solid var(--line);background:rgba(10,12,13,.78);display:flex;flex-direction:column;gap:10px}.rw-card>small{font-size:11px;letter-spacing:.34em;color:var(--accent)}
#rwDaily>b{font-size:30px;display:flex;align-items:center;gap:10px;color:#fff}#rwDaily>span{font-size:11px;letter-spacing:.14em;color:var(--dim)}.rw-card .btn{width:auto;align-self:flex-start;padding:11px 22px;display:inline-flex;align-items:center;gap:8px}
.rw-days{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.rw-days i{font-style:normal;text-align:center;font-size:10px;padding:6px 0;border:1px solid var(--line);color:var(--dim)}.rw-days i.got{background:rgba(224,180,74,.18);color:var(--accent)}.rw-days i.now{border-color:var(--accent);color:#fff;animation:pgGlow 1.4s ease-in-out infinite}
@keyframes pgGlow{50%{box-shadow:0 0 12px rgba(224,180,74,.6)}}
.rw-boximg{display:flex;justify-content:center;padding:6px 0}.rw-crate{width:120px;height:92px;position:relative;background:linear-gradient(160deg,#2b3036,#15181b);border:2px solid #4a5058;box-shadow:inset 0 0 0 6px rgba(0,0,0,.25),0 10px 30px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;animation:pgBob 2.6s ease-in-out infinite}
.rw-crate::before{content:"";position:absolute;left:-2px;right:-2px;top:34%;height:10px;background:linear-gradient(90deg,#f2b84b,#ffd77a,#f2b84b)}.rw-crate span{position:relative;font-weight:900;font-size:22px;letter-spacing:.1em;color:#7cf0ff;text-shadow:0 0 12px rgba(80,220,255,.6)}
@keyframes pgBob{50%{transform:translateY(-5px) rotate(-1deg)}}
.rw-odds{display:grid;grid-template-columns:repeat(2,1fr);gap:6px 16px;font-size:11px;letter-spacing:.16em}.rw-odds span{display:flex;align-items:center;gap:8px;color:var(--rc)}.rw-odds i{width:10px;height:10px;background:var(--rc)}.rw-odds b{margin-left:auto;color:#fff}
.rw-card p{margin:0;font-size:11px;line-height:1.5;color:var(--dim);letter-spacing:.04em}
.rw-drops{display:flex;flex-wrap:wrap;gap:6px}.rw-drops small{width:100%;font-size:10px;letter-spacing:.3em;color:var(--dim)}.rw-drops span{display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:.1em;padding:3px 8px 3px 3px;border:1px solid var(--line);border-left:3px solid var(--rc)}.rw-drops img{width:20px;height:20px}.rw-drops em{font-style:normal;color:var(--dim)}
.rw-track{align-self:start}.rw-lv{display:flex;align-items:center;gap:14px;padding:8px 10px;border-bottom:1px solid rgba(233,230,216,.07)}.rw-lv.item{background:linear-gradient(90deg,rgba(255,255,255,.04),transparent);border-left:3px solid var(--rc)}.rw-lv.max{justify-content:center;color:var(--accent);letter-spacing:.3em}
.rw-it{display:flex;align-items:center;gap:10px;margin-left:auto}.rw-it img{width:36px;height:36px;border:1px solid rgba(0,0,0,.5)}.rw-it b{font-size:12px;letter-spacing:.12em}.rw-it small{display:block;font-size:9px;letter-spacing:.2em;color:var(--rc)}
.rw-how{margin-top:6px;font-size:10px;letter-spacing:.14em;color:var(--dim)}
#boxOv{position:fixed;inset:0;z-index:240;display:flex;align-items:center;justify-content:center;background:rgba(3,4,5,.88);animation:hcIn .3s both}.bx-in{width:min(900px,94vw);text-align:center}.bx-in>small{font-size:12px;letter-spacing:.45em;color:var(--accent)}
.bx-win{position:relative;margin:18px 0;height:150px;overflow:hidden;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:rgba(0,0,0,.45)}.bx-reel{display:flex;gap:0;height:100%;align-items:center}
.bx-c{flex:0 0 120px;margin:0 6px;height:126px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border:1px solid var(--line);border-bottom:4px solid var(--rc);background:rgba(15,17,19,.95)}.bx-c img{width:72px;height:72px}.bx-c b{font-size:10px;letter-spacing:.1em;color:#fff}
.bx-mark{position:absolute;left:50%;top:0;bottom:0;width:2px;background:var(--accent);box-shadow:0 0 14px var(--accent)}
.bx-res{animation:pgZoom .5s}@keyframes pgZoom{from{transform:scale(.85)}}.bx-res small{display:block;font-size:12px;letter-spacing:.4em;color:var(--rc)}.bx-res b{display:block;font-size:40px;letter-spacing:.14em;color:#fff;text-shadow:0 0 30px var(--rc)}.bx-res span{display:block;margin:6px 0 16px;font-size:12px;letter-spacing:.24em;color:var(--dim)}
.bx-acts{display:flex;justify-content:center;gap:12px}.bx-acts .btn{width:auto;padding:12px 22px}
#boxOv.done.r3 .bx-win{box-shadow:0 0 60px rgba(242,184,75,.35) inset}#boxOv.done.r2 .bx-win{box-shadow:0 0 50px rgba(180,108,255,.3) inset}
.pg-toast{position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:260;padding:10px 20px;background:var(--accent);color:#0b0c0d;font-weight:800;letter-spacing:.24em;font-size:13px;transition:opacity .5s}.pg-toast.out{opacity:0}
#lkBody{flex:1;min-height:0;overflow:auto;pointer-events:auto;padding:16px 3vw}
.lk-guns{display:flex;flex-direction:column;gap:16px}.lk-crumb{align-self:center;padding:0 0 14px;font-size:12px;letter-spacing:.34em;color:var(--dim)}
.lk-cat>small{display:block;font-size:11px;letter-spacing:.34em;color:var(--accent);margin-bottom:8px}.lk-gg{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}
.lk-gun{position:relative;display:flex;flex-direction:column;gap:5px;padding:10px;border:1px solid var(--line);border-bottom:3px solid var(--rc,#3a3f45);background:rgba(10,12,13,.78);color:#fff;text-align:left;font-family:inherit;cursor:pointer}
.lk-gun:focus,.lk-gun:hover{outline:2px solid var(--accent);outline-offset:1px}.lk-gun b{font-size:13px;letter-spacing:.14em}.lk-gun small{font-size:9px;letter-spacing:.16em;color:var(--rc,var(--dim))}.lk-gun em{position:absolute;right:10px;top:8px;font-style:normal;font-size:9px;letter-spacing:.16em;color:var(--dim)}.lk-gimg{display:block;height:76px;margin-top:8px}.lk-gimg img{width:100%;height:100%;object-fit:contain}
.lk-gsw{display:flex;align-items:center;justify-content:center;height:44px;background:#16191c center/72px;font-size:9px;letter-spacing:.3em;color:var(--dim);border:1px solid rgba(0,0,0,.4)}
.lk-body{display:grid;grid-template-columns:minmax(320px,500px) 1fr;gap:24px;align-items:start}.lk-right{min-width:0}.lk-sub{font-size:11px;letter-spacing:.3em;color:var(--dim);margin-bottom:10px}
.lk-gun-h small{display:block;font-size:10px;letter-spacing:.34em;color:var(--accent)}.lk-gun-h b{font-size:30px;letter-spacing:.14em;color:#fff}
.lk-secret{padding:8px 10px;border:1px solid #ff2a4a;color:#ff6a7f;font-size:11px;letter-spacing:.2em;background:rgba(255,42,74,.08)}
.lk-empty{grid-column:1/-1;padding:18px;border:1px dashed var(--line);color:var(--dim);font-size:12px;letter-spacing:.08em;display:flex;align-items:center;justify-content:space-between;gap:12px}.lk-empty .btn{width:auto;padding:10px 16px;font-size:11px}
.lk-t.sec{background:linear-gradient(160deg,rgba(255,42,74,.18),rgba(10,12,13,.85));animation:pgSec 2.2s ease-in-out infinite}@keyframes pgSec{50%{box-shadow:0 0 18px rgba(255,42,74,.45)}}
.rw-boxes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.rw-bx{display:flex;flex-direction:column;gap:8px;padding:12px;border:1px solid var(--line);border-top:3px solid var(--bc);background:rgba(0,0,0,.35)}.rw-bx>b{font-size:16px;letter-spacing:.24em;color:var(--bc)}.rw-bx p{min-height:30px}
.rw-bx .btn{width:100%;justify-content:center;padding:9px 8px;font-size:11px}.rw-bx .rw-odds{grid-template-columns:1fr;gap:3px;font-size:10px}.rw-bx .rw-crate{width:84px;height:64px;border-color:var(--bc)}.rw-bx .rw-crate::before{background:var(--bc)}.rw-bx .rw-crate span{font-size:18px;color:#fff}
#boxSee{position:fixed;inset:0;z-index:235;display:flex;align-items:center;justify-content:center;background:rgba(3,4,5,.9);animation:hcIn .25s both}.bs-in{width:min(1100px,94vw);max-height:90vh;display:flex;flex-direction:column;border:1px solid var(--line);border-top:3px solid var(--bc);background:#0b0d0e}
.bs-h{display:flex;align-items:center;gap:18px;padding:14px 18px;border-bottom:1px solid var(--line)}.bs-h small{display:block;font-size:10px;letter-spacing:.34em;color:var(--dim)}.bs-h b{font-size:22px;letter-spacing:.2em;color:var(--bc)}.bs-h span{margin-left:auto;display:flex;align-items:center;gap:6px;font-weight:800;color:#fff}.bs-h .btn{width:auto;padding:10px 18px}
.bs-body{overflow:auto;padding:14px 18px;display:flex;flex-direction:column;gap:16px}.bs-sec h4{margin:0 0 8px;font-size:11px;letter-spacing:.3em;color:var(--rc)}.bs-sec p{margin:6px 0 0;font-size:11px;color:var(--dim)}
.bs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px}.bs-t{display:flex;flex-direction:column;gap:4px;padding:6px;border:1px solid var(--line);border-bottom:2px solid var(--rc);background:rgba(255,255,255,.02)}.bs-t img{width:100%;height:48px;object-fit:cover}.bs-t b{font-size:9px;letter-spacing:.1em;color:#fff}.bs-t small{font-size:8px;letter-spacing:.14em;color:var(--dim)}.bs-t.own small{color:var(--accent)}
.bs-t.hid{align-items:center;justify-content:center;min-height:80px;background:repeating-linear-gradient(45deg,#14080a 0 8px,#1c0a0e 8px 16px)}.bs-t.hid span{font-size:28px;font-weight:900;color:#ff2a4a}.bs-t.hid b{color:#ff6a7f}
.bx-c.sec{background:repeating-linear-gradient(45deg,#14080a 0 8px,#1c0a0e 8px 16px)}.bx-q{font-size:44px;font-weight:900;color:#ff2a4a;line-height:72px}
.bx-big{display:flex;justify-content:center;margin:8px 0}.bx-big img{width:120px;height:120px;border:2px solid var(--rc);box-shadow:0 0 30px var(--rc)}
#boxOv.done.r4 .bx-win{box-shadow:0 0 80px rgba(255,42,74,.55) inset}#boxOv.done.r4{animation:pgShake .5s 1}@keyframes pgShake{20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
.rw2{grid-template-columns:minmax(300px,420px) 1fr;align-items:start}.rw2 #rwBox{align-self:start}
#secVid{position:fixed;inset:0;z-index:250;background:#000;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity .35s}#secVid.out{opacity:0}#secVid video{width:100%;height:100%;object-fit:contain}#secVid span{position:absolute;right:24px;bottom:18px;font-size:10px;letter-spacing:.3em;color:rgba(255,255,255,.45)}
.lk-rv{margin-left:10px;width:auto;padding:4px 10px;font-size:10px;letter-spacing:.2em}
@media (max-width:900px){.rw2{grid-template-columns:1fr}.lk-body{grid-template-columns:1fr}.rw-boxes{grid-template-columns:1fr}}
@media (max-width:900px){.lk-body,.rw-body{grid-template-columns:1fr}}`;
  document.head.appendChild(s);
})();
