/* sprites.js — bakes the locked 2D character into animation frames
   (texture atlases) so he can live inside the 3D scenes as a billboard.
   The character drawing itself is never modified here; we only pose it.

   Walking AWAY from the camera is not the side-view walk cycle: legs swinging
   sideways would look wrong from behind. Instead each step shortens the lifted
   leg (it moves toward the depth of the scene), arms swing a little, and the
   body bobs and sways — a natural back-view walk. */
import { createCharacter } from '../char/character.js';

const NS = 'http://www.w3.org/2000/svg';
const VB = { x: -270, y: -915, w: 540, h: 960 };
const SHOULDER_Y = -626, HIP_Y = -396;

function svgFor(ch) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('xmlns', NS);
  svg.setAttribute('viewBox', `${VB.x} ${VB.y} ${VB.w} ${VB.h}`);
  svg.appendChild(ch.el);
  return svg;
}

function toImage(svg, w, h) {
  svg.setAttribute('width', w); svg.setAttribute('height', h);
  const str = new XMLSerializer().serializeToString(svg);
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str);
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; });
}

/* Each recipe returns a function (ch, i, n) that poses frame i of n. */
const RECIPES = {
  walkBack: (outfit) => ({
    setup: (ch) => { ch.setOutfit(outfit); ch.setView('back'); ch.snapTurn(0); ch.snapPose('stand'); },
    frame: (ch, i, n, parts) => {
      const ph = (i / n) * Math.PI * 2;
      const s = Math.sin(ph);
      const liftL = Math.max(0, s), liftR = Math.max(0, -s);
      const [legB, armB, , legF, , armF] = parts;
      const leg = (lift) => `translate(0,${(-lift * 16).toFixed(1)}) translate(0,${HIP_Y}) scale(1,${(1 - lift * 0.11).toFixed(3)}) translate(0,${-HIP_Y})`;
      legB.setAttribute('transform', leg(liftR));
      legF.setAttribute('transform', leg(liftL));
      armB && armB.setAttribute('transform', `rotate(${(s * 6).toFixed(1)} 70 ${SHOULDER_Y})`);
      armF && armF.setAttribute('transform', `rotate(${(-s * 6).toFixed(1)} -70 ${SHOULDER_Y})`);
      const bob = -Math.abs(Math.cos(ph)) * 7, sway = s * 4;
      return `translate(${sway.toFixed(1)},${bob.toFixed(1)}) rotate(${(s * 0.8).toFixed(2)} 0 0)`;
    },
  }),
  idleBack: (outfit) => ({
    setup: (ch) => { ch.setOutfit(outfit); ch.setView('back'); ch.snapTurn(0); ch.snapPose('stand'); },
    frame: (ch, i, n) => `translate(0,${(Math.sin((i / n) * Math.PI * 2) * 2).toFixed(1)})`,
  }),
  type: (outfit) => ({
    setup: (ch) => { ch.setOutfit(outfit); ch.setView('front'); ch.snapPose('type'); ch.snapTurn(0.55); ch.snapExpr('focused'); ch.look(0.5, 0.25); ch.type(true); },
    frame: () => '',
  }),
  idleFront: (outfit) => ({
    setup: (ch) => { ch.setOutfit(outfit); ch.setView('front'); ch.snapPose('relaxed'); ch.snapTurn(0.25); ch.snapExpr('neutral'); ch.look(0.1, 0); },
    frame: (ch, i, n) => { if (i === n - 1) ch.state.blink = 1; return ''; },
  }),
};

/* Bake one atlas: n frames laid out in a row-major grid. */
export async function bake(kind, outfit, n = 12, cellW = 256) {
  const cellH = Math.round(cellW * VB.h / VB.w);
  const cols = Math.min(n, 6), rows = Math.ceil(n / cols);
  const canvas = document.createElement('canvas');
  canvas.width = cols * cellW; canvas.height = rows * cellH;
  const ctx = canvas.getContext('2d');
  const ch = createCharacter({ outfit, breathe: false });
  const svg = svgFor(ch);
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-9999px;top:0;width:10px;height:10px;overflow:hidden;';
  host.appendChild(svg); document.body.appendChild(host);
  const R = RECIPES[kind](outfit);
  R.setup(ch);
  ch.state.nextBlink = 1e9;
  for (let k = 0; k < 30; k++) ch.update(0.05); // settle the pose
  const body = ch.el.firstChild.firstChild; // root > flip > body
  for (let i = 0; i < n; i++) {
    ch.state.nextBlink = 1e9; ch.state.blink = 0;
    ch.update(kind === 'type' ? 0.045 : 0.0001);
    const parts = [...body.children];
    const tf = R.frame(ch, i, n, parts) || '';
    ch.el.setAttribute('transform', tf);
    if (ch.state.blink) ch.update(0.0001);
    const im = await toImage(svg, cellW, cellH);
    ctx.drawImage(im, (i % cols) * cellW, Math.floor(i / cols) * cellH, cellW, cellH);
    parts.forEach((p, idx) => { if (idx === 0 || idx === 1 || idx === 3 || idx === 5) p.removeAttribute('transform'); });
  }
  host.remove();
  return { canvas, n, cols, rows, aspect: VB.w / VB.h, feet: (0 - VB.y) / VB.h };
}
