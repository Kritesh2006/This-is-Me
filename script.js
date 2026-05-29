/* ============================================================
   KRITESH DHUNGEL — script.js
   ============================================================ */

/* ---------- AGE ---------- */
function getAge() {
  var b = new Date('2006-06-07'), t = new Date();
  var a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
}

/* ---------- SOUND SYSTEM ---------- */
var soundOn = false; // off until user interacts
var AudioCtx = window.AudioContext || window.webkitAudioContext;
var actx = null;
function getACtx() { if (!actx) actx = new AudioCtx(); return actx; }

function playTone(freq, type, duration, vol) {
  if (!soundOn) return;
  try {
    var ctx = getACtx();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + duration);
    gain.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}

function sfx(name) {
  if (!soundOn) return;
  switch(name) {
    case 'click':   playTone(440, 'sine', 0.08, 0.07); break;
    case 'hover':   playTone(600, 'sine', 0.04, 0.04); break;
    case 'unlock':
      playTone(440, 'sine', 0.1, 0.06);
      setTimeout(function(){ playTone(660, 'sine', 0.12, 0.07); }, 100);
      setTimeout(function(){ playTone(880, 'sine', 0.15, 0.08); }, 220);
      break;
    case 'error':   playTone(200, 'sawtooth', 0.15, 0.06); break;
    case 'whoosh':  playTone(800, 'sine', 0.3, 0.05); setTimeout(function(){ playTone(200, 'sine', 0.2, 0.03); }, 150); break;
    case 'pulse':   playTone(300, 'sine', 0.2, 0.05); break;
    case 'boot':
      [220,330,440,550,660].forEach(function(f,i){ setTimeout(function(){ playTone(f,'sine',0.12,0.05); }, i*60); });
      break;
  }
}

/* ---------- SHOW / HIDE ---------- */
function showEl(id) {
  var el = typeof id === 'string' ? document.getElementById(id) : id;
  if (!el) return;
  el.classList.remove('screen-hidden');
}
function hideEl(id) {
  var el = typeof id === 'string' ? document.getElementById(id) : id;
  if (!el) return;
  el.classList.add('screen-hidden');
}
function fadeOut(id, cb, ms) {
  var el = typeof id === 'string' ? document.getElementById(id) : id;
  if (!el) { if (cb) cb(); return; }
  ms = ms || 400;
  el.style.transition = 'opacity ' + ms + 'ms ease';
  el.style.opacity = '0';
  setTimeout(function() { hideEl(el); el.style.opacity = ''; el.style.transition = ''; if (cb) cb(); }, ms + 20);
}
function fadeIn(id) {
  var el = typeof id === 'string' ? document.getElementById(id) : id;
  if (!el) return;
  el.style.opacity = '0';
  showEl(el);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      el.style.transition = 'opacity 500ms ease';
      el.style.opacity = '1';
      setTimeout(function() { el.style.transition = ''; }, 520);
    });
  });
}

