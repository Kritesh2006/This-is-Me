/* ============================================================
   plates.js — one diagram per project.
   These are honest drawings of how each thing works (data flow,
   structure), not fake screenshots. viewBox 400×300, drawn in
   currentColor with one accent.
   ============================================================ */

const T = (x, y, s, o = '') => `<text x="${x}" y="${y}" ${o}>${s}</text>`;
const font = `font-family="JetBrains Mono, monospace" font-size="9" letter-spacing="1.2" fill="currentColor"`;

export const PLATES = {
  aria: (acc) => `
  <svg viewBox="0 0 400 300" aria-hidden="true">
    <g ${font}>
      <g stroke="currentColor" fill="none" stroke-width="1" opacity=".5">
        <path d="M70 150 C120 150 120 80 170 80 M70 150 L170 150 M70 150 C120 150 120 220 170 220"/>
        <path d="M250 80 C290 80 290 150 310 150 M250 150 L310 150 M250 220 C290 220 290 150 310 150"/>
      </g>
      <g class="pulse" stroke="${acc}" fill="none" stroke-width="2" stroke-dasharray="6 200">
        <path d="M70 150 C120 150 120 80 170 80"><animate attributeName="stroke-dashoffset" from="0" to="-206" dur="2.4s" repeatCount="indefinite"/></path>
        <path d="M70 150 L170 150"><animate attributeName="stroke-dashoffset" from="0" to="-206" dur="2.4s" begin=".3s" repeatCount="indefinite"/></path>
        <path d="M70 150 C120 150 120 220 170 220"><animate attributeName="stroke-dashoffset" from="0" to="-206" dur="2.4s" begin=".6s" repeatCount="indefinite"/></path>
      </g>
      <circle cx="58" cy="150" r="14" fill="none" stroke="currentColor"/>${T(52, 154, '?', 'font-size="14" font-family="Bodoni Moda, serif"')}
      ${T(30, 182, 'QUESTION')}
      ${[['CLAUDE', 80], ['GEMINI', 150], ['DEEPSEEK', 220]].map(([n, y]) => `<rect x="170" y="${y - 16}" width="80" height="32" fill="none" stroke="currentColor"/>${T(180, y + 3, n)}`).join('')}
      <rect x="310" y="126" width="74" height="48" fill="${acc}" />${T(320, 146, 'JUDGE', 'fill="#FFFFFF"')}${T(320, 162, 'GPT-4o', 'fill="#FFFFFF"')}
      ${T(170, 40, 'PARALLEL ANALYSIS')}${T(306, 200, 'FINAL JUDGMENT')}
    </g>
  </svg>`,

  himveda: (acc) => `
  <svg viewBox="0 0 400 300" aria-hidden="true">
    <g ${font}>
      <path d="M20 250 L90 150 L130 196 L190 110 L250 190 L300 140 L380 250Z" fill="currentColor" opacity=".12"/>
      <path d="M170 128 L190 110 L210 132" fill="none" stroke="currentColor" opacity=".5"/>
      ${['PRODUCER', 'WEIGH', 'INSPECT', 'BATCH', 'BUYER'].map((s, i) => {
        const x = 40 + i * 80;
        return `<circle cx="${x}" cy="150" r="${i === 3 ? 9 : 6}" fill="${i === 3 ? acc : 'none'}" stroke="currentColor"/>${T(x - s.length * 3.2, 178, s)}`;
      }).join('')}
      <path d="M46 150 H114 M126 150 H194 M206 150 H271 M289 150 H354" stroke="currentColor" stroke-dasharray="3 4"/>
      <rect x="40" y="214" width="320" height="22" fill="none" stroke="currentColor" opacity=".55"/>
      ${T(50, 229, 'AUDIT LOG · EVERY STEP RECORDED')}
      ${T(40, 62, 'EVERY BATCH')}${T(40, 78, 'WEIGHED · INSPECTED · TRACEABLE', `fill="${acc}"`)}
    </g>
  </svg>`,

  inventory: (acc) => `
  <svg viewBox="0 0 400 300" aria-hidden="true">
    <g ${font}>
      <rect x="40" y="46" width="320" height="34" fill="none" stroke="currentColor"/>
      ${T(54, 67, 'A15 SCREEN')}<rect x="124" y="57" width="1.5" height="14" fill="${acc}"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/></rect>
      ${T(40, 104, 'QUERY CLASS: SPECIFIC · TOKEN MATCH: "A15"', 'opacity=".7"')}
      ${[['A15 SCREEN · OLED', '1.00', true], ['A15 SCREEN · LCD', '0.96', true], ['A15 BACK GLASS', '0.61', false], ['A51 SCREEN', '—', false]].map(([n, s, hit], i) => {
        const y = 128 + i * 34;
        return `<rect x="40" y="${y}" width="320" height="28" fill="${i === 0 ? acc : 'none'}" stroke="currentColor" opacity="${hit || i === 2 ? 1 : 0.35}"/>${T(52, y + 18, n, i === 0 ? 'fill="#FFFFFF"' : '')}${T(320, y + 18, s, i === 0 ? 'fill="#FFFFFF"' : '')}`;
      }).join('')}
      ${T(40, 282, 'A51 NEVER OUTRANKS A15: WHOLE-TOKEN MATCHING', 'opacity=".7"')}
    </g>
  </svg>`,

  payreport: (acc) => `
  <svg viewBox="0 0 400 300" aria-hidden="true">
    <g ${font}>
      ${T(40, 50, 'CURRENT PERIOD · AUTO-DETECTED')}
      ${Array.from({ length: 35 }, (_, i) => {
        const x = 40 + (i % 7) * 46, y = 66 + Math.floor(i / 7) * 36;
        const day = i - 2;
        const inP = day >= 15 && day <= 30;
        return day >= 0 && day < 31 ? `<rect x="${x}" y="${y}" width="40" height="30" fill="${inP ? 'currentColor' : 'none'}" opacity="${inP ? 0.16 : 1}" stroke="currentColor" stroke-opacity=".35"/>${T(x + 4, y + 12, day + 1)}` : '';
      }).join('')}
      <rect x="40" y="252" width="320" height="28" fill="${acc}"/>${T(52, 270, 'SUMMARY · READY FOR MANAGER', 'fill="#FFFFFF"')}
    </g>
  </svg>`,

  nxtlevelos: (acc) => `
  <svg viewBox="0 0 400 300" aria-hidden="true">
    <g ${font}>
      <rect x="30" y="60" width="120" height="180" fill="none" stroke="currentColor"/>${T(42, 80, 'RENDERER')}${T(42, 96, 'REACT UI', 'opacity=".6"')}
      ${['MEMORIES', 'GOALS', 'JOURNAL', 'HABITS', 'MONEY', 'FILES'].map((s, i) => `<rect x="42" y="${110 + i * 20}" width="96" height="14" fill="currentColor" opacity=".12"/>${T(48, 121 + i * 20, s)}`).join('')}
      <rect x="186" y="40" width="10" height="220" fill="${acc}"/>${T(172, 280, 'CONTEXT BRIDGE')}
      <path d="M150 150 H186 M196 150 H240" stroke="currentColor" stroke-dasharray="3 4"/>
      <ellipse cx="310" cy="108" rx="60" ry="14" fill="none" stroke="currentColor"/>
      <path d="M250 108 V196 A60 14 0 0 0 370 196 V108" fill="none" stroke="currentColor"/>
      <path d="M250 140 A60 14 0 0 0 370 140 M250 170 A60 14 0 0 0 370 170" fill="none" stroke="currentColor" opacity=".4"/>
      ${T(282, 230, 'SQLITE · WAL')}${T(272, 246, 'ONE LOCAL DATABASE', 'opacity=".6"')}
    </g>
  </svg>`,

  airos: (acc) => {
    // 21 MediaPipe-style hand landmarks
    const p = [[200, 250], [170, 228], [150, 196], [138, 168], [126, 144], [176, 160], [170, 116], [166, 88], [162, 64], [200, 156], [200, 106], [200, 74], [200, 48], [222, 160], [228, 114], [232, 86], [235, 62], [242, 172], [256, 136], [264, 114], [270, 94]];
    const bones = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];
    return `
  <svg viewBox="0 0 400 300" aria-hidden="true">
    <g ${font}>
      <g stroke="currentColor" stroke-width="1.6">${bones.map(([a, b]) => `<line x1="${p[a][0]}" y1="${p[a][1]}" x2="${p[b][0]}" y2="${p[b][1]}"/>`).join('')}</g>
      ${p.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 8 || i === 4 ? 5 : 3}" fill="${i === 8 || i === 4 ? acc : 'currentColor'}"/>`).join('')}
      <path d="M126 144 L162 64" stroke="${acc}" stroke-dasharray="3 3"/>
      ${T(30, 40, '21 LANDMARKS · 30 FPS')}${T(290, 70, 'PINCH → CLICK', `fill="${acc}"`)}${T(290, 86, '"HEY AIR" → LISTEN')}
      <rect x="290" y="200" width="80" height="44" fill="none" stroke="currentColor" opacity=".6"/>${T(298, 216, 'CPU 34%')}${T(298, 232, 'RAM OK')}
    </g>
  </svg>`;
  },

  witness: (acc) => `
  <svg viewBox="0 0 400 300" aria-hidden="true">
    <g ${font}>
      <path d="M200 20 L140 110 M200 20 L260 110" stroke="currentColor" opacity=".35"/>
      <rect x="184" y="10" width="32" height="18" fill="currentColor"/>${T(224, 24, 'OVERHEAD CAMERA')}
      <rect x="60" y="120" width="280" height="130" fill="none" stroke="currentColor"/>
      ${Array.from({ length: 24 }, (_, c) => Array.from({ length: 8 }, (_, r) => `<circle cx="${76 + c * 11}" cy="${140 + r * 13}" r="1.6" fill="currentColor" opacity=".45"/>`).join('')).join('')}
      <path d="M109 153 V205 H175" stroke="${acc}" stroke-width="3" fill="none"/>
      <path d="M208 166 H263 V218" stroke="currentColor" stroke-width="3" fill="none"/>
      <rect x="150" y="174" width="40" height="14" fill="currentColor"/>
      ${T(60, 272, 'WIRED ≠ TARGET AT ROW 7', `fill="${acc}"`)}${T(250, 272, 'REPLAY ◀ ▶')}
    </g>
  </svg>`,

  ifix: (acc) => `
  <svg viewBox="0 0 400 300" aria-hidden="true">
    <g ${font}>
      <rect x="150" y="30" width="100" height="200" rx="16" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M160 70 L240 70 M160 90 L220 90" stroke="currentColor" opacity=".5"/>
      <path d="M150 140 L250 120" stroke="${acc}" stroke-width="2"/>
      ${T(60, 270, 'SERVICES · PRICES · HOURS · BOOKING')}
    </g>
  </svg>`,
};
