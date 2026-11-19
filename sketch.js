// noprotect
//
// ACKNOWLEDGEMENT OF AI USE
// I used Claude (Anthropic 2026) to help write and revise the JavaScript in this file.
// Claude wrote draft code from my written instructions and my reference drawings, and rewrote parts of it when I asked for changes. The idea, the look and the decisions are mine:
//   - I sketched the drawing and wrote the brief for this piece.
//   - I decided on the three palettes (aqua, antique rose + celadon, antique blue + blush) in a Shan Shui style.
//   - I asked for each change over many rounds (smoother bends, background waves, leaf groups, edge leaves, palettes) and tested every version in the p5.js web editor.
//   - I picked which versions to keep, tuned the settings, and edited and commented the code.
// Claude's output was not used without checking.
// Reference list entry:
//   Anthropic (2026) Claude [Large language model], accessed 17 November 2026. https://claude.ai
//
// Author: Nguyen Hoang Tue Minh, s4183536 - COMM2754 Assignment 1
//
// WEBPAGE HOOKS (the only changes made to embed the art in index.html - search for "WEBPAGE"):
//   - the canvas is painted once at 1920 px wide (RB_RENDER_W) and CSS scales it, so resizing never repaints
//   - the canvas is moved into <div id="art-mount">, and <html data-theme="0|1|2"> tells the CSS which palette is active
//   - the first draw is deferred a moment so the page text paints before the (slow) painting starts
//   - <body> gets the class "art-ready" when the painting is finished (the CSS fades the canvas in)
//
// Layout of this file: settings, palettes, helpers, ribbon, brush and paint layers, background, background waves, shading, leaves, flowers, p5 setup and draw.

let rbSeed = Math.floor(Math.random() * 1e6);
const RB_FORCE_THEME = -1;
const RB_THICK   = 1.0;    // ribbon width multiplier
const RB_WAVE    = 9;      // ripple amplitude (px)
const RB_WAVE_GROW = 0.0025;
const RB_WAVE_LAG  = 0.06;
const RB_CALM    = 0.3;    // calms the ripple at tight bends
const RB_CALM_R0 = 60;
const RB_CALM_R1 = 260;
const RB_COVER   = 1.0;    // base stroke density
const RB_LAYERS  = 0.5;    // density of the extra colour layers
const RB_POPNESS = 0.2;    // opacity of the extra layers
const RB_LEN     = 3;      // stroke length multiplier
const RB_BG      = 1.0;    // density of the curve-following background
const RB_BG_REACH = 340;
const RB_BG_TUCK   = 0.5;
const RB_BG_HALO   = 0.22;
const RB_BG_BANDS  = 1.0;
const RB_BG_SMOOTH = 10;
const RB_BG_SQUEEZE = 0.99;
const RB_SPARK   = 0;
const RB_LOTUS   = 1;      // 0 hides the lotus flowers on the ribbon
const RB_LOTUS_SHADOW = 0.5;
const RB_LOTUS_SHADOW_A = 0.3;
const RB_DRY     = 1.0;    // dry-brush gaps (0 = solid)
const RB_STREAKS = 0.5;
const RB_GRAIN   = 0;
const RB_GAP     = 40;     // min gap between two parts of the ribbon that pass near each other

// background waves
const WV_ON    = 1;
const WV_REACH = 1000;
const WV_BAND  = 75;
const WV_OVER  = 28;
const WV_COVER = 1.2;
const WV_MIN   = 14;
const WV_OWN   = 45;
const WV_EDGE  = 0.22;
const WV_ALPHA = 0.6;
const WV_SOFT  = 7;
const WV_FOLD  = 0.92;
const WV_LOOSEN = 200;
const WV_DRIFT  = 0.6;
const WV_CELL = 8, WV_PAD = 40;

// wave shading
const RB_SHADE        = 0.2;
const RB_SHADE_DEPTH  = 0.20;
const RB_SHADE_IRID   = 0.1;
const RB_SHADE_RIPPLE = 0;
const RB_SHADE_BODY   = 0.2;
const RB_SHADE_DROP   = 1.0;
const RB_LIGHT = [-0.55, -0.83];   // direction toward the light (upper left)

// background colour
const RB_RICH       = 1.0;
const RB_BG_FLUID   = 1.0;
const RB_BG_SWIRL   = 260;
const RB_BG_SWIRLS  = 1.4;
const RB_BG_PATCH   = 1.0;
const RB_BG_VIGNETTE = 0.10;
const RB_BG_BLUR    = true;    // canvas blur filter (Safari ignores it)

const RB_W = 1136, RB_H = 640, RB_ASPECT = RB_W / RB_H;
const RB_RENDER_W = 1920;   // WEBPAGE: the painting is rendered once at this width (brief: 1920 x 1080); CSS scales the canvas

// ---- palettes ----
// Every colour comes from the active theme.
const RB_THEMES = [
  // 0 aqua
  {
    name: 'aqua',
    paper: [228, 242, 238],
    fam: {
      teal:  [[74, 166, 172], [96, 180, 184], [130, 196, 206], [150, 190, 222]],
      strip: [[84, 156, 180], [110, 176, 196], [140, 196, 212]],
      fin:   [[150, 168, 214], [188, 190, 230], [226, 206, 230], [240, 222, 234], [250, 236, 240]],
      egg:   [[170, 186, 226], [200, 212, 240], [226, 230, 238], [238, 234, 224], [210, 226, 226]],
      green: [[96, 190, 196], [120, 204, 186], [168, 222, 170], [214, 230, 150], [150, 214, 200]],
      mint:  [[150, 200, 214], [186, 224, 214], [214, 236, 222]],
      leaf:  [[40, 160, 160], [60, 178, 172], [100, 200, 190]],
    },
    pop: [
      [[74, 166, 172], [96, 180, 184], [130, 196, 206], [150, 190, 222]],
      [[96, 190, 196], [120, 204, 186], [150, 214, 200]],
      [[150, 200, 214], [186, 224, 214], [214, 236, 222]],
      [[150, 168, 214], [188, 190, 230], [226, 206, 230]],
      [[226, 206, 230], [240, 222, 234], [250, 236, 240]],
      [[170, 186, 226], [200, 212, 240], [238, 234, 224]],
      [[168, 222, 170], [214, 230, 150], [150, 214, 200]],
    ],
    popW: [3, 3, 2, 2, 1.2, 1.5, 1.2],
    shadow: [[74, 166, 172], [84, 156, 180], [60, 150, 164]],
    edge: [60, 140, 150],
    irid: [[0.00, [208, 238, 226]], [0.20, [120, 196, 200]], [0.40, [112, 204, 224]],
           [0.60, [138, 172, 222]], [0.80, [196, 184, 236]], [1.00, [240, 214, 232]]],
    wv: [
      [[92, 176, 184], [120, 194, 200], [150, 206, 212]],
      [[120, 204, 186], [150, 214, 200], [186, 224, 214]],
      [[170, 214, 214], [196, 228, 226], [214, 236, 230]],
      [[176, 190, 228], [200, 208, 238], [226, 222, 240]],
      [[196, 226, 196], [214, 234, 208], [226, 242, 226]],
    ],
    leafPals: [
      [[112, 192, 182], [136, 206, 194], [162, 220, 206]],
      [[108, 188, 202], [134, 204, 214], [164, 218, 224]],
      [[122, 176, 208], [148, 192, 220], [176, 208, 228]],
      [[132, 204, 178], [160, 218, 190], [188, 228, 202]],
    ],
    leafIrids: [
      [[150, 190, 222], [184, 190, 234], [226, 208, 236]],
      [[150, 204, 214], [190, 198, 232], [238, 214, 232]],
    ],
    base: [140, 204, 208],
    halo: [[200, 232, 226], [186, 224, 222], [170, 216, 218], [160, 208, 216], [150, 200, 214], [140, 196, 210], [130, 190, 206]],
    vignette: [70, 150, 165],
    glaze: [[255, 236, 244], [170, 236, 232], [200, 220, 255]],
    drop: [62, 128, 150], bankShadow: [64, 128, 152], bankLight: [214, 240, 240],
    deep: [66, 128, 152], deepIr: [96, 124, 196], pale: [226, 246, 244],
    leafEdge: [100, 164, 176], leafDrop: [84, 150, 172], leafShade: [96, 156, 178], vein: [244, 252, 250],
    streak: [[255, 255, 255], [190, 236, 232], [150, 210, 214], [232, 224, 244], [246, 226, 236]],
    hi: [[240, 248, 248], [248, 240, 248], [236, 246, 240]],
    accG: [[214, 232, 120], [236, 240, 170], [130, 210, 190]],
    accO: [[150, 166, 222], [176, 186, 232], [255, 250, 246], [244, 214, 232]],
    dry: [[255, 255, 255], [255, 255, 255], [210, 242, 238], [230, 226, 244], [190, 236, 232]],
    accW: [[250, 254, 252], [250, 254, 252], [226, 232, 248], [214, 236, 226]],
    lotus: { petals: [[214, 226, 240], [246, 244, 248], [255, 252, 248]], inner: [244, 214, 226],
             stamen: [[226, 220, 150], [214, 226, 140], [240, 236, 190]], shadow: [52, 116, 140] },
  },

  // 1 antique rose + celadon
  {
    name: 'antique rose + celadon',
    paper: [238, 228, 210],
    fam: {
      teal:  [[201, 149, 130], [190, 136, 118], [217, 181, 160], [201, 160, 140]],
      strip: [[190, 138, 120], [201, 149, 130], [217, 181, 160]],
      fin:   [[217, 181, 160], [225, 196, 172], [230, 213, 185], [236, 224, 200], [240, 232, 214]],
      egg:   [[217, 181, 160], [222, 190, 168], [230, 213, 185], [232, 220, 196], [226, 206, 180]],
      green: [[190, 190, 160], [168, 182, 160], [150, 172, 150], [196, 200, 170], [217, 181, 160]],
      mint:  [[190, 190, 164], [205, 198, 172], [225, 208, 180]],
      leaf:  [[201, 149, 130], [190, 140, 120], [217, 181, 160]],
    },
    pop: [
      [[201, 149, 130], [217, 181, 160], [190, 140, 120], [210, 165, 145]],
      [[190, 134, 112], [201, 149, 130], [212, 168, 148]],
      [[230, 213, 185], [222, 200, 172], [217, 181, 160]],
      [[168, 182, 160], [190, 198, 170], [217, 206, 178]],
      [[230, 213, 185], [236, 224, 200], [217, 181, 160]],
      [[226, 206, 180], [236, 224, 200], [230, 213, 185]],
      [[168, 182, 160], [185, 190, 160], [217, 181, 160]],
    ],
    popW: [3, 3, 2, 2.2, 1.4, 1.5, 2.2],
    famW: { green: 2.6, mint: 1.6 },
    leafAcc: 1.5,
    shadow: [[168, 120, 104], [158, 110, 94], [148, 102, 88]],
    edge: [140, 98, 84],
    irid: [[0.00, [236, 226, 208]], [0.20, [226, 198, 176]], [0.40, [217, 181, 160]],
           [0.55, [190, 186, 160]], [0.66, [172, 186, 162]], [0.78, [212, 198, 172]],
           [0.90, [226, 204, 182]], [1.00, [230, 213, 185]]],
    wv: [
      [[201, 149, 130], [210, 165, 145], [217, 181, 160]],
      [[168, 182, 160], [184, 194, 164], [200, 204, 176]],
      [[230, 213, 185], [234, 220, 196], [238, 228, 206]],
      [[150, 172, 150], [176, 190, 162], [200, 206, 178]],
      [[226, 196, 174], [230, 208, 184], [234, 220, 198]],
    ],
    leafPals: [
      [[82, 107, 91], [113, 143, 125], [140, 163, 146]],
      [[113, 143, 125], [168, 170, 150], [201, 160, 140]],
      [[201, 149, 130], [217, 181, 160], [225, 196, 172]],
      [[190, 138, 118], [205, 155, 135], [217, 175, 155]],
    ],
    leafIrids: [
      [[201, 149, 130], [217, 181, 160], [225, 196, 172]],
      [[217, 181, 160], [230, 213, 185], [210, 170, 150]],
    ],
    base: [217, 181, 160],
    halo: [[232, 222, 204], [230, 214, 192], [228, 206, 182], [224, 198, 174], [220, 190, 168], [214, 180, 158], [208, 170, 148]],
    vignette: [150, 110, 90],
    glaze: [[250, 236, 214], [222, 228, 204], [244, 214, 196]],
    drop: [120, 80, 66], bankShadow: [150, 100, 84], bankLight: [244, 232, 212],
    deep: [160, 108, 92], deepIr: [150, 140, 112], pale: [240, 226, 204],
    leafEdge: [120, 98, 84], leafDrop: [110, 84, 70], leafShade: [110, 92, 78], vein: [244, 238, 222],
    streak: [[250, 244, 230], [236, 222, 200], [226, 206, 180], [214, 208, 184], [236, 214, 198]],
    hi: [[246, 238, 222], [250, 242, 230], [238, 236, 218]],
    accG: [[168, 182, 160], [190, 196, 168], [206, 206, 176]],
    accO: [[201, 149, 130], [230, 213, 185], [250, 242, 230], [217, 181, 160]],
    dry: [[250, 244, 232], [250, 244, 232], [236, 226, 206], [226, 214, 190], [214, 208, 184]],
    accW: [[250, 244, 232], [250, 244, 232], [236, 226, 206], [214, 214, 188]],
    lotus: { petals: [[232, 214, 206], [246, 238, 228], [252, 246, 238]], inner: [226, 180, 168],
             stamen: [[226, 200, 130], [214, 190, 120], [236, 214, 160]], shadow: [110, 76, 64] },
  },

  // 2 antique blue + blush
  {
    name: 'antique blue + blush',
    paper: [232, 226, 212],
    fam: {
      teal:  [[64, 94, 120], [78, 110, 134], [100, 134, 154], [88, 124, 146]],
      strip: [[64, 94, 120], [100, 134, 154], [150, 150, 170]],
      fin:   [[100, 134, 154], [130, 160, 176], [154, 183, 192], [216, 181, 173], [233, 214, 195]],
      egg:   [[100, 134, 154], [154, 183, 192], [216, 181, 173], [226, 196, 188], [233, 214, 195]],
      green: [[84, 126, 142], [110, 150, 160], [154, 183, 192], [216, 181, 173], [210, 196, 190]],
      mint:  [[154, 183, 192], [196, 196, 198], [216, 181, 173]],
      leaf:  [[64, 94, 120], [56, 88, 110], [84, 116, 138]],
    },
    pop: [
      [[64, 94, 120], [100, 134, 154], [84, 118, 140], [100, 134, 154]],
      [[88, 132, 146], [100, 146, 156], [120, 158, 168]],
      [[154, 183, 192], [180, 198, 200], [196, 208, 200]],
      [[64, 94, 120], [72, 100, 130], [100, 134, 154]],
      [[216, 181, 173], [226, 200, 188], [233, 214, 195]],
      [[196, 208, 200], [220, 214, 200], [233, 214, 195]],
      [[110, 150, 158], [154, 183, 192], [216, 181, 173]],
    ],
    popW: [3, 3, 2, 1.5, 3.4, 1.5, 1.6],
    famW: { fin: 1.7, egg: 2.1, green: 2.5, mint: 1.5 },
    leafAcc: 1.9,
    irAlpha: u => Math.min(1, Math.max(0.5, u < 0.1 ? 0.5 + 5 * u : 1 - 0.3 * Math.max(0, u - 0.8))),
    shadow: [[52, 80, 104], [58, 86, 110], [46, 74, 98]],
    edge: [44, 72, 94],
    irid: [[0.00, [233, 214, 195]], [0.16, [196, 208, 200]], [0.34, [154, 183, 192]],
           [0.50, [118, 150, 166]], [0.62, [216, 181, 173]], [0.74, [154, 183, 192]],
           [0.86, [222, 188, 182]], [1.00, [233, 214, 195]]],
    wv: [
      [[84, 118, 142], [100, 134, 154], [126, 156, 172]],
      [[120, 158, 170], [154, 183, 192], [180, 198, 200]],
      [[196, 208, 200], [214, 200, 196], [226, 200, 190]],
      [[160, 176, 190], [196, 186, 190], [216, 181, 173]],
      [[212, 172, 166], [220, 186, 178], [230, 204, 190]],
    ],
    leafPals: [
      [[100, 134, 154], [120, 152, 166], [146, 174, 184]],
      [[64, 94, 120], [84, 116, 140], [110, 140, 158]],
      [[110, 150, 156], [134, 168, 170], [160, 186, 184]],
      [[150, 168, 172], [190, 180, 180], [216, 190, 182]],
    ],
    leafIrids: [
      [[120, 152, 166], [190, 170, 176], [216, 181, 173]],
      [[154, 183, 192], [216, 181, 173], [226, 196, 188]],
    ],
    base: [100, 134, 154],
    halo: [[232, 218, 206], [222, 212, 204], [200, 212, 208], [184, 206, 206], [166, 194, 200], [146, 180, 192], [124, 158, 176]],
    vignette: [60, 90, 110],
    glaze: [[246, 222, 210], [190, 214, 214], [232, 200, 192]],
    drop: [40, 66, 90], bankShadow: [48, 76, 100], bankLight: [226, 230, 222],
    deep: [48, 76, 100], deepIr: [90, 110, 150], pale: [226, 230, 222],
    leafEdge: [64, 94, 120], leafDrop: [48, 74, 96], leafShade: [52, 80, 104], vein: [236, 242, 238],
    streak: [[248, 242, 230], [196, 208, 200], [154, 183, 192], [226, 190, 184], [233, 214, 195]],
    hi: [[236, 240, 236], [244, 226, 220], [226, 236, 234]],
    accG: [[110, 150, 156], [154, 183, 192], [196, 208, 200]],
    accO: [[64, 94, 120], [154, 183, 192], [250, 244, 234], [216, 181, 173]],
    dry: [[248, 244, 236], [248, 244, 236], [214, 222, 214], [196, 208, 200], [233, 214, 195]],
    accW: [[248, 244, 236], [240, 214, 206], [214, 222, 214], [233, 200, 192]],
    lotus: { petals: [[222, 216, 214], [246, 240, 232], [252, 248, 240]], inner: [216, 181, 173],
             stamen: [[226, 200, 130], [214, 190, 120], [236, 214, 160]], shadow: [44, 70, 92] },
  },
];

