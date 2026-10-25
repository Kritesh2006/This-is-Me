/* street.js — the walk. A long wet street, buildings on both sides, red neon,
   rain, and a white light at the end. He walks away from the camera into it.
   The same street becomes snowy Ohio, then glitches into California. */
import { Reflector } from '../../../vendor/Reflector.js';
import { rng, lerp, tween, holdInput, holdPad, hexMix, ease } from '../util.js';

const PALETTES = {
  usa: { bg: '#0B0B0C', fog: '#18181A', density: 0.034, facade: '#1C1C1E', win: ['#3A3A3C', '#D9D4C8', '#C8261F'], neon: '#E0281F', lamp: '#E8E6E0', end: '#FFFFFF', weather: 'rain' },
  ohio: { bg: '#0D1218', fog: '#1C2430', density: 0.03, facade: '#1D232B', win: ['#2E3540', '#F2C987', '#E8E2D2'], neon: '#E8E2D2', lamp: '#F2DDB0', end: '#DDE6F0', weather: 'snow' },
  cali: { bg: '#2A1416', fog: '#B5603F', density: 0.028, facade: '#2A1A1A', win: ['#3A2422', '#FFC27A', '#FF6A3D'], neon: '#FF5A36', lamp: '#FFD9A0', end: '#FFD9A0', weather: 'none' },
};

function windowsTex(F, pal, seed) {
  const r = rng(seed);
  return F.canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let y = 18; y < h - 20; y += 34) for (let x = 14; x < w - 20; x += 40) {
      const v = r();
      g.fillStyle = v < 0.88 ? pal.win[0] : v < 0.975 ? pal.win[1] : pal.win[2];
      g.globalAlpha = v < 0.88 ? 0.2 : 0.9;
      g.fillRect(x, y, 22, 20);
    }
    g.globalAlpha = 1;
  });
}

function neonTex(F, text, color) {
  return F.canvasTex(512, 128, (g, w, h) => {
    g.font = '700 64px Archivo, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = color; g.shadowBlur = 24; g.fillStyle = color;
    g.fillText(text, w / 2, h / 2); g.shadowBlur = 8; g.fillStyle = '#fff'; g.globalAlpha = 0.65; g.fillText(text, w / 2, h / 2);
  });
}

