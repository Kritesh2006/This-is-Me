/* KRITESH DHUNGEL — Portfolio Scripts */

// ── NAV: mobile burger ──
const burger    = document.getElementById('burger');
const navLinks  = document.getElementById('navLinks');

burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ── SCROLL REVEAL ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── SKILL BAR ANIMATION ──
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fill = entry.target;
      const w = fill.getAttribute('data-w');
      setTimeout(() => { fill.style.width = w + '%'; }, 150);
      barObserver.unobserve(fill);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.bar-fill').forEach(bar => barObserver.observe(bar));

// ── ACTIVE NAV HIGHLIGHT ──
const sections = document.querySelectorAll('section[id]');
const links    = document.querySelectorAll('.nav-links a');

new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      links.forEach(a => a.style.color = '');
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.style.color = 'var(--white)';
    }
  });
}, { threshold: 0.45 }).observe; // passive — rerun below

sections.forEach(s => {
  new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(a => a.removeAttribute('style'));
        const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (active) active.style.color = 'var(--white)';
      }
    });
  }, { threshold: 0.45 }).observe(s);
});

// ── SUBTLE CURSOR GLOW (desktop) ──
if (window.matchMedia('(pointer: fine)').matches) {
  const glow = document.createElement('div');
  Object.assign(glow.style, {
    position: 'fixed', pointerEvents: 'none', zIndex: '9999',
    width: '380px', height: '380px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(192,57,43,0.05) 0%, transparent 70%)',
    transform: 'translate(-50%,-50%)',
    top: '0', left: '0', transition: 'opacity 0.4s',
  });
  document.body.appendChild(glow);
  document.addEventListener('mousemove', e => {
    glow.style.top  = e.clientY + 'px';
    glow.style.left = e.clientX + 'px';
  });
}
