/* build.js — North Carolina, the building phase. Same desk layout as the
   room in Nepal, a world away. Each project you build changes the room
   and unlocks something for the road ahead. */
import { fitBox, tween } from '../util.js';
import { PROJECTS } from '../../data.js';
import { saveCar } from '../car.js';

const BUILDS = [
  { id: 'payreport', ability: 'tune', title: 'Engine tune', text: 'The first software anyone relied on. Top speed raised.' },
  { id: 'inventory', ability: 'lookup', title: 'Lookup', text: 'Road signs now explain themselves, like parts on a shelf.' },
  { id: 'aria', ability: 'copilot', title: 'ARIA co-driver', text: 'An AI co-driver now rides along and calls the road.' },
  { id: 'airos', ability: 'scan', title: 'Scanner', text: 'A sweep outlines what is ahead before you reach it.' },
  { id: 'himveda', ability: 'himalaya', title: 'Himalaya paint', text: 'A piece of home, applied to the car.' },
  { id: 'witness', ability: 'trail', title: 'Memory trail', text: 'Your path is now recorded behind you.' },
];

function art() {
  const towers = [[150, 300, 40, 130], [196, 300, 30, 90], [232, 300, 46, 160], [284, 300, 34, 110], [324, 300, 52, 140], [382, 300, 30, 80]];
  return `
  <g data-k="window">
    <rect x="108" y="118" width="324" height="324" fill="#30261F"/>
    <svg x="120" y="130" width="300" height="300" viewBox="120 130 300 300">
      <defs><linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07130E"/><stop offset="1" stop-color="#25423A"/></linearGradient></defs>
      <rect x="120" y="130" width="300" height="300" fill="url(#nsky)"/>
      <g data-k="himal" opacity="0"><path d="M120,330 L170,250 L200,280 L250,210 L300,270 L340,230 L420,320 L420,430 L120,430Z" fill="#5E7486" opacity=".55"/><path d="M250,210 L236,232 L258,228 L270,236Z M170,250 L160,268 L182,262Z M340,230 L330,248 L352,244Z" fill="#E6EEF2" opacity=".7"/></g>
      ${towers.map(([x, b, w, h]) => `<rect x="${x}" y="${b + 60 - h}" width="${w}" height="${h + 80}" fill="#0E1A15"/>${Array.from({ length: Math.floor(h / 16) }, (_, r) => `<rect x="${x + 6}" y="${b + 68 - h + r * 16}" width="6" height="7" fill="#F2D08E" opacity="${(r * 7 + x) % 3 ? 0.85 : 0.2}"/><rect x="${x + w - 12}" y="${b + 68 - h + r * 16}" width="6" height="7" fill="#F2D08E" opacity="${(r * 5 + x) % 4 ? 0.8 : 0.15}"/>`).join('')}`).join('')}
      <rect x="120" y="390" width="300" height="40" fill="#0A140F"/>
    </svg>
    <path d="M270,130 V430 M120,280 H420" stroke="#30261F" stroke-width="8"/>
    <rect x="100" y="438" width="340" height="14" fill="#3B2E25"/>
  </g>
  <g data-k="clock" opacity="0" transform="translate(530,200)"><circle r="34" fill="#F1ECE2" stroke="#171717" stroke-width="4"/><path data-k="hh" d="M0,0 L0,-18" stroke="#171717" stroke-width="4" stroke-linecap="round"/><path data-k="mh" d="M0,0 L0,-26" stroke="#A31C1B" stroke-width="2.5" stroke-linecap="round"/><circle r="3" fill="#171717"/></g>
  <g data-k="shelf">
    <rect x="610" y="250" width="220" height="10" fill="#3B2E25"/><rect x="610" y="160" width="220" height="10" fill="#3B2E25"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${620 + i * 52}" y="206" width="44" height="44" fill="#C9B994" stroke="#8C7A55"/><rect x="${620 + i * 52}" y="116" width="44" height="44" fill="#BBA982" stroke="#8C7A55"/>`).join('')}
    <g data-k="tags" opacity="0">${[0, 1, 2, 3].map((i) => `<rect x="${624 + i * 52}" y="226" width="36" height="12" fill="#9FC7B2"/><rect x="${624 + i * 52}" y="136" width="36" height="12" fill="#9FC7B2"/>`).join('')}
      <text x="628" y="235" font-family="JetBrains Mono,monospace" font-size="7" fill="#0C1F17">A15</text><text x="680" y="235" font-family="JetBrains Mono,monospace" font-size="7" fill="#0C1F17">S22</text><text x="732" y="235" font-family="JetBrains Mono,monospace" font-size="7" fill="#0C1F17">P7</text><text x="784" y="235" font-family="JetBrains Mono,monospace" font-size="7" fill="#0C1F17">X12</text></g>
  </g>
  <g data-k="polaroids" opacity="0">
    ${[['#1A3044', '#FFC772'], ['#F3B27A', '#5C6B85'], ['#D3D9DE', '#3B434D'], ['#F4A867', '#3D2A2A']].map(([a, b], i) => `<g transform="translate(${462 + i * 36},${300 + (i % 2) * 10}) rotate(${(i % 2 ? 6 : -5)})"><rect width="32" height="38" fill="#F1ECE2"/><rect x="3" y="3" width="26" height="24" fill="${a}"/><circle cx="${12 + i * 3}" cy="18" r="5" fill="${b}"/></g>`).join('')}
    <path d="M458,300 Q520,292 610,302" stroke="#C9C2B2" fill="none"/>
  </g>
  <g data-k="chair"><path d="M488,520 L500,520 L506,646 L494,646Z" fill="#2A2A2C"/><rect x="486" y="636" width="120" height="14" rx="4" fill="#333336"/><path d="M546,650 V740 M510,760 L582,760" stroke="#2A2A2C" stroke-width="7"/></g>
  <g data-k="charslot"></g>
  <g data-k="desk"><rect x="560" y="556" width="310" height="18" fill="#8A6A4E"/><path d="M574,574 V760 M856,574 V760" stroke="#5B4634" stroke-width="12"/></g>
  <g data-k="mat"><rect x="590" y="546" width="92" height="10" fill="#2C5E4A"/><rect x="606" y="538" width="50" height="10" rx="2" fill="#1B1B1D"/><path d="M664,544 L688,540" stroke="#C9302C" stroke-width="4" stroke-linecap="round"/></g>
  <g data-k="monitor">
    <rect x="752" y="520" width="14" height="38" fill="#222"/><rect x="722" y="552" width="74" height="6" fill="#222"/>
    <rect x="680" y="390" width="170" height="132" rx="5" fill="#161616"/>
    <rect x="688" y="398" width="154" height="112" fill="#0C1712"/>
    <g data-k="screen" font-family="JetBrains Mono,monospace" font-size="9" fill="#9FC7B2">
      <text x="696" y="416" data-k="l1">ready.</text><text x="696" y="432" data-k="l2"></text>
      <rect x="696" y="446" width="138" height="8" fill="none" stroke="#9FC7B2" stroke-opacity=".4"/><rect x="697" y="447" width="0" height="6" fill="#CC2D26" data-k="bar"/>
      <g data-k="orb" opacity="0"><circle cx="765" cy="486" r="12" fill="none" stroke="#9FC7B2"/><circle cx="765" cy="486" r="5" fill="#CC2D26"/></g>
    </g>
  </g>
  <g data-k="lamp"><path d="M846,556 L846,470 L812,440" stroke="#2A2A2C" stroke-width="5" fill="none"/><path d="M796,428 L830,434 L822,456 L790,446Z" fill="#2A2A2C"/></g>
  <rect data-k="scan" x="0" y="100" width="6" height="680" fill="#CFE2D7" opacity="0"/>`;
}

export async function build(S) {
  S.audio.mood('nc', 0.05);
  S.audio.wind(0, 300);
  const bg = S.g(S.world);
  const wall = S.el('rect', { fill: '#12261D' }, bg);
  const glow = S.el('circle', { fill: 'url(#glowB)' }, bg);
  S.el('radialGradient', { id: 'glowB' }, S.defs).innerHTML = '<stop offset="0" stop-color="#9FC7B2" stop-opacity="0.16"/><stop offset="1" stop-color="#9FC7B2" stop-opacity="0"/>';
  const floor = S.el('rect', { fill: '#2A231E' }, bg);
  const box = S.g(S.world);
  box.innerHTML = art();
  const k = (n) => box.querySelector(`[data-k="${n}"]`);
  k('charslot').appendChild(S.char.el);
  const ch = S.char;
  ch.setView('front'); ch.setOutfit('black'); ch.snapPose('sit').snapTurn(0.55).snapExpr('focused').look(0.4, 0.3).walk(false).type(false);
  ch.el.setAttribute('transform', 'translate(548,760) scale(0.636)');
  let fit;
  S.onResize((W, H) => {
    fit = fitBox(S, 900, 790, 120, S.portrait ? 0.3 : 0.24);
    box.setAttribute('transform', fit.transform);
    const [, fy] = fit.toScreen(0, 760);
    wall.setAttribute('width', W); wall.setAttribute('height', H);
    floor.setAttribute('y', fy); floor.setAttribute('width', W); floor.setAttribute('height', Math.max(0, H - fy));
    const [gx, gy] = fit.toScreen(765, 450); glow.setAttribute('cx', gx); glow.setAttribute('cy', gy); glow.setAttribute('r', 260 * fit.k);
  });
  let t = 0;
  S.onFrame((dt) => {
    t += dt;
    k('mh').setAttribute('transform', `rotate(${(t * 36) % 360})`);
    k('hh').setAttribute('transform', `rotate(${(t * 3) % 360})`);
  });

  await S.fade(false, 10);
  S.caption('Greensboro. Forsyth Tech by day, repair shifts, and this desk at night.', 4200);
  await S.wait(1200);

  // project board
  const board = document.createElement('div');
  board.className = 'st-board';
  board.innerHTML = `<p class="bd-h">Build what you want <b class="cnt">0 / 6</b></p><div class="bd-grid">${BUILDS.map((b) => {
    const p = PROJECTS.find((x) => x.id === b.id);
    return `<button type="button" class="bd-card" data-id="${b.id}"><span class="bd-name">${p.name}</span><span class="bd-kind">${p.kind}</span><span class="bd-go">Build</span></button>`;
  }).join('')}</div>`;
  S.controls.appendChild(board);
  requestAnimationFrame(() => board.classList.add('in'));

  let built = 0, busy = false;
  const effects = {
    tune: () => tween(S, 600, (e) => k('clock').setAttribute('opacity', e)),
    lookup: () => tween(S, 600, (e) => k('tags').setAttribute('opacity', e)),
    copilot: async () => { k('orb').setAttribute('opacity', 1); S.copilot('ARIA online. I will ride along.'); },
    scan: async () => { const sc = k('scan'); sc.setAttribute('opacity', 0.7); await tween(S, 1400, (e) => sc.setAttribute('x', 100 + e * 760)); sc.setAttribute('opacity', 0); },
    himalaya: async () => { await tween(S, 1200, (e) => k('himal').setAttribute('opacity', e)); S.car.paint = 'himalaya'; saveCar(S.car); },
    trail: () => tween(S, 600, (e) => k('polaroids').setAttribute('opacity', e)),
  };
  async function doBuild(btn) {
    if (busy || btn.disabled) return;
    busy = true; btn.disabled = true; btn.classList.add('ing');
    const b = BUILDS.find((x) => x.id === btn.dataset.id);
    const p = PROJECTS.find((x) => x.id === b.id);
    ch.setPose('type').setTurn(0.6).setExpr('focused').look(0.5, 0.2).type(true);
    k('l1').textContent = `$ build ${p.name.toLowerCase().replace(/\s+/g, '-')}`;
    k('l2').textContent = 'compiling…';
    await tween(S, S.reduced ? 300 : 1500, (e) => k('bar').setAttribute('width', (136 * e).toFixed(1)));
    k('l2').textContent = 'shipped ✓';
    ch.type(false).setPose('sit').setExpr('smile').setTurn(0.3).look(-0.3, 0);
    S.abilities.add(b.ability);
    S.unlock(b.title, b.text);
    await effects[b.ability]();
    btn.classList.remove('ing'); btn.classList.add('done');
    btn.querySelector('.bd-go').textContent = 'Built';
    built++;
    board.querySelector('.cnt').textContent = `${built} / 6`;
    setTimeout(() => { ch.setExpr('focused').setTurn(0.55).look(0.4, 0.3); k('bar').setAttribute('width', 0); }, 1400);
    busy = false;
    if (built === 3) contBtn();
  }
  board.addEventListener('click', (e) => { const b = e.target.closest('.bd-card'); if (b) doBuild(b); });
  let contRes;
  const contP = new Promise((r) => (contRes = r));
  function contBtn() {
    const c = document.createElement('button');
    c.type = 'button'; c.className = 'st-btn st-btn-red bd-cont'; c.innerHTML = 'Take the road <i>→</i>';
    board.appendChild(c);
    c.addEventListener('click', () => { S.audio.tick(); contRes(); });
  }
  await Promise.race([contP, new Promise((r) => { const iv = setInterval(() => { if (S.skipped || (built === 6 && !busy)) { clearInterval(iv); r(); } }, 120); })]);
  if (built === 6 && !S.skipped) await S.wait(1400);
  board.remove();
}
