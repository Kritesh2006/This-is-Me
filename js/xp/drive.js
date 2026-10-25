/* drive.js — the road.
   The car stays at the origin and the world scrolls toward it, which
   keeps numbers small and lets every roadside object be pooled.
   Distance travelled (`dist`) drives everything: chapters, story lines,
   project gates, and the end of the road. */
import * as THREE from 'three';
import { CHAPTERS, PROJECTS, SECRETS, currentAge } from '../data.js';
import { radial, road as roadTex, windows as windowTex, beam as beamTex, sign as signTex } from './tex.js';
import { makeTrafficFactory } from './car.js';
import { unlocks } from '../store.js';
import * as audio from '../audio.js';

const LANE = 3.6;
const ROAD_W = LANE * 3;
const SPAWN = 250;       // metres ahead where things appear
const KILL = 16;         // metres behind where things are recycled
const TILE = 24;         // road texture tile length in metres

const CHORDS = {
  origin: [50, 57, 62, 66], leaving: [45, 52, 57, 60], usa: [48, 55, 60, 64],
  ohio: [43, 50, 55, 58], california: [52, 59, 64, 68], dark: [38, 45, 50, 53], nc: [45, 52, 57, 61],
};
const DENSITY = { origin: 0.35, leaving: 0.3, usa: 0.6, ohio: 0.7, california: 0.75, dark: 0, nc: 0.6 };

/* chapter boundaries */
const starts = []; let total = 0;
CHAPTERS.forEach((c) => { starts.push(total); total += c.len; });
const chapterAt = (d) => { let i = 0; while (i < starts.length - 1 && d >= starts[i + 1]) i++; return i; };

class Pool {
  constructor(make) { this.make = make; this.free = []; }
  get() { const o = this.free.pop() || this.make(); o.visible = true; return o; }
  put(o) { o.visible = false; this.free.push(o); }
}

