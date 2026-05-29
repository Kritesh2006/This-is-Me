/* ============================================================
   KRITESH DHUNGEL — PORTFOLIO JS
   Cinematic animations, entry gate, canvas effects
   ============================================================ */

// ============================
// DYNAMIC AGE CALCULATION
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

  document.querySelectorAll('a, button, .project-card, .contact-item').forEach(el => {
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
// PARTICLE / WAVE CANVAS
// ============================
function createParticleCanvas(canvasId, color1 = '#e83030', color2 = '#c8882a', density = 80) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], time = 0;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.size = Math.random() * 1.5 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.life = 0;
      this.maxLife = Math.random() * 300 + 200;
      this.color = Math.random() > 0.7 ? color2 : color1;
    }
    update() {
      this.x += this.vx + Math.sin(time * 0.01 + this.y * 0.005) * 0.2;
      this.y += this.vy + Math.cos(time * 0.008 + this.x * 0.005) * 0.15;
      this.life++;
      if (this.life > this.maxLife || this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.6;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2,'0');
      ctx.fill();
    }
  }

  for (let i = 0; i < density; i++) particles.push(new Particle());

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 100) {
          const alpha = (1 - dist/100) * 0.12;
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
    ctx.strokeStyle = 'rgba(232,48,48,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += gs) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += gs) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    time++;
    requestAnimationFrame(loop);
  }
  loop();
}