// the active theme, set by rbApplyTheme
let TH, RB_PAPER, RB_FAM, RB_POP, RB_POP_W, RB_SHADOW, RB_EDGE, RB_IRID, WV_PALS, RB_LEAF_PALS, RB_LEAF_IRIDS;
let rbThemeIdx = RB_FORCE_THEME >= 0 ? RB_FORCE_THEME % RB_THEMES.length : Math.floor(Math.random() * RB_THEMES.length);
function rbApplyTheme(k) {
  TH = RB_THEMES[k];
  RB_PAPER = TH.paper; RB_FAM = TH.fam; RB_POP = TH.pop; RB_POP_W = TH.popW; RB_SHADOW = TH.shadow; RB_EDGE = TH.edge;
  RB_IRID = TH.irid; WV_PALS = TH.wv; RB_LEAF_PALS = TH.leafPals; RB_LEAF_IRIDS = TH.leafIrids;
}
rbApplyTheme(rbThemeIdx);

let rbCw, rbCh, rbCtx, rbSC, rbBL;
let rbEdgeGrid = null;
const RB_EDGE_CELL = 70;
let wvGrid = null;

// runs fn n times (long while/for loops can trip the p5 editor's loop guard)
const rbRepeat = (n, fn) => Array.from({ length: Math.max(0, Math.round(n)) }, (_, q) => fn(q));

// ---- random and noise ----
let rbRS = 1;
function rbRnd() {
  rbRS = (rbRS + 0x6D2B79F5) | 0;
  let t = Math.imul(rbRS ^ (rbRS >>> 15), 1 | rbRS);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rbR       = (a, b) => a + (b - a) * rbRnd();
const rbPick    = arr => arr[Math.floor(rbRnd() * arr.length)];
const rbSeedInt = () => Math.floor(rbR(1, 100000));
const rbCl      = (v, a, b) => Math.min(b, Math.max(a, v));
const rbMix     = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const rbRgba    = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const rbTint    = (c, j) => { const d = rbR(-j, j); return c.map(v => rbCl(v + d + rbR(-j / 3, j / 3), 0, 255)); };
function rbGrad(pal, t) {
  t = rbCl(t, 0, 0.9999) * (pal.length - 1);
  const k = Math.floor(t);
  return rbMix(pal[k], pal[k + 1], t - k);
}
function rbHash(i, s) {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(s | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function rbN(x, s) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return rbHash(i, s) * (1 - u) + rbHash(i + 1, s) * u;
}
function rbFbm(x, s) {
  const v = 0.6 * rbN(x, s) + 0.3 * rbN(x * 2.1, s + 17) + 0.1 * rbN(x * 4.3, s + 31);
  return rbCl(0.5 + (v - 0.5) * 1.7, 0, 1);
}
function rbN2(x, y, s) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const h = (a, b) => rbHash(a + b * 7919, s);
  const a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1);
  return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy;
}
function rbFbm2(x, y, s) {
  return 0.55 * rbN2(x, y, s) + 0.3 * rbN2(x * 2.1, y * 2.1, s + 11) + 0.15 * rbN2(x * 4.3, y * 4.3, s + 23);
}

// ---- path tools ----
function rbSpline(ctrl, n) {
  const M = ctrl.length, out = [];
  for (let i = 0; i < n; i++) {
    const f = (i / (n - 1)) * (M - 1), k = Math.min(M - 2, Math.floor(f)), u = f - k;
    const p0 = ctrl[Math.max(k - 1, 0)], p1 = ctrl[k], p2 = ctrl[k + 1], p3 = ctrl[Math.min(k + 2, M - 1)];
    const cr = c => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * u +
      (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * u * u +
      (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * u * u * u);
    out.push([cr(0), cr(1)]);
  }
  return out;
}
function rbNorms(pts) {
  return pts.map((p, i) => {
    const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
    return [-dy / m, dx / m];
  });
}
function rbResample(pts, ds) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = cum[cum.length - 1], n = Math.max(8, Math.round(total / ds) + 1), out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = (total * k) / (n - 1);
    while (j < cum.length - 2 && cum[j + 1] < s) { j++; }
    const f = (s - cum[j]) / ((cum[j + 1] - cum[j]) || 1);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f]);
  }
  return out;
}
function rbSmoothPts(p, w, passes) {
  let cur = p;
  for (let ps = 0; ps < passes; ps++) {
    cur = cur.map((q, i) => {
      if (i === 0 || i === cur.length - 1) return q;
      let sx = 0, sy = 0, c = 0;
      for (let k = -w; k <= w; k++) {
        const j = i + k;
        if (j >= 0 && j < cur.length) { sx += cur[j][0]; sy += cur[j][1]; c++; }
      }
      return [sx / c, sy / c];
    });
  }
  return cur;
}
// normals and smoothed curvature, so the inner side of a tight bend squeezes instead of folding
function rbFrenet(C) {
  const n = C.length, N = [], th = new Float32Array(n), s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = C[Math.max(i - 2, 0)], b = C[Math.min(i + 2, n - 1)];
    const tx = b[0] - a[0], ty = b[1] - a[1], m = Math.hypot(tx, ty) || 1;
    N.push([-ty / m, tx / m]);
    th[i] = Math.atan2(ty, tx);
    if (i) s[i] = s[i - 1] + Math.hypot(C[i][0] - C[i - 1][0], C[i][1] - C[i - 1][1]);
  }
  for (let i = 1; i < n; i++) {
    while (th[i] - th[i - 1] > Math.PI) { th[i] -= 2 * Math.PI; }
    while (th[i] - th[i - 1] < -Math.PI) { th[i] += 2 * Math.PI; }
  }
  const raw = new Float32Array(n), kap = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(i - 2, 0), b = Math.min(i + 2, n - 1);
    raw[i] = (th[b] - th[a]) / ((s[b] - s[a]) || 1);
  }
  for (let i = 0; i < n; i++) {
    let sum = 0, cnt = 0;
    for (let k = -3; k <= 3; k++) { const j = i + k; if (j >= 0 && j < n) { sum += raw[j]; cnt++; } }
    kap[i] = sum / cnt;
  }
  const limP = new Float32Array(n), limN = new Float32Array(n), tmpP = new Float32Array(n), tmpN = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let mp = 4000, mn = 4000;
    for (let k = -14; k <= 14; k++) {
      const j = Math.min(n - 1, Math.max(0, i + k));
      if (kap[j] > 1e-4) mp = Math.min(mp, 1 / kap[j]);
      if (kap[j] < -1e-4) mn = Math.min(mn, -1 / kap[j]);
    }
    tmpP[i] = mp; tmpN[i] = mn;
  }
  for (let i = 0; i < n; i++) {
    let sp = 0, sn = 0, cnt = 0;
    for (let k = -8; k <= 8; k++) { const j = i + k; if (j >= 0 && j < n) { sp += tmpP[j]; sn += tmpN[j]; cnt++; } }
    limP[i] = sp / cnt; limN[i] = sn / cnt;
  }
  return { N, limP, limN };
}
// the ripple shared by the ribbon and everything around it
function rbMakeMicro(n) {
  const m = new Float32Array(n), sd = rbSeedInt();
  let ph = rbR(0, 6.28);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), lam = 34 + 12 * rbFbm(u * 2 + 1.7, sd);
    ph += (2 * Math.PI) / lam;
    const env = 0.6 + 0.4 * rbFbm(u * 1.6 + 4.1, sd + 9);
    m[i] = (env * (Math.sin(ph) + 0.04 * Math.sin(2 * ph + 1.1))) / 1.04;
  }
  rbSmoothArr(m, 2, 2);
  return m;
}
function rbMicroAt(sys, x) {
  const n = sys.n, xc = rbCl(x, 0, n - 1), k = Math.min(n - 2, Math.floor(xc)), f = xc - k;
  return sys.micro[k] * (1 - f) + sys.micro[k + 1] * f;
}
// maps (sample i, sideways distance v) to the canvas. flat = true skips the ripple
function rbPos(sys, i, v, flat) {
  let w = v;
  if (v > 0) { const L = sys.limP[i] * 1.25; w = L * (1 - Math.exp(-v / L)); }
  else if (v < 0) { const L = sys.limN[i] * 1.25; w = -L * (1 - Math.exp(v / L)); }
  if (!flat) {
    const d = Math.abs(w);
    w += RB_WAVE * sys.calm[i] * (1 + RB_WAVE_GROW * d) * rbMicroAt(sys, i - RB_WAVE_LAG * d);
  }
  return [sys.C[i][0] + sys.N[i][0] * w, sys.C[i][1] + sys.N[i][1] * w];
}

// ---- the ribbon: spine and widths ----
const RB_SPINE = [[240, -65], [210, 15], [110, 105], [80, 205], [140, 275], [250, 280], [370, 275], [480, 315],
                  [580, 395], [670, 475], [770, 585], [880, 615], [990, 590], [1080, 535], [1180, 445]];
const RB_KEYS = [[0, 150, 140], [0.052, 150, 140], [0.135, 100, 85], [0.2, 78, 86], [0.256, 68, 70], [0.323, 55, 65],
                 [0.397, 95, 70], [0.469, 150, 120], [0.548, 140, 245], [0.621, 165, 105], [0.713, 120, 85],
                 [0.783, 80, 72], [0.853, 85, 72], [0.917, 100, 70], [1, 110, 75]];