/* ---------- PARTICLES ---------- */
function makeParticles(canvasId, opts) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  opts = opts || {};
  var c1 = opts.c1 || '#e83030';
  var c2 = opts.c2 || '#c8882a';
  var n = opts.n || 80;
  var react = opts.react !== false;
  var grid = opts.grid !== false;
  var W = 1, H = 1, t = 0, alive = true;
  var mx = -999, my = -999;

  function resize() {
    var p = canvas.parentElement || document.body;
    W = canvas.width = p.offsetWidth || window.innerWidth;
    H = canvas.height = p.offsetHeight || window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  if (react) {
    document.addEventListener('mousemove', function(e) {
      var r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    });
  }

  var particles = [];
  function mkP(init) {
    return {
      x: Math.random() * W,
      y: init ? Math.random() * H : (Math.random() < 0.5 ? -4 : H + 4),
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.6 + 0.4,
      life: 0,
      max: Math.random() * 320 + 140,
      col: Math.random() > 0.65 ? c2 : c1
    };
  }
  for (var i = 0; i < n; i++) particles.push(mkP(true));

  function loop() {
    if (!alive) return;
    ctx.clearRect(0, 0, W, H);

    if (grid) {
      ctx.strokeStyle = 'rgba(232,48,48,0.022)';
      ctx.lineWidth = 1;
      for (var gx = 0; gx < W; gx += 62) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
      for (var gy = 0; gy < H; gy += 62) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }
    }

    // Connections
    for (var a = 0; a < particles.length; a++) {
      for (var b = a+1; b < particles.length; b++) {
        var dx = particles[a].x - particles[b].x;
        var dy = particles[a].y - particles[b].y;
        var d = Math.sqrt(dx*dx + dy*dy);
        if (d < 88) {
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.strokeStyle = 'rgba(232,48,48,' + ((1 - d/88) * 0.12) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      // Drift
      p.vx += Math.sin(t * 0.009 + p.y * 0.004) * 0.013;
      p.vy += Math.cos(t * 0.007 + p.x * 0.004) * 0.011;
      p.vx *= 0.982; p.vy *= 0.982;
      // Cursor repulsion
      if (react) {
        var rdx = p.x - mx, rdy = p.y - my;
        var rd = Math.sqrt(rdx*rdx + rdy*rdy);
        if (rd < 78 && rd > 0) {
          var f = (1 - rd/78) * 1.5;
          p.vx += (rdx/rd) * f * 0.5;
          p.vy += (rdy/rd) * f * 0.5;
        }
      }
      p.x += p.vx; p.y += p.vy; p.life++;
      if (p.life > p.max || p.x < -10 || p.x > W+10 || p.y < -10 || p.y > H+10) {
        particles[i] = mkP(false);
        continue;
      }
      var alpha = Math.sin((p.life / p.max) * Math.PI) * 0.65;
      var hex = Math.floor(alpha * 255).toString(16).padStart(2,'0');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.col + hex;
      ctx.fill();
    }
    t++;
    requestAnimationFrame(loop);
  }
  loop();
  return function(){ alive = false; };
}

/* ---------- PORTAL CANVAS ---------- */
function makePortal(canvasId) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W=800, H=600, t=0, alive=true;
  function resize() { W = canvas.width = (canvas.parentElement||document.body).offsetWidth||800; H = canvas.height = (canvas.parentElement||document.body).offsetHeight||600; }
  resize(); window.addEventListener('resize', resize);
  function loop() {
    if (!alive) return;
    ctx.clearRect(0,0,W,H);
    var cx=W/2, cy=H/2, mr=Math.min(W,H)*0.36;
    for (var i=0; i<5; i++) {
      ctx.save(); ctx.translate(cx,cy);
      ctx.rotate(t*(i%2===0?0.007:-0.005)+i*0.5);
      var segs=24+i*6;
      for (var s=0; s<segs; s++) {
        if (s%3===0) continue;
        ctx.beginPath();
        ctx.arc(0,0,mr-i*15,(s/segs)*Math.PI*2,((s+0.72)/segs)*Math.PI*2);
        ctx.strokeStyle='rgba(232,48,48,'+(0.055+i*0.011)+')';
        ctx.lineWidth=1.5; ctx.stroke();
      }
      ctx.restore();
    }
    var g=ctx.createRadialGradient(cx,cy,0,cx,cy,mr*0.6);
    g.addColorStop(0,'rgba(232,48,48,'+(0.04+0.014*Math.sin(t*0.04))+')');
    g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    var sy=(t*1.1)%H, sg=ctx.createLinearGradient(0,sy-48,0,sy+48);
    sg.addColorStop(0,'transparent'); sg.addColorStop(0.5,'rgba(232,48,48,0.032)'); sg.addColorStop(1,'transparent');
    ctx.fillStyle=sg; ctx.fillRect(0,sy-48,W,96);
    t++; requestAnimationFrame(loop);
  }
  loop();
  return function(){ alive=false; };
}

