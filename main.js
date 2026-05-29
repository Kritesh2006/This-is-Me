/* ============================================================
   KRITESH DHUNGEL — PORTFOLIO JS
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

// ============================
// SHOW / HIDE SCREENS (instant, no opacity chains)
// ============================
function show(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'flex';
  el.style.opacity = '1';
  el.classList.remove('hidden');
}
function hide(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'none';
  el.classList.add('hidden');
}
function fadeOut(id, cb) {
  const el = document.getElementById(id);
  if (!el) { if (cb) cb(); return; }
  el.style.transition = 'opacity 0.4s ease';
  el.style.opacity = '0';
  setTimeout(() => { hide(id); if (cb) cb(); }, 420);
}
function fadeIn(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.opacity = '0';
  el.style.display = 'flex';
  el.classList.remove('hidden');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '1';
    });
  });
}

// ============================
// PARTICLE SYSTEM
// ============================
function createParticleCanvas(canvasId, opts) {
  opts = opts || {};
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const color1 = opts.color1 || '#e83030';
  const color2 = opts.color2 || '#c8882a';
  const density = opts.density || 90;
  const reactive = opts.reactive !== false;
  let W, H, particles = [], time = 0;
  let mouseX = -9999, mouseY = -9999;
  let running = true;

  function resize() {
    W = canvas.width = canvas.offsetWidth || 800;
    H = canvas.height = canvas.offsetHeight || 600;
  }
  resize();

  const resizeObs = new ResizeObserver(resize);
  resizeObs.observe(canvas.parentElement || canvas);

  if (reactive) {
    document.addEventListener('mousemove', function(e) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
  }

  function Particle() {
    this.reset = function(initial) {
      this.x = Math.random() * W;
      this.y = initial ? Math.random() * H : (Math.random() < 0.5 ? -5 : H + 5);
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.size = Math.random() * 1.8 + 0.4;
      this.life = 0;
      this.maxLife = Math.random() * 320 + 160;
      this.color = Math.random() > 0.65 ? color2 : color1;
    };
    this.reset(true);
    this.update = function() {
      this.vx += Math.sin(time * 0.009 + this.y * 0.004) * 0.015;
      this.vy += Math.cos(time * 0.007 + this.x * 0.004) * 0.012;
      this.vx *= 0.98;
      this.vy *= 0.98;
      if (reactive) {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 85 && dist > 0) {
          const force = (1 - dist / 85) * 1.6;
          this.vx += (dx / dist) * force * 0.55;
          this.vy += (dy / dist) * force * 0.55;
        }
      }
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life > this.maxLife || this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10) {
        this.reset(false);
      }
    };
    this.draw = function() {
      const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.65;
      const hex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + hex;
      ctx.fill();
    };
  }

  for (let i = 0; i < density; i++) {
    const p = new Particle();
    particles.push(p);
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(232,48,48,' + ((1 - dist / 90) * 0.13) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(232,48,48,0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function loop() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    if (opts.grid !== false) drawGrid();
    drawConnections();
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    time++;
    requestAnimationFrame(loop);
  }
  loop();
  return function stop() { running = false; };
}

// ============================
// PORTAL CANVAS
// ============================
function createPortalCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0, running = true;
  function resize() { W = canvas.width = canvas.offsetWidth || 800; H = canvas.height = canvas.offsetHeight || 600; }
  resize();
  new ResizeObserver(resize).observe(canvas.parentElement || canvas);
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    const maxR = Math.min(W, H) * 0.38;
    for (let i = 0; i < 5; i++) {
      const r = maxR - i * 16;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * (i % 2 === 0 ? 0.007 : -0.005) + i * 0.5);
      const segs = 24 + i * 6;
      for (let s = 0; s < segs; s++) {
        if (s % 3 === 0) continue;
        ctx.beginPath();
        ctx.arc(0, 0, r, (s / segs) * Math.PI * 2, ((s + 0.72) / segs) * Math.PI * 2);
        ctx.strokeStyle = 'rgba(232,48,48,' + (0.06 + i * 0.012) + ')';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.6);
    g.addColorStop(0, 'rgba(232,48,48,' + (0.04 + 0.015 * Math.sin(t * 0.04)) + ')');
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
  return function stop() { running = false; };
}

// ============================
// HERO WAVE CANVAS
// ============================
function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, t = 0, mX = 0.7, mY = 0.6;
  function resize() { W = canvas.width = canvas.offsetWidth || 1200; H = canvas.height = canvas.offsetHeight || 600; }
  resize();
  new ResizeObserver(resize).observe(canvas.parentElement || canvas);
  document.addEventListener('mousemove', function(e) {
    mX = e.clientX / window.innerWidth;
    mY = e.clientY / window.innerHeight;
  });
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * (0.65 + mX * 0.1), H * (0.55 + mY * 0.15), 0, W * (0.65 + mX * 0.1), H * (0.55 + mY * 0.15), H * 0.55);
    g.addColorStop(0, 'rgba(232,48,48,' + (0.07 + 0.02 * Math.sin(t * 0.02)) + ')');
    g.addColorStop(0.5, 'rgba(200,136,42,0.015)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(0, H * 0.25 + i * 44);
      for (let x = 0; x < W; x += 3) {
        const y = H * 0.25 + i * 44 + Math.sin(x * 0.009 + t * 0.018 + i * 0.45) * 13 + Math.sin(x * 0.018 + t * 0.013 + i * 0.9) * 7;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(232,48,48,' + (0.025 + (i / 10) * 0.025) + ')';
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
  show('loader');
  try { createParticleCanvas('loaderCanvas', { density: 70, reactive: false }); } catch(e) {}

  let gone = false;
  function go() {
    if (gone) return;
    gone = true;
    fadeOut('loader', showEntryGate);
  }
  setTimeout(go, 2800);
  setTimeout(function() { if (!gone) go(); }, 5000);
  loader.addEventListener('click', go);
}

// ============================
// ENTRY GATE
// ============================
function showEntryGate() {
  fadeIn('entryGate');
  try { createPortalCanvas('gateCanvas'); } catch(e) {}
}

// ============================
// OWNER CODE MODAL
// ============================
function initEntryGate() {
  const btnViewer = document.getElementById('btnViewer');
  const btnOwner = document.getElementById('btnOwner');
  const ownerModal = document.getElementById('ownerModal');
  const cancelCode = document.getElementById('cancelCode');
  const codeError = document.getElementById('codeError');
  const digits = document.querySelectorAll('.code-digit');
  const kpBtns = document.querySelectorAll('.kp-btn');

  if (btnViewer) btnViewer.addEventListener('click', function() { enterSite(false); });
  if (btnOwner) btnOwner.addEventListener('click', function() {
    ownerModal.classList.remove('hidden');
    ownerModal.style.display = 'flex';
    setTimeout(function() { if (digits[0]) digits[0].focus(); }, 100);
  });
  if (cancelCode) cancelCode.addEventListener('click', function() {
    ownerModal.style.display = 'none';
    ownerModal.classList.add('hidden');
    codeError.classList.add('hidden');
    digits.forEach(function(d) { d.value = ''; });
  });

  digits.forEach(function(d, i) {
    d.addEventListener('input', function() {
      d.value = d.value.replace(/[^0-9]/g, '');
      if (d.value && i < digits.length - 1) digits[i + 1].focus();
      if (Array.from(digits).every(function(x) { return x.value; })) verifyCode();
    });
    d.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && !d.value && i > 0) digits[i - 1].focus();
      if (e.key === 'Enter') verifyCode();
    });
  });

  kpBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      const val = btn.getAttribute('data-val');
      if (val === 'enter') { verifyCode(); return; }
      if (val === 'del') {
        let last = -1;
        digits.forEach(function(d, i) { if (d.value) last = i; });
        if (last >= 0) { digits[last].value = ''; digits[last].focus(); }
        return;
      }
      for (let i = 0; i < digits.length; i++) {
        if (!digits[i].value) {
          digits[i].value = val;
          if (i < digits.length - 1) digits[i + 1].focus();
          break;
        }
      }
      if (Array.from(digits).every(function(x) { return x.value; })) verifyCode();
    });
  });

  function verifyCode() {
    const code = Array.from(digits).map(function(d) { return d.value; }).join('');
    if (code === '2108') {
      ownerModal.style.display = 'none';
      ownerModal.classList.add('hidden');
      enterSite(true);
    } else {
      codeError.classList.remove('hidden');
      digits.forEach(function(d) { d.value = ''; });
      if (digits[0]) digits[0].focus();
      const box = document.querySelector('.modal-box');
      if (box) { box.style.animation = 'none'; void box.offsetWidth; box.style.animation = 'shake 0.4s ease'; }
    }
  }
}

// ============================
// ENTER SITE
// ============================
function enterSite(isOwner) {
  fadeOut('entryGate', function() {
    if (isOwner) {
      showOwnerMessage();
    } else {
      showTransition();
    }
  });
}

// ============================
// OWNER MESSAGE
// ============================
var OWNER_LINES = [
  { text: 'Kritesh,', cls: 'om-name' },
  { text: '' },
  { text: 'You crossed continents alone.' },
  { text: 'Nepal. Ohio. California. North Carolina.', cls: 'om-highlight' },
  { text: 'Every place changed you.' },
  { text: '' },
  { text: 'You learned that confidence grows after action, not before it.', cls: 'om-dim' },
  { text: 'You learned that difficult things become normal once you survive them.', cls: 'om-dim' },
  { text: 'You learned that most limits were assumptions.', cls: 'om-dim' },
  { text: '' },
  { text: 'Remember this:' },
  { text: '' },
  { text: 'You are capable of more than your current results suggest.' },
  { text: '' },
  { text: 'The version of you that arrived in America knew less, had less,', cls: 'om-dim' },
  { text: 'and still kept moving forward.', cls: 'om-dim' },
  { text: '' },
  { text: 'Your goals were never small.' },
  { text: '' },
  { text: 'Keep building. Keep learning. Keep moving.', cls: 'om-highlight' },
  { text: '' },
  { text: 'The only permanent limitation is the one you accept.' }
];

function showOwnerMessage() {
  var screen = document.getElementById('ownerMessage');
  var container = document.getElementById('ownerTypewriter');
  var continueBtn = document.getElementById('ownerContinue');
  if (!screen || !container) { showTransition(); return; }

  show('ownerMessage');
  screen.style.display = 'flex';
  screen.style.opacity = '1';
  container.innerHTML = '';

  try { createParticleCanvas('ownerMsgCanvas', { density: 50, reactive: false, grid: false }); } catch(e) {}

  var cursor = document.createElement('span');
  cursor.className = 'om-cursor';
  container.appendChild(cursor);

  var li = 0, ci = 0, currentSpan = null;

  function type() {
    if (li >= OWNER_LINES.length) {
      cursor.remove();
      if (continueBtn) {
        continueBtn.classList.remove('hidden');
        continueBtn.style.opacity = '0';
        continueBtn.style.display = 'inline-block';
        setTimeout(function() {
          continueBtn.style.transition = 'opacity 0.5s ease';
          continueBtn.style.opacity = '1';
        }, 100);
      }
      return;
    }
    var line = OWNER_LINES[li];
    if (ci === 0) {
      if (line.text === '') {
        container.insertBefore(document.createElement('br'), cursor);
        container.insertBefore(document.createElement('br'), cursor);
        li++; ci = 0;
        setTimeout(type, 55);
        return;
      }
      currentSpan = document.createElement('span');
      if (line.cls) currentSpan.className = line.cls;
      container.insertBefore(currentSpan, cursor);
    }
    if (ci < line.text.length) {
      currentSpan.textContent += line.text[ci];
      ci++;
      var delay = (line.text[ci-1] === '.' || line.text[ci-1] === ',') ? 55 : 26;
      setTimeout(type, delay);
    } else {
      container.insertBefore(document.createElement('br'), cursor);
      li++; ci = 0;
      setTimeout(type, 75);
    }
  }
  setTimeout(type, 900);

  if (continueBtn) {
    continueBtn.addEventListener('click', function() {
      fadeOut('ownerMessage', showTransition);
    });
  }
}

// ============================
// TRANSITION SCREEN
// ============================
function showTransition() {
  var trans = document.getElementById('transitionScreen');
  if (!trans) { launchMainSite(); return; }
  show('transitionScreen');
  trans.style.opacity = '1';
  try { createParticleCanvas('transCanvas', { density: 80, reactive: false }); } catch(e) {}
  setTimeout(function() {
    fadeOut('transitionScreen', launchMainSite);
  }, 1600);
}

// ============================
// LAUNCH MAIN SITE
// ============================
function launchMainSite() {
  var main = document.getElementById('mainSite');
  if (!main) return;
  // Force fully visible — no opacity tricks
  main.classList.remove('hidden');
  main.style.display = 'block';
  main.style.opacity = '1';
  main.style.visibility = 'visible';
  document.body.style.overflow = 'auto';
  initMainSite();
}

function initMainSite() {
  initHeroCanvas();
  // Add reactive particles to hero section
  try { createParticleCanvas('heroCanvas', { density: 85, reactive: true, grid: true }); } catch(e) {}
  initScrollReveal();
  initSkillBars();
  initNavHighlight();
  initNavBurger();
  initCursor();
  initGlitch();
}

// ============================
// CURSOR
// ============================
function initCursor() {
  if (window.innerWidth < 768) return;
  var cursor = document.createElement('div');
  cursor.className = 'cursor';
  var ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.appendChild(cursor);
  document.body.appendChild(ring);
  var mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', function(e) { mx = e.clientX; my = e.clientY; });
  function animCursor() {
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
    rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(animCursor);
  }
  animCursor();
  document.querySelectorAll('a, button, .project-card, .contact-item').forEach(function(el) {
    el.addEventListener('mouseenter', function() {
      cursor.style.transform = 'translate(-50%,-50%) scale(2)';
      ring.style.width = '60px'; ring.style.height = '60px';
    });
    el.addEventListener('mouseleave', function() {
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      ring.style.width = '36px'; ring.style.height = '36px';
    });
  });
}

// ============================
// SCROLL REVEAL
// ============================
function initScrollReveal() {
  var els = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-tl');
  if (!('IntersectionObserver' in window)) {
    els.forEach(function(el) { el.classList.add('visible'); });
    return;
  }
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
  els.forEach(function(el) { obs.observe(el); });
}

// ============================
// SKILL BARS
// ============================
function initSkillBars() {
  var bars = document.querySelectorAll('.skill-bar');
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        var bar = e.target;
        bar.style.setProperty('--target-width', (bar.getAttribute('data-w') || '80') + '%');
        setTimeout(function() { bar.classList.add('animated'); }, 100);
        obs.unobserve(bar);
      }
    });
  }, { threshold: 0.2 });
  bars.forEach(function(b) { obs.observe(b); });
}

// ============================
// NAV HIGHLIGHT
// ============================
function initNavHighlight() {
  var sections = document.querySelectorAll('section[id]');
  var links = document.querySelectorAll('.nav-link');
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        var id = e.target.id;
        links.forEach(function(l) { l.classList.toggle('active', l.getAttribute('href') === '#' + id); });
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(function(s) { obs.observe(s); });
}

// ============================
// NAV BURGER
// ============================
function initNavBurger() {
  var burger = document.getElementById('navBurger');
  var menu = document.getElementById('mobileMenu');
  if (burger && menu) {
    burger.addEventListener('click', function() { menu.classList.toggle('hidden'); });
    menu.querySelectorAll('.mob-link').forEach(function(l) {
      l.addEventListener('click', function() { menu.classList.add('hidden'); });
    });
  }
}

// ============================
// GLITCH
// ============================
function initGlitch() {
  document.querySelectorAll('.name-first, .name-last').forEach(function(el) {
    var original = el.textContent;
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    el.addEventListener('mouseenter', function() {
      var count = 0;
      var iv = setInterval(function() {
        el.textContent = original.split('').map(function(c, i) {
          if (c === ' ') return ' ';
          if (i < count) return original[i];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        count++;
        if (count > original.length) { el.textContent = original; clearInterval(iv); }
      }, 32);
    });
  });
}

// ============================
// SHAKE KEYFRAME
// ============================
var shakeStyle = document.createElement('style');
shakeStyle.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}';
document.head.appendChild(shakeStyle);

// ============================
// BOOT
// ============================
window.addEventListener('DOMContentLoaded', function() {
  var age = calculateAge();
  var a1 = document.getElementById('dynamicAge');
  var a2 = document.getElementById('ageStatNum');
  if (a1) a1.textContent = age;
  if (a2) a2.textContent = age;

  // Hide everything except loader at start
  hide('entryGate');
  hide('ownerMessage');
  hide('transitionScreen');
  hide('mainSite');
  document.body.style.overflow = 'hidden';

  initEntryGate();
  runLoader();
});
