/* ============================================================
   character.js — the 2D Kritesh rig.

   One drawing, many angles. The head is built from a "turn"
   value (-1 … 1) instead of separate drawings, so front, 3/4 and
   near-profile views share the same face proportions and can
   never drift apart. The body is a small joint rig (shoulders,
   elbows, hips, knees) posed by angle presets.

   Identity notes, measured from the reference photos:
   - slim oval face, soft narrow chin, face width ≈ 0.65 × height
   - thick, dark, messy hair with volume on top; uneven fringe
     falling to just above the brows; short sides, ears showing
   - straight dark brows with a small lift at the outer third
   - dark-brown almond eyes, slightly hooded
   - medium nose with a rounded tip; full lips, fuller lower lip
   - thin sparse moustache and chin hair; small stud earring;
     small mole beside the nose on the image-left cheek
   - light-medium warm complexion (sampled across three photos,
     not taken from the brightest or darkest one)
   - slim build, shoulders ≈ 2.2 head widths
   ============================================================ */

export const PALETTE = {
  skin: '#DFAD91',
  skinShade: '#C38D72',
  skinDeep: '#A36F58',
  skinLight: '#F0CAB0',
  line: '#4A2F26',
  hair: '#221B19',
  hairMid: '#3A2E2A',
  hairHi: '#5C4A41',
  iris: '#3B2A22',
  brow: '#231917',
  lipTop: '#B57470',
  lipBot: '#CB8C87',
  lipLine: '#7A3E3C',
  white: '#F4EEE7',
};

export const OUTFITS = {
  // Nepal: the green tee from the selfie
  tee: { top: '#9BAA45', topShade: '#7C8A34', print: '#5B3A2A', print2: '#A7553B', pants: '#2B2E36', pantsShade: '#1F2128', shoe: '#ECE9E2', sleeve: 'short' },
  // US: black hoodie under a taupe overshirt, from the video
  layers: { top: '#1C1C1F', topShade: '#111113', jacket: '#8A7D74', jacketShade: '#6E625A', pants: '#25272D', pantsShade: '#18191D', shoe: '#ECE9E2', sleeve: 'long' },
  // Now: black tee, the shop / desk outfit
  black: { top: '#1E1E21', topShade: '#141416', pants: '#C9C2B4', pantsShade: '#A8A092', shoe: '#ECE9E2', sleeve: 'short' },
  // LOCKED DESIGN (character master sheet): open black zip hoodie, plain white
  // tee, loose grey camo cargo joggers, black sneakers with white soles
  hoodie: { top: '#EEEAE2', topShade: '#CFC8BC', jacket: '#1B1B1D', jacketShade: '#0F0F10', pants: '#A5A39E', pantsShade: '#87857F', camo: true, shoe: '#17171A', sole: '#F2EFE8', sleeve: 'long', hood: true },
  // same look with the hoodie off (the street walk)
  whitetee: { top: '#EEEAE2', topShade: '#CFC8BC', pants: '#A5A39E', pantsShade: '#87857F', camo: true, shoe: '#17171A', sole: '#F2EFE8', sleeve: 'short', baggy: true },
};

const NS = 'http://www.w3.org/2000/svg';
const f = (n) => Math.round(n * 10) / 10;

/* Catmull-Rom → cubic Bézier through points. */
export function smooth(pts, closed = true, tension = 1) {
  const n = pts.length;
  if (n < 2) return '';
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  const get = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const t = tension / 6;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}

/* Round scalloped arc: a run of little bumps along an ellipse — reads as curls. */
function scallop(cx, cy, rx, ry, th0, th1, n, amp, sx = (x) => x, seed = 3) {
  const r = rng(seed);
  const P = [];
  for (let i = 0; i <= n; i++) { const th = th0 + (th1 - th0) * (i / n); P.push([cx + Math.cos(th) * rx, cy + Math.sin(th) * ry, th]); }
  let d = `M${f(sx(P[0][0]))},${f(P[0][1])}`;
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], b = P[i];
    const tm = (a[2] + b[2]) / 2, k = amp * (0.8 + r() * 0.5);
    const mx = cx + Math.cos(tm) * (rx + k * 2.2), my = cy + Math.sin(tm) * (ry + k * 2.2);
    d += ` Q${f(sx(mx))},${f(my)} ${f(sx(b[0]))},${f(b[1])}`;
  }
  return d;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* ---------------- HEAD ---------------- */
/* Local space: eye line y=0, skull top ≈ -60, chin ≈ 63. */

function faceOutline(t) {
  const a = Math.abs(t), s = Math.sign(t) || 1;
  const base = [
    [0, -60], [31, -54], [40, -32], [41, -8], [39.5, 13], [35, 33], [26, 49], [12, 59], [0, 61.5],
    [-12, 59], [-26, 49], [-35, 33], [-39.5, 13], [-41, -8], [-40, -32], [-31, -54],
  ];
  return base.map(([x, y]) => {
    const far = Math.sign(x) === s;
    let nx = x;
    if (x !== 0) nx = far ? x * (1 - 0.14 * a) : x * (1 + (y < 18 ? 0.12 : 0.02) * a);
    if (y > 18) nx += t * 11 * ((y - 18) / 45);
    else nx += t * 3;
    return [nx, y];
  });
}

function eyePaths() {
  const sclera = 'M-8.8,0.5 Q-3.8,-4.4 2.8,-4.3 Q7.4,-3.5 9.2,-0.2 Q4.6,3.1 -0.8,3.2 Q-6,2.9 -8.8,0.5Z';
  const lid = 'M-9.4,0.8 Q-3.8,-5.3 2.9,-5 Q7.8,-4.2 10,-0.5';
  const lash = 'M9,-1.2 L11.2,-2';
  const crease = 'M-6.8,-6.3 Q0.6,-8.6 7.8,-5.6';
  const lower = 'M-7.2,1.8 Q-1,4.2 6.8,1.6';
  return { sclera, lid, lash, crease, lower };
}

function mouthPaths(curve, open, w) {
  const hw = 13 * w;
  const c = curve; // + = smile, - = down
  const up = `M${-hw},${-c} Q${-hw * 0.55},${-3.4 - c * 0.3} ${-hw * 0.22},${-3.2} Q0,${-1.6} ${hw * 0.22},${-3.2} Q${hw * 0.55},${-3.4 - c * 0.3} ${hw},${-c} Q0,${1.4 + c * 0.7} ${-hw},${-c}Z`;
  const lo = `M${-hw * 0.92},${-c + 0.3} Q0,${1.6 + c * 0.7 + open} ${hw * 0.92},${-c + 0.3} Q${hw * 0.62},${6.8 + open} 0,${7.2 + open} Q${-hw * 0.62},${6.8 + open} ${-hw * 0.92},${-c + 0.3}Z`;
  const line = `M${-hw},${-c} Q0,${1.6 + c * 0.9} ${hw},${-c}`;
  const gap = open > 0.6 ? `M${-hw * 0.7},${-c * 0.6 + 0.6} Q0,${2 + open + c * 0.6} ${hw * 0.7},${-c * 0.6 + 0.6} Q0,${1.2 + c * 0.7} ${-hw * 0.7},${-c * 0.6 + 0.6}Z` : '';
  return { up, lo, line, gap };
}

