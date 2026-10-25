/* app.js — flow: boot → entry → (garage ⇄ road) or portfolio.
   The portfolio is always one action away, from every state. */
import { initPortfolio, refreshUnlocks } from './portfolio.js';
import { OWNER_NOTE } from './data.js';
import { get, set } from './store.js';
import * as audio from './audio.js';

const $ = (id) => document.getElementById(id);
const body = document.body;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 50) : ms));

let mode = 'boot';
// Only move focus programmatically for keyboard users; mouse users get no stray rings.
let keyboardUser = false;
addEventListener('keydown', (e) => { if (e.key === 'Tab' || e.key === 'Enter' || e.key.startsWith('Arrow')) keyboardUser = true; }, true);
addEventListener('pointerdown', () => { keyboardUser = false; }, true);
const focus = (el) => { if (el && keyboardUser) el.focus({ preventScroll: true }); };
let xp = null, xpLoading = null;
let hideTimers = [];
const later = (fn, ms) => hideTimers.push(setTimeout(fn, ms));
const clearLater = () => { hideTimers.forEach(clearTimeout); hideTimers = []; };

document.querySelectorAll('[data-year]').forEach((n) => (n.textContent = new Date().getFullYear()));
initPortfolio();

/* ---------- toast ---------- */
let toastT;
function toast(msg, ms = 3600) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---------- boot ---------- */
async function boot() {
  const seen = get('seen', false, 'session');
  const linesEl = $('bootLines'), bar = $('bootBar');
  const lines = ['Initializing', 'Loading identity', 'Loading memory', 'Connecting systems', 'Ready'];
  let skipped = false;
  const skip = () => { skipped = true; };
  addEventListener('pointerdown', skip, { once: true });
  addEventListener('keydown', skip, { once: true });
  if (!seen && !reduced) {
    for (let i = 0; i < lines.length && !skipped; i++) {
      const li = document.createElement('li'); li.textContent = lines[i].toUpperCase(); linesEl.append(li);
      bar.style.width = `${((i + 1) / lines.length) * 100}%`;
      await wait(i === lines.length - 1 ? 260 : 190);
    }
  }
  removeEventListener('pointerdown', skip); removeEventListener('keydown', skip);
  set('seen', true, 'session');
  $('boot').classList.add('out');
  showEntry();
  setTimeout(() => $('boot').remove(), 600);
}

/* ---------- entry ---------- */
function showEntry() {
  mode = 'entry';
  const e = $('entry'); e.hidden = false;
  requestAnimationFrame(() => e.classList.add('in'));
  setTimeout(() => $('btnEnter').focus({ preventScroll: true }), 400); // entry: a single obvious action, focus it for everyone
  // warm the 3D module in the background while the visitor reads
  const save = navigator.connection && navigator.connection.saveData;
  if (!save) setTimeout(() => loadXP().catch(() => {}), 900);
}

function loadXP() {
  if (!xpLoading) xpLoading = import('./xp/index.js');
  return xpLoading;
}

$('btnEnter').addEventListener('click', () => enterExperience());
$('btnSkip').addEventListener('click', () => showSite());

addEventListener('keydown', (e) => {
  if (mode === 'entry' && !$('owner').hidden) return;
  if (mode === 'entry') {
    if (e.key === 'Escape') { e.preventDefault(); showSite(); }
  } else if (mode === 'xp' && e.key === 'Escape') { e.preventDefault(); showSite(); }
  else if (mode === 'xp' && (e.key === 'm' || e.key === 'M')) audio.toggle();
});

/* ---------- experience ---------- */
async function enterExperience() {
  if (mode === 'xp') return;
  audio.sfx('click');
  const from = mode;
  mode = 'xp';
  clearLater();
  body.className = 'mode-xp';
  const stage = $('stage');
  stage.hidden = false; stage.classList.remove('out');
  $('garage').hidden = true; $('hud').hidden = true; $('ending').hidden = true;
  $('darkVeil').style.opacity = '1';
  if (from === 'entry') { $('entry').classList.add('out'); setTimeout(() => ($('entry').hidden = true), 700); }
  if (from === 'site') $('site').hidden = true;
  try {
    const mod = await loadXP();
    if (!mod.webglAvailable()) throw new Error('webgl');
    if (!xp) xp = await mod.createExperience({ onEnd: () => { refreshUnlocks(); focus($('btnSeeWork')); } });
    window.__ron = xp; // handy for debugging in the console
    await xp.showGarage();
    focus($('btnDrive'));
  } catch (err) {
    console.warn('3D experience unavailable:', err);
    toast('This browser can\'t run the 3D drive, so here is the portfolio.', 5000);
    showSite();
  }
}

