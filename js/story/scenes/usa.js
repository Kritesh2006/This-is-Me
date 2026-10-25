/* usa.js — arrival. Hold to walk an unfamiliar street; signs stop you. */
import { rng, holdInput, holdPad, tween } from '../util.js';
import { buildCar } from '../car.js';

export async function usa(S) {
  S.audio.mood('usa', 0.045);
  S.audio.wind(0.05, 600);
  const r = rng(21);
  const L = 2500;
  const sky = S.g(S.world);
  sky.innerHTML = `<defs><linearGradient id="usky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4E5C6B"/><stop offset=".7" stop-color="#A7A39C"/><stop offset="1" stop-color="#C9B49C"/></linearGradient></defs><rect class="sk" fill="url(#usky)"/>`;
  const skyRect = sky.querySelector('.sk');
  const far = S.g(S.world), mid = S.g(S.world), street = S.g(S.world), front = S.g(S.world);

  // far skyline
  let fx = 0, farS = '';
  while (fx < L * 0.3 + 2400) { const w = 50 + r() * 70, h = 120 + r() * 260; farS += `<rect x="${fx.toFixed(0)}" y="${-h}" width="${w.toFixed(0)}" height="${h}" fill="#6E7884"/>`; if (r() > 0.6) farS += `<rect x="${(fx + w / 2 - 2).toFixed(0)}" y="${-h - 30}" width="4" height="30" fill="#6E7884"/>`; fx += w + 4; }
  far.innerHTML = farS;
  // brick rowhouses
  let mx = -200, midS = '';
  const BR = ['#7A4636', '#5E3A2E', '#8A5A44', '#4F3A33'];
  while (mx < L * 0.6 + 2400) {
    const w = 160 + r() * 80, h = 200 + r() * 120, c = BR[Math.floor(r() * 4)];
    midS += `<rect x="${mx.toFixed(0)}" y="${-h}" width="${w.toFixed(0)}" height="${h}" fill="${c}"/><rect x="${(mx - 4).toFixed(0)}" y="${-h - 10}" width="${(w + 8).toFixed(0)}" height="12" fill="#2E2421"/>`;
    for (let row = 0; row < Math.floor(h / 70); row++) for (let col = 0; col < Math.floor(w / 50); col++) {
      const lit = r() > 0.55;
      midS += `<rect x="${(mx + 16 + col * 50).toFixed(0)}" y="${(-h + 26 + row * 70).toFixed(0)}" width="26" height="36" fill="${lit ? '#F5C77E' : '#2B3038'}" opacity="${lit ? 0.9 : 1}"/>`;
    }
    mx += w + 10;
  }
  mid.innerHTML = midS;
  // street: sidewalk, curb, road, lamps, signs
  let st = `<rect x="-400" y="0" width="${L + 3000}" height="40" fill="#8E8A84"/><rect x="-400" y="40" width="${L + 3000}" height="10" fill="#5E5B57"/><rect x="-400" y="50" width="${L + 3000}" height="400" fill="#3A3B3E"/>`;
  for (let x = -200; x < L + 2000; x += 120) st += `<rect x="${x}" y="130" width="60" height="6" fill="#D9D3C4" opacity=".55"/>`;
  for (let x = 120; x < L + 2000; x += 380) st += `<g transform="translate(${x},0)"><rect x="-4" y="-320" width="8" height="320" fill="#2B2B2D"/><path d="M0,-320 Q0,-340 40,-340" stroke="#2B2B2D" stroke-width="7" fill="none"/><ellipse cx="44" cy="-334" rx="14" ry="6" fill="#FFE7B8"/><path d="M30,-330 L58,-330 L90,-60 L-2,-60Z" fill="#FFE7B8" opacity=".06"/></g>`;
  street.innerHTML = st;
  const signs = S.g(street);
  signs.innerHTML = `
    <g transform="translate(520,0)"><rect x="-4" y="-300" width="8" height="300" fill="#4A4C50"/>
      <rect x="-70" y="-300" width="140" height="34" fill="#1F6B3A"/><text x="0" y="-277" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="700" font-size="20" fill="#fff">MAIN ST</text>
      <rect x="-60" y="-258" width="120" height="34" fill="#111"/><path d="M-52,-247 H28 V-255 L52,-241 L28,-227 V-235 H-52Z" fill="#fff"/><text x="-12" y="-237" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="800" font-size="11" fill="#111">ONE WAY</text>
      <rect x="-24" y="-214" width="48" height="56" fill="#fff" stroke="#111" stroke-width="2"/><text x="0" y="-195" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="800" font-size="10" fill="#111">SPEED</text><text x="0" y="-182" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="800" font-size="10" fill="#111">LIMIT</text><text x="0" y="-164" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="900" font-size="18" fill="#111">25</text>
    </g>
    <g transform="translate(1080,0)"><rect x="-150" y="-330" width="300" height="300" fill="#C9C1B0"/><rect x="-150" y="-330" width="300" height="50" fill="#1E3A5F"/><text x="0" y="-297" text-anchor="middle" font-family="Bodoni Moda,serif" font-weight="800" font-size="28" fill="#F1ECE2">BANK</text>
      <rect x="-40" y="-150" width="80" height="120" fill="#2B3038"/><rect x="-130" y="-250" width="70" height="80" fill="#7FA5BE"/><rect x="60" y="-250" width="70" height="80" fill="#7FA5BE"/>
      <rect x="-120" y="-130" width="70" height="40" fill="#F1ECE2"/><text x="-85" y="-114" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="700" font-size="9" fill="#1E3A5F">OPEN AN</text><text x="-85" y="-101" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="700" font-size="9" fill="#1E3A5F">ACCOUNT</text>
      <rect x="60" y="-130" width="70" height="40" fill="#F1ECE2"/><text x="95" y="-114" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="700" font-size="9" fill="#A31C1B">NOW</text><text x="95" y="-101" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="700" font-size="9" fill="#A31C1B">LEASING</text></g>
    <g transform="translate(1640,0)" class="xwalk"><rect x="-4" y="-250" width="8" height="250" fill="#4A4C50"/><rect x="-22" y="-290" width="44" height="54" rx="4" fill="#1A1A1A"/>
      <g class="hand"><path d="M-8,-252 v-16 a3,3 0 0 1 6,0 v10 v-14 a3,3 0 0 1 6,0 v14 v-10 a3,3 0 0 1 6,0 v18 q0,8 -10,8 h-4 q-6,0 -10,-8 l-4,-8 a3,3 0 0 1 5,-3 l3,4" fill="#FF6A3D"/></g>
      <g class="walker" opacity="0"><circle cx="0" cy="-276" r="4" fill="#F1ECE2"/><path d="M0,-271 L-2,-258 L-8,-246 M-2,-258 L5,-247 M0,-268 L-7,-262 M0,-268 L7,-264" stroke="#F1ECE2" stroke-width="3" fill="none" stroke-linecap="round"/></g></g>`;
  // the car, parked at the end
  const carG = S.g(street);
  const car = buildCar(carG, S.car);
  carG.setAttribute('transform', `translate(2100,-6) scale(0.62)`);
  // traffic
  const traffic = [0, 1].map((i) => {
    const g = S.g(front);
    g.innerHTML = `<rect x="0" y="-60" width="230" height="44" rx="14" fill="${i ? '#3E5466' : '#B8B2A6'}"/><rect x="40" y="-92" width="120" height="40" rx="14" fill="${i ? '#3E5466' : '#B8B2A6'}"/><rect x="52" y="-86" width="96" height="28" rx="8" fill="#20262C"/><circle cx="48" cy="-14" r="20" fill="#111"/><circle cx="182" cy="-14" r="20" fill="#111"/><rect x="222" y="-52" width="10" height="10" fill="#FFE7B8"/>`;
    return { g, x: 3000 + i * 1600, sp: 360 + i * 120 };
  });
  // character
  const charG = S.g(street);
  charG.appendChild(S.char.el);
  const ch = S.char;
  ch.setOutfit('layers'); ch.snapPose('stand').snapTurn(0.7).snapExpr('thinking').look(0.3, -0.2).walk(false).type(false);
  let cx = 120, u = 1, gy = 0, cam = 0, W = 0;
  S.onResize((w, h) => {
    W = w;
    const charH = Math.min(h * (S.portrait ? 0.34 : 0.4), 400);
    u = charH / 560;
    gy = h * (S.portrait ? 0.72 : 0.78);
    skyRect.setAttribute('width', w); skyRect.setAttribute('height', h);
  });

  const input = holdInput(S, (v) => pad.active(v));
  const pad = holdPad(S, 'Hold to walk', input);
  S.prompt('Hold anywhere to walk.');
  await S.fade(false, 10);

  const stops = [
    { x: 470, text: 'New country. New rules.', look: [0.5, -0.9] },
    { x: 1000, text: 'Bank accounts. Leases. Credit. Learn it all at once.', look: [0.4, -0.7] },
    { x: 1590, text: 'Nobody here knows your name yet.', look: [0.6, -0.6], xwalk: true },
    { x: 2010, text: 'Then: a car.', look: [0.8, 0.3], end: true },
  ];
  let si = 0, paused = 0, finished = false, t = 0;
  S.onFrame((dt) => {
    t += dt;
    if (S.skipped) finished = true;
    const wantWalk = (input.down || S.skipped) && paused <= 0 && !finished;
    if (paused > 0) paused -= dt;
    if (wantWalk) cx += 150 * dt * (S.skipped ? 6 : 1);
    ch.walk(wantWalk, 1);
    if (si < stops.length && cx >= stops[si].x) {
      const s = stops[si++];
      cx = s.x;
      ch.walk(false).look(...s.look).setExpr(s.end ? 'smile' : 'thinking');
      S.caption(s.text, 3400);
      paused = s.end ? 99 : 3.2;
      if (s.xwalk) setTimeout(() => { const x = signs.querySelector('.xwalk'); x.querySelector('.hand').setAttribute('opacity', 0); x.querySelector('.walker').setAttribute('opacity', 1); }, 1800);
      if (s.end) setTimeout(() => (finished = true), 1800);
      setTimeout(() => ch.look(0.3, -0.1), 2600);
    }
    cam = cx * u - W * 0.34;
    const y = gy;
    far.setAttribute('transform', `translate(${(-cam * 0.15).toFixed(1)},${(y - 30 * u).toFixed(1)}) scale(${u.toFixed(4)})`);
    mid.setAttribute('transform', `translate(${(-cam * 0.5).toFixed(1)},${y.toFixed(1)}) scale(${u.toFixed(4)})`);
    street.setAttribute('transform', `translate(${(-cam).toFixed(1)},${y.toFixed(1)}) scale(${u.toFixed(4)})`);
    S.char.el.setAttribute('transform', `translate(${cx.toFixed(1)},20) scale(0.636)`);
    for (const tr of traffic) {
      tr.x -= tr.sp * dt;
      if (tr.x < cx - 1600) tr.x = cx + 1500 + Math.random() * 1200;
      tr.g.setAttribute('transform', `translate(${tr.x.toFixed(1)},110)`);
    }
    front.setAttribute('transform', `translate(${(-cam).toFixed(1)},${y.toFixed(1)}) scale(${u.toFixed(4)})`);
  });
  await new Promise((res) => { const iv = setInterval(() => { if (finished) { clearInterval(iv); res(); } }, 100); });
  input.off(); pad.remove(); S.prompt('');
  car.lights(true, 0.15);
  await S.wait(600);
}
