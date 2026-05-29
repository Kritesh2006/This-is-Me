/* ============================================================
   KRITESH DHUNGEL — PORTFOLIO JS
   Full-Stack Developer & AI Systems Builder
   ============================================================ */

// ============================
// DYNAMIC AGE
// ============================
function calculateAge() {
  const birth = new Date('2006-06-07');
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
document.addEventListener('DOMContentLoaded', () => {
  const age = calculateAge();
  const el1 = document.getElementById('dynamicAge');
  const el2 = document.getElementById('ageStatNum');
  if (el1) el1.textContent = age;
  if (el2) el2.textContent = age;
});

// ============================
// CUSTOM CURSOR
// ============================
function initCursor() {
  if (window.innerWidth < 768) return;
  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(cursor);
  document.body.appendChild(ring);

  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  function animCursor() {
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animCursor);
  }
  animCursor();

  document.querySelectorAll('a, button, .project-card, .contact-item, .kp-btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(2)';
      ring.style.width = '60px'; ring.style.height = '60px';
      ring.style.borderColor = 'rgba(232,48,48,0.6)';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      ring.style.width = '36px'; ring.style.height = '36px';
      ring.style.borderColor = 'rgba(232,48,48,0.3)';
    });
  });
}

// ============================
// PARTICLE SYSTEM — cursor reactive
// ============================
function createParticleCanvas(canvasId, opts = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const color1 = opts.color1 || '#e83030';
  const color2 = opts.color2 || '#c8882a';
  const density = opts.density || 90;
  const reactive = opts.reactive !== false;

  let W, H, particles = [], time = 0;
  let mouseX = -9999, mouseY = -9999;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  if (reactive) {
    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => {
      mouseX = -9999; mouseY = -9999;
    });
    // For non-absolute canvases, also track global mouse
    document.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(initial = false) {
      this.x = Math.random() * (W || 800);
      this.y = initial ? Math.random() * (H || 600) : (Math.random() < 0.5 ? -5 : (H || 600) + 5);
      this.ox = this.x;
      this.oy = this.y;
      this.size = Math.random() * 1.8 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.life = 0;
      this.maxLife = Math.random() * 350 + 180;
      this.color = Math.random() > 0.65 ? color2 : color1;
    }
    update() {
      // Organic drift
      this.vx += Math.sin(time * 0.009 + this.y * 0.004) * 0.018;
      this.vy += Math.cos(time * 0.007 + this.x * 0.004) * 0.014;
      // Dampen to avoid runaway
      this.vx *= 0.98;
      this.vy *= 0.98;

      // Cursor repulsion
      if (reactive) {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = 80;
        if (dist < repelRadius && dist > 0) {
          const force = (1 - dist / repelRadius) * 1.8;
          this.vx += (dx / dist) * force * 0.6;
          this.vy += (dy / dist) * force * 0.6;
        }
      }

      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life > this.maxLife || this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10) {
        this.reset();
      }
    }
    draw() {
      const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.65;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      const hex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.fillStyle = this.color + hex;
      ctx.fill();
    }
  }

  for (let i = 0; i < density; i++) particles.push(new Particle());

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          const alpha = (1 - dist / 90) * 0.14;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(232,48,48,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function drawGrid() {
    const gs = 60;
    ctx.strokeStyle = 'rgba(232,48,48,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += gs) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += gs) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    if (opts.grid !== false) drawGrid();
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    time++;
    requestAnimationFrame(loop);
  }
  loop();
}