const EXPRESSIONS = {
  neutral:    { curve: 0.2, open: 0, browY: 0, browIn: 0, lid: 1, lookY: 0 },
  focused:    { curve: -0.2, open: 0, browY: 1.4, browIn: 1.6, lid: 0.86, lookY: 0.3 },
  smile:      { curve: 2.6, open: 0, browY: -0.8, browIn: -0.4, lid: 0.9, lookY: 0 },
  tired:      { curve: -1, open: 0, browY: -1, browIn: -1.6, lid: 0.62, lookY: 0.6 },
  determined: { curve: -0.4, open: 0, browY: 1.8, browIn: 2.2, lid: 0.9, lookY: 0 },
  thinking:   { curve: -0.6, open: 0, browY: -1.4, browIn: 0.8, lid: 0.94, lookY: -0.7 },
  talk:       { curve: 0.6, open: 2.6, browY: -0.4, browIn: 0, lid: 1, lookY: 0 },
  wonder:     { curve: 0.4, open: 1.4, browY: -2.4, browIn: -0.6, lid: 1.06, lookY: -0.4 },
};

function hairBack(t) {
  const cx = t * 6, cy = -36, rx = 54 - Math.abs(t) * 3, ry = 58;
  let d = scallop(cx, cy, rx, ry, Math.PI * 0.98, Math.PI * 2.02, 16, 4.2, (x) => x, 11);
  const pts = [[cx + 47 - t * 4, -8], [cx + 43 - t * 4, 6], [0, 14], [cx - 43 - t * 2 + Math.max(0, t) * 12, 6], [cx - 48 + Math.max(0, t) * 10, -8]];
  pts.forEach(([x, y]) => (d += ` L${f(x)},${f(y)}`));
  return d + 'Z';
}

function hairSX(t) {
  const a = Math.abs(t), s = Math.sign(t) || 1;
  return (x) => (Math.sign(x) === s ? x * (1 - 0.18 * a) : x * (1 + 0.06 * a)) + t * 9;
}

/* Fringe: chunky, wavy clumps falling to the brow line. Tips hook in
   alternating directions so it reads messy rather than combed. */
const FRINGE = [
  [-47, -32, 'v'], [-48, -10, 't', -2], [-34, -27, 'v'], [-28, -14, 't', -4], [-20, -26, 'v'], [-13, -17, 't', 5],
  [-5, -28, 'v'], [3, -16, 't', -5], [11, -27, 'v'], [18, -15, 't', 4], [26, -27, 'v'], [33, -16, 't', -4], [41, -27, 'v'], [51, -11, 't', 4],
];
function fringe(t) {
  const sx = hairSX(t);
  let d = `M${f(sx(-52))},-44 L${f(sx(FRINGE[0][0]))},${FRINGE[0][1]}`;
  for (let i = 1; i < FRINGE.length; i++) {
    const [x, y, k, hook] = FRINGE[i];
    const [px, py] = FRINGE[i - 1];
    if (k === 't') {
      d += ` C${f(sx(px + 1))},${f(py + 6)} ${f(sx(x + hook))},${f(y - 6)} ${f(sx(x))},${y}`;
    } else {
      d += ` Q${f(sx(px + (x - px) * 0.3))},${f(py - 3)} ${f(sx(x))},${y}`;
    }
  }
  d += ` L${f(sx(54))},-44 L${f(sx(30))},-70 L${f(sx(-30))},-70Z`;
  return d;
}

function fringeTop(t) {
  const sx = hairSX(t);
  let d = scallop(0, -40, 51, 57, Math.PI * 1.02, Math.PI * 1.98, 14, 4, sx, 5);
  d += ` L${f(sx(44))},-34 L${f(sx(0))},-36 L${f(sx(-44))},-34Z`;
  return d;
}

function hairStrands(t) {
  const sx = hairSX(t);
  const q = (arr) => arr.map((p) => `M${f(sx(p[0]))},${p[1]} Q${f(sx(p[2]))},${p[3]} ${f(sx(p[4]))},${p[5]}`).join(' ');
  // clump separations: short S-ish curves from the crown into the fringe
  const parts = q([
    [-30, -62, -36, -44, -33, -27], [-14, -70, -12, -46, -20, -26], [2, -74, 6, -50, -5, -28],
    [16, -70, 20, -46, 11, -27], [32, -62, 36, -44, 26, -27], [-40, -54, -46, -40, -45, -32],
  ]);
  // wavy texture arcs across the crown
  // tight curl marks spread over the crown and along the fringe
  const CURLS = [[-34, -82], [-18, -92], [0, -96], [18, -92], [34, -82], [-44, -62], [-26, -70], [-8, -78], [10, -78], [28, -70], [44, -60],
    [-36, -46], [-18, -54], [2, -58], [20, -54], [38, -46], [-26, -34], [-6, -40], [14, -38], [32, -32]];
  const arcs = CURLS.map(([x, y], i) => { const r = 5 + (i % 3); const d = i % 2 ? 1 : -1; return [x - r, y, x, y - r * 1.4 * d, x + r, y + 1]; });
  const hi = q([
    [-26, -84, -20, -90, -10, -86], [6, -92, 14, -96, 24, -88], [-36, -66, -30, -74, -20, -72],
    [12, -76, 20, -80, 30, -72], [-8, -60, -2, -66, 6, -62],
  ]);
  return { parts, hiD: hi, curlD: q(arcs) };
}

function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

/* ---------------- BODY GEOMETRY ---------------- */
/* Global: feet at y=0. Head eye-line at y=-753 (scale 1). */
const HEAD_SCALE = 1.14;
const G = {
  headY: -762,
  neckTop: -700, neckBot: -648,
  shoulderY: -640, shoulderX: 84,
  hipY: -400, hipX: 30,
  upper: 150, fore: 132, hand: 40,
  thigh: 200, shin: 186,
};

function limb(len, w1, w2) {
  const a = w1 / 2, b = w2 / 2;
  return `M${-a},0 Q${-a - 1},${len * 0.5} ${-b},${len} Q0,${len + b * 0.9} ${b},${len} Q${a + 1},${len * 0.5} ${a},0 Q0,${-a * 0.9} ${-a},0Z`;
}

function handPath(open) {
  // simple four-finger mitten with thumb; pointing down from the wrist
  return open
    ? 'M-11,0 Q-14,14 -12,26 Q-10,36 -2,38 Q8,38 11,28 Q13,16 10,0 Z M9,8 Q18,12 17,22 Q14,24 10,18Z'
    : 'M-11,0 Q-14,12 -11,24 Q-7,32 1,32 Q9,31 11,22 Q13,12 10,0 Z M9,6 Q17,10 15,19 Q12,21 9,15Z';
}

/* ---------------- POSES ---------------- */
/* Angles in degrees. 0 = limb straight down. Negative swings toward +x
   (the direction the character faces). Elbow/knee are relative. */
