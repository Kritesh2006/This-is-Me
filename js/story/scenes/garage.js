/* garage.js — make the car yours. */
import { buildCar, seatDriver, PAINTS, WHEELS, LIGHTS, STANCES, saveCar } from '../car.js';
import { tween } from '../util.js';

export async function garage(S) {
  S.audio.mood('usa', 0.04);
  S.audio.wind(0, 300);
  const bg = S.g(S.world);
  bg.innerHTML = `
    <defs>
      <linearGradient id="gfl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16271F"/><stop offset="1" stop-color="#06110C"/></linearGradient>
      <linearGradient id="gbm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CC2D26" stop-opacity="0"/><stop offset=".5" stop-color="#CC2D26" stop-opacity=".75"/><stop offset="1" stop-color="#A31C1B" stop-opacity=".1"/></linearGradient>
      <filter id="gbl"><feGaussianBlur stdDeviation="18"/></filter>
    </defs>
    <rect class="wall" fill="#121413"/><rect class="beam" fill="url(#gbm)" filter="url(#gbl)"/><rect class="floor" fill="url(#gfl)"/>`;
  const wall = bg.querySelector('.wall'), beam = bg.querySelector('.beam'), floor = bg.querySelector('.floor');
  const stage = S.g(S.world);
  const charG = S.g(stage);
  charG.appendChild(S.char.el);
  S.char.el.removeAttribute('transform');
  const ch = S.char;
  ch.setOutfit('layers'); ch.snapPose('relaxed').snapTurn(0.55).snapExpr('neutral').look(0.6, 0.3).walk(false);
  const carG = S.g(stage);
  const car = buildCar(carG, S.car);
  car.lights(true, 0.12);
  let sc = 1, gy = 0, carX = 0;
  S.onResize((W, H) => {
    wall.setAttribute('width', W); wall.setAttribute('height', H);
    const portrait = S.portrait;
    const cw = Math.min(W * (portrait ? 0.92 : 0.6), 860);
    sc = cw / 600;
    gy = H * (portrait ? 0.5 : 0.6);
    floor.setAttribute('y', gy + 40 * sc); floor.setAttribute('width', W); floor.setAttribute('height', H);
    beam.setAttribute('x', W * 0.56); beam.setAttribute('width', Math.max(60, W * 0.08)); beam.setAttribute('height', H);
    carX = (W - cw) / 2 + (portrait ? 0 : W * 0.06);
    carG.setAttribute('transform', `translate(${carX.toFixed(1)},${gy.toFixed(1)}) scale(${sc.toFixed(4)})`);
    const chH = 272 * sc;
    const chX = portrait ? carX + 80 * sc : carX - 90 * sc;
    charG.setAttribute('transform', `translate(${chX.toFixed(1)},${(gy + 44 * sc).toFixed(1)}) scale(${(chH / 880).toFixed(4)})`);
  });

  // the builder panel
  const panel = document.createElement('div');
  panel.className = 'st-garage';
  const groups = [
    ['paint', 'Paint', PAINTS], ['wheels', 'Wheels', WHEELS], ['lights', 'Lights', LIGHTS], ['stance', 'Stance', STANCES],
  ];
  panel.innerHTML = `
    <div class="gx-tabs" role="tablist">${groups.map(([k, n], i) => `<button role="tab" aria-selected="${i === 0}" data-tab="${k}">${n}</button>`).join('')}</div>
    <div class="gx-opts" role="tabpanel"></div>`;
  S.controls.appendChild(panel);
  requestAnimationFrame(() => panel.classList.add('in'));
  const opts = panel.querySelector('.gx-opts');
  let tab = 'paint';
  function render() {
    const list = groups.find((g) => g[0] === tab)[2];
    opts.innerHTML = list.map((o) => {
      const locked = o.locked && !S.abilities.has('himalaya');
      const sw = tab === 'paint' ? `<i style="background:${o.body}"></i>` : tab === 'lights' ? `<i style="background:${o.color}"></i>` : '';
      return `<button type="button" class="gx-opt${S.car[tab] === o.id ? ' on' : ''}" data-id="${o.id}" ${locked ? 'disabled' : ''} aria-pressed="${S.car[tab] === o.id}">${sw}<span>${o.name}</span>${locked ? '<em>Unlock later</em>' : ''}</button>`;
    }).join('');
  }
  render();
  panel.querySelector('.gx-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    tab = b.dataset.tab;
    panel.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    S.audio.tick(); render();
  });
  opts.addEventListener('click', (e) => {
    const b = e.target.closest('.gx-opt'); if (!b || b.disabled) return;
    car.set({ [tab]: b.dataset.id });
    saveCar(S.car);
    S.audio.blip(520 + Math.random() * 200);
    ch.setExpr('smile'); clearTimeout(S._gx); S._gx = setTimeout(() => ch.setExpr('neutral'), 1200);
    render();
  });

  await S.fade(false, 10);
  await S.title('The car', 'Make it yours', 1800);
  S.caption('The car carries the rest of the story.', 3000);
  await S.button('Drive <i>→</i>', 'st-btn-red');
  panel.remove();
  // get in
  ch.setTurn(0.8).look(0.8, 0).setExpr('determined');
  ch.walk(true);
  const g0 = charG.getAttribute('transform');
  await tween(S, 900, (e) => { charG.setAttribute('opacity', (1 - e).toFixed(2)); charG.setAttribute('transform', g0 + ` translate(${(e * 300).toFixed(1)},0)`); });
  ch.walk(false);
  seatDriver(ch, car.slot);
  charG.removeAttribute('opacity');
  S.audio.engine(0.2, true);
  await S.wait(700);
}