export function buildStreet(F, { length = 60, palette = 'usa', signs = [], seed = 7 } = {}) {
  const { THREE } = F;
  const pal = PALETTES[palette];
  const scene = F.newScene({ fog: pal.fog, density: pal.density, bg: pal.bg, fov: 42 });
  const r = rng(seed);
  const hemi = new THREE.HemisphereLight(0x9A9AA6, 0x050505, 0.35); scene.add(hemi);
  const mats = [];
  // wet street: a real-time mirror under a thin layer of uneven wetness
  const ground = new Reflector(new THREE.PlaneGeometry(16, length + 80), {
    textureWidth: Math.round(F.W * (F.small ? 0.5 : 0.75)), textureHeight: Math.round(F.H * (F.small ? 0.5 : 0.75)), color: 0x6A6A6A,
  });
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -length / 2 + 10);
  scene.add(ground);
  const wetTex = F.canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = 'rgba(8,8,9,0.55)'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      const x = Math.random() * w, y = Math.random() * h, rad = 10 + Math.random() * 60;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(8,8,9,0.85)'); gr.addColorStop(1, 'rgba(8,8,9,0)');
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  });
  wetTex.wrapS = wetTex.wrapT = THREE.RepeatWrapping; wetTex.repeat.set(2, (length + 80) / 8);
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(16, length + 80), new THREE.MeshBasicMaterial({ map: wetTex, transparent: true, depthWrite: false }));
  wet.rotation.x = -Math.PI / 2; wet.position.set(0, 0.01, ground.position.z); scene.add(wet);
  // sidewalks + curbs
  const walkMat = new THREE.MeshStandardMaterial({ color: 0x1E1E20, roughness: 0.6, metalness: 0.2 });
  for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.16, length + 80), walkMat); sw.position.set(s * 4.9, 0.08, ground.position.z); scene.add(sw); }
  // buildings
  const facade = new THREE.MeshStandardMaterial({ color: pal.facade, roughness: 0.9 });
  mats.push({ m: facade, k: 'facade' });
  const texes = [windowsTex(F, pal, 1), windowsTex(F, pal, 2), windowsTex(F, pal, 3)];
  texes.forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; });
  const winMats = texes.map((t) => { const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true }); return m; });
  const buildings = [];
  for (const s of [-1, 1]) {
    let z = 12;
    while (z > -length - 40) {
      const w = 5 + r() * 6, h = 8 + r() * 26, d = 6 + r() * 4;
      const b = new THREE.Mesh(new THREE.BoxGeometry(d, h, w), facade);
      b.position.set(s * (6 + d / 2), h / 2, z - w / 2);
      scene.add(b);
      const fg = new THREE.PlaneGeometry(w * 0.92, h * 0.9);
      const uv = fg.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * w / 3, uv.getY(k) * h / 5);
      const face = new THREE.Mesh(fg, winMats[Math.floor(r() * 3)]);
      face.position.set(s * 5.98, h * 0.5, z - w / 2);
      face.rotation.y = -s * Math.PI / 2;
      scene.add(face);
      buildings.push(b, face);
      // roll-up shutters at street level, like the reference
      if (r() < 0.5) { const sh = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.5, 2.4), new THREE.MeshStandardMaterial({ color: 0x2A2A2C, roughness: 0.5, metalness: 0.4 })); sh.position.set(s * 5.97, 1.2, z - w * 0.4); sh.rotation.y = -s * Math.PI / 2; scene.add(sh); }
      z -= w + 0.4;
    }
  }
  // the red-lit shop window, front left
  const shopMat = new THREE.MeshBasicMaterial({ color: pal.neon, fog: true });
  mats.push({ m: shopMat, k: 'neon' });
  const shop = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.6), shopMat);
  shop.position.set(-5.96, 1.7, 3); shop.rotation.y = Math.PI / 2; scene.add(shop);
  const shopLight = new THREE.PointLight(pal.neon, 18, 9, 1.5); shopLight.position.set(-4.6, 1.8, 3); scene.add(shopLight);
  // a plant silhouette in the window
  const plant = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4), new THREE.MeshBasicMaterial({ map: F.canvasTex(128, 180, (g) => { g.fillStyle = '#000'; for (let i = 0; i < 9; i++) { g.save(); g.translate(64, 170); g.rotate(-1 + i * 0.25); g.beginPath(); g.ellipse(0, -60, 12, 60, 0, 0, Math.PI * 2); g.fill(); g.restore(); } g.fillRect(44, 150, 40, 30); }), transparent: true, fog: true }));
  plant.position.set(-5.9, 1.2, 4.2); plant.rotation.y = Math.PI / 2; scene.add(plant);
  // street lamps with pools of light, utility poles and wires
  const lamps = [];
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x111112, roughness: 0.7 });
  for (let z = 4, i = 0; z > -length - 10; z -= 11, i++) {
    const s = i % 2 ? 1 : -1;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 5.2, 8), poleMat); pole.position.set(s * 4.3, 2.6, z); scene.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.06), poleMat); arm.position.set(s * 3.8, 5.15, z); scene.add(arm);
    const head = F.glow(pal.lamp, 1.6, 0.9); head.position.set(s * 3.25, 5.05, z); scene.add(head);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.4, 32), new THREE.MeshBasicMaterial({ map: F._glow, color: pal.lamp, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(s * 3.1, 0.02, z); scene.add(pool);
    lamps.push({ head, pool });
    mats.push({ m: head.material, k: 'lamp' }, { m: pool.material, k: 'lamp' });
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 9, 6), poleMat); up.position.set(-s * 5.2, 4.5, z - 5); scene.add(up);
  }
  const wire = []; for (let z = 0; z > -length - 10; z -= 1) wire.push(new THREE.Vector3(5.2 * (Math.floor(-z / 11) % 2 ? 1 : -1) * 0, 8.6 - Math.abs(Math.sin(z * 0.28)) * 0.5, z));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wire.map((p) => p.clone().setX(5.2))), new THREE.LineBasicMaterial({ color: 0x050505 })));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wire.map((p) => p.clone().setX(-5.2))), new THREE.LineBasicMaterial({ color: 0x050505 })));
  // neon signs that light up as you pass (story beats)
  const neon = signs.map((s, i) => {
    const side = i % 2 ? 1 : -1;
    const tex = neonTex(F, s.text, pal.neon);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, fog: true }));
    m.position.set(side * 5.9, 3.4 + (i % 3) * 0.6, s.at + 2); m.rotation.y = -side * Math.PI / 2;
    scene.add(m);
    return { ...s, m, on: false };
  });
  // the light at the end of the street
  const end = new THREE.Group();
  const endGlow = F.glow(pal.end, 26, 1); const endCore = F.glow(0xffffff, 9, 1);
  end.add(endGlow, endCore); end.position.set(0, 3, -length - 6);
  scene.add(end);
  const endLight = new THREE.PointLight(pal.end, 60, 80, 1.2); endLight.position.set(0, 4, -length - 2); scene.add(endLight);
  mats.push({ m: endGlow.material, k: 'end' });
  // weather
  const W = makeWeather(F, pal.weather);
  return { scene, ground, lamps, neon, end, endGlow, endLight, mats, pal, weather: W, shopMat, shopLight, hemi, length, facade, winMats, buildings };
}