function rbMakeSpine() {
  const flipX = rbRnd() < 0.5, flipY = rbRnd() < 0.5;
  const amp = rbR(0.85, 1.25), rot = rbR(-0.07, 0.07);
  const cx = RB_W / 2, cy = RB_H / 2, cr = Math.cos(rot), sr = Math.sin(rot);
  const last = RB_SPINE.length - 1;
  const pts = RB_SPINE.map((p, i) => {
    const j = (i < 2 || i > last - 2) ? 20 : 50;
    let x = p[0] + rbR(-j, j), y = cy + (p[1] + rbR(-j, j) - cy) * amp;
    if (flipX) x = RB_W - x;
    if (flipY) y = RB_H - y;
    const dx = x - cx, dy = y - cy;
    return [cx + dx * cr - dy * sr, cy + dx * sr + dy * cr];
  });
  return rbExtendEnds(pts);
}
// extends both ends of the spine past the canvas
function rbExtendEnds(pts) {
  const M = 380, STEP = 70, cx = RB_W / 2, cy = RB_H / 2;
  const outside = p => p[0] < -M || p[0] > RB_W + M || p[1] < -M || p[1] > RB_H + M;
  const ext = (a, b) => {
    let dx = a[0] - b[0], dy = a[1] - b[1], m = Math.hypot(dx, dy) || 1;
    dx /= m; dy /= m;
    if (dx * (a[0] - cx) + dy * (a[1] - cy) < 0) {
      dx = a[0] - cx; dy = a[1] - cy; m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    }
    const out = [];
    let p = a;
    for (let s = 0; s < 40 && !outside(p); s++) { p = [p[0] + dx * STEP, p[1] + dy * STEP]; out.push(p); }
    return out;
  };
  const head = ext(pts[0], pts[1]), tail = ext(pts[pts.length - 1], pts[pts.length - 2]);
  const all = head.reverse().concat(pts, tail);
  let total = 0;
  for (let i = 1; i < all.length; i++) { total += Math.hypot(all[i][0] - all[i - 1][0], all[i][1] - all[i - 1][1]); }
  return { pts: all, u0: (head.length * STEP) / total, u1: 1 - (tail.length * STEP) / total };
}

function rbMakeSys() {
  const sp = rbMakeSpine(), dense = rbSpline(sp.pts, sp.pts.length * 30), dn = rbNorms(dense), sd = rbSeedInt();
  const disp = dense.map((p, k) => {
    const u = k / (dense.length - 1), a = 2.5 * (2 * rbFbm(u * 5, sd) - 1) * (0.4 + 0.6 * rbN(u * 3.1, sd + 7));
    return [p[0] + dn[k][0] * a, p[1] + dn[k][1] * a];
  });
  const C = rbResample(rbSmoothPts(disp, 6, 3), 4), fr = rbFrenet(C);
  const sys = { n: C.length, C, N: fr.N, limP: fr.limP, limN: fr.limN, u0: sp.u0, u1: sp.u1 };
  // calm factor: 1 on gentle stretches, lower on tight bends
  const calm = new Float32Array(sys.n);
  for (let i = 0; i < sys.n; i++) {
    const r = Math.min(sys.limP[i], sys.limN[i]);
    const t = rbSm((r - RB_CALM_R0) / (RB_CALM_R1 - RB_CALM_R0));
    calm[i] = rbCl(1 - RB_CALM * (1 - t), 0.1, 1);
  }
  rbSmoothArr(calm, 10, 3);
  sys.calm = calm;
  sys.micro = rbMakeMicro(sys.n);
  return sys;
}
function rbSmoothArr(a, w, passes) {
  const n = a.length;
  for (let p = 0; p < passes; p++) {
    const t = Float32Array.from(a);
    for (let i = 0; i < n; i++) {
      let sum = 0, cnt = 0;
      for (let k = -w; k <= w; k++) { const j = i + k; if (j >= 0 && j < n) { sum += t[j]; cnt++; } }
      a[i] = sum / cnt;
    }
  }
}
function rbMakeWidths(sys) {
  const n = sys.n, hp = new Float32Array(n), hm = new Float32Array(n), sd = rbSeedInt(), span = sys.u1 - sys.u0;
  const KEYS = RB_KEYS.map(k => [k[0], k[1] * rbR(0.88, 1.15), k[2] * rbR(0.88, 1.15)]);
  for (let i = 0; i < n; i++) {
    const uo = rbCl((i / (n - 1) - sys.u0) / span, 0, 1);
    let k = 0;
    while (k < KEYS.length - 2 && uo > KEYS[k + 1][0]) { k++; }
    const f = rbCl((uo - KEYS[k][0]) / (KEYS[k + 1][0] - KEYS[k][0]), 0, 1), s = f * f * (3 - 2 * f);
    hp[i] = KEYS[k][1] + (KEYS[k + 1][1] - KEYS[k][1]) * s;
    hm[i] = KEYS[k][2] + (KEYS[k + 1][2] - KEYS[k][2]) * s;
  }
  for (let q = 0; q < 9; q++) {
    const c = sys.u0 + rbR(0.04, 0.96) * span, sg = rbR(0.02, 0.045) * span, h = rbR(0.04, 0.12) * (rbRnd() < 0.3 ? -0.6 : 1), arr = rbRnd() < 0.5 ? hp : hm;
    for (let i = 0; i < n; i++) { arr[i] *= 1 + h * Math.exp(-Math.pow((i / (n - 1) - c) / sg, 2)); }
  }
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    hp[i] *= RB_THICK * (1 + 0.07 * (2 * rbFbm(u * 9, sd) - 1));
    hm[i] *= RB_THICK * (1 + 0.07 * (2 * rbFbm(u * 9 + 5, sd + 3) - 1));
  }
  rbSmoothArr(hp, 14, 5);
  rbSmoothArr(hm, 14, 5);
  return { hp, hm };
}

// ---- checking a ribbon ----
function rbCheck(sys, wd) {
  const n = sys.n, poly = rbOutline(sys, wd, 0, 12, 0);
  for (const [a, b] of [[poly[0], poly[2 * n - 1]], [poly[n - 1], poly[n]]]) {
    for (let t = 0; t <= 12; t++) {
      const x = a[0] + (b[0] - a[0]) * t / 12, y = a[1] + (b[1] - a[1]) * t / 12;
      if (x > -6 && x < RB_W + 6 && y > -6 && y < RB_H + 6) return -1;
    }
  }
  const G = RB_GAP, grid = new Map(), P = [];
  for (let i = 0; i < 2 * n; i += 2) {
    const p = poly[i];
    if (p[0] < -60 || p[0] > RB_W + 60 || p[1] < -60 || p[1] > RB_H + 60) continue;
    P.push([p[0], p[1], i < n ? i : 2 * n - 1 - i]);
  }
  const cell = (cx, cy) => (cx + 100) * 1000 + (cy + 100);
  P.forEach((q, k) => {
    const cellKey = cell(Math.floor(q[0] / G), Math.floor(q[1] / G));
    if (!grid.has(cellKey)) grid.set(cellKey, []);
    grid.get(cellKey).push(k);
  });
  let best = 999;
  P.forEach(q => {
    const cx = Math.floor(q[0] / G), cy = Math.floor(q[1] / G);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const list = grid.get(cell(cx + dx, cy + dy));
        if (!list) continue;
        for (const k of list) {
          const o = P[k];
          if (Math.abs(o[2] - q[2]) < 40) continue;
          const d = Math.hypot(o[0] - q[0], o[1] - q[1]);
          if (d < best) best = d;
        }
      }
    }
  });
  return best;
}
function rbBuild() {
  let best = null;
  rbRepeat(80, () => {
    if (best && best.score >= RB_GAP) return;
    const sys = rbMakeSys(), wd = rbMakeWidths(sys), score = rbCheck(sys, wd);
    if (!best || score > best.score) best = { sys, wd, score };
  });
  return best;
}

// ---- bristle brush ----
function rbBrush(pts, wv, col, a, o) {
  o = o || {};
  const c = rbCtx, n = pts.length;
  if (n < 2) return;
  const wAt = i => (typeof wv === 'number' ? wv : wv[i]);
  let avg = 0;
  for (let i = 0; i < n; i++) { avg += wAt(i); }
  avg /= n;
  const k = Math.max(2, Math.min(12, Math.round(avg / 2.2)));
  const dry = (o.dry === undefined ? 0.06 : o.dry) * RB_DRY;
  const nx = [], ny = [];
  for (let i = 0; i < n; i++) {
    const p = pts[Math.max(i - 1, 0)], q = pts[Math.min(i + 1, n - 1)];
    const dx = q[0] - p[0], dy = q[1] - p[1], m = Math.hypot(dx, dy) || 1;
    nx.push(-dy / m); ny.push(dx / m);
  }
  c.globalCompositeOperation = o.mode || 'source-over';
  c.lineCap = 'round';
  c.lineJoin = 'round';
  rbRepeat(k, q => {
    const off = q / (k - 1) - 0.5;
    if (o.col2) {
      const c1 = rbTint(col, o.jit === undefined ? 6 : o.jit), c2 = rbTint(o.col2, o.jit === undefined ? 6 : o.jit), aa = a * rbR(0.55, 1);
      const g = c.createLinearGradient(pts[0][0], pts[0][1], pts[n - 1][0], pts[n - 1][1]);
      g.addColorStop(0, rbRgba(c1, aa));
      g.addColorStop(1, rbRgba(c2, aa));
      c.strokeStyle = g;
    } else {
      c.strokeStyle = rbRgba(rbTint(col, o.jit === undefined ? 6 : o.jit), a * rbR(0.55, 1));
    }
    c.lineWidth = Math.max(0.6, (avg / k) * 1.7);
    c.beginPath();
    if (o.smooth) { rbSmoothBristle(pts, nx, ny, wAt, off, o.taper); } else {
      let pen = false;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const tw = o.taper ? Math.pow(Math.sin(Math.PI * rbCl(t, 0.04, 0.96)), o.taper) : 1;
        const o2 = off * wAt(i) * tw * (1 + 0.08 * Math.sin(i * 1.3 + q * 2.1));
        const x = pts[i][0] + nx[i] * o2, y = pts[i][1] + ny[i] * o2;
        if (rbRnd() < dry * (0.2 + 0.9 * t) * 0.3) { pen = false; continue; }
        if (!pen) { c.moveTo(x, y); pen = true; } else { c.lineTo(x, y); }
      }
    }
    c.stroke();
  });
}
// smooth bristle: no ripple, no gaps, curves through the midpoints
function rbSmoothBristle(pts, nx, ny, wAt, off, taper) {
  const c = rbCtx, n = pts.length;
  const P = pts.map((p, i) => {
    const t = i / (n - 1), tw = taper ? Math.pow(Math.sin(Math.PI * rbCl(t, 0.04, 0.96)), taper) : 1;
    return [p[0] + nx[i] * off * wAt(i) * tw, p[1] + ny[i] * off * wAt(i) * tw];
  });
  c.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i < n - 1; i++) {
    c.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2);
  }
  c.lineTo(P[n - 1][0], P[n - 1][1]);
}

// ---- painting ----
const rbSm = x => { x = rbCl(x, 0, 1); return x * x * (3 - 2 * x); };

// outline of both banks, smoothed extra hard
function rbOutline(sys, wd, rough, seed, inset) {
  const A = [], B = [];
  for (let i = 0; i < sys.n; i++) {
    const dh = ((0.7 * rbN(i * 0.15, seed) + 0.3 * rbN(i * 0.6, seed + 4)) - 0.5) * 2 * rough,
          dl = ((0.7 * rbN(i * 0.15 + 40, seed + 9) + 0.3 * rbN(i * 0.6 + 40, seed + 13)) - 0.5) * 2 * rough;
    A.push(rbPos(sys, i, wd.hp[i] * (1 - inset) + dh));
    B.push(rbPos(sys, i, -wd.hm[i] * (1 - inset) + dl));
  }
  const As = rbSmoothPts(A, 5, 4), Bs = rbSmoothPts(B, 5, 4);
  return As.concat(Bs.reverse());
}
function rbPath(pts) {
  const c = rbCtx, n = pts.length;
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  c.beginPath();
  c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  c.closePath();
}
// a stroke along the ribbon at cross-fraction f0, drifting by wob
function rbLine(sys, wd, i0, i1, f0, wob, w, col, a, o) {
  if (i1 - i0 < 6) return;
  const pts = [], wv = [], sd = rbSeedInt();
  for (let i = i0; i <= i1; i++) {
    const f = rbCl(f0 + wob * (2 * rbFbm(i * 0.012 + sd * 0.01, sd) - 1), 0.01, 0.99);
    pts.push(rbPos(sys, i, -wd.hm[i] + f * (wd.hm[i] + wd.hp[i])));
    wv.push(w * (0.7 + 0.3 * rbFbm(i * 0.03, sd + 3)));
  }
  rbBrush(pts, wv, col, a, o);
}

function rbStreaks() {
  const cols = TH.streak;
  rbRepeat(120 * RB_STREAKS, () => {
    const x = rbR(0, RB_W), y0 = rbR(-100, RB_H - 100), len = rbR(220, 480), pts = [];
    for (let y = y0; y < y0 + len; y += 14) { pts.push([x + 6 * Math.sin(y * 0.01 + x), y]); }
    rbBrush(pts, rbR(14, 30), rbPick(cols), 0.1, { dry: 0.2, taper: 0.3, jit: 4 });
  });
}
function rbColor(f, u, sd) {
  const bank = Math.pow(Math.abs(2 * f - 1), 1.5), mid = 1 - bank;
  const nA = rbSm((rbFbm(u * 3.0 + f * 7.0 + 3, sd) - 0.45) / 0.25);
  const nB = rbSm((rbFbm(u * 2.6 + f * 6.0 + 17, sd + 1) - 0.45) / 0.25);
  const nC = rbSm((rbFbm(u * 3.4 + f * 8.0 + 29, sd + 2) - 0.5) / 0.25);
  const nD = rbSm((rbFbm(u * 2.2 + f * 5.0 + 41, sd + 3) - 0.55) / 0.25);
  const w = {
    teal: 0.1 + 1.3 * bank, strip: 0.5 * bank * nD + 0.08, leaf: 0.8 * bank * nD,
    fin: mid * (0.15 + nA), egg: mid * (0.15 + nB), green: mid * nC, mint: 0.25 * mid + 0.2 * bank * (1 - nD),
  };
  if (TH.famW) { for (const fk in TH.famW) { w[fk] *= TH.famW[fk]; } }
  let sum = 0, r = 0, g = 0, bl = 0, k = 0;
  for (const fk in w) {
    k++;
    const t = rbCl((rbFbm(u * 6 + f * 4 + k * 5.3, sd + 9) - 0.5) * 1.7 + 0.5 + rbR(-0.1, 0.1), 0, 1), c = rbGrad(RB_FAM[fk], t);
    sum += w[fk]; r += c[0] * w[fk]; g += c[1] * w[fk]; bl += c[2] * w[fk];
  }
  return [r / sum, g / sum, bl / sum];
}
// 1. base strokes
function rbStrokes(sys, wd) {
  const n = sys.n;
  let sumTot = 0, maxTot = 1;
  for (let i = 0; i < n; i++) { const t = wd.hm[i] + wd.hp[i]; sumTot += t; maxTot = Math.max(maxTot, t); }
  const N = Math.round((sumTot * 4) / (13 * 75 * 0.55) * 2.6 * RB_COVER / Math.sqrt(RB_LEN));
  let placed = 0;
  rbRepeat(N * 8, () => {
    if (placed >= N) return;
    const i = Math.floor(rbR(0, n));
    if (rbRnd() > (wd.hm[i] + wd.hp[i]) / maxTot) return;
    placed++;
    const f = rbR(0.02, 0.98), len = Math.round(rbR(10, 28) * RB_LEN), w = rbR(9, 18);
    const i0 = Math.max(0, i - (len >> 1)), i1 = Math.min(n - 1, i0 + len), pts = [];
    for (let q = i0; q <= i1; q++) {
      const ff = rbCl(f + (rbN(q * 0.05 + i, 77) - 0.5) * 0.06, 0.01, 0.99);
      pts.push(rbPos(sys, q, -wd.hm[q] + ff * (wd.hm[q] + wd.hp[q])));
    }
    rbBrush(pts, w, rbColor(f, i / (n - 1), 31), rbR(0.5, 0.8), { dry: 0.1, taper: 0.45, jit: 6 });
  });
}