/* ---------- HERO WAVE CANVAS ---------- */
function makeHeroWave() {
  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W=1200, H=600, t=0, mx=0.7, my=0.6;
  function resize() { var p=canvas.parentElement||document.body; W=canvas.width=p.offsetWidth||1200; H=canvas.height=p.offsetHeight||600; }
  resize(); window.addEventListener('resize', resize);
  document.addEventListener('mousemove', function(e){ mx=e.clientX/window.innerWidth; my=e.clientY/window.innerHeight; });
  function loop() {
    ctx.clearRect(0,0,W,H);
    var g=ctx.createRadialGradient(W*(0.65+mx*0.1),H*(0.55+my*0.15),0,W*(0.65+mx*0.1),H*(0.55+my*0.15),H*0.55);
    g.addColorStop(0,'rgba(232,48,48,'+(0.065+0.018*Math.sin(t*0.022))+')');
    g.addColorStop(0.45,'rgba(200,136,42,0.012)'); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    for (var i=0; i<10; i++) {
      ctx.beginPath(); ctx.moveTo(0, H*0.22+i*46);
      for (var x=0; x<W; x+=3) {
        ctx.lineTo(x, H*0.22+i*46+Math.sin(x*0.009+t*0.018+i*0.45)*13+Math.sin(x*0.018+t*0.012+i*0.9)*6);
      }
      ctx.strokeStyle='rgba(232,48,48,'+(0.022+(i/10)*0.024)+')'; ctx.lineWidth=1; ctx.stroke();
    }
    t++; requestAnimationFrame(loop);
  }
  loop();
}

/* ---------- LOADER ---------- */
function runLoader() {
  showEl('loader');
  try { makeParticles('loaderCanvas', {n:65, react:false}); } catch(e){}
  var statuses = ['INITIALIZING SYSTEM','LOADING ASSETS','ESTABLISHING CONNECTION','SYSTEM READY'];
  var si = 0;
  var statusEl = document.getElementById('loaderStatus');
  var stInt = setInterval(function(){
    si++; if (si < statuses.length && statusEl) statusEl.textContent = statuses[si];
    else clearInterval(stInt);
  }, 700);

  var done = false;
  function go() {
    if (done) return; done = true;
    clearInterval(stInt);
    sfx('boot');
    fadeOut('loader', function(){ showEntryGate(); });
  }
  setTimeout(go, 2800);
  setTimeout(function(){ if (!done) go(); }, 5000);
  document.getElementById('loader').addEventListener('click', go);
}

/* ---------- ENTRY GATE ---------- */
function showEntryGate() {
  fadeIn('entryGate');
  try { makePortal('gateCanvas'); } catch(e){}
}