function makeWeather(F, kind) {
  const { THREE } = F;
  const N = F.small ? 1400 : 2600;
  const geo = new THREE.BufferGeometry();
  const P = new Float32Array(N * 6), V = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const x = (Math.random() - 0.5) * 18, y = Math.random() * 12, z = -Math.random() * 40 + 6;
    P.set([x, y, z, x, y - 0.35, z], i * 6); V[i] = 0.8 + Math.random() * 0.4;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  const rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xBFC2C8, transparent: true, opacity: 0.35, depthWrite: false }));
  const sgeo = new THREE.BufferGeometry(); const SP = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) SP.set([(Math.random() - 0.5) * 18, Math.random() * 12, -Math.random() * 40 + 6], i * 3);
  sgeo.setAttribute('position', new THREE.BufferAttribute(SP, 3));
  const snow = new THREE.Points(sgeo, new THREE.PointsMaterial({ size: 0.07, color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }));
  F.scene.add(rain, snow);
  const api = {
    kind,
    set(k) { api.kind = k; rain.visible = k === 'rain'; snow.visible = k === 'snow'; },
    update(dt, camZ, t) {
      if (F.reduced) return;
      if (api.kind === 'rain') {
        const p = geo.attributes.position.array;
        for (let i = 0; i < N; i++) {
          let y = p[i * 6 + 1] - dt * 14 * V[i];
          let z = p[i * 6 + 2];
          if (y < 0) { y = 12; z = camZ - Math.random() * 38 + 4; }
          if (z > camZ + 6) z -= 40;
          p[i * 6 + 1] = y; p[i * 6 + 4] = y - 0.35; p[i * 6 + 2] = z; p[i * 6 + 5] = z;
        }
        geo.attributes.position.needsUpdate = true;
      } else if (api.kind === 'snow') {
        const p = sgeo.attributes.position.array;
        for (let i = 0; i < N; i++) {
          p[i * 3 + 1] -= dt * 0.9 * V[i]; p[i * 3] += Math.sin(t + i) * dt * 0.3;
          if (p[i * 3 + 1] < 0) { p[i * 3 + 1] = 12; p[i * 3 + 2] = camZ - Math.random() * 38 + 4; }
          if (p[i * 3 + 2] > camZ + 6) p[i * 3 + 2] -= 40;
        }
        sgeo.attributes.position.needsUpdate = true;
      }
    },
  };
  api.set(kind);
  return api;
}

