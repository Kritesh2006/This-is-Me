/* ============================================================
   KRITESH DHUNGEL — script.js  v4.0
   ============================================================ */

/* AGE */
function getAge(){var b=new Date('2006-06-07'),t=new Date(),a=t.getFullYear()-b.getFullYear();if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate()))a--;return a;}

/* SOUND */
var soundOn=false,actx=null;
function gac(){if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();return actx;}
function tone(f,type,dur,vol){if(!soundOn)return;try{var c=gac(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type=type||'sine';o.frequency.setValueAtTime(f,c.currentTime);o.frequency.exponentialRampToValueAtTime(f*.5,c.currentTime+dur);g.gain.setValueAtTime(vol||.07,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);o.start();o.stop(c.currentTime+dur);}catch(e){}}
function sfx(n){if(!soundOn)return;switch(n){case'click':tone(440,'sine',.08,.06);break;case'hover':tone(600,'sine',.04,.03);break;case'unlock':[440,660,880].forEach(function(f,i){setTimeout(function(){tone(f,'sine',.12,.07);},i*100);});break;case'error':tone(200,'sawtooth',.15,.05);break;case'whoosh':tone(800,'sine',.3,.04);setTimeout(function(){tone(200,'sine',.2,.03);},150);break;case'pulse':tone(300,'sine',.18,.04);break;case'connect':tone(550,'sine',.1,.05);setTimeout(function(){tone(880,'sine',.08,.04);},80);break;case'achieve':[440,550,660,880].forEach(function(f,i){setTimeout(function(){tone(f,'sine',.15,.06);},i*70);});break;case'boot':[220,330,440,550,660].forEach(function(f,i){setTimeout(function(){tone(f,'sine',.1,.05);},i*55);});break;}}

/* SHOW/HIDE */
function showEl(id){var e=typeof id==='string'?document.getElementById(id):id;if(e)e.classList.remove('screen-hidden');}
function hideEl(id){var e=typeof id==='string'?document.getElementById(id):id;if(e)e.classList.add('screen-hidden');}
function fadeOut(id,cb,ms){var e=typeof id==='string'?document.getElementById(id):id;if(!e){if(cb)cb();return;}ms=ms||380;e.style.transition='opacity '+ms+'ms ease';e.style.opacity='0';setTimeout(function(){hideEl(e);e.style.opacity='';e.style.transition='';if(cb)cb();},ms+20);}
function fadeIn(id){var e=typeof id==='string'?document.getElementById(id):id;if(!e)return;e.style.opacity='0';showEl(e);requestAnimationFrame(function(){requestAnimationFrame(function(){e.style.transition='opacity 480ms ease';e.style.opacity='1';setTimeout(function(){e.style.transition='';},500);});});}

/* ============================================================
   PARTICLE ENGINE — used everywhere
   ============================================================ */
function Particles(canvasId,opts){
  var canvas=document.getElementById(canvasId);
  if(!canvas)return{stop:function(){}};
  var ctx=canvas.getContext('2d');
  opts=opts||{};
  var c1=opts.c1||'#e83030',c2=opts.c2||'#c8882a';
  var n=opts.n||80,react=opts.react!==false,grid=opts.grid!==false;
  var W=1,H=1,t=0,alive=true,mx=-999,my=-999;
  var ps=[];

  function resize(){var p=canvas.parentElement||document.body;W=canvas.width=p.offsetWidth||window.innerWidth;H=canvas.height=p.offsetHeight||window.innerHeight;}
  resize();
  var ro=new ResizeObserver(resize);ro.observe(canvas.parentElement||document.body);

  if(react){document.addEventListener('mousemove',function(e){var r=canvas.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;});}

  function mkP(init){return{x:Math.random()*W,y:init?Math.random()*H:(Math.random()<.5?-4:H+4),vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,r:Math.random()*1.5+.5,life:0,max:Math.random()*300+150,col:Math.random()>.65?c2:c1};}
  for(var i=0;i<n;i++)ps.push(mkP(true));

  function draw(){
    if(!alive)return;
    ctx.clearRect(0,0,W,H);
    if(grid){ctx.strokeStyle='rgba(232,48,48,.02)';ctx.lineWidth=1;for(var gx=0;gx<W;gx+=62){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}for(var gy=0;gy<H;gy+=62){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}}
    for(var a=0;a<ps.length;a++){for(var b=a+1;b<ps.length;b++){var dx=ps[a].x-ps[b].x,dy=ps[a].y-ps[b].y,d=Math.sqrt(dx*dx+dy*dy);if(d<85){ctx.beginPath();ctx.moveTo(ps[a].x,ps[a].y);ctx.lineTo(ps[b].x,ps[b].y);ctx.strokeStyle='rgba(232,48,48,'+((1-d/85)*.11)+')';ctx.lineWidth=.5;ctx.stroke();}}}
    for(var i=0;i<ps.length;i++){var p=ps[i];p.vx+=Math.sin(t*.009+p.y*.004)*.013;p.vy+=Math.cos(t*.007+p.x*.004)*.011;p.vx*=.982;p.vy*=.982;if(react){var rdx=p.x-mx,rdy=p.y-my,rd=Math.sqrt(rdx*rdx+rdy*rdy);if(rd<75&&rd>0){var f=(1-rd/75)*1.4;p.vx+=(rdx/rd)*f*.48;p.vy+=(rdy/rd)*f*.48;}}p.x+=p.vx;p.y+=p.vy;p.life++;if(p.life>p.max||p.x<-10||p.x>W+10||p.y<-10||p.y>H+10){ps[i]=mkP(false);continue;}var alpha=Math.sin((p.life/p.max)*Math.PI)*.6;var hex=Math.floor(alpha*255).toString(16).padStart(2,'0');ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.col+hex;ctx.fill();}
    t++;requestAnimationFrame(draw);
  }
  draw();
  return{stop:function(){alive=false;ro.disconnect();}};
}

/* Portal canvas for gate */
function Portal(canvasId){
  var canvas=document.getElementById(canvasId);if(!canvas)return;
  var ctx=canvas.getContext('2d'),W=800,H=600,t=0,alive=true;
  function resize(){W=canvas.width=(canvas.parentElement||document.body).offsetWidth||800;H=canvas.height=(canvas.parentElement||document.body).offsetHeight||600;}
  resize();new ResizeObserver(resize).observe(canvas.parentElement||document.body);
  function draw(){if(!alive)return;ctx.clearRect(0,0,W,H);var cx=W/2,cy=H/2,mr=Math.min(W,H)*.36;for(var i=0;i<5;i++){ctx.save();ctx.translate(cx,cy);ctx.rotate(t*(i%2===0?.007:-.005)+i*.5);var segs=24+i*6;for(var s=0;s<segs;s++){if(s%3===0)continue;ctx.beginPath();ctx.arc(0,0,mr-i*15,(s/segs)*Math.PI*2,((s+.72)/segs)*Math.PI*2);ctx.strokeStyle='rgba(232,48,48,'+(0.055+i*.011)+')';ctx.lineWidth=1.5;ctx.stroke();}ctx.restore();}var g=ctx.createRadialGradient(cx,cy,0,cx,cy,mr*.6);g.addColorStop(0,'rgba(232,48,48,'+(0.04+.014*Math.sin(t*.04))+')');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);var sy=(t*1.1)%H,sg=ctx.createLinearGradient(0,sy-48,0,sy+48);sg.addColorStop(0,'transparent');sg.addColorStop(.5,'rgba(232,48,48,.03)');sg.addColorStop(1,'transparent');ctx.fillStyle=sg;ctx.fillRect(0,sy-48,W,96);t++;requestAnimationFrame(draw);}
  draw();return function(){alive=false;};}