export function createDrive({ car, camera, tier, reduced, onEnd }) {
  const $ = (id) => document.getElementById(id);
  const ui = {
    chapter: $('hudChapter'), chSub: $('hudChSub'), chTitle: $('hudChTitle'), radio: $('hudRadio'),
    copilot: $('hudCopilot'), unlock: $('hudUnlock'), speed: $('hudSpeed'), frag: $('hudFrag'),
    progress: $('hudProgress'), ticks: $('hudTicks'), upgrades: $('hudUpgrades'), help: $('hudHelp'),
    zones: $('touchZones'), laneL: $('btnLaneL'), laneR: $('btnLaneR'),
  };
  ui.ticks.innerHTML = starts.slice(1).map((s) => `<li style="left:${(s / total) * 100}%"></li>`).join('');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b1a13');
  scene.fog = new THREE.Fog('#0a1410', 30, 230);
  const hemi = new THREE.HemisphereLight('#4a5a52', '#050505', 0.9); scene.add(hemi);
  const moon = new THREE.DirectionalLight('#c8d4e0', 0.8); moon.position.set(-20, 30, -10); scene.add(moon);
  const fill = new THREE.PointLight('#ffe7c4', 6, 16, 1.5); fill.position.set(0, 3, -4); scene.add(fill);

  /* ---- static world ---- */
  const rTex = roadTex(); rTex.repeat.set(1, 420 / TILE);
  const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, 420), new THREE.MeshLambertMaterial({ map: rTex }));
  roadMesh.rotation.x = -Math.PI / 2; roadMesh.position.set(0, 0, -200); scene.add(roadMesh);
  const shoulderMat = new THREE.MeshLambertMaterial({ color: '#141414' });
  [-1, 1].forEach((s) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 420), shoulderMat);
    m.rotation.x = -Math.PI / 2; m.position.set(s * (ROAD_W / 2 + 1.3), -0.005, -200); scene.add(m);
  });
  const groundMat = new THREE.MeshLambertMaterial({ color: '#07110c' });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.03, -300); scene.add(ground);

  // headlight throw
  const beamMat = new THREE.MeshBasicMaterial({ map: beamTex(), color: '#ffe2b8', transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending });
  const beamMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 46), beamMat);
  beamMesh.rotation.x = -Math.PI / 2; beamMesh.position.set(0, 0.02, -24); scene.add(beamMesh);

  /* ---- horizon silhouettes (unfogged, far away) ---- */
  const horizons = {};
  function horizon(name, build) { const g = new THREE.Group(); build(g); g.userData.k = 0; g.traverse((o) => { if (o.material) { o.material.transparent = true; o.material.opacity = 0; o.material.fog = false; o.material.depthWrite = false; } }); scene.add(g); horizons[name] = g; }
  horizon('mountain', (g) => {
    const mat = new THREE.MeshBasicMaterial({ color: '#13241c' });
    const snow = new THREE.MeshBasicMaterial({ color: '#4d5a54' });
    for (let i = 0; i < 9; i++) {
      const h = 70 + Math.random() * 110, w = 90 + Math.random() * 80, x = -380 + i * 95 + Math.random() * 30;
      const m = new THREE.Mesh(new THREE.ConeGeometry(w, h, 4, 1), mat); m.position.set(x, h / 2 - 8, -420 - Math.random() * 60); m.rotation.y = Math.random(); g.add(m);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(w * 0.26, h * 0.26, 4, 1), snow); cap.position.set(x, h - 8 - h * 0.13 + 0.5, m.position.z); cap.rotation.y = m.rotation.y; g.add(cap);
    }
  });
  horizon('ridge', (g) => {
    const mat = new THREE.MeshBasicMaterial({ color: '#2a1410' });
    for (let i = 0; i < 12; i++) { const h = 25 + Math.random() * 40, w = 80 + Math.random() * 60; const m = new THREE.Mesh(new THREE.ConeGeometry(w, h, 3, 1), mat); m.position.set(-420 + i * 75, h / 2 - 6, -430); g.add(m); }
    const sun = new THREE.Mesh(new THREE.CircleGeometry(38, 40), new THREE.MeshBasicMaterial({ color: '#7a2a18' })); sun.position.set(90, 18, -460); g.add(sun);
  });
  horizon('hills', (g) => {
    const mat = new THREE.MeshBasicMaterial({ color: '#2a2f36' });
    for (let i = 0; i < 10; i++) { const r = 60 + Math.random() * 50; const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat); m.scale.y = 0.35; m.position.set(-400 + i * 90, -6, -440); g.add(m); }
  });
  horizon('skyline', (g) => {
    const wt = windowTex(); wt.repeat.set(3, 4);
    const mat = new THREE.MeshBasicMaterial({ map: wt, color: '#9a9a90' });
    for (let i = 0; i < 26; i++) { const h = 30 + Math.random() * 90, w = 16 + Math.random() * 22; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(-300 + i * 24 + Math.random() * 10, h / 2 - 4, -440 + Math.random() * 20); g.add(m); }
  });
  const moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial([[0, 'rgba(240,236,226,1)'], [0.28, 'rgba(240,236,226,1)'], [0.32, 'rgba(240,236,226,.18)'], [1, 'rgba(240,236,226,0)']]), fog: false, transparent: true, opacity: 0, depthWrite: false }));
  moonSprite.scale.set(70, 70, 1); moonSprite.position.set(-140, 120, -470); scene.add(moonSprite);
  const HORIZON_FOR = { mountain: 'mountain', sparse: null, interstate: 'hills', winter: 'hills', palms: 'ridge', none: null, city: 'skyline' };

  /* ---- shared prop materials/geometries ---- */
  const lam = (c) => new THREE.MeshLambertMaterial({ color: c });
  const M = { pole: lam('#2a2a2a'), dark: lam('#0e0f0f'), pine: lam('#0c2117'), snowPine: lam('#8d969c'), trunk: lam('#1a120c'), palm: lam('#0b0807'), white: lam('#d8d4cc'), redPaint: lam('#a31c1b') };
  const warm = new THREE.MeshBasicMaterial({ color: '#ffd9a0' });
  const reflector = new THREE.MeshBasicMaterial({ color: '#d52320' });
  const poolTex = radial([[0, 'rgba(255,214,160,.55)'], [1, 'rgba(255,214,160,0)']]);
  const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const glowTex = radial([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
  const lampGlow = new THREE.SpriteMaterial({ map: glowTex, color: '#ffd9a0', transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending });
  const flagMats = ['#2c4a6a', '#d8d4cc', '#8a2220', '#2a5a3a', '#b08a2a'].map((c) => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
  const EDGE = ROAD_W / 2;

  const make = {
    lamp() {
      const g = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 7.4, 6), M.pole); pole.position.y = 3.7; g.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.08), M.pole); arm.position.set(-1.15, 7.3, 0); g.add(arm);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.32), warm); head.position.set(-2.2, 7.2, 0); g.add(head);
      const s = new THREE.Sprite(lampGlow); s.scale.set(3.2, 1.6, 1); s.position.set(-2.2, 7.1, 0); g.add(s);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), poolMat); p.rotation.x = -Math.PI / 2; p.position.set(-2.6, 0.03, 0); g.add(p);
      return g;
    },
    post() {
      const g = new THREE.Group();
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.1), M.white); p.position.y = 0.55; g.add(p);
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.18, 0.06), reflector); r.position.set(0, 0.9, 0.04); g.add(r);
      return g;
    },
    pine(snow) {
      const g = new THREE.Group(); const k = 0.8 + Math.random() * 0.8;
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4, 6), snow ? M.snowPine : M.pine); c1.position.y = 2.6; g.add(c1);
      const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3, 6), snow ? M.snowPine : M.pine); c2.position.y = 4.4; g.add(c2);
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1, 5), M.trunk); t.position.y = 0.5; g.add(t);
      g.scale.setScalar(k); return g;
    },
    flags() {
      const g = new THREE.Group();
      const span = 9, h = 4.5;
      [0, span].forEach((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, h, 5), M.pole); p.position.set(x, h / 2, 0); g.add(p); });
      for (let i = 1; i < 12; i++) {
        const t = i / 12, x = t * span, y = h - 0.3 - Math.sin(t * Math.PI) * 0.9;
        const f = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.5), flagMats[i % 5]); f.position.set(x, y - 0.25, 0); f.rotation.y = 0.3; g.add(f);
      }
      g.rotation.y = Math.PI / 2;
      return g;
    },
    palm() {
      const g = new THREE.Group(); const h = 8 + Math.random() * 5;
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, h, 5), M.palm); t.position.y = h / 2; g.add(t);
      for (let i = 0; i < 7; i++) {
        const f = new THREE.Mesh(new THREE.BoxGeometry(3, 0.05, 0.45), M.palm); f.geometry.translate(1.5, 0, 0);
        f.position.y = h; f.rotation.set(0, (i / 7) * Math.PI * 2, -0.45 - Math.random() * 0.2); g.add(f);
      }
      g.rotation.z = (Math.random() - 0.5) * 0.12; return g;
    },
    building() {
      const w = 8 + Math.random() * 10, h = 10 + Math.random() * 34, d = 10 + Math.random() * 8;
      const geo = new THREE.BoxGeometry(w, h, d); geo.translate(0, h / 2, 0);
      const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (w / 9), uv.getY(i) * (h / 9));
      return new THREE.Mesh(geo, buildingMat);
    },
  };
  const bt = windowTex(); const buildingMat = new THREE.MeshLambertMaterial({ map: bt, emissive: '#ffffff', emissiveMap: bt, emissiveIntensity: 0.6, color: '#2a2a2a' });

  const pools = {
    lamp: new Pool(make.lamp), post: new Pool(make.post), pine: new Pool(() => make.pine(false)), snowPine: new Pool(() => make.pine(true)),
    flags: new Pool(make.flags), palm: new Pool(make.palm), building: new Pool(make.building),
  };

  /* what lines the road in each kind of chapter: [pool, spacing m, side offset, chance] */
  const PROPS = {
    mountain: [['pine', 9, [7, 22], 0.9], ['flags', 140, [8.5, 8.5], 1], ['post', 30, [0.8, 0.8], 1]],
    sparse: [['post', 26, [0.8, 0.8], 1]],
    interstate: [['lamp', 42, [1.3, 1.3], 1], ['post', 30, [0.8, 0.8], 1]],
    winter: [['snowPine', 10, [6, 20], 0.9], ['lamp', 50, [1.3, 1.3], 1]],
    palms: [['palm', 22, [5, 14], 0.95], ['lamp', 60, [1.3, 1.3], 1]],
    none: [],
    city: [['building', 24, [18, 34], 0.8], ['lamp', 36, [1.3, 1.3], 1]],
  };

  /* ---- obstacles, fragments, signs ---- */
  const trafficMake = makeTrafficFactory();
  const coneGeo = new THREE.ConeGeometry(0.3, 0.8, 10); coneGeo.translate(0, 0.4, 0);
  const bandGeo = new THREE.CylinderGeometry(0.19, 0.24, 0.14, 10); bandGeo.translate(0, 0.42, 0);
  const stripe = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 32; const g = c.getContext('2d'); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#d8d4cc' : '#a31c1b'; g.beginPath(); g.moveTo(i * 20 - 16, 32); g.lineTo(i * 20, 0); g.lineTo(i * 20 + 20, 0); g.lineTo(i * 20 + 4, 32); g.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const barrierMat = new THREE.MeshLambertMaterial({ map: stripe });
  const markerTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.strokeStyle = '#d52320'; g.lineWidth = 6; g.beginPath(); g.moveTo(12, 18); g.lineTo(32, 46); g.lineTo(52, 18); g.stroke(); return new THREE.CanvasTexture(c); })();
  const markerMat = new THREE.SpriteMaterial({ map: markerTex, transparent: true, depthTest: false });

  const obstaclePools = {
    traffic: new Pool(() => withMarker(trafficMake(), 2.2)),
    cones: new Pool(() => { const g = new THREE.Group(); [-0.9, 0, 0.9].forEach((x) => { const c = new THREE.Mesh(coneGeo, M.redPaint); c.position.x = x; g.add(c); const b = new THREE.Mesh(bandGeo, M.white); b.position.x = x; g.add(b); }); return withMarker(g, 1.6); }),
    barrier: new Pool(() => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.55, 0.3), barrierMat); b.position.y = 0.75; g.add(b); [-1.1, 1.1].forEach((x) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.5), M.dark); l.position.set(x, 0.3, 0); g.add(l); }); return withMarker(g, 1.8); }),
  };
  function withMarker(g, y) { const s = new THREE.Sprite(markerMat); s.scale.set(1, 1, 1); s.position.y = y; s.visible = false; s.name = 'marker'; g.add(s); return g; }
  const OB = { traffic: { hw: 0.95, hl: 2.2 }, cones: { hw: 1.25, hl: 0.4 }, barrier: { hw: 1.45, hl: 0.3 } };

  const fragGeo = new THREE.OctahedronGeometry(0.26);
  const fragMat = new THREE.MeshBasicMaterial({ color: '#f1eee8' });
  const goldMat = new THREE.MeshBasicMaterial({ color: '#e6c27a' });
  const fragGlow = new THREE.SpriteMaterial({ map: glowTex, color: '#f1eee8', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  const goldGlow = new THREE.SpriteMaterial({ map: glowTex, color: '#e6c27a', transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
  const fragPool = new Pool(() => { const g = new THREE.Group(); const m = new THREE.Mesh(fragGeo, fragMat); m.name = 'gem'; g.add(m); const s = new THREE.Sprite(fragGlow); s.scale.set(1.4, 1.4, 1); g.add(s); return g; });

  function gantry({ title, sub, note, kind }) {
    const g = new THREE.Group();
    const big = kind === 'gate';
    const w = big ? 9 : 7, h = big ? 3.4 : 2.6, y = big ? 6.4 : 6;
    [-1, 1].forEach((s) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.3, y + h / 2, 0.3), M.pole); p.position.set(s * (EDGE + 0.9), (y + h / 2) / 2, 0); g.add(p); });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W + 2.4, 0.25, 0.25), M.pole); beam.position.y = y - h / 2 - 0.1; g.add(beam);
    const tex = signTex({ title, sub, note, kind });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, fog: true }));
    face.position.y = y; face.position.z = 0.16; g.add(face);
    const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.3), M.dark); back.position.y = y; g.add(back);
    if (big) { const lights = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.6), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); lights.position.set(0, y - h / 2 - 0.4, 0.3); g.add(lights); }
    g.userData.dispose = () => { tex.dispose(); face.material.dispose(); face.geometry.dispose(); };
    return g;
  }

  /* ---- snow ---- */
  const snowN = tier.snow;
  const snowGeo = new THREE.BufferGeometry();
  const snowPos = new Float32Array(snowN * 3);
  for (let i = 0; i < snowN; i++) { snowPos[i * 3] = (Math.random() - 0.5) * 50; snowPos[i * 3 + 1] = Math.random() * 14; snowPos[i * 3 + 2] = -Math.random() * 70 + 6; }
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const snowMat = new THREE.PointsMaterial({ color: '#e8e8e8', size: 0.09, transparent: true, opacity: 0, depthWrite: false });
  const snow = new THREE.Points(snowGeo, snowMat); snow.frustumCulled = false; scene.add(snow);

  /* ---- upgrade visuals ---- */
  const scanRing = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 64, 1), new THREE.MeshBasicMaterial({ color: '#d52320', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  scanRing.rotation.x = -Math.PI / 2; scanRing.position.y = 0.05; scene.add(scanRing);
  const TRAIL_N = 40;
  const trailGeo = new THREE.BufferGeometry();
  const trailPos = new Float32Array(TRAIL_N * 2 * 3), trailCol = new Float32Array(TRAIL_N * 2 * 3);
  const trailIdx = []; for (let i = 0; i < TRAIL_N - 1; i++) { const a = i * 2; trailIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  trailGeo.setIndex(trailIdx);
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setAttribute('color', new THREE.BufferAttribute(trailCol, 3));
  const trail = new THREE.Mesh(trailGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  trail.frustumCulled = false; trail.visible = false; scene.add(trail);
  const trailHist = new Array(TRAIL_N).fill(0);

  /* ---- state ---- */
  let S;
  const items = [];   // everything that scrolls
  function reset() {
    items.splice(0).forEach(removeItem);
    S = {
      dist: 0, speed: 0, lane: 0, x: 0, steer: 0, accel: false, brake: false, bumpT: 0, shake: 0,
      chapter: -1, frags: 0, secrets: 0, ended: false, endT: 0, time: 0,
      nextProp: {}, nextObs: 140, nextFrag: 60, rows: [], reserved: [], schedule: buildSchedule(),
      ups: new Set(), copT: 0, scanT: 0, scanZ: 999, trailAcc: 0, reveal: 1, helpT: 0, laneChanged: false,
      env: { bg: new THREE.Color(), fog: new THREE.Color(), near: 30, far: 230, ground: new THREE.Color(), light: 1, beam: 0.4, heads: 1 },
      envT: null, radioQ: [], radioT: 0, radioBusy: false,
    };
    ui.upgrades.innerHTML = ''; ui.copilot.hidden = true; ui.frag.textContent = '0'; ui.unlock.innerHTML = '';
    trail.visible = false; trailHist.fill(0);
    setEnv(0, true);
  }

  /** Scripted events, by absolute distance. */
  function buildSchedule() {
    const ev = [];
    CHAPTERS.forEach((c, i) => {
      const st = starts[i];
      if (c.title) ev.push({ at: Math.max(st, 45), type: 'gantry', sign: { title: c.title, sub: c.sub, kind: 'chapter' } });
      c.lines.forEach(([f, text]) => ev.push({ at: st + f * c.len, type: 'line', text, big: !!c.dark }));
      (c.gates || []).forEach(([f, pid]) => {
        const p = PROJECTS.find((x) => x.id === pid);
        ev.push({ at: st + f * c.len, type: 'gate', pid, sign: { title: p.name, sub: p.kind, note: p.unlock ? `Unlock: ${p.unlock.title}` : '', kind: 'gate' } });
      });
      if (!c.dark) ev.push({ at: st + c.len * (i === 6 ? 0.94 : 0.52), type: 'secret' });
      if (c.dark) ev.push({ at: st + c.len * 0.78, type: 'reveal' });
    });
    quietAt = ev.filter((e) => e.type !== 'line' && e.type !== 'secret').map((e) => e.at);
    return ev.sort((a, b) => a.at - b.at);
  }

  /* ---- spawning ---- */
  function addItem(obj, z, data) {
    obj.position.z = z; scene.add(obj);
    const it = { obj, ...data }; items.push(it); return it;
  }
  function removeItem(it) {
    scene.remove(it.obj);
    if (it.pool) it.pool.put(it.obj); else it.obj.userData.dispose?.();
    if (it.marker) it.marker.visible = false;
  }
  let quietAt = [];
  const quiet = (abs) => quietAt.some((a) => Math.abs(a - abs) < 30) || abs > total - 140;
  const reservedLanes = (abs) => new Set(S.reserved.filter((r) => abs > r.from - 12 && abs < r.to + 12).map((r) => r.lane));

  function spawnProps() {
    const abs = S.dist + SPAWN;
    const kind = CHAPTERS[chapterAt(abs)].env.props;
    (PROPS[kind] || []).forEach(([name, spacing, [o1, o2], chance]) => {
      const key = kind + name;
      if (S.nextProp[key] == null) S.nextProp[key] = S.dist + Math.random() * spacing;
      while (S.dist >= S.nextProp[key]) {
        S.nextProp[key] += spacing / Math.max(0.35, tier.props);
        [-1, 1].forEach((side) => {
          if (Math.random() > chance) return;
          if (name === 'flags' && side < 0) return;
          const pool = pools[name], o = pool.get();
          const off = EDGE + o1 + Math.random() * (o2 - o1);
          o.position.x = side * off;
          if (name === 'lamp') o.rotation.y = side > 0 ? 0 : Math.PI;
          else if (name === 'building' || name === 'flags') { /* keep */ }
          else o.rotation.y = Math.random() * 6;
          addItem(o, -SPAWN - Math.random() * 4, { kind: 'prop', pool });
        });
      }
    });
    Object.keys(S.nextProp).forEach((k) => { if (!k.startsWith(kind)) delete S.nextProp[k]; });
  }

  function spawnObstacles() {
    if (S.dist < S.nextObs) return;
    const abs = S.dist + SPAWN;
    const ch = CHAPTERS[chapterAt(abs)];
    const dens = DENSITY[ch.id] ?? 0.5;
    S.nextObs = S.dist + (55 + Math.random() * 60) / Math.max(dens, 0.15) * 0.55;
    if (!dens || quiet(abs) || S.ended) return;
    const nBlock = Math.random() < dens * 0.45 ? 2 : 1;
    const res = reservedLanes(abs);
    const lanes = [-1, 0, 1].filter((l) => !res.has(l)).sort(() => Math.random() - 0.5).slice(0, nBlock);
    if (!lanes.length) return;
    lanes.forEach((lane) => {
      const r = Math.random();
      const type = ch.id === 'origin' ? (r < 0.6 ? 'cones' : 'traffic') : r < 0.55 ? 'traffic' : r < 0.8 ? 'cones' : 'barrier';
      const pool = obstaclePools[type], o = pool.get();
      o.position.x = lane * LANE; o.rotation.set(0, 0, 0);
      const own = type === 'traffic' ? 13 + Math.random() * 6 : 0;
      addItem(o, -SPAWN, { kind: 'obs', type, pool, lane, own, ...OB[type], marker: o.getObjectByName('marker'), hit: false, markT: 0 });
    });
    S.rows.push({ abs, lanes });
    S.rows = S.rows.filter((r) => r.abs > S.dist - 20);
  }

  function spawnFragments() {
    if (S.dist < S.nextFrag) return;
    const abs = S.dist + SPAWN;
    S.nextFrag = S.dist + 70 + Math.random() * 50;
    const ch = CHAPTERS[chapterAt(abs)];
    if (ch.dark || S.ended || abs > total - 60) return;
    const n = 4 + ((Math.random() * 3) | 0);
    const blocked = new Set(S.rows.filter((r) => Math.abs(r.abs - abs) < n * 6 + 25).flatMap((r) => r.lanes));
    const free = [-1, 0, 1].filter((l) => !blocked.has(l));
    if (!free.length) return;
    const lane = free[(Math.random() * free.length) | 0];
    S.reserved.push({ from: abs, to: abs + n * 6, lane });
    S.reserved = S.reserved.filter((r) => r.to > S.dist - 20);
    for (let i = 0; i < n; i++) {
      const o = fragPool.get(); o.position.set(lane * LANE, 1, 0);
      const gem = o.getObjectByName('gem'); gem.material = fragMat; o.children[1].material = fragGlow;
      addItem(o, -SPAWN - i * 6, { kind: 'frag', pool: fragPool, lane });
    }
  }

  function runSchedule() {
    const ev = S.schedule;
    while (ev.length && S.dist >= ev[0].at - (ev[0].type === 'line' || ev[0].type === 'reveal' ? 0 : SPAWN)) {
      const e = ev.shift();
      if (e.type === 'line') queueRadio(e.text, e.big);
      else if (e.type === 'reveal') S.reveal = 0.001;
      else if (e.type === 'gantry') addItem(gantry(e.sign), -(e.at - S.dist), { kind: 'sign' });
      else if (e.type === 'gate') addItem(gantry(e.sign), -(e.at - S.dist), { kind: 'gate', pid: e.pid, passed: false });
      else if (e.type === 'secret') {
        const used = new Set(S.rows.filter((r) => Math.abs(r.abs - e.at) < 30).flatMap((r) => r.lanes));
        const free = [-1, 0, 1].filter((l) => !used.has(l)); const lane = free.length ? free[(Math.random() * free.length) | 0] : 0;
        const o = fragPool.get(); o.position.set(lane * LANE, 1.2, 0);
        o.getObjectByName('gem').material = goldMat; o.children[1].material = goldGlow;
        addItem(o, -(e.at - S.dist), { kind: 'frag', gold: true, pool: fragPool, lane });
        S.reserved.push({ from: e.at, to: e.at, lane });
      }
    }
  }

  /* ---- chapters & environment ---- */
  function setEnv(i, instant = false) {
    const c = CHAPTERS[i], e = c.env;
    S.envT = { bg: new THREE.Color(e.sky), fog: new THREE.Color(e.fog), near: e.fogNear, far: e.fogFar, ground: new THREE.Color(e.ground), light: e.light, beam: c.dark ? 0 : 0.42, heads: c.dark ? 0.06 : 1 };
    if (instant) { S.env.bg.copy(S.envT.bg); S.env.fog.copy(S.envT.fog); S.env.near = S.envT.near; S.env.far = S.envT.far; S.env.ground.copy(S.envT.ground); S.env.light = e.light; S.env.beam = S.envT.beam; S.env.heads = S.envT.heads; }
    const hz = HORIZON_FOR[e.props];
    Object.entries(horizons).forEach(([k, g]) => (g.userData.target = k === hz ? 1 : 0));
    moonSprite.userData.target = ['usa', 'ohio', 'nc', 'origin'].includes(c.id) ? 1 : 0;
    snowMat.userData.target = e.snow ? 0.85 : 0;
  }

  function enterChapter(i) {
    S.chapter = i;
    const c = CHAPTERS[i];
    setEnv(i);
    audio.chord(CHORDS[c.id]);
    audio.musicLevel(c.dark ? 0 : 1, c.dark ? 3 : 2);
    if (c.dark) S.reveal = 0;
    if (c.title) {
      ui.chSub.textContent = c.sub; ui.chTitle.textContent = c.title;
      ui.chapter.classList.add('show'); audio.sfx('checkpoint');
      clearTimeout(enterChapter.t); enterChapter.t = setTimeout(() => ui.chapter.classList.remove('show'), 3600);
    }
  }

  /* ---- radio lines ---- */
  function queueRadio(text, big = false) { S.radioQ.push({ text, big }); }
  function pumpRadio(dt) {
    S.radioT -= dt;
    if (S.radioT > 0) return;
    if (S.radioBusy) { ui.radio.classList.remove('show'); S.radioBusy = false; S.radioT = 0.7; return; }
    const next = S.radioQ.shift(); if (!next) return;
    ui.radio.textContent = next.text; ui.radio.classList.toggle('big', next.big);
    requestAnimationFrame(() => ui.radio.classList.add('show'));
    S.radioBusy = true;
    S.radioT = Math.max(2.4, Math.min(4.2, 1.6 + next.text.length * 0.045)) - (S.radioQ.length ? 0.6 : 0);
  }

  /* ---- unlocks ---- */
  function unlock(pid) {
    const p = PROJECTS.find((x) => x.id === pid); if (!p || !p.unlock) return;
    const u = p.unlock;
    unlocks.add(u.id);
    applyUpgrade(u.id);
    audio.sfx('unlock');
    const card = document.createElement('div'); card.className = 'unlock-card';
    card.innerHTML = `<p class="unlock-k">Unlocked</p><p class="unlock-p"></p><p class="unlock-u"></p>`;
    card.querySelector('.unlock-p').textContent = `${p.name} → ${u.title}`;
    card.querySelector('.unlock-u').textContent = u.text;
    ui.unlock.replaceChildren(card);
    setTimeout(() => { card.classList.add('out'); setTimeout(() => card.remove(), 520); }, 4200);
  }
  function applyUpgrade(id) {
    if (S.ups.has(id)) return; S.ups.add(id);
    const label = { tune: 'Tune', magnet: 'Lane assist', copilot: 'ARIA co-driver', scan: 'AIR scan', trail: 'Witness trail', 'paint-himalaya': 'New paint' }[id];
    if (label) { const s = document.createElement('span'); s.textContent = label; ui.upgrades.append(s); }
    if (id === 'copilot') ui.copilot.hidden = false;
    if (id === 'trail') { trail.visible = true; trailHist.fill(S.x); }
  }

  /* ---- input ---- */
  function changeLane(d) {
    if (S.ended && S.endT > 6) return;
    const n = Math.max(-1, Math.min(1, S.lane + d));
    if (n !== S.lane) { S.lane = n; S.laneChanged = true; }
  }
  const keys = (e, down) => {
    if (!active) return;
    const k = e.key.toLowerCase();
    if (down && (k === 'arrowleft' || k === 'a')) { changeLane(-1); e.preventDefault(); }
    else if (down && (k === 'arrowright' || k === 'd')) { changeLane(1); e.preventDefault(); }
    else if (k === 'arrowup' || k === 'w') { S.accel = down; e.preventDefault(); }
    else if (k === 'arrowdown' || k === 's') { S.brake = down; e.preventDefault(); }
  };
  const kd = (e) => { if (e.repeat && /^(arrowleft|arrowright|a|d)$/.test(e.key.toLowerCase())) return; keys(e, true); };
  const ku = (e) => keys(e, false);
  addEventListener('keydown', kd); addEventListener('keyup', ku);

  let px = null;
  ui.zones.addEventListener('pointerdown', (e) => { px = e.clientX; });
  ui.zones.addEventListener('pointerup', (e) => {
    if (px == null || !active) return;
    const dx = e.clientX - px; px = null;
    if (Math.abs(dx) > 28) changeLane(Math.sign(dx));
    else changeLane(e.clientX < innerWidth / 2 ? -1 : 1);
  });
  ui.laneL.addEventListener('click', () => changeLane(-1));
  ui.laneR.addEventListener('click', () => changeLane(1));

  /* ---- per-frame ---- */
  let active = false;
  const tmpC = new THREE.Color();

  function update(dt) {
    dt = Math.min(dt, 0.05);
    S.time += dt;
    const tune = S.ups.has('tune');
    const cruise = S.ended ? 17 : (CHAPTERS[Math.max(0, S.chapter)]?.dark ? 24 : tune ? 31 : 28);
    const boost = tune ? 47 : 40;
    let target = S.brake ? 9 : S.accel ? boost : cruise;
    if (S.bumpT > 0) { S.bumpT -= dt; target = Math.min(target, 12); }
    const rate = target < S.speed ? (S.brake ? 26 : 10) : (S.speed < 10 ? 14 : 7);
    S.speed += Math.sign(target - S.speed) * Math.min(Math.abs(target - S.speed), rate * dt);
    S.dist += S.speed * dt;

    // steering: critically damped follow of the lane
    const tx = S.lane * LANE;
    const prevX = S.x;
    S.x += (tx - S.x) * Math.min(1, dt * 7.5);
    S.steer = Math.max(-1, Math.min(1, (S.x - prevX) / Math.max(dt, 1e-3) / 14));
    car.group.position.x = S.x;
    car.group.rotation.y = -S.steer * 0.12;
    car.setBrake(S.brake || S.bumpT > 0 ? 1 : 0);
    car.update(dt, S.speed, S.steer);

    // chapters
    const ci = chapterAt(S.dist);
    if (ci !== S.chapter && !S.ended) enterChapter(ci);
    if (!S.ended && S.dist >= total) end();

    runSchedule(); spawnProps(); spawnObstacles(); spawnFragments();

    // scroll + interact
    const half = 0.9;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.obj.position.z += (S.speed - (it.own || 0)) * dt;
      const z = it.obj.position.z;
      if (it.kind === 'obs') {
        if (it.markT > 0) { it.markT -= dt; it.marker.visible = it.markT > 0; it.marker.position.y = (it.type === 'traffic' ? 2.2 : 1.6) + Math.sin(S.time * 6) * 0.08; }
        if (!it.hit && Math.abs(z) < it.hl + 2.1 && Math.abs(it.obj.position.x - S.x) < it.hw + half) {
          it.hit = true; S.bumpT = 0.9; S.speed *= 0.4; S.shake = 1; audio.sfx('bump');
          if (it.type !== 'traffic') it.fly = 1;
          else it.own = S.speed + 6; // the other car pulls away
        }
        if (it.fly) { it.obj.position.y += dt * 4; it.obj.rotation.x -= dt * 5; it.obj.position.x += Math.sign(it.obj.position.x - S.x || 1) * dt * 6; }
      } else if (it.kind === 'frag') {
        const gem = it.obj.children[0]; gem.rotation.y += dt * 2.4; gem.rotation.x += dt * 0.7;
        it.obj.position.y = (it.gold ? 1.2 : 1) + Math.sin(S.time * 3 + z * 0.2) * 0.12;
        if (S.ups.has('magnet') && z > -16 && z < 1 && Math.abs(it.obj.position.x - S.x) < LANE * 1.3) it.obj.position.x += (S.x - it.obj.position.x) * Math.min(1, dt * 5);
        if (Math.abs(z) < 2.2 && Math.abs(it.obj.position.x - S.x) < 1.4) {
          if (it.gold) { S.secrets++; queueRadio(SECRETS[(S.secrets - 1) % SECRETS.length]); S.radioQ.unshift(S.radioQ.pop()); audio.sfx('secret'); }
          else audio.sfx('collect');
          S.frags++; ui.frag.textContent = S.frags;
          removeItem(it); items.splice(i, 1); continue;
        }
      } else if (it.kind === 'gate' && !it.passed && z > -1) { it.passed = true; unlock(it.pid); }
      if (z > KILL || it.obj.position.y > 30) { removeItem(it); items.splice(i, 1); }
    }

    // road scroll
    rTex.offset.y = (rTex.offset.y + (S.speed * dt) / TILE) % 1;

    // environment easing
    const e = S.env, t = S.envT, k = Math.min(1, dt * 0.7);
    e.bg.lerp(t.bg, k); e.fog.lerp(t.fog, k); e.ground.lerp(t.ground, k);
    e.near += (t.near - e.near) * k; e.far += (t.far - e.far) * k; e.light += (t.light - e.light) * k;
    // dark stretch: headlights come back slowly after "Keep going."
    let beamT = t.beam, headT = t.heads, farT = e.far;
    if (CHAPTERS[Math.max(0, S.chapter)]?.dark && S.reveal > 0) {
      S.reveal = Math.min(1, S.reveal + dt * 0.28);
      beamT = 0.55 * S.reveal; headT = 0.06 + 0.94 * S.reveal; farT = 40 + 90 * S.reveal * S.reveal;
    }
    if (S.ended) { const f = Math.min(1, S.endT / 8); e.bg.lerp(tmpC.set('#000000'), f * dt); e.fog.lerp(tmpC.set('#000000'), f * dt * 2); farT = 260 - 200 * f; }
    e.beam += (beamT - e.beam) * Math.min(1, dt * 1.5); e.heads += (headT - e.heads) * Math.min(1, dt * 1.5);
    scene.background.copy(e.bg); scene.fog.color.copy(e.fog); scene.fog.near = e.near; scene.fog.far = farT;
    groundMat.color.copy(e.ground); hemi.intensity = e.light * 0.9; moon.intensity = e.light * 0.6;
    fill.intensity = 6 * e.heads;
    beamMesh.position.x = S.x; beamMat.opacity = e.beam;
    car.setLights(e.heads);
    Object.values(horizons).forEach((g) => { g.userData.k += ((g.userData.target || 0) - g.userData.k) * k; const o = g.userData.k; g.visible = o > 0.01; g.traverse((m) => m.material && (m.material.opacity = o)); });
    moonSprite.material.opacity += ((moonSprite.userData.target || 0) * 0.9 - moonSprite.material.opacity) * k;

    // snow
    snowMat.opacity += ((snowMat.userData.target || 0) - snowMat.opacity) * k;
    snow.visible = snowMat.opacity > 0.01;
    if (snow.visible) {
      const p = snowGeo.attributes.position, a = p.array;
      for (let i = 0; i < snowN; i++) {
        a[i * 3 + 1] -= dt * 2.2; a[i * 3 + 2] += S.speed * dt * 0.9; a[i * 3] += Math.sin(S.time + i) * dt * 0.3;
        if (a[i * 3 + 1] < 0 || a[i * 3 + 2] > 8) { a[i * 3 + 1] = 6 + Math.random() * 8; a[i * 3 + 2] = -60 - Math.random() * 10; }
      }
      p.needsUpdate = true;
    }

    // upgrades
    if (S.ups.has('copilot')) { S.copT -= dt; if (S.copT <= 0) { S.copT = 0.6; copilot(); } }
    if (S.ups.has('scan')) {
      S.scanT -= dt;
      if (S.scanT <= 0) { S.scanT = 3.2; S.scanZ = -2; }
      if (S.scanZ > -140) {
        S.scanZ -= dt * 95;
        const r = 3 + -S.scanZ * 0.12;
        scanRing.position.set(S.x, 0.05, S.scanZ); scanRing.scale.set(r * 2, r * 2, 1);
        scanRing.material.opacity = 0.7 * (1 + S.scanZ / 140);
        items.forEach((it) => { if (it.kind === 'obs' && !it.hit && Math.abs(it.obj.position.z - S.scanZ) < 4) it.markT = 2.4; });
      } else scanRing.material.opacity = 0;
    }
    if (trail.visible) updateTrail(dt);

    // HUD
    ui.speed.textContent = Math.round(S.speed * 2.237);
    ui.progress.style.width = `${Math.min(100, (S.dist / total) * 100)}%`;
    pumpRadio(dt);
    S.helpT += dt;
    if (!ui.help.classList.contains('gone') && (S.helpT > 9 || (S.laneChanged && S.helpT > 2.5))) ui.help.classList.add('gone');

    // audio
    audio.setEngine(Math.min(1, S.speed / 47), !S.ended || S.endT < 6);

    // camera
    const sk = reduced ? 0 : S.shake;
    S.shake = Math.max(0, S.shake - dt * 2.2);
    const endLift = S.ended ? Math.min(1, S.endT / 10) : 0;
    camera.position.set(S.x * 0.55 + (Math.random() - 0.5) * sk * 0.3, 2.5 + endLift * 1.5 + (Math.random() - 0.5) * sk * 0.2, 7 + endLift * 3);
    camera.lookAt(S.x * 0.75, 1 + endLift * 0.6, -12);
    if (!reduced) { const f = 55 + Math.max(0, (S.speed - 20) / 27) * 9; if (Math.abs(camera.fov - f) > 0.05) { camera.fov += (f - camera.fov) * Math.min(1, dt * 2); camera.updateProjectionMatrix(); } }

    if (S.ended) { S.endT += dt; S.radioQ.length = 0; if (S.endT > 1.5) ui.radio.classList.remove('show'); trail.visible = false; endSequence(); }
  }

  function copilot() {
    const ahead = items.filter((it) => it.kind === 'obs' && !it.hit && it.obj.position.z < -8 && it.obj.position.z > -95);
    const inLane = (l) => ahead.filter((it) => it.lane === l).sort((a, b) => b.obj.position.z - a.obj.position.z)[0];
    const mine = inLane(S.lane);
    let msg = 'Road ahead is clear.';
    if (mine) {
      const what = mine.type === 'traffic' ? 'Slow car' : mine.type === 'cones' ? 'Cones' : 'Barrier';
      const m = Math.round(-mine.obj.position.z);
      const opts = [S.lane - 1, S.lane + 1].filter((l) => l >= -1 && l <= 1 && !inLane(l));
      const side = opts.length ? (opts[0] < S.lane ? 'Left' : 'Right') + ' lane is clear.' : 'Brake.';
      msg = `${what} in ${m} m. ${side}`;
    }
    ui.copilot.innerHTML = '<b>ARIA</b>'; ui.copilot.append(msg);
  }

  function updateTrail(dt) {
    S.trailAcc += S.speed * dt;
    while (S.trailAcc > 1.2) { S.trailAcc -= 1.2; trailHist.pop(); trailHist.unshift(S.x); }
    const sub = S.trailAcc / 1.2;
    for (let i = 0; i < TRAIL_N; i++) {
      const z = 2.3 + (i + sub) * 1.2, x = trailHist[i], w = 0.05 * (1 - i / TRAIL_N);
      trailPos.set([x - w, 0.04, z, x + w, 0.04, z], i * 6);
      const c = Math.pow(1 - i / TRAIL_N, 2.5) * 0.55;
      trailCol.set([c * 0.83, c * 0.14, c * 0.12, c * 0.83, c * 0.14, c * 0.12], i * 6);
    }
    trailGeo.attributes.position.needsUpdate = true; trailGeo.attributes.color.needsUpdate = true;
  }

  /* ---- the end of the road ---- */
  const endUI = { root: $('ending'), age: $('endAge'), stats: $('endStats') };
  function end() {
    S.ended = true; S.endT = 0; S.lane = Math.max(-1, Math.min(1, S.lane));
    unlocks.add('paint-ember');
    audio.musicLevel(0.6, 4); audio.chord([45, 52, 57, 64], 6);
    ui.radio.classList.remove('show'); S.radioQ.length = 0;
  }
  let endStep = 0;
  function endSequence() {
    const steps = [2.5, 4.3, 6.2, 8, 9.4, 10.6];
    if (endStep === 0 && S.endT > 2) {
      endUI.root.hidden = false;
      document.getElementById('hud').classList.add('ending');
      ['.hud-dash', '.hud-upgrades', '.hud-copilot', '.hud-buttons', '.touch-zones'].forEach((q) => { const n = document.querySelector(q); if (n) n.style.opacity = '0'; });
      endUI.age.textContent = `Age ${currentAge()}`;
      const sec = S.secrets ? ` and ${S.secrets} of ${SECRETS.length} hidden lines` : '';
      endUI.stats.textContent = `${S.frags} fragments collected${sec}.`;
      endStep = 1;
    }
    const lines = [...endUI.root.querySelectorAll('.end-line')];
    while (endStep >= 1 && endStep <= lines.length && S.endT > steps[Math.min(endStep - 1, steps.length - 1)]) {
      lines[endStep - 1].classList.add('show'); endStep++;
      if (endStep > lines.length) onEnd?.();
    }
  }

  function enter() {
    active = true;
    reset(); endStep = 0;
    endUI.root.hidden = true;
    endUI.root.querySelectorAll('.end-line').forEach((l) => l.classList.remove('show'));
    document.getElementById('hud').classList.remove('ending');
    ['.hud-dash', '.hud-upgrades', '.hud-copilot', '.hud-buttons', '.touch-zones'].forEach((q) => { const n = document.querySelector(q); if (n) n.style.opacity = ''; });
    ui.help.classList.remove('gone');
    scene.add(car.group);
    car.group.position.set(0, 0, 0); car.group.rotation.set(0, 0, 0);
    car.setEnvIntensity(0.55);
    camera.clearViewOffset(); camera.fov = 55; camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    // upgrades already earned in earlier runs stay earned
    PROJECTS.forEach((p) => { if (p.unlock && unlocks.has(p.unlock.id) && p.unlock.id !== 'paint-himalaya') applyUpgrade(p.unlock.id); });
    S.speed = 8;
    audio.setEngine(0.2, true);
  }
  function leave() { active = false; S.accel = S.brake = false; audio.setEngine(0, false); audio.musicLevel(1); ui.chapter.classList.remove('show'); ui.radio.classList.remove('show'); }

  reset();
  return { scene, update, enter, leave, resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }, get state() { return S; }, total };
}