/* The walker + camera rig shared by the street chapters. */
export function walker(F, S, spriteKey, { speed = 1.55, onBeat } = {}) {
  const { THREE } = F;
  const me = F.character(spriteKey, 1.8);
  me.mesh.position.set(0.2, 0, 4);
  me.mat.color.setRGB(0.86, 0.86, 0.88);
  F.scene.add(me.mesh);
  const input = holdInput(F, (v) => pad.active(v));
  const pad = holdPad(F, 'Hold to walk', input);
  const cam = F.camera;
  const st = { d: 0, v: 0, t: 0, paused: false, auto: false, done: false, target: S.length + 4 };
  F.onFrame((dt) => {
    st.t += dt;
    const want = st.done ? 0 : st.paused ? 0 : (input.down || st.auto || F.skipped) ? speed * (F.skipped ? 6 : 1) : 0;
    st.v = lerp(st.v, want, Math.min(1, dt * 5));
    st.d = Math.min(st.target, st.d + st.v * dt);
    const z = 4 - st.d;
    me.mesh.position.z = z;
    me.frame(st.v > 0.08 ? Math.floor((st.d / 1.5) * 12) : 0);
    // the camera trails behind, low, slightly off to the right — the reference framing
    const back = F.portrait ? 6.4 : 4.6;
    cam.position.set((F.portrait ? 0.35 : 0.9) + Math.sin(st.t * 0.4) * 0.08, 1.25 + Math.sin(st.t * 1.3) * 0.02 * (st.v > 0.1 ? 1 : 0), z + back);
    cam.lookAt(0.2, 1.55, z - 12);
    S.weather.update(dt, cam.position.z, st.t);
    if (onBeat) onBeat(st.d, st);
    // neon beats flicker on as he reaches them
    for (const n of S.neon) if (!n.on && -st.d + 4 < n.at + 6) { n.on = true; flickerOn(F, n.m.material); if (n.caption) F.caption(n.caption, 3600); }
    if (st.d >= st.target - 0.01) st.done = true;
  });
  return { me, st, input, pad, off() { input.off(); pad.remove(); } };
}

function flickerOn(F, mat) {
  let k = 0;
  const seq = [0.9, 0.1, 0.8, 0.2, 1, 0.4, 1];
  const iv = setInterval(() => { mat.opacity = seq[k++]; if (k >= seq.length) clearInterval(iv); }, 90);
  F.audio.blip(880);
}

/* ============ UNITED STATES ============ */
export async function usa(F) {
  const length = 54;
  const S = buildStreet(F, {
    length, palette: 'usa', seed: 7,
    signs: [
      { text: 'NEW COUNTRY', at: -8, caption: 'January 2025. New country.' },
      { text: 'NEW RULES', at: -20, caption: 'Bank accounts. Leases. Credit. Learn it all at once.' },
      { text: 'OPEN 24H', at: -31 },
      { text: 'NO NAME YET', at: -40, caption: 'Nobody here knows your name yet.' },
    ],
  });
  const Wk = walker(F, S, 'walkBackTee');
  F.audio.mood('usa', 0.04); F.audio.wind(0.09, 1600); // rain hiss
  F.bars(true);
  await F.fade(false, 1600);
  F.prompt('Hold anywhere to walk toward the light.');
  // the light grows as he gets closer; at the end, everything goes white
  F.onFrame(() => {
    const p = Wk.st.d / Wk.st.target;
    S.endGlow.scale.setScalar(26 + p * p * 90);
    S.scene.fog.density = S.pal.density * (1 - p * 0.5);
    S.scene.fog.color.set(hexMix(S.pal.fog, '#9A9A9A', p * p));
    F.whiteout(Math.max(0, (p - 0.78) / 0.22), 120);
  });
  await F.until(() => Wk.st.done);
  Wk.off(); F.prompt('');
  F.whiteout(1, 500);
  F.bars(false);
  F.audio.wind(0, 300);
  await F.wait(700);
  await F.card([{ text: 'Welcome to the USA', ms: 2800 }], { dark: true });
}