export const POSES = {
  stand:      { aB: 6, eB: -6, aF: -4, eF: -8, hB: 2, kB: 0, hF: -3, kF: 0, lean: 0, tilt: 0, y: 0 },
  relaxed:    { aB: 10, eB: -10, aF: -8, eF: -16, hB: 4, kB: 2, hF: -6, kF: 4, lean: -1, tilt: -2, y: 0 },
  think:      { aB: 8, eB: -8, aF: -28, eF: -132, hB: 2, kB: 0, hF: -3, kF: 0, lean: 0, tilt: 5, y: 0, handF: 'open' },
  phone:      { aB: 8, eB: -6, aF: -18, eF: -112, hB: 2, kB: 0, hF: -3, kF: 0, lean: 2, tilt: 10, y: 0 },
  carry:      { aB: 4, eB: -4, aF: 4, eF: 0, hB: 2, kB: 0, hF: -3, kF: 0, lean: 0, tilt: 0, y: 0 },
  tired:      { aB: 14, eB: -4, aF: 10, eF: -6, hB: 3, kB: 4, hF: -4, kF: 6, lean: 6, tilt: 9, y: 6 },
  determined: { aB: 4, eB: -18, aF: -6, eF: -22, hB: 7, kB: 0, hF: -7, kF: 0, lean: -2, tilt: -3, y: -2 },
  sit:        { aB: -20, eB: -60, aF: -26, eF: -58, hB: -86, kB: 88, hF: -84, kF: 86, lean: -2, tilt: 0, y: 200 },
  type:       { aB: -30, eB: -64, aF: -38, eF: -58, hB: -86, kB: 88, hF: -84, kF: 86, lean: 6, tilt: 6, y: 200 },
  drive:      { aB: -50, eB: -42, aF: -58, eF: -36, hB: -82, kB: 64, hF: -78, kF: 60, lean: -6, tilt: 0, y: 200 },
  repair:     { aB: -24, eB: -78, aF: -34, eF: -70, hB: -86, kB: 88, hF: -84, kF: 86, lean: 12, tilt: 14, y: 200 },
  window:     { aB: -6, eB: -40, aF: -16, eF: -60, hB: -86, kB: 88, hF: -84, kF: 86, lean: -4, tilt: -4, y: 200 },
  reach:      { aB: 6, eB: -6, aF: -78, eF: -14, hB: 2, kB: 0, hF: -3, kF: 0, lean: 3, tilt: 0, y: 0, handF: 'open' },
  pack:       { aB: -40, eB: -30, aF: -50, eF: -26, hB: -12, kB: 26, hF: -30, kF: 40, lean: 26, tilt: 12, y: 22 },
  wave:       { aB: 6, eB: -6, aF: -150, eF: -30, hB: 2, kB: 0, hF: -3, kF: 0, lean: 0, tilt: -3, y: 0, handF: 'open' },
};

/* ---------------- CHARACTER ---------------- */

