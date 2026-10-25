/* ending.js — the road keeps going. Dawn, an open road, him standing on it.
   The camera cranes up and back. */
import { tween, ease } from '../util.js';
import { currentAge } from '../../data.js';

export async function ending(F) {
  const { THREE } = F;
  const scene = F.newScene({ fog: 0xC77B5A, density: 0.012, bg: 0x1A2A26, fov: 42 });
  // sky dome: forest green overhead to crimson-gold at the horizon
  const skyTex = F.canvasTex(16, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#06110C'); gr.addColorStop(0.45, '#20352C'); gr.addColorStop(0.7, '#7A3A2E'); gr.addColorStop(0.86, '#E2895E'); gr.addColorStop(1, '#F6C892');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }));
  scene.add(sky);
  scene.add(new THREE.HemisphereLight(0xF6C892, 0x0A120E, 0.8));
  const sunLight = new THREE.DirectionalLight(0xFFC890, 1.2); sunLight.position.set(0, 10, -100); scene.add(sunLight);
  const sun = F.glow(0xFFD9A0, 70, 0.9); sun.position.set(0, 4, -260); scene.add(sun);
  // land + road to the horizon
  const land = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0x15211B, roughness: 1 }));
  land.rotation.x = -Math.PI / 2; scene.add(land);
  const roadTex = F.canvasTex(64, 512, (g, w, h) => {
    g.fillStyle = '#1F2120'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#E9E2D2'; for (let y = 0; y < h; y += 64) g.fillRect(w / 2 - 2, y, 4, 32);
    g.fillStyle = 'rgba(233,226,210,.6)'; g.fillRect(2, 0, 2, h); g.fillRect(w - 4, 0, 2, h);
  });
  roadTex.wrapT = THREE.RepeatWrapping; roadTex.repeat.set(1, 60);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 600), new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.7 }));
  road.rotation.x = -Math.PI / 2; road.position.set(0, 0.01, -290); scene.add(road);
  // hills silhouettes
  for (let i = 0; i < 14; i++) {
    const s = i % 2 ? 1 : -1;
    const h = new THREE.Mesh(new THREE.SphereGeometry(30 + Math.random() * 30, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x08100C, fog: false }));
    h.scale.y = 0.16; h.position.set(s * (60 + Math.random() * 90), -3, -90 - i * 26); scene.add(h);
  }
  // him, standing on the road, looking at what's next
  const me = F.character('idleBackHood', 1.8);
  me.mesh.position.set(0, 0, 0);
  me.mat.color.setRGB(0.9, 0.86, 0.82);
  scene.add(me.mesh);
  const cam = F.camera;
  let t = 0, crane = 0;
  F.onFrame((dt) => {
    t += dt;
    me.frame(Math.floor(t * 2));
    roadTex.offset.y -= dt * (F.reduced ? 0 : 0.02);
    const back = (F.portrait ? 5.5 : 3.8) + crane * 7;
    cam.position.set(0.5 - crane * 0.5, 1.2 + crane * 4.5, back);
    cam.lookAt(0, 1.3 + crane * 0.6, -30);
  });
  F.audio.mood('end', 0.05); F.audio.wind(0.03, 380);
  await F.fade(false, 1800);
  F.bars(true);
  tween(F, 14000, (e) => (crane = e), ease.io);
  await F.wait(1600);
  await F.card([
    { text: `Age ${currentAge()}`, ms: 2200 },
    { text: 'Current chapter // Building', small: true, ms: 2400 },
    { text: "The rest hasn't happened yet.", ms: 3200 },
    { text: 'See what came from it.', small: true, ms: 700 },
  ], { keep: true });
}
