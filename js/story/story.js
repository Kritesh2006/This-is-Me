/* ============================================================
   story.js — the PLAY MY STORY engine.
   One stage (an SVG in screen pixels, with a canvas underneath
   for the driving chapters), one shared character, and a list
   of chapters that each run as an async function. Every chapter
   uses a different mechanic.
   ============================================================ */
import { createCharacter } from '../char/character.js';
import { createAudio } from './audio.js';
import { CHAPTERS } from './chapters.js';
import { loadCar } from './car.js';
import { sfx } from '../sfx.js';

const NS = 'http://www.w3.org/2000/svg';

export function createStory(host, opts) {
  host.innerHTML = '';
  host.className = 'st';
  const reduced = !!opts.reducedMotion;

  /* ---------- DOM ---------- */
  host.innerHTML = `
    <canvas class="st-canvas" aria-hidden="true"></canvas>
    <svg class="st-svg" aria-hidden="true"><defs></defs><g class="st-world"></g><g class="st-fx"></g></svg>
    <div class="st-hot" aria-label="Interactive objects"></div>
    <div class="st-hud">
      <header class="st-bar">
        <p class="st-chapter"><span class="st-ch-n"></span><span class="st-ch-t"></span></p>
        <div class="st-tools">
          <button type="button" class="st-icon st-sound" aria-pressed="true" aria-label="Sound on"><svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="on" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.6"/><path class="off" d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="1.6"/></svg></button>
          <button type="button" class="st-skip">Skip chapter</button>
          <button type="button" class="st-icon st-close" aria-label="Leave the story"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8"/></svg></button>
        </div>
      </header>
      <div class="st-progress" aria-hidden="true"><i></i></div>
      <div class="st-title" aria-live="polite"></div>
      <p class="st-caption" aria-live="polite"></p>
      <div class="st-copilot" hidden><i></i><span></span></div>
      <div class="st-unlock" role="status" aria-live="polite"></div>
      <div class="st-controls"></div>
    </div>
    <div class="st-veil"></div>`;

  const q = (s) => host.querySelector(s);
  const canvas = q('.st-canvas');
  const svg = q('.st-svg');
  const defs = svg.querySelector('defs');
  const world = q('.st-world');
  const fx = q('.st-fx');
  const hot = q('.st-hot');
  const controls = q('.st-controls');
  const veil = q('.st-veil');
  const captionEl = q('.st-caption');
  const titleEl = q('.st-title');
  const unlockEl = q('.st-unlock');
  const copilotEl = q('.st-copilot');
  const ctx2d = canvas.getContext('2d');

  /* ---------- state ---------- */
  let W = 0, H = 0, dpr = 1;
  let alive = true;
  let frameFns = new Set();
  let resizeFns = new Set();
  let skipToken = { skip: false };
  const audio = createAudio();

  const S = {
    host, svg, defs, world, fx, hot, controls, canvas, ctx2d, audio, reduced,
    get W() { return W; }, get H() { return H; }, get dpr() { return dpr; },
    get portrait() { return H > W * 1.05; },
    char: createCharacter({ outfit: 'tee', turn: 0.4 }),
    abilities: new Set(),
    car: loadCar(),
    memories: [],
    el(tag, attrs = {}, parent) {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    },
    g(parent = world, attrs = {}) { return S.el('g', attrs, parent); },
    html(parent, svgString) { // parse an SVG fragment into a group
      const g = S.el('g', {}, parent);
      g.innerHTML = svgString;
      return g;
    },
    onFrame(fn) { frameFns.add(fn); return () => frameFns.delete(fn); },
    onResize(fn) { resizeFns.add(fn); fn(W, H); return () => resizeFns.delete(fn); },
    clearStage() {
      world.innerHTML = ''; fx.innerHTML = ''; hot.innerHTML = ''; controls.innerHTML = '';
      frameFns = new Set([charTick]); resizeFns = new Set();
      ctx2d.setTransform(1, 0, 0, 1, 0, 0); ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.opacity = 0;
      captionEl.classList.remove('on');
      copilotEl.hidden = true;
    },
    wait(ms) {
      const tok = skipToken;
      return new Promise((res) => {
        const t = setTimeout(res, reduced ? Math.min(ms, 700) : ms);
        const iv = setInterval(() => { if (tok.skip || !alive) { clearTimeout(t); clearInterval(iv); res(); } }, 60);
        setTimeout(() => clearInterval(iv), ms + 100);
      });
    },
    get skipped() { return skipToken.skip; },
    caption(text, ms) {
      captionEl.classList.remove('on');
      clearTimeout(S._capT);
      if (!text) return;
      requestAnimationFrame(() => { captionEl.textContent = text; captionEl.classList.add('on'); });
      if (ms) S._capT = setTimeout(() => captionEl.classList.remove('on'), ms);
    },
    async title(big, small, ms = 2200) {
      titleEl.innerHTML = `${small ? `<span class="t-sub">${small}</span>` : ''}<span class="t-big">${big}</span>`;
      titleEl.classList.add('on');
      await S.wait(ms);
      titleEl.classList.remove('on');
      await S.wait(500);
    },
    async card(lines, opts2 = {}) { // big centred lines, one after another
      titleEl.classList.add('on', 'card');
      for (const l of lines) {
        titleEl.innerHTML = `<span class="t-big${l.small ? ' t-small' : ''}">${l.text}</span>`;
        titleEl.classList.remove('beat'); void titleEl.offsetWidth; titleEl.classList.add('beat');
        await S.wait(l.ms || 1600);
      }
      if (!opts2.keep) { titleEl.classList.remove('on', 'card'); await S.wait(400); }
    },
    hideTitle() { titleEl.classList.remove('on', 'card'); },
    async fade(out, ms = 600) {
      veil.style.transitionDuration = (reduced ? 200 : ms) + 'ms';
      veil.classList.toggle('on', out);
      await S.wait(reduced ? 220 : ms);
    },
    chapter(n, t) {
      q('.st-ch-n').textContent = n;
      q('.st-ch-t').textContent = t;
      q('.st-progress i').style.transform = `scaleX(${(CHAPTERS.findIndex((c) => c.title === t) + 1) / CHAPTERS.length})`;
    },
    /* A real button in the control dock. Resolves when pressed. */
    button(label, cls = '') {
      const tok = skipToken;
      return new Promise((res) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'st-btn ' + cls; b.innerHTML = label;
        controls.appendChild(b);
        requestAnimationFrame(() => b.classList.add('in'));
        const done = () => { b.remove(); clearInterval(iv); res(); };
        b.addEventListener('click', () => { audio.tick(); done(); });
        const iv = setInterval(() => { if (tok.skip || !alive) done(); }, 80);
        if (!('ontouchstart' in window)) setTimeout(() => b.focus({ preventScroll: true }), 50);
      });
    },
    /* Press-and-hold ring. Resolves when held long enough. */
    hold(label, ms = 1600) {
      const tok = skipToken;
      return new Promise((res) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'st-hold';
        b.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" class="trk"/><circle cx="50" cy="50" r="46" class="bar" pathLength="1"/></svg><span>${label}</span>`;
        controls.appendChild(b);
        requestAnimationFrame(() => b.classList.add('in'));
        const bar = b.querySelector('.bar');
        let p = 0, holding = false, last = 0, raf = 0;
        const step = (now) => {
          const dt = last ? (now - last) : 0; last = now;
          p = Math.max(0, Math.min(1, p + (holding ? dt / ms : -dt / 500)));
          bar.style.strokeDashoffset = 1 - p;
          if (holding) audio.holdTone(p);
          if (p >= 1) { finish(); return; }
          raf = requestAnimationFrame(step);
        };
        const start = (e) => { e.preventDefault(); holding = true; b.classList.add('down'); };
        const stop = () => { holding = false; b.classList.remove('down'); audio.holdTone(-1); };
        b.addEventListener('pointerdown', start);
        b.addEventListener('pointerup', stop); b.addEventListener('pointerleave', stop); b.addEventListener('pointercancel', stop);
        b.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
        b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') stop(); });
        b.addEventListener('contextmenu', (e) => e.preventDefault());
        raf = requestAnimationFrame(step);
        const iv = setInterval(() => { if (tok.skip || !alive) finish(); }, 80);
        function finish() { cancelAnimationFrame(raf); clearInterval(iv); audio.holdTone(-1); b.remove(); res(); }
        setTimeout(() => b.focus({ preventScroll: true }), 50);
      });
    },
    /* Clickable hotspot over something in the scene (screen coords). */
    hotspot({ label, onTap, cls = '' }) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'st-spot ' + cls;
      b.innerHTML = `<i></i><span>${label}</span>`;
      hot.appendChild(b);
      b.addEventListener('click', () => { audio.tick(); onTap && onTap(b); });
      return {
        el: b,
        place(x, y) { b.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`; },
        done() { b.classList.add('seen'); },
        remove() { b.remove(); },
      };
    },
    prompt(text) {
      let p = controls.querySelector('.st-prompt');
      if (!text) { p && p.remove(); return; }
      if (!p) { p = document.createElement('p'); p.className = 'st-prompt'; controls.prepend(p); }
      p.innerHTML = text;
    },
    unlock(title, text) {
      unlockEl.innerHTML = `<b>Unlocked · ${title}</b><span>${text}</span>`;
      unlockEl.classList.remove('on'); void unlockEl.offsetWidth; unlockEl.classList.add('on');
      audio.unlock();
      clearTimeout(S._unT); S._unT = setTimeout(() => unlockEl.classList.remove('on'), 3400);
    },
    copilot(text) {
      if (!S.abilities.has('copilot')) return;
      copilotEl.hidden = false;
      copilotEl.querySelector('span').textContent = text;
      copilotEl.classList.remove('talk'); void copilotEl.offsetWidth; copilotEl.classList.add('talk');
    },
    placeChar(x, y, h) { // feet at (x,y), height h px
      const s = h / 880;
      S.char.el.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(4)})`);
    },
  };

  const charTick = (dt) => S.char.update(dt);
  frameFns.add(charTick);

  /* ---------- size ---------- */
  function resize() {
    const r = host.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    dpr = Math.min(window.devicePixelRatio || 1, W * H > 1400000 ? 1.5 : 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    resizeFns.forEach((fn) => fn(W, H));
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  /* ---------- loop ---------- */
  let last = 0, raf = 0;
  function loop(now) {
    if (!alive) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    frameFns.forEach((fn) => fn(dt, now / 1000));
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  const onVis = () => { if (document.hidden) { cancelAnimationFrame(raf); audio.suspend(); } else { last = 0; raf = requestAnimationFrame(loop); audio.resume(); } };
  document.addEventListener('visibilitychange', onVis);

  /* ---------- tools ---------- */
  const soundBtn = q('.st-sound');
  const setSound = (on) => { audio.setMuted(!on); sfx.setMuted(!on); soundBtn.setAttribute('aria-pressed', String(on)); soundBtn.setAttribute('aria-label', on ? 'Sound on' : 'Sound off'); };
  soundBtn.addEventListener('click', () => setSound(soundBtn.getAttribute('aria-pressed') !== 'true'));
  setSound(!sfx.muted);
  q('.st-skip').addEventListener('click', () => { skipToken.skip = true; audio.tick(); });
  q('.st-close').addEventListener('click', () => opts.onExit());
  const onKey = (e) => { if (e.key === 'Escape') opts.onExit(); };
  document.addEventListener('keydown', onKey);

  /* ---------- run ---------- */
  (async () => {
    audio.start();
    for (let i = 0; i < CHAPTERS.length && alive; i++) {
      const c = CHAPTERS[i];
      skipToken = { skip: false };
      S.clearStage();
      S.chapter(String(i + 1).padStart(2, '0'), c.title);
      q('.st-skip').hidden = !!c.noSkip;
      try {
        await c.run(S);
      } catch (err) { if (alive) console.error(err); }
      if (!alive) return;
      if (skipToken.skip && c.onSkip) c.onSkip(S);
      S.hideTitle(); S.caption('');
      if (i < CHAPTERS.length - 1) await S.fade(true, 500);
      skipToken = { skip: false };
      if (i < CHAPTERS.length - 1) { S.clearStage(); await S.fade(false, 10); }
    }
    if (!alive) return;
    // the ending offers the portfolio
    await S.wait(200);
    q('.st-skip').hidden = true;
    const b1 = S.button('View my work <i>→</i>', 'st-btn-red');
    const b2 = S.button('Play again', 'st-btn-quiet');
    const which = await Promise.race([b1.then(() => 'work'), b2.then(() => 'again')]);
    if (!alive) return;
    if (which === 'work') opts.onViewWork(); else opts.onReplay();
  })();

  const api = {
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('keydown', onKey);
      audio.stop();
      host.innerHTML = '';
    },
  };
  return api;
}
