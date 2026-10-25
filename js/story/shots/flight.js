/* flight.js — out of the white, above the clouds. Steer through the rings
   while night turns to dawn on the other side of the world. Can't fail. */
import { rng, lerp, hexMix } from '../util.js';

export async function flight(F) {
  const { THREE } = F;
  const scene = F.newScene({ fog: 0x0A1222, density: 0.008, bg: 0x050A16, fov: 60 });
  const r = rng(12);
  scene.add(new THREE.HemisphereLight(0x8899CC, 0x101018, 0.9));
  // cloud sea: soft sprites below and around
  const cloudTex = F.canvasTex(256, 256, (g, w, h) => {
    for (let i = 0; i < 26; i++) {
      const x = w / 2 + (Math.random() - 0.5) * w * 0.55, y = h / 2 + (Math.random() - 0.5) * h * 0.3, rad = 30 + Math.random() * 50;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
  });
  const clouds = [];
  const N = F.small ? 55 : 95;
  for (let i = 0; i < N; i++) {
    const m = new THREE.SpriteMaterial({ map: cloudTex, color: 0x6A7590, transparent: true, opacity: 0.75, depthWrite: false });
    const s = new THREE.Sprite(m);
    const below = r() < 0.7;
    s.position.set((r() - 0.5) * 140, below ? -10 - r() * 8 : (r() - 0.5) * 26, -r() * 400);
    const sc = below ? 30 + r() * 30 : 10 + r() * 16;
    s.scale.set(sc, sc * 0.5, 1);
    scene.add(s); clouds.push(s);
  }
  // stars + moon that give way to the sun
  const sg = new THREE.BufferGeometry(), SP = [];
  for (let i = 0; i < 700; i++) SP.push((r() - 0.5) * 600, 10 + r() * 200, -200 - r() * 300);
  sg.setAttribute('position', new THREE.Float32BufferAttribute(SP, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 1.2, color: 0xffffff, transparent: true, opacity: 0.8, fog: false, sizeAttenuation: false }));
  scene.add(stars);
  const sun = F.glow(0xFFC890, 120, 0); sun.position.set(30, -6, -380); scene.add(sun);
  // rings of light to fly through
  const rings = [];
  const ringMat = () => new THREE.MeshBasicMaterial({ color: 0xF1ECE2, transparent: true, opacity: 0.9, fog: false });
  const COUNT = 12, GAP = 34;
  for (let i = 0; i < COUNT; i++) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.07, 8, 64), ringMat());
    const glow = F.glow(0xCC2D26, 7, 0.5);
    g.add(ring, glow);
    g.position.set(Math.sin(i * 1.7) * 5, Math.cos(i * 1.3) * 2.2, -40 - i * GAP);
    g.userData = { passed: false };
    scene.add(g); rings.push(g);
  }
  const cam = F.camera;
  let z = 0, x = 0, y = 0, tx = 0, ty = 0, t = 0, score = 0;
  const speed = F.reduced ? 26 : 22;
  const end = -40 - (COUNT - 1) * GAP - 40;
  const onMove = (e) => { tx = (e.clientX / F.W - 0.5) * 2; ty = -(e.clientY / F.H - 0.5) * 2; };
  F.host.addEventListener('pointermove', onMove);
  F.host.addEventListener('pointerdown', onMove);
  const keys = {};
  const kd = (e) => { keys[e.key] = true; }, ku = (e) => { keys[e.key] = false; };
  addEventListener('keydown', kd); addEventListener('keyup', ku);
  const scoreEl = document.createElement('p'); scoreEl.className = 'st-score'; scoreEl.innerHTML = '<b>0</b> / 12 lights';
  F.controls.appendChild(scoreEl);
  const NIGHT = { bg: '#050A16', fog: '#0A1222', cloud: '#6A7590' }, DAWN = { bg: '#E7A47E', fog: '#E9B08C', cloud: '#FFE0CC' };
  let lastNow = 0;
  F.onFrame((dt, now) => {
    const real = lastNow ? Math.min(0.5, now - lastNow) : dt; lastNow = now;
    t += dt;
    if (keys.ArrowLeft) tx = Math.max(-1, tx - dt * 2); if (keys.ArrowRight) tx = Math.min(1, tx + dt * 2);
    if (keys.ArrowUp) ty = Math.min(1, ty + dt * 2); if (keys.ArrowDown) ty = Math.max(-1, ty - dt * 2);
    z -= speed * real * (F.skipped ? 8 : 1);
    // gentle assist: drift toward the next ring so nobody misses everything
    const next = rings.find((g) => !g.userData.passed);
    const ax = next ? next.position.x * 0.35 : 0, ay = next ? next.position.y * 0.35 : 0;
    x = lerp(x, tx * 6 + ax, dt * 2.2); y = lerp(y, ty * 3 + ay, dt * 2.2);
    cam.position.set(x, y, z);
    cam.rotation.set(y * 0.02, -x * 0.02, -(tx * 6 + ax - x) * 0.04);
    const p = Math.min(1, -z / -end);
    const k = Math.max(0, (p - 0.35) / 0.65);
    F.scene.background.set(hexMix(NIGHT.bg, DAWN.bg, k));
    F.scene.fog.color.set(hexMix(NIGHT.fog, DAWN.fog, k));
    const cc = hexMix(NIGHT.cloud, DAWN.cloud, k);
    for (const c of clouds) { c.material.color.set(cc); if (c.position.z > z + 5) c.position.z -= 400; }
    stars.material.opacity = 0.8 * (1 - k);
    sun.material.opacity = k * 0.9; sun.position.z = z - 360;
    for (const g of rings) {
      g.rotation.z += dt * 0.6;
      if (!g.userData.passed && z < g.position.z) {
        g.userData.passed = true;
        const hit = Math.hypot(x - g.position.x, y - g.position.y) < 2.6;
        if (hit) { score++; g.children[0].material.color.set(0xCC2D26); g.children[1].scale.setScalar(16); F.audio.pluck(523 + score * 40, 0, 0.1); }
        else g.children[0].material.opacity = 0.25;
        scoreEl.querySelector('b').textContent = score;
      }
    }
    F.audio.wind(0.03 + k * 0.02, 400 + k * 300);
  });
  F.whiteout(1, 10);
  F.audio.mood('air', 0.05);
  await F.fade(false, 10);
  F.whiteout(0, 1600);
  await F.wait(800);
  F.caption('Kathmandu → somewhere far.', 3000);
  F.prompt(F.small ? 'Move your finger to fly through the lights.' : 'Move the mouse to fly through the lights.');
  await F.until(() => z < end + 40);
  F.prompt('');
  await F.card([{ text: `${score} / 12`, sub: 'Lights caught', small: true, ms: 1600 }]);
  F.host.removeEventListener('pointermove', onMove); F.host.removeEventListener('pointerdown', onMove);
  removeEventListener('keydown', kd); removeEventListener('keyup', ku);
}