/* Hero wave */
function HeroWave(){
  var canvas=document.getElementById('heroCanvas');if(!canvas)return;
  var ctx=canvas.getContext('2d'),W=1200,H=600,t=0,mx=.7,my=.6;
  function resize(){var p=canvas.parentElement||document.body;W=canvas.width=p.offsetWidth||1200;H=canvas.height=p.offsetHeight||600;}
  resize();new ResizeObserver(resize).observe(canvas.parentElement||document.body);
  document.addEventListener('mousemove',function(e){mx=e.clientX/window.innerWidth;my=e.clientY/window.innerHeight;});
  function draw(){ctx.clearRect(0,0,W,H);var g=ctx.createRadialGradient(W*(.65+mx*.1),H*(.55+my*.15),0,W*(.65+mx*.1),H*(.55+my*.15),H*.55);g.addColorStop(0,'rgba(232,48,48,'+(0.065+.018*Math.sin(t*.022))+')');g.addColorStop(.45,'rgba(200,136,42,.01)');g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);for(var i=0;i<10;i++){ctx.beginPath();ctx.moveTo(0,H*.2+i*48);for(var x=0;x<W;x+=3)ctx.lineTo(x,H*.2+i*48+Math.sin(x*.009+t*.018+i*.45)*13+Math.sin(x*.018+t*.012+i*.9)*6);ctx.strokeStyle='rgba(232,48,48,'+(0.02+(i/10)*.022)+')';ctx.lineWidth=1;ctx.stroke();}t++;requestAnimationFrame(draw);}
  draw();}