// ---- stacked colour layers ----
function rbPopColor(f, u, sd) {
  let idx = 0, tot = 0;
  RB_POP_W.forEach(w => { tot += w; });
  let r = (rbRnd() < 0.2 ? rbRnd() : rbFbm(u * 5 + f * 3.2 + 7, sd)) * tot;
  for (let k = 0; k < RB_POP_W.length; k++) { if (r < RB_POP_W[k]) { idx = k; break; } r -= RB_POP_W[k]; idx = k; }
  const t = rbR(0.1, 0.9);
  return { col: rbGrad(RB_POP[idx], t), col2: rbGrad(RB_POP[idx], rbCl(t + rbR(-0.3, 0.3), 0, 1)), idx };
}
function rbScatter(sys, wd, count, fLo, fHi, lenLo, lenHi, draw) {
  const n = sys.n;
  let maxTot = 1;
  for (let i = 0; i < n; i++) { maxTot = Math.max(maxTot, wd.hm[i] + wd.hp[i]); }
  let placed = 0;
  rbRepeat(count * 7, () => {
    if (placed >= count) return;
    const i = Math.floor(rbR(0, n));
    if (rbRnd() > (wd.hm[i] + wd.hp[i]) / maxTot) return;
    placed++;
    const f = rbR(fLo, fHi), len = Math.round(rbR(lenLo, lenHi));
    const i0 = Math.max(0, i - (len >> 1)), i1 = Math.min(n - 1, i0 + len);
    draw(i, i0, i1, f);
  });
}
// 2. colour patches
function rbPatches(sys, wd) {
  const n = sys.n;
  rbScatter(sys, wd, 650 * RB_LAYERS / Math.sqrt(RB_LEN), 0.02, 0.98, 6 * RB_LEN, 18 * RB_LEN, (i, i0, i1, f) => {
    const pc = rbPopColor(f, i / (n - 1), 61);
    rbLine(sys, wd, i0, i1, f, 0.03, rbR(12, 26), pc.col, Math.min(0.8, rbR(0.4, 0.65) * RB_POPNESS),
           { dry: 0.1, taper: 0.45, jit: 7, col2: pc.col2 });
  });
}
// 3. long soft washes
function rbFlows(sys, wd) {
  const n = sys.n;
  rbScatter(sys, wd, 70 * RB_LAYERS, 0.05, 0.95, 40 * RB_LEN, 110 * RB_LEN, (i, i0, i1, f) => {
    const pc = rbPopColor(f, i / (n - 1), 83);
    rbLine(sys, wd, i0, i1, f, 0.06, rbR(12, 22), pc.col, rbR(0.25, 0.4) * RB_POPNESS, { dry: 0.1, taper: 0.5, jit: 6, col2: pc.col2 });
  });
}
// 5. soft depth
function rbShadows(sys, wd) {
  rbScatter(sys, wd, 60 * RB_LAYERS / Math.sqrt(RB_LEN), 0.03, 0.97, 14 * RB_LEN, 40 * RB_LEN, (i, i0, i1, f) => {
    const ff = f < 0.5 ? f * 0.55 : 1 - (1 - f) * 0.55;
    rbLine(sys, wd, i0, i1, ff, 0.05, rbR(8, 16), rbPick(RB_SHADOW), rbR(0.25, 0.38) * RB_POPNESS, { dry: 0.12, taper: 0.55, jit: 6 });
  });
}
// 6. pale highlights
function rbHighlights(sys, wd) {
  const cols = TH.hi;
  rbScatter(sys, wd, 80 * RB_LAYERS / Math.sqrt(RB_LEN), 0.05, 0.95, 10 * RB_LEN, 30 * RB_LEN, (i, i0, i1, f) => {
    rbLine(sys, wd, i0, i1, f, 0.04, rbR(5, 10), rbPick(cols), rbR(0.3, 0.5), { dry: 0.14, taper: 0.55, jit: 4 });
  });
}

// thin accent streaks
function rbAccents(sys, wd) {
  const n = sys.n;
  let maxTot = 1;
  for (let i = 0; i < n; i++) { maxTot = Math.max(maxTot, wd.hm[i] + wd.hp[i]); }
  rbRepeat(70 * RB_COVER / Math.sqrt(RB_LEN), () => {
    const i = Math.floor(rbR(0, n));
    if (rbRnd() > (wd.hm[i] + wd.hp[i]) / maxTot) return;
    const f = rbR(0.15, 0.85), len = Math.round(rbR(14, 34) * RB_LEN), i0 = Math.max(0, i - (len >> 1)), i1 = Math.min(n - 1, i0 + len);
    const greenish = rbFbm((i / (n - 1)) * 3.4 + f * 8 + 29, 31 + 2) > 0.5;
    const col = greenish ? rbPick(TH.accG) : rbPick(TH.accO);
    rbLine(sys, wd, i0, i1, f, 0.05, rbR(2, 5), col, 0.5, { dry: 0.15, taper: 0.5, jit: 8 });
  });
}
// long thin pale lines along the whole wave
function rbDryStreaks(sys, wd) {
  const n = sys.n, cols = TH.dry;
  rbRepeat(170, () => {
    const i0 = Math.floor(rbR(0, 0.9) * n), i1 = Math.min(n - 1, i0 + Math.floor(rbR(50, 140)));
    rbLine(sys, wd, i0, i1, rbR(0.05, 0.95), 0.1, rbR(3, 10), rbPick(cols), 0.1, { dry: 0.2, taper: 0.4, jit: 4 });
  });
}
function rbEdges(sys, wd) {
  const n = sys.n;
  [0.03, 0.97].forEach(f0 => {
    let i = -Math.floor(rbR(0, 20));
    rbRepeat(n, () => {
      if (i >= n - 8) return;
      const len = Math.round(rbR(8, 20) * RB_LEN), i0 = Math.max(0, i), i1 = Math.min(n - 1, i + len);
      if (rbRnd() < 0.62) { rbLine(sys, wd, i0, i1, f0, 0.01, rbR(3, 6), RB_EDGE, 0.45, { dry: 0.12, taper: 0.6, jit: 6 }); }
      i = i1 + Math.round(rbR(-2, 8));
    });
  });
}
// ---- curve-following background ----
function rbBuildEdgeGrid(sys, wd) {
  const G = RB_EDGE_CELL, poly = rbOutline(sys, wd, 0, 12, 0), grid = new Map();
  poly.forEach(p => {
    if (p[0] < -300 || p[0] > RB_W + 300 || p[1] < -300 || p[1] > RB_H + 300) return;
    const cellKey = (Math.floor(p[0] / G) + 100) * 1000 + (Math.floor(p[1] / G) + 100);
    if (!grid.has(cellKey)) grid.set(cellKey, []);
    grid.get(cellKey).push(p);
  });
  rbEdgeGrid = grid;
}
function rbEdgeDist(x, y) {
  const G = RB_EDGE_CELL;
  if (!rbEdgeGrid) return 999;
  const cx = Math.floor(x / G), cy = Math.floor(y / G);
  let best = 2 * G;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const list = rbEdgeGrid.get((cx + dx + 100) * 1000 + (cy + dy + 100));
      if (!list) continue;
      for (const p of list) {
        const d = Math.hypot(p[0] - x, p[1] - y);
        if (d < best) best = d;
      }
    }
  }
  return best;
}
function rbBgLine(sys, wd, i0, i1, side, d0, wob, w, col, a, o) {
  if (i1 - i0 < 6) return;
  const raw = [], wv = [], squeezeOk = [], sd = rbSeedInt();
  const dMin = Math.max(3, w * (0.5 - RB_BG_TUCK));
  for (let i = i0; i <= i1; i++) {
    const d = Math.max(dMin, d0 + wob * (2 * rbFbm(i * 0.01 + sd * 0.01, sd) - 1));
    raw.push(rbPos(sys, i, side > 0 ? wd.hp[i] + d : -(wd.hm[i] + d), true));
    wv.push(w * (0.75 + 0.25 * rbFbm(i * 0.03, sd + 5)));
    const vOut = (side > 0 ? wd.hp[i] : wd.hm[i]) + d + 0.5 * w, L = (side > 0 ? sys.limP[i] : sys.limN[i]) * 1.25;
    squeezeOk.push((L * (1 - Math.exp(-vOut / L))) / vOut > RB_BG_SQUEEZE);
  }
  const pts = rbSmoothPts(raw, RB_BG_SMOOTH, 4), n = pts.length;
  const ok = pts.map((p, k) => {
    if (!squeezeOk[k]) return false;
    const a0 = pts[Math.max(k - 3, 0)], c0 = pts[Math.min(k + 3, n - 1)];
    const ux = p[0] - a0[0], uy = p[1] - a0[1], vx = c0[0] - p[0], vy = c0[1] - p[1];
    const lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy);
    if (lu < 1e-3 || lv < 1e-3) return true;
    const ang = Math.abs(Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy));
    const radius = ((lu + lv) / 2) / Math.max(ang, 1e-4);
    return radius > 0.6 * wv[k];
  });
  let s = -1;
  rbRepeat(n + 1, k => {
    if (k < n && ok[k]) { if (s < 0) s = k; return; }
    if (s >= 0) {
      if (k - s >= 8) { rbBrush(pts.slice(s, k), wv.slice(s, k), col, a, Object.assign({}, o, { smooth: true })); }
      s = -1;
    }
  });
}
function rbBgScatter(sys, wd, count, dLo, dHi, bias, draw) {
  const n = sys.n;
  rbRepeat(count * 3, () => {
    const i = Math.floor(rbR(0, n)), side = rbRnd() < 0.5 ? 1 : -1, d = dLo + (dHi - dLo) * Math.pow(rbRnd(), bias);
    const p = rbPos(sys, i, side > 0 ? wd.hp[i] + d : -(wd.hm[i] + d), true);
    if (p[0] < -60 || p[0] > RB_W + 60 || p[1] < -60 || p[1] > RB_H + 60) return;
    draw(i, side, d);
  });
}
function rbBgColor(d, f, sd) {
  const pc = rbPopColor(f, d / RB_BG_REACH, sd), fade = rbCl(0.12 + 0.62 * (d / RB_BG_REACH), 0, 0.8);
  return { col: rbMix(pc.col, RB_PAPER, fade), col2: rbMix(pc.col2, RB_PAPER, fade) };
}
function rbBgWashes(sys, wd) {
  const n = sys.n;
  rbBgScatter(sys, wd, 95 * RB_BG, 0, RB_BG_REACH, 1.25, (i, side, d) => {
    const len = Math.round(rbR(90, 230)), i0 = Math.max(0, i - (len >> 1)), i1 = Math.min(n - 1, i0 + len);
    const bc = rbBgColor(d, side * 0.5 + 0.5, 47), near = 1 - d / RB_BG_REACH;
    rbBgLine(sys, wd, i0, i1, side, d, 12, rbR(55, 105), bc.col, rbR(0.14, 0.24) * (0.45 + 0.75 * near), { dry: 0.12, taper: 0.5, jit: 8, col2: bc.col2 });
  });
}
function rbBgFlow(sys, wd) {
  const n = sys.n;
  rbBgScatter(sys, wd, 40 * RB_BG, 6, RB_BG_REACH * 0.85, 1.1, (i, side, d) => {
    const len = Math.round(rbR(70, 170)), i0 = Math.max(0, i - (len >> 1)), i1 = Math.min(n - 1, i0 + len);
    const bc = rbBgColor(d, side * 0.5 + 0.5, 59), near = 1 - d / RB_BG_REACH;
    rbBgLine(sys, wd, i0, i1, side, d, 8, rbR(18, 34), bc.col, rbR(0.2, 0.34) * (0.5 + 0.7 * near), { dry: 0.14, taper: 0.55, jit: 7, col2: bc.col2 });
  });
}
function rbBgLights(sys, wd) {
  const n = sys.n, cols = TH.hi.concat([TH.vein]);
  rbBgScatter(sys, wd, 16 * RB_BG, 10, RB_BG_REACH * 0.7, 1.0, (i, side, d) => {
    const len = Math.round(rbR(60, 140)), i0 = Math.max(0, i - (len >> 1)), i1 = Math.min(n - 1, i0 + len);
    rbBgLine(sys, wd, i0, i1, side, d, 5, rbR(6, 11), rbPick(cols), rbR(0.25, 0.45), { dry: 0.16, taper: 0.6, jit: 4 });
  });
}
function rbBgHalo(sys, wd) {
  if (RB_BG_HALO <= 0) return;
  const c = rbCtx, poly = rbOutline(sys, wd, 0, 12, 0);
  const rings = [260, 200, 150, 108, 72, 42, 18].map((r, k) => [r, TH.halo[k]]);
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  rings.forEach(r => {
    rbPath(poly);
    c.lineWidth = r[0] * 2;
    c.strokeStyle = rbRgba(r[1], RB_BG_HALO * 0.55);
    c.stroke();
  });
  c.restore();
}
function rbBgBands(sys, wd) {
  if (RB_BG_BANDS <= 0) return;
  const c = rbCtx, poly = rbOutline(sys, wd, 0, 12, 0);
  const radii = Array.from({ length: 16 }, (_, k) => RB_BG_REACH * Math.pow(0.78, k));
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  radii.forEach(r => {
    const bc = rbBgColor(r, rbR(0.2, 0.8), 47), near = 1 - r / RB_BG_REACH;
    rbPath(poly);
    c.lineWidth = r * 2;
    c.strokeStyle = rbRgba(bc.col, (0.16 + 0.22 * near) * RB_BG_BANDS);
    c.stroke();
  });
  c.restore();
}

