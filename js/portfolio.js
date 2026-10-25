/* portfolio.js — renders the portfolio from data.js and wires its
   navigation. Works with zero WebGL: this is the fallback path and
   the recruiter path, so it never depends on the experience. */
import { PROJECTS, SKILLS, currentAge } from './data.js';
import { unlocks } from './store.js';

const JOURNEY = [
  { when: '2006', where: 'Nepal', what: 'Born June 7. Music, language and taking things apart.' },
  { when: '2022', where: 'Kathmandu', what: 'First job, behind a phone repair counter.' },
  { when: 'Jan 2025', where: 'Dayton, Ohio', what: 'Arrived in the US alone at eighteen. Wright State University.' },
  { when: 'May 2025', where: 'California', what: 'Three months across Bakersfield, Fresno, Visalia, Clovis and Porterville.' },
  { when: '2025', where: 'Greensboro', what: 'Forsyth Tech. Repair shifts. First software other people rely on.' },
  { when: 'Now', where: 'Building', what: 'HIMVEDA, Witness, and an internship search.', now: true },
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderJourney() {
  document.getElementById('journeyList').innerHTML = JOURNEY.map((j) => `
    <li class="${j.now ? 'now' : ''}">
      <p class="road-when">${esc(j.when)}</p>
      <p class="road-where">${esc(j.where)}</p>
      <p class="road-what">${esc(j.what)}</p>
    </li>`).join('');
}

function renderProjects() {
  const got = unlocks.all();
  document.getElementById('projectList').innerHTML = PROJECTS.map((p) => {
    const links = p.links.length
      ? `<div class="spec-links">${p.links.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}<span class="sr"> for ${esc(p.name)} (opens in a new tab)</span></a>`).join('')}</div>`
      : `<p class="spec-private">Not public yet</p>`;
    const live = /use|active/i.test(p.status);
    const unlockLine = p.unlock && got.has(p.unlock.id)
      ? `<p class="spec-unlock">Unlocked on the road: ${esc(p.unlock.title)}</p>` : '';
    return `
    <article class="spec${p.featured ? ' featured' : ''}" id="p-${p.id}">
      <div class="spec-row">
        <h3 class="spec-name">${esc(p.name)}<span class="spec-kind">${esc(p.kind)}</span></h3>
        <div class="spec-body">
          <p class="spec-sum">${esc(p.summary)}</p>
          <p class="spec-detail" id="d-${p.id}" hidden>${esc(p.detail)}</p>
          <ul class="spec-stack" aria-label="Built with">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          ${unlockLine}
        </div>
        <div class="spec-side">
          <p class="spec-meta"><b class="${live ? 'live' : ''}">${esc(p.status)}</b>${esc(p.year)}</p>
          ${links}
          <button type="button" class="spec-more" aria-expanded="false" aria-controls="d-${p.id}">How it works</button>
        </div>
      </div>
    </article>`;
  }).join('');

  document.querySelectorAll('.spec-more').forEach((b) => b.addEventListener('click', () => {
    const d = document.getElementById(b.getAttribute('aria-controls'));
    const open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', open); d.hidden = !open;
    b.textContent = open ? 'Less' : 'How it works';
  }));
}

function renderSkills() {
  document.getElementById('skillList').innerHTML = SKILLS.map((g) => `
    <div><h3>${esc(g.group)}</h3><ul>${g.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('');
}

function wireNav() {
  const head = document.getElementById('siteHead');
  const nav = document.getElementById('siteNav');
  const btn = document.getElementById('menuBtn');
  const close = () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', () => {
    const open = !nav.classList.contains('open');
    nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', open);
    if (open) nav.querySelector('a').focus({ preventScroll: true });
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { close(); btn.focus(); } });

  addEventListener('scroll', () => head.classList.toggle('scrolled', scrollY > 10), { passive: true });

  // Highlight the section in view.
  const links = new Map([...nav.querySelectorAll('a')].map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.remove('active'));
      const id = en.target.id === 'now' ? 'work' : en.target.id;
      links.get(id)?.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach((s) => io.observe(s));
}

export function initPortfolio() {
  renderJourney();
  renderProjects();
  renderSkills();
  wireNav();
  const age = currentAge();
  document.querySelectorAll('[data-age]').forEach((n) => (n.textContent = age));
}

export function refreshUnlocks() { renderProjects(); }