// ============================
// PORTAL / ENERGY RING CANVAS
// ============================
function createPortalCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawPortal() {
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const maxR = Math.min(W, H) * 0.4;

    // Outer rotating rings
    for (let i = 0; i < 5; i++) {
      const r = maxR - i * 18;
      const rot = t * (i % 2 === 0 ? 0.008 : -0.006) + i * 0.5;
      const alpha = 0.08 + i * 0.015;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.beginPath();
      // Segmented ring
      const segments = 24 + i * 8;
      for (let s = 0; s < segments; s++) {
        if (s % 3 === 0) continue;
        const a1 = (s / segments) * Math.PI * 2;
        const a2 = ((s + 0.7) / segments) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, a1, a2);
        ctx.strokeStyle = `rgba(232,48,48,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Glowing center
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.6);
    gradient.addColorStop(0, `rgba(232,48,48,${0.04 + 0.02 * Math.sin(t * 0.05)})`);
    gradient.addColorStop(0.5, `rgba(200,136,42,0.01)`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Scan lines
    const scanY = ((t * 1.2) % H);
    const scanGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
    scanGrad.addColorStop(0, 'rgba(232,48,48,0)');
    scanGrad.addColorStop(0.5, 'rgba(232,48,48,0.04)');
    scanGrad.addColorStop(1, 'rgba(232,48,48,0)');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(0, scanY - 60, W, 120);

    t++;
    requestAnimationFrame(drawPortal);
  }
  drawPortal();
}

// ============================
// HERO CANVAS - wave field
// ============================
function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Glow orb bottom-right
    const g = ctx.createRadialGradient(W * 0.85, H * 0.75, 0, W * 0.85, H * 0.75, H * 0.5);
    g.addColorStop(0, `rgba(232,48,48,${0.08 + 0.02 * Math.sin(t * 0.02)})`);
    g.addColorStop(0.5, 'rgba(200,136,42,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Wave lines
    const lineCount = 8;
    for (let i = 0; i < lineCount; i++) {
      const y = H * 0.3 + i * 40;
      const alpha = 0.03 + (i / lineCount) * 0.03;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < W; x += 4) {
        const wave = Math.sin(x * 0.01 + t * 0.02 + i * 0.5) * 15
                   + Math.sin(x * 0.02 + t * 0.015 + i * 0.8) * 8;
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

  // Try canvas, don't block if it fails
  try { createParticleCanvas('loaderCanvas', '#e83030', '#c8882a', 60); } catch(e) {}

  function dismissLoader() {
    loader.style.transition = 'opacity 0.6s ease';
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
      showEntryGate();
    }, 600);
  }

  // Primary: dismiss after 3 seconds
  setTimeout(dismissLoader, 3000);

  // Fallback: if still visible after 5s, force dismiss
  setTimeout(() => {
    if (loader.style.display !== 'none') dismissLoader();
  }, 5000);

  // Allow click to skip
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
  const submitCode = document.getElementById('submitCode');
  const codeError = document.getElementById('codeError');
  const digits = document.querySelectorAll('.code-digit');

  btnViewer.addEventListener('click', () => enterSite());

  btnOwner.addEventListener('click', () => {
    ownerModal.classList.remove('hidden');
    setTimeout(() => digits[0].focus(), 100);
  });

  cancelCode.addEventListener('click', () => {
    ownerModal.classList.add('hidden');
    codeError.classList.add('hidden');
    digits.forEach(d => d.value = '');
  });

  // Auto-advance digit inputs
  digits.forEach((d, i) => {
    d.addEventListener('input', () => {
      if (d.value && i < digits.length - 1) digits[i + 1].focus();
    });
    d.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !d.value && i > 0) digits[i - 1].focus();
    });
  });

  submitCode.addEventListener('click', verifyCode);
  // Also allow enter
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !ownerModal.classList.contains('hidden')) verifyCode();
  });

  function verifyCode() {
    const code = Array.from(digits).map(d => d.value).join('');
    if (code === '2108') {
      ownerModal.classList.add('hidden');
      enterSite();
    } else {
      codeError.classList.remove('hidden');
      digits.forEach(d => d.value = '');
      digits[0].focus();
      // Shake animation
      const box = document.querySelector('.modal-box');
      box.style.animation = 'none';
      box.style.animation = 'shake 0.4s ease';
      setTimeout(() => box.style.animation = '', 400);
    }
  }
}

// ============================
// TRANSITION TO MAIN SITE
// ============================
function enterSite() {
  const gate = document.getElementById('entryGate');
  const trans = document.getElementById('transitionScreen');
  const main = document.getElementById('mainSite');

  gate.style.transition = 'opacity 0.5s ease';
  gate.style.opacity = '0';
  setTimeout(() => {
    gate.style.display = 'none';
    trans.classList.remove('hidden');
    trans.style.opacity = '1';
    createParticleCanvas('transCanvas', '#e83030', '#c8882a', 100);

    setTimeout(() => {
      trans.style.transition = 'opacity 0.6s ease';
      trans.style.opacity = '0';
      setTimeout(() => {
        trans.style.display = 'none';
        main.classList.remove('hidden');
        main.style.opacity = '0';
        main.style.transition = 'opacity 0.8s ease';
        requestAnimationFrame(() => { main.style.opacity = '1'; });
        initMainSite();
      }, 600);
    }, 1800);
  }, 500);
}

// ============================
// MAIN SITE INIT
// ============================
function initMainSite() {
  initHeroCanvas();
  initScrollReveal();
  initSkillBars();
  initNavHighlight();
  initNavBurger();
  initCursor();
}

// ============================
// SCROLL REVEAL
// ============================
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-tl');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

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
// NAV HIGHLIGHT ON SCROLL
// ============================
function initNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-link');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s));
}

// ============================
// MOBILE NAV BURGER
// ============================
function initNavBurger() {
  const burger = document.getElementById('navBurger');
  const menu = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });
  menu.querySelectorAll('.mob-link').forEach(l => {
    l.addEventListener('click', () => menu.classList.add('hidden'));
  });
}

// ============================
// GLITCH TEXT EFFECT on name
// ============================
function initGlitch() {
  const targets = document.querySelectorAll('.name-first, .name-last');
  targets.forEach(el => {
    const original = el.textContent;
    el.addEventListener('mouseenter', () => {
      let count = 0;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
      const interval = setInterval(() => {
        el.textContent = original.split('').map((c, i) => {
          if (c === ' ') return ' ';
          if (i < count) return original[i];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        count++;
        if (count > original.length) {
          el.textContent = original;
          clearInterval(interval);
        }
      }, 35);
    });
  });
}

// ============================
// SHAKE KEYFRAME
// ============================
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
@keyframes shake {
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-8px)}
  40%{transform:translateX(8px)}
  60%{transform:translateX(-5px)}
  80%{transform:translateX(5px)}
}`;
document.head.appendChild(shakeStyle);

// ============================
// BOOT
// ============================
window.addEventListener('DOMContentLoaded', () => {
  initEntryGate();
  runLoader();
  // Glitch only starts after site loads
  setTimeout(initGlitch, 6000);
});