// ---- marbled background ----
// colour ramp for the marbled field
function rbIrid(u) {
  u = rbCl(u, 0, 1);
  let k = 0;
  while (k < RB_IRID.length - 2 && u > RB_IRID[k + 1][0]) { k++; }
  const a = RB_IRID[k], b = RB_IRID[k + 1];
  return rbMix(a[1], b[1], rbCl((u - a[0]) / (b[0] - a[0]), 0, 1));
}
const rbIridAlpha = u => (TH.irAlpha ? TH.irAlpha(u) : rbCl(u < 0.1 ? 0.5 + 5 * u : u < 0.65 ? 1 : 1 - 1.1 * (u - 0.65), 0.35, 1));
const rbLight = (col, t) => rbMix(col, [255, 255, 255], t);

// runs fn with a canvas blur and restores the context afterwards
function rbBlurred(px, fn) {
  const c = rbCtx;
  c.save();
  if (RB_BG_BLUR && px > 0) { try { c.filter = 'blur(' + (px * rbBL).toFixed(2) + 'px)'; } catch (e) { /* no filter support: stay crisp */ } }
  try { fn(); } finally { c.restore(); }
}

let rbFluid = null;
function rbFluidSample(x, y, sd) {
  const st = v => rbCl(0.5 + (v - 0.5) * 2.3, 0, 1);
  const q1 = rbFbm2(x, y, sd), q2 = rbFbm2(x + 5.2, y + 1.3, sd + 1);
  const r1 = rbFbm2(x + 3.6 * q1 + 1.7, y + 3.6 * q2 + 9.2, sd + 2), r2 = rbFbm2(x + 3.6 * q1 + 8.3, y + 3.6 * q2 + 2.8, sd + 3);
  const f = rbFbm2(x + 3.2 * r1, y + 3.2 * r2, sd + 4);
  const u = rbCl(st(f) * 0.55 + st(r1) * 0.45 + 0.1 * Math.sin(f * 9 + r2 * 5), 0, 1);
  const m = rbSm((st(q1) * 0.5 + st(r2) * 0.5 - 0.28) / 0.5);
  return { u, m };
}
function rbFluidCanvas(S, aBase, aGain, k) {
  const SC = 4, w = Math.ceil(RB_W / SC), h = Math.ceil(RB_H / SC);
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const oc = off.getContext('2d'), img = oc.createImageData(w, h), d = img.data;
  rbRepeat(h, j => {
    for (let i = 0; i < w; i++) {
      const s = rbFluidSample((i * SC) / S + rbFluid.ox, (j * SC) / S + rbFluid.oy, rbFluid.sd);
      const col = rbIrid(s.u), p = (j * w + i) * 4;
      d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2];
      d[p + 3] = rbCl((aBase + aGain * s.m) * rbIridAlpha(s.u) * k, 0, 1) * 255;
    }
  });
  oc.putImageData(img, 0, 0);
  return { off, w, h };
}
function rbDrawFluid(f, blurPx) {
  const c = rbCtx;
  c.save();
  c.imageSmoothingEnabled = true;
  try { c.imageSmoothingQuality = 'high'; } catch (e) { /* ignore */ }
  rbBlurred(blurPx, () => c.drawImage(f.off, 0, 0, f.w, f.h, -8, -8, RB_W + 16, RB_H + 16));
  c.restore();
}
function rbFluidInit() {
  if (!rbFluid) { rbFluid = { sd: rbSeedInt(), ox: rbR(0, 60), oy: rbR(0, 60) }; }
}
// marbled colour field behind the waves
function rbBgFluidField() {
  const k = RB_BG_FLUID * RB_RICH;
  if (k <= 0) return;
  rbFluidInit();
  rbDrawFluid(rbFluidCanvas(RB_BG_SWIRL, 0.06, 0.30, k), 3);
}
// big blurred colour drifts and a few bright blooms
function rbBgDrifts() {
  const c = rbCtx, W = RB_W, H = RB_H, k = RB_BG_PATCH * RB_RICH;
  if (k <= 0) return;
  rbBlurred(60, () => {
    rbRepeat(14 * k, () => {
      const x = rbR(-100, W + 100), y = rbR(-100, H + 100), r = rbR(170, 360), u = rbR(0.12, 0.85), col = rbIrid(u);
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rbRgba(col, rbR(0.08, 0.15) * rbIridAlpha(u) * RB_RICH));
      g.addColorStop(1, rbRgba(col, 0));
      c.fillStyle = g;
      c.fillRect(x - r, y - r, 2 * r, 2 * r);
    });
  });
  c.save();
  c.globalCompositeOperation = 'screen';
  rbRepeat(6 * k, () => {
    const x = rbR(0, W), y = rbR(0, H), r = rbR(200, 380), col = rbLight(rbIrid(rbR(0.3, 0.9)), 0.7), g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rbRgba(col, 0.18 * RB_RICH));
    g.addColorStop(1, rbRgba(col, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
  });
  c.restore();
}

// tapered ribbon filled in one go
function rbRibbonFill(pts, wmax, sd, style) {
  const c = rbCtx, n = pts.length, nm = rbNorms(pts), L = [], R = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), w = 0.5 * wmax * Math.pow(Math.sin(Math.PI * rbCl(t, 0.02, 0.98)), 0.8) * (0.7 + 0.6 * rbN(i * 0.08, sd));
    L.push([pts[i][0] + nm[i][0] * w, pts[i][1] + nm[i][1] * w]);
    R.push([pts[i][0] - nm[i][0] * w, pts[i][1] - nm[i][1] * w]);
  }
  rbPath(L.concat(R.reverse()));
  c.fillStyle = style;
  c.fill();
}
// a smoothly curling path
function rbCurlPath(x, y, a, steps, ds, curl, sd) {
  const pts = [[x, y]], ph = rbR(0, 50);
  rbRepeat(steps, i => {
    a += curl * (2 * rbFbm(i * 0.035 + ph, sd) - 1);
    x += Math.cos(a) * ds;
    y += Math.sin(a) * ds;
    pts.push([x, y]);
  });
  return pts;
}
// soft curling swirls
function rbBgSwirls() {
  const c = rbCtx, W = RB_W, H = RB_H, k = RB_BG_SWIRLS * RB_RICH, sd = rbSeedInt();
  if (k <= 0) return;
  rbRepeat(34 * k, () => {
    const big = rbRnd() < 0.4, steps = Math.round(rbR(50, big ? 110 : 80)), ds = big ? rbR(10, 14) : rbR(7, 10);
    const raw = rbCurlPath(rbR(-80, W + 80), rbR(-80, H + 80), rbR(0, Math.PI * 2), steps, ds, rbR(0.09, 0.2), sd + rbSeedInt() % 97);
    const pts = rbSmoothPts(raw, 5, 3), n = pts.length;
    const m = rbRnd(), mode = m < 0.22 ? 'screen' : m < 0.3 ? 'multiply' : 'source-over';
    const u0 = rbR(0.05, 0.75), du = rbR(0.18, 0.4) * (rbRnd() < 0.5 ? 1 : -1), a = rbR(0.1, 0.2) * RB_RICH;
    const cols = [0, 0.5, 1].map(t => rbIrid(u0 + du * t)), lit = mode === 'screen' ? 0.5 : 0;
    const g = c.createLinearGradient(pts[0][0], pts[0][1], pts[n - 1][0], pts[n - 1][1]);
    g.addColorStop(0, rbRgba(rbLight(cols[0], lit), 0));
    g.addColorStop(0.3, rbRgba(rbLight(cols[0], lit), a));
    g.addColorStop(0.5, rbRgba(rbLight(cols[1], lit), a));
    g.addColorStop(0.7, rbRgba(rbLight(cols[2], lit), a));
    g.addColorStop(1, rbRgba(rbLight(cols[2], lit), 0));
    rbBlurred(rbR(8, big ? 32 : 22), () => {
      c.globalCompositeOperation = mode;
      rbRibbonFill(pts, big ? rbR(90, 190) : rbR(45, 110), sd + 3, g);
    });
  });
}
function rbBgVignette() {
  if (RB_BG_VIGNETTE <= 0) return;
  const c = rbCtx, W = RB_W, H = RB_H;
  c.save();
  c.globalCompositeOperation = 'multiply';
  const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.55);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, rbRgba(TH.vignette, RB_BG_VIGNETTE * RB_RICH));
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.restore();
}

// runs a step with its own random stream, then gives the main stream back
function rbIsolated(name, salt, fn) {
  const keep = rbRS;
  rbRS = (rbSeed * 104729 + salt * 15485863) | 0;
  rbTry(name, fn);
  rbRS = keep;
}

function rbBackground(sys, wd) {
  if (RB_BG <= 0) return;
  rbIsolated('bg drifts',  1, () => rbBgDrifts());
  rbIsolated('bg fluid',   2, () => rbBgFluidField());
  rbIsolated('bg swirls',  3, () => rbBgSwirls());
  rbTry('bg halo',   () => rbBgHalo(sys, wd));
  rbTry('bg bands',  () => rbBgBands(sys, wd));
  rbTry('bg washes', () => rbBgWashes(sys, wd));
  rbTry('bg flow',   () => rbBgFlow(sys, wd));
  rbTry('bg lights', () => rbBgLights(sys, wd));
  rbTry('bg vignette', () => rbBgVignette());
}

// ---- background waves ----
// Bands that echo the main wave and fill the space around it.
// Distances here are real pixels from the spine, not the squeezed coordinate used by rbPos.
const wvSq = (sys, i, side, v) => { const L = (side > 0 ? sys.limP[i] : sys.limN[i]) * 1.25; return L * (1 - Math.exp(-v / L)); };
let wvSd = 1, wvSmooth = null;
function wvAt(sys, i, side, h, v) {
  const t = rbSm(v / WV_LOOSEN), N = sys.N[i], M = wvSmooth.N[i];
  const dx = N[0] * (1 - t) + M[0] * t, dy = N[1] * (1 - t) + M[1] * t, dm = Math.hypot(dx, dy) || 1;
  const sc = 1 + WV_DRIFT * t * (2 * rbFbm(i * 0.0045 + 7.3, wvSd) - 1);
  return [sys.C[i][0] + N[0] * side * h + (dx / dm) * side * v * sc, sys.C[i][1] + N[1] * side * h + (dy / dm) * side * v * sc];
}