export function createCharacter(opts = {}) {
  const P = PALETTE;
  const state = {
    outfit: opts.outfit || 'tee',
    turn: opts.turn ?? 0.45,
    turnTarget: opts.turn ?? 0.45,
    dir: opts.dir || 1,
    view: opts.view || 'front',
    expr: { ...EXPRESSIONS[opts.expr || 'neutral'] },
    exprTarget: { ...EXPRESSIONS[opts.expr || 'neutral'] },
    pose: { ...POSES[opts.pose || 'stand'] },
    poseTarget: { ...POSES[opts.pose || 'stand'] },
    poseRate: 6,
    look: [0, 0], lookTarget: [0, 0],
    blink: 0, nextBlink: 1.5 + Math.random() * 2,
    t: Math.random() * 10,
    walk: 0, walking: false, walkSpeed: 1,
    typing: false, talking: false,
    breathe: opts.breathe !== false,
    lastTurnDrawn: null,
  };

  const root = el('g', { class: 'kd' });
  const flip = el('g', {}, root);
  const body = el('g', {}, flip);

  // groups in draw order (back → front)
  const legB = el('g', {}, body), armB = el('g', {}, body);
  const torsoG = el('g', {}, body);
  const legF = el('g', {}, body);
  const neckG = el('g', {}, body);
  const headWrap = el('g', {}, root); // outside the flip so the face never mirrors
  const armF = el('g', {}, body);
  // the front arm has to be drawn over the head-wrap when hands go to the face;
  // simplest: render a second front-arm container after the head.
  const armFTop = el('g', {}, root);

  const outfit = () => OUTFITS[state.outfit];

  /* ---- limbs ---- */
  function buildArm(g, back) {
    g.innerHTML = '';
    const o = outfit();
    const skin = back ? P.skinShade : P.skin;
    const upper = el('g', {}, g);
    el('path', { d: limb(G.upper, 38, 30), fill: skin, stroke: P.line, 'stroke-width': 1.4 }, upper);
    if (o.sleeve === 'short') {
      el('path', { d: o.baggy ? `M-24,-8 Q-27,44 -24,88 Q0,96 24,88 Q27,44 24,-8 Q0,-18 -24,-8Z` : `M-20,-6 Q-22,40 -19,74 Q0,82 19,74 Q22,40 20,-6 Q0,-16 -20,-6Z`, fill: back ? o.topShade : o.top, stroke: P.line, 'stroke-width': 1.4 }, upper);
    } else {
      el('path', { d: limb(G.upper + 6, o.hood ? 46 : 40, o.hood ? 38 : 32), fill: back ? (o.jacketShade || o.topShade) : (o.jacket || o.top), stroke: P.line, 'stroke-width': 1.4 }, upper);
    }
    const fore = el('g', {}, upper);
    el('path', { d: limb(G.fore, 30, 23), fill: skin, stroke: P.line, 'stroke-width': 1.4 }, fore);
    if (o.sleeve === 'long') {
      el('path', { d: limb(G.fore - 6, o.hood ? 38 : 33, o.hood ? 31 : 27), fill: back ? (o.jacketShade || o.topShade) : (o.jacket || o.top), stroke: P.line, 'stroke-width': 1.4 }, fore);
      el('path', { d: `M-14,${G.fore - 14} L14,${G.fore - 14}`, stroke: o.hood ? '#2A2A2D' : o.top, 'stroke-width': 6 }, fore);
    }
    const hand = el('g', {}, fore);
    const hp = el('path', { d: handPath(false), fill: skin, stroke: P.line, 'stroke-width': 1.4 }, hand);
    const prop = el('g', {}, hand);
    return { upper, fore, hand, hp, prop };
  }

  function buildLeg(g, back) {
    g.innerHTML = '';
    const o = outfit();
    const thigh = el('g', {}, g);
    const pc = back ? o.pantsShade : o.pants;
    const wide = o.camo ? 1.2 : 1;
    el('path', { d: limb(G.thigh + 8, 56 * wide, 46 * wide), fill: pc, stroke: P.line, 'stroke-width': 1.4 }, thigh);
    if (o.camo) {
      const cam = (dark) => (dark ? '#6F6D68' : '#C8C6C0');
      [[-12, 40, 14, 9, 1], [10, 90, 12, 16, 0], [-8, 150, 16, 10, 1], [14, 190, 9, 12, 0], [-14, 110, 8, 12, 0]].forEach(([x, y, rx, ry, dk]) => el('ellipse', { cx: x, cy: y, rx, ry, fill: cam(dk), opacity: back ? 0.4 : 0.55 }, thigh));
      el('rect', { x: 18, y: 96, width: 20, height: 34, rx: 3, fill: 'none', stroke: o.pantsShade, 'stroke-width': 2 }, thigh); // cargo pocket
    }
    const shin = el('g', {}, thigh);
    el('path', { d: limb(G.shin, 46 * wide, (o.camo ? 30 : 34)), fill: pc, stroke: P.line, 'stroke-width': 1.4 }, shin);
    if (o.camo) {
      [[8, 40, 12, 9, 1], [-10, 90, 10, 14, 0], [6, 140, 9, 8, 1]].forEach(([x, y, rx, ry, dk]) => el('ellipse', { cx: x, cy: y, rx, ry, fill: dk ? '#6F6D68' : '#C8C6C0', opacity: back ? 0.4 : 0.55 }, shin));
      el('path', { d: `M-17,${G.shin - 12} Q0,${G.shin - 4} 17,${G.shin - 12}`, fill: 'none', stroke: o.pantsShade, 'stroke-width': 3 }, shin); // elastic cuff
    }
    const foot = el('g', {}, shin);
    // sneaker, pointing toward +x
    el('path', { d: 'M-20,-6 Q-24,14 -18,20 L34,20 Q44,18 42,8 Q38,-2 18,-4 Q10,-12 -4,-12 Q-16,-12 -20,-6Z', fill: o.sole ? o.shoe : (back ? '#CFCBC2' : o.shoe), stroke: P.line, 'stroke-width': 1.4 }, foot);
    el('path', { d: 'M-19,15 L41,15', stroke: o.sole || '#B9B3A8', 'stroke-width': o.sole ? 6 : 3 }, foot);
    return { thigh, shin, foot };
  }

  let arms = {}, legs = {};

  function buildTorso() {
    torsoG.innerHTML = '';
    neckG.innerHTML = '';
    const o = outfit();
    // neck
    el('path', { d: `M-20,${G.neckTop} L-21,${G.neckBot + 6} Q0,${G.neckBot + 18} 21,${G.neckBot + 6} L20,${G.neckTop}Z`, fill: P.skin, stroke: P.line, 'stroke-width': 1.4 }, neckG);
    el('path', { d: `M-17,${G.neckTop + 4} Q0,${G.neckTop + 24} 17,${G.neckTop + 4} L17,${G.neckTop}  L-17,${G.neckTop}Z`, fill: P.skinShade, opacity: 0.8 }, neckG);
    const sy = G.shoulderY, hy = G.hipY;
    const torso = `M-80,${sy - 10} Q-94,${sy} -90,${sy + 44} L-72,${hy - 10} Q-68,${hy + 10} -56,${hy + 12} L56,${hy + 12} Q68,${hy + 10} 72,${hy - 10} L90,${sy + 44} Q94,${sy} 80,${sy - 10} Q52,${sy - 24} 26,${sy - 22} Q0,${sy - 2} -26,${sy - 22} Q-52,${sy - 24} -80,${sy - 10}Z`;
    if (state.view === 'back' && (o.hood || o.baggy)) {
      const back = torso.replace(`Q0,${sy - 2}`, `Q0,${sy - 18}`);
      el('path', { d: back, fill: o.top, stroke: P.line, 'stroke-width': 1.4 }, torsoG);
      if (o.hood) {
        // oversized hoodie back; white tee hem shows underneath
        el('path', { d: `M-90,${sy - 12} Q-104,${sy} -100,${sy + 50} L-84,${hy - 6} Q-78,${hy + 2} -64,${hy + 2} L64,${hy + 2} Q78,${hy + 2} 84,${hy - 6} L100,${sy + 50} Q104,${sy} 90,${sy - 12} Q0,${sy - 30} -90,${sy - 12}Z`, fill: o.jacket, stroke: P.line, 'stroke-width': 1.4 }, torsoG);
        el('path', { d: `M-70,${hy - 8} L70,${hy - 8}`, stroke: '#2A2A2D', 'stroke-width': 7 }, torsoG);
        el('path', { d: `M-46,${sy - 22} Q-52,${sy + 60} 0,${sy + 76} Q52,${sy + 60} 46,${sy - 22} Q0,${sy - 34} -46,${sy - 22}Z`, fill: '#141416', stroke: P.line, 'stroke-width': 1.2 }, torsoG);
        el('path', { d: `M0,${sy - 30} L0,${sy + 74}`, stroke: '#0A0A0B', 'stroke-width': 1.6 }, torsoG);
      } else {
        el('path', { d: `M-40,${sy + 40} Q-20,${sy + 120} -30,${hy - 20} M36,${sy + 60} Q24,${sy + 140} 30,${hy - 30}`, fill: 'none', stroke: o.topShade, 'stroke-width': 3, opacity: 0.8 }, torsoG);
      }
      return;
    }
    if (state.view === 'back') {
      el('path', { d: torso.replace(`Q0,${sy - 2}`, `Q0,${sy - 18}`), fill: o.top, stroke: P.line, 'stroke-width': 1.4 }, torsoG);
      if (o.jacket) el('path', { d: torso.replace(`Q0,${sy - 2}`, `Q0,${sy - 18}`), fill: o.jacket, stroke: P.line, 'stroke-width': 1.4 }, torsoG);
      if (o.jacket) el('path', { d: `M-40,${sy - 18} Q0,${sy + 10} 40,${sy - 18} Q0,${sy - 30} -40,${sy - 18}Z`, fill: o.top }, torsoG); // hood
      return;
    }
    el('path', { d: torso, fill: o.top, stroke: P.line, 'stroke-width': 1.4 }, torsoG);
    // side shade on the far side
    el('path', { d: `M60,${sy - 16} Q92,${sy} 90,${sy + 44} L72,${hy - 10} Q68,${hy + 10} 56,${hy + 12} L40,${hy + 12} Q60,${sy + 120} 60,${sy - 16}Z`, fill: o.topShade, opacity: 0.85 }, torsoG);
    if (state.outfit === 'tee') {
      // ribbed collar + the faded mandala print from the photo
      el('path', { d: `M-28,${sy - 21} Q0,${sy + 2} 28,${sy - 21} Q0,${sy + 12} -28,${sy - 21}Z`, fill: o.topShade, stroke: P.line, 'stroke-width': 1.2 }, torsoG);
      const pr = el('g', { opacity: 0.85 }, torsoG);
      el('circle', { cx: 14, cy: sy + 130, r: 52, fill: o.print2, opacity: 0.55 }, pr);
      el('circle', { cx: 14, cy: sy + 130, r: 34, fill: 'none', stroke: o.print, 'stroke-width': 6, 'stroke-dasharray': '7 5' }, pr);
      el('path', { d: `M-2,${sy + 128} q8,-16 18,-4 q10,12 -2,22 q-12,8 -18,-4 M24,${sy + 112} q10,4 6,16`, fill: 'none', stroke: o.print, 'stroke-width': 5, 'stroke-linecap': 'round' }, pr);
      el('path', { d: `M-80,${sy + 40} Q-40,${sy + 60} -60,${sy + 110} Q-30,${sy + 80} -10,${sy + 40}Z`, fill: '#2C2C22', opacity: 0.35 }, pr);
    } else if (state.outfit === 'layers') {
      // hoodie front with hood bunched at the neck, open taupe overshirt on top
      el('path', { d: `M-34,${sy - 24} Q-44,${sy + 4} -20,${sy + 14} Q0,${sy + 20} 20,${sy + 14} Q44,${sy + 4} 34,${sy - 24} Q0,${sy - 6} -34,${sy - 24}Z`, fill: '#2A2A2E', stroke: P.line, 'stroke-width': 1.2 }, torsoG);
      el('path', { d: `M-6,${sy + 16} L-9,${sy + 70} M8,${sy + 16} L10,${sy + 66}`, stroke: '#3A3A40', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, torsoG);
      const jk = `M-80,${sy - 10} Q-96,${sy} -92,${sy + 44} L-76,${hy - 4} Q-70,${hy + 14} -56,${hy + 16} L-30,${hy + 16} L-34,${sy + 40} L-40,${sy - 14} Q-62,${sy - 24} -80,${sy - 10}Z`;
      el('path', { d: jk, fill: o.jacket, stroke: P.line, 'stroke-width': 1.4 }, torsoG);
      el('path', { d: `M80,${sy - 10} Q96,${sy} 92,${sy + 44} L76,${hy - 4} Q70,${hy + 14} 56,${hy + 16} L32,${hy + 16} L38,${sy + 40} L42,${sy - 14} Q62,${sy - 24} 80,${sy - 10}Z`, fill: o.jacketShade, stroke: P.line, 'stroke-width': 1.4 }, torsoG);
      // collar points + chest pocket
      el('path', { d: `M-40,${sy - 14} L-30,${sy + 34} L-50,${sy + 12}Z M42,${sy - 14} L34,${sy + 34} L54,${sy + 12}Z`, fill: o.jacketShade, stroke: P.line, 'stroke-width': 1.2 }, torsoG);
      el('path', { d: `M-72,${sy + 70} L-44,${sy + 70} L-44,${sy + 104} L-72,${sy + 104}Z`, fill: 'none', stroke: o.jacketShade, 'stroke-width': 2 }, torsoG);
    } else if (state.outfit === 'hoodie') {
      // white tee underneath (already drawn), crew collar
      el('path', { d: `M-28,${sy - 21} Q0,${sy + 4} 28,${sy - 21}`, fill: 'none', stroke: o.topShade, 'stroke-width': 4 }, torsoG);
      // hood bunched behind the neck
      el('path', { d: `M-52,${sy - 18} Q-60,${sy - 46} -30,${sy - 34} Q0,${sy - 26} 30,${sy - 34} Q60,${sy - 46} 52,${sy - 18} Q30,${sy - 22} 28,${sy - 21} Q0,${sy - 8} -28,${sy - 21} Q-30,${sy - 22} -52,${sy - 18}Z`, fill: '#141416', stroke: P.line, 'stroke-width': 1.2 }, torsoG);
      // open oversized zip hoodie panels
      const L = `M-90,${sy - 12} Q-104,${sy} -100,${sy + 50} L-84,${hy - 6} Q-78,${hy + 2} -64,${hy + 2} L-34,${hy + 2} L-30,${sy + 60} L-34,${sy - 20} Q-62,${sy - 26} -90,${sy - 12}Z`;
      const R = `M90,${sy - 12} Q104,${sy} 100,${sy + 50} L84,${hy - 6} Q78,${hy + 2} 64,${hy + 2} L36,${hy + 2} L32,${sy + 60} L36,${sy - 20} Q62,${sy - 26} 90,${sy - 12}Z`;
      el('path', { d: L, fill: o.jacket, stroke: P.line, 'stroke-width': 1.4 }, torsoG);
      el('path', { d: R, fill: o.jacketShade, stroke: P.line, 'stroke-width': 1.4 }, torsoG);
      // zip edges, drawstrings, ribbed hem
      el('path', { d: `M-32,${sy - 18} L-34,${hy} M34,${sy - 18} L36,${hy}`, stroke: '#3A3A3E', 'stroke-width': 2 }, torsoG);
      el('path', { d: `M-24,${sy - 14} Q-26,${sy + 30} -22,${sy + 70} M22,${sy - 14} Q24,${sy + 30} 20,${sy + 66}`, fill: 'none', stroke: '#0A0A0B', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, torsoG);
      el('path', { d: `M-82,${hy - 6} L-36,${hy - 6} M36,${hy - 6} L82,${hy - 6}`, stroke: '#2A2A2D', 'stroke-width': 7 }, torsoG);
    } else if (state.outfit === 'whitetee') {
      el('path', { d: `M-28,${sy - 21} Q0,${sy + 4} 28,${sy - 21}`, fill: 'none', stroke: o.topShade, 'stroke-width': 4 }, torsoG);
      el('path', { d: `M-46,${sy + 50} Q-30,${sy + 130} -40,${hy - 20}`, fill: 'none', stroke: o.topShade, 'stroke-width': 3, opacity: 0.8 }, torsoG);
    } else {
      el('path', { d: `M-28,${sy - 21} Q0,${sy + 2} 28,${sy - 21}`, fill: 'none', stroke: '#2C2C30', 'stroke-width': 4 }, torsoG);
    }
  }

  /* ---- head ---- */
  const H = {};
  function buildHead() {
    headWrap.innerHTML = '';
    const head = el('g', {}, headWrap);
    H.head = head;
    H.hairBack = el('path', { fill: P.hair, stroke: P.line, 'stroke-width': 1.4 }, head);
    H.earB = el('g', {}, head);
    H.earF = el('g', {}, head);
    const earD = 'M0,-13 Q9,-15 10,-2 Q10,10 3,16 Q-1,18 -2,12 L-2,-10Z';
    const earIn = 'M2,-7 Q7,-8 7,0 Q6,7 3,9';
    for (const [g, side] of [[H.earB, 1], [H.earF, -1]]) {
      const inner = el('g', { transform: `scale(${side},1)` }, g);
      el('path', { d: earD, fill: P.skin, stroke: P.line, 'stroke-width': 1.4 }, inner);
      el('path', { d: earIn, fill: 'none', stroke: P.skinDeep, 'stroke-width': 1.2 }, inner);
      if (side === -1) el('circle', { cx: 4, cy: 13, r: 1.9, fill: '#EEF1F3', stroke: '#8E989F', 'stroke-width': 0.8 }, inner);
    }
    H.face = el('path', { fill: P.skin, stroke: P.line, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, head);
    H.faceClip = el('clipPath', { id: 'kdc' + Math.random().toString(36).slice(2, 8) }, head);
    H.faceClipPath = el('path', {}, H.faceClip);
    const clipped = el('g', { 'clip-path': `url(#${H.faceClip.id})` }, head);
    H.shade = el('path', { fill: P.skinShade, opacity: 0.55 }, clipped);
    H.blushL = el('ellipse', { rx: 8, ry: 4.5, fill: '#D88B78', opacity: 0.18 }, clipped);
    H.blushR = el('ellipse', { rx: 8, ry: 4.5, fill: '#D88B78', opacity: 0.18 }, clipped);
    H.stache = el('path', { fill: P.hairMid, opacity: 0.42 }, clipped);
    H.chin = el('path', { fill: 'none', stroke: P.hairMid, 'stroke-width': 1, opacity: 0.5, 'stroke-linecap': 'round' }, clipped);
    H.mole = el('circle', { r: 1.3, fill: '#6A4636' }, clipped);

    const e = eyePaths();
    H.eyes = [];
    for (const side of [1, -1]) {
      const g = el('g', {}, head);
      const flipG = el('g', { transform: `scale(${side},1)` }, g);
      const blinkG = el('g', {}, flipG);
      const id = 'kde' + Math.random().toString(36).slice(2, 8);
      const cp = el('clipPath', { id }, blinkG);
      el('path', { d: e.sclera }, cp);
      el('path', { d: e.sclera, fill: P.white }, blinkG);
      const irisG = el('g', { 'clip-path': `url(#${id})` }, blinkG);
      const iris = el('g', {}, irisG);
      el('circle', { r: 5.1, fill: P.iris }, iris);
      el('circle', { r: 2.3, fill: '#140D0A' }, iris);
      el('circle', { cx: 1.4, cy: -1.5, r: 1.15, fill: '#fff', opacity: 0.95 }, iris);
      el('path', { d: 'M-9,-1 Q0,-7 9,-1 L9,-6 L-9,-6Z', fill: P.skinShade, opacity: 0.35 }, irisG);
      el('path', { d: e.lid, fill: 'none', stroke: '#241815', 'stroke-width': 2.3, 'stroke-linecap': 'round' }, blinkG);
      el('path', { d: e.lash, fill: 'none', stroke: '#241815', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, blinkG);
      el('path', { d: e.lower, fill: 'none', stroke: P.skinDeep, 'stroke-width': 0.9, opacity: 0.55 }, blinkG);
      const crease = el('path', { d: e.crease, fill: 'none', stroke: P.skinDeep, 'stroke-width': 1, opacity: 0.6 }, flipG);
      H.eyes.push({ g, flipG, blinkG, iris, crease, side });
    }
    H.brows = [];
    for (const side of [1, -1]) {
      const g = el('g', {}, head);
      const p = el('path', { d: 'M4,-0.6 Q14,-4.4 24,-3.2 Q27.2,-2.6 28.8,-0.4 L27.6,1.6 Q19,-0.6 4.6,3.4Z', fill: P.brow }, g);
      H.brows.push({ g, p, side });
    }
    H.nose = el('g', {}, head);
    H.noseBridge = el('path', { fill: 'none', stroke: P.skinDeep, 'stroke-width': 1.3, opacity: 0.55, 'stroke-linecap': 'round' }, H.nose);
    H.noseTipHi = el('ellipse', { rx: 4, ry: 2.6, fill: P.skinLight, opacity: 0.55 }, H.nose);
    H.noseBase = el('path', { fill: 'none', stroke: '#8A5643', 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, H.nose);
    H.nostrils = el('path', { fill: '#7A4A3A', opacity: 0.6 }, H.nose);
    H.mouth = el('g', {}, head);
    H.lipU = el('path', { fill: P.lipTop }, H.mouth);
    H.lipL = el('path', { fill: P.lipBot }, H.mouth);
    H.mGap = el('path', { fill: '#5A2A2A' }, H.mouth);
    H.lipHi = el('ellipse', { rx: 4.5, ry: 1.3, fill: '#E2A79E', opacity: 0.7 }, H.mouth);
    H.mLine = el('path', { fill: 'none', stroke: P.lipLine, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, H.mouth);

    H.fringe = el('path', { fill: P.hair, stroke: P.line, 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, head);
    H.crown = el('path', { fill: P.hair }, head);
    H.parts = el('path', { fill: 'none', stroke: '#120D0C', 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: 0.85 }, head);
    H.curls = el('path', { fill: 'none', stroke: '#0E0A09', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: 0.75 }, head);
    H.hairHi = el('path', { fill: 'none', stroke: P.hairHi, 'stroke-width': 2.6, 'stroke-linecap': 'round', opacity: 0.6 }, head);
    H.sideburnL = el('path', { fill: P.hair }, head);
    H.sideburnR = el('path', { fill: P.hair }, head);
    state.lastTurnDrawn = null;
  }

  function drawHead(t) {
    const a = Math.abs(t), s = Math.sign(t) || 1;
    const back = state.view === 'back';
    const outline = faceOutline(t);
    const faceD = smooth(outline);
    H.face.setAttribute('d', faceD);
    H.faceClipPath.setAttribute('d', faceD);
    H.hairBack.setAttribute('d', hairBack(t));
    // ears: far ear tucks behind the cheek, near ear slides toward the back of the head
    const earBX = 39 * (1 - 0.16 * a * (s > 0 ? 1 : -0.4)) + t * 3;
    const earFX = -39 * (1 - 0.16 * a * (s < 0 ? 1 : -0.4)) + t * 3;
    H.earB.setAttribute('transform', `translate(${f(earBX)},6) scale(${f(1 - 0.5 * Math.max(0, t))},1)`);
    H.earF.setAttribute('transform', `translate(${f(earFX)},6) scale(${f(1 - 0.5 * Math.max(0, -t))},1)`);

    [H.eyes, H.brows, [H.nose], [H.mouth], [H.shade], [H.mole], [H.stache], [H.chin], [H.blushL], [H.blushR]].flat().forEach((x) => {
      const node = x.g || x;
      node.style.display = back ? 'none' : '';
    });
    if (back) {
      // curly mass seen from behind: bumpy outline, curl marks all over, short at the nape
      let bd = scallop(0, -36, 52, 62, Math.PI * 0.8, Math.PI * 2.2, 20, 4, (x) => x, 17);
      bd += ' Q40,30 26,44 Q0,54 -26,44 Q-40,30 -40,4Z';
      H.fringe.setAttribute('d', bd);
      H.crown.setAttribute('d', '');
      H.parts.setAttribute('d', '');
      const BC = [];
      for (let yy = -92; yy <= 12; yy += 15) for (let xx = -44; xx <= 44; xx += 15) {
        if (Math.hypot(xx / 52, (yy + 36) / 62) > 0.92) continue;
        const ox = ((yy / 15) % 2) ? 7 : 0, r = 5 + ((xx + yy) & 2);
        BC.push(`M${xx + ox - r},${yy} Q${xx + ox},${yy - r * 1.4} ${xx + ox + r},${yy + 1}`);
      }
      H.hairHi.setAttribute('d', 'M-30,-80 q8,-6 16,-2 M6,-90 q8,-6 16,-1 M-20,-50 q8,-6 16,-2 M14,-58 q8,-6 16,-2');
      H.curls.setAttribute('d', BC.join(' '));
      H.sideburnL.setAttribute('d', ''); H.sideburnR.setAttribute('d', '');
      return;
    }

    // shading: a soft shadow down the far side of the face and under the jaw
    const fx = t * 10;
    H.shade.setAttribute('d', `M${f(34 + fx * 0.4)},-56 Q${f(29 + fx * 0.6)},-6 ${f(31 + fx * 0.8)},28 Q${f(22 + fx)},52 ${f(4 + fx)},64 L60,70 L60,-60Z`);
    H.shade.setAttribute('transform', t < 0 ? 'scale(-1,1)' : '');
    H.shade.setAttribute('opacity', f(0.22 + a * 0.22));

    for (const eye of H.eyes) {
      const far = eye.side === s;
      const bx = eye.side * 17;
      const x = (far ? bx * (1 - 0.32 * a) : bx * (1 - 0.06 * a)) + t * 13;
      const sx = far ? 1 - 0.5 * a : 1 - 0.06 * a;
      eye.g.setAttribute('transform', `translate(${f(x)},0) scale(${f(sx)},1)`);
      eye.x = x; eye.sx = sx;
    }
    for (const b of H.brows) {
      const far = b.side === s;
      const off = (far ? 1 - 0.32 * a : 1 - 0.06 * a);
      b.base = { x: t * 13, off, sx: far ? 1 - 0.45 * a : 1 };
    }
    const nx = t * 21;
    const nsx = 1 - 0.35 * a;
    H.nose.setAttribute('transform', `translate(${f(nx)},0)`);
    H.noseBridge.setAttribute('d', a > 0.25 ? `M${f(s * 3)},8 Q${f(s * (4 + a * 4))},15 ${f(s * (6 + a * 5))},22` : '');
    H.noseTipHi.setAttribute('cx', f(s * a * 3)); H.noseTipHi.setAttribute('cy', 24);
    const w = 9.2 * nsx;
    H.noseBase.setAttribute('d', `M${f(-w)},23.5 Q${f(-w - 1.2)},29 ${f(-w * 0.6)},30.2 Q${f(-w * 0.25)},31.8 0,30.6 Q${f(w * 0.25)},31.8 ${f(w * 0.6)},30.2 Q${f(w + 1.2)},29 ${f(w)},23.5`);
    H.nostrils.setAttribute('d', `M${f(-w * 0.62)},29.3 a${f(2.1 * nsx)},1 0 1,0 ${f(4.2 * nsx)},0 a${f(2.1 * nsx)},1 0 1,0 ${f(-4.2 * nsx)},0Z M${f(w * 0.62 - 4.2 * nsx)},29.3 a${f(2.1 * nsx)},1 0 1,0 ${f(4.2 * nsx)},0 a${f(2.1 * nsx)},1 0 1,0 ${f(-4.2 * nsx)},0Z`);
    H.mouth.setAttribute('transform', `translate(${f(t * 15)},44.5)`);
    H.mouthW = 1 - 0.22 * a;
    H.stache.setAttribute('d', `M${f(t * 15 - 14 * H.mouthW)},41.5 Q${f(t * 15)},34.6 ${f(t * 15 + 14 * H.mouthW)},41.5 Q${f(t * 15 + 7)},38.2 ${f(t * 15)},38.6 Q${f(t * 15 - 7)},38.2 ${f(t * 15 - 14 * H.mouthW)},41.5Z`);
    const cx = t * 13;
    H.chin.setAttribute('d', `M${f(cx - 6)},56 l-1,4 M${f(cx - 2)},57 l0,4.5 M${f(cx + 2)},57 l0.4,4.5 M${f(cx + 6)},56 l1,4`);
    H.mole.setAttribute('cx', f(-15 * (s < 0 ? 1 - 0.32 * a : 1 - 0.06 * a) + t * 16)); H.mole.setAttribute('cy', 23);
    H.blushL.setAttribute('cx', f(-22 * (s < 0 ? 1 - 0.3 * a : 1) + t * 13)); H.blushL.setAttribute('cy', 18);
    H.blushR.setAttribute('cx', f(22 * (s > 0 ? 1 - 0.3 * a : 1) + t * 13)); H.blushR.setAttribute('cy', 18);

    H.fringe.setAttribute('d', fringe(t));
    H.crown.setAttribute('d', fringeTop(t));
    const st = hairStrands(t);
    H.parts.setAttribute('d', st.parts);
    H.hairHi.setAttribute('d', st.hiD);
    H.curls.setAttribute('d', st.curlD);
    const sbx = (x) => (Math.sign(x) === s ? x * (1 - 0.14 * a) : x * (1 + 0.1 * a)) + t * 3;
    H.sideburnL.setAttribute('d', `M${f(sbx(-40))},-34 L${f(sbx(-35))},-32 L${f(sbx(-36))},4 L${f(sbx(-39.5))},2Z`);
    H.sideburnR.setAttribute('d', `M${f(sbx(40))},-34 L${f(sbx(35))},-32 L${f(sbx(36))},4 L${f(sbx(39.5))},2Z`);
  }

  function applyFace() {
    if (state.view === 'back') return;
    const E = state.expr;
    const open = (E.open || 0) + (state.talking ? (Math.sin(state.t * 17) * 0.5 + 0.5) * 2.4 : 0);
    const m = mouthPaths(E.curve, open, H.mouthW || 1);
    H.lipU.setAttribute('d', m.up);
    H.lipL.setAttribute('d', m.lo);
    H.mLine.setAttribute('d', m.line);
    H.mGap.setAttribute('d', m.gap);
    H.lipHi.setAttribute('cy', 4 + open * 0.7);
    // eyes: blink + lid + look
    const lidOpen = Math.max(0.06, E.lid * (1 - state.blink));
    const [lx, ly] = state.look;
    for (const eye of H.eyes) {
      eye.blinkG.setAttribute('transform', `translate(0,${f((1 - lidOpen) * -1.2)}) scale(1,${f(Math.min(1.08, lidOpen))})`);
      eye.iris.setAttribute('transform', `translate(${f(lx * 3.4 * eye.side)},${f(0.2 + (ly + E.lookY) * 1.6)})`);
    }
    for (const b of H.brows) {
      const far = b.side === (Math.sign(state.turn) || 1);
      const eye = H.eyes.find((e) => e.side === b.side);
      const x = eye ? eye.x : 0;
      const sx = eye ? eye.sx : 1;
      const lift = -12.4 + E.browY + (state.blink > 0.5 ? 1 : 0);
      const rot = E.browIn * b.side * -2.2;
      b.g.setAttribute('transform', `translate(${f(x)},${f(lift)}) scale(${f(b.side * sx)},1) translate(-16,0) rotate(${f(rot)} 4 0)`);
    }
  }

  /* ---- assemble ---- */
  function rebuild() {
    arms.B = buildArm(armB, true);
    arms.F = buildArm(armF, false);
    legs.B = buildLeg(legB, true);
    legs.F = buildLeg(legF, false);
    buildTorso();
    buildHead();
    armFTop.innerHTML = '';
  }
  rebuild();

  /* ---- per-frame ---- */
  const lerp = (a, b, k) => a + (b - a) * k;
  function update(dt) {
    state.t += dt;
    const k = 1 - Math.exp(-dt * state.poseRate);
    const P2 = state.pose, T = state.poseTarget;
    for (const key in T) if (typeof T[key] === 'number') P2[key] = lerp(P2[key] ?? 0, T[key], k);
    const ke = 1 - Math.exp(-dt * 8);
    for (const key in state.exprTarget) state.expr[key] = lerp(state.expr[key], state.exprTarget[key], ke);
    state.turn = lerp(state.turn, state.turnTarget, 1 - Math.exp(-dt * 7));
    state.look[0] = lerp(state.look[0], state.lookTarget[0], ke);
    state.look[1] = lerp(state.look[1], state.lookTarget[1], ke);

    // blink
    state.nextBlink -= dt;
    if (state.nextBlink <= 0) { state.blinkT = 0; state.nextBlink = 2.2 + Math.random() * 3.4; }
    if (state.blinkT !== undefined) {
      state.blinkT += dt;
      const bt = state.blinkT / 0.16;
      state.blink = bt < 0.5 ? bt * 2 : bt < 1 ? (1 - bt) * 2 : 0;
      if (bt >= 1) state.blinkT = undefined;
    }

    let { aB, eB, aF, eF, hB, kB, hF, kF, lean, tilt, y } = P2;
    let bob = 0;
    if (state.walking) {
      state.walk += dt * 5.2 * state.walkSpeed;
      const w = state.walk;
      const sw = Math.sin(w);
      hB += sw * 24; hF -= sw * 24;
      kB += Math.max(0, -Math.cos(w)) * 34;
      kF += Math.max(0, Math.cos(w)) * 34;
      aB -= sw * 20; aF += sw * 20;
      eB -= 10; eF -= 10;
      bob = -Math.abs(Math.cos(w)) * 7;
    }
    if (state.typing) {
      eB += Math.sin(state.t * 22) * 3; eF += Math.sin(state.t * 19 + 1) * 3;
    }
    const breath = state.breathe ? Math.sin(state.t * 1.9) : 0;

    // torso turn: shoulders narrow and slide slightly toward the facing side
    const tt = Math.abs(state.turn);
    const sxB = G.shoulderX * (1 - 0.3 * tt), sxF = -G.shoulderX * (1 - 0.08 * tt);
    const shift = tt * 6;
    body.setAttribute('transform', `translate(${f(shift)},${f(y + bob)})`);
    torsoG.setAttribute('transform', `translate(0,${G.hipY}) rotate(${f(-lean)}) scale(${f(1 - 0.16 * tt)},${f(1 + breath * 0.006)}) translate(0,${-G.hipY})`);
    flip.setAttribute('transform', `scale(${state.dir},1)`);

    const leanRad = (-lean * Math.PI) / 180;
    const rot = (x, yy) => {
      const dx = x, dy = yy - G.hipY;
      return [dx * Math.cos(leanRad) - dy * Math.sin(leanRad), G.hipY + dx * Math.sin(leanRad) + dy * Math.cos(leanRad)];
    };
    const [sbx, sby] = rot(sxB * (1 - 0.16 * tt), G.shoulderY + 14 - breath * 1.2);
    const [sfx, sfy] = rot(sxF * (1 - 0.16 * tt), G.shoulderY + 14 - breath * 1.2);
    arms.B.upper.setAttribute('transform', `translate(${f(sbx)},${f(sby)}) rotate(${f(aB)})`);
    arms.B.fore.setAttribute('transform', `translate(0,${G.upper}) rotate(${f(eB)})`);
    arms.B.hand.setAttribute('transform', `translate(0,${G.fore - 4}) rotate(${f(eB * 0.15)})`);
    arms.F.upper.setAttribute('transform', `translate(${f(sfx)},${f(sfy)}) rotate(${f(aF)})`);
    arms.F.fore.setAttribute('transform', `translate(0,${G.upper}) rotate(${f(eF)})`);
    arms.F.hand.setAttribute('transform', `translate(0,${G.fore - 4}) rotate(${f(eF * 0.15)})`);
    const handF = state.poseTarget.handF === 'open';
    if (arms.F._open !== handF) { arms.F.hp.setAttribute('d', handPath(handF)); arms.F._open = handF; }

    legs.B.thigh.setAttribute('transform', `translate(${G.hipX * (1 - 0.4 * tt)},${G.hipY + 4}) rotate(${f(hB)})`);
    legs.B.shin.setAttribute('transform', `translate(0,${G.thigh}) rotate(${f(kB)})`);
    legs.B.foot.setAttribute('transform', `translate(0,${G.shin}) rotate(${f(-(hB + kB) * 0.9)})`);
    legs.F.thigh.setAttribute('transform', `translate(${-G.hipX * (1 - 0.2 * tt)},${G.hipY + 4}) rotate(${f(hF)})`);
    legs.F.shin.setAttribute('transform', `translate(0,${G.thigh}) rotate(${f(kF)})`);
    legs.F.foot.setAttribute('transform', `translate(0,${G.shin}) rotate(${f(-(hF + kF) * 0.9)})`);

    // neck + head follow the torso top
    const [nx, ny] = rot(0, G.neckBot);
    neckG.setAttribute('transform', `translate(${f(nx)},${f(ny - G.neckBot)}) rotate(${f(-lean * 0.5)} 0 ${G.neckBot})`);
    const [hx, hy] = rot(0, G.headY);
    const headX = (hx + shift) * state.dir, headY = hy + y + bob - breath * 1.4;
    headWrap.setAttribute('transform', `translate(${f(headX)},${f(headY)}) rotate(${f(tilt * state.dir + (state.walking ? Math.sin(state.walk * 2) * 0.8 : 0))}) scale(${HEAD_SCALE})`);

    const tq = Math.round(state.turn * 50) / 50;
    if (tq !== state.lastTurnDrawn) { drawHead(tq); state.lastTurnDrawn = tq; }
    applyFace();

    // arm that reaches the face must render above the head
    const toFace = (P2.eF < -100);
    if (toFace && armF.parentNode !== armFTop) { armFTop.appendChild(armF); armFTop.setAttribute('transform', `scale(${state.dir},1)`); }
    else if (!toFace && armF.parentNode !== body) body.appendChild(armF);
    if (toFace) armFTop.setAttribute('transform', `scale(${state.dir},1) translate(${f(shift)},${f(y + bob)})`);
  }

  const api = {
    el: root,
    state,
    update,
    setPose(name, rate = 6) { state.poseTarget = { ...POSES[name] }; state.poseRate = rate; return api; },
    snapPose(name) { state.pose = { ...POSES[name] }; state.poseTarget = { ...POSES[name] }; return api; },
    setExpr(name) { state.exprTarget = { ...EXPRESSIONS[name] }; return api; },
    snapExpr(name) { state.expr = { ...EXPRESSIONS[name] }; state.exprTarget = { ...EXPRESSIONS[name] }; return api; },
    setTurn(t) { state.turnTarget = t; return api; },
    snapTurn(t) { state.turn = t; state.turnTarget = t; return api; },
    look(x, y) { state.lookTarget = [x, y]; return api; },
    setDir(d) { state.dir = d; return api; },
    walk(on, speed = 1) { state.walking = on; state.walkSpeed = speed; if (!on) state.walk = 0; return api; },
    type(on) { state.typing = on; return api; },
    talk(on) { state.talking = on; return api; },
    setOutfit(name) { state.outfit = name; rebuild(); state.lastTurnDrawn = null; return api; },
    setView(v) { state.view = v; rebuild(); state.lastTurnDrawn = null; return api; },
    blinkNow() { state.nextBlink = 0; return api; },
    hand(which = 'F') { return arms[which].prop; },
    rebuild() { rebuild(); state.lastTurnDrawn = null; },
  };
  update(0);
  return api;
}

export { EXPRESSIONS };
