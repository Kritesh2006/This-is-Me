/* =====================================================================
   build.js — the portfolio builds itself live.
   Every element tagged data-b="box|type|sweep|img|pop" is a "layer".
   A swarm of agent cursors drags in wireframes, types text and reveals
   each layer, touring the page section by section, then hands control
   to the visitor with a Start button.
   ===================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- Live-mode interactions (always wired) ---------------- */
  function wireLive() {
    // Matrix filter
    var tabs = $$('.tabs button'), cells = $$('.cell');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
        var f = b.dataset.f;
        cells.forEach(function (c) { c.classList.toggle('dim', f !== 'all' && c.dataset.cat.split(' ').indexOf(f) < 0); });
      });
    });
    // Copy email
    var cm = $('#copyMail');
    if (cm) cm.addEventListener('click', function () {
      var mail = 'kriteshdhungel07@gmail.com';
      var ok = function () { toast('Email copied'); cm.textContent = 'Copied ✓'; setTimeout(function () { cm.textContent = 'Copy email'; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(mail).then(ok, function () { location.href = 'mailto:' + mail; });
      else location.href = 'mailto:' + mail;
    });
    // Hover dimension tags — a nod to the build, desktop pointers only
    if (matchMedia('(hover: hover)').matches) {
      $$('.card, .mini').forEach(function (c) {
        var t = document.createElement('span'); t.className = 'dimtag'; t.setAttribute('aria-hidden', 'true'); c.appendChild(t);
        c.addEventListener('mouseenter', function () { t.textContent = Math.round(c.offsetWidth) + ' × ' + Math.round(c.offsetHeight); });
      });
    }
  }
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove('on'); }, 1600);
  }

  wireLive();
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!root.classList.contains('building')) { if (!RM) addReplayChip(); return; }

  /* ---------------- Engine state ---------------- */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  var MOBILE = matchMedia('(max-width: 760px)').matches;
  var N_WORK = MOBILE ? 10 : 9;
  var N_AMB = MOBILE ? 4 : 9;
  var COLORS = ['#ff4d45', '#3ddc84', '#ff8a80', '#f4f4f4', '#8fe3b0', '#e0322b', '#2fbf71', '#ffb3ad', '#c9f2d8', '#ff6b5e', '#5fd896', '#ffd2cc'];
  var TIME = MOBILE ? 1.3 : 1.45; // global pacing: >1 = slower, more 'cooking'
  var S = { speed: 1, skip: false, done: 0, total: 0, t0: 0, phase: 'boot' };
  var agents = [], tasks = [], wiresEl, agentsEl, hud = {};

  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var ease = function (p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  var easeOut = function (p) { return 1 - Math.pow(1 - p, 3); };

  // rAF tween that respects speed + skip
  function tween(dur, fn) {
    dur = dur * TIME / S.speed;
    return new Promise(function (res) {
      if (S.skip || dur <= 0) { fn(1); return res(); }
      var s = performance.now();
      (function f(now) {
        if (S.skip) { fn(1); return res(); }
        var p = Math.min(1, (now - s) / dur); fn(p);
        if (p < 1) requestAnimationFrame(f); else res();
      })(s);
    });
  }
  var wait = function (ms) { return tween(ms, function () {}); };

  /* ---------------- Scroll lock while building ---------------- */
  var block = function (e) { if (root.classList.contains('building') && !e.target.closest('.hud')) e.preventDefault(); };
  var keys = { 32: 1, 33: 1, 34: 1, 35: 1, 36: 1, 38: 1, 40: 1 };
  var blockKey = function (e) { if (root.classList.contains('building') && keys[e.keyCode] && !e.target.closest('button')) e.preventDefault(); };
  addEventListener('wheel', block, { passive: false });
  addEventListener('touchmove', block, { passive: false });
  addEventListener('keydown', blockKey);
  // Clicking an in-page link while building = finish and jump straight to it
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || !root.classList.contains('building')) return;
    e.preventDefault(); S.jump = $(a.getAttribute('href'));
    if (S.phase === 'final') goLive(); else skip();
  }, true);

  /* ---------------- Agents ---------------- */
  var ARROW = '<svg viewBox="0 0 17 19" aria-hidden="true"><path d="M1.4 1.3 1.6 15.6 5.5 11.9 8.2 17.7 10.7 16.6 8 10.9 13.6 10.6Z" fill="C" stroke="#0a0a0a" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  function Agent(i, worker) {
    this.el = document.createElement('div'); this.el.className = 'agent';
    this.color = COLORS[i % COLORS.length];
    this.el.innerHTML = ARROW.replace('C', this.color);
    agentsEl.appendChild(this.el);
    this.worker = worker; this.busy = false; this.lock = false;
    // start off-screen
    var side = i % 4, W = innerWidth, H = innerHeight;
    this.x = side === 0 ? -30 : side === 1 ? W + 30 : rnd(0, W);
    this.y = side === 2 ? -30 : side === 3 ? H + 30 : rnd(0, H);
    this.newTarget(); this.render();
  }
  Agent.prototype.render = function () { this.el.style.transform = 'translate3d(' + this.x.toFixed(1) + 'px,' + this.y.toFixed(1) + 'px,0)'; };
  Agent.prototype.newTarget = function () {
    var W = innerWidth, H = innerHeight;
    this.tx = rnd(W * .08, W * .92); this.ty = rnd(H * .14, H * .84);
  };
  Agent.prototype.moveTo = function (x, y, dur) {
    var self = this, sx = this.x, sy = this.y, dx = x - sx, dy = y - sy;
    var dist = Math.hypot(dx, dy) || 1;
    dur = dur || clamp(220 + dist * .5, 260, 820);
    var nx = -dy / dist, ny = dx / dist, arc = rnd(-.22, .22) * dist;
    this.lock = true;
    return tween(dur, function (p) {
      var e = ease(p), a = Math.sin(Math.PI * e) * arc;
      self.x = sx + dx * e + nx * a; self.y = sy + dy * e + ny * a;
    });
  };

  var ring = null, last = performance.now();
  function loop(now) {
    var dt = Math.min(64, now - last); last = now;
    var k = 1 - Math.pow(.985, dt / 16);
    for (var i = 0; i < agents.length; i++) {
      var a = agents[i];
      if (ring && a.ringSlot != null) {
        var ang = a.ringSlot + now * .0009 * ring.dir;
        var tx = ring.x + Math.cos(ang) * ring.r, ty = ring.y + Math.sin(ang) * ring.r * .9;
        var kk = ring.lerp ? 1 - Math.pow(.9, dt / 16) : 1;
        a.x += (tx - a.x) * kk; a.y += (ty - a.y) * kk;
      } else if (!a.lock && !a.busy) {
        a.x += (a.tx - a.x) * k * (a.worker ? 1.4 : 1); a.y += (a.ty - a.y) * k * (a.worker ? 1.4 : 1);
        if (Math.hypot(a.tx - a.x, a.ty - a.y) < 10) a.newTarget();
      }
      a.render();
    }
    if (agentsEl.isConnected) requestAnimationFrame(loop);
  }

  /* ---------------- Wireframes ---------------- */
  function docRect(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, vx: r.left, vy: r.top };
  }
  function makeWire(x, y, sel, cls) {
    var w = document.createElement('div'); w.className = 'wire' + (sel ? ' sel' : '') + (cls ? ' ' + cls : '');
    w.innerHTML = '<i></i><i></i><i></i><i></i><span class="dim"></span>';
    w.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    w.style.width = '0px'; w.style.height = '0px';
    wiresEl.appendChild(w); return w;
  }
  function sizeWire(w, cw, ch) {
    w.style.width = cw + 'px'; w.style.height = ch + 'px';
    w.lastChild.textContent = Math.round(cw) + ' × ' + Math.round(ch);
  }
  function dropWire(w) {
    if (S.skip) return w.remove();
    var an = w.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380 * TIME / S.speed, easing: 'ease-out' });
    an.onfinish = function () { w.remove(); };
  }
  function ripple(x, y) {
    if (S.skip) return;
    var r = document.createElement('div'); r.className = 'ripple'; r.style.left = x + 'px'; r.style.top = y + 'px';
    document.body.appendChild(r);
    r.animate([{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 480, easing: 'ease-out' }).onfinish = function () { r.remove(); };
  }

  /* ---------------- Reveal + text typing ---------------- */
  function reveal(t, anim) {
    if (t.done) return;
    t.done = true; t.el.classList.add('b-done');
    S.done++; updateHud();
    if (S.skip || !anim) return;
    if (anim === FADE && getComputedStyle(t.el).transform !== 'none') anim = OPAC;
    t.el.animate(anim, { duration: 520 * TIME / S.speed, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function textNodes(el) {
    var out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) if (n.data.length && !n.parentElement.closest('.sr')) out.push(n);
    return out;
  }

  /* ---------------- Task runners ---------------- */
  var FADE = [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }];
  var OPAC = [{ opacity: 0 }, { opacity: 1 }];
  var POP = [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'scale(1)' }];

  function runBox(a, t) {
    var r = docRect(t.el), H = innerHeight;
    if (t.ghost) {
      var g = t.ghost; t.ghost = null;
      var px = r.vx + Math.min(r.w, innerWidth - 30), py = Math.min(r.vy + r.h, H - 26);
      return a.moveTo(px, py).then(function () {
        ripple(px, py); g.classList.add('sel');
        return wait(220);
      }).then(function () { reveal(t, FADE); dropWire(g); return wait(120); });
    }
    return a.moveTo(r.vx, r.vy).then(function () {
      var w = makeWire(r.x, r.y);
      var dur = clamp(260 + (r.w + r.h) * .3, 340, 820);
      return tween(dur, function (p) {
        var e = easeOut(p), cw = r.w * e, ch = r.h * e;
        sizeWire(w, cw, ch); a.x = r.vx + cw; a.y = Math.min(r.vy + ch, H - 26);
      }).then(function () { return wait(90); }).then(function () {
        reveal(t, FADE); dropWire(w);
      });
    });
  }
  function runImg(a, t) {
    var r = docRect(t.el), H = innerHeight;
    var w = t.ghost; t.ghost = null;
    return a.moveTo(r.vx, r.vy).then(function () {
      if (w) return wait(200);
      w = makeWire(r.x, r.y);
      return tween(700, function (p) {
        var e = easeOut(p), cw = r.w * e, ch = r.h * e; sizeWire(w, cw, ch); a.x = r.vx + cw; a.y = Math.min(r.vy + ch, H - 26);
      });
    }).then(function () {
        reveal(t, null);
        var scan = document.createElement('div'); scan.className = 'scan'; w.appendChild(scan);
        w.style.background = 'transparent';
        return tween(900, function (p) {
          var e = ease(p);
          t.el.style.clipPath = 'inset(0 0 ' + (100 - e * 100).toFixed(2) + '% 0)';
          scan.style.top = (e * 100) + '%';
          a.y = Math.min(r.vy + r.h * e, H - 26); a.x = r.vx + r.w * .5 + Math.sin(e * 9) * r.w * .3;
        }).then(function () { t.el.style.clipPath = ''; dropWire(w); });
    });
  }
  function clearGhost(t) { if (t.ghost) { dropWire(t.ghost); t.ghost = null; } }
  function runType(a, t) {
    var r = docRect(t.el), nodes = textNodes(t.el);
    var orig = nodes.map(function (n) { return n.data; });
    var total = orig.reduce(function (s, x) { return s + x.length; }, 0);
    var dur = +t.el.dataset.dur || clamp(total * 34, 300, 1400);
    return a.moveTo(r.vx - 2, r.vy + r.h * .55).then(function () {
      clearGhost(t);
      nodes.forEach(function (n) { n.data = ''; });
      reveal(t, null); t.el.classList.add('b-sel');
      return tween(dur, function (p) {
        var c = Math.round(total * p);
        for (var i = 0; i < nodes.length; i++) {
          var take = Math.max(0, Math.min(orig[i].length, c)); c -= orig[i].length;
          if (nodes[i].data.length !== take) nodes[i].data = orig[i].slice(0, take);
        }
        a.x = r.vx + r.w * p;
      }).then(function () {
        nodes.forEach(function (n, i) { n.data = orig[i]; });
        return wait(70);
      }).then(function () { t.el.classList.remove('b-sel'); });
    });
  }
  function runSweep(a, t) {
    var r = docRect(t.el);
    return a.moveTo(r.vx, r.vy + 4).then(function () {
      clearGhost(t);
      var w = makeWire(r.x - 3, r.y - 3, true); sizeWire(w, 0, r.h + 6);
      reveal(t, null);
      var dur = clamp(r.w * .9 + r.h * 2, 380, 1050);
      return tween(dur, function (p) {
        var e = ease(p);
        t.el.style.clipPath = 'inset(0 ' + (100 - e * 100).toFixed(2) + '% 0 0)';
        sizeWire(w, (r.w + 6) * e, r.h + 6); a.x = r.vx + r.w * e; a.y = r.vy + r.h - 4;
      }).then(function () { t.el.style.clipPath = ''; dropWire(w); });
    });
  }
  function runPop(a, t) {
    var r = docRect(t.el);
    return a.moveTo(r.vx + r.w * .5, r.vy + r.h * .5).then(function () {
      ripple(r.vx + r.w * .5, r.vy + r.h * .5); clearGhost(t);
      reveal(t, POP);
      return wait(160);
    });
  }
  /* Blueprint pass: sketch a ghost of every layer on screen before filling it */
  function makeGhost(t, r) {
    var text = t.type === 'type' || t.type === 'sweep', small = t.type === 'pop';
    var w = makeWire(r.x, r.y, false, text ? 'ghost' : small ? 'mini-g' : '');
    if (text) {
      var lh = parseFloat(getComputedStyle(t.el).lineHeight); if (!lh || lh > r.h) lh = r.h;
      var bar = Math.max(4, Math.round(lh * .5)), off = Math.round((lh - bar) / 2);
      w.style.background = 'repeating-linear-gradient(to bottom, transparent 0 ' + off + 'px, rgba(255,255,255,.085) ' + off + 'px ' + (off + bar) + 'px, transparent ' + (off + bar) + 'px ' + lh + 'px)';
    }
    t.ghost = w; return w;
  }
  function runSketch(a, t) {
    var r = docRect(t.el), H = innerHeight;
    var text = t.type === 'type' || t.type === 'sweep', small = t.type === 'pop';
    return a.moveTo(r.vx, r.vy, clamp(180 + Math.hypot(r.vx - a.x, r.vy - a.y) * .28, 200, 440)).then(function () {
      var w = makeGhost(t, r);
      return tween(text ? 230 : small ? 150 : 360, function (p) {
        var e = easeOut(p);
        sizeWire(w, r.w * e, text ? r.h : r.h * e);
        a.x = r.vx + r.w * e; a.y = Math.min(r.vy + (text ? r.h * .5 : r.h * e), H - 26);
      });
    });
  }
  var RUN = { box: runBox, img: runImg, type: runType, sweep: runSweep, pop: runPop };

  /* ---------------- Camera ---------------- */
  function inView(t) {
    var r = t.el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight - 40;
  }
  function camera(t) {
    var navH = MOBILE ? 72 : 84;
    var maxY = document.documentElement.scrollHeight - innerHeight;
    var target = clamp(t.el.getBoundingClientRect().top + scrollY - navH - 30, 0, maxY);
    var from = scrollY, d = target - from;
    if (Math.abs(d) < 4) return Promise.resolve(false);
    setStatus('Touring', true);
    var H = innerHeight, incoming = [];
    tasks.forEach(function (x) {
      if (x.taken || x.ghost || incoming.length >= 48) return;
      var r = docRect(x.el);
      if (r.y + r.h > target && r.y < target + H - 40) incoming.push({ t: x, r: r });
    });
    var drawn = 0;
    return tween(clamp(600 + Math.abs(d) * .5, 800, 1500), function (p) {
      window.scrollTo({ top: from + d * ease(p), behavior: 'instant' });
      while (drawn < incoming.length && p >= drawn / incoming.length * .85) {
        var g = makeGhost(incoming[drawn].t, incoming[drawn].r); sizeWire(g, incoming[drawn].r.w, incoming[drawn].r.h);
        if (!S.skip) g.animate([{ clipPath: 'inset(0 100% 100% 0)', opacity: 0 }, { clipPath: 'inset(0 0 0 0)', opacity: 1 }], { duration: 420 * TIME / S.speed, easing: 'cubic-bezier(.2,.8,.2,1)' });
        drawn++;
      }
    })
      .then(function () { setStatus('Cooking'); return true; });
  }

  /* ---------------- Scheduler ---------------- */
  function schedule() {
    return new Promise(function (resolve) {
      var inflight = 0, moving = false, force = null, sketchQ = [], skIn = 0, pausing = false, sketching = false;
      function startScreen() {
        sketchQ = tasks.filter(function (t) { return !t.taken && !t.ghost && inView(t); }).slice(0, 48);
        sketching = sketchQ.length > 0;
        if (sketching) setStatus('Sketching', true);
      }
      function pump() {
        if (S.skip || moving) return;
        var free = agents.filter(function (a) { return a.worker && !a.busy; });
        if (sketching) {
          while (free.length && sketchQ.length) {
            (function (a, t) {
              a.busy = true; skIn++;
              wait(rnd(0, 80)).then(function () { return runSketch(a, t); })
                .then(function () { a.busy = false; a.lock = false; a.newTarget(); skIn--; pump(); });
            })(free.shift(), sketchQ.shift());
          }
          if (sketchQ.length || skIn) return;
          if (!pausing) { pausing = true; setStatus('Cooking'); wait(450).then(function () { pausing = false; sketching = false; pump(); }); }
          return;
        }
        var pending = tasks.filter(function (t) { return !t.taken; });
        if (!pending.length) { if (!inflight) resolve(); return; }
        for (var i = 0; i < free.length; i++) {
          var t = null;
          for (var j = 0, look = 0; j < pending.length && look < 14; j++) {
            var c = pending[j]; if (c.taken) continue; look++;
            if (c.dep && !c.dep.done) continue;
            if (c === force || inView(c)) { t = c; break; }
          }
          if (!t) break;
          force = null; t.taken = true; inflight++;
          (function (a, t) {
            a.busy = true;
            wait(rnd(0, 140)).then(function () { return RUN[t.type](a, t); })
              .then(function () { a.busy = false; a.lock = false; a.newTarget(); inflight--; pump(); });
          })(free[i], t);
        }
        if (!inflight) {
          var next = pending.filter(function (t) { return !t.taken; })[0];
          moving = true;
          camera(next).then(function (moved) { moving = false; if (!moved) force = next; else startScreen(); pump(); });
        }
      }
      startScreen(); pump();
    });
  }

  /* ---------------- HUD ---------------- */
  function buildHud() {
    var h = document.createElement('div'); h.className = 'hud off'; h.id = 'hud';
    var dots = COLORS.slice(0, 5).map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('');
    h.innerHTML =
      '<div class="hud-live" style="display:contents">' +
        '<span class="hud-dots" aria-hidden="true">' + dots + '</span>' +
        '<span aria-hidden="true"><b data-h="a">0</b><span class="hud-agents-l"> agents</span></span>' +
        '<span aria-hidden="true"><b data-h="l">0</b> / <span data-h="t">0</span><span class="hud-agents-l"> layers</span></span>' +
        '<span class="hud-bar" aria-hidden="true"><i data-h="bar"></i></span>' +
        '<span class="hud-status" data-h="s">Booting</span>' +
        '<button type="button" class="hud-btn" data-h="speed" aria-label="Build speed">1×</button>' +
        '<button type="button" class="hud-btn" data-h="skip">Skip</button>' +
      '</div>';
    document.body.appendChild(h);
    hud.el = h;
    $$('[data-h]', h).forEach(function (n) { hud[n.dataset.h] = n; });
    hud.speed.addEventListener('click', function () {
      S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 4 : 1; hud.speed.textContent = S.speed + '×';
    });
    hud.skip.addEventListener('click', skip);
    var sr = document.createElement('p'); sr.className = 'sr'; sr.setAttribute('role', 'status'); sr.id = 'srStatus';
    sr.textContent = 'This portfolio is building itself. Press Skip to see it immediately.';
    document.body.appendChild(sr);
  }
  function updateHud() {
    if (!hud.l) return;
    hud.l.textContent = S.done;
    hud.bar.style.width = (S.done / S.total * 100) + '%';
  }
  function setStatus(txt, tour) { if (hud.s) { hud.s.textContent = txt; hud.s.classList.toggle('tour', !!tour); } }

  /* ---------------- Phases ---------------- */
  function intro() {
    hud.a.textContent = agents.length; hud.t.textContent = S.total;
    var cx = innerWidth / 2, cy = innerHeight * .42;
    return Promise.all(agents.map(function (a, i) {
      return wait(i * 45).then(function () { return a.moveTo(cx + rnd(-46, 46), cy + rnd(-34, 34), rnd(900, 1300)); });
    })).then(function () {
      hud.el.classList.remove('off'); setStatus('Building');
      return wait(380);
    }).then(function () { agents.forEach(function (a) { a.lock = false; a.newTarget(); }); });
  }

  function finale() {
    S.phase = 'final';
    var secs = ((performance.now() - S.t0) / 1000).toFixed(1);
    // Ring of agents beside the contact card (or above it on narrow screens)
    var card = $('.contact-card').getBoundingClientRect(), W = innerWidth, H = innerHeight;
    var r = MOBILE ? 46 : 92, side = (W - card.right);
    if (side > r * 2 + 40) ring = { x: card.right + side / 2, y: clamp(card.top + card.height / 2, r + 90, H - r - 90), r: r };
    else ring = { x: W - r - 22, y: (MOBILE ? 72 : 90) + r + 14, r: r };
    ring.dir = 1; ring.lerp = true;
    agents.forEach(function (a, i) { a.lock = true; a.ringSlot = (i / agents.length) * Math.PI * 2; });
    setTimeout(function () { if (ring) ring.lerp = false; }, 1600);

    hud.el.innerHTML =
      '<span class="hud-dots" aria-hidden="true">' + $('.hud-dots', hud.el).innerHTML + '</span>' +
      '<span class="hud-final">' + (MOBILE ? 'Built in <b>' + secs + 's</b>' : 'Built by <b>' + agents.length + '</b> agents in <b>' + secs + 's</b>') + '</span>' +
      '<button type="button" class="hud-start" id="startBtn">Start ▸</button>' +
      '<button type="button" class="hud-btn" id="replayBtn">Replay</button>';
    $('#srStatus').textContent = 'Portfolio built. Press Start to explore.';
    $('#startBtn').addEventListener('click', goLive);
    $('#replayBtn').addEventListener('click', replay);
    $('#startBtn').focus({ preventScroll: true });
  }

  function cleanupBuild() {
    root.classList.remove('building'); root.classList.add('live');
    removeEventListener('wheel', block); removeEventListener('touchmove', block); removeEventListener('keydown', blockKey);
    tasks.forEach(function (t) { t.el.classList.add('b-done'); t.el.classList.remove('b-sel'); t.el.style.clipPath = ''; });
    if (wiresEl) wiresEl.remove();
  }

  function goLive() {
    if (S.phase === 'live') return; S.phase = 'live';
    var cx = ring ? ring.x : innerWidth / 2, cy = ring ? ring.y : innerHeight / 2;
    ring = null;
    S.skip = false; S.speed = 1;
    // Burst the swarm outwards and fade
    agents.forEach(function (a) {
      a.lock = true; a.ringSlot = null;
      var ang = Math.atan2(a.y - cy, a.x - cx) + rnd(-.3, .3), d = Math.max(innerWidth, innerHeight);
      a.moveTo(a.x + Math.cos(ang) * d, a.y + Math.sin(ang) * d, rnd(700, 1100));
    });
    agentsEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1100, easing: 'ease-in' }).onfinish = function () { agentsEl.remove(); };
    hud.el.classList.add('off'); setTimeout(function () { hud.el.remove(); }, 600);
    cleanupBuild();
    var from = scrollY, navH = MOBILE ? 72 : 84;
    var to = S.jump ? clamp(S.jump.getBoundingClientRect().top + scrollY - navH, 0, document.documentElement.scrollHeight - innerHeight) : 0;
    tween(clamp(Math.abs(from - to) * .5, 400, 1400), function (p) { window.scrollTo({ top: from + (to - from) * ease(p), behavior: 'instant' }); });
    addReplayChip(1400);
    $('#srStatus') && ($('#srStatus').textContent = 'Portfolio ready.');
  }

  function skip() {
    if (S.phase === 'live') return;
    S.skip = true;
    tasks.forEach(function (t) { if (!t.done) { t.done = true; S.done++; } });
    // restore any half-typed text
    setTimeout(function () { S.phase = 'skipping'; goLive(); }, 30);
  }

  function replay() {
    location.replace(location.pathname);
  }

  function addReplayChip(delay) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'replay-chip';
    b.textContent = '↻ Replay build'; b.addEventListener('click', replay);
    document.body.appendChild(b);
    setTimeout(function () { b.classList.add('on'); }, delay || 600);
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    wiresEl = document.createElement('div'); wiresEl.id = 'wires'; wiresEl.setAttribute('aria-hidden', 'true');
    agentsEl = document.createElement('div'); agentsEl.id = 'agents'; agentsEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(wiresEl); document.body.appendChild(agentsEl);
    buildHud();

    var map = new Map();
    tasks = $$('[data-b]').map(function (el, i) {
      var t = { el: el, type: RUN[el.dataset.b] ? el.dataset.b : 'box', i: i, done: false, taken: false, dep: null };
      map.set(el, t); return t;
    });
    tasks.forEach(function (t) {
      var p = t.el.parentElement && t.el.parentElement.closest('[data-b]'); t.dep = p ? map.get(p) : null;
      // invisible on this layout (display:none) → done instantly
      if (!t.el.getClientRects().length) { t.done = true; t.taken = true; t.el.classList.add('b-done'); }
    });
    tasks = tasks.filter(function (t) { return !t.taken; });
    S.total = tasks.length;

    for (var i = 0; i < N_WORK + N_AMB; i++) agents.push(new Agent(i, i < N_WORK));
    requestAnimationFrame(loop);

    hud.a.textContent = agents.length; hud.t.textContent = S.total;
    requestAnimationFrame(function () { hud.el.classList.remove('off'); });
    S.t0 = performance.now();
    intro().then(schedule).then(function () {
      if (S.skip) return;
      setStatus('Complete');
      return wait(350).then(finale);
    });
  }

  var go = function () { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { setTimeout(boot, 250); }); };
  if (document.readyState === 'complete') go(); else addEventListener('load', go);
})();