// grid of the nearest ribbon sample for every spot on the canvas
function wvBuildGrid(sys, wd) {
  const n = sys.n, poly = rbOutline(sys, wd, 0, 12, 0), px = [], py = [], pi = [];
  for (let k = 0; k < poly.length; k += 2) {
    const p = poly[k];
    if (p[0] < -250 || p[0] > RB_W + 250 || p[1] < -250 || p[1] > RB_H + 250) continue;
    px.push(p[0]); py.push(p[1]); pi.push(k < n ? k : 2 * n - 1 - k);
  }
  const gw = Math.ceil((RB_W + 2 * WV_PAD) / WV_CELL), gh = Math.ceil((RB_H + 2 * WV_PAD) / WV_CELL), own = new Int32Array(gw * gh);
  rbRepeat(gh, gy => {
    const y = gy * WV_CELL - WV_PAD + WV_CELL / 2;
    for (let gx = 0; gx < gw; gx++) {
      const x = gx * WV_CELL - WV_PAD + WV_CELL / 2;
      let best = 1e12, bi = -1000;
      for (let q = 0; q < px.length; q++) {
        const dx = px[q] - x, dy = py[q] - y, d = dx * dx + dy * dy;
        if (d < best) { best = d; bi = pi[q]; }
      }
      own[gy * gw + gx] = bi;
    }
  });
  wvGrid = { own, gw, gh };
}
function wvOwner(x, y) {
  const g = wvGrid, gx = rbCl(Math.floor((x + WV_PAD) / WV_CELL), 0, g.gw - 1), gy = rbCl(Math.floor((y + WV_PAD) / WV_CELL), 0, g.gh - 1);
  return g.own[gy * g.gw + gx];
}
function wvAvail(sys, wd, side, wb) {
  const n = sys.n, av = new Float32Array(n);
  rbRepeat(n, i => {
    const c = sys.C[i];
    if (c[0] < -150 || c[0] > RB_W + 150 || c[1] < -150 || c[1] > RB_H + 150) return;
    const lim = Math.max((side > 0 ? sys.limP[i] : sys.limN[i]) * WV_FOLD, wb[i]);
    let last = 0;
    for (let d = 6; d <= WV_REACH; d += 6) {
      const w = wb[i] + d;
      if (w > lim) break;
      const p = wvAt(sys, i, side, wb[i], d);
      if (p[0] < -WV_PAD + 10 || p[0] > RB_W + WV_PAD - 10 || p[1] < -WV_PAD + 10 || p[1] > RB_H + WV_PAD - 10) { last = d; break; }
      if (Math.abs(wvOwner(p[0], p[1]) - i) > WV_OWN) break;
      last = d;
    }
    av[i] = last;
  });
  rbSmoothArr(av, 12, 4);
  return av;
}
function wvRuns(av) {
  const runs = [];
  let s = -1;
  for (let i = 0; i <= av.length; i++) {
    const ok = i < av.length && av[i] >= WV_MIN;
    if (ok) { if (s < 0) s = i; } else if (s >= 0) { if (i - s >= 30) runs.push([s, i - 1]); s = -1; }
  }
  return runs;
}
function wvLine(B, i0, i1, f, w, col, a, o) {
  if (i1 - i0 < 6) return;
  const pts = [];
  for (let q = i0; q <= i1; q++) {
    const ff = rbCl(f + 0.04 * (2 * rbFbm(q * 0.012 + f * 9, B.sd) - 1), 0.01, 0.99), j = q - B.r0;
    const v = B.bIn[j] + ff * (B.bOut[j] - B.bIn[j]);
    pts.push(wvAt(B.sys, q, B.side, B.h[q], v));
  }
  const m = pts[pts.length >> 1];
  if (m[0] < -60 || m[0] > RB_W + 60 || m[1] < -60 || m[1] > RB_H + 60) return;
  rbBrush(rbSmoothPts(pts, 2, 2), w, col, a, o);
}
function wvPaintLayer(B, pal, l, nL) {
  const c = rbCtx, r0 = B.r0, r1 = B.r1, L = r1 - r0 + 1, A = [], Z = [];
  let area = 0;
  for (let j = 0; j < L; j++) {
    const i = r0 + j;
    A.push(wvAt(B.sys, i, B.side, B.h[i], B.bIn[j]));
    Z.push(wvAt(B.sys, i, B.side, B.h[i], B.bOut[j]));
    area += Math.max(0, B.bOut[j] - B.bIn[j]) * 4;
  }
  const poly = rbSmoothPts(A, 4, 3).concat(rbSmoothPts(Z, 4, 3).reverse());
  // wet wash
  rbBlurred(WV_SOFT, () => {
    rbPath(poly);
    c.fillStyle = rbRgba(rbGrad(pal, 0.5), 0.55 * WV_ALPHA);
    c.fill();
  });
  c.save();
  rbPath(poly);
  c.clip();
  c.globalAlpha = WV_ALPHA;
  // broad soft strokes that follow the wave
  rbBlurred(WV_SOFT * 0.25, () => rbRepeat(Math.round((area / (18 * 100 * 0.55)) * 1.4 * WV_COVER), () => {
    const i = Math.floor(rbR(r0, r1)), len = Math.round(rbR(30, 80)), i0 = Math.max(r0, i - (len >> 1)), i1 = Math.min(r1, i0 + len);
    const j = i - r0, room = B.bOut[j] - B.bIn[j], w = Math.min(rbR(16, 36), room * 0.7);
    if (w < 3) return;
    const t = rbCl(rbFbm(i * 0.01 + 3, B.sd + 5) + rbR(-0.15, 0.15), 0, 1);
    wvLine(B, i0, i1, rbR(0.02, 0.98), w, rbGrad(pal, t), rbR(0.25, 0.5),
           { dry: 0.1, taper: 0.5, jit: 7, col2: rbGrad(pal, rbCl(t + rbR(-0.3, 0.3), 0, 1)) });
  }));
  // thin pale filaments along the band
  const accCols = TH.accW.concat([pal[0]]);
  rbBlurred(0.9, () => rbRepeat(Math.round((area / 2600) * WV_COVER), () => {
    const i = Math.floor(rbR(r0, r1)), len = Math.round(rbR(40, 120)), i0 = Math.max(r0, i - (len >> 1)), i1 = Math.min(r1, i0 + len);
    wvLine(B, i0, i1, rbR(0.08, 0.92), rbR(1.5, 3.5), rbPick(accCols), rbR(0.3, 0.55), { dry: 0.15, taper: 0.55, jit: 8 });
  }));
  c.restore();
  // pigment pooling along the outer edge
  const edgeCol = rbMix(rbGrad(pal, 0.15), RB_EDGE, 0.3), ea = WV_EDGE * (1 - 0.5 * l / Math.max(1, nL));
  let i = r0;
  rbBlurred(WV_SOFT * 0.4, () => rbRepeat((r1 - r0) / 10 + 2, () => {
    if (i >= r1 - 8) return;
    const i1 = Math.min(r1, i + Math.round(rbR(20, 50)));
    if (rbRnd() < 0.62) { wvLine(B, i, i1, 0.985, rbR(4, 8), edgeCol, ea, { dry: 0.12, taper: 0.6, jit: 6 }); }
    i = i1 + Math.round(rbR(-2, 8));
  }));
}
function wvPaintRun(sys, wd, side, h, av, r0, r1) {
  const L = r1 - r0 + 1, sd = rbSeedInt();
  let maxAv = 0;
  for (let j = 0; j < L; j++) { maxAv = Math.max(maxAv, av[r0 + j]); }
  const nL = rbCl(Math.round(maxAv / WV_BAND), 2, 9);
  const fr = Array.from({ length: nL + 1 }, (_, k) => (k === 0 ? 0 : k === nL ? 1 : rbCl(k / nL + rbR(-0.3, 0.3) / nL, 0.05, 0.95)));
  const bs = fr.map((f, k) => {
    const arr = new Float32Array(L), ph = rbR(0, 50), over = k === nL ? WV_OVER : 0;
    for (let j = 0; j < L; j++) {
      const i = r0 + j, tp = rbSm(Math.min(j, L - 1 - j) / 20), a = av[i];
      const wob = (k > 0 && k < nL) ? 0.1 * a * (2 * rbFbm(i * 0.011 + ph, sd + k) - 1) : 0;
      arr[j] = -6 + (f * a + wob + over) * tp;
    }
    return arr;
  });
  for (let k = 1; k < bs.length; k++) { for (let j = 0; j < L; j++) { bs[k][j] = Math.max(bs[k][j], bs[k - 1][j] + 1.5); } }
  const pals = [];
  let prev = 0;
  for (let l = 0; l < nL; l++) {
    let idx = 0;
    if (l > 0) { idx = 1 + Math.floor(rbR(0, 4)); if (idx === prev) idx = 1 + Math.floor(rbR(0, 4)); }
    prev = idx;
    pals.push(WV_PALS[idx].map(col => rbMix(col, RB_PAPER, 0.12 + 0.35 * (l / nL))));
  }
  rbRepeat(nL, q => {
    const l = nL - 1 - q;   // outermost band first
    const bIn = l > 0 ? bs[l].map(v => v - 8) : bs[l];
    wvPaintLayer({ sys, side, h, r0, r1, sd, bIn, bOut: bs[l + 1] }, pals[l], l, nL);
  });
}
function rbBgWaves(sys, wd) {
  if (!WV_ON) return;
  wvBuildGrid(sys, wd);
  wvSd = rbSeedInt();
  wvSmooth = { N: rbNorms(rbSmoothPts(sys.C, 30, 4)) };
  [1, -1].forEach(side => {
    const hv = side > 0 ? wd.hp : wd.hm;
    const wb = Float32Array.from(hv, (v, i) => wvSq(sys, i, side, v));
    const av = wvAvail(sys, wd, side, wb);
    wvRuns(av).forEach(r => rbTry('bg wave run', () => wvPaintRun(sys, wd, side, wb, av, r[0], r[1])));
  });
}

// ---- wave shading ----
const rbAcross = (sys, wd, i, f) => rbPos(sys, i, -wd.hm[i] + f * (wd.hm[i] + wd.hp[i]));

function rbLitArray(sys) {
  const L = RB_LIGHT, m = Math.hypot(L[0], L[1]) || 1;
  return Array.from({ length: sys.n }, (_, i) => (sys.N[i][0] * L[0] + sys.N[i][1] * L[1]) / m);
}
function rbBandFill(sys, wd, fA, fB, style) {
  const c = rbCtx, n = sys.n;
  const idx = Array.from({ length: Math.ceil(n / 2) }, (_, k) => Math.min(n - 1, k * 2));
  const A = rbSmoothPts(idx.map(i => rbAcross(sys, wd, i, fA(i))), 2, 2);
  const B = rbSmoothPts(idx.map(i => rbAcross(sys, wd, i, fB(i))), 2, 2);
  rbPath(A.concat(B.reverse()));
  c.fillStyle = style;
  c.fill();
}
function rbDropShadow(sys, wd) {
  if (RB_SHADE_DROP <= 0) return;
  const c = rbCtx, poly = rbOutline(sys, wd, 0, 12, 0), k = RB_SHADE * RB_SHADE_DROP;
  [[16, 9, 15, 0.16], [6, 4, 7, 0.14]].forEach(s => {
    rbBlurred(s[2], () => {
      c.globalCompositeOperation = 'multiply';
      c.translate(-RB_LIGHT[0] * s[0], -RB_LIGHT[1] * s[0]);
      rbPath(poly);
      c.fillStyle = rbRgba(TH.drop, s[3] * k);
      c.fill();
    });
  });
}
function rbShadeBanks(sys, wd, lit, sd) {
  const c = rbCtx, k = RB_SHADE;
  const depth = (side, i, mult) => {
    const facing = side > 0 ? -lit[i] : lit[i];
    const wob = 0.7 + 0.6 * rbFbm(i * 0.015 + side * 7, sd + (side > 0 ? 1 : 2));
    return rbCl(RB_SHADE_DEPTH * mult * (0.78 + 0.4 * facing) * wob, 0.03, 0.6);
  };
  rbBlurred(8, () => {
    c.globalCompositeOperation = 'multiply';
    [[1.0, 0.10], [0.62, 0.12], [0.32, 0.15]].forEach(([mult, alpha]) => {
      const sty = rbRgba(TH.bankShadow, alpha * k * 0.5);
      rbBandFill(sys, wd, () => 0, i => depth(-1, i, mult), sty);
      rbBandFill(sys, wd, i => 1 - depth(1, i, mult), () => 1, sty);
    });
  });
  rbBlurred(2.5, () => {
    c.globalCompositeOperation = 'screen';
    const sty = rbRgba(TH.bankLight, 0.16 * k);
    rbBandFill(sys, wd, i => (lit[i] > 0 ? 0.93 : 0.035), i => (lit[i] > 0 ? 0.985 : 0.09), sty);
  });
}
function rbShadeRipples(sys, wd) {
  if (RB_SHADE_RIPPLE <= 0) return;
  const c = rbCtx, n = sys.n, k = RB_SHADE * RB_SHADE_RIPPLE, STEP = 3, RIPPLE_LINES = 5;
  const segs = Array.from({ length: Math.floor((n - 1) / STEP) }, (_, q) => {
    const i = q * STEP, j = Math.min(n - 1, i + STEP);
    const slope = sys.micro[Math.min(n - 1, i + 4)] - sys.micro[Math.max(0, i - 4)];
    return { i, j, s: rbCl(slope / 1.5, -1, 1) };
  });
  const pass = (mode, sign, rgb, blur, gain) => rbBlurred(blur, () => {
    c.globalCompositeOperation = mode;
    c.lineCap = 'butt';
    segs.forEach(g => {
      const a = sign * g.s;
      if (a <= 0.04) return;
      const p0 = rbPos(sys, g.i, 0, true);
      if (p0[0] < -80 || p0[0] > RB_W + 80 || p0[1] < -80 || p0[1] > RB_H + 80) return;
      c.lineWidth = (wd.hm[g.i] + wd.hp[g.i]) * (1 / RIPPLE_LINES) * 1.1;
      c.strokeStyle = rbRgba(rgb, a * gain * k);
      Array.from({ length: RIPPLE_LINES }, (_, l) => (l + 0.5) / RIPPLE_LINES).forEach(f => {
        const A = rbAcross(sys, wd, g.i, f), B = rbAcross(sys, wd, g.j, f);
        c.beginPath();
        c.moveTo(A[0], A[1]);
        c.lineTo(B[0], B[1]);
        c.stroke();
      });
    });
  });
  pass('screen',   1, TH.bankLight, 2.5, 0.15);
  pass('multiply', -1, TH.bankShadow, 2.5, 0.14);
}
function rbShadeStrokes(sys, wd, lit, sd) {
  if (RB_SHADE_BODY <= 0) return;
  const n = sys.n, k = RB_SHADE * RB_SHADE_BODY, ir = RB_SHADE_IRID;
  let maxTot = 1;
  for (let i = 0; i < n; i++) { maxTot = Math.max(maxTot, wd.hm[i] + wd.hp[i]); }
  const hueAt = (i, dv) => rbIrid(rbCl(0.12 + 0.7 * rbFbm(i * 0.004 + 3, sd + 8) + dv, 0, 1));
  const deep = (i, dv) => rbMix(TH.deep, rbMix(hueAt(i, dv), TH.deepIr, 0.35), ir);
  const pale = (i, dv) => rbMix(TH.pale, rbLight(hueAt(i, dv), 0.35), ir);
  const pass = (count, shadow, mode, blur, lenLo, lenHi, wLo, wHi, aLo, aHi, reach, o) => rbBlurred(blur, () => {
    rbRepeat(count * 4, () => {
      const i = Math.floor(rbR(0, n));
      if (rbRnd() > (wd.hm[i] + wd.hp[i]) / maxTot) return;
      const len = Math.round(rbR(lenLo, lenHi)), i0 = Math.max(0, i - (len >> 1)), i1 = Math.min(n - 1, i0 + len);
      const awayMinus = lit[i] > 0;
      const minusSide = shadow ? awayMinus : !awayMinus;
      const fr = rbR(0.02, reach), f = minusSide ? fr : 1 - fr;
      const dv = rbR(0.12, 0.3) * (rbRnd() < 0.5 ? 1 : -1);
      const col = shadow ? deep(i, 0) : pale(i, 0), col2 = shadow ? deep(i, dv) : pale(i, dv);
      rbLine(sys, wd, i0, i1, f, 0.05, rbR(wLo, wHi), col, rbR(aLo, aHi) * k,
             Object.assign({ mode, col2, jit: 5 }, o));
    });
  });
  pass(60, true,  'multiply', 6,   50, 150, 24, 48, 0.10, 0.17, 0.46, { dry: 0.05, taper: 0.5 });
  pass(110, true, 'multiply', 0.8, 25, 85,  8,  18, 0.12, 0.20, 0.40, { dry: 0.14, taper: 0.5 });
  pass(45, false, 'screen',   6,   50, 150, 20, 42, 0.08, 0.14, 0.55, { dry: 0.05, taper: 0.5 });
  pass(85, false, 'screen',   0.8, 25, 85,  5,  14, 0.12, 0.22, 0.50, { dry: 0.14, taper: 0.5 });
  rbBlurred(0.5, () => {
    rbRepeat(36 * k * ir, () => {
      const i = Math.floor(rbR(0, n));
      if (rbRnd() > (wd.hm[i] + wd.hp[i]) / maxTot) return;
      const len = Math.round(rbR(30, 100)), i0 = Math.max(0, i - (len >> 1)), i1 = Math.min(n - 1, i0 + len);
      const f = rbCl(0.5 + 0.16 * lit[i] + rbR(-0.14, 0.14), 0.15, 0.85), dv = rbR(0.2, 0.4) * (rbRnd() < 0.5 ? 1 : -1);
      rbLine(sys, wd, i0, i1, f, 0.04, rbR(2, 5), rbLight(hueAt(i, 0), 0.3), rbR(0.22, 0.38),
             { mode: 'screen', col2: rbLight(hueAt(i, dv), 0.3), dry: 0.12, taper: 0.6, jit: 4 });
    });
  });
}
function rbShade(sys, wd) {
  if (RB_SHADE <= 0) return;
  const lit = rbLitArray(sys), sd = rbSeedInt();
  rbTry('shade ripples', () => rbShadeRipples(sys, wd));
  rbTry('shade banks',   () => rbShadeBanks(sys, wd, lit, sd));
  rbTry('shade strokes', () => rbShadeStrokes(sys, wd, lit, sd));
}

