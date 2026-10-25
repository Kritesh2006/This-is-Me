/* ============================================================
   story.js — PLAY MY STORY, as a short film you can touch.
   A three.js stage graded like a music video (monochrome + crimson,
   fog, rain, grain, letterbox). The locked 2D character is baked into
   animation frames and lives inside the 3D scenes as a billboard.
   ============================================================ */
import * as THREE from '../../vendor/three.module.min.js';
import { createAudio } from './audio.js';
import { sfx } from '../sfx.js';
import { bake } from './sprites.js';
import { SHOTS } from './shots/index.js';

export function createStory(host, opts) {
  const reduced = !!opts.reducedMotion;
  host.className = 'st film';
  host.innerHTML = `
    <canvas class="st-gl" aria-hidden="true"></canvas>
    <div class="fx-grain" aria-hidden="true"></div>
    <div class="fx-vignette" aria-hidden="true"></div>
    <div class="fx-bars" aria-hidden="true"><i></i><i></i></div>
    <div class="fx-white" aria-hidden="true"></div>
    <div class="fx-glitch" aria-hidden="true"></div>
    <div class="st-hot"></div>
    <div class="st-hud">
      <header class="st-bar">
        <p class="st-chapter"><span class="st-ch-n"></span><span class="st-ch-t"></span></p>
        <div class="st-tools">
          <button type="button" class="st-icon st-sound" aria-pressed="true" aria-label="Sound on"><svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="on" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.6"/><path class="off" d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="1.6"/></svg></button>
          <button type="button" class="st-skip">Skip scene</button>
          <button type="button" class="st-icon st-close" aria-label="Leave the story"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8"/></svg></button>
        </div>
      </header>
      <div class="st-progress" aria-hidden="true"><i></i></div>
      <div class="st-title" aria-live="polite"></div>
      <p class="st-caption" aria-live="polite"></p>
      <div class="st-unlock" role="status" aria-live="polite"></div>
      <div class="st-controls"></div>
    </div>
    <div class="st-veil on"></div>
    <div class="st-boot"><span>KRITESH</span><i><b></b></i><em>Loading the film</em></div>`;
  const q = (s) => host.querySelector(s);
  const canvas = q('.st-gl'), hot = q('.st-hot'), controls = q('.st-controls');
  const veil = q('.st-veil'), white = q('.fx-white'), glitch = q('.fx-glitch'), bars = q('.fx-bars');
  const captionEl = q('.st-caption'), titleEl = q('.st-title'), unlockEl = q('.st-unlock');

  /* ---------- renderer ---------- */
  const small = Math.min(innerWidth, innerHeight) < 600;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  let W = 0, H = 0, dpr = 1;
  let scene = new THREE.Scene();
  let camera = new THREE.PerspectiveCamera(45, 1, 0.05, 600);

  let alive = true, frameFns = new Set(), resizeFns = new Set(), skipTok = { skip: false };
  const audio = createAudio();
  const raycaster = new THREE.Raycaster();

  function resize() {
    W = host.clientWidth; H = host.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    resizeFns.forEach((fn) => fn(W, H));
  }
  const ro = new ResizeObserver(resize); ro.observe(host);

  /* ---------- shared film context ---------- */
  const F = {
    THREE, renderer, audio, reduced, small, host, controls, hot,
    get scene() { return scene; }, get camera() { return camera; },
    get W() { return W; }, get H() { return H; },
    get portrait() { return H > W * 1.05; },
    get skipped() { return skipTok.skip; },
    sprites: {},
    abilities: new Set(),
    onFrame(fn) { frameFns.add(fn); return () => frameFns.delete(fn); },
    onResize(fn) { resizeFns.add(fn); fn(W, H); return () => resizeFns.delete(fn); },
    newScene({ fog = 0x000000, density = 0.03, bg = 0x000000, fov = 45 } = {}) {
      disposeScene();
      scene = new THREE.Scene();
      scene.background = new THREE.Color(bg);
      scene.fog = new THREE.FogExp2(fog, density);
      const lens = (w, h) => (h > w * 1.05 ? Math.min(fov * 1.45, 78) : fov);
      camera = new THREE.PerspectiveCamera(lens(W, H), W / H || 1, 0.05, 600);
      frameFns = new Set(); resizeFns = new Set([(w, h) => { camera.aspect = w / h; camera.fov = lens(w, h); camera.updateProjectionMatrix(); }]);
      hot.innerHTML = ''; controls.innerHTML = '';
      captionEl.classList.remove('on');
      return scene;
    },
    wait(ms) {
      const tok = skipTok;
      return new Promise((res) => {
        const t0 = performance.now(), lim = reduced ? Math.min(ms, 900) : ms;
        const iv = setInterval(() => { if (tok.skip || !alive || performance.now() - t0 >= lim) { clearInterval(iv); res(); } }, 40);
      });
    },
    until(fn) { const tok = skipTok; return new Promise((res) => { const iv = setInterval(() => { if (tok.skip || !alive || fn()) { clearInterval(iv); res(); } }, 60); }); },
    caption(text, ms) {
      captionEl.classList.remove('on'); clearTimeout(F._c);
      if (!text) return;
      requestAnimationFrame(() => { captionEl.textContent = text; captionEl.classList.add('on'); });
      if (ms) F._c = setTimeout(() => captionEl.classList.remove('on'), ms);
    },
    async card(lines, { keep = false, dark = false } = {}) {
      titleEl.classList.toggle('dark', dark);
      titleEl.classList.add('on', 'card');
      for (const l of lines) {
        titleEl.innerHTML = `${l.sub ? `<span class="t-sub">${l.sub}</span>` : ''}<span class="t-big${l.small ? ' t-small' : ''}">${l.text}</span>`;
        titleEl.classList.remove('beat'); void titleEl.offsetWidth; titleEl.classList.add('beat');
        await F.wait(l.ms || 1800);
      }
      if (!keep) { titleEl.classList.remove('on', 'card'); await F.wait(450); }
    },
    hideCard() { titleEl.classList.remove('on', 'card', 'dark'); },
    async fade(out, ms = 700) { veil.style.transitionDuration = ms + 'ms'; veil.classList.toggle('on', out); await F.wait(ms); },
    whiteout(v, ms = 1200) { white.style.transitionDuration = ms + 'ms'; white.style.opacity = v; },
    glitch(on) { glitch.classList.toggle('on', on); },
    bars(on) { bars.classList.toggle('on', on); },
    button(label, cls = '') {
      const tok = skipTok;
      return new Promise((res) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'st-btn ' + cls; b.innerHTML = label;
        controls.appendChild(b); requestAnimationFrame(() => b.classList.add('in'));
        const done = () => { clearInterval(iv); b.remove(); res(); };
        b.addEventListener('click', done);
        const iv = setInterval(() => { if (tok.skip || !alive) done(); }, 80);
      });
    },
    hold(label, ms = 1700) {
      const tok = skipTok;
      return new Promise((res) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'st-hold';
        b.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" class="trk"/><circle cx="50" cy="50" r="46" class="bar" pathLength="1"/></svg><span>${label}</span>`;
        controls.appendChild(b); requestAnimationFrame(() => b.classList.add('in'));
        const bar = b.querySelector('.bar');
        let p = 0, down = false, last = 0, raf = 0;
        const step = (now) => {
          const dt = last ? now - last : 0; last = now;
          p = Math.max(0, Math.min(1, p + (down ? dt / ms : -dt / 500)));
          bar.style.strokeDashoffset = 1 - p;
          F.holdProgress = p;
          if (down) audio.holdTone(p);
          if (p >= 1) return finish();
          raf = requestAnimationFrame(step);
        };
        const on = (e) => { e.preventDefault(); down = true; b.classList.add('down'); };
        const off = () => { down = false; b.classList.remove('down'); audio.holdTone(-1); };
        b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
        b.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) on(e); });
        b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') off(); });
        b.addEventListener('contextmenu', (e) => e.preventDefault());
        raf = requestAnimationFrame(step);
        const iv = setInterval(() => { if (tok.skip || !alive) finish(); }, 80);
        function finish() { cancelAnimationFrame(raf); clearInterval(iv); audio.holdTone(-1); F.holdProgress = 0; b.remove(); res(); }
      });
    },
    prompt(text) {
      let p = controls.querySelector('.st-prompt');
      if (!text) { p && p.remove(); return; }
      if (!p) { p = document.createElement('p'); p.className = 'st-prompt'; controls.prepend(p); }
      p.innerHTML = text;
    },
    unlock(title, text) {
      unlockEl.innerHTML = `<b>${title}</b><span>${text}</span>`;
      unlockEl.classList.remove('on'); void unlockEl.offsetWidth; unlockEl.classList.add('on');
      audio.unlock();
      clearTimeout(F._u); F._u = setTimeout(() => unlockEl.classList.remove('on'), 3200);
    },
    /* screen position of a 3D point (for HTML labels) */
    toScreen(v) {
      const p = v.clone().project(camera);
      return [(p.x * 0.5 + 0.5) * W, (-p.y * 0.5 + 0.5) * H, p.z < 1];
    },
    /* objects under a pointer event */
    pick(e, objects) {
      const r = canvas.getBoundingClientRect();
      const m = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(m, camera);
      return raycaster.intersectObjects(objects, true);
    },
    /* --- texture helpers --- */
    canvasTex(w, h, draw) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return t;
    },
    glowTex(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
      return F.canvasTex(128, 128, (g, w, h) => {
        const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gr.addColorStop(0, inner); gr.addColorStop(0.25, inner.replace(/[\d.]+\)$/, '0.55)')); gr.addColorStop(1, outer);
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      });
    },
    glow(color = 0xffffff, size = 1, opacity = 1) {
      const m = new THREE.SpriteMaterial({ map: F._glow || (F._glow = F.glowTex()), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
      const s = new THREE.Sprite(m); s.scale.set(size, size, 1); return s;
    },
    /* --- the character as a billboard, playing a baked atlas --- */
    character(key, height = 1.8) {
      const sp = F.sprites[key];
      let tex = new THREE.CanvasTexture(sp.canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(1 / sp.cols, 1 / sp.rows);
      tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
      const geo = new THREE.PlaneGeometry(height * sp.aspect, height);
      geo.translate(0, height * (0.5 - (1 - sp.feet)), 0); // origin at the feet
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04, side: THREE.DoubleSide, fog: true });
      const mesh = new THREE.Mesh(geo, mat);
      const api = {
        mesh, mat,
        frame(i) {
          const s = F.sprites[api.key];
          const k = ((i % s.n) + s.n) % s.n;
          tex.offset.set((k % s.cols) / s.cols, 1 - (Math.floor(k / s.cols) + 1) / s.rows);
        },
        key,
        use(k2) { // swap to another atlas (new texture: atlases differ in size)
          const s2 = F.sprites[k2];
          const t2 = new THREE.CanvasTexture(s2.canvas);
          t2.colorSpace = THREE.SRGBColorSpace; t2.repeat.set(1 / s2.cols, 1 / s2.rows);
          tex.dispose(); tex = t2; mat.map = t2; mat.needsUpdate = true;
          api.key = k2; api.frame(0);
        },
      };
      api.frame(0);
      return api;
    },
  };

  function disposeScene() {
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => { for (const k in m) if (m[k] && m[k].isTexture && m[k] !== F._glow) m[k].dispose(); m.dispose(); });
      if (o.isReflector && o.dispose) o.dispose();
    });
  }

  /* ---------- loop ---------- */
  let last = 0, raf = 0, slowFrames = 0;
  function loop(now) {
    if (!alive) return;
    const dt = Math.min(0.25, last ? (now - last) / 1000 : 0.016); last = now;
    frameFns.forEach((fn) => fn(dt, now / 1000));
    renderer.render(scene, camera);
    // adaptive resolution if the device struggles
    if (dt > 0.034) { if (++slowFrames > 40 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); slowFrames = 0; } } else slowFrames = Math.max(0, slowFrames - 1);
    raf = requestAnimationFrame(loop);
  }
  const onVis = () => { if (document.hidden) { cancelAnimationFrame(raf); audio.suspend(); } else { last = 0; raf = requestAnimationFrame(loop); audio.resume(); } };
  document.addEventListener('visibilitychange', onVis);

  /* ---------- tools ---------- */
  const soundBtn = q('.st-sound');
  const setSound = (on) => { audio.setMuted(!on); sfx.setMuted(!on); soundBtn.setAttribute('aria-pressed', String(on)); soundBtn.setAttribute('aria-label', on ? 'Sound on' : 'Sound off'); };
  soundBtn.addEventListener('click', () => setSound(soundBtn.getAttribute('aria-pressed') !== 'true'));
  setSound(!sfx.muted);
  q('.st-skip').addEventListener('click', () => { skipTok.skip = true; });
  q('.st-close').addEventListener('click', () => opts.onExit());
  const onKey = (e) => { if (e.key === 'Escape') opts.onExit(); };
  document.addEventListener('keydown', onKey);

  /* ---------- run ---------- */
  (async () => {
    resize();
    audio.start();
    // bake the character into frames (a second or two)
    const barEl = q('.st-boot b');
    const jobs = [
      ['walkBackTee', 'walkBack', 'whitetee', 12], ['walkBackHood', 'walkBack', 'hoodie', 12],
      ['idleBackHood', 'idleBack', 'hoodie', 4], ['idleBackTee', 'idleBack', 'whitetee', 4],
      ['type', 'type', 'hoodie', 6], ['idleFront', 'idleFront', 'hoodie', 6],
    ];
    for (let i = 0; i < jobs.length && alive; i++) {
      const [key, kind, outfit, n] = jobs[i];
      F.sprites[key] = await bake(kind, outfit, n, small ? 192 : 256);
      barEl.style.transform = `scaleX(${(i + 1) / jobs.length})`;
    }
    if (!alive) return;
    q('.st-boot').classList.add('out');
    raf = requestAnimationFrame(loop);
    for (let i = 0; i < SHOTS.length && alive; i++) {
      const s = SHOTS[i];
      skipTok = { skip: false };
      q('.st-ch-n').textContent = String(i + 1).padStart(2, '0');
      q('.st-ch-t').textContent = s.title;
      q('.st-progress i').style.transform = `scaleX(${(i + 1) / SHOTS.length})`;
      q('.st-skip').hidden = !!s.noSkip;
      try { await s.run(F); } catch (err) { if (alive) console.error(err); }
      if (!alive) return;
      F.caption(''); F.prompt('');
      if (i < SHOTS.length - 1) { F.hideCard(); await F.fade(true, 600); F.whiteout(0, 10); F.glitch(false); }
    }
    if (!alive) return;
    q('.st-skip').hidden = true;
    const which = await Promise.race([F.button('View my work <i>→</i>', 'st-btn-red').then(() => 'w'), F.button('Watch again', 'st-btn-quiet').then(() => 'a')]);
    if (!alive) return;
    if (which === 'w') opts.onViewWork(); else opts.onReplay();
  })();

  const api = {
    destroy() {
      alive = false; cancelAnimationFrame(raf); ro.disconnect();
      document.removeEventListener('visibilitychange', onVis); document.removeEventListener('keydown', onKey);
      audio.stop(); disposeScene(); renderer.dispose();
      host.innerHTML = '';
    },
  };
  return api;
}
