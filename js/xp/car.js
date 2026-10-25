/* car.js — a procedural grand-tourer coupe.
   Built from extruded side profiles that are then pinched in plan view
   and tucked in at the shoulders, so there is no model file to load.
   Local axes while building: +x = forward, +y = up, z = width.
   The outer group is rotated so the car faces -z in the world. */
import * as THREE from 'three';
import { radial } from './tex.js';

export const PAINTS = [
  { id: 'crimson', label: 'Crimson', hex: '#8e1413' },
  { id: 'obsidian', label: 'Obsidian', hex: '#0c0c0d' },
  { id: 'forest', label: 'Forest', hex: '#0f2d1f' },
  { id: 'bone', label: 'Bone', hex: '#e7e2d8' },
  { id: 'gunmetal', label: 'Gunmetal', hex: '#3b3e42' },
  { id: 'himalaya', label: 'Himalaya', hex: '#d8c9a8', unlock: 'paint-himalaya', hint: 'Reach HIMVEDA on the road' },
  { id: 'ember', label: 'Ember', hex: '#d52320', unlock: 'paint-ember', hint: 'Finish the road' },
];
export const FINISHES = [
  { id: 'gloss', label: 'Gloss', rough: 0.24, metal: 0.35, cc: 1, ccr: 0.04 },
  { id: 'metallic', label: 'Metallic', rough: 0.32, metal: 0.85, cc: 1, ccr: 0.08 },
  { id: 'satin', label: 'Satin', rough: 0.58, metal: 0.25, cc: 0.25, ccr: 0.5 },
];
export const WHEELS = [{ id: 'blade', label: 'Blade' }, { id: 'mesh', label: 'Mesh' }, { id: 'aero', label: 'Aero' }];
export const WHEEL_FINISH = [
  { id: 'black', label: 'Black', hex: '#141414', metal: 0.6, rough: 0.35 },
  { id: 'silver', label: 'Silver', hex: '#b9bbbd', metal: 1, rough: 0.22 },
  { id: 'bronze', label: 'Bronze', hex: '#7a5a34', metal: 1, rough: 0.3 },
];
export const HEIGHTS = [{ id: 'low', label: 'Low', y: -0.07 }, { id: 'street', label: 'Street', y: 0 }, { id: 'tall', label: 'Raised', y: 0.1 }];
export const KITS = [{ id: 'clean', label: 'Clean' }, { id: 'ducktail', label: 'Ducktail' }, { id: 'wing', label: 'Wing' }];
export const ACCENTS = [
  { id: 'black', label: 'Black', hex: '#0a0a0a' },
  { id: 'red', label: 'Crimson', hex: '#a31c1b' },
  { id: 'bone', label: 'Bone', hex: '#e7e2d8' },
];
export const HEADS = [{ id: 'warm', label: 'Warm', hex: '#ffe2b8' }, { id: 'ice', label: 'Ice', hex: '#dfeeff' }];
export const TAILS = [{ id: 'bar', label: 'Full bar' }, { id: 'split', label: 'Split' }];
export const GLOWS = [{ id: 'off', label: 'Off' }, { id: 'red', label: 'Red', hex: '#d52320' }, { id: 'green', label: 'Green', hex: '#1f7a4c' }];
export const TINTS = [
  { id: 'light', label: 'Light', hex: '#2c3836', op: 0.55 },
  { id: 'dark', label: 'Dark', hex: '#0b1010', op: 0.85 },
  { id: 'limo', label: 'Limo', hex: '#020202', op: 0.97 },
];

export const DEFAULT_CONFIG = {
  paint: 'crimson', finish: 'gloss', wheel: 'blade', wheelFinish: 'silver', height: 'street',
  kit: 'clean', accent: 'black', head: 'warm', tail: 'bar', glow: 'off', tint: 'dark',
};

const find = (list, id) => list.find((o) => o.id === id) || list[0];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ---------- geometry: lofted cross-sections ----------
   The body is a stack of rounded cross-sections along the length
   (a "loft"), so normals are smooth and reflections flow cleanly. */

const WB = 1.36;          // half wheelbase
const R_TIRE = 0.36;
const ARCH_R = 0.42;

