/* nepal.js — Kathmandu at night. Tap sky lanterns to release memories.
   Then: 18. Time to leave. Hold, and the city lets go. */
import { tween, rng, ease } from '../util.js';

const FLAGS = [0x2E6FB7, 0xF1ECE2, 0xC8342C, 0x2F8A4E, 0xE3B536];

function valley(F) {
  const { THREE, scene } = F;
  const r = rng(4);
  // terrain: a bowl of hills, dark
  const terr = new THREE.PlaneGeometry(260, 200, 90, 70);
  terr.rotateX(-Math.PI / 2);
  const pos = terr.attributes.position;
  const height = (x, z) => {
    const d = Math.hypot(x * 0.8, z + 40) / 70;
    return Math.pow(Math.max(0, d), 2.2) * 9 + Math.sin(x * 0.11) * 1.2 + Math.cos(z * 0.13 + x * 0.05) * 1.1 - 6;
  };
  for (let i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i)));
  terr.computeVertexNormals();
  scene.add(new THREE.Mesh(terr, new THREE.MeshStandardMaterial({ color: 0x0B1210, roughness: 1 })));
  // city lights: thousands of warm points spread on the valley floor
  const N = F.small ? 2600 : 5200;
  const g = new THREE.BufferGeometry();
  const P = new Float32Array(N * 3), C = new Float32Array(N * 3);
  const warm = new THREE.Color(0xFFC46E), cool = new THREE.Color(0xF4EFE4), red = new THREE.Color(0xFF4A3A);
  for (let i = 0; i < N; i++) {
    const a = r() * Math.PI * 2, rad = Math.pow(r(), 0.7) * 62;
    const x = Math.cos(a) * rad * 1.3, z = -40 + Math.sin(a) * rad;
    P[i * 3] = x; P[i * 3 + 1] = height(x, z) + 0.15; P[i * 3 + 2] = z;
    const c = r() < 0.75 ? warm : r() < 0.85 ? cool : red;
    C[i * 3] = c.r; C[i * 3 + 1] = c.g; C[i * 3 + 2] = c.b;
  }
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  const lights = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.95, map: F.glowTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  scene.add(lights);
  // Himalaya: a far ridge with snow on the peaks
  const ridge = new THREE.PlaneGeometry(520, 70, 160, 1);
  const rp = ridge.attributes.position;
  const cols = [];
  for (let i = 0; i < rp.count; i++) {
    const x = rp.getX(i), top = rp.getY(i) > 0;
    const h = top ? 4 + Math.abs(Math.sin(x * 0.031)) * 9 + Math.abs(Math.sin(x * 0.083 + 1)) * 4 : -20;
    rp.setY(i, h);
    const snow = top && h > 10;
    cols.push(...(snow ? [0.42, 0.46, 0.52] : top ? [0.07, 0.09, 0.12] : [0.02, 0.025, 0.03]));
  }
  ridge.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const mount = new THREE.Mesh(ridge, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
  mount.position.set(0, -6, -230);
  scene.add(mount);
  // the stupa on its hill, softly lit
  const st = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xE8E2D2, roughness: 0.8, emissive: 0x2A2620 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), white);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.3, 0.6, 32), white);
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), white);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.8, 16), new THREE.MeshStandardMaterial({ color: 0xC9A04A, metalness: 0.7, roughness: 0.35, emissive: 0x3A2A08 }));
  base.position.y = 0.3; dome.position.y = 0.6; cube.position.y = 3.2; spire.position.y = 5;
  st.add(base, dome, cube, spire);
  st.position.set(22, height(22, -70) + 0.2, -70);
  scene.add(st);
  const stGlow = F.glow(0xFFD9A0, 14, 0.35); stGlow.position.copy(st.position).add(new THREE.Vector3(0, 3, 0)); scene.add(stGlow);
  // moon
  const moon = F.glow(0xF4EFE4, 22, 0.9); moon.position.set(-60, 60, -170); scene.add(moon);
  const moonCore = new THREE.Mesh(new THREE.CircleGeometry(3.4, 32), new THREE.MeshBasicMaterial({ color: 0xF4EFE4, fog: false }));
  moonCore.position.copy(moon.position); scene.add(moonCore);
  // stars
  const sg = new THREE.BufferGeometry(), SP = [];
  for (let i = 0; i < 900; i++) { const a = r() * Math.PI - Math.PI, e = 0.15 + r() * 0.9; SP.push(Math.cos(a) * 250, Math.sin(e) * 160, Math.sin(a) * 250); }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(SP, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.9, color: 0xffffff, transparent: true, opacity: 0.7, fog: false, sizeAttenuation: false })));
  return { lights, height };
}