/* ============================================================ LOADER */
function runLoader(){
  showEl('loader');
  try{Particles('loaderCanvas',{n:60,react:false});}catch(e){}
  var stats=['INITIALIZING SYSTEM','LOADING ASSETS','ESTABLISHING CONNECTION','SYSTEM READY'];
  var si=0,el=document.getElementById('loaderStatus');
  var iv=setInterval(function(){si++;if(si<stats.length&&el)el.textContent=stats[si];else clearInterval(iv);},650);
  var done=false;
  function go(){if(done)return;done=true;clearInterval(iv);sfx('boot');fadeOut('loader',showGate);}
  setTimeout(go,2800);setTimeout(function(){if(!done)go();},5500);
  document.getElementById('loader').addEventListener('click',go);
}

/* ============================================================ GATE */
function showGate(){fadeIn('entryGate');try{Portal('gateCanvas');}catch(e){}}

function initGate(){
  var btnV=document.getElementById('btnViewer'),btnO=document.getElementById('btnOwner');
  var modal=document.getElementById('ownerModal'),cancel=document.getElementById('cancelCode');
  var errEl=document.getElementById('codeError'),digits=document.querySelectorAll('.code-digit');
  var kpBtns=document.querySelectorAll('.kp-btn');

  btnV.addEventListener('click',function(){sfx('click');enterSite(false);});
  btnO.addEventListener('click',function(){sfx('click');showEl(modal);setTimeout(function(){if(digits[0])digits[0].focus();},80);});
  cancel.addEventListener('click',function(){sfx('click');hideEl(modal);hideEl(errEl);digits.forEach(function(d){d.value='';});});

  digits.forEach(function(d,i){
    d.addEventListener('input',function(){d.value=d.value.replace(/[^0-9]/g,'');if(d.value&&i<digits.length-1)digits[i+1].focus();if(Array.from(digits).every(function(x){return x.value;}))verify();});
    d.addEventListener('keydown',function(e){if(e.key==='Backspace'&&!d.value&&i>0)digits[i-1].focus();if(e.key==='Enter')verify();});
  });

  kpBtns.forEach(function(btn){
    btn.addEventListener('click',function(){
      sfx('click');var v=btn.getAttribute('data-val');
      if(v==='enter'){verify();return;}
      if(v==='del'){var last=-1;digits.forEach(function(d,i){if(d.value)last=i;});if(last>=0){digits[last].value='';digits[last].focus();}return;}
      for(var i=0;i<digits.length;i++){if(!digits[i].value){digits[i].value=v;if(i<digits.length-1)digits[i+1].focus();break;}}
      if(Array.from(digits).every(function(x){return x.value;}))verify();
    });
  });

  function verify(){
    var code=Array.from(digits).map(function(d){return d.value;}).join('');
    // Code stored as char codes to avoid plain text exposure
    if(code===String.fromCharCode(50,49,48,56)){sfx('unlock');hideEl(modal);enterSite(true);}
    else{sfx('error');showEl(errEl);digits.forEach(function(d){d.value='';});if(digits[0])digits[0].focus();var box=document.querySelector('.modal-box');if(box){box.style.animation='none';void box.offsetWidth;box.style.animation='shake .4s ease';}}
  }
}

