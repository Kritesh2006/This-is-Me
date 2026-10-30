/* portfolio.js — renders the editorial portfolio from data.js */
import { PROJECTS, SKILLS } from './data.js';
import { PLATES } from './plates.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ACCENT = { forest: '#CC2D26', char: '#CC2D26', red: '#171717' };
const FEATURE_ORDER = ['aria', 'inventory', 'himveda'];

function linkButtons(p) {
  if (!p.links.length) return `<p class="f-private">Private build · link when public</p>`;
  return `<div class="f-links">${p.links.map((l, i) => `<a class="btn ${i === 0 ? 'btn-red' : 'btn-line'}" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} <i aria-hidden="true">↗</i></a>`).join('')}</div>`;
}

export function renderPortfolio() {
  const total = PROJECTS.length;
  const num = (p) => String(PROJECTS.indexOf(p) + 1).padStart(2, '0');
  const featured = FEATURE_ORDER.map((id) => PROJECTS.find((p) => p.id === id));
  const rest = PROJECTS.filter((p) => !FEATURE_ORDER.includes(p.id));

  document.getElementById('featureList').innerHTML = featured.map((p, i) => `
    <article class="feature rv${i === 0 ? ' big' : ''}" id="p-${p.id}">
      <div class="feature-plate plate-${p.plate}">
        <span class="plate-tag">${esc(p.kind)}</span>
        ${PLATES[p.id] ? PLATES[p.id](ACCENT[p.plate]) : ''}
      </div>
      <div class="feature-text">
        <p class="f-meta"><span class="f-no">${num(p)} / ${String(total).padStart(2, '0')}</span><span>${esc(p.year)}</span><span class="f-status${/use|active/i.test(p.status) ? ' live' : ''}">${esc(p.status)}</span></p>
        <h3 class="f-name">${esc(p.name)}</h3>
        <p class="f-kind">${esc(p.kind)}</p>
        <p class="f-sum">${esc(p.summary)}</p>
        <p class="f-detail">${esc(p.detail)}</p>
        <ul class="chips">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        ${linkButtons(p)}
      </div>
    </article>`).join('');

  document.getElementById('moreList').innerHTML = rest.map((p) => `
    <li class="rv" id="p-${p.id}">
      <span class="m-no">${num(p)}</span>
      <h4 class="m-name">${esc(p.name)}<span class="m-kind">${esc(p.kind)} · ${esc(p.year)}</span></h4>
      <div class="m-sum">${esc(p.summary)}<ul class="chips">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div class="m-links">${p.links.length ? p.links.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('') : `<span>${esc(p.status)}</span>`}</div>
    </li>`).join('');

  document.getElementById('skillList').innerHTML = SKILLS.map((g) => `
    <div class="skill-col rv"><h3>${esc(g.group)}</h3><ul>${g.items.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>`).join('');

}

export function wirePortfolio() {
  const head = document.getElementById('siteHead');
  const nav = document.getElementById('siteNav');
  const menu = document.getElementById('menuBtn');
  const setSolid = () => head.classList.toggle('solid', window.scrollY > 40 || nav.classList.contains('open'));
  window.addEventListener('scroll', setSolid, { passive: true });
  setSolid();

  const closeMenu = () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; setSolid(); };
  menu.addEventListener('click', () => {
    const open = !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    setSolid();
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('a,button')) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu(); });

  // reveal on scroll
  const items = document.querySelectorAll('.rv, .sec-head, .about-big, .hero-copy, .hero-photo');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((el) => el.classList.add('rv'));
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
  } else items.forEach((el) => el.classList.add('in'));

  // current section in nav
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const secs = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io2 = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach((s) => io2.observe(s));
  }
}
