/* tex.js — every texture is drawn on a canvas at runtime.
   No image downloads for the 3D world at all. */
import * as THREE from 'three';

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }

function finish(c, { repeat = false, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  return t;
}

/** Soft radial blob: glows, light pools, contact shadow. */
export function radial(stops = [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']], size = 128) {
  const [c, g] = canvas(size, size);
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return finish(c);
}

/** Asphalt with three lanes: solid edges, dashed separators. */
export function road() {
  const W = 256, H = 512;
  const [c, g] = canvas(W, H);
  g.fillStyle = '#121212'; g.fillRect(0, 0, W, H);
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  // tyre polish in each lane
  [W / 6, W / 2, (5 * W) / 6].forEach((x) => {
    const gr = g.createLinearGradient(x - 30, 0, x + 30, 0);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(0,0,0,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - 30, 0, 60, H);
  });
  g.fillStyle = 'rgba(232,228,218,.85)';
  g.fillRect(6, 0, 5, H); g.fillRect(W - 11, 0, 5, H);
  g.fillStyle = 'rgba(232,228,218,.7)';
  for (let y = 0; y < H; y += 128) { g.fillRect(W / 3 - 2, y, 4, 64); g.fillRect((2 * W) / 3 - 2, y, 4, 64); }
  return finish(c, { repeat: true });
}

/** Lit windows for city buildings. */
export function windows() {
  const [c, g] = canvas(128, 256);
  g.fillStyle = '#070807'; g.fillRect(0, 0, 128, 256);
  for (let y = 6; y < 256; y += 12) for (let x = 6; x < 128; x += 14) {
    const r = Math.random();
    if (r < 0.13) { g.fillStyle = r < 0.006 ? 'rgba(213,35,32,.6)' : `rgba(241,226,190,${0.25 + Math.random() * 0.4})`; g.fillRect(x, y, 8, 6); }
  }
  return finish(c, { repeat: true });
}

/** Headlight throw on the road: bright near the car, gone at range. */
export function beam() {
  const [c, g] = canvas(128, 256);
  const gr = g.createLinearGradient(0, 256, 0, 0);
  gr.addColorStop(0, 'rgba(255,240,215,.0)'); gr.addColorStop(0.08, 'rgba(255,240,215,.75)');
  gr.addColorStop(0.45, 'rgba(255,240,215,.28)'); gr.addColorStop(1, 'rgba(255,240,215,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 256);
  g.globalCompositeOperation = 'destination-in';
  const side = g.createLinearGradient(0, 0, 128, 0);
  side.addColorStop(0, 'rgba(0,0,0,0)'); side.addColorStop(0.3, 'rgba(0,0,0,1)'); side.addColorStop(0.7, 'rgba(0,0,0,1)'); side.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = side; g.fillRect(0, 0, 128, 256);
  return finish(c);
}

/**
 * Sign / billboard face. kind: 'chapter' (forest green road sign) or 'gate' (project board).
 */
export function sign({ title, sub = '', note = '', kind = 'chapter' }) {
  const W = 1024, H = 384;
  const [c, g] = canvas(W, H);
  const serif = '"Bodoni Moda", Didot, Georgia, serif';
  const sans = 'Archivo, "Helvetica Neue", Arial, sans-serif';
  if (kind === 'chapter') {
    g.fillStyle = '#0b1d14'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(241,238,232,.85)'; g.lineWidth = 6; g.strokeRect(18, 18, W - 36, H - 36);
    g.fillStyle = '#f1eee8'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `500 ${title.length > 12 ? 92 : 124}px ${sans}`;
    g.fillText(title.toUpperCase(), W / 2, H / 2 - (sub ? 26 : 0));
    if (sub) { g.font = `400 46px ${sans}`; g.fillStyle = 'rgba(241,238,232,.75)'; g.fillText(sub.toUpperCase(), W / 2, H / 2 + 92); }
  } else {
    g.fillStyle = '#060606'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#d52320'; g.fillRect(0, 0, W, 12);
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = 'rgba(241,238,232,.6)'; g.font = `500 34px ${sans}`;
    g.fillText(sub, 56, 92);
    g.fillStyle = '#f1eee8'; g.font = `400 ${title.length > 9 ? 120 : 150}px ${serif}`;
    g.fillText(title, 50, 236);
    g.fillStyle = '#d52320'; g.fillRect(56, 286, 40, 3);
    g.fillStyle = 'rgba(241,238,232,.85)'; g.font = `400 36px ${sans}`;
    g.fillText(note, 112, 300);
  }
  return finish(c);
}

/** Wait (briefly) for the web fonts so canvas text uses them. */
export async function fontsReady() {
  if (!document.fonts) return;
  const want = ['400 100px "Bodoni Moda"', '500 100px Archivo'];
  await Promise.race([
    Promise.all(want.map((f) => document.fonts.load(f))),
    new Promise((r) => setTimeout(r, 1200)),
  ]).catch(() => {});
}