// ---- lotus leaves ----
// Each leaf follows the flow of the main wave and is painted on top of everything.
// Edge leaves are centred on the canvas border so about half of each is cut off.
// A cluster is one main leaf plus a few smaller leaves touching it.
const RB_LEAF        = 1;     // 0 hides the leaves
const RB_LEAF_EDGE   = 3;     // big leaf groups cut off by the border
const RB_LEAF_COUNT  = 4;     // normal leaf clusters
const RB_LEAF_GROUP  = 3;     // max extra leaves per cluster
const RB_LEAF_TOUCH  = 0.86;  // how close group leaves sit (1 = just touching)
const RB_LEAF_MIN    = 190;
const RB_LEAF_MAX    = 380;
const RB_LEAF_BIG_MIN = 380;
const RB_LEAF_BIG_MAX = 560;
const RB_LEAF_WIDTH  = 0.40;  // half-width / length
const RB_LEAF_RUFFLE = 0.5;   // how wavy the leaf edges are
const RB_LEAF_HORIZ  = 0.5;   // how strongly leaves lean horizontal
const RB_LEAF_CLEAR  = 14;    // min gap between a leaf and the main wave
const RB_LEAF_SPREAD = 0.3;
const RB_LEAF_SHADE  = 1.0;
const RB_LEAF_DROP   = 1.0;
const RB_LEAF_ALPHA  = 1.0;
const RB_LEAF_FADE   = 0.2;
const RB_LEAF_MAXLUM = 208;   // leaves never get brighter than this
// lotus flowers resting on leaves
const RB_LEAF_LOTUS      = 0.55;  // chance a leaf carries a flower (at least 2 flowers always appear)
const RB_LEAF_LOTUS_MAX  = 5;
const RB_LEAF_LOTUS_SIZE = 0.3;
const RB_LEAF_LOTUS_SHADOW = 0.6;
const rbLum    = c => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
const rbCapLum = (c, m) => { const l = rbLum(c); return l > m ? c.map(v => v * m / l) : c; };

// ---- flow ----
function rbFlowDir(sys, x, y) {
  const j = rbCl(wvOwner(x, y), 1, sys.n - 2), a = sys.C[j - 1], b = sys.C[j + 1];
  let tx = b[0] - a[0], ty = b[1] - a[1];
  const m = Math.hypot(tx, ty) || 1;
  tx /= m; ty /= m;
  if (tx < 0) { tx = -tx; ty = -ty; }
  tx = tx * (1 - RB_LEAF_HORIZ) + RB_LEAF_HORIZ;
  ty *= 1 - RB_LEAF_HORIZ;
  const m2 = Math.hypot(tx, ty) || 1;
  return [tx / m2, ty / m2];
}
function rbFlowSpine(sys, x, y, L, M) {
  const ds = L / (M - 1), S = [[x, y]];
  let d = rbFlowDir(sys, x, y);
  for (let i = 1; i < M; i++) {
    const f = rbFlowDir(sys, x, y);
    d = [d[0] * 0.96 + f[0] * 0.04, d[1] * 0.96 + f[1] * 0.04];
    const m = Math.hypot(d[0], d[1]) || 1;
    d = [d[0] / m, d[1] / m];
    x += d[0] * ds; y += d[1] * ds;
    S.push([x, y]);
  }
  return rbSmoothPts(S, 4, 3);
}

// ---- leaf shape ----
function rbLeafBuild(S0, L) {
  const M = S0.length, sd = rbSeedInt(), hw = L * RB_LEAF_WIDTH * rbR(0.85, 1.1), sc = rbCl(hw / 40, 0.7, 2.2);
  const N0 = rbNorms(S0), bk = rbR(0.6, 1.2), bph = rbR(0, 6.28);
  const S = S0.map((p, i) => {
    const u = i / (M - 1), b = 0.03 * L * Math.sin(2 * Math.PI * bk * u + bph) * Math.sin(Math.PI * u);
    return [p[0] + N0[i][0] * b, p[1] + N0[i][1] * b];
  });
  const N = rbNorms(S);
  const prof = () => {
    const k1 = rbR(1.3, 2.6), k2 = Math.max(1.5, L / rbR(55, 80)), a1 = rbR(0, 6.28), a2 = rbR(0, 6.28), g = rbR(0.85, 1.1);
    return Array.from({ length: M }, (_, i) => {
      const u = i / (M - 1), env = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 0.6);
      const w = 1 + 0.3 * RB_LEAF_RUFFLE * Math.sin(2 * Math.PI * k1 * u + a1) + 0.07 * RB_LEAF_RUFFLE * Math.sin(2 * Math.PI * k2 * u + a2);
      return hw * g * env * Math.max(0.15, w);
    });
  };
  const hT = prof(), hB = prof();
  const P = (i, v) => { const h = v >= 0 ? hT[i] : hB[i]; return [S[i][0] + N[i][0] * v * h, S[i][1] + N[i][1] * v * h]; };
  const poly = rbSmoothPts(Array.from({ length: M }, (_, i) => P(i, 1)).concat(Array.from({ length: M }, (_, i) => P(M - 1 - i, -1))), 2, 3);
  return { M, L, S, N, hT, hB, P, poly, hw, sd, sc };
}
function rbLeafFolded(poly) {
  const n = poly.length, o = (a, b, c) => (c[1] - a[1]) * (b[0] - a[0]) - (b[1] - a[1]) * (c[0] - a[0]);
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const a = poly[i], b = poly[(i + 1) % n], c = poly[j], d = poly[(j + 1) % n];
      if (o(a, c, d) * o(b, c, d) < 0 && o(a, b, c) * o(a, b, d) < 0) return true;
    }
  }
  return false;
}
function rbInRibbon(sys, wd, x, y, pad) {
  const j = wvOwner(x, y);
  if (j < 0 || j >= sys.n) return false;
  const q = sys.C[j], dx = x - q[0], dy = y - q[1], w = dx * sys.N[j][0] + dy * sys.N[j][1] >= 0 ? wd.hp[j] : wd.hm[j];
  return Math.hypot(dx, dy) < w + pad;
}
// a leaf can be used if it is unfolded, clear of the main wave, and not far off the canvas.
// margin is how far past the canvas edge the leaf may reach
function rbLeafFits(sys, wd, G, margin) {
  if (rbLeafFolded(G.poly)) return false;
  for (let k = 0; k < G.poly.length; k += 4) {
    const q = G.poly[k];
    if (q[0] < -margin || q[0] > RB_W + margin || q[1] < -margin || q[1] > RB_H + margin) return false;
    if (rbInRibbon(sys, wd, q[0], q[1], RB_LEAF_CLEAR)) return false;
  }
  return true;
}
// leaf whose stem starts at (x, y)
function rbLeafMake(sys, x, y, L) {
  const S = rbFlowSpine(sys, x, y, L, 90);
  if (rbRnd() < 0.35) { S.reverse(); }
  return rbLeafBuild(S, L);
}
// leaf centred on (mx, my)
function rbLeafMakeMid(sys, mx, my, L) {
  const d = rbFlowDir(sys, mx, my);
  const S = rbFlowSpine(sys, mx - d[0] * L / 2, my - d[1] * L / 2, L, 90);
  if (rbRnd() < 0.35) { S.reverse(); }
  return rbLeafBuild(S, L);
}
const rbLeafMidPt = G => G.S[G.M >> 1];
const rbLeafRad   = L => L * 0.45;
const rbMidOk = (m, pad) => m[0] > -pad && m[0] < RB_W + pad && m[1] > -pad && m[1] < RB_H + pad;

// ---- painting a leaf ----
function rbLeafPaint(G) {
  const c = rbCtx, lm = Math.hypot(RB_LIGHT[0], RB_LIGHT[1]) || 1, lx = RB_LIGHT[0] / lm, ly = RB_LIGHT[1] / lm;
  const { M, L, N, P, poly, hw, sd, sc } = G, A = RB_LEAF_ALPHA, SH = RB_LEAF_SHADE;
  const leafLine = (i0, i1, v0, v1) => {
    i0 = Math.max(0, Math.round(i0)); i1 = Math.min(M - 1, Math.round(i1));
    const n = i1 - i0;
    return Array.from({ length: n + 1 }, (_, k) => {
      const i = i0 + k;
      return P(i, rbCl(v0 + (v1 - v0) * (n ? k / n : 0) + 0.1 * (rbN(i * 0.12, sd) - 0.5), -1.03, 1.03));
    });
  };
  const brush = (i0, i1, v0, v1, w, colr, a, o) => {
    if (Math.round(i1) - Math.round(i0) < 6) return;
    rbBrush(rbSmoothPts(leafLine(i0, i1, v0, v1), 2, 2), w, colr, a, Object.assign({ smooth: true }, o));
  };
  const fade = rbR(0, RB_LEAF_FADE), pi = Math.floor(rbR(0, RB_LEAF_PALS.length)), pj = (pi + 1 + Math.floor(rbR(0, RB_LEAF_PALS.length - 1))) % RB_LEAF_PALS.length;
  const prep = pl => pl.map(k => rbCapLum(rbMix(k, RB_PAPER, fade), RB_LEAF_MAXLUM));
  const pal = prep(RB_LEAF_PALS[pi]), acc = prep(RB_LEAF_IRIDS[pj % RB_LEAF_IRIDS.length]);
  const edgeCol = rbMix(rbGrad(pal, 0.2), TH.leafEdge, 0.2);
  const col = f => (rbRnd() < (0.05 + 0.4 * f * f) * (TH.leafAcc || 1) ? rbGrad(acc, rbR(0.2, 0.9)) : rbGrad(pal, rbCl(0.2 + 0.55 * f + rbR(-0.15, 0.15), 0, 1)));
  const area = L * hw * 1.1;
  const along = (v, w, style) => {
    c.beginPath();
    for (let i = 0; i < M; i++) { const p = P(i, v); if (i) { c.lineTo(p[0], p[1]); } else { c.moveTo(p[0], p[1]); } }
    c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = style; c.stroke();
  };

  // drop shadow
  if (RB_LEAF_DROP > 0) {
    [[11, 12, 0.13], [3.5, 4.5, 0.18]].forEach(s => {
      rbBlurred(s[0], () => {
        c.globalCompositeOperation = 'multiply';
        c.translate(-lx * s[1], -ly * s[1]);
        rbPath(poly);
        c.fillStyle = rbRgba(TH.leafDrop, rbCl(s[2] * RB_LEAF_DROP, 0, 0.9));
        c.fill();
      });
    });
  }
  c.save();
  rbPath(poly);
  c.clip();
  rbPath(poly);
  c.fillStyle = rbRgba(rbGrad(pal, 0.55), 0.95);
  c.fill();
  // wet washes fanning out from the stem
  rbBlurred(3, () => rbRepeat(area / 1300, () => {
    const i0 = rbR(0, M * 0.5), v0 = rbR(-0.9, 0.9);
    brush(i0, i0 + rbR(0.35, 0.8) * M, v0, v0 * rbR(0.6, 1.4), rbR(16, 32) * sc, col(Math.abs(v0)), rbR(0.25, 0.4) * A,
          { taper: 0.4, jit: 6, col2: col(Math.abs(v0) * 0.8) });
  }));
  // bristle strokes
  rbRepeat(area / 450, () => {
    const i0 = rbR(0, M - 20), v0 = rbR(-0.95, 0.95);
    brush(i0, i0 + rbR(18, 50), v0, v0 * rbR(0.9, 1.5), rbR(6, 14) * sc, col(Math.abs(v0)), rbR(0.4, 0.65) * A,
          { taper: 0.45, jit: 6, col2: col(Math.abs(v0) * 0.8) });
  });
  // strokes that follow the wavy edges
  [0.9, 0.74, 0.56, 0.36].forEach((f, k) => {
    [1, -1].forEach(sg => {
      rbRepeat(3, () => {
        const i0 = rbR(0, M - 30), c0 = col(f), c1 = k % 2 ? rbCapLum(rbMix(c0, TH.vein, 0.2), RB_LEAF_MAXLUM) : c0;
        brush(i0, i0 + rbR(25, 60), sg * f, sg * f * rbR(0.9, 1.05), rbR(3.5, 8) * sc, c1, rbR(0.35, 0.55) * A, { taper: 0.5, jit: 6 });
      });
    });
  });
  // veins fanning from the stem
  const veinLit = rbCapLum(rbMix(pal[2], TH.vein, 0.5), 235);
  const nV = 5 + Math.floor(rbR(0, 4));
  Array.from({ length: nV }, (_, q) => -0.85 + (1.7 * q) / (nV - 1)).forEach(vt => {
    const i1 = M * rbR(0.55, 0.92);
    brush(2, i1, 0, vt, 3 * sc, edgeCol, 0.12 * A, { taper: 0.5, jit: 4 });
    brush(2, i1, 0.03, vt * 0.97 + 0.03, 2.2 * sc, veinLit, 0.55 * A, { taper: 0.5, jit: 4 });
  });
  // rim in broken dashes
  [1, -1].forEach(sg => {
    let i = rbR(0, 10);
    rbRepeat(12, () => {
      const len = rbR(14, 30);
      if (i < M - 8 && rbRnd() < 0.62) { brush(i, i + len, sg * 0.985, sg * 0.985, rbR(2, 3.5) * sc, rbRnd() < 0.5 ? TH.vein : edgeCol, 0.45 * A, { taper: 0.6, jit: 6 }); }
      i += len + rbR(-2, 8);
    });
  });
  // form shading
  if (SH > 0) {
    const mid = M >> 1, ss = (N[mid][0] * lx + N[mid][1] * ly) > 0 ? -1 : 1;
    rbBlurred(7, () => { c.globalCompositeOperation = 'multiply'; along(ss * 0.8, hw * 0.9, rbRgba(TH.leafShade, 0.12 * SH)); });
    rbBlurred(7, () => { c.globalCompositeOperation = 'screen'; along(-ss * 0.55, hw * 0.6, rbRgba(rbLight(pal[2], 0.2), 0.12 * SH)); });
  }
  // thin glints
  rbBlurred(0.5, () => rbRepeat(6, () => {
    const u = rbR(0.2, 0.8), i0 = rbR(2, M * 0.5), v0 = rbR(-0.5, 0.5);
    brush(i0, i0 + rbR(20, 45), v0, v0 * rbR(1, 1.6), rbR(1.5, 3.5) * sc, rbLight(rbIrid(u), 0.3), rbR(0.2, 0.32),
          { mode: 'screen', col2: rbLight(rbIrid(rbCl(u + 0.2, 0, 1)), 0.3), taper: 0.6, jit: 4 });
  }));
  c.restore();
}

