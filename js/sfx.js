/* sfx.js — quiet sci-fi tap sounds for clicks, synthesized (no audio files).
   A short keyboard-style click (filtered noise) with a tiny falling tone on top. */
const KEY = 'kd.sound';
let ac = null, out = null, noise = null;
let muted = false;
try { muted = localStorage.getItem(KEY) === 'off'; } catch (e) { /* storage blocked */ }
const listeners = new Set();

function ensure() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ac = new AC();
  out = ac.createGain(); out.gain.value = 0.5; out.connect(ac.destination);
  const len = Math.floor(ac.sampleRate * 0.05);
  noise = ac.createBuffer(1, len, ac.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  return true;
}

function click(kind = 'tap') {
  if (muted || !ensure()) return;
  const t = ac.currentTime;
  const j = 1 + (Math.random() - 0.5) * 0.12; // tiny variation so repeats feel natural
  // the "key" — a very short bandpassed noise tick
  const src = ac.createBufferSource(); src.buffer = noise;
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = (kind === 'big' ? 2400 : 3600) * j; bp.Q.value = 1.2;
  const g = ac.createGain(); g.gain.setValueAtTime(kind === 'big' ? 0.22 : 0.16, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  src.connect(bp); bp.connect(g); g.connect(out); src.start(t); src.stop(t + 0.05);
  // the sci-fi part — a soft glassy blip that falls in pitch
  const o = ac.createOscillator(); o.type = 'sine';
  const f0 = (kind === 'big' ? 1250 : 1900) * j;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.62, t + 0.06);
  const g2 = ac.createGain(); g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(kind === 'big' ? 0.05 : 0.03, t + 0.004); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  o.connect(g2); g2.connect(out); o.start(t); o.stop(t + 0.1);
  if (kind === 'big') { // a second, higher blip for primary actions
    const o2 = ac.createOscillator(); o2.type = 'sine'; o2.frequency.value = f0 * 1.5;
    const g3 = ac.createGain(); g3.gain.setValueAtTime(0.0001, t + 0.05); g3.gain.exponentialRampToValueAtTime(0.025, t + 0.055); g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    o2.connect(g3); g3.connect(out); o2.start(t + 0.05); o2.stop(t + 0.15);
  }
}

export const sfx = {
  click,
  get muted() { return muted; },
  setMuted(m) {
    muted = m;
    try { localStorage.setItem(KEY, m ? 'off' : 'on'); } catch (e) { /* storage blocked */ }
    listeners.forEach((fn) => fn(m));
  },
  onChange(fn) { listeners.add(fn); fn(muted); return () => listeners.delete(fn); },
};

/* One listener for the whole page: every button, link and tab ticks on press. */
const SEL = 'a[href], button, [role="tab"], .st-hold, .st-pad, input[type="range"], summary';
const BIG = '.btn-red, .st-btn-red, .choice, .nav-play, .bd-card, .st-btn';
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest(SEL);
  if (!el || el.disabled) return;
  click(el.matches(BIG) ? 'big' : 'tap');
}, { capture: true, passive: true });
document.addEventListener('keydown', (e) => {
  if ((e.key !== 'Enter' && e.key !== ' ') || e.repeat) return;
  const el = e.target.closest && e.target.closest(SEL);
  if (el && !el.disabled) click(el.matches(BIG) ? 'big' : 'tap');
}, { capture: true });