/** smooth interpolation through [x, v] control points */
function curve(pts) {
  return (x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (x <= pts[i][0]) { const [x0, v0] = pts[i - 1], [x1, v1] = pts[i]; return v0 + (v1 - v0) * smooth(x0, x1, x); }
    }
    return pts[pts.length - 1][1];
  };
}
const topY = curve([[-2.34, 0.64], [-2.24, 0.83], [-1.95, 0.9], [-1.2, 0.91], [0, 0.86], [0.95, 0.83], [1.45, 0.81], [1.95, 0.74], [2.25, 0.63], [2.36, 0.48]]);
const botY = curve([[-2.34, 0.4], [-2.2, 0.27], [2.12, 0.25], [2.36, 0.36]]);
const halfW = curve([[-2.34, 0.74], [-2.15, 0.88], [-1.36, 0.96], [-0.4, 0.9], [0.6, 0.9], [1.36, 0.94], [1.95, 0.86], [2.36, 0.66]]);
const LEN = 2.36;

function archBottom(x) {
  let y = botY(x);
  for (const cx of [-WB, WB]) {
    const d = x - cx;
    if (Math.abs(d) < ARCH_R) y = Math.max(y, R_TIRE + Math.sqrt(ARCH_R * ARCH_R - d * d) * 0.98);
  }
  return y;
}
const spow = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);

/** Build a loft. ring(x, t) → [y, z]; t in [0,1). Optional per-quad material picker. */
function loft(xs, M, ring, { closed = true, caps = true, pick = null } = {}) {
  const cols = closed ? M : M + 1;
  const pos = [];
  xs.forEach((x) => { for (let j = 0; j < cols; j++) { const [y, z] = ring(x, j / M); pos.push(x, y, z); } });
  const groups = [[], []];
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < M; j++) {
      const jn = closed ? (j + 1) % cols : j + 1;
      const a = i * cols + j, b = i * cols + jn, c = (i + 1) * cols + j, d = (i + 1) * cols + jn;
      const g = pick ? pick((xs[i] + xs[i + 1]) / 2, (j + 0.5) / M) : 0;
      groups[g].push(a, b, c, b, d, c);
    }
  }
  if (caps) {
    [0, xs.length - 1].forEach((i, k) => {
      let cy = 0; for (let j = 0; j < cols; j++) cy += pos[(i * cols + j) * 3 + 1]; cy /= cols;
      const ci = pos.length / 3; pos.push(xs[i], cy, 0);
      for (let j = 0; j < M; j++) {
        const jn = closed ? (j + 1) % cols : j + 1;
        const a = i * cols + j, b = i * cols + jn;
        if (k === 0) groups[0].push(ci, b, a); else groups[0].push(ci, a, b);
      }
    });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex([...groups[0], ...groups[1]]);
  g.addGroup(0, groups[0].length, 0);
  if (groups[1].length) g.addGroup(groups[0].length, groups[1].length, 1);
  g.computeVertexNormals();
  return g;
}

function bodyGeometry() {
  const xs = []; const N = 140;
  for (let i = 0; i <= N; i++) { const u = i / N; xs.push(-LEN + 2 * LEN * (0.5 - 0.5 * Math.cos(Math.PI * u))); }
  return loft(xs, 56, (x, t) => {
    const th = t * Math.PI * 2;
    const end = Math.max(smooth(LEN - 0.2, LEN, x), smooth(LEN - 0.14, LEN, -x));
    const kEnd = 1 - 0.45 * Math.pow(end, 1.6);
    const top = topY(x), bot = botY(x);
    const cy = (top + bot) / 2, b = ((top - bot) / 2) * (1 - 0.25 * end);
    const a = halfW(x) * kEnd;
    const n = 3.4;
    let y = cy + b * spow(Math.sin(th), 2 / n);
    let z = a * spow(Math.cos(th), 2 / n);
    // shoulders tuck in toward the top (tumblehome)
    z *= 1 - 0.1 * smooth(cy, top, y);
    z *= 1 - 0.16 * smooth(cy, bot, y);      // tuck the rockers under
    y = Math.max(y, archBottom(x));
    return [y, z];
  });
}

const cabH = curve([[-2.02, 0], [-1.55, 0.2], [-0.85, 0.38], [-0.3, 0.405], [0.15, 0.385], [0.55, 0.22], [1.0, 0]]);
function cabinGeometry() {
  const xs = []; const N = 70;
  for (let i = 0; i <= N; i++) xs.push(1.0 - (3.02 * i) / N);
  return loft(xs, 30, (x, t) => {
    const th = t * Math.PI;
    const base = topY(x) - 0.03, h = cabH(x);
    const w = 0.84 - 0.06 * smooth(-1.4, -2.02, x);
    const n = 2.3;
    const s = Math.pow(Math.sin(th), 2 / n);
    const y = base + h * s;
    const z = w * spow(Math.cos(th), 2 / n) * (1 - 0.22 * s);
    return [y, z];
  }, {
    closed: false, caps: false,
    // 0 = glass, 1 = painted (roof and pillars)
    pick: (x, t) => {
      const th = t * Math.PI, side = th < 0.3 * Math.PI || th > 0.7 * Math.PI;
      if (th < 0.07 * Math.PI || th > 0.93 * Math.PI) return 1;                 // belt
      if (x > 0.22) return Math.abs(th - Math.PI / 2) > 0.42 * Math.PI ? 1 : 0; // windscreen + A-pillar
      if (!side && x > -0.95) return 1;                                         // roof
      if (side && x < -1.05) return 1;                                          // C-pillar
      if (side && Math.abs(x + 0.4) < 0.025) return 1;                          // B-pillar
      return 0;
    },
  });
}