/* ============================================================ ENTER */
function enterSite(isOwner){sfx('whoosh');fadeOut('entryGate',function(){if(isOwner)showOwnerMsg();else showTrans();});}

/* ============================================================ OWNER MESSAGE */
var LINES=[
  {t:'Kritesh,',cls:'om-name'},{t:''},{t:'You crossed continents alone.'},{t:''},{t:'Nepal.',cls:'om-highlight'},{t:'Ohio.',cls:'om-highlight'},{t:'California.',cls:'om-highlight'},{t:'North Carolina.',cls:'om-highlight'},{t:''},{t:'Every place changed you.'},{t:''},{t:'You learned that confidence grows after action, not before it.',cls:'om-dim'},{t:'You learned that difficult things become normal once you survive them.',cls:'om-dim'},{t:'You learned that most limits were assumptions.',cls:'om-dim'},{t:''},{t:'Remember this:'},{t:''},{t:'You are capable of more than your current results suggest.'},{t:''},{t:'The version of you that arrived in America knew less, had less,',cls:'om-dim'},{t:'and still kept moving forward.',cls:'om-dim'},{t:''},{t:'Your goals were never small.'},{t:''},{t:'Keep building.',cls:'om-highlight'},{t:'Keep learning.',cls:'om-highlight'},{t:'Keep moving.',cls:'om-highlight'},{t:''},{t:'The only permanent limitation is the one you accept.'}
];

function showOwnerMsg(){
  showEl('ownerMessage');
  try{Particles('ownerMsgCanvas',{n:40,react:false,grid:false});}catch(e){}
  var con=document.getElementById('ownerTypewriter'),btn=document.getElementById('ownerContinue');
  con.innerHTML='';
  var cursor=document.createElement('span');cursor.className='om-cursor';con.appendChild(cursor);
  var li=0,ci=0,cur=null;
  function type(){
    if(li>=LINES.length){cursor.remove();setTimeout(function(){showEl(btn);btn.style.opacity='0';btn.style.transition='opacity .5s ease';requestAnimationFrame(function(){requestAnimationFrame(function(){btn.style.opacity='1';});});},300);return;}
    var line=LINES[li];
    if(ci===0){if(line.t===''){con.insertBefore(document.createElement('br'),cursor);con.insertBefore(document.createElement('br'),cursor);li++;setTimeout(type,48);return;}cur=document.createElement('span');if(line.cls)cur.className=line.cls;con.insertBefore(cur,cursor);}
    if(ci<line.t.length){cur.textContent+=line.t[ci];ci++;setTimeout(type,(line.t[ci-1]==='.'||line.t[ci-1]===',')?50:23);}
    else{con.insertBefore(document.createElement('br'),cursor);li++;ci=0;setTimeout(type,65);}
  }
  setTimeout(type,700);
  btn.addEventListener('click',function(){sfx('click');fadeOut('ownerMessage',showTrans);});
}

/* ============================================================ TRANSITION */
function showTrans(){
  sfx('pulse');showEl('transitionScreen');
  try{Particles('transCanvas',{n:70,react:false});}catch(e){}
  setTimeout(function(){fadeOut('transitionScreen',launchSite);},1500);
}

/* ============================================================ LAUNCH */
function launchSite(){
  var main=document.getElementById('mainSite');
  showEl(main);main.style.opacity='1';
  document.body.style.overflow='auto';
  showEl('soundToggle');
  initSite();
  // Enable sound after first click
  document.addEventListener('click',function en(){soundOn=true;document.removeEventListener('click',en);},{once:true});
}

/* ============================================================ MAIN SITE */
function initSite(){
  HeroWave();
  // Particles on hero
  try{Particles('heroCanvas',{n:85,react:true,grid:true});}catch(e){}
  // Section particle canvases
  document.querySelectorAll('.sec-canvas').forEach(function(c,i){
    c.id='sc'+i;
    try{Particles('sc'+i,{n:50,react:true,grid:true});}catch(e){}
  });
  initReveal();
  initSkillBars();
  initNavScroll();
  initNavBurger();
  initCursor();
  initGlitch();
  initGame();
  initSoundToggle();
}

