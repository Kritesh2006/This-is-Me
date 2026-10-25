/* garage.js — the showroom scene and the customizer panel. */
import * as THREE from 'three';
import { radial } from './tex.js';
import * as C from './car.js';
import { get, set, unlocks } from '../store.js';
import { sfx } from '../audio.js';

/** Studio environment used for reflections everywhere: a dark room
    with one long white softbox, a crimson wall light and a green one. */
export function buildEnvMap(renderer, size) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050505');
  const box = new THREE.Mesh(new THREE.BoxGeometry(30, 14, 30), new THREE.MeshBasicMaterial({ color: '#0c0c0c', side: THREE.BackSide }));
  scene.add(box);
  const panel = (w, h, color, pos, rot = [0, 0, 0]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.position.set(...pos); m.rotation.set(...rot); scene.add(m);
  };
  panel(16, 2.2, '#f4efe6', [0, 6.8, 0], [Math.PI / 2, 0, 0]);
  panel(3, 10, '#ffffff', [0, 2, -14.5]);
  panel(4, 6, new THREE.Color('#d52320').multiplyScalar(2.2), [-14.5, 2, 2], [0, Math.PI / 2, 0]);
  panel(4, 6, new THREE.Color('#1c8a55').multiplyScalar(1.6), [14.5, 2, -3], [0, -Math.PI / 2, 0]);
  panel(30, 0.5, '#6d6a64', [0, 0.2, 14.5]);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(scene, 0.035, 0.1, 100, { size });
  pm.dispose();
  scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  return rt.texture;
}

