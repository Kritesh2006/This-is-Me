/* quality.js — picks LOW / MEDIUM / HIGH without asking the visitor,
   then keeps adjusting pixel ratio at runtime if frames drop. */

export const TIERS = {
  low:    { name: 'low',    maxDpr: 1,    aa: false, props: 0.55, snow: 220, env: 64 },
  medium: { name: 'medium', maxDpr: 1.5,  aa: false, props: 0.8,  snow: 420, env: 128 },
  high:   { name: 'high',   maxDpr: 2,    aa: true,  props: 1,    snow: 700, env: 256 },
};

/** First guess from device hints, before any WebGL context exists. */
export function guessTier() {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const save = navigator.connection && navigator.connection.saveData;
  const small = Math.min(screen.width, screen.height) < 500;
  if (save || cores <= 2 || mem <= 2) return 'low';
  if (coarse || small) return cores >= 8 && mem >= 6 ? 'medium' : 'low';
  if (cores >= 8 && mem >= 8) return 'high';
  return 'medium';
}

/** Second opinion once we can ask the GPU what it is. */
export function refineTier(tier, gl) {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)).toLowerCase() : '';
    if (/swiftshader|llvmpipe|software|mali-4|adreno \(tm\) 3|powervr sgx/.test(r)) return 'low';
    if (tier === 'high' && /intel(?!.*(iris xe|arc))/.test(r)) return 'medium';
  } catch { /* unknown GPU: keep the guess */ }
  return tier;
}

/** Watches frame time and nudges the pixel ratio down (and once back up). */
export class Governor {
  constructor(renderer, tier) {
    this.r = renderer; this.tier = tier;
    this.dpr = Math.min(devicePixelRatio || 1, tier.maxDpr);
    this.min = 0.75; this.acc = 0; this.n = 0; this.good = 0; this.raised = false;
    renderer.setPixelRatio(this.dpr);
  }
  tick(dt) {
    if (dt > 0.25) return; // tab switch or hitch, ignore
    this.acc += dt; this.n++;
    if (this.acc < 1.5) return;
    const fps = this.n / this.acc; this.acc = 0; this.n = 0;
    if (fps < 42 && this.dpr > this.min) {
      this.dpr = Math.max(this.min, this.dpr - 0.25); this.r.setPixelRatio(this.dpr); this.good = 0;
    } else if (fps > 58) {
      if (++this.good > 4 && !this.raised && this.dpr < Math.min(devicePixelRatio, this.tier.maxDpr)) {
        this.dpr = Math.min(this.dpr + 0.25, this.tier.maxDpr); this.r.setPixelRatio(this.dpr); this.raised = true;
      }
    } else this.good = 0;
  }
}