// ============================
// PORTAL CANVAS — entry gate
// ============================
function createPortalCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;

  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const maxR = Math.min(W, H) * 0.38;

    for (let i = 0; i < 5; i++) {
      const r = maxR - i * 16;
      const rot = t * (i % 2 === 0 ? 0.007 : -0.005) + i * 0.5;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      const segments = 24 + i * 6;
      for (let s = 0; s < segments; s++) {
        if (s % 3 === 0) continue;
        const a1 = (s / segments) * Math.PI * 2;
        const a2 = ((s + 0.72) / segments) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, a1, a2);
        ctx.strokeStyle = `rgba(232,48,48,${0.06 + i * 0.012})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.6);
    g.addColorStop(0, `rgba(232,48,48,${0.04 + 0.015 * Math.sin(t * 0.04)})`);
    g.addColorStop(0.5, `rgba(200,136,42,0.01)`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const scanY = (t * 1.1) % H;
    const sg = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 50);
    sg.addColorStop(0, 'transparent');
    sg.addColorStop(0.5, 'rgba(232,48,48,0.035)');
    sg.addColorStop(1, 'transparent');
    ctx.fillStyle = sg;
    ctx.fillRect(0, scanY - 50, W, 100);

    t++;
    requestAnimationFrame(draw);
  }
  draw();
}

// ============================
// HERO CANVAS — wave + glow
// ============================
function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;
  let mouseX = W / 2, mouseY = H / 2;

  function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const gx = mouseX / W;
    const gy = mouseY / H;

    // Ambient glow tracks cursor subtly
    const g = ctx.createRadialGradient(
      W * (0.7 + gx * 0.15), H * (0.6 + gy * 0.2), 0,
      W * (0.7 + gx * 0.15), H * (0.6 + gy * 0.2), H * 0.55
    );
    g.addColorStop(0, `rgba(232,48,48,${0.07 + 0.02 * Math.sin(t * 0.02)})`);
    g.addColorStop(0.4, 'rgba(200,136,42,0.015)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Wave lines
    for (let i = 0; i < 10; i++) {
      const y = H * 0.25 + i * 44;
      const alpha = 0.025 + (i / 10) * 0.025;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < W; x += 3) {
        const wave = Math.sin(x * 0.009 + t * 0.018 + i * 0.45) * 14
                   + Math.sin(x * 0.018 + t * 0.013 + i * 0.9) * 7;
        ctx.lineTo(x, y + wave);
      }
      ctx.strokeStyle = `rgba(232,48,48,${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    t++;
    requestAnimationFrame(draw);
  }
  draw();
}

// ============================
// LOADER
// ============================
function runLoader() {
  const loader = document.getElementById('loader');
  try { createParticleCanvas('loaderCanvas', { density: 70, reactive: false, grid: true }); } catch(e) {}

  let dismissed = false;
  function dismissLoader() {
    if (dismissed) return;
    dismissed = true;
    loader.style.transition = 'opacity 0.6s ease';
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
      showEntryGate();
    }, 600);
  }

  setTimeout(dismissLoader, 3000);
  setTimeout(() => { if (!dismissed) dismissLoader(); }, 5500);
  loader.addEventListener('click', dismissLoader);
}

// ============================
// ENTRY GATE
// ============================
function showEntryGate() {
  const gate = document.getElementById('entryGate');
  gate.classList.remove('hidden');
  gate.style.opacity = '0';
  gate.style.transition = 'opacity 0.6s ease';
  requestAnimationFrame(() => { gate.style.opacity = '1'; });
  createPortalCanvas('gateCanvas');
}

function initEntryGate() {
  const btnViewer = document.getElementById('btnViewer');
  const btnOwner = document.getElementById('btnOwner');
  const ownerModal = document.getElementById('ownerModal');
  const cancelCode = document.getElementById('cancelCode');
  const codeError = document.getElementById('codeError');
  const digits = document.querySelectorAll('.code-digit');
  const kpBtns = document.querySelectorAll('.kp-btn');

  btnViewer.addEventListener('click', () => enterSite(false));

  btnOwner.addEventListener('click', () => {
    ownerModal.classList.remove('hidden');
    setTimeout(() => digits[0].focus(), 100);
  });

  cancelCode.addEventListener('click', () => {
    ownerModal.classList.add('hidden');
    codeError.classList.add('hidden');
    digits.forEach(d => d.value = '');
  });

  // Physical keyboard input
  digits.forEach((d, i) => {
    d.addEventListener('input', () => {
      d.value = d.value.replace(/[^0-9]/g, '');
      if (d.value && i < digits.length - 1) digits[i + 1].focus();
      if (Array.from(digits).every(x => x.value)) verifyCode();
    });
    d.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !d.value && i > 0) digits[i - 1].focus();
      if (e.key === 'Enter') verifyCode();
    });
  });

  // Custom keypad
  kpBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val');
      if (val === 'enter') { verifyCode(); return; }
      if (val === 'del') {
        // Find last filled digit and clear it
        let lastFilled = -1;
        digits.forEach((d, i) => { if (d.value) lastFilled = i; });
        if (lastFilled >= 0) {
          digits[lastFilled].value = '';
          digits[lastFilled].focus();
        }
        return;
      }
      // Find first empty digit
      let inserted = false;
      for (let i = 0; i < digits.length; i++) {
        if (!digits[i].value) {
          digits[i].value = val;
          if (i < digits.length - 1) digits[i + 1].focus();
          else digits[i].focus();
          inserted = true;
          break;
        }
      }
      if (!inserted && Array.from(digits).every(x => x.value)) verifyCode();
    });
  });

  function verifyCode() {
    const code = Array.from(digits).map(d => d.value).join('');
    if (code === '2108') {
      ownerModal.classList.add('hidden');
      enterSite(true);
    } else {
      codeError.classList.remove('hidden');
      digits.forEach(d => d.value = '');
      digits[0].focus();
      const box = document.querySelector('.modal-box');
      box.style.animation = 'none';
      void box.offsetWidth;
      box.style.animation = 'shake 0.4s ease';
    }
  }
}