function rooftop(F) {
  const { THREE, scene } = F;
  const roof = new THREE.Group();
  const conc = new THREE.MeshStandardMaterial({ color: 0x2A2A2A, roughness: 0.95 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 9), conc); slab.position.set(0, -0.2, 2);
  const wallF = new THREE.Mesh(new THREE.BoxGeometry(14, 0.9, 0.25), conc); wallF.position.set(0, 0.45, -2.4);
  roof.add(slab, wallF);
  // water tank + rebar, the Kathmandu skyline detail
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.4, 20), new THREE.MeshStandardMaterial({ color: 0x1A1A1A, roughness: 0.6 }));
  tank.position.set(-5, 0.7, 0.5); roof.add(tank);
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4), conc); b.position.set(4 + i * 0.3, 0.7, -1.8); roof.add(b); }
  scene.add(roof);
  // prayer flags strung across the roof, fluttering
  const flags = [];
  const strings = [[[-7, 3.6, -2.6], [7, 3.1, -3.4]], [[-6, 3.0, -1.4], [-2, 3.4, -4.2]]];
  strings.forEach(([a, b], si) => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; const p = A.clone().lerp(B, t); p.y -= Math.sin(t * Math.PI) * 0.6; pts.push(p); }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x8C877C })));
    for (let i = 1; i < 20; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.46), new THREE.MeshStandardMaterial({ color: FLAGS[(i + si) % 5], side: THREE.DoubleSide, roughness: 1, emissive: FLAGS[(i + si) % 5], emissiveIntensity: 0.18 }));
      m.geometry.translate(0, -0.23, 0);
      m.position.copy(pts[i]); m.lookAt(m.position.clone().add(new THREE.Vector3(0.3, 0, 1)));
      scene.add(m); flags.push({ m, p: i * 0.6 + si, base: m.rotation.clone() });
    }
  });
  return { roof, flags };
}

const MEMORIES = [
  'Born June 7, 2006.',
  'Always taking things apart to see how they worked.',
  'Music, always.',
  '2022. A repair counter in Kathmandu. First real job.',
];

export async function nepal(F) {
  const { THREE } = F;
  const scene = F.newScene({ fog: 0x05080A, density: 0.012, bg: 0x03060A });
  scene.add(new THREE.HemisphereLight(0x3A4A66, 0x05070A, 0.55));
  const moonLight = new THREE.DirectionalLight(0x9FB4D0, 0.6); moonLight.position.set(-30, 40, -40); scene.add(moonLight);
  const warm = new THREE.PointLight(0xFF9A50, 6, 14, 1.6); warm.position.set(2, 2, 3); scene.add(warm);
  const V = valley(F);
  const R = rooftop(F);
  // him, at the edge, looking out
  const me = F.character('idleBackHood', 1.78);
  me.mesh.position.set(0.25, 0, -1.2);
  me.mat.color.setRGB(0.82, 0.82, 0.86);
  scene.add(me.mesh);
  const cam = F.camera;
  const look = new THREE.Vector3(0, 0.2, -30);
  let px = 0, py = 0, tx = 0, ty = 0, t = 0;
  const onMove = (e) => { tx = (e.clientX / F.W - 0.5) * 2; ty = (e.clientY / F.H - 0.5) * 2; };
  F.host.addEventListener('pointermove', onMove);
  const base = new THREE.Vector3(F.portrait ? 0.45 : 1.1, 1.6, F.portrait ? 4.2 : 2.9);
  F.onFrame((dt) => {
    t += dt;
    px += (tx - px) * dt * 2; py += (ty - py) * dt * 2;
    cam.position.set(base.x + px * 1.2 + Math.sin(t * 0.2) * 0.3, base.y - py * 0.4 + Math.sin(t * 0.3) * 0.05, base.z);
    cam.lookAt(look.x + px * 6, look.y - py * 2, look.z);
    me.frame(Math.floor(t * 2.2));
    if (!F.reduced) R.flags.forEach((f) => { f.m.rotation.y = f.base.y + Math.sin(t * 2.4 + f.p) * 0.35; f.m.rotation.x = f.base.x + Math.sin(t * 3.1 + f.p) * 0.15; });
  });
  F.audio.mood('nepal', 0.05); F.audio.wind(0.025, 320);
  await F.fade(false, 1600);
  await F.card([{ text: 'Nepal', sub: 'Kathmandu · 2006', ms: 2600 }]);

  // sky lanterns drift up from the valley; tap them
  const lanterns = [];
  const lmat = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95 });
  function spawn(i) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.55, 12, 1, true), lmat(0xFFB45A));
    body.material.side = THREE.DoubleSide;
    const glow = F.glow(0xFF9A3A, 2.2, 0.85);
    g.add(body, glow);
    const a = -0.9 + i * 0.6;
    g.position.set(Math.sin(a) * 9, -2 + Math.random(), -10 - Math.random() * 8);
    g.userData = { i, vy: 0.22 + Math.random() * 0.08, sway: Math.random() * 6, taken: false };
    F.scene.add(g); lanterns.push(g);
    return g;
  }
  MEMORIES.forEach((_, i) => spawn(i));
  F.onFrame((dt) => {
    for (const l of lanterns) {
      const u = l.userData;
      l.position.y += dt * (u.taken ? 2.2 : u.vy);
      l.position.x += Math.sin(t * 0.6 + u.sway) * dt * 0.25;
      if (!u.taken && l.position.y > 5.2) l.position.y = -1.5; // keep looping until tapped
      l.children[1].material.opacity = 0.7 + Math.sin(t * 6 + u.sway) * 0.15;
    }
  });
  // tappable through a raycast, plus visible labels for clarity
  let found = 0, resolveAll;
  const allFound = new Promise((r) => (resolveAll = r));
  const labels = lanterns.map((l) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'st-spot st-lantern'; b.setAttribute('aria-label', 'Release lantern');
    b.innerHTML = '<i></i>';
    F.hot.appendChild(b);
    b.addEventListener('click', () => take(l, b));
    return { l, b };
  });
  F.onFrame(() => labels.forEach(({ l, b }) => { const [x, y, vis] = F.toScreen(l.position); b.style.transform = `translate(${x}px,${y}px)`; b.style.display = vis && !l.userData.taken ? '' : 'none'; }));
  function take(l, b) {
    if (l.userData.taken) return;
    l.userData.taken = true; b.remove();
    l.children[1].scale.setScalar(4);
    F.audio.pluck(392 + found * 98, 0, 0.12); F.audio.pluck(587 + found * 98, 0.12, 0.08);
    F.caption(MEMORIES[l.userData.i], 3600);
    found++;
    const c = F.controls.querySelector('.cnt'); if (c) c.textContent = `${found} / 4`;
    if (found === 4) setTimeout(resolveAll, 2600);
  }
  const onTap = (e) => { const hit = F.pick(e, lanterns); if (hit.length) { let o = hit[0].object; while (o.parent && !lanterns.includes(o)) o = o.parent; const lab = labels.find((x) => x.l === o); take(o, lab ? lab.b : document.createElement('i')); } };
  F.host.addEventListener('pointerdown', onTap);
  F.prompt('Tap the lanterns to let the memories go. <b class="cnt">0 / 4</b>');
  await Promise.race([allFound, F.until(() => false)]);
  F.host.removeEventListener('pointerdown', onTap);
  labels.forEach(({ b }) => b.remove());
  F.prompt('');
  F.host.removeEventListener('pointermove', onMove);
}

