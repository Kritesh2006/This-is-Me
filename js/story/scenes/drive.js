/* drive.js — the side-scrolling road (canvas) with the car (SVG) on top.
   Worlds blend into each other, which is how the reroute transforms
   Ohio into California without a cut. */
import { buildCar, seatDriver } from '../car.js';
import { holdInput, holdPad, hexMix, lerp, clamp } from '../util.js';

export const ENVS = {
  ohio: { skyTop: '#27313D', skyBot: '#8E98A4', far: '#56616D', mid: '#3B434D', ground: '#D3D9DE', road: '#2C3034', line: '#E9E4D6', snow: 1, stars: 0.1, sun: 0, night: 0.55, kinds: ['house', 'bare', 'house', 'bare', 'campus', 'bare'] },
  cali: { skyTop: '#33467A', skyBot: '#F4A867', far: '#9A6152', mid: '#3D2A2A', ground: '#B98F68', road: '#35302E', line: '#F1D9A0', snow: 0, stars: 0, sun: 1, night: 0.1, kinds: ['palm', 'stucco', 'palm', 'palm', 'stucco', 'pole'] },
  dark: { skyTop: '#010202', skyBot: '#070909', far: '#040505', mid: '#070808', ground: '#090A0A', road: '#0E0F0F', line: '#3A3A36', snow: 0, stars: 0.25, sun: 0, night: 1, kinds: ['none', 'none', 'post', 'none'] },
  nc: { skyTop: '#0A1913', skyBot: '#3D5A4B', far: '#172A21', mid: '#0E1B15', ground: '#13221B', road: '#1C2220', line: '#D9D3C4', snow: 0, stars: 0.3, sun: 0, night: 0.75, kinds: ['pine', 'tower', 'pine', 'house', 'tower', 'pine'] },
  dawn: { skyTop: '#1A2A3A', skyBot: '#E7A27A', far: '#3F4E52', mid: '#1C2622', ground: '#1E2B24', road: '#232927', line: '#F1ECE2', snow: 0, stars: 0, sun: 0.6, night: 0.2, kinds: ['pine', 'pine', 'none', 'pine'] },
};

const hash = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

