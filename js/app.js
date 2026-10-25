/* ============================================================
   app.js — routing between the three screens:
   opening chooser · story (lazy) · portfolio.
   The story's code, art and styles are only fetched when
   someone chooses PLAY MY STORY.
   ============================================================ */
import { currentAge, OWNER_NOTE } from './data.js';
import { renderPortfolio, wirePortfolio } from './portfolio.js';
import { sfx } from './sfx.js';

const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const entry = $('entry'), site = $('site'), storyHost = $('story');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll('[data-year]').forEach((n) => (n.textContent = new Date().getFullYear()));
document.querySelectorAll('[data-age]').forEach((n) => (n.textContent = `${currentAge()}`));

renderPortfolio();
wirePortfolio();

/* click-sound toggles (entry + header) */
const sndBtns = [...document.querySelectorAll('[data-sound]')];
sfx.onChange((m) => sndBtns.forEach((b) => { b.setAttribute('aria-pressed', String(!m)); b.setAttribute('aria-label', m ? 'Click sounds off' : 'Click sounds on'); }));
sndBtns.forEach((b) => b.addEventListener('click', () => { sfx.setMuted(!sfx.muted); if (!sfx.muted) sfx.click('big'); }));

/* ---------- screens ---------- */
let current = null;
let story = null;      // story module instance
let entryArt = null;   // little animated character on the PLAY card

function setScreen(name) {
  current = name;
  root.className = 'boot-' + (name === 'site' ? 'site' : name);
  entry.hidden = name !== 'entry';
  site.hidden = name !== 'site';
  storyHost.hidden = name !== 'story';
  document.body.classList.toggle('is-story', name === 'story');
  if (name === 'entry') startEntryArt(); else stopEntryArt();
  if (name !== 'story' && story) { story.destroy(); story = null; }
}

function showEntry(push = true) {
  setScreen('entry');
  window.scrollTo(0, 0);
  if (push) history.pushState({ v: 'entry' }, '', location.pathname);
  if (push) $('choosePlay').focus({ preventScroll: true });
}

function showSite(push = true, anchor) {
  setScreen('site');
  if (push) history.pushState({ v: 'site' }, '', location.pathname + (anchor ? anchor : '#top'));
  requestAnimationFrame(() => {
    const t = anchor && document.querySelector(anchor);
    if (t) t.scrollIntoView({ behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto', block: 'start' });
    else window.scrollTo(0, 0);
  });
}

let storyCss = null;
function loadStoryCss() {
  if (storyCss) return storyCss;
  storyCss = new Promise((res) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = './css/story.css?v=3';
    l.onload = res; l.onerror = res;
    document.head.appendChild(l);
  });
  return storyCss;
}

async function startStory(push = true) {
  if (story) { story.destroy(); story = null; }
  setScreen('story');
  if (push) history.pushState({ v: 'story' }, '', location.pathname + '#story');
  storyHost.innerHTML = '<div class="st-loading"><span>KRITESH</span><i></i></div>';
  try {
    const [mod] = await Promise.all([import('./story/story.js'), loadStoryCss()]);
    if (current !== 'story') return;
    story = mod.createStory(storyHost, {
      reducedMotion: reduce.matches,
      onViewWork: () => showSite(true, '#work'),
      onExit: () => showEntry(true),
      onPortfolio: () => showSite(true, '#top'),
      onReplay: () => startStory(false),
    });
  } catch (err) {
    console.error(err);
    storyHost.innerHTML = '<div class="st-loading st-fail"><p>The story could not load. The portfolio has everything.</p><button type="button" class="btn btn-line" id="failRead">Read my portfolio</button></div>';
    $('failRead').onclick = () => showSite(true);
  }
}

/* ---------- entry art: the same character used in the story ---------- */
async function startEntryArt() {
  if (entryArt) { entryArt.run(); return; }
  const host = $('playArt');
  if (!host) return;
  const { createCharacter } = await import('./char/character.js');
  if (current !== 'entry') return;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-150 -895 300 430');
  const ch = createCharacter({ outfit: 'layers', turn: -0.35, expr: 'neutral', pose: 'relaxed' });
  svg.appendChild(ch.el);
  host.appendChild(svg);
  let raf = 0, last = 0, t = 0;
  const loop = (now) => {
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; t += dt;
    // idle: glance toward the visitor, then away
    const phase = Math.floor(t / 3.2) % 3;
    ch.look(phase === 1 ? 0.6 : phase === 2 ? -0.2 : 0, phase === 2 ? 0.2 : 0);
    ch.setTurn(phase === 1 ? -0.15 : -0.35);
    ch.update(dt);
    raf = requestAnimationFrame(loop);
  };
  entryArt = {
    run() { if (!raf && !reduce.matches) { last = 0; raf = requestAnimationFrame(loop); } },
    stop() { cancelAnimationFrame(raf); raf = 0; },
  };
  for (let i = 0; i < 20; i++) ch.update(0.05);
  entryArt.run();
}
function stopEntryArt() { entryArt && entryArt.stop(); }

/* ---------- wiring ---------- */
$('choosePlay').addEventListener('click', () => startStory());
$('chooseRead').addEventListener('click', () => showSite());
document.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', () => startStory()));
$('backToChoice').addEventListener('click', () => showEntry());

function route(push) {
  const h = location.hash, q = location.search;
  if (h === '#story') return startStory(push);
  if (/[?&]portfolio\b/.test(q) || (h && h !== '#story')) return showSite(push, h && h !== '#story' ? h : undefined);
  return showEntry(push);
}
window.addEventListener('popstate', () => route(false));
history.replaceState({ v: 'boot' }, '', location.href);
route(false);

/* ---------- owner note (easter egg, not a login) ---------- */
let taps = 0, tapTimer = 0, typed = '';
function openOwner() {
  $('ownerText').innerHTML = OWNER_NOTE.map((l) => `<p>${l}</p>`).join('');
  $('owner').hidden = false;
  $('ownerClose').focus();
}
$('ronMark').addEventListener('click', () => {
  taps++; clearTimeout(tapTimer); tapTimer = setTimeout(() => (taps = 0), 1200);
  if (taps >= 5) { taps = 0; openOwner(); }
});
document.addEventListener('keydown', (e) => {
  if (current !== 'entry' || e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-5);
  if (typed === 'owner') openOwner();
});
$('ownerClose').addEventListener('click', () => ($('owner').hidden = true));