/* ---------- OWNER MODAL ---------- */
function initGate() {
  var btnV = document.getElementById('btnViewer');
  var btnO = document.getElementById('btnOwner');
  var modal = document.getElementById('ownerModal');
  var cancel = document.getElementById('cancelCode');
  var errEl = document.getElementById('codeError');
  var digits = document.querySelectorAll('.code-digit');
  var kpBtns = document.querySelectorAll('.kp-btn');

  btnV.addEventListener('click', function(){ sfx('click'); enterSite(false); });
  btnO.addEventListener('click', function(){
    sfx('click');
    showEl(modal);
    setTimeout(function(){ if(digits[0]) digits[0].focus(); }, 100);
  });
  cancel.addEventListener('click', function(){
    sfx('click');
    hideEl(modal); hideEl(errEl);
    digits.forEach(function(d){ d.value=''; });
  });

  digits.forEach(function(d,i){
    d.addEventListener('input', function(){
      d.value = d.value.replace(/[^0-9]/g,'');
      if (d.value && i < digits.length-1) digits[i+1].focus();
      if (Array.from(digits).every(function(x){ return x.value; })) verify();
    });
    d.addEventListener('keydown', function(e){
      if (e.key==='Backspace' && !d.value && i>0) digits[i-1].focus();
      if (e.key==='Enter') verify();
    });
  });

  kpBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      sfx('click');
      var v = btn.getAttribute('data-val');
      if (v==='enter') { verify(); return; }
      if (v==='del') {
        var last=-1;
        digits.forEach(function(d,i){ if(d.value) last=i; });
        if (last>=0){ digits[last].value=''; digits[last].focus(); }
        return;
      }
      for (var i=0; i<digits.length; i++) {
        if (!digits[i].value) { digits[i].value=v; if(i<digits.length-1) digits[i+1].focus(); break; }
      }
      if (Array.from(digits).every(function(x){ return x.value; })) verify();
    });
  });

  function verify() {
    var code = Array.from(digits).map(function(d){ return d.value; }).join('');
    if (code === String.fromCharCode(50,49,48,56)) { // 2108 obfuscated
      sfx('unlock');
      hideEl(modal);
      enterSite(true);
    } else {
      sfx('error');
      showEl(errEl);
      digits.forEach(function(d){ d.value=''; });
      if(digits[0]) digits[0].focus();
      var box = document.querySelector('.modal-box');
      if(box){ box.style.animation='none'; void box.offsetWidth; box.style.animation='shake 0.4s ease'; }
    }
  }
}

/* ---------- ENTER SITE ---------- */
function enterSite(isOwner) {
  sfx('whoosh');
  fadeOut('entryGate', function(){
    if (isOwner) showOwnerMsg();
    else showTransition();
  });
}

/* ---------- OWNER MESSAGE ---------- */
var LINES = [
  {t:'Kritesh,', cls:'om-name'},
  {t:''},
  {t:'You crossed continents alone.'},
  {t:''},
  {t:'Nepal.', cls:'om-highlight'},
  {t:'Ohio.', cls:'om-highlight'},
  {t:'California.', cls:'om-highlight'},
  {t:'North Carolina.', cls:'om-highlight'},
  {t:''},
  {t:'Every place changed you.'},
  {t:''},
  {t:'You learned that confidence grows after action, not before it.', cls:'om-dim'},
  {t:'You learned that difficult things become normal once you survive them.', cls:'om-dim'},
  {t:'You learned that most limits were assumptions.', cls:'om-dim'},
  {t:''},
  {t:'Remember this:'},
  {t:''},
  {t:'You are capable of more than your current results suggest.'},
  {t:''},
  {t:'The version of you that arrived in America knew less, had less,', cls:'om-dim'},
  {t:'and still kept moving forward.', cls:'om-dim'},
  {t:''},
  {t:'Your goals were never small.'},
  {t:''},
  {t:'Keep building.', cls:'om-highlight'},
  {t:'Keep learning.', cls:'om-highlight'},
  {t:'Keep moving.', cls:'om-highlight'},
  {t:''},
  {t:'The only permanent limitation is the one you accept.'}
];

function showOwnerMsg() {
  showEl('ownerMessage');
  try { makeParticles('ownerMsgCanvas', {n:45, react:false, grid:false}); } catch(e){}
  var container = document.getElementById('ownerTypewriter');
  var btn = document.getElementById('ownerContinue');
  container.innerHTML = '';
  var cursor = document.createElement('span');
  cursor.className = 'om-cursor';
  container.appendChild(cursor);

  var li=0, ci=0, cur=null;
  function type() {
    if (li >= LINES.length) {
      cursor.remove();
      setTimeout(function(){
        showEl(btn);
        btn.style.opacity='0'; btn.style.transition='opacity 0.5s ease';
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ btn.style.opacity='1'; }); });
      }, 300);
      return;
    }
    var line = LINES[li];
    if (ci===0) {
      if (line.t==='') {
        container.insertBefore(document.createElement('br'), cursor);
        container.insertBefore(document.createElement('br'), cursor);
        li++; setTimeout(type, 50); return;
      }
      cur = document.createElement('span');
      if (line.cls) cur.className = line.cls;
      container.insertBefore(cur, cursor);
    }
    if (ci < line.t.length) {
      cur.textContent += line.t[ci]; ci++;
      var delay = (line.t[ci-1]==='.'||line.t[ci-1]===',')?52:24;
      setTimeout(type, delay);
    } else {
      container.insertBefore(document.createElement('br'), cursor);
      li++; ci=0; setTimeout(type, 70);
    }
  }
  setTimeout(type, 800);

  btn.addEventListener('click', function(){
    sfx('click');
    fadeOut('ownerMessage', showTransition);
  });
}

