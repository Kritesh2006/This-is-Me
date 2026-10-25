/* build.js — Greensboro, now. A dark room, a monitor, and his projects
   orbiting him as holograms. Tap one: it flies into the screen and ships.
   Every project lights more of the city outside. */
import { tween, ease } from '../util.js';
import { PROJECTS } from '../../data.js';

const ORDER = ['payreport', 'inventory', 'aria', 'airos', 'himveda', 'witness'];
const LINES = {
  payreport: 'The first thing anyone else relied on.',
  inventory: 'The search the whole shop uses, every day.',
  aria: 'Four AI models, one answer.',
  airos: 'A laptop that follows your hands and voice.',
  himveda: 'A marketplace for a business back home.',
  witness: 'A camera that remembers what was really wired.',
};

function cardTex(F, p, i) {
  return F.canvasTex(512, 300, (g, w, h) => {
    g.fillStyle = 'rgba(6,17,12,0.82)'; g.fillRect(0, 0, w, h);
    g.strokeStyle = i % 2 ? '#CC2D26' : '#9FC7B2'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#9FC7B2'; g.font = '500 22px "JetBrains Mono", monospace'; g.fillText(String(i + 1).padStart(2, '0') + ' / 06', 34, 56);
    g.fillStyle = '#F1ECE2'; g.font = '900 64px "Bodoni Moda", Georgia, serif'; g.fillText(p.name.toUpperCase(), 32, 150);
    g.fillStyle = 'rgba(241,236,226,.75)'; g.font = '500 26px Archivo, sans-serif'; g.fillText(p.kind, 34, 200);
    g.fillStyle = '#CC2D26'; g.font = '600 22px Archivo, sans-serif'; g.fillText('TAP TO BUILD', 34, 256);
  });
}

