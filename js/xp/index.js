/* xp/index.js — owns the WebGL renderer and switches between the
   garage and the road. Loaded only when a visitor presses Enter,
   so portfolio-only visitors never download three.js. */
import * as THREE from 'three';
import { TIERS, guessTier, refineTier, Governor } from './quality.js';
import { fontsReady } from './tex.js';
import { createCar } from './car.js';
import { createGarage, buildEnvMap } from './garage.js';
import { createDrive } from './drive.js';

export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export async function createExperience({ onEnd } = {}) {
  const host = document.getElementById('canvasHost');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tierName = guessTier();
  const renderer = new THREE.WebGLRenderer({ antialias: TIERS[tierName].aa, powerPreference: 'high-performance', alpha: false });
  tierName = refineTier(tierName, renderer.getContext());
  const tier = TIERS[tierName];
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  const gov = new Governor(renderer, tier);
  const size = () => { renderer.setSize(host.clientWidth, host.clientHeight, false); };
  size();

  await fontsReady();
  const envMap = buildEnvMap(renderer, tier.env);
  const camera = new THREE.PerspectiveCamera(32, host.clientWidth / host.clientHeight, 0.1, 1200);
  const car = createCar({ envMap });
  const garage = createGarage({ renderer, car, camera, reduced });
  garage.scene.environment = envMap;
  const drive = createDrive({ car, camera, tier, reduced, onEnd });

  let mode = null, running = false, raf = 0, last = 0;
  const veil = document.getElementById('darkVeil');

  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (t - last) / 1000 || 0.016); last = t;
    gov.tick(dt);
    if (mode === 'garage') { garage.update(dt); renderer.render(garage.scene, camera); }
    else if (mode === 'drive') { drive.update(dt); renderer.render(drive.scene, camera); }
  }
  function start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  const onResize = () => {
    size();
    if (mode === 'garage') garage.frame(host.clientWidth, host.clientHeight);
    else if (mode === 'drive') drive.resize();
  };
  addEventListener('resize', onResize);
  new ResizeObserver(onResize).observe(host);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (mode) start(); });

  const fade = (on) => new Promise((r) => { veil.style.transitionDuration = '.55s'; veil.style.opacity = on ? '1' : '0'; setTimeout(r, reduced ? 0 : 560); });

  function panels(which) {
    document.getElementById('garage').hidden = which !== 'garage';
    document.getElementById('hud').hidden = which !== 'drive';
    document.getElementById('ending').hidden = true;
    document.body.classList.toggle('mode-drive', which === 'drive');
  }

  return {
    tier: tierName,
    async showGarage() {
      if (mode === 'drive') { await fade(true); drive.leave(); }
      mode = 'garage'; panels('garage');
      size(); garage.refresh(); garage.enter(host.clientWidth, host.clientHeight);
      start(); await fade(false);
    },
    async startDrive() {
      await fade(true);
      garage.leave();
      mode = 'drive'; panels('drive');
      size(); drive.enter();
      start(); await fade(false);
    },
    pause() { stop(); if (mode === 'drive') drive.leave(); mode = null; },
    get mode() { return mode; },
    debug: { drive, garage, renderer, gov },
  };
}