/* ---------- TRANSITION ---------- */
function showTransition() {
  sfx('pulse');
  showEl('transitionScreen');
  try { makeParticles('transCanvas', {n:75, react:false}); } catch(e){}
  setTimeout(function(){ fadeOut('transitionScreen', launchSite); }, 1600);
}

/* ---------- LAUNCH ---------- */
function launchSite() {
  var main = document.getElementById('mainSite');
  showEl(main);
  main.style.opacity='1';
  document.body.style.overflow='auto';
  showEl('soundToggle');
  sfx('whoosh');
  initSite();
}


/* ---------- INJECT PHOTOS FROM BASE64 ---------- */
function injectPhotos() {
  if (typeof PHOTOS === 'undefined') return;
  var map = {
    'hero-img':     PHOTOS['photo2'],
    'aph1':         PHOTOS['photo4'],
    'aph2':         PHOTOS['photo1'],
  };
  Object.keys(map).forEach(function(cls) {
    var els = document.querySelectorAll('.' + cls);
    els.forEach(function(el) {
      if (map[cls]) el.src = map[cls];
    });
  });
}

/* ---------- MAIN SITE INIT ---------- */
function initSite() {
  injectPhotos();
  makeHeroWave();
  // Particles on EVERY section including hero
  var sections = ['hero','about','story','projects','skills','resume','contact'];
  sections.forEach(function(id){
    var sec = document.getElementById(id);
    if (!sec) return;
    if (id==='hero') {
      // Hero already has heroCanvas for wave - add separate particle canvas
      var pc = document.createElement('canvas');
      pc.id = 'heroParticles';
      sec.insertBefore(pc, sec.firstChild);
      makeParticles('heroParticles', {n:90, react:true, grid:true});
    } else {
      var sc = document.createElement('canvas');
      sc.id = 'sec_'+id;
      sec.insertBefore(sc, sec.firstChild);
      makeParticles('sec_'+id, {n:55, react:true, grid:true});
    }
  });
  initReveal();
  initSkillBars();
  initNavScroll();
  initNavBurger();
  initCursor();
  initGlitch();
  initSoundToggle();
  // Enable sound after first user interaction
  document.addEventListener('click', function enableSound(){
    soundOn = true;
    document.removeEventListener('click', enableSound);
  }, {once: true});
}

/* ---------- SCROLL REVEAL ---------- */
function initReveal() {
  var els = document.querySelectorAll('.ri');
  if (!window.IntersectionObserver) {
    els.forEach(function(el){ el.classList.add('in'); }); return;
  }
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target); } });
  }, { threshold: 0.06, rootMargin: '0px 0px -10px 0px' });
  els.forEach(function(el){
    var r = el.getBoundingClientRect();
    if (r.top < window.innerHeight) el.classList.add('in');
    else obs.observe(el);
  });
}

/* ---------- SKILL BARS ---------- */
function initSkillBars() {
  var bars = document.querySelectorAll('.skill-bar');
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting) {
        var b = e.target;
        b.style.setProperty('--tw', (b.getAttribute('data-w')||'80')+'%');
        setTimeout(function(){ b.classList.add('go'); }, 80);
        obs.unobserve(b);
      }
    });
  }, {threshold:0.2});
  bars.forEach(function(b){ obs.observe(b); });
}

