/* home.js — Nepal (explore the room) and Leaving home (pack, hold to leave). */
import { fitBox, tween, rng, ease } from '../util.js';

const FLAG = ['#2E6FB7', '#F1ECE2', '#C8342C', '#2F8A4E', '#E3B536'];

function valley(w, h, seed = 3) {
  const r = rng(seed);
  const stars = Array.from({ length: 40 }, () => `<circle cx="${(r() * w).toFixed(1)}" cy="${(r() * h * 0.45).toFixed(1)}" r="${(0.6 + r() * 1.1).toFixed(2)}" fill="#fff" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`).join('');
  const lights = Array.from({ length: 90 }, (_, i) => {
    const x = r() * w, y = h * 0.66 + r() * h * 0.3;
    return `<circle class="tw" data-p="${(r() * 6).toFixed(2)}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.9 + r() * 1.4).toFixed(2)}" fill="${r() > 0.8 ? '#F1ECE2' : '#FFC772'}"/>`;
  }).join('');
  return `
    <defs><linearGradient id="vsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#08131F"/><stop offset=".7" stop-color="#1A3044"/><stop offset="1" stop-color="#2B3B44"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#vsky)"/>
    ${stars}
    <path d="M${w * 0.78},${h * 0.12} a14,14 0 1,0 12,22 a11,11 0 1,1 -12,-22Z" fill="#E9E3D2" opacity=".9"/>
    <path d="M0,${h * 0.5} L${w * 0.12},${h * 0.36} L${w * 0.2},${h * 0.42} L${w * 0.34},${h * 0.28} L${w * 0.46},${h * 0.4} L${w * 0.6},${h * 0.3} L${w * 0.74},${h * 0.44} L${w * 0.88},${h * 0.34} L${w},${h * 0.46} L${w},${h} L0,${h}Z" fill="#334A5E" opacity=".75"/>
    <path d="M${w * 0.34},${h * 0.28} L${w * 0.3},${h * 0.33} L${w * 0.36},${h * 0.32} L${w * 0.39},${h * 0.335} Z M${w * 0.6},${h * 0.3} L${w * 0.56},${h * 0.345} L${w * 0.63},${h * 0.335}Z M${w * 0.12},${h * 0.36} L${w * 0.09},${h * 0.395} L${w * 0.15},${h * 0.39}Z" fill="#E6EEF2" opacity=".75"/>
    <path d="M0,${h * 0.62} Q${w * 0.2},${h * 0.5} ${w * 0.38},${h * 0.58} Q${w * 0.55},${h * 0.66} ${w * 0.72},${h * 0.55} Q${w * 0.86},${h * 0.48} ${w},${h * 0.58} L${w},${h} L0,${h}Z" fill="#132029"/>
    <g transform="translate(${w * 0.72},${h * 0.55})">
      <path d="M-16,0 A16,13 0 0 1 16,0Z" fill="#D9D2C1"/><rect x="-6" y="-19" width="12" height="7" fill="#D9D2C1"/>
      <path d="M-4,-19 L0,-40 L4,-19Z" fill="#C9A04A"/><rect x="-6" y="-17" width="12" height="2" fill="#2E6FB7" opacity=".8"/>
    </g>
    ${lights}
    <path class="road" d="M0,${h * 0.9} Q${w * 0.4},${h * 0.8} ${w},${h * 0.86}" fill="none" stroke="#000" stroke-opacity=".25" stroke-width="3"/>
    <circle class="carl" r="1.8" fill="#FFF2C8"/><circle class="carl" r="1.8" fill="#FF5A4A"/><circle class="carl" r="1.8" fill="#FFF2C8"/>`;
}

