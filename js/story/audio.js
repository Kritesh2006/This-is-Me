/* audio.js — a tiny WebAudio synth. No audio files are downloaded. */
export function createAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  let ac = null, master = null, pad = null, engine = null, noise = null, hold = null;
  let muted = false;

  function ensure() {
    if (ac || !AC) return !!ac;
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.55; master.connect(ac.destination);
    return true;
  }
  const now = () => ac.currentTime;

  function makePad() {
    const g = ac.createGain(); g.gain.value = 0;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; f.Q.value = 0.4;
    g.connect(f); f.connect(master);
    const oscs = [0, 1, 2].map((i) => {
      const o = ac.createOscillator(); o.type = i === 2 ? 'sine' : 'triangle';
      o.detune.value = (i - 1) * 7; o.connect(g); o.start(); return o;
    });
    return { g, f, oscs };
  }
  function makeNoise() {
    const len = ac.sampleRate * 2;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) { b = 0.98 * b + 0.02 * (Math.random() * 2 - 1); d[i] = b * 6; }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    const g = ac.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(master); src.start();
    return { g, f };
  }
  function makeEngine() {
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 40;
    const o2 = ac.createOscillator(); o2.type = 'square'; o2.frequency.value = 20;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220;
    const g = ac.createGain(); g.gain.value = 0;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(master); o.start(); o2.start();
    return { o, o2, f, g };
  }

  const MOODS = {
    nepal: [146.8, 220, 293.7],    // D
    leave: [130.8, 196, 261.6],    // C
    air: [110, 164.8, 220],        // A
    usa: [123.5, 185, 246.9],      // B
    ohio: [116.5, 174.6, 233.1],   // Bb
    cali: [146.8, 185, 220],       // D maj
    nc: [130.8, 164.8, 196],       // C maj
    end: [146.8, 220, 277.2],
    none: null,
  };

  const api = {
    start() { if (!ensure()) return; if (ac.state === 'suspended') ac.resume(); pad = makePad(); noise = makeNoise(); engine = makeEngine(); },
    stop() { try { ac && ac.close(); } catch (e) { /* closed */ } ac = null; },
    suspend() { ac && ac.suspend(); },
    resume() { ac && ac.resume(); },
    setMuted(m) { muted = m; if (master) master.gain.setTargetAtTime(m ? 0 : 0.55, now(), 0.1); },
    mood(name, level = 0.06) {
      if (!pad) return;
      const ch = MOODS[name];
      if (!ch) { pad.g.gain.setTargetAtTime(0, now(), 0.6); return; }
      pad.oscs.forEach((o, i) => o.frequency.setTargetAtTime(ch[i], now(), 0.8));
      pad.g.gain.setTargetAtTime(level, now(), 1.2);
    },
    wind(level = 0, cutoff = 500) { if (!noise) return; noise.g.gain.setTargetAtTime(level, now(), 0.5); noise.f.frequency.setTargetAtTime(cutoff, now(), 0.5); },
    engine(speed01, on = true) {
      if (!engine) return;
      engine.g.gain.setTargetAtTime(on ? 0.05 + speed01 * 0.07 : 0, now(), 0.15);
      engine.o.frequency.setTargetAtTime(38 + speed01 * 70, now(), 0.15);
      engine.o2.frequency.setTargetAtTime(19 + speed01 * 35, now(), 0.15);
      engine.f.frequency.setTargetAtTime(180 + speed01 * 500, now(), 0.15);
    },
    tick() {
      if (!ac || muted) return;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.value = 1400;
      g.gain.setValueAtTime(0.05, now()); g.gain.exponentialRampToValueAtTime(0.0001, now() + 0.06);
      o.connect(g); g.connect(master); o.start(); o.stop(now() + 0.08);
    },
    pluck(freq, when = 0, vol = 0.18) {
      if (!ac || muted) return;
      const t = now() + when;
      const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
      o.type = 'triangle'; o2.type = 'sawtooth'; o.frequency.value = freq; o2.frequency.value = freq * 1.003;
      f.type = 'lowpass'; f.frequency.setValueAtTime(3000, t); f.frequency.exponentialRampToValueAtTime(400, t + 0.8);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(f); o2.connect(f); f.connect(g); g.connect(master);
      o.start(t); o2.start(t); o.stop(t + 1.7); o2.stop(t + 1.7);
    },
    strum(chord = [146.8, 220, 293.7, 370, 440]) { chord.forEach((fq, i) => api.pluck(fq, i * 0.035, 0.1)); },
    unlock() { [523.3, 659.3, 784, 1046.5].forEach((fq, i) => api.pluck(fq, i * 0.07, 0.08)); },
    blip(freq = 660) { api.pluck(freq, 0, 0.06); },
    holdTone(p) {
      if (!ac || muted) return;
      if (p < 0) { if (hold) { hold.g.gain.setTargetAtTime(0, now(), 0.05); const h = hold; setTimeout(() => { try { h.o.stop(); } catch (e) { /* stopped */ } }, 200); hold = null; } return; }
      if (!hold) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; g.gain.value = 0; o.connect(g); g.connect(master); o.start(); hold = { o, g }; }
      hold.o.frequency.setTargetAtTime(180 + p * 260, now(), 0.03);
      hold.g.gain.setTargetAtTime(0.05, now(), 0.05);
    },
  };
  return api;
}