/* ============ OHIO → REROUTING → CALIFORNIA ============ */
export async function ohioCali(F) {
  const { THREE } = F;
  const length = 70;
  const S = buildStreet(F, {
    length, palette: 'ohio', seed: 19,
    signs: [
      { text: 'DAYTON, OHIO', at: -6, caption: 'Dayton, Ohio. First dorm. First winter.' },
      { text: 'WRIGHT STATE', at: -16, caption: 'Wright State University.' },
      { text: 'CALIFORNIA', at: -44, caption: 'California. A short chapter, a different light.' },
      { text: 'WHAT NOW?', at: -58, caption: 'Same question: what now?' },
    ],
  });
  // California palms, hidden until the reroute
  const palms = new THREE.Group();
  const palmTex = F.canvasTex(256, 512, (g) => {
    g.strokeStyle = '#000'; g.lineCap = 'round';
    g.lineWidth = 10; g.beginPath(); g.moveTo(128, 512); g.quadraticCurveTo(110, 300, 140, 120); g.stroke();
    g.lineWidth = 7;
    for (let i = 0; i < 9; i++) { const a = -Math.PI + i * (Math.PI / 8); g.beginPath(); g.moveTo(140, 120); g.quadraticCurveTo(140 + Math.cos(a) * 60, 120 + Math.sin(a) * 40 - 10, 140 + Math.cos(a) * 110, 120 + Math.sin(a) * 60 + 40); g.stroke(); }
  });
  for (let i = 0; i < 12; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(4, 8), new THREE.MeshBasicMaterial({ map: palmTex, transparent: true, fog: true, depthWrite: false }));
    s.position.set((i % 2 ? 1 : -1) * (3.8 + Math.random()), 4, -36 - i * 3.2);
    s.scale.y = 0.001; palms.add(s);
  }
  S.scene.add(palms);
  const Wk = walker(F, S, 'walkBackHood');
  F.audio.mood('ohio', 0.045); F.audio.wind(0.05, 700);
  F.bars(true);
  await F.fade(false, 1400);
  F.prompt('Hold to walk.');
  // stop at the fork: the plan doesn't work out
  Wk.st.target = 24;
  await F.until(() => Wk.st.done);
  Wk.st.paused = true;
  F.prompt(''); Wk.pad.el.style.display = 'none';
  F.glitch(true);
  F.audio.blip(220); F.audio.blip(185);
  const gps = document.createElement('div');
  gps.className = 'st-gps in';
  gps.innerHTML = '<p class="gps-t">Route unavailable</p><p class="gps-s">The plan ends here.</p>';
  F.controls.appendChild(gps);
  await F.wait(1800);
  await F.button('Recalculate <i>↻</i>');
  gps.querySelector('.gps-t').textContent = 'Recalculating…';
  gps.querySelector('.gps-s').textContent = 'Finding another way.';
  await F.wait(900);
  gps.remove();
  // the world recolours: snow stops, warm light floods in, palms rise
  const A = S.pal, B = { bg: '#2A1416', fog: '#B5603F', facade: '#2A1A1A', end: '#FFD9A0', lamp: '#FFD9A0' };
  S.weather.set('none');
  F.audio.mood('cali', 0.05); F.audio.wind(0.015, 400);
  await tween(F, 3200, (e) => {
    S.scene.background.set(hexMix(A.bg, B.bg, e));
    S.scene.fog.color.set(hexMix(A.fog, B.fog, e));
    S.facade.color.set(hexMix(A.facade, B.facade, e));
    S.endGlow.material.color.set(hexMix(A.end, B.end, e));
    S.endLight.color.set(hexMix(A.end, B.end, e));
    S.lamps.forEach((l) => { l.head.material.color.set(hexMix(A.lamp, B.lamp, e)); l.pool.material.color.set(hexMix(A.lamp, B.lamp, e)); });
    S.hemi.color.set(hexMix('#9A9AA6', '#FFB07A', e)); S.hemi.intensity = 0.35 + e * 0.35;
    palms.children.forEach((p, i) => { p.scale.y = Math.max(0.001, ease.out(Math.min(1, e * 1.6 - i * 0.04))); });
    if (e > 0.25) F.glitch(false);
  });
  F.glitch(false);
  Wk.st.paused = false; Wk.st.target = length + 4; Wk.pad.el.style.display = '';
  F.prompt('Hold to walk.');
  F.onFrame(() => { const p = Math.max(0, (Wk.st.d - 24) / (Wk.st.target - 24)); S.endGlow.scale.setScalar(26 + p * p * 60); });
  await F.until(() => Wk.st.done);
  Wk.off(); F.prompt(''); F.bars(false);
}