function flags(x1, y1, x2, y2, n = 9) {
  let s = `<path d="M${x1},${y1} Q${(x1 + x2) / 2},${Math.max(y1, y2) + 30} ${x2},${y2}" fill="none" stroke="#C9C2B2" stroke-width="1.4"/>`;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * ((x1 + x2) / 2) + t * t * x2;
    const y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * (Math.max(y1, y2) + 30) + t * t * y2;
    s += `<g class="flag" data-p="${i * 0.7}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><rect x="-13" y="0" width="26" height="30" fill="${FLAG[i % 5]}"/><path d="M-9,8 h18 M-9,14 h14 M-9,20 h16" stroke="#000" stroke-opacity=".18" stroke-width="1.2"/></g>`;
  }
  return s;
}

export function roomArt() {
  return `
  <g data-k="window">
    <rect x="128" y="128" width="324" height="354" fill="#4A3122"/>
    <svg x="140" y="140" width="300" height="330" viewBox="0 0 300 330">${valley(300, 330)}</svg>
    <path d="M290,140 V470 M140,305 H440" stroke="#4A3122" stroke-width="8"/>
    <rect x="120" y="478" width="340" height="14" fill="#5B3D2A"/>
    <g data-k="flags">${flags(110, 150, 470, 170)}</g>
    <rect x="128" y="128" width="324" height="354" fill="none" stroke="#2C1C13" stroke-width="2"/>
  </g>
  <g data-k="poster"><rect x="478" y="158" width="104" height="142" fill="#A31C1B"/><circle cx="530" cy="215" r="30" fill="none" stroke="#F1ECE2" stroke-width="2"/><path d="M512,250 Q530,180 548,250" fill="none" stroke="#F1ECE2" stroke-width="2"/><text x="530" y="285" text-anchor="middle" font-family="Bodoni Moda,serif" font-weight="800" font-size="16" fill="#F1ECE2">LIVE</text></g>
  <g data-k="shelf">
    <rect x="620" y="246" width="190" height="10" fill="#5B3D2A"/>
    <g data-k="books">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${628 + i * 15}" y="${196 + (i % 3) * 4}" width="12" height="${50 - (i % 3) * 4}" fill="${['#2F5D4A', '#C8B98F', '#7C2B24', '#3A4E63', '#B87A3E', '#1E2A2A'][i]}"/>`).join('')}</g>
    <g data-k="photo"><rect x="736" y="196" width="50" height="50" fill="#E9E1CF" stroke="#3B2A1F" stroke-width="3"/><rect x="742" y="202" width="38" height="30" fill="#6E8C7C"/><path d="M742,232 L752,218 L760,226 L768,214 L780,232Z" fill="#E9E1CF" opacity=".8"/></g>
  </g>
  <g data-k="guitar" transform="translate(206,628) rotate(-12)">
    <path d="M-6,-170 L6,-170 L5,-50 L-5,-50Z" fill="#3A2416"/>
    <rect x="-9" y="-196" width="18" height="30" rx="3" fill="#2A1A10"/>
    <path d="M0,-60 C-40,-60 -48,-20 -34,0 C-58,20 -54,80 0,86 C54,80 58,20 34,0 C48,-20 40,-60 0,-60Z" fill="#B8783E" stroke="#5A3517" stroke-width="3"/>
    <circle cx="0" cy="8" r="13" fill="#2A1A10"/>
    <path d="M-2,-170 V60 M2,-170 V60" stroke="#E8E1D0" stroke-width=".8" opacity=".8"/>
    <rect x="-14" y="50" width="28" height="6" fill="#2A1A10"/>
  </g>
  <g data-k="stool"><rect x="300" y="700" width="86" height="12" fill="#5B3D2A"/><path d="M308,712 V760 M378,712 V760" stroke="#3B2A1F" stroke-width="6"/>
    <g data-k="clothes"><rect x="306" y="676" width="74" height="12" rx="3" fill="#9BAA45"/><rect x="308" y="664" width="70" height="12" rx="3" fill="#2B2E36"/><rect x="310" y="652" width="66" height="12" rx="3" fill="#C9C2B4"/></g>
  </g>
  <g data-k="chair"><path d="M488,520 L500,520 L506,646 L494,646Z" fill="#3B2A1F"/><rect x="486" y="636" width="120" height="14" rx="4" fill="#4A3122"/><path d="M496,650 V760 M596,650 V760" stroke="#3B2A1F" stroke-width="7"/></g>
  <g data-k="charslot"></g>
  <g data-k="desk">
    <rect x="560" y="556" width="310" height="18" fill="#6B4A33"/>
    <rect x="560" y="574" width="310" height="8" fill="#4A3122"/>
    <path d="M574,582 V760 M856,582 V760" stroke="#4A3122" stroke-width="12"/>
  </g>
  <g data-k="mat"><rect x="600" y="546" width="92" height="10" fill="#2C5E4A"/>
    <g data-k="phone"><rect x="618" y="538" width="50" height="10" rx="2" fill="#1B1B1D"/><rect x="622" y="536" width="42" height="4" fill="#5F8FAE" class="phscreen"/></g>
    <path d="M676,544 L700,540" stroke="#C9302C" stroke-width="4" stroke-linecap="round"/>
  </g>
  <g data-k="monitor">
    <rect x="752" y="526" width="14" height="32" fill="#2A2A2C"/><rect x="726" y="552" width="66" height="6" fill="#2A2A2C"/>
    <rect x="690" y="410" width="140" height="118" rx="5" fill="#1E1E20"/>
    <rect x="698" y="418" width="124" height="98" fill="#0D1A15" data-k="screen"/>
    <g data-k="code" font-family="JetBrains Mono,monospace" font-size="8" fill="#9FC7B2"></g>
  </g>
  <g data-k="lamp"><path d="M846,556 L846,470 L812,440" stroke="#2A2A2C" stroke-width="5" fill="none"/><path d="M796,428 L830,434 L822,456 L790,446Z" fill="#2A2A2C"/></g>`;
}

const CODE = [
  '<!doctype html>', '<h1>hello, world</h1>', 'function fix(phone) {', '  diagnose(phone);', '  return repair();', '}', 'const me = "learning";', 'git commit -m "v1"',
];

function setupRoom(S) {
  S.clearStage();
  const bg = S.g(S.world);
  const wall = S.el('rect', { fill: '#17342C' }, bg);
  const glow = S.el('circle', { fill: 'url(#glowH)' }, bg);
  S.el('radialGradient', { id: 'glowH' }, S.defs).innerHTML = '<stop offset="0" stop-color="#FFB866" stop-opacity="0.28"/><stop offset="1" stop-color="#FFB866" stop-opacity="0"/>';
  const floor = S.el('rect', { fill: '#3A281C' }, bg);
  const floorLine = S.el('rect', { fill: '#2B1D14' }, bg);
  const box = S.g(S.world);
  box.innerHTML = roomArt();
  const k = (n) => box.querySelector(`[data-k="${n}"]`);
  const slot = k('charslot');
  slot.appendChild(S.char.el);
  let fit;
  S.onResize((W, H) => {
    fit = fitBox(S, 900, 790, 100);
    box.setAttribute('transform', fit.transform);
    const [, fy] = fit.toScreen(0, 760);
    wall.setAttribute('width', W); wall.setAttribute('height', H);
    floor.setAttribute('y', fy); floor.setAttribute('width', W); floor.setAttribute('height', Math.max(0, H - fy));
    floorLine.setAttribute('y', fy); floorLine.setAttribute('width', W); floorLine.setAttribute('height', 6);
    const [gx, gy] = fit.toScreen(810, 470);
    glow.setAttribute('cx', gx); glow.setAttribute('cy', gy); glow.setAttribute('r', 340 * fit.k);
  });
  // ambient motion: flags sway, lights twinkle, distant cars move
  const flagsEls = [...box.querySelectorAll('.flag')].map((e) => ({ e, p: +e.dataset.p, t: e.getAttribute('transform') }));
  const tw = [...box.querySelectorAll('.tw')].map((e) => ({ e, p: +e.dataset.p }));
  const road = box.querySelector('.road');
  const cars = [...box.querySelectorAll('.carl')];
  const roadLen = road.getTotalLength ? road.getTotalLength() : 300;
  let t = 0;
  S.onFrame((dt) => {
    t += dt;
    if (!S.reduced) {
      for (const f of flagsEls) f.e.setAttribute('transform', `${f.t} rotate(${(Math.sin(t * 2.2 + f.p) * 7).toFixed(1)}) skewX(${(Math.sin(t * 3 + f.p) * 6).toFixed(1)})`);
      for (let i = 0; i < tw.length; i += 3) tw[i].e.setAttribute('opacity', (0.55 + Math.sin(t * 2 + tw[i].p) * 0.4).toFixed(2));
    }
    cars.forEach((c, i) => {
      const u = ((t * 0.05 + i * 0.33) % 1);
      const pt = road.getPointAtLength(i === 1 ? (1 - u) * roadLen : u * roadLen);
      c.setAttribute('cx', pt.x.toFixed(1)); c.setAttribute('cy', pt.y.toFixed(1));
    });
  });
  return { box, k, get fit() { return fit; }, slot };
}

/* ============ CHAPTER: NEPAL ============ */
export async function nepal(S) {
  S.audio.mood('nepal', 0.05);
  S.audio.wind(0.01, 300);
  const R = setupRoom(S);
  const ch = S.char;
  ch.setOutfit('tee'); ch.snapPose('sit').snapTurn(0.55).snapExpr('focused').look(0.4, 0.4).type(false).walk(false);
  const place = () => ch.el.setAttribute('transform', 'translate(548,760) scale(0.636)');
  place();
  const code = R.k('code');
  let codeLines = 0, typingT = 0;
  const typeCode = (on) => { typingT = on ? 1 : 0; };
  S.onFrame((dt) => {
    if (typingT && codeLines < CODE.length) {
      typingT += dt;
      if (typingT > 1.35) {
        typingT = 1;
        const tx = S.el('text', { x: 704, y: 432 + codeLines * 11 }, code);
        tx.textContent = CODE[codeLines++];
      }
    }
  });
  await S.fade(false, 10);
  await S.title('Nepal', 'Kathmandu · 2006', 2400);

  const found = new Set();
  const items = [
    {
      id: 'window', label: 'Window', at: [290, 300],
      async act() {
        ch.setPose('sit').setTurn(-0.55).look(-0.6, -0.4).setExpr('wonder');
        S.caption('Born June 7, 2006. The valley at night, always lit.', 4200);
        await S.wait(4200);
      },
    },
    {
      id: 'phone', label: 'Phone', at: [645, 528],
      async act() {
        ch.setPose('repair').setTurn(0.5).look(0.3, 0.9).setExpr('focused');
        const tool = S.el('path', { d: 'M0,20 L0,70', stroke: '#C9302C', 'stroke-width': 7, 'stroke-linecap': 'round' }, ch.hand('F'));
        S.caption('Always taking things apart to see how they worked.', 3000);
        const ph = R.box.querySelector('.phscreen');
        for (let i = 0; i < 6; i++) { ph.setAttribute('fill', i % 2 ? '#5F8FAE' : '#9FC7B2'); await S.wait(260); }
        S.caption('2022 · a repair counter in Kathmandu. First real job.', 3600);
        await S.wait(3400);
        tool.remove();
      },
    },
    {
      id: 'guitar', label: 'Guitar', at: [205, 560],
      async act() {
        ch.setPose('sit').setTurn(-0.45).look(-0.7, 0.3).setExpr('smile');
        S.caption('Music.', 2600);
        S.audio.strum([146.8, 220, 293.7, 370, 440]);
        await S.wait(900);
        S.audio.strum([130.8, 196, 261.6, 329.6, 392]);
        await S.wait(900);
        S.audio.strum([146.8, 220, 293.7, 370, 440]);
        await S.wait(1400);
      },
    },
    {
      id: 'computer', label: 'Computer', at: [736, 470],
      async act() {
        ch.setPose('type').setTurn(0.6).look(0.5, 0.2).setExpr('focused').type(true);
        typeCode(true);
        S.caption('Taught himself to build for the web before any class did.', 4200);
        await S.wait(4300);
        ch.type(false);
      },
    },
  ];
  S.prompt('Look around. Tap what catches your eye. <b class="cnt">0 / 4</b>');
  const spots = items.map((it) => {
    const h = S.hotspot({ label: it.label, onTap: () => run(it, h) });
    return { it, h };
  });
  const placeSpots = () => spots.forEach(({ it, h }) => h.place(...R.fit.toScreen(...it.at)));
  S.onResize(placeSpots);
  let busy = false;
  let resolveAll;
  const allDone = new Promise((r) => (resolveAll = r));
  async function run(it, h) {
    if (busy) return;
    busy = true;
    h.done();
    S.host.classList.add('busy');
    await it.act();
    S.host.classList.remove('busy');
    ch.setPose('sit').setTurn(0.55).setExpr('neutral').look(0.4, 0.4);
    found.add(it.id);
    const cnt = S.controls.querySelector('.cnt'); if (cnt) cnt.textContent = `${found.size} / 4`;
    busy = false;
    if (found.size === 3) resolveAll();
    if (found.size === 4) resolveAll(true);
  }
  const skipWatch = new Promise((r) => { const iv = setInterval(() => { if (S.skipped) { clearInterval(iv); r(); } }, 100); });
  const r = await Promise.race([allDone, skipWatch]);
  if (!S.skipped && r !== true) {
    // let them finish or move on
    const cont = S.button('Continue <i>→</i>');
    await Promise.race([cont, new Promise((res) => { const iv = setInterval(() => { if (found.size === 4 && !busy) { clearInterval(iv); res(); } }, 150); })]);
  }
  spots.forEach(({ h }) => h.remove());
  S.prompt('');
  await S.wait(300);
}

/* ============ CHAPTER: LEAVING HOME ============ */
export async function leaving(S) {
  S.audio.mood('leave', 0.05);
  const R = setupRoom(S);
  const ch = S.char;
  ch.setOutfit('tee'); ch.snapPose('stand').snapTurn(-0.3).snapExpr('thinking').look(0, 0).type(false).walk(false);
  let cx = 470;
  const place = () => ch.el.setAttribute('transform', `translate(${cx},760) scale(0.636)`);
  place();
  // the suitcase, open on the floor
  const suit = S.g(R.box);
  R.box.insertBefore(suit, R.slot);
  suit.innerHTML = `
    <g data-s="lid"><rect x="0" y="-70" width="150" height="70" rx="8" fill="#5B2B22" stroke="#2C1510" stroke-width="3"/><rect x="10" y="-60" width="130" height="50" rx="4" fill="#7E3B2E"/></g>
    <rect x="0" y="0" width="150" height="60" rx="8" fill="#6E332A" stroke="#2C1510" stroke-width="3"/>
    <rect x="10" y="6" width="130" height="40" rx="4" fill="#3B1C16"/>
    <rect x="58" y="-80" width="34" height="10" rx="5" fill="none" stroke="#2C1510" stroke-width="4" data-s="handle" opacity="0"/>`;
  suit.setAttribute('transform', 'translate(640,700)');
  const lid = suit.querySelector('[data-s="lid"]');
  await S.fade(false, 10);
  await S.title('Leaving home', 'Kathmandu', 2000);

  const toPack = [
    { id: 'clothes', label: 'Clothes', sel: 'clothes', at: [343, 660] },
    { id: 'tools', label: 'Repair kit', sel: 'mat', at: [646, 540] },
    { id: 'photo', label: 'Photo', sel: 'photo', at: [761, 221] },
    { id: 'books', label: 'Notebooks', sel: 'books', at: [666, 220] },
  ];
  S.prompt('Pack what matters. <b class="cnt">0 / 4</b>');
  let packed = 0, busy = false;
  let done;
  const allPacked = new Promise((r) => (done = r));
  const spots = toPack.map((it) => {
    const h = S.hotspot({ label: it.label, onTap: async () => {
      if (busy) return; busy = true; h.remove();
      const node = R.k(it.sel);
      ch.setPose('pack').setTurn(0.4).look(0.4, 0.6).setExpr('neutral');
      // fly the object into the case along an arc
      const bb = node.getBBox();
      const sx = bb.x + bb.width / 2, sy = bb.y + bb.height / 2;
      const tx = 715, ty = 715;
      await tween(S, 700, (e) => {
        const x = (tx - sx) * e, y = (ty - sy) * e - Math.sin(e * Math.PI) * 90;
        node.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)}) translate(${sx},${sy}) scale(${(1 - e * 0.6).toFixed(3)}) translate(${-sx},${-sy})`);
      });
      node.style.display = 'none';
      S.audio.blip(440 + packed * 110);
      packed++;
      const cnt = S.controls.querySelector('.cnt'); if (cnt) cnt.textContent = `${packed} / 4`;
      // the room empties a little more each time
      if (packed === 2) tween(S, 900, (e) => R.k('poster').setAttribute('opacity', 1 - e));
      ch.setPose('stand').setTurn(-0.2).setExpr('thinking');
      busy = false;
      if (packed === 4) done();
    } });
    return { it, h };
  });
  S.onResize(() => spots.forEach(({ it, h }) => h.el.isConnected && h.place(...R.fit.toScreen(...it.at))));
  await Promise.race([allPacked, new Promise((r) => { const iv = setInterval(() => { if (S.skipped) { clearInterval(iv); r(); } }, 100); })]);
  spots.forEach(({ h }) => h.remove());
  S.prompt('');
  if (S.skipped) return;
  // close the case
  await tween(S, 600, (e) => lid.setAttribute('transform', `translate(0,${(70 * e).toFixed(1)}) scale(1,${(1 - e * 0.85).toFixed(3)})`));
  suit.querySelector('[data-s="handle"]').setAttribute('opacity', 1);
  S.audio.blip(220);
  // lights down
  const dim = S.el('rect', { x: -2000, y: -2000, width: 6000, height: 6000, fill: '#03080A', opacity: 0 }, R.box);
  await tween(S, 1400, (e) => dim.setAttribute('opacity', (e * 0.5).toFixed(3)));
  ch.setTurn(-0.6).look(-0.7, -0.3).setExpr('tired');
  await S.wait(1200);
  await S.card([{ text: '18.', ms: 2200 }, { text: 'Time to leave.', ms: 2000 }], { keep: false });
  await S.hold('Hold to leave home', 1800);
  S.hideTitle();
  // pick up the case and walk out
  ch.setTurn(0.6).setExpr('determined').look(0.6, 0);
  await S.wait(500);
  suit.setAttribute('transform', 'translate(0,0)');
  const hand = ch.hand('F');
  hand.appendChild(suit);
  suit.setAttribute('transform', `translate(-90,40) scale(${(1 / 0.636).toFixed(3)})`);
  ch.setPose('carry');
  const door = S.el('rect', { x: 900, y: 380, width: 0, height: 380, fill: '#FFD9A0', opacity: 0.85 }, R.box);
  await tween(S, 700, (e) => door.setAttribute('width', 80 * e));
  ch.walk(true, 0.9);
  await tween(S, 2600, (e) => { cx = 470 + e * 520; place(); }, ease.lin);
  ch.walk(false);
  await tween(S, 500, (e) => door.setAttribute('width', 80 * (1 - e)));
  hand.removeChild(suit);
}