/* ---------- the car ---------- */

export function createCar({ envMap = null } = {}) {
  const root = new THREE.Group();      // world-facing (-z forward)
  const inner = new THREE.Group();     // built along +x
  inner.rotation.y = Math.PI / 2;
  root.add(inner);
  const body = new THREE.Group();      // everything that rides on the suspension
  inner.add(body);

  const paint = new THREE.MeshPhysicalMaterial({ color: '#8e1413', metalness: 0.35, roughness: 0.24, clearcoat: 1, clearcoatRoughness: 0.04, envMap, envMapIntensity: 1.2 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#0b1010', metalness: 0.2, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, envMap, envMapIntensity: 1.4, transparent: true, opacity: 0.88 });
  const trim = new THREE.MeshStandardMaterial({ color: '#0a0a0a', metalness: 0.4, roughness: 0.5, envMap, envMapIntensity: 0.5 });
  const accent = new THREE.MeshStandardMaterial({ color: '#0a0a0a', metalness: 0.3, roughness: 0.4, envMap, envMapIntensity: 0.8 });
  const carbon = new THREE.MeshStandardMaterial({ color: '#111', metalness: 0.5, roughness: 0.35, envMap, envMapIntensity: 0.8 });
  const headMat = new THREE.MeshBasicMaterial({ color: '#ffe2b8' });
  const tailMat = new THREE.MeshBasicMaterial({ color: '#7a0d0c' });

  const shell = new THREE.Mesh(bodyGeometry(), paint);
  body.add(shell);
  const cabin = new THREE.Mesh(cabinGeometry(), [glass, paint]);
  body.add(cabin);

  // side skirts + splitter + diffuser carry the accent colour
  const skirtGeo = new THREE.BoxGeometry(1.75, 0.07, 0.05);
  [-1, 1].forEach((side) => { const m = new THREE.Mesh(skirtGeo, accent); m.position.set(0, 0.31, side * 0.82); body.add(m); });
  const splitter = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 1.2), accent);
  splitter.position.set(2.14, 0.27, 0); body.add(splitter);
  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 1.4), trim);
  diffuser.position.set(-2.24, 0.36, 0); body.add(diffuser);

  // headlights: thin blade strips
  const heads = new THREE.Group();
  [-1, 1].forEach((side) => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.022, 0.4), headMat);
    h.position.set(2.28, 0.58, side * 0.46); h.rotation.y = side * -0.28; heads.add(h);
  });
  body.add(heads);

  // tail lights: full-width bar or split pair
  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 1.36), tailMat);
  tailBar.position.set(-2.29, 0.76, 0); body.add(tailBar);
  const tailSplit = new THREE.Group();
  [-1, 1].forEach((side) => { const t = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.36), tailMat); t.position.set(-2.28, 0.74, side * 0.5); tailSplit.add(t); });
  body.add(tailSplit);

  // glows (additive sprites so the lights read as light, without bloom)
  const glowTex = radial([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']]);
  const mkGlow = (color, op) => new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
  const headGlows = [-1, 1].map((side) => { const s = mkGlow('#ffe2b8', 0.55); s.scale.set(0.9, 0.5, 1); s.position.set(2.34, 0.58, side * 0.46); body.add(s); return s; });
  const tailGlows = [-0.6, 0, 0.6].map((z) => { const s = mkGlow('#d52320', 0.35); s.scale.set(1.1, 0.4, 1); s.position.set(-2.36, 0.76, z); body.add(s); return s; });

  // aero kits
  const duck = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 1.52), paint);
  duck.position.set(-2.08, 0.97, 0); duck.rotation.z = 0.22; body.add(duck);
  const wing = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.035, 1.78), carbon); blade.position.set(-1.98, 1.16, 0); blade.rotation.z = 0.09; wing.add(blade);
  [-1, 1].forEach((s) => {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.025), carbon); strut.position.set(-1.98, 1.03, s * 0.5); wing.add(strut);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.02), carbon); plate.position.set(-1.98, 1.14, s * 0.9); wing.add(plate);
  });
  body.add(wing);

  /* ---- wheels ---- */
  const tireMat = new THREE.MeshStandardMaterial({ color: '#0d0d0d', roughness: 0.92, metalness: 0 });
  const rimMat = new THREE.MeshStandardMaterial({ color: '#141414', metalness: 0.6, roughness: 0.35, envMap, envMapIntensity: 1.6 });
  const caliperMat = new THREE.MeshStandardMaterial({ color: '#a31c1b', roughness: 0.4, metalness: 0.3 });
  const discMat = new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.4, metalness: 0.9, envMap });
  const R = R_TIRE, W = 0.27, RIM = 0.255;
  const tireGeo = new THREE.CylinderGeometry(R, R, W, 36, 1, false); tireGeo.rotateX(Math.PI / 2);
  const sidewallGeo = new THREE.TorusGeometry(R - 0.035, 0.04, 8, 36);

  function rimVariant(kind) {
    const g = new THREE.Group();
    const lip = new THREE.Mesh(new THREE.TorusGeometry(RIM, 0.018, 6, 40), rimMat); g.add(lip);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.06, 16).rotateX(Math.PI / 2), rimMat); g.add(hub);
    if (kind === 'blade') {
      for (let i = 0; i < 5; i++) {
        const sp = new THREE.Mesh(new THREE.BoxGeometry(0.06, RIM - 0.03, 0.035), rimMat);
        sp.geometry.translate(0, (RIM - 0.03) / 2 + 0.03, 0);
        sp.rotation.z = (i / 5) * Math.PI * 2; sp.rotation.y = 0.15; g.add(sp);
      }
    } else if (kind === 'mesh') {
      for (let i = 0; i < 12; i++) {
        const sp = new THREE.Mesh(new THREE.BoxGeometry(0.018, RIM, 0.025), rimMat);
        sp.geometry.translate(0, RIM / 2, 0);
        sp.rotation.z = (i / 12) * Math.PI * 2 + (i % 2 ? 0.28 : -0.28); g.add(sp);
      }
    } else {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(RIM, RIM * 0.92, 0.03, 40).rotateX(Math.PI / 2), rimMat); g.add(disc);
      for (let i = 0; i < 5; i++) {
        const hole = new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), trim);
        const a = (i / 5) * Math.PI * 2; hole.position.set(Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0.017); g.add(hole);
      }
    }
    return g;
  }

  const wheels = [];
  [[WB, 1], [WB, -1], [-WB, 1], [-WB, -1]].forEach(([x, side]) => {
    const w = new THREE.Group();
    w.position.set(x, R, side * 0.8);
    const spin = new THREE.Group(); w.add(spin);
    spin.add(new THREE.Mesh(tireGeo, tireMat));
    const sw = new THREE.Mesh(sidewallGeo, tireMat); sw.position.z = side * (W / 2 - 0.01); spin.add(sw);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 24).rotateX(Math.PI / 2), discMat); disc.position.z = side * 0.02; spin.add(disc);
    const rims = {};
    WHEELS.forEach((v) => { const r = rimVariant(v.id); r.position.z = side * (W / 2 - 0.02); if (side < 0) r.rotation.y = Math.PI; spin.add(r); rims[v.id] = r; });
    const cal = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.06), caliperMat);
    cal.position.set(-0.13 * Math.sign(x), 0.1, side * 0.06); w.add(cal);
    inner.add(w);
    wheels.push({ group: w, spin, rims });
  });

  // ground contact shadow and optional underglow
  const shadowTex = radial([[0, 'rgba(0,0,0,1)'], [0.6, 'rgba(0,0,0,.8)'], [1, 'rgba(0,0,0,0)']]);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.9), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.006; shadow.renderOrder = 2; inner.add(shadow);
  const glowFloor = radial([[0, 'rgba(255,255,255,.85)'], [0.5, 'rgba(255,255,255,.3)'], [1, 'rgba(255,255,255,0)']]);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 3.6), new THREE.MeshBasicMaterial({ map: glowFloor, color: '#d52320', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  under.rotation.x = -Math.PI / 2; under.position.y = 0.012; inner.add(under);

  /* ---- state ---- */
  let cfg = { ...DEFAULT_CONFIG };
  let brake = 0, headLevel = 1, rideY = 0, rideTarget = 0;

  function apply(next) {
    cfg = { ...cfg, ...next };
    const p = find(PAINTS, cfg.paint), f = find(FINISHES, cfg.finish);
    paint.color.set(p.hex);
    paint.metalness = f.metal; paint.roughness = f.rough; paint.clearcoat = f.cc; paint.clearcoatRoughness = f.ccr;
    paint.sheen = cfg.paint === 'himalaya' ? 1 : 0; paint.sheenColor.set('#fff4d6'); paint.sheenRoughness = 0.3;
    const wf = find(WHEEL_FINISH, cfg.wheelFinish);
    rimMat.color.set(wf.hex); rimMat.metalness = wf.metal; rimMat.roughness = wf.rough;
    wheels.forEach((w) => Object.entries(w.rims).forEach(([k, r]) => (r.visible = k === cfg.wheel)));
    rideTarget = find(HEIGHTS, cfg.height).y;
    duck.visible = cfg.kit === 'ducktail'; wing.visible = cfg.kit === 'wing';
    accent.color.set(find(ACCENTS, cfg.accent).hex);
    const hd = find(HEADS, cfg.head); headMat.color.set(hd.hex); headGlows.forEach((g) => g.material.color.set(hd.hex));
    tailBar.visible = cfg.tail === 'bar'; tailSplit.visible = cfg.tail === 'split';
    tailGlows[1].visible = cfg.tail === 'bar';
    const gl = find(GLOWS, cfg.glow); under.visible = cfg.glow !== 'off'; if (gl.hex) under.material.color.set(gl.hex);
    const t = find(TINTS, cfg.tint); glass.color.set(t.hex); glass.opacity = t.op;
    return cfg;
  }

  function setLights(level) { headLevel = level; }
  function setBrake(v) { brake = v; }
  function setEnvIntensity(k) { [paint, glass].forEach((m) => (m.envMapIntensity = k * (m === glass ? 1.4 : 1.2))); rimMat.envMapIntensity = k; }

  /** speed in m/s; steer -1..1 for body roll */
  function update(dt, speed = 0, steer = 0, instant = false) {
    rideY = instant ? rideTarget : rideY + (rideTarget - rideY) * Math.min(1, dt * 6);
    body.position.y = rideY;
    body.rotation.x = -steer * 0.035;         // roll (local x is forward)
    const ang = (speed * dt) / R;
    wheels.forEach((w) => (w.spin.rotation.z -= ang));
    wheels.slice(0, 2).forEach((w) => (w.group.rotation.y = steer * 0.25));
    const tailK = 0.25 + brake * 0.75;
    tailMat.color.setRGB(0.48 + 0.5 * brake, 0.05 + 0.04 * brake, 0.045 + 0.04 * brake);
    tailGlows.forEach((g) => (g.material.opacity = 0.18 + tailK * 0.7));
    headMat.color.set(find(HEADS, cfg.head).hex).multiplyScalar(0.15 + 0.85 * headLevel);
    headGlows.forEach((g) => (g.material.opacity = 0.6 * headLevel));
  }

  apply({});
  update(0, 0, 0, true);
  return { group: root, apply, update, setBrake, setLights, setEnvIntensity, get config() { return { ...cfg }; } };
}

/** A cheap low-poly traffic car for the road (shared geometry). */
export function makeTrafficFactory() {
  const bodyGeo = new THREE.BoxGeometry(1.8, 0.62, 4.3); bodyGeo.translate(0, 0.55, 0);
  const cabGeo = new THREE.BoxGeometry(1.5, 0.48, 2.1); cabGeo.translate(0, 1.08, 0.25);
  const tailGeo = new THREE.BoxGeometry(1.5, 0.08, 0.04); tailGeo.translate(0, 0.72, 2.16);
  const colors = ['#1c1d1f', '#2a2c2e', '#3a3a38', '#141414', '#24302a'].map((c) => new THREE.MeshLambertMaterial({ color: c }));
  const cabMat = new THREE.MeshLambertMaterial({ color: '#060707' });
  const tailMat = new THREE.MeshBasicMaterial({ color: '#c11a18' });
  const glowTex = radial([[0, 'rgba(255,60,50,.9)'], [1, 'rgba(255,0,0,0)']]);
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
  return () => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(bodyGeo, colors[(Math.random() * colors.length) | 0]));
    g.add(new THREE.Mesh(cabGeo, cabMat));
    g.add(new THREE.Mesh(tailGeo, tailMat));
    [-0.6, 0.6].forEach((x) => { const s = new THREE.Sprite(glowMat); s.scale.set(1.3, 0.55, 1); s.position.set(x, 0.72, 2.25); g.add(s); });
    return g;
  };
}
