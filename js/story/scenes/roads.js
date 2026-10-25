/* roads.js — Ohio, the reroute into California, the dark stretch into
   North Carolina, the final drive, and the ending. */
import { createDrive } from './drive.js';
import { buildCar } from '../car.js';
import { tween, ease } from '../util.js';
import { currentAge } from '../../data.js';

/* ============ OHIO ============ */
export async function ohio(S) {
  S.audio.mood('ohio', 0.045);
  S.audio.wind(0.06, 700);
  const D = createDrive(S, {
    env: 'ohio', length: 2700, cruise: 110, max: 380,
    signs: [
      { at: 560, text: 'DAYTON', sub: 'OHIO', tag: 'NEW CITY' },
      { at: 1450, text: 'WRIGHT STATE', sub: 'UNIVERSITY', w: 230, tag: 'FIRST CAMPUS' },
    ],
    events: [
      { at: 420, text: 'Dayton, Ohio. A new city, again.' },
      { at: 1300, text: 'Wright State University. First dorm. First winter.', ms: 3800 },
      { at: 2100, text: 'Figuring out how everything works, alone.', ms: 3600 },
    ],
  });
  await S.fade(false, 10);
  S.title('Ohio', 'Dayton · 2025', 2200);
  await D.finish();
  D.off();
  S.char.setExpr('thinking');
  await S.wait(500);
}

/* ============ REROUTING → CALIFORNIA ============ */
export async function reroute(S) {
  S.audio.mood('ohio', 0.03);
  S.audio.wind(0.05, 600);
  const D = createDrive(S, { env: 'ohio', length: 0, noPad: true, cruise: 0 });
  await S.fade(false, 10);
  const gps = document.createElement('div');
  gps.className = 'st-gps';
  gps.innerHTML = `<svg viewBox="0 0 120 60" aria-hidden="true"><path d="M8,50 Q40,10 70,30" fill="none" stroke="#CC2D26" stroke-width="3"/><path d="M70,30 Q90,44 112,12" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 4" opacity=".4"/><path d="M64,24 l12,12 m0,-12 l-12,12" stroke="#CC2D26" stroke-width="3"/></svg><p class="gps-t">Route unavailable</p><p class="gps-s">The planned road ends here.</p>`;
  S.controls.appendChild(gps);
  requestAnimationFrame(() => gps.classList.add('in'));
  S.audio.blip(330); S.audio.blip(262);
  await S.wait(1800);
  S.caption('Plans changed.', 2600);
  await S.wait(1200);
  await S.button('Recalculate <i>↻</i>');
  gps.querySelector('.gps-t').textContent = 'Recalculating…';
  gps.querySelector('.gps-s').textContent = 'Finding another way.';
  gps.classList.add('spin');
  await S.wait(1600);
  gps.classList.remove('in');
  setTimeout(() => gps.remove(), 600);
  // the world transforms while you drive into it
  D.blendTo('cali', S.reduced ? 0.5 : 5.5);
  S.audio.mood('cali', 0.05);
  S.audio.wind(0.02, 400);
  D.extend(2600);
  D.cruise(120);
  D.addSigns([{ at: 1100, text: 'CALIFORNIA', sub: 'WELCOME', tag: 'NEW ROUTE' }]);
  D.addEvents([
    { at: 700, fn: () => { S.title('California', '2025', 2000); S.host.querySelector('.st-ch-t').textContent = 'California'; } },
    { at: 1400, text: 'A short chapter. Different landscape.' },
    { at: 2050, text: 'Same question: what now?' },
  ]);
  D.pad(true);
  S.char.setExpr('neutral');
  await D.finish();
  D.off();
}

/* ============ NORTH CAROLINA: the dark stretch, then arrival ============ */
export async function arrive(S) {
  S.audio.mood('none');
  S.audio.wind(0.03, 260);
  const D = createDrive(S, {
    env: 'dark', length: 2500, cruise: 120, max: 340,
    events: [
      { at: 200, text: 'Working shifts. Building at night.' },
      { at: 700, text: "Ideas that didn't work." },
      { at: 1150, text: 'No map. No guarantee.' },
      { at: 1600, text: 'Keep going.', fn: () => { D.blendTo('nc', 3.5); S.audio.mood('nc', 0.05); } },
    ],
    signs: [{ at: 2050, text: 'GREENSBORO', sub: 'NORTH CAROLINA', w: 230, tag: 'HOME BASE' }],
  });
  await S.fade(false, 10);
  S.char.setExpr('tired');
  await D.until(() => D.d > 1600);
  S.char.setExpr('determined');
  await D.finish();
  D.off();
  await S.title('North Carolina', 'Now', 2000);
}

/* ============ THE ROAD (final drive with everything unlocked) ============ */
export async function finalDrive(S) {
  S.audio.mood('nc', 0.05);
  S.audio.wind(0.02, 300);
  const has = (k) => S.abilities.has(k);
  const D = createDrive(S, {
    env: 'nc', length: 3000, cruise: 140, max: 400,
    prompt: has('copilot') ? 'Hold to drive. ARIA is riding along.' : undefined,
    signs: [
      { at: 700, text: 'FORSYTH TECH', sub: 'COMMUNITY COLLEGE', w: 240, tag: 'STUDYING CS' },
      { at: 1500, text: 'REPAIR SHOP', sub: 'OPEN', tag: 'STILL FIXES PHONES' },
      { at: 2300, text: 'NEXT', sub: 'UNC SYSTEM', tag: 'TRANSFER GOAL' },
    ],
    events: [
      { at: 120, copilot: 'Road is clear. I will call what is ahead.' },
      { at: 500, text: 'Studying. Working. Building.' },
      { at: 900, copilot: has('scan') ? 'Scanner is on. Everything ahead is outlined.' : 'Quiet road. Good for thinking.' },
      { at: 1300, text: 'Every project made the next one possible.', ms: 3400 },
      { at: 1800, copilot: has('trail') ? 'Your path is being recorded. Nothing gets lost.' : 'Keep this pace.' },
      { at: 2200, fn: () => D.blendTo('dawn', 4) },
      { at: 2600, copilot: 'The map ends here. The road does not.' },
    ],
  });
  if (has('himalaya') && S.car.paint !== 'himalaya') { /* offered in the build chapter */ }
  await S.fade(false, 10);
  S.char.setExpr('smile');
  await D.finish();
  D.off();
  await S.wait(400);
}