export async function leaving(F) {
  const { THREE } = F;
  const scene = F.newScene({ fog: 0x05080A, density: 0.014, bg: 0x03060A });
  scene.add(new THREE.HemisphereLight(0x3A4A66, 0x05070A, 0.5));
  const V = valley(F);
  const R = rooftop(F);
  const me = F.character('idleBackHood', 1.78);
  me.mesh.position.set(0.3, 0, -0.4);
  me.mat.color.setRGB(0.8, 0.8, 0.85);
  scene.add(me.mesh);
  const cam = F.camera;
  let t = 0, camZ = F.portrait ? 6.2 : 4.6, camY = 1.55, lift = 0;
  F.onFrame((dt) => {
    t += dt;
    cam.position.set((F.portrait ? 0.4 : 0.9) + Math.sin(t * 0.25) * 0.15, camY + lift * 30, camZ);
    cam.lookAt(0, 1.2 + lift * 40, -12 - lift * 10);
    if (!F.reduced) R.flags.forEach((f) => { f.m.rotation.y = f.base.y + Math.sin(t * (2.4 + lift * 8) + f.p) * (0.35 + lift); });
  });
  F.audio.mood('leave', 0.05); F.audio.wind(0.03, 300);
  await F.fade(false, 1000);
  F.bars(true);
  await tween(F, 2600, (e) => { camZ = (F.portrait ? 6.2 : 4.6) - e * 1.2; camY = 1.55 - e * 0.15; });
  await F.card([{ text: '18.', ms: 2400 }, { text: 'Time to leave.', ms: 2200 }]);
  await F.hold('Hold to leave home', 1900);
  // he walks out of frame; the city lets go of its lights; we rise into the night
  me.use('walkBackHood');
  let walking = true, d = 0;
  F.onFrame((dt) => { if (!walking) return; d += dt * 1.1; me.mesh.position.z = -0.4 - d; me.frame(Math.floor(d / 1.4 * 12)); });
  const cols = V.lights.geometry.attributes.color;
  const orig = cols.array.slice();
  F.audio.wind(0.06, 900);
  await tween(F, 3800, (e) => {
    for (let i = 0; i < cols.count; i++) { const k = (i % 97) / 97 < e ? 0.12 : 1; cols.array[i * 3] = orig[i * 3] * k; cols.array[i * 3 + 1] = orig[i * 3 + 1] * k; cols.array[i * 3 + 2] = orig[i * 3 + 2] * k; }
    cols.needsUpdate = true;
    lift = ease.in(e) * 0.12;
  }, ease.lin);
  walking = false;
  F.whiteout(1, 1400);
  await F.wait(1400);
  F.bars(false);
}