/* ---------- NAV HIGHLIGHT ---------- */
function initNavScroll() {
  var secs = document.querySelectorAll('section[id]');
  var links = document.querySelectorAll('.nav-link');
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting) links.forEach(function(l){ l.classList.toggle('active', l.getAttribute('href')==='#'+e.target.id); });
    });
  }, {threshold:0.4});
  secs.forEach(function(s){ obs.observe(s); });
}

/* ---------- NAV BURGER ---------- */
function initNavBurger() {
  var burger = document.getElementById('navBurger');
  var menu = document.getElementById('mobileMenu');
  if(burger&&menu){
    burger.addEventListener('click', function(){ sfx('click'); menu.classList.toggle('screen-hidden'); });
    menu.querySelectorAll('.mob-link').forEach(function(l){
      l.addEventListener('click', function(){ menu.classList.add('screen-hidden'); });
    });
  }
}

/* ---------- CURSOR ---------- */
function initCursor() {
  if (window.innerWidth < 768) return;
  var c = document.createElement('div'); c.className='cursor';
  var r = document.createElement('div'); r.className='cursor-ring';
  document.body.appendChild(c); document.body.appendChild(r);
  var mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove', function(e){ mx=e.clientX; my=e.clientY; });
  function loop(){ c.style.left=mx+'px'; c.style.top=my+'px'; rx+=(mx-rx)*0.12; ry+=(my-ry)*0.12; r.style.left=rx+'px'; r.style.top=ry+'px'; requestAnimationFrame(loop); }
  loop();
  document.querySelectorAll('a,button,.project-card,.contact-item,.tag').forEach(function(el){
    el.addEventListener('mouseenter', function(){ c.style.transform='translate(-50%,-50%) scale(2)'; r.style.width='58px'; r.style.height='58px'; });
    el.addEventListener('mouseleave', function(){ c.style.transform='translate(-50%,-50%) scale(1)'; r.style.width='36px'; r.style.height='36px'; });
  });
}

/* ---------- GLITCH ---------- */
function initGlitch() {
  document.querySelectorAll('.name-first,.name-last').forEach(function(el){
    var orig = el.textContent;
    var chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    el.addEventListener('mouseenter', function(){
      var cnt=0, iv=setInterval(function(){
        el.textContent=orig.split('').map(function(c,i){ return (c===' '?' ':i<cnt?orig[i]:chars[Math.floor(Math.random()*chars.length)]); }).join('');
        cnt++; if(cnt>orig.length){ el.textContent=orig; clearInterval(iv); }
      },30);
    });
  });
}

/* ---------- SOUND TOGGLE ---------- */
function initSoundToggle() {
  var btn = document.getElementById('soundToggle');
  var icon = document.getElementById('soundIcon');
  if(!btn) return;
  btn.addEventListener('click', function(){
    soundOn = !soundOn;
    if(icon) icon.textContent = soundOn ? '🔊' : '🔇';
    if(soundOn) sfx('click');
  });
}

/* ---------- SHAKE KEYFRAME ---------- */
var st=document.createElement('style');
st.textContent='@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}';
document.head.appendChild(st);

/* ---------- BOOT ---------- */
window.addEventListener('DOMContentLoaded', function(){
  // Set age
  var age=getAge();
  var a1=document.getElementById('dynamicAge'), a2=document.getElementById('ageStatNum');
  if(a1) a1.textContent=age; if(a2) a2.textContent=age;

  // Hide everything
  hideEl('entryGate'); hideEl('ownerMessage');
  hideEl('transitionScreen'); hideEl('mainSite');
  hideEl('soundToggle'); hideEl(document.getElementById('codeError'));
  document.body.style.overflow='hidden';

  initGate();
  runLoader();
});