/* ============================================================ SCROLL REVEAL */
function initReveal(){
  var els=document.querySelectorAll('.ri');
  if(!window.IntersectionObserver){els.forEach(function(el){el.classList.add('in');});return;}
  var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target);}});},{threshold:.06,rootMargin:'0px 0px -8px 0px'});
  els.forEach(function(el){var r=el.getBoundingClientRect();if(r.top<window.innerHeight)el.classList.add('in');else obs.observe(el);});
}

/* SKILL BARS */
function initSkillBars(){
  var bars=document.querySelectorAll('.skill-bar');
  var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){var b=e.target;b.style.setProperty('--tw',(b.getAttribute('data-w')||'80')+'%');setTimeout(function(){b.classList.add('go');},80);obs.unobserve(b);}});},{threshold:.2});
  bars.forEach(function(b){obs.observe(b);});
}

/* NAV */
function initNavScroll(){
  var secs=document.querySelectorAll('section[id]'),links=document.querySelectorAll('.nav-link');
  var obs=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting)links.forEach(function(l){l.classList.toggle('active',l.getAttribute('href')==='#'+e.target.id);});});},{threshold:.4});
  secs.forEach(function(s){obs.observe(s);});
}
function initNavBurger(){
  var b=document.getElementById('navBurger'),m=document.getElementById('mobileMenu');
  if(b&&m){b.addEventListener('click',function(){sfx('click');m.classList.toggle('screen-hidden');});m.querySelectorAll('.mob-link').forEach(function(l){l.addEventListener('click',function(){m.classList.add('screen-hidden');});});}
}

/* CURSOR */
function initCursor(){
  if(window.innerWidth<768)return;
  var c=document.createElement('div'),r=document.createElement('div');
  c.className='cursor';r.className='cursor-ring';
  document.body.appendChild(c);document.body.appendChild(r);
  var mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;});
  function loop(){c.style.left=mx+'px';c.style.top=my+'px';rx+=(mx-rx)*.12;ry+=(my-ry)*.12;r.style.left=rx+'px';r.style.top=ry+'px';requestAnimationFrame(loop);}
  loop();
  document.querySelectorAll('a,button,.project-card,.contact-item,.tag,.kp-btn').forEach(function(el){
    el.addEventListener('mouseenter',function(){c.style.transform='translate(-50%,-50%) scale(2)';r.style.width='56px';r.style.height='56px';if(soundOn)sfx('hover');});
    el.addEventListener('mouseleave',function(){c.style.transform='translate(-50%,-50%) scale(1)';r.style.width='34px';r.style.height='34px';});
  });
}

/* GLITCH */
function initGlitch(){
  document.querySelectorAll('.name-first,.name-last').forEach(function(el){
    var orig=el.textContent,chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    el.addEventListener('mouseenter',function(){var cnt=0,iv=setInterval(function(){el.textContent=orig.split('').map(function(c,i){return c===' '?' ':i<cnt?orig[i]:chars[Math.floor(Math.random()*chars.length)];}).join('');cnt++;if(cnt>orig.length){el.textContent=orig;clearInterval(iv);}},30);});
  });
}

/* SOUND TOGGLE */
function initSoundToggle(){
  var btn=document.getElementById('soundToggle'),icon=document.getElementById('soundIcon');
  if(btn)btn.addEventListener('click',function(){soundOn=!soundOn;if(icon)icon.textContent=soundOn?'🔊':'🔇';if(soundOn)sfx('click');});
}

/* ============================================================
   NEURAL NETWORK GAME
   ============================================================ */
var gameRunning=false,gameData=null;

function initGame(){
  var btn=document.getElementById('openGame');
  if(btn)btn.addEventListener('click',function(){sfx('whoosh');openGame();});
}

function openGame(){
  showEl('gameOverlay');
  document.body.style.overflow='hidden';
  gameRunning=true;
  document.getElementById('gameClose').onclick=function(){sfx('whoosh');closeGame();};
  document.getElementById('gameReset').onclick=function(){sfx('click');if(gameData)gameData.reset();};
  runGame();
}

function closeGame(){
  gameRunning=false;
  if(gameData&&gameData.kill)gameData.kill();
  gameData=null;
  hideEl('gameOverlay');
  document.body.style.overflow='auto';
}