// ============================
// OWNER MESSAGE SCREEN
// ============================
const OWNER_MSG_LINES = [
  { text: 'Kritesh,', class: 'om-name' },
  { text: '' },
  { text: 'You crossed continents alone.' },
  { text: 'Nepal. Ohio. California. North Carolina.', class: 'om-highlight' },
  { text: 'Every place changed you.' },
  { text: '' },
  { text: 'You learned that confidence grows after action, not before it.', class: 'om-dim' },
  { text: 'You learned that difficult things become normal once you survive them.', class: 'om-dim' },
  { text: 'You learned that most limits were assumptions.', class: 'om-dim' },
  { text: '' },
  { text: 'Remember this:' },
  { text: '' },
  { text: 'You are capable of more than your current results suggest.' },
  { text: '' },
  { text: 'The version of you that arrived in America knew less, had less,', class: 'om-dim' },
  { text: 'and still kept moving forward.', class: 'om-dim' },
  { text: '' },
  { text: 'Your goals were never small.' },
  { text: '' },
  { text: 'Keep building. Keep learning. Keep moving.', class: 'om-highlight' },
  { text: '' },
  { text: 'The only permanent limitation is the one you accept.' },
];

function showOwnerMessage() {
  const screen = document.getElementById('ownerMessage');
  const container = document.getElementById('ownerTypewriter');
  const continueBtn = document.getElementById('ownerContinue');

  screen.classList.remove('hidden');
  screen.style.opacity = '0';
  screen.style.transition = 'opacity 0.5s ease';
  requestAnimationFrame(() => { screen.style.opacity = '1'; });

  try { createParticleCanvas('ownerMsgCanvas', { density: 50, reactive: false, grid: false, color1: '#e83030', color2: '#8b1a1a' }); } catch(e) {}

  // Build typewriter
  let lineIndex = 0;
  let charIndex = 0;
  let currentSpan = null;
  const cursor = document.createElement('span');
  cursor.className = 'om-cursor';
  container.appendChild(cursor);

  function typeNextChar() {
    if (lineIndex >= OWNER_MSG_LINES.length) {
      cursor.remove();
      setTimeout(() => {
        continueBtn.classList.remove('hidden');
        continueBtn.classList.add('visible');
      }, 400);
      return;
    }

    const line = OWNER_MSG_LINES[lineIndex];

    if (charIndex === 0) {
      if (line.text === '') {
        container.insertBefore(document.createElement('br'), cursor);
        container.insertBefore(document.createElement('br'), cursor);
        lineIndex++;
        charIndex = 0;
        setTimeout(typeNextChar, 60);
        return;
      }
      currentSpan = document.createElement('span');
      if (line.class) currentSpan.className = line.class;
      container.insertBefore(currentSpan, cursor);
    }

    if (charIndex < line.text.length) {
      currentSpan.textContent += line.text[charIndex];
      charIndex++;
      const delay = line.text[charIndex - 1] === ',' || line.text[charIndex - 1] === '.' ? 60 : 28;
      setTimeout(typeNextChar, delay);
    } else {
      container.insertBefore(document.createElement('br'), cursor);
      lineIndex++;
      charIndex = 0;
      setTimeout(typeNextChar, 80);
    }
  }

  setTimeout(typeNextChar, 1000);

  continueBtn.addEventListener('click', () => {
    screen.style.transition = 'opacity 0.5s ease';
    screen.style.opacity = '0';
    setTimeout(() => {
      screen.style.display = 'none';
      showTransition();
    }, 500);
  });
}

