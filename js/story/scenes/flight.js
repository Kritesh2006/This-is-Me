/* flight.js — the long flight. Drag the plane along the route. */
import { fitBox, rng, hexMix, lerp, tween } from '../util.js';

export async function flight(S) {
  S.audio.mood('air', 0.05);
  S.audio.wind(0.05, 380);
  const bg = S.g(S.world);
  const wall = S.el('rect', { fill: '#1E252D' }, bg);
  const box = S.g(S.world);
  const r = rng(9);
  box.innerHTML = `
    <defs>
      <clipPath id="fwin"><rect x="470" y="170" width="330" height="400" rx="130"/></clipPath>
      <linearGradient id="fsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s0"/><stop offset=".65" class="s1"/><stop offset="1" class="s2"/></linearGradient>
    </defs>
    <rect x="300" y="60" width="700" height="40" fill="#2A323C"/>
    <circle cx="420" cy="80" r="6" fill="#FFE6B0" opacity=".7"/><circle cx="460" cy="80" r="6" fill="#FFE6B0" opacity=".25"/>
    <rect x="452" y="152" width="366" height="436" rx="146" fill="#C9CDD2"/>
    <rect x="462" y="162" width="346" height="416" rx="138" fill="#9EA6AF"/>
    <g clip-path="url(#fwin)">
      <rect x="470" y="170" width="330" height="400" fill="url(#fsky)"/>
      <g class="stars">${Array.from({ length: 30 }, () => `<circle cx="${(470 + r() * 330).toFixed(1)}" cy="${(170 + r() * 200).toFixed(1)}" r="${(0.6 + r()).toFixed(2)}" fill="#fff"/>`).join('')}</g>
      <circle class="sun" cx="700" cy="520" r="40" fill="#FFD7A0" opacity="0"/>
      <g class="cl far"></g><g class="cl near"></g>
      <g class="wing"><path d="M430,520 L820,470 L830,486 L440,560Z" fill="#7C8590"/><path d="M800,472 L828,468 L832,486 L806,490Z" fill="#5C646E"/><circle class="blink" cx="826" cy="476" r="4" fill="#FF3B30"/></g>
    </g>
    <rect x="470" y="170" width="330" height="400" rx="130" fill="none" stroke="#7F8790" stroke-width="3"/>
    <path d="M520,220 Q560,200 600,200" stroke="#fff" stroke-width="4" opacity=".12" fill="none"/>
    <path d="M150,330 Q150,250 230,250 L300,250 Q360,250 360,330 L370,700 L170,700Z" fill="#3B4E66"/>
    <rect x="160" y="250" width="200" height="40" rx="16" fill="#4A6080"/>
    <g data-k="slot"></g>
    <rect x="330" y="610" width="150" height="26" rx="10" fill="#2E3E52"/>
    <path d="M120,700 L520,700 L520,760 L120,760Z" fill="#2E3E52"/>`;
  const slot = box.querySelector('[data-k="slot"]');
  slot.appendChild(S.char.el);
  const ch = S.char;
  ch.setOutfit('layers'); ch.snapPose('window').snapTurn(0.8).snapExpr('thinking').look(0.8, -0.2).type(false).walk(false);
  ch.el.setAttribute('transform', 'translate(300,760) scale(0.62)');
  const stops = box.querySelectorAll('#fsky stop');
  const stars = box.querySelector('.stars');
  const sun = box.querySelector('.sun');
  const blink = box.querySelector('.blink');
  const far = box.querySelector('.far'), near = box.querySelector('.near');
  const mkClouds = (g, n, y0, y1, sc, op) => Array.from({ length: n }, () => {
    const c = S.el('g', { opacity: op }, g);
    const w = 60 + r() * 90;
    c.innerHTML = `<ellipse cx="0" cy="0" rx="${w}" ry="${w * 0.22}" fill="#fff"/><ellipse cx="${w * 0.3}" cy="${-w * 0.12}" rx="${w * 0.5}" ry="${w * 0.24}" fill="#fff"/>`;
    return { c, x: 470 + r() * 500, y: y0 + r() * (y1 - y0), sc };
  });
  const clouds = [...mkClouds(far, 6, 380, 470, 0.4, 0.35), ...mkClouds(near, 5, 440, 560, 1, 0.75)];

  S.onResize((W, H) => {
    const f = fitBox(S, 900, 900, 140);
    box.setAttribute('transform', f.transform);
    wall.setAttribute('width', W); wall.setAttribute('height', H);
  });

  // route control: a real range input, styled as the map line
  const route = document.createElement('div');
  route.className = 'st-route';
  route.innerHTML = `
    <svg viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true"><path d="M6,34 Q150,-14 294,34" fill="none" stroke="currentColor" stroke-dasharray="3 5"/><path class="done" d="M6,34 Q150,-14 294,34" fill="none" stroke="#CC2D26" stroke-width="2" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>
    <label class="sr" for="routeIn">Fly from Kathmandu to the United States</label>
    <input id="routeIn" type="range" min="0" max="100" value="0" step="1">
    <p class="rt-ends"><span>KTM</span><span>USA</span></p>`;
  S.controls.appendChild(route);
  requestAnimationFrame(() => route.classList.add('in'));
  const input = route.querySelector('input');
  const done = route.querySelector('.done');
  S.prompt('Drag the plane across the world.');
  await S.fade(false, 10);
  S.caption('Kathmandu → somewhere far.', 2600);

  let target = 0, p = 0, t = 0, lastP = 0;
  input.addEventListener('input', () => { target = Math.max(target, input.value / 100); });
  const NIGHT = ['#030812', '#0B1830', '#1A2A44'], DAWN = ['#2B3566', '#C9746A', '#F3B27A'];
  const lines = [[0.2, 'Night.'], [0.5, 'Somewhere over the world.'], [0.82, 'Morning, on the other side.']];
  let li = 0;
  S.onFrame((dt) => {
    t += dt;
    p = lerp(p, target, 1 - Math.exp(-dt * 4));
    const v = Math.max(0, p - lastP) / Math.max(dt, 0.001); lastP = p;
    const k = Math.max(0, (p - 0.45) / 0.55);
    stops.forEach((s, i) => s.setAttribute('stop-color', hexMix(NIGHT[i], DAWN[i], k)));
    stars.setAttribute('opacity', (1 - k).toFixed(2));
    sun.setAttribute('opacity', (k * 0.9).toFixed(2));
    sun.setAttribute('cy', (560 - k * 60).toFixed(1));
    blink.setAttribute('opacity', Math.sin(t * 6) > 0.6 ? 1 : 0.15);
    const speed = 18 + v * 1600;
    for (const c of clouds) {
      c.x -= speed * c.sc * dt;
      if (c.x < 330) { c.x = 900 + r() * 100; }
      c.c.setAttribute('transform', `translate(${c.x.toFixed(1)},${c.y.toFixed(1)})`);
      c.c.querySelectorAll('ellipse').forEach((e) => e.setAttribute('fill', hexMix('#5C6B85', '#FFE6D2', k)));
    }
    done.setAttribute('stroke-dashoffset', (1 - p).toFixed(3));
    if (li < lines.length && p > lines[li][0]) { S.caption(lines[li][1], 2600); li++; }
    S.audio.wind(0.04 + Math.min(0.08, v * 0.4), 380 + v * 900);
    if (S.skipped) target = 1;
  });
  await new Promise((res) => { const iv = setInterval(() => { if (p > 0.985 || S.skipped) { clearInterval(iv); res(); } }, 100); });
  input.disabled = true;
  S.prompt('');
  ch.setExpr('wonder').look(0.9, 0.1);
  await S.wait(900);
  await tween(S, 400, (e) => (route.style.opacity = 1 - e));
  S.audio.wind(0.01, 300);
  await S.title('United States', 'January 2025', 2400);
}