export function createDrive(S, cfg) {
  const ctx = S.ctx2d;
  S.canvas.style.opacity = 1;
  let A = ENVS[cfg.env], B = A, mix = 1, mixRate = 0;
  const E = {}; // current blended env
  function blend() {
    for (const k of ['skyTop', 'skyBot', 'far', 'mid', 'ground', 'road', 'line']) E[k] = hexMix(A[k], B[k], mix);
    for (const k of ['snow', 'stars', 'sun', 'night']) E[k] = lerp(A[k], B[k], mix);
  }
  blend();

  // car overlay
  const carLayer = S.g(S.world);
  const car = buildCar(carLayer, S.car);
  seatDriver(S.char, car.slot);
  const trail = S.g(S.world); // ghost cars for the memory trail
  S.world.insertBefore(trail, carLayer);

  let W = 0, H = 0, u = 1, gy = 0, carX = 0, carScale = 1;
  S.onResize((w, h) => {
    W = w; H = h;
    u = Math.min(h / 900, w / 520);
    gy = h * (S.portrait ? 0.7 : 0.76);
    const cw = Math.min(w * (S.portrait ? 0.78 : 0.42), 620);
    carScale = cw / 580;
    carX = S.portrait ? w * 0.06 : w * 0.16;
  });

  let d = 0, v = 0, t = 0, ended = false, stopAt = cfg.length, braking = false;
  let vCruise = cfg.cruise ?? 120; const vMax = (cfg.max || 360) * (S.abilities.has('tune') ? 1.35 : 1);
  const events = (cfg.events || []).slice().sort((a, b) => a.at - b.at);
  const signs = cfg.signs || [];
  let ei = 0;
  const flakes = Array.from({ length: S.reduced ? 0 : 70 }, (_, i) => ({ x: hash(i, 1), y: hash(i, 2), z: 0.4 + hash(i, 3) * 0.8 }));
  let scanX = -1, scanT = 0;
  const ghosts = [];

  const input = holdInput(S, (on) => pad && pad.active(on));
  let pad = cfg.noPad ? null : holdPad(S, 'Hold to drive', input);
  if (!cfg.noPad) S.prompt(cfg.prompt || 'Hold anywhere to drive. Let go to cruise.');
  S.audio.engine(0.2, true);

  /* ---------------- drawing ---------------- */
  function sky() {
    const g = ctx.createLinearGradient(0, 0, 0, gy);
    g.addColorStop(0, E.skyTop); g.addColorStop(1, E.skyBot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, gy + 2);
    if (E.stars > 0.02) {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 60; i++) { ctx.globalAlpha = E.stars * (0.4 + hash(i, 9) * 0.6); ctx.fillRect(hash(i, 7) * W, hash(i, 8) * gy * 0.6, 1.5, 1.5); }
      ctx.globalAlpha = 1;
    }
    if (E.sun > 0.02) {
      const sx = W * 0.72, sy = gy * 0.78;
      const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 220 * u);
      rg.addColorStop(0, `rgba(255,214,150,${0.9 * E.sun})`); rg.addColorStop(0.2, `rgba(255,190,120,${0.5 * E.sun})`); rg.addColorStop(1, 'rgba(255,170,110,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, gy);
      ctx.fillStyle = `rgba(255,226,180,${E.sun})`; ctx.beginPath(); ctx.arc(sx, sy, 34 * u, 0, Math.PI * 2); ctx.fill();
    }
  }
  function ridge(par, amp, base, col, f1, f2) {
    const off = d * u * par;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, gy);
    for (let x = 0; x <= W + 20; x += 16) {
      const wx = (x + off) / u;
      const y = gy - base * u - (Math.sin(wx * f1) * 0.6 + Math.sin(wx * f2 + 1.7) * 0.4) * amp * u;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, gy); ctx.closePath(); ctx.fill();
  }
  function kindAt(i) {
    const ka = A.kinds[Math.floor(hash(i, 4) * A.kinds.length)];
    const kb = B.kinds[Math.floor(hash(i, 5) * B.kinds.length)];
    return hash(i, 6) < mix ? kb : ka;
  }
  function prop(kind, x, y, s, i, near) {
    const c = E.mid, lit = E.night > 0.3;
    ctx.fillStyle = c;
    switch (kind) {
      case 'house': {
        const w = 90 * s, h = 60 * s;
        ctx.fillRect(x, y - h, w, h);
        ctx.beginPath(); ctx.moveTo(x - 8 * s, y - h); ctx.lineTo(x + w / 2, y - h - 40 * s); ctx.lineTo(x + w + 8 * s, y - h); ctx.fill();
        if (E.snow > 0.3) { ctx.fillStyle = `rgba(240,244,248,${E.snow})`; ctx.beginPath(); ctx.moveTo(x - 8 * s, y - h); ctx.lineTo(x + w / 2, y - h - 40 * s); ctx.lineTo(x + w + 8 * s, y - h); ctx.lineTo(x + w / 2, y - h - 32 * s); ctx.fill(); }
        if (lit) { ctx.fillStyle = '#F6C77C'; ctx.fillRect(x + 16 * s, y - h + 18 * s, 16 * s, 18 * s); if (hash(i, 11) > 0.4) ctx.fillRect(x + 56 * s, y - h + 18 * s, 16 * s, 18 * s); }
        break;
      }
      case 'campus': {
        const w = 220 * s, h = 90 * s;
        ctx.fillRect(x, y - h, w, h); ctx.fillRect(x + w * 0.4, y - h - 30 * s, w * 0.2, 30 * s);
        if (lit) { ctx.fillStyle = '#F6C77C'; for (let k = 0; k < 8; k++) if (hash(i * 9 + k, 12) > 0.35) ctx.fillRect(x + 12 * s + k * 26 * s, y - h + 22 * s, 14 * s, 20 * s); }
        break;
      }
      case 'bare': {
        ctx.strokeStyle = c; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 90 * s);
        for (let k = 0; k < 5; k++) { const yy = y - (40 + k * 12) * s, dir = k % 2 ? 1 : -1; ctx.moveTo(x, yy); ctx.lineTo(x + dir * (24 + hash(i + k, 13) * 20) * s, yy - 26 * s); }
        ctx.stroke(); break;
      }
      case 'palm': {
        ctx.strokeStyle = c; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
        const h = (150 + hash(i, 14) * 70) * s, lean = (hash(i, 15) - 0.5) * 30 * s;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.3, y - h * 0.5, x + lean, y - h); ctx.stroke();
        ctx.lineWidth = 4 * s;
        const sway = Math.sin(t * 1.4 + i) * 0.08;
        for (let k = 0; k < 7; k++) {
          const a = -Math.PI / 2 + (k - 3) * 0.55 + sway;
          const ex = x + lean + Math.cos(a) * 60 * s, ey = y - h + Math.sin(a) * 40 * s + 22 * s;
          ctx.beginPath(); ctx.moveTo(x + lean, y - h); ctx.quadraticCurveTo(x + lean + Math.cos(a) * 34 * s, y - h + Math.sin(a) * 34 * s - 6 * s, ex, ey); ctx.stroke();
        }
        break;
      }
      case 'stucco': {
        const w = 130 * s, h = 50 * s;
        ctx.fillRect(x, y - h, w, h); ctx.fillRect(x + 10 * s, y - h - 8 * s, w - 20 * s, 8 * s);
        if (lit) { ctx.fillStyle = '#F6C77C'; ctx.fillRect(x + 20 * s, y - h + 16 * s, 20 * s, 16 * s); }
        break;
      }
      case 'pole': { ctx.fillRect(x, y - 130 * s, 4 * s, 130 * s); ctx.fillRect(x - 20 * s, y - 122 * s, 44 * s, 3 * s); break; }
      case 'post': { ctx.fillRect(x, y - 30 * s, 4 * s, 30 * s); break; }
      case 'pine': {
        const h = (110 + hash(i, 16) * 70) * s;
        ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + 26 * s, y - 20 * s); ctx.lineTo(x - 26 * s, y - 20 * s); ctx.fill();
        ctx.fillRect(x - 3 * s, y - 20 * s, 6 * s, 20 * s); break;
      }
      case 'tower': {
        const w = 70 * s, h = (160 + hash(i, 17) * 160) * s;
        ctx.fillRect(x, y - h, w, h);
        ctx.fillStyle = '#F2D08E';
        for (let r = 0; r < Math.floor(h / (22 * s)) - 1; r++) for (let k = 0; k < 3; k++) if (hash(i * 31 + r * 3 + k, 18) > 0.5) ctx.fillRect(x + 10 * s + k * 20 * s, y - h + 12 * s + r * 22 * s, 9 * s, 10 * s);
        break;
      }
      default: break;
    }
    if (near && scanX >= 0 && Math.abs(x - scanX) < 160 * s) outline(x, y, s);
  }
  function outline(x, y, s) {
    ctx.strokeStyle = 'rgba(159,199,178,.85)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.strokeRect(x - 30 * s, y - 200 * s, 120 * s, 200 * s); ctx.setLineDash([]);
  }
  function mids(par, spacing, scaleK, yOff) {
    const off = d * u * par;
    const sp = spacing * u;
    const i0 = Math.floor(off / sp) - 1, i1 = i0 + Math.ceil(W / sp) + 3;
    for (let i = i0; i <= i1; i++) {
      const kind = kindAt(i + Math.round(par * 1000));
      const x = i * sp - off + hash(i, 19) * sp * 0.4;
      prop(kind, x, gy - yOff * u, u * scaleK * (0.8 + hash(i, 20) * 0.4), i, par > 0.6);
    }
  }
  function road() {
    ctx.fillStyle = E.ground; ctx.fillRect(0, gy, W, H - gy);
    const ry = gy + 26 * u * carScale / 0.9;
    ctx.fillStyle = E.road; ctx.fillRect(0, gy + 8 * u, W, H - gy);
    ctx.fillStyle = E.line;
    const off = (d * u) % (120 * u);
    for (let x = -off; x < W; x += 120 * u) ctx.fillRect(x, ry + 60 * u, 60 * u, 4 * u);
    ctx.globalAlpha = 0.6; ctx.fillRect(0, gy + 10 * u, W, 2 * u); ctx.globalAlpha = 1;
  }
  function drawSigns() {
    for (const s of signs) {
      const x = (s.at - d) * u + carX + 300 * carScale;
      if (x < -300 * u || x > W + 300 * u) continue;
      const y = gy + 6 * u, w = (s.w || 200) * u, h = 70 * u;
      ctx.fillStyle = '#3A3D40'; ctx.fillRect(x + w * 0.2, y - 150 * u, 5 * u, 150 * u); ctx.fillRect(x + w * 0.8, y - 150 * u, 5 * u, 150 * u);
      ctx.fillStyle = s.color || '#1F6B3A'; ctx.fillRect(x, y - 150 * u - h, w, h);
      ctx.strokeStyle = '#F1ECE2'; ctx.lineWidth = 2 * u; ctx.strokeRect(x + 4 * u, y - 146 * u - h, w - 8 * u, h - 8 * u);
      ctx.fillStyle = '#F1ECE2'; ctx.textAlign = 'center';
      ctx.font = `700 ${Math.round(20 * u)}px Archivo, sans-serif`; ctx.fillText(s.text, x + w / 2, y - 150 * u - h + 32 * u);
      if (s.sub) { ctx.font = `500 ${Math.round(12 * u)}px "JetBrains Mono", monospace`; ctx.fillText(s.sub, x + w / 2, y - 150 * u - h + 54 * u); }
      if (S.abilities.has('lookup') && s.tag) {
        ctx.fillStyle = 'rgba(159,199,178,.92)'; const tw = ctx.measureText(s.tag).width + 16 * u;
        ctx.fillRect(x + w / 2 - tw / 2, y - 150 * u - h - 30 * u, tw, 22 * u);
        ctx.fillStyle = '#0C1F17'; ctx.font = `500 ${Math.round(11 * u)}px "JetBrains Mono", monospace`; ctx.fillText(s.tag, x + w / 2, y - 150 * u - h - 15 * u);
      }
    }
  }
  function snow(dt) {
    if (E.snow < 0.05) return;
    ctx.fillStyle = `rgba(255,255,255,${0.8 * E.snow})`;
    for (const f of flakes) {
      f.y += dt * 0.08 * f.z; f.x -= dt * (0.02 + v / 4000) * f.z;
      if (f.y > 1) f.y = 0; if (f.x < 0) f.x += 1;
      ctx.beginPath(); ctx.arc(f.x * W, f.y * H, 1.6 * f.z * u * 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  function nightVeil() {
    if (E.night < 0.05) return;
    ctx.fillStyle = `rgba(3,8,8,${E.night * 0.45})`; ctx.fillRect(0, 0, W, H);
  }
  function scanner(dt) {
    if (!S.abilities.has('scan')) { scanX = -1; return; }
    scanT += dt;
    const period = 4.5;
    const ph = (scanT % period) / 1.6;
    scanX = ph <= 1 ? ph * W : -1;
    if (scanX >= 0) {
      const g = ctx.createLinearGradient(scanX - 60, 0, scanX, 0);
      g.addColorStop(0, 'rgba(159,199,178,0)'); g.addColorStop(1, 'rgba(159,199,178,.35)');
      ctx.fillStyle = g; ctx.fillRect(scanX - 60, 0, 60, H);
      ctx.fillStyle = 'rgba(207,226,215,.9)'; ctx.fillRect(scanX, 0, 1.5, H);
    }
  }

  /* ---------------- loop ---------------- */
  S.onFrame((dt) => {
    t += dt;
    if (mixRate) { mix = clamp(mix + dt * mixRate, 0, 1); if (mix >= 1) mixRate = 0; blend(); }
    const want = ended ? 0 : braking ? 0 : (input.down || S.skipped) ? vMax * (S.skipped ? 4 : 1) : vCruise;
    v = lerp(v, want, 1 - Math.exp(-dt * (want < v ? 2.2 : 1.4)));
    if (!ended && d + v * dt > stopAt) { d = stopAt; v = 0; ended = true; }
    d += v * dt;
    while (ei < events.length && d >= events[ei].at) { const ev = events[ei++]; ev.fn && ev.fn(); if (ev.text) S.caption(ev.text, ev.ms || 3200); if (ev.copilot) S.copilot(ev.copilot); }
    // draw
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    sky();
    ridge(0.06, 50, 120, E.far, 0.004, 0.011);
    ridge(0.15, 26, 60, hexMix(E.far, E.mid, 0.5), 0.008, 0.019);
    mids(0.35, 170, 0.75, 4);
    drawSigns();
    mids(0.75, 260, 1.05, 0);
    road();
    snow(dt);
    nightVeil();
    scanner(dt);
    // car
    const bounce = Math.sin(t * 18) * Math.min(1, v / 200) * 0.8;
    carLayer.setAttribute('transform', `translate(${carX.toFixed(1)},${(gy + 34 * u - 46 * carScale + bounce).toFixed(1)}) scale(${carScale.toFixed(4)})`);
    car.spin(v * dt / carScale / u * 0.9);
    car.lights(E.night > 0.35, 0.18 + E.night * 0.2);
    car.brake(want < v - 20);
    S.audio.engine(clamp(v / 400, 0, 1), true);
    // memory trail: faint copies of the car left behind
    if (S.abilities.has('trail')) {
      if (Math.floor(t * 4) !== Math.floor((t - dt) * 4) && v > 60) {
        const gh = S.el('use', {}, trail);
        ghosts.push({ el: gh, x: 0, a: 0.28 });
        gh.setAttribute('href', '#trailcar');
      }
      for (let i = ghosts.length - 1; i >= 0; i--) {
        const g = ghosts[i]; g.x -= v * dt * u; g.a -= dt * 0.25;
        if (g.a <= 0) { g.el.remove(); ghosts.splice(i, 1); continue; }
        g.el.setAttribute('transform', `translate(${(carX + g.x).toFixed(1)},${(gy + 34 * u - 46 * carScale).toFixed(1)}) scale(${carScale.toFixed(4)})`);
        g.el.setAttribute('opacity', g.a.toFixed(2));
      }
    }
  });
  if (S.abilities.has('trail')) {
    const sym = S.el('symbol', { id: 'trailcar', overflow: 'visible' }, S.defs);
    sym.innerHTML = '<path d="M20,-12 Q8,-40 30,-64 C60,-82 110,-88 156,-95 C205,-150 300,-156 350,-138 C382,-125 398,-108 408,-97 C440,-93 500,-88 538,-76 Q562,-52 550,-12 Z" fill="#9FC7B2"/>';
  }

  return {
    car,
    get d() { return d; },
    get v() { return v; },
    get u() { return u; },
    get done() { return ended; },
    blendTo(name, seconds) { A = { ...E, kinds: (mix > 0.5 ? B : A).kinds }; B = ENVS[name]; mix = 0; mixRate = 1 / Math.max(0.1, seconds); },
    extend(len) { stopAt = d + len; ended = false; },
    addEvents(list) { list.forEach((e) => events.push({ ...e, at: d + e.at })); events.sort((a, b) => a.at - b.at); ei = events.findIndex((e) => e.at > d); if (ei < 0) ei = events.length; },
    addSigns(list) { list.forEach((s) => signs.push({ ...s, at: d + s.at })); },
    brake(on) { braking = on; },
    cruise(val) { vCruise = val; },
    until(fn) { return new Promise((res) => { const iv = setInterval(() => { if (fn()) { clearInterval(iv); res(); } }, 80); }); },
    finish() { return this.until(() => ended); },
    pad(on) {
      if (!on && pad) { pad.remove(); pad = null; S.prompt(''); }
      if (on && !pad) { pad = holdPad(S, 'Hold to drive', input); S.prompt(cfg.prompt || 'Hold anywhere to drive. Let go to cruise.'); }
    },
    off() { input.off(); pad && pad.remove(); S.prompt(''); S.audio.engine(0, false); },
  };
}