function runGame(){
  var canvas=document.getElementById('gameCanvas');
  if(!canvas)return;
  var ctx=canvas.getContext('2d');
  var W,H,t=0,alive=true;
  var nodes=[],links=[],pulses=[],sparks=[];
  var selected=null,dragging=null,dragOX=0,dragOY=0,mx=0,my=0;
  var score=0,combo=1,comboTimer=null;
  var achievements=[
    {id:'first',title:'FIRST CONNECTION',done:false,need:function(){return links.length>=1;}},
    {id:'five',title:'NETWORK FORMING',done:false,need:function(){return links.length>=5;}},
    {id:'ten',title:'ARIA ACTIVATED',done:false,need:function(){return links.length>=10;}},
    {id:'twenty',title:'AUTONOMOUS REASONING DETECTED',done:false,need:function(){return links.length>=20;}},
    {id:'thirty',title:'SYSTEM ONLINE — NETWORK EXPANDING',done:false,need:function(){return links.length>=30;}}
  ];

  function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;if(nodes.length===0)spawnNodes();}
  resize();window.addEventListener('resize',resize);

  function spawnNodes(){
    nodes=[];links=[];
    var count=Math.max(16,Math.min(28,Math.floor(W*H/22000)));
    var margin=90;
    for(var i=0;i<count;i++){
      nodes.push({id:i,x:margin+Math.random()*(W-margin*2),y:margin+Math.random()*(H-margin*2),vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22,r:Math.random()*4+7,col:Math.random()>.3?'#e83030':'#ffffff',pulse:0,connections:0});
    }
    score=0;combo=1;updateUI();
  }

  function isLinked(a,b){return links.some(function(l){return(l.a===a.id&&l.b===b.id)||(l.a===b.id&&l.b===a.id);});}

  function addLink(a,b){
    if(isLinked(a,b)||a===b)return;
    links.push({a:a.id,b:b.id,age:0,glow:1});
    a.connections++;b.connections++;
    a.pulse=1;b.pulse=1;
    score+=10*combo;
    combo=Math.min(combo+1,8);
    if(comboTimer)clearTimeout(comboTimer);
    comboTimer=setTimeout(function(){combo=Math.max(1,combo-1);updateUI();},2000);
    // Sparks at midpoint
    var mx2=(a.x+b.x)/2,my2=(a.y+b.y)/2;
    for(var i=0;i<6;i++)sparks.push({x:mx2,y:my2,vx:(Math.random()-.5)*3,vy:(Math.random()-.5)*3,life:0,max:30,col:Math.random()>.5?'#e83030':'#ff8888'});
    pulses.push({x:mx2,y:my2,r:0,max:55});
    sfx('connect');
    updateUI();
    checkAchievements();
  }

  function checkAchievements(){
    achievements.forEach(function(ach){
      if(!ach.done&&ach.need()){ach.done=true;showAchievement(ach.title);sfx('achieve');}
    });
  }

  function showAchievement(text){
    var el=document.getElementById('gameAchievement');
    if(!el)return;
    el.textContent=text;el.classList.add('show');
    setTimeout(function(){el.classList.remove('show');},2800);
  }

  function updateUI(){
    var sc=document.getElementById('gameScore'),co=document.getElementById('gameCombo');
    var nc=document.getElementById('nodeCount'),lc=document.getElementById('linkCount');
    if(sc){sc.textContent=score;sc.classList.add('pop');setTimeout(function(){sc.classList.remove('pop');},160);}
    if(co)co.textContent='x'+combo;
    if(nc)nc.textContent=nodes.length;
    if(lc)lc.textContent=links.length;
  }

  // Input
  function pos(e){return e.touches?{x:e.touches[0].clientX,y:e.touches[0].clientY}:{x:e.clientX,y:e.clientY};}
  function nodeAt(x,y,r){r=r||32;for(var i=nodes.length-1;i>=0;i--){var n=nodes[i],dx=n.x-x,dy=n.y-y;if(Math.sqrt(dx*dx+dy*dy)<n.r+r)return n;}return null;}

  function onDown(e){
    if(!alive)return;
    var p=pos(e),n=nodeAt(p.x,p.y,26);
    if(n){dragging=n;dragOX=n.x-p.x;dragOY=n.y-p.y;n.vx=0;n.vy=0;sfx('click');}
    e.preventDefault();
  }
  function onMove(e){
    if(!alive)return;
    var p=pos(e);mx=p.x;my=p.y;
    if(dragging){dragging.x=Math.max(dragging.r,Math.min(W-dragging.r,p.x+dragOX));dragging.y=Math.max(dragging.r,Math.min(H-dragging.r,p.y+dragOY));}
    e.preventDefault();
  }
  function onUp(e){
    if(!alive)return;
    var p=pos(e);
    if(!dragging){
      var n=nodeAt(p.x,p.y,28);
      if(n){if(selected&&selected!==n){addLink(selected,n);selected=null;}else if(selected===n){selected=null;}else{selected=n;sfx('click');}}
      else{selected=null;}
    } else {
      // Drop on another node = connect
      var near=nodeAt(p.x+dragOX,p.y+dragOY,36);
      if(near&&near!==dragging)addLink(dragging,near);
      dragging.vx=(Math.random()-.5)*.4;dragging.vy=(Math.random()-.5)*.4;
    }
    dragging=null;
  }

  canvas.addEventListener('mousedown',onDown);
  canvas.addEventListener('mousemove',onMove);
  canvas.addEventListener('mouseup',onUp);
  canvas.addEventListener('touchstart',onDown,{passive:false});
  canvas.addEventListener('touchmove',onMove,{passive:false});
  canvas.addEventListener('touchend',onUp);
  canvas.addEventListener('mousedown',function hintHide(){var h=document.getElementById('gameHint');if(h)h.style.opacity='0';canvas.removeEventListener('mousedown',hintHide);},{once:true});

  // Draw loop
  function draw(){
    if(!alive)return;
    ctx.clearRect(0,0,W,H);

    // BG grid
    ctx.strokeStyle='rgba(232,48,48,.016)';ctx.lineWidth=1;
    for(var gx=0;gx<W;gx+=60){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,H);ctx.stroke();}
    for(var gy=0;gy<H;gy+=60){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(W,gy);ctx.stroke();}

    // Cursor glow
    var cg=ctx.createRadialGradient(mx,my,0,mx,my,90);cg.addColorStop(0,'rgba(232,48,48,.055)');cg.addColorStop(1,'transparent');ctx.fillStyle=cg;ctx.fillRect(0,0,W,H);

    // Pulses
    pulses=pulses.filter(function(p){return p.r<p.max;});
    pulses.forEach(function(p){p.r+=2.2;var al=(1-p.r/p.max)*.55;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.strokeStyle='rgba(232,48,48,'+al+')';ctx.lineWidth=1.5;ctx.stroke();});

    // Sparks
    sparks=sparks.filter(function(s){return s.life<s.max;});
    sparks.forEach(function(s){s.x+=s.vx;s.y+=s.vy;s.vy+=.08;s.life++;var al=(1-s.life/s.max)*.8;ctx.beginPath();ctx.arc(s.x,s.y,1.5,0,Math.PI*2);ctx.fillStyle=s.col+Math.floor(al*255).toString(16).padStart(2,'0');ctx.fill();});

    // Links
    links.forEach(function(lk){
      var na=nodes[lk.a],nb=nodes[lk.b];if(!na||!nb)return;
      lk.age++;lk.glow=Math.max(.4,lk.glow-.02);
      var al=Math.min(1,lk.age/18)*.8;
      var grad=ctx.createLinearGradient(na.x,na.y,nb.x,nb.y);
      grad.addColorStop(0,'rgba(232,48,48,'+al+')');
      grad.addColorStop(.5,'rgba(255,100,100,'+(al*.9)+')');
      grad.addColorStop(1,'rgba(232,48,48,'+al+')');
      ctx.beginPath();ctx.moveTo(na.x,na.y);ctx.lineTo(nb.x,nb.y);
      ctx.strokeStyle=grad;ctx.lineWidth=1.2+Math.sin(t*.05+lk.age*.08)*.4;
      ctx.shadowBlur=6;ctx.shadowColor='rgba(232,48,48,.5)';ctx.stroke();ctx.shadowBlur=0;
    });

    // Preview line
    if(selected){
      ctx.beginPath();ctx.moveTo(selected.x,selected.y);ctx.lineTo(mx,my);
      ctx.strokeStyle='rgba(232,48,48,.28)';ctx.lineWidth=1;ctx.setLineDash([4,6]);ctx.stroke();ctx.setLineDash([]);
    }

    // Nodes
    nodes.forEach(function(n){
      if(n!==dragging){
        n.vx+=(Math.random()-.5)*.008;n.vy+=(Math.random()-.5)*.008;n.vx*=.985;n.vy*=.985;
        // Cursor repel
        var rdx=n.x-mx,rdy=n.y-my,rd=Math.sqrt(rdx*rdx+rdy*rdy);
        if(rd<68&&rd>0){var f=(1-rd/68)*.9;n.vx+=(rdx/rd)*f;n.vy+=(rdy/rd)*f;}
        n.x+=n.vx;n.y+=n.vy;
        if(n.x<n.r){n.x=n.r;n.vx=Math.abs(n.vx)*.7;}if(n.x>W-n.r){n.x=W-n.r;n.vx=-Math.abs(n.vx)*.7;}
        if(n.y<n.r){n.y=n.r;n.vy=Math.abs(n.vy)*.7;}if(n.y>H-n.r){n.y=H-n.r;n.vy=-Math.abs(n.vy)*.7;}
      }
      if(n.pulse>0)n.pulse=Math.max(0,n.pulse-.035);
      var isSel=selected===n,isDrag=dragging===n;
      var gSize=6+n.pulse*22+(isSel||isDrag?18:0);
      var col=isSel?'#ff6060':isDrag?'#ffaaaa':n.col;
      // Glow
      var rg=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,gSize*3);rg.addColorStop(0,col+'44');rg.addColorStop(1,'transparent');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(n.x,n.y,gSize*3,0,Math.PI*2);ctx.fill();
      // Core
      ctx.beginPath();ctx.arc(n.x,n.y,n.r+(isSel||isDrag?3:0),0,Math.PI*2);ctx.fillStyle=col;ctx.shadowBlur=gSize;ctx.shadowColor=col;ctx.fill();ctx.shadowBlur=0;
      // Selected ring
      if(isSel){ctx.beginPath();ctx.arc(n.x,n.y,n.r+9+Math.sin(t*.1)*2,0,Math.PI*2);ctx.strokeStyle='rgba(232,48,48,.45)';ctx.lineWidth=1;ctx.stroke();}
      // Connection count label
      if(n.connections>0){ctx.fillStyle='rgba(255,255,255,.5)';ctx.font='bold '+(n.r*.8)+'px Space Mono, monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(n.connections,n.x,n.y);}
    });

    t++;gameData.animId=requestAnimationFrame(draw);
  }

  gameData={
    animId:null,
    kill:function(){alive=false;canvas.removeEventListener('mousedown',onDown);canvas.removeEventListener('mousemove',onMove);canvas.removeEventListener('mouseup',onUp);canvas.removeEventListener('touchstart',onDown);canvas.removeEventListener('touchmove',onMove);canvas.removeEventListener('touchend',onUp);if(this.animId)cancelAnimationFrame(this.animId);},
    reset:function(){score=0;combo=1;links=[];pulses=[];sparks=[];selected=null;dragging=null;achievements.forEach(function(a){a.done=false;});spawnNodes();var h=document.getElementById('gameHint');if(h)h.style.opacity='1';updateUI();}
  };

  updateUI();
  draw();
}

/* ============================================================ BOOT */
window.addEventListener('DOMContentLoaded',function(){
  var age=getAge();
  var a1=document.getElementById('dynamicAge'),a2=document.getElementById('ageStatNum');
  if(a1)a1.textContent=age;if(a2)a2.textContent=age;
  hideEl('entryGate');hideEl('ownerMessage');hideEl('transitionScreen');hideEl('mainSite');hideEl('soundToggle');hideEl('gameOverlay');
  if(document.getElementById('codeError'))hideEl('codeError');
  document.body.style.overflow='hidden';
  initGate();
  runLoader();
});