// ---- flowers on the leaves ----
// Chosen per leaf from a hash of the seed and drawn after all leaves, so no leaf covers one.
// Only spots fully on the canvas can carry a flower.
function rbLeafLotuses(all) {
  if (RB_LEAF_LOTUS <= 0 || !all.length) return;
  const cand = [];
  all.forEach((G, k) => {
    const i = Math.floor(G.M * rbR(0.35, 0.65)), v = rbR(-0.25, 0.25), p = G.P(i, v);
    if (p[0] < 30 || p[0] > RB_W - 30 || p[1] < 30 || p[1] > RB_H - 30) return;
    cand.push({ G, k, p });
  });
  const chosen = cand.filter(o => rbHash(o.k + 71, rbSeed) < RB_LEAF_LOTUS);
  cand.forEach(o => { if (chosen.length < Math.min(2, cand.length) && chosen.indexOf(o) < 0) chosen.push(o); });
  chosen.slice(0, RB_LEAF_LOTUS_MAX).forEach(o => {
    const r = rbCl(o.G.hw * RB_LEAF_LOTUS_SIZE, 16, 34), shadow = rbHash(o.k + 91, rbSeed) < RB_LEAF_LOTUS_SHADOW;
    rbTry('leaf lotus', () => rbLotus(o.p[0], o.p[1], r, rbR(0, 6.28), shadow));
  });
}

// ---- leaf placement ----
// Edge clusters first, then normal clusters. Group leaves sit next to the main leaf
// (about the sum of their radii apart) and never closer than that to any other leaf.
function rbLeaves(sys, wd) {
  if (RB_LEAF <= 0) return;
  if (!WV_ON || !wvGrid) { wvBuildGrid(sys, wd); }
  const clusters = [], all = [];
  rbRepeat(RB_LEAF_EDGE + RB_LEAF_COUNT, kc => {
    const edge = kc < RB_LEAF_EDGE, tries = edge ? 240 : 160;
    let best = null, bestScore = -1e9;
    rbRepeat(tries, q => {
      const shrink = 1 - (edge ? 0.45 : 0.3) * q / tries;   // later tries get smaller so big leaves still find a spot
      const L = (edge ? rbR(RB_LEAF_BIG_MIN, RB_LEAF_BIG_MAX) : rbR(RB_LEAF_MIN, RB_LEAF_MAX)) * shrink;
      let G, mid;
      if (edge) {
        // the centre sits on one of the four borders, so the part past it is cut off
        const side = Math.floor(rbR(0, 4)), t = rbR(0.08, 0.92), k = rbR(-0.04, 0.2) * L;
        const mx = side === 0 ? k : side === 1 ? RB_W - k : t * RB_W, my = side === 2 ? k : side === 3 ? RB_H - k : t * RB_H;
        G = rbLeafMakeMid(sys, mx, my, L);
        mid = rbLeafMidPt(G);
        if (!rbMidOk(mid, 0.3 * L)) return;
        if (!rbLeafFits(sys, wd, G, L * 0.8)) return;
      } else {
        G = rbLeafMake(sys, rbR(0, RB_W), rbR(30, RB_H - 30), L);
        mid = rbLeafMidPt(G);
        if (mid[0] < 10 || mid[0] > RB_W - 10 || mid[1] < 10 || mid[1] > RB_H - 10) return;
        if (!rbLeafFits(sys, wd, G, 140)) return;
      }
      const room = clusters.reduce((m, p) => Math.min(m, Math.hypot(p.mid[0] - mid[0], p.mid[1] - mid[1]) - (p.R + L * 1.1) * RB_LEAF_SPREAD), 1e9);
      if (room >= 0 && room > bestScore) { bestScore = room; best = { G, L, mid }; }
    });
    if (!best) return;
    const group = [best.G], extra = Math.floor(rbR(1, RB_LEAF_GROUP + 1));
    rbRepeat(extra, () => {
      let got = false;
      rbRepeat(30, () => {
        if (got) return;
        const a = rbR(0, 6.28), L2 = best.L * rbR(0.45, 0.8);
        const d = (rbLeafRad(best.L) + rbLeafRad(L2)) * rbR(RB_LEAF_TOUCH, RB_LEAF_TOUCH + 0.22);
        const G2 = rbLeafMakeMid(sys, best.mid[0] + Math.cos(a) * d, best.mid[1] + Math.sin(a) * d, L2), m2 = rbLeafMidPt(G2);
        if (!rbMidOk(m2, 0.25 * L2) || !rbLeafFits(sys, wd, G2, L2 * 0.7)) return;
        const others = all.concat(group);
        if (others.some(o => Math.hypot(rbLeafMidPt(o)[0] - m2[0], rbLeafMidPt(o)[1] - m2[1]) < (rbLeafRad(o.L) + rbLeafRad(L2)) * RB_LEAF_TOUCH)) return;
        group.push(G2);
        got = true;
      });
    });
    clusters.push({ mid: best.mid, R: best.L * 1.1 });
    group.forEach(G => all.push(G));
  });
  all.forEach(G => rbTry('leaf', () => rbLeafPaint(G)));
  rbTry('leaf lotuses', () => rbLeafLotuses(all));
}

function rbGlaze() {
  const c = rbCtx;
  const pos = [[RB_W * 0.45, RB_H * 0.55, 340, 0.22], [RB_W * 0.85, RB_H * 0.4, 280, 0.16], [RB_W * 0.15, RB_H * 0.25, 260, 0.14]];
  const blooms = pos.map((p, k) => [p[0], p[1], p[2], TH.glaze[k], p[3]]);
  c.save();
  c.globalCompositeOperation = 'screen';
  for (const [x, y, r, col, a] of blooms) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rbRgba(col, a));
    g.addColorStop(1, rbRgba(col, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - r, 2 * r, 2 * r);
  }
  c.restore();
}
// soft shadow under a flower (uses no random numbers)
function rbLotusShadow(x, y, r) {
  const c = rbCtx, lm = Math.hypot(RB_LIGHT[0], RB_LIGHT[1]) || 1, lx = RB_LIGHT[0] / lm, ly = RB_LIGHT[1] / lm;
  [[r * 0.45, r * 0.55, 1.0, 0.7], [r * 0.14, r * 0.2, 0.9, 0.5]].forEach(s => {
    rbBlurred(s[0], () => {
      c.globalCompositeOperation = 'multiply';
      c.translate(-lx * s[1], -ly * s[1]);
      c.beginPath();
      c.ellipse(x, y, r * s[2] * 1.05, r * s[2] * 0.95, 0, 0, Math.PI * 2);
      c.fillStyle = rbRgba(TH.lotus.shadow, RB_LOTUS_SHADOW_A * s[3]);
      c.fill();
    });
  });
}
function rbLotus(x, y, r, rot, shadow) {
  const c = rbCtx, LP = TH.lotus.petals;
  if (shadow) { rbLotusShadow(x, y, r); }
  const layers = [
    { n: 8, L: 1.15, w: 0.5,  col: LP[0], a: 0.8,  off: 0 },
    { n: 7, L: 0.98, w: 0.52, col: LP[1], a: 0.92, off: 0.35 },
    { n: 6, L: 0.72, w: 0.46, col: LP[2], a: 0.95, off: 0.7 },
  ];
  layers.forEach(ly => {
    rbRepeat(ly.n, i => {
      const a = rot + ly.off + (i * 2 * Math.PI) / ly.n + rbR(-0.12, 0.12), Ln = r * ly.L * rbR(0.9, 1.1);
      const pts = Array.from({ length: 7 }, (_, s) => {
        const t = s / 6, bend = 0.15 * Math.sin(t * Math.PI) * (i % 2 ? 1 : -1);
        return [x + Math.cos(a + bend) * Ln * (0.12 + 0.88 * t), y + Math.sin(a + bend) * Ln * (0.12 + 0.88 * t)];
      });
      rbBrush(pts, r * ly.w, ly.col, ly.a, { dry: 0.03, taper: 0.5, jit: 5 });
      rbBrush(pts.slice(0, 3), r * ly.w * 0.5, TH.lotus.inner, 0.35, { dry: 0, jit: 4 });
    });
  });
  rbRepeat(14, () => {
    const a = rbR(0, 6.28), d = rbR(0, r * 0.28);
    c.beginPath();
    c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rbR(1.2, 2.6), 0, Math.PI * 2);
    c.fillStyle = rbRgba(rbPick(TH.lotus.stamen), 0.9);
    c.fill();
  });
}
function rbPaintRibbon(sys, wd) {
  const c = rbCtx, n = sys.n, poly = rbOutline(sys, wd, 0, 12, 0);
  rbIsolated('drop shadow', 4, () => rbDropShadow(sys, wd));
  c.save();   // everything below is painted inside the ribbon outline
  rbPath(poly);
  c.clip();
  rbPath(poly);
  c.fillStyle = rbRgba(TH.base, 0.9);
  c.fill();
  rbTry('base',       () => rbStrokes(sys, wd));
  rbTry('patches',    () => rbPatches(sys, wd));
  rbTry('flows',      () => rbFlows(sys, wd));
  rbTry('accents',    () => rbAccents(sys, wd));
  rbTry('dry',        () => rbDryStreaks(sys, wd));
  rbTry('shadows',    () => rbShadows(sys, wd));
  rbTry('highlights', () => rbHighlights(sys, wd));
  rbTry('edges',      () => rbEdges(sys, wd));
  rbIsolated('wave shading', 5, () => rbShade(sys, wd));
  c.restore();
  rbGlaze();
  if (RB_LOTUS > 0) {
    const span = sys.u1 - sys.u0;
    [0.14, 0.34, 0.58, 0.84].forEach((u, fi) => {
      const f = rbR(0.3, 0.7), r = rbR(18, 28), rot = rbR(0, 6.28);
      const shadow = rbHash(fi + 11, rbSeed) < RB_LOTUS_SHADOW;
      [0, 0.02, -0.02, 0.04, -0.04, 0.06, -0.06, 0.09, -0.09].some(d => {
        const i = rbCl(Math.floor((sys.u0 + (u + d) * span) * (n - 1)), 0, n - 1);
        const p = rbPos(sys, i, -wd.hm[i] + f * (wd.hm[i] + wd.hp[i]));
        if (p[0] > 40 && p[0] < RB_W - 40 && p[1] > 40 && p[1] < RB_H - 40) { rbLotus(p[0], p[1], r, rot, shadow); return true; }
        return false;
      });
    });
  }
}
function rbTry(name, fn) {
  try { return fn(); } catch (e) { console.error('ribbon step "' + name + '" failed:', e); }
}

// ---- p5 entry points ----
// WEBPAGE: fixed 1920 px render; CSS scales the canvas to the window, so no repaint on resize.
function rbLayout() {
  rbCw = RB_RENDER_W;
  rbCh = Math.round(rbCw / RB_ASPECT);
}
// WEBPAGE
function rbMountCanvas() {
  const mount = document.getElementById('art-mount');
  if (mount) { mount.appendChild(rbCtx.canvas); }
  document.documentElement.setAttribute('data-theme', String(rbThemeIdx));
}
let rbGo = false;
function setup() {
  rbLayout();
  createCanvas(rbCw, rbCh);
  pixelDensity(1);
  rbCtx = drawingContext;
  rbApplyTheme(rbThemeIdx);
  rbMountCanvas();
  console.log('palette: ' + TH.name + '   seed: ' + rbSeed);
  noLoop();
  setTimeout(() => { rbGo = true; redraw(); }, 120);
}
function draw() {
  if (!rbGo) return;
  rbRS = rbSeed * 7919 + 13;
  rbFluid = null;
  rbSC = rbCw / RB_W;
  rbBL = rbSC * pixelDensity();
  const c = rbCtx;
  c.fillStyle = rbRgba(RB_PAPER, 1);
  c.fillRect(0, 0, rbCw, rbCh);
  c.save();
  c.scale(rbSC, rbSC);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  rbTry('streaks', rbStreaks);
  const built = rbBuild(), sys = built.sys, wd = built.wd;
  rbTry('background', () => rbBackground(sys, wd));
  rbIsolated('bg waves', 6, () => rbBgWaves(sys, wd));
  rbTry('ribbon', () => rbPaintRibbon(sys, wd));
  rbIsolated('leaves', 7, () => rbLeaves(sys, wd));
  c.restore();
  document.body.classList.add('art-ready');
}
// WEBPAGE: no windowResized()