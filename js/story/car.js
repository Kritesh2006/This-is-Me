/* car.js — the side-view car, its options, and saved choices. */
const NS = 'http://www.w3.org/2000/svg';

export const PAINTS = [
  { id: 'crimson', name: 'Crimson', body: '#A31C1B', shade: '#6B0F0F', hi: '#D9504A' },
  { id: 'mint', name: 'Sage mint', body: '#8FBCA6', shade: '#557A68', hi: '#C9E3D6' },
  { id: 'forest', name: 'Forest', body: '#1E4A36', shade: '#0C2219', hi: '#4F8068' },
  { id: 'bone', name: 'Bone', body: '#E7DFCF', shade: '#A99E88', hi: '#FFFFFF' },
  { id: 'char', name: 'Charcoal', body: '#2A2928', shade: '#121212', hi: '#5C5955' },
  { id: 'himalaya', name: 'Himalaya', body: '#C9D8E2', shade: '#7E96A8', hi: '#F4FAFF', locked: 'himveda' },
];
export const WHEELS = [
  { id: 'fan', name: 'Five-fan' },
  { id: 'mesh', name: 'Mesh' },
  { id: 'dish', name: 'Deep dish' },
];
export const LIGHTS = [
  { id: 'warm', name: 'Warm', color: '#FFE0A3' },
  { id: 'white', name: 'Cool white', color: '#E8F3FF' },
  { id: 'amber', name: 'Amber', color: '#FFB547' },
];
export const STANCES = [
  { id: 'low', name: 'Low', y: 7 },
  { id: 'stock', name: 'Stock', y: 0 },
  { id: 'lifted', name: 'Lifted', y: -14 },
];

const KEY = 'ron.car.v2';
export function loadCar() {
  let c = null;
  try { c = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { c = null; }
  return Object.assign({ paint: 'mint', wheels: 'fan', lights: 'warm', stance: 'low' }, c || {});
}
export function saveCar(cfg) { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* private mode */ } }

let uid = 0;
function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

function wheelArt(style) {
  const spokes = (n, w, r) => Array.from({ length: n }, (_, i) => `<rect x="${-w / 2}" y="${-r}" width="${w}" height="${r}" rx="${w / 2}" transform="rotate(${(360 / n) * i})"/>`).join('');
  if (style === 'mesh') return `<circle r="31" fill="#B9B4AA"/><g fill="none" stroke="#6E6A63" stroke-width="1.6">${Array.from({ length: 14 }, (_, i) => `<path d="M0,0 L0,-30" transform="rotate(${i * 25.7})"/><path d="M0,-8 L8,-29" transform="rotate(${i * 25.7})"/>`).join('')}</g><circle r="30" fill="none" stroke="#D8D3C8" stroke-width="3"/><circle r="7" fill="#3A3835"/>`;
  if (style === 'dish') return `<circle r="31" fill="#D8D3C8"/><circle r="22" fill="#2A2928"/><g fill="#D8D3C8">${[0, 90, 180, 270].map((a) => `<circle cx="0" cy="-13" r="4.6" transform="rotate(${a + 45})"/>`).join('')}</g><circle r="7" fill="#D8D3C8"/>`;
  return `<circle r="31" fill="#2E2D2B"/><g fill="#CFC9BD">${spokes(5, 15, 29)}</g><circle r="31" fill="none" stroke="#CFC9BD" stroke-width="3"/><circle r="8" fill="#9A958B"/>`;
}

/* Build a car into `parent`. Origin: rear wheel centre ≈ (110,0), ground y=46. */
export function buildCar(parent, cfg) {
  const id = 'car' + (++uid);
  const g = el('g', { class: 'car' }, parent);
  const defs = el('defs', {}, g);
  defs.innerHTML = `
    <linearGradient id="${id}b" x1="0" y1="-160" x2="0" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" class="hi"/><stop offset=".45" class="mid"/><stop offset="1" class="lo"/>
    </linearGradient>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cfe6ff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#cfe6ff" stop-opacity=".2"/></linearGradient>
    <linearGradient id="${id}l" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="beam0"/><stop offset="1" class="beam1" stop-opacity="0"/></linearGradient>`;
  const beam = el('path', { d: 'M548,-56 L980,-120 L980,40 Z', fill: `url(#${id}l)`, opacity: 0 }, g);
  el('ellipse', { cx: 290, cy: 48, rx: 300, ry: 10, fill: '#000', opacity: 0.35 }, g);
  const body = el('g', {}, g);
  // interior + passenger
  el('path', { d: 'M150,-94 C200,-142 300,-148 346,-132 C374,-120 392,-106 402,-96 Z', fill: '#0D0F10' }, body);
  const seat = el('path', { d: 'M196,-96 L208,-136 Q214,-142 222,-136 L226,-96Z', fill: '#1A1B1C' }, body);
  const clip = el('clipPath', { id: id + 'c' }, defs);
  el('rect', { x: 140, y: -175, width: 290, height: 158 }, clip);
  const slot = el('g', { 'clip-path': `url(#${id}c)` }, body);
  // lower body
  const lower = el('path', { d: 'M20,-12 Q8,-40 30,-64 C60,-82 110,-88 156,-95 L404,-97 C440,-93 500,-88 538,-76 Q562,-52 550,-12 Z', fill: `url(#${id}b)`, stroke: '#141414', 'stroke-width': 2 }, body);
  // roof + pillars
  const roof = el('path', { d: 'M156,-95 C205,-150 300,-156 350,-138 C382,-125 398,-108 408,-97', fill: 'none', stroke: `url(#${id}b)`, 'stroke-width': 9, 'stroke-linecap': 'round' }, body);
  const pillar = el('path', { d: 'M302,-150 L292,-96', stroke: `url(#${id}b)`, 'stroke-width': 8 }, body);
  // glass
  el('path', { d: 'M162,-96 C206,-143 300,-149 345,-133 C372,-121 389,-107 398,-98 Z', fill: `url(#${id}g)` }, body);
  el('path', { d: 'M318,-140 L300,-100 M332,-136 L316,-100', stroke: '#fff', 'stroke-width': 3, opacity: 0.12 }, body);
  // details
  el('path', { d: 'M296,-92 L300,-30 M150,-90 Q140,-60 150,-30', stroke: '#141414', 'stroke-width': 1.4, fill: 'none', opacity: 0.6 }, body);
  el('rect', { x: 262, y: -82, width: 22, height: 4, rx: 2, fill: '#141414', opacity: 0.55 }, body);
  const stripe = el('path', { d: 'M40,-46 L540,-50', stroke: '#F1ECE2', 'stroke-width': 3, opacity: 0.45 }, body);
  el('path', { d: 'M22,-22 L548,-22', stroke: '#111', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.85 }, body);
  const tail = el('rect', { x: 14, y: -56, width: 14, height: 12, rx: 3, fill: '#D8261F' }, body);
  const tailGlow = el('ellipse', { cx: 12, cy: -50, rx: 26, ry: 12, fill: '#FF3A2F', opacity: 0 }, body);
  const head = el('ellipse', { cx: 546, cy: -58, rx: 9, ry: 11, fill: '#FFE0A3', stroke: '#141414', 'stroke-width': 1.5 }, body);
  // wheel arches
  el('path', { d: 'M52,-12 A58,58 0 0 1 168,-12 Z M372,-12 A58,58 0 0 1 488,-12 Z', fill: '#0A0A0A' }, body);
  const wheels = [110, 430].map((x) => {
    const w = el('g', { transform: `translate(${x},0)` }, g);
    el('circle', { r: 46, fill: '#121212' }, w);
    el('circle', { r: 44, fill: 'none', stroke: '#222', 'stroke-width': 3 }, w);
    const rim = el('g', {}, w);
    return { w, rim };
  });

  let spin = 0;
  const api = {
    g, body, slot, beam, wheels,
    set(cfg2) {
      Object.assign(cfg, cfg2);
      const p = PAINTS.find((x) => x.id === cfg.paint) || PAINTS[0];
      const stops = defs.querySelectorAll(`#${id}b stop`);
      stops[0].setAttribute('stop-color', p.hi); stops[1].setAttribute('stop-color', p.body); stops[2].setAttribute('stop-color', p.shade);
      stripe.setAttribute('stroke', cfg.paint === 'bone' || cfg.paint === 'himalaya' ? '#A31C1B' : '#F1ECE2');
      const l = LIGHTS.find((x) => x.id === cfg.lights) || LIGHTS[0];
      head.setAttribute('fill', l.color);
      defs.querySelector('.beam0').setAttribute('stop-color', l.color);
      defs.querySelector('.beam1').setAttribute('stop-color', l.color);
      wheels.forEach((wh) => (wh.rim.innerHTML = wheelArt(cfg.wheels)));
      const s = STANCES.find((x) => x.id === cfg.stance) || STANCES[1];
      body.setAttribute('transform', `translate(0,${s.y})`);
      return api;
    },
    spin(dx) { spin += dx / 46 * (180 / Math.PI); wheels.forEach((wh) => wh.rim.setAttribute('transform', `rotate(${spin.toFixed(1)})`)); },
    lights(on, beamOpacity = 0.32) { beam.setAttribute('opacity', on ? beamOpacity : 0); tailGlow.setAttribute('opacity', on ? 0.45 : 0); },
    brake(on) { tailGlow.setAttribute('opacity', on ? 0.8 : 0.3); },
    seat, roof, pillar, lower,
  };
  api.set(cfg);
  return api;
}

/* Put the character in the driver's seat (call after S.char is in slot). */
export function seatDriver(char, slot) {
  slot.appendChild(char.el);
  char.setOutfit(char.state.outfit);
  char.snapPose('drive').snapTurn(0.86).look(0.5, 0);
  char.el.setAttribute('transform', 'translate(258,52) scale(0.3)');
}