$('btnDrive').addEventListener('click', async () => { audio.sfx('click'); await xp?.startDrive(); });
$('btnBackGarage').addEventListener('click', () => xp?.showGarage().then(() => focus($('btnDrive'))));
$('btnExit').addEventListener('click', () => showSite());
$('btnGaragePortfolio').addEventListener('click', () => showSite());
$('btnSeeWork').addEventListener('click', () => showSite('work'));
[$('btnSiteDrive'), $('btnFootDrive')].forEach((b) => b.addEventListener('click', () => enterExperience()));

/* ---------- portfolio ---------- */
function showSite(target) {
  if (mode === 'site') { if (target) $(target)?.scrollIntoView(); return; }
  const from = mode;
  mode = 'site';
  xp?.pause();
  audio.setEngine(0, false);
  const site = $('site');
  site.hidden = false; site.classList.add('enter');
  body.className = 'mode-site';
  clearLater();
  ['entry', 'stage', 'boot'].forEach((id) => { const n = $(id); if (n) { n.classList.add('out'); later(() => (n.hidden = true), from === 'boot' ? 0 : 650); } });
  if (target) requestAnimationFrame(() => $(target)?.scrollIntoView({ behavior: 'instant' }));
  else scrollTo({ top: 0, behavior: 'instant' });
  refreshUnlocks();
  setTimeout(() => focus(target ? $(target)?.querySelector('h2') : document.querySelector('.wordmark')), 50);
}
// headings can receive focus programmatically for screen readers after a mode switch
document.querySelectorAll('#site h2').forEach((h) => h.setAttribute('tabindex', '-1'));

/* ---------- sound ---------- */
const sndBtn = $('btnSound');
sndBtn.addEventListener('click', () => audio.toggle());
audio.onChange((on) => {
  sndBtn.setAttribute('aria-pressed', on);
  sndBtn.setAttribute('aria-label', on ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on');
});
audio.resumeOnGesture();

/* ---------- owner note (easter egg) ----------
   The old version hid a passcode in JavaScript, which anyone can read.
   This is honest about what it is: tap RON five times, or type "owner". */
let taps = 0, tapT;
$('ronMark').addEventListener('click', () => {
  taps++; clearTimeout(tapT); tapT = setTimeout(() => (taps = 0), 1600);
  if (taps >= 5) { taps = 0; openOwner(); }
});
let typed = '';
addEventListener('keydown', (e) => {
  if (mode !== 'entry' || e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-5);
  if (typed === 'owner') openOwner();
});
function openOwner() {
  const o = $('owner'), t = $('ownerText');
  t.innerHTML = '';
  OWNER_NOTE.forEach((line, i) => { const p = document.createElement('p'); p.textContent = line; p.style.animationDelay = `${0.2 + i * 0.55}s`; t.append(p); });
  o.hidden = false; $('ownerClose').focus();
}
$('ownerClose').addEventListener('click', () => { $('owner').hidden = true; $('btnEnter').focus(); });
$('owner').addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); if (e.key === 'Escape') $('ownerClose').click(); } });

addEventListener('hashchange', () => { const h = location.hash.slice(1); if (mode !== 'site' && h && $(h)) showSite(h); });

/* ---------- start ----------
   Deep links (#work, ?portfolio) and returning recruiters skip the intro. */
const params = new URLSearchParams(location.search);
const hash = location.hash.slice(1);
if (params.has('portfolio') || (hash && $(hash))) {
  $('boot').remove(); $('entry').hidden = true;
  showSite(hash && $(hash) ? hash : undefined);
} else if (params.has('drive')) {
  $('boot').remove(); mode = 'entry'; enterExperience();
} else {
  boot();
}
