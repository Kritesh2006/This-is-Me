/* audio.js — everything is synthesized with WebAudio, so there are
   no audio files to download. Starts muted; the context is only
   created after the visitor turns sound on (autoplay rules). */
import { get, set } from './store.js';

let ctx = null, master, music, engineBus, sfxBus;
let pad = null, engine = null, wind = null;
let enabled = get('sound', false, 'session');
const listeners = new Set();

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.connect(master);
  music = ctx.createGain(); music.gain.value = 0.5; music.connect(comp);
  engineBus = ctx.createGain(); engineBus.gain.value = 0; engineBus.connect(comp);
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.6; sfxBus.connect(comp);

  // Ambient pad: four detuned voices through a slowly breathing filter.
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 700; filt.Q.value = 0.4;
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
  const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 260; lfo.connect(lfoAmt).connect(filt.frequency); lfo.start();
  const padGain = ctx.createGain(); padGain.gain.value = 0.11; filt.connect(padGain).connect(music);
  const voices = [0, 1, 2, 3].map((i) => {
    const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine';
    o.detune.value = (i - 1.5) * 6;
    const g = ctx.createGain(); g.gain.value = i === 0 ? 0.5 : 0.3;
    o.connect(g).connect(filt); o.start(); return o;
  });
  pad = { voices, filt };
  chord([45, 52, 57, 64]);

  // Engine: saw + sub square, low-passed. Pitch follows speed.
  const e1 = ctx.createOscillator(); e1.type = 'sawtooth';
  const e2 = ctx.createOscillator(); e2.type = 'square';
  const ef = ctx.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 300; ef.Q.value = 2;
  const eg = ctx.createGain(); eg.gain.value = 0.16;
  const e2g = ctx.createGain(); e2g.gain.value = 0.5;
  e1.connect(ef); e2.connect(e2g).connect(ef); ef.connect(eg).connect(engineBus);
  e1.start(); e2.start();
  engine = { e1, e2, ef };

  // Wind / road noise.
  const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0; for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3; }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const wf = ctx.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 500;
  const wg = ctx.createGain(); wg.gain.value = 0;
  src.connect(wf).connect(wg).connect(engineBus); src.start();
  wind = { wg, wf };
  setEngine(0);
}

/** Change the pad chord (MIDI notes), gliding over `t` seconds. */
export function chord(notes, t = 3) {
  if (!ctx) { pendingChord = notes; return; }
  pad.voices.forEach((o, i) => o.frequency.setTargetAtTime(hz(notes[i % notes.length]), ctx.currentTime, t / 3));
}
let pendingChord = null;

/** 0..1 music level (used to fade to silence in the dark stretch). */
export function musicLevel(v, t = 2) {
  if (ctx) music.gain.setTargetAtTime(v * 0.5, ctx.currentTime, t / 3);
}

/** Engine on/off and pitch. s: 0..1 speed, on: whether driving. */
export function setEngine(s, on = engineOn) {
  engineOn = on;
  if (!ctx) return;
  const t = ctx.currentTime;
  engineBus.gain.setTargetAtTime(on ? 0.55 : 0, t, 0.4);
  engine.e1.frequency.setTargetAtTime(38 + s * 70, t, 0.15);
  engine.e2.frequency.setTargetAtTime(19 + s * 35, t, 0.15);
  engine.ef.frequency.setTargetAtTime(180 + s * 900, t, 0.2);
  wind.wg.gain.setTargetAtTime(0.02 + s * 0.06, t, 0.3);
}
let engineOn = false;

export function sfx(kind) {
  if (!ctx || !enabled) return;
  const t = ctx.currentTime;
  const tone = (f, dur, type = 'sine', vol = 0.15, delay = 0) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t + delay); g.gain.linearRampToValueAtTime(vol, t + delay + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
    o.connect(g).connect(sfxBus); o.start(t + delay); o.stop(t + delay + dur + 0.05);
  };
  if (kind === 'click') tone(1400, 0.05, 'sine', 0.06);
  else if (kind === 'collect') { tone(1318, 0.18, 'sine', 0.08); tone(1976, 0.25, 'sine', 0.05, 0.05); }
  else if (kind === 'secret') { tone(880, 0.6, 'triangle', 0.08); tone(1318, 0.8, 'sine', 0.06, 0.12); }
  else if (kind === 'unlock') { tone(392, 0.9, 'triangle', 0.1); tone(587, 1.1, 'sine', 0.08, 0.14); tone(784, 1.4, 'sine', 0.06, 0.28); }
  else if (kind === 'bump') { tone(70, 0.35, 'sine', 0.35); tone(140, 0.12, 'square', 0.04); }
  else if (kind === 'checkpoint') { tone(220, 1.6, 'sine', 0.08); tone(330, 1.6, 'sine', 0.05, 0.05); }
}

export function isOn() { return enabled; }

export async function toggle(force) {
  enabled = force ?? !enabled;
  set('sound', enabled, 'session');
  if (enabled && !ctx) { build(); if (pendingChord) chord(pendingChord, 0.1); }
  if (ctx) {
    if (enabled && ctx.state === 'suspended') await ctx.resume();
    master.gain.setTargetAtTime(enabled ? 0.9 : 0, ctx.currentTime, 0.25);
  }
  listeners.forEach((fn) => fn(enabled));
  return enabled;
}

export function onChange(fn) { listeners.add(fn); fn(enabled); }

/* If sound was on earlier this session, it resumes on the next gesture
   (browsers refuse to start audio without one). */
export function resumeOnGesture() {
  if (!enabled) return;
  const go = () => { toggle(true); window.removeEventListener('pointerdown', go); window.removeEventListener('keydown', go); };
  window.addEventListener('pointerdown', go, { once: true });
  window.addEventListener('keydown', go, { once: true });
}
