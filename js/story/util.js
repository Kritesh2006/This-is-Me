/* util.js — small helpers shared by the chapters */
export const ease = {
  io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  lin: (t) => t,
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function tween(S, ms, fn, e = ease.io) {
  return new Promise((res) => {
    if (S.reduced) ms = Math.min(ms, 250);
    let t = 0;
    const off = S.onFrame((dt) => {
      t += (dt * 1000) / ms;
      if (S.skipped) t = 1;
      const k = Math.min(1, t);
      fn(e(k), k);
      if (k >= 1) { off(); res(); }
    });
  });
}

export function hexMix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, t)), g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t)), bl = Math.round(lerp(pa & 255, pb & 255, t));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* Fit a design box (bw×bh) into the screen. Content that must stay visible
   lives inside x ∈ [safeX, bw - safeX]. The box sits above the control dock. */
export function fitBox(S, bw, bh, safeX = 120, dock = 0.14) {
  const W = S.W, H = S.H;
  const avail = H * (1 - dock);
  const k = Math.min(W / (bw - safeX * 2), avail / bh, 1.35);
  const ox = (W - bw * k) / 2;
  const oy = Math.max(0, (avail - bh * k) * 0.55);
  return { k, ox, oy, toScreen: (x, y) => [ox + x * k, oy + y * k], transform: `translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${k.toFixed(4)})` };
}

/* Pointer / key "hold" input on the whole stage. */
export function holdInput(S, onChange) {
  let down = false;
  const set = (v) => { if (v !== down) { down = v; onChange(v); } };
  const tgt = S.host;
  const pd = (e) => { if (e.target.closest('button, input, .st-bar')) return; set(true); };
  const pu = () => set(false);
  const kd = (e) => { if (['ArrowRight', 'ArrowUp', 'KeyD', 'KeyW', 'Space'].includes(e.code) && !e.target.closest('button,input')) { e.preventDefault(); set(true); } };
  const ku = (e) => { if (['ArrowRight', 'ArrowUp', 'KeyD', 'KeyW', 'Space'].includes(e.code)) set(false); };
  tgt.addEventListener('pointerdown', pd); window.addEventListener('pointerup', pu); window.addEventListener('pointercancel', pu);
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  return {
    get down() { return down; },
    set(v) { set(v); },
    off() { tgt.removeEventListener('pointerdown', pd); window.removeEventListener('pointerup', pu); window.removeEventListener('pointercancel', pu); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); },
  };
}

/* An on-screen hold pad (for thumbs) that also mirrors keyboard/stage holds. */
export function holdPad(S, label, input) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'st-pad';
  b.innerHTML = `<span class="pad-dot"></span><span>${label}</span>`;
  S.controls.appendChild(b);
  requestAnimationFrame(() => b.classList.add('in'));
  const on = (e) => { e.preventDefault(); input.set(true); };
  const offF = () => input.set(false);
  b.addEventListener('pointerdown', on);
  b.addEventListener('pointerup', offF); b.addEventListener('pointerleave', offF); b.addEventListener('pointercancel', offF);
  b.addEventListener('contextmenu', (e) => e.preventDefault());
  b.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); input.set(true); } });
  b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') input.set(false); });
  return { el: b, active(v) { b.classList.toggle('down', v); }, remove() { b.remove(); } };
}