// ============================
// TRANSITION → MAIN SITE
// ============================
function enterSite(isOwner) {
  const gate = document.getElementById('entryGate');
  gate.style.transition = 'opacity 0.5s ease';
  gate.style.opacity = '0';
  setTimeout(() => {
    gate.style.display = 'none';
    if (isOwner) {
      showOwnerMessage();
    } else {
      showTransition();
    }
  }, 500);
}

function showTransition() {
  const trans = document.getElementById('transitionScreen');
  trans.classList.remove('hidden');
  trans.style.opacity = '1';
  try { createParticleCanvas('transCanvas', { density: 100, reactive: false, grid: true }); } catch(e) {}

  setTimeout(() => {
    trans.style.transition = 'opacity 0.6s ease';
    trans.style.opacity = '0';
    setTimeout(() => {
      trans.style.display = 'none';
      const main = document.getElementById('mainSite');
      main.classList.remove('hidden');
      main.style.opacity = '0';
      main.style.transition = 'opacity 0.8s ease';
      requestAnimationFrame(() => { main.style.opacity = '1'; });
      initMainSite();
    }, 600);
  }, 1800);
}

// ============================
// MAIN SITE
// ============================
function initMainSite() {
  initHeroCanvas();
  initScrollReveal();
  initSkillBars();
  initNavHighlight();
  initNavBurger();
  initCursor();
  // Particle backgrounds on sections
  addSectionParticles();
}

function addSectionParticles() {
  // Hero already has canvas
  // Add subtle particles to story section
  const story = document.getElementById('story');
  if (story) {
    const c = document.createElement('canvas');
    c.id = 'storyCanvas';
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    story.insertBefore(c, story.firstChild);
    createParticleCanvas('storyCanvas', { density: 45, grid: false, reactive: true });
  }
}

// ============================
// SCROLL REVEAL
// ============================
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-tl');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  elements.forEach(el => observer.observe(el));
}

// ============================
// SKILL BARS
// ============================
function initSkillBars() {
  const bars = document.querySelectorAll('.skill-bar');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const w = bar.getAttribute('data-w') || '80';
        bar.style.setProperty('--target-width', w + '%');
        setTimeout(() => bar.classList.add('animated'), 100);
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach(b => observer.observe(b));
}

// ============================
// NAV HIGHLIGHT
// ============================
function initNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-link');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s));
}

// ============================
// MOBILE NAV
// ============================
function initNavBurger() {
  const burger = document.getElementById('navBurger');
  const menu = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => menu.classList.toggle('hidden'));
  menu.querySelectorAll('.mob-link').forEach(l => {
    l.addEventListener('click', () => menu.classList.add('hidden'));
  });
}

// ============================
// GLITCH EFFECT ON NAME
// ============================
function initGlitch() {
  const targets = document.querySelectorAll('.name-first, .name-last');
  targets.forEach(el => {
    const original = el.textContent;
    el.addEventListener('mouseenter', () => {
      let count = 0;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
      const interval = setInterval(() => {
        el.textContent = original.split('').map((c, i) => {
          if (c === ' ') return ' ';
          if (i < count) return original[i];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        count++;
        if (count > original.length) { el.textContent = original; clearInterval(interval); }
      }, 32);
    });
  });
}

// ============================
// SHAKE KEYFRAME
// ============================
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-8px)}
  40%{transform:translateX(8px)}
  60%{transform:translateX(-5px)}
  80%{transform:translateX(5px)}
}`;
document.head.appendChild(style);

// ============================
// BOOT
// ============================
window.addEventListener('DOMContentLoaded', () => {
  initEntryGate();
  runLoader();
  setTimeout(initGlitch, 7000);
});