export async function build(F) {
  const { THREE } = F;
  const scene = F.newScene({ fog: 0x050807, density: 0.05, bg: 0x030505, fov: 40 });
  scene.add(new THREE.HemisphereLight(0x6A8076, 0x0A0C0B, 0.9));
  const key = new THREE.SpotLight(0xF1ECE2, 30, 14, 0.6, 0.6); key.position.set(-2, 5, 3); key.target.position.set(0.8, 1, -1); scene.add(key, key.target);
  // room
  const dark = new THREE.MeshStandardMaterial({ color: 0x232724, roughness: 0.95 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), dark); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), dark); back.position.set(0, 6, -4); scene.add(back);
  // window onto the Greensboro skyline
  const cityTex = F.canvasTex(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#04100B'); gr.addColorStop(1, '#183327'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { const x = i * 40 + Math.random() * 20, bw = 26 + Math.random() * 30, bh = 80 + Math.random() * 260; g.fillStyle = '#06100C'; g.fillRect(x, h - bh, bw, bh); }
  });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ map: cityTex, fog: false }));
  win.position.set(-2.4, 3, -3.95); scene.add(win);
  // the city's lights, switched on project by project
  const cityLights = new THREE.Group();
  for (let i = 0; i < 140; i++) { const s = F.glow(i % 9 ? 0xF2D08E : 0xCC2D26, 0.12 + Math.random() * 0.1, 0); s.position.set(-5.3 + Math.random() * 5.8, 1.6 + Math.random() * 1.6, -3.9); cityLights.add(s); }
  scene.add(cityLights);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.12, 0.2), dark); frame.position.set(-2.4, 1.45, -3.85); scene.add(frame);
  // desk + monitor
  const wood = new THREE.MeshStandardMaterial({ color: 0x2A2018, roughness: 0.8 });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.1), wood); desk.position.set(1.75, 0.95, -1.6); scene.add(desk);
  for (const x of [1.0, 2.5]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 1), wood); leg.position.set(x, 0.47, -1.6); scene.add(leg); }
  const scr = document.createElement('canvas'); scr.width = 512; scr.height = 300;
  const sg = scr.getContext('2d');
  const screenTex = new THREE.CanvasTexture(scr); screenTex.colorSpace = THREE.SRGBColorSpace;
  const drawScreen = (lines, prog = 0) => {
    sg.fillStyle = '#07130E'; sg.fillRect(0, 0, 512, 300);
    sg.fillStyle = '#9FC7B2'; sg.font = '500 24px "JetBrains Mono", monospace';
    lines.forEach((l, i) => sg.fillText(l, 24, 46 + i * 34));
    sg.strokeStyle = 'rgba(159,199,178,.5)'; sg.strokeRect(24, 240, 464, 22);
    sg.fillStyle = '#CC2D26'; sg.fillRect(26, 242, 460 * prog, 18);
    screenTex.needsUpdate = true;
  };
  drawScreen(['kritesh@greensboro ~', '$ ready.']);
  const monitor = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.72), new THREE.MeshBasicMaterial({ map: screenTex }));
  monitor.position.set(2.0, 1.5, -1.85); monitor.rotation.y = -0.55; scene.add(monitor);
  const monGlow = new THREE.PointLight(0x9FC7B2, 14, 6, 1.4); monGlow.position.set(1.4, 1.5, -1.1); scene.add(monGlow);
  // him, at the desk, typing
  const me = F.character('type', 1.78);
  me.mesh.position.set(0.6, 0, -1.25);
  me.mat.color.setRGB(0.78, 0.86, 0.82);
  scene.add(me.mesh);
  // holographic project cards orbiting
  const projects = ORDER.map((id) => PROJECTS.find((p) => p.id === id));
  const cards = projects.map((p, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.82), new THREE.MeshBasicMaterial({ map: cardTex(F, p, i), transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    m.userData = { p, i, built: false, a: (i / projects.length) * Math.PI * 2, fly: null };
    m.visible = false; m.scale.setScalar(0.7);
    scene.add(m);
    return m;
  });
  const cam = F.camera;
  let t = 0, built = 0, busy = false, showCards = false;
  const center = new THREE.Vector3(0.8, 1.5, -1);
  F.onFrame((dt) => {
    t += dt;
    const rad = F.portrait ? 1.5 : 2.5;
    cam.position.set(0.6 + Math.sin(t * 0.15) * 0.4, 1.8, F.portrait ? 5.6 : 3.9);
    cam.lookAt(center.x, 1.45, center.z);
    me.frame(Math.floor(t * 8));
    for (const c of cards) {
      const u = c.userData;
      if (u.fly) continue;
      if (u.built || !showCards) { c.visible = false; continue; }
      c.visible = true;
      const a = u.a + t * 0.22;
      c.position.set(center.x + Math.cos(a) * rad, 1.25 + Math.sin(t * 1.2 + u.i) * 0.1 + (u.i % 3) * 0.55, center.z + Math.sin(a) * rad * 0.35);
      c.lookAt(cam.position);
    }
  });
  F.audio.mood('nc', 0.05); F.audio.wind(0, 300);
  await F.fade(false, 1400);
  await F.card([{ text: 'North Carolina', sub: 'Greensboro · now', ms: 2400 }]);
  showCards = true;
  F.caption('Forsyth Tech by day. Repair shifts. This desk at night.', 4000);
  F.prompt('Tap a project to build it. <b class="cnt">0 / 6</b>');

  let resolve;
  const done = new Promise((r) => (resolve = r));
  async function buildCard(c) {
    if (busy || c.userData.built) return;
    busy = true;
    const p = c.userData.p;
    const from = c.position.clone();
    c.userData.fly = true;
    await tween(F, 900, (e) => { c.position.lerpVectors(from, monitor.position, e); c.scale.setScalar(1 - e * 0.85); c.lookAt(cam.position); });
    c.userData.built = true; c.userData.fly = null; c.visible = false;
    const slug = p.name.toLowerCase().replace(/\s+/g, '-');
    await tween(F, F.reduced ? 300 : 1400, (e) => drawScreen(['kritesh@greensboro ~', `$ build ${slug}`, e < 1 ? 'compiling…' : 'shipped ✓'], e), ease.lin);
    drawScreen(['kritesh@greensboro ~', `$ build ${slug}`, 'shipped ✓'], 1);
    built++;
    F.unlock(p.name, LINES[p.id]);
    // light up a share of the city
    const per = Math.ceil(cityLights.children.length / 6);
    cityLights.children.slice((built - 1) * per, built * per).forEach((s, k) => setTimeout(() => (s.material.opacity = 0.95), k * 12));
    const cnt = F.controls.querySelector('.cnt'); if (cnt) cnt.textContent = `${built} / 6`;
    busy = false;
    if (built === 6) setTimeout(resolve, 1600);
    if (built === 3 && !F.controls.querySelector('.st-btn')) F.button('Keep going <i>→</i>', 'st-btn-red').then(resolve);
  }
  const onTap = (e) => { const hit = F.pick(e, cards.filter((c) => c.visible && !c.userData.built)); if (hit.length) buildCard(hit[0].object); };
  F.host.addEventListener('pointerdown', onTap);
  // keyboard / screen-reader path: real buttons for each project
  const list = document.createElement('div'); list.className = 'sr';
  projects.forEach((p, i) => { const b = document.createElement('button'); b.textContent = `Build ${p.name}`; b.addEventListener('click', () => buildCard(cards[i])); list.appendChild(b); });
  F.controls.appendChild(list);
  await Promise.race([done, F.until(() => false)]);
  F.host.removeEventListener('pointerdown', onTap);
  F.prompt('');
}