/* ============ TODAY (ending) ============ */
export async function ending(S) {
  S.audio.mood('end', 0.05);
  S.audio.wind(0.03, 400);
  const bg = S.g(S.world);
  bg.innerHTML = `
    <defs>
      <linearGradient id="esky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0C1F17"/><stop offset=".62" stop-color="#3C4A3E"/><stop offset=".86" stop-color="#C46B4E"/><stop offset="1" stop-color="#F0B27A"/></linearGradient>
      <radialGradient id="esun" cx=".5" cy="1" r=".5"><stop offset="0" stop-color="#FFD9A0" stop-opacity=".9"/><stop offset="1" stop-color="#FFD9A0" stop-opacity="0"/></radialGradient>
      <linearGradient id="eroad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B3A38"/><stop offset="1" stop-color="#1A1B1B"/></linearGradient>
    </defs>
    <rect class="sky" fill="url(#esky)"/><ellipse class="sun" fill="url(#esun)"/>
    <path class="hillL" fill="#16271F"/><path class="hillR" fill="#122219"/>
    <rect class="ground" fill="#0F1C16"/><path class="road" fill="url(#eroad)"/>
    <g class="dashes"></g>`;
  const $ = (c) => bg.querySelector('.' + c);
  const carG = S.g(S.world);
  const car = buildCar(carG, S.car);
  car.lights(true, 0.1);
  const charG = S.g(S.world);
  charG.appendChild(S.char.el);
  S.char.el.removeAttribute('transform');
  const ch = S.char;
  ch.setView('back'); ch.setOutfit(ch.state.outfit === 'tee' ? 'layers' : ch.state.outfit);
  ch.snapPose('stand').snapTurn(0).walk(false);
  let hz = 0, W = 0, H = 0, dashes = [];
  S.onResize((w, h) => {
    W = w; H = h; hz = h * 0.52;
    $('sky').setAttribute('width', w); $('sky').setAttribute('height', hz + 2);
    $('sun').setAttribute('cx', w / 2); $('sun').setAttribute('cy', hz); $('sun').setAttribute('rx', w * 0.5); $('sun').setAttribute('ry', h * 0.3);
    $('ground').setAttribute('y', hz); $('ground').setAttribute('width', w); $('ground').setAttribute('height', h - hz);
    $('hillL').setAttribute('d', `M0,${hz} L0,${hz - h * 0.08} Q${w * 0.2},${hz - h * 0.14} ${w * 0.42},${hz} Z`);
    $('hillR').setAttribute('d', `M${w},${hz} L${w},${hz - h * 0.06} Q${w * 0.75},${hz - h * 0.11} ${w * 0.55},${hz} Z`);
    const half = Math.min(w * 0.46, h * 0.5);
    $('road').setAttribute('d', `M${w / 2 - 2},${hz} L${w / 2 + 2},${hz} L${w / 2 + half},${h} L${w / 2 - half},${h} Z`);
    const chH = Math.min(h * 0.36, 330);
    charG.setAttribute('transform', `translate(${w / 2},${h * 0.9}) scale(${(chH / 880).toFixed(4)})`);
    const cs = Math.min(w * 0.36, 300) / 580;
    carG.setAttribute('transform', `translate(${(S.portrait ? -w * 0.18 : w * 0.04).toFixed(1)},${(h * 0.84).toFixed(1)}) scale(${cs.toFixed(4)})`);
  });
  const dg = $('dashes');
  dashes = Array.from({ length: 8 }, (_, i) => ({ el: S.el('path', { fill: '#E9E2D2' }, dg), z: i / 8 }));
  S.onFrame((dt) => {
    for (const ds of dashes) {
      ds.z = (ds.z + dt * (S.reduced ? 0 : 0.06)) % 1;
      // perspective: z=0 near (bottom), z=1 at horizon
      const p0 = Math.pow(1 - ds.z, 2.2), p1 = Math.pow(1 - Math.min(1, ds.z + 0.05), 2.2);
      const y0 = hz + (H - hz) * p0, y1 = hz + (H - hz) * p1;
      const w0 = 6 * p0 + 0.5, w1 = 6 * p1 + 0.5;
      ds.el.setAttribute('d', `M${W / 2 - w0},${y0} L${W / 2 + w0},${y0} L${W / 2 + w1},${y1} L${W / 2 - w1},${y1}Z`);
      ds.el.setAttribute('opacity', (0.3 + p0 * 0.7).toFixed(2));
    }
  });
  await S.fade(false, 900);
  await S.wait(1400);
  await S.card([
    { text: `Age ${currentAge()}`, ms: 2000 },
    { text: 'Current chapter // Building', small: true, ms: 2400 },
    { text: "The rest hasn't happened yet.", ms: 3000 },
    { text: 'See what came from it.', small: true, ms: 600 },
  ], { keep: true });
}