export function createGarage({ renderer, car, camera, reduced }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050505');
  scene.fog = new THREE.Fog('#050505', 12, 34);

  // floor: dark, slightly glossy; picks up the env map
  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshStandardMaterial({ color: '#0b0b0b', roughness: 0.55, metalness: 0.3, envMapIntensity: 0.35 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // turntable disc + thin ring
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 0.03, 96), new THREE.MeshStandardMaterial({ color: '#121212', roughness: 0.42, metalness: 0.4, envMapIntensity: 0.4 }));
  plate.position.y = -0.01; scene.add(plate);
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.62, 3.65, 128), new THREE.MeshBasicMaterial({ color: '#4a4844' }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; scene.add(ring);
  const arc = new THREE.Mesh(new THREE.RingGeometry(3.62, 3.66, 64, 1, -0.5, 1.0), new THREE.MeshBasicMaterial({ color: '#d52320' }));
  arc.rotation.x = -Math.PI / 2; arc.position.y = 0.013; scene.add(arc);

  // light pools on the floor (fake area lights)
  const pool = radial([[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
  const addPool = (color, x, z, s, op) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: pool, color, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.004, z); scene.add(m);
  };
  addPool('#d52320', -7, -5, 10, 0.22);
  addPool('#1f7a4c', 7, -6, 10, 0.18);

  // back wall: a dark curved cyclorama with one brake-light seam
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(16, 16, 9, 64, 1, true, Math.PI * 0.62, Math.PI * 0.76), new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.9, side: THREE.BackSide }));
  wall.position.y = 4.5; scene.add(wall);
  const seam = new THREE.Mesh(new THREE.CylinderGeometry(15.9, 15.9, 0.04, 64, 1, true, Math.PI * 0.7, Math.PI * 0.6), new THREE.MeshBasicMaterial({ color: '#d52320', side: THREE.BackSide }));
  seam.position.y = 0.9; scene.add(seam);
  const top = new THREE.Mesh(new THREE.BoxGeometry(9, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: '#cfcac0' }));
  top.position.set(0, 6.2, -3); scene.add(top);

  scene.add(new THREE.HemisphereLight('#2a2a2a', '#050505', 0.6));
  const key = new THREE.DirectionalLight('#fff4e6', 2.2); key.position.set(2, 8, 4); scene.add(key);
  const red = new THREE.PointLight('#ff2a20', 16, 16, 1.6); red.position.set(-6, 1.8, -5); scene.add(red);
  const green = new THREE.PointLight('#2bbf78', 12, 16, 1.6); green.position.set(6, 1.6, -6); scene.add(green);
  const rim = new THREE.PointLight('#ffffff', 10, 14, 1.8); rim.position.set(0, 3, -6); scene.add(rim);

  /* ---- orbit by drag ---- */
  const host = renderer.domElement.parentElement;
  let baseZ = 10, yaw = Math.PI * 0.78, vel = 0, dragging = false, lastX = 0, idleT = 0, introT = 0;
  const onDown = (e) => { if (!active) return; dragging = true; lastX = e.clientX; vel = 0; host.classList.add('dragging'); };
  const onMove = (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; vel = dx * 0.006; yaw += vel; idleT = 0; hideHint(); };
  const onUp = () => { dragging = false; host.classList.remove('dragging'); };
  host.addEventListener('pointerdown', onDown);
  addEventListener('pointermove', onMove);
  addEventListener('pointerup', onUp);
  addEventListener('pointercancel', onUp);
  let hinted = false;
  function hideHint() { if (hinted) return; hinted = true; document.getElementById('garageHint').textContent = 'Changes apply instantly.'; }

  let active = false;
  let viewOffset = { x: 0, y: 0 };

  function frame(w, h) {
    const narrow = w < 900;
    camera.fov = narrow ? 42 : 30;
    // fit the car's length into the view
    const aspect = w / h;
    const hf = 2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * aspect);
    const dist = Math.max(narrow ? 7 : 10.5, (5.0 * (narrow ? 0.98 : 1.35)) / (2 * Math.tan(hf / 2)) + (narrow ? 1.2 : 2.4));
    baseZ = dist;
    camera.position.set(0, narrow ? 2.4 : 2.1, dist);
    camera.lookAt(0, 0.55, 0);
    camera.aspect = aspect;
    // shift the car away from the panels: up on phones, left on desktop
    const builder = document.querySelector('.builder');
    const bh = builder ? builder.getBoundingClientRect().height : 0;
    viewOffset = narrow ? { x: 0, y: bh * 0.36 } : { x: Math.min(260, w * 0.12), y: -h * 0.02 };
    camera.setViewOffset(w, h, viewOffset.x, viewOffset.y, w, h);
    camera.updateProjectionMatrix();
    document.documentElement.style.setProperty('--builder-h', `${bh}px`);
  }

  function update(dt) {
    introT = Math.min(1, introT + dt * 0.6);
    if (!dragging) {
      vel *= Math.pow(0.04, dt);
      idleT += dt;
      yaw += vel;
      if (idleT > 2.5 && !reduced) yaw += dt * 0.12;
    }
    car.group.rotation.y = yaw;
    car.update(dt, 0, 0);
    // a slow push-in on arrival
    const ease = 1 - Math.pow(1 - introT, 3);
    camera.position.z = baseZ + (1 - ease) * 3;
  }

  function enter(w, h) {
    active = true; introT = reduced ? 1 : 0;
    scene.add(car.group);
    car.group.position.set(0, 0, 0);
    car.setBrake(0); car.setLights(1); car.setEnvIntensity(1);
    frame(w, h);
  }
  function leave() { active = false; camera.clearViewOffset(); }

  // keep the Drive button and framing clear of the panel when its height changes
  new ResizeObserver(() => { if (active) frame(renderer.domElement.parentElement.clientWidth, renderer.domElement.parentElement.clientHeight); }).observe(document.querySelector('.builder'));

  /* ---- customizer panel ---- */
  const pane = document.getElementById('pane');
  const tabs = [...document.querySelectorAll('.builder-tabs [role=tab]')];
  let tab = 'paint';
  const saved = get('car', null);
  let cfg = car.apply(sanitize(saved || C.DEFAULT_CONFIG));

  function sanitize(c) {
    const out = { ...C.DEFAULT_CONFIG, ...c };
    const p = C.PAINTS.find((x) => x.id === out.paint);
    if (!p || (p.unlock && !unlocks.has(p.unlock))) out.paint = C.DEFAULT_CONFIG.paint;
    return out;
  }

  const GROUPS = {
    paint: [['Colour', 'paint', C.PAINTS, 'swatch'], ['Finish', 'finish', C.FINISHES]],
    wheels: [['Style', 'wheel', C.WHEELS], ['Finish', 'wheelFinish', C.WHEEL_FINISH, 'swatch']],
    body: [['Ride height', 'height', C.HEIGHTS], ['Aero', 'kit', C.KITS], ['Trim', 'accent', C.ACCENTS, 'swatch']],
    lights: [['Headlights', 'head', C.HEADS], ['Tail lights', 'tail', C.TAILS], ['Underglow', 'glow', C.GLOWS], ['Glass', 'tint', C.TINTS]],
  };

  function render() {
    pane.setAttribute('aria-labelledby', `tab-${tab}`);
    pane.innerHTML = GROUPS[tab].map(([label, key, list, style]) => {
      const cur = list.find((o) => o.id === cfg[key]) || list[0];
      const opts = list.map((o) => {
        const locked = o.unlock && !unlocks.has(o.unlock);
        const pressed = o.id === cfg[key];
        const name = locked ? `${o.label}, locked. ${o.hint}` : o.label;
        return style === 'swatch'
          ? `<button type="button" class="swatch${locked ? ' locked' : ''}" style="--c:${o.hex}" data-k="${key}" data-v="${o.id}" aria-pressed="${pressed}" aria-label="${name}" title="${name}"></button>`
          : `<button type="button" class="chip${locked ? ' locked' : ''}" data-k="${key}" data-v="${o.id}" aria-pressed="${pressed}">${o.label}</button>`;
      }).join('');
      return `<fieldset class="opt-group"><legend>${label} <b>${cur.label}</b></legend><div class="opt-row">${opts}</div></fieldset>`;
    }).join('');
  }

  pane.addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]'); if (!b) return;
    const { k, v } = b.dataset;
    const list = Object.values(GROUPS).flat().find((g) => g[1] === k)[2];
    const o = list.find((x) => x.id === v);
    if (o.unlock && !unlocks.has(o.unlock)) { toast(`${o.label} is locked. ${o.hint} to unlock it.`); return; }
    cfg = car.apply({ [k]: v }); set('car', cfg); sfx('click'); render();
    pane.querySelector(`[data-k="${k}"][data-v="${v}"]`)?.focus();
    hideHint();
  });

  tabs.forEach((t) => t.addEventListener('click', () => selectTab(t.dataset.tab)));
  tabs.forEach((t, i) => t.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
    const n = tabs[(i + d + tabs.length) % tabs.length]; selectTab(n.dataset.tab); n.focus();
  }));
  function selectTab(id) {
    tab = id;
    tabs.forEach((t) => { const on = t.dataset.tab === id; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    render(); sfx('click');
  }
  tabs.forEach((t) => (t.tabIndex = t.dataset.tab === tab ? 0 : -1));
  render();

  let toastTimer;
  function toast(msg) {
    const el = document.getElementById('toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  return { scene, update, enter, leave, frame, refresh: () => { cfg = car.apply(sanitize(cfg)); render(); } };
}
