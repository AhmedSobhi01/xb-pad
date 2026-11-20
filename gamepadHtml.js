// Gamepad UI shown inside the WebView. No backticks / dollar-brace inside the HTML.
export default String.raw`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<title>Xb Pad</title>
<style>
  :root{--g:#107c10;--g2:#2fd12f;--line:#1d3d1d;--txt:#9c9}
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  html,body{margin:0;height:100%;background:#050505;overflow:hidden;touch-action:none;
    user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#cfe}
  #pad{position:fixed;inset:0;direction:ltr}
  .btn{position:absolute;display:flex;align-items:center;justify-content:center;font-weight:700;
    letter-spacing:.5px;color:var(--txt);border:2px solid var(--line);
    background:radial-gradient(circle at 35% 30%,#2a2a2a,#0f0f0f);touch-action:none;
    transition:transform .05s,box-shadow .05s}
  .btn.on{background:radial-gradient(circle at 35% 30%,var(--g2),#0c6a0c)!important;color:#fff!important;
    transform:scale(.94);box-shadow:0 0 2.5vh #1fb81f99}
  .round{border-radius:50%}
  .pill{border-radius:1.6vh}
  .face{width:14vh;height:14vh;font-size:6vh}
  #bA{color:#4ccf4c;border-color:#245c24}
  #bB{color:#ff5a5a;border-color:#6a2424}
  #bX{color:#5a9bff;border-color:#24406a}
  #bY{color:#ffd34d;border-color:#6a5a24}
  .sh{width:22vh;height:10vh;font-size:3.6vh}
  .tr{height:12vh}
  .mini{width:8vh;height:8vh}
  #bNexus{width:12vh;height:12vh;color:#eaffea;border-color:#2a6a2a;box-shadow:0 0 1.6vh #1fb81f44}
  .mini svg,#bNexus svg{width:58%;height:58%;fill:none;stroke:currentColor;stroke-width:2.2;
    stroke-linecap:round;stroke-linejoin:round;pointer-events:none}
  .stick{position:absolute;width:36vh;height:36vh;border-radius:50%;touch-action:none;
    background:radial-gradient(circle,#161616 55%,#0b0b0b 100%);border:2px solid var(--line)}
  .stick .knob{position:absolute;left:50%;top:50%;width:17vh;height:17vh;margin:-8.5vh 0 0 -8.5vh;border-radius:50%;
    background:radial-gradient(circle at 35% 30%,#3a3a3a,#141414);border:2px solid #2f5f2f;pointer-events:none}
  .stick.on .knob{border-color:var(--g2);box-shadow:0 0 2.5vh #1fb81f88}
  .dp{width:11vh;height:11vh;border-radius:1.4vh;font-size:4vh}
  #bar{position:absolute;left:50%;bottom:1.2vh;transform:translateX(-50%);
    display:flex;gap:1.5vh;align-items:center;font:600 1.9vh ui-monospace,Menlo,monospace;color:#4a6a4a;direction:ltr;white-space:nowrap}
  #status{color:#c9a227}
  #status.ok{color:var(--g2)}
  #warn{display:none;position:fixed;inset:0;background:#050505;z-index:9;align-items:center;justify-content:center;
    flex-direction:column;gap:12px;font-size:20px;color:var(--g2);text-align:center;direction:rtl}
  #warn b{font-size:56px}
  @media (orientation:portrait){#warn{display:flex}}
</style>
</head>
<body>
<div id="warn"><b>&#8635;</b><span>قلّب الموبايل أفقي</span></div>

<div id="pad">
  <div class="btn pill sh tr" data-b="LT" style="left:3%;top:1.5vh">LT</div>
  <div class="btn pill sh"    data-b="LB" style="left:3%;top:15vh">LB</div>
  <div class="btn pill sh tr" data-b="RT" style="right:3%;top:1.5vh">RT</div>
  <div class="btn pill sh"    data-b="RB" style="right:3%;top:15vh">RB</div>

  <div class="btn round" id="bNexus" data-b="Nexus" style="left:calc(50% - 6vh);top:1.5vh">
    <svg viewBox="0 0 24 24" style="width:78%;height:78%"><circle cx="12" cy="12" r="10.8" style="stroke-width:1.3"/>
      <path style="stroke-width:2.4" d="M6.6 6.4C8.9 9 10.6 10.8 12 12c1.4 1.2 3.1 3 5.4 5.6M17.4 6.4C15.1 9 13.4 10.8 12 12c-1.4 1.2-3.1 3-5.4 5.6"/>
      <path style="stroke-width:1.5" d="M8.6 4.6c2 1.7 4.8 1.7 6.8 0M8.6 19.4c2-1.7 4.8-1.7 6.8 0"/></svg></div>
  <div class="btn round mini" data-b="View" style="left:calc(50% - 15vh);top:15vh">
    <svg viewBox="0 0 24 24"><rect x="3" y="8" width="12" height="11" rx="1.5"/><path d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4H19.5A1.5 1.5 0 0 1 21 5.5V14.5A1.5 1.5 0 0 1 19.5 16H15"/></svg></div>
  <div class="btn round mini" data-b="Menu" style="left:calc(50% + 7vh);top:15vh">
    <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></div>

  <div class="stick" id="sL" data-k="L" style="left:7%;top:30vh"><div class="knob"></div></div>
  <div class="btn dp" data-b="Up"    style="left:calc(31% + 11vh);top:55vh">&#9650;</div>
  <div class="btn dp" data-b="Left"  style="left:31%;top:66vh">&#9664;</div>
  <div class="btn dp" data-b="Right" style="left:calc(31% + 22vh);top:66vh">&#9654;</div>
  <div class="btn dp" data-b="Down"  style="left:calc(31% + 11vh);top:77vh">&#9660;</div>

  <div class="btn round face" id="bY" data-b="Y" style="right:calc(7% + 13vh);top:27vh">Y</div>
  <div class="btn round face" id="bX" data-b="X" style="right:calc(7% + 26vh);top:40vh">X</div>
  <div class="btn round face" id="bB" data-b="B" style="right:7%;top:40vh">B</div>
  <div class="btn round face" id="bA" data-b="A" style="right:calc(7% + 13vh);top:53vh">A</div>

  <div class="stick" id="sR" data-k="R" style="right:31%;top:60vh;width:34vh;height:34vh"><div class="knob"></div></div>

  <div id="bar"><span id="status">وضع تجربة · غير متصل</span><span id="dbg">-</span></div>
</div>

<script>
var S = { btn:{}, ax:{lx:0,ly:0,rx:0,ry:0} };
var dirty = true;
function $(s){ return document.querySelector(s); }
function post(o){ try{ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }catch(e){} }

window.XbTransport = { send: function(state){ post({t:'state', s:state}); } };
window.XbStatus = function(text, ok){ var el=$('#status'); el.textContent=text; el.className = ok ? 'ok' : ''; };

function buzz(ms){
  ms = ms || 12;
  if(window.ReactNativeWebView) post({t:'buzz', ms:ms});
  else { try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }
}
function setBtn(n,v){
  v = !!v;
  if(!!S.btn[n] === v) return;
  S.btn[n] = v; dirty = true;
  if(v) buzz();
}

document.querySelectorAll('[data-b]').forEach(function(el){
  var n = el.dataset.b;
  function down(e){ e.preventDefault(); try{el.setPointerCapture(e.pointerId)}catch(_){} el.classList.add('on'); setBtn(n,true); }
  function up(){ el.classList.remove('on'); setBtn(n,false); }
  el.addEventListener('pointerdown',down);
  ['pointerup','pointercancel','lostpointercapture'].forEach(function(t){ el.addEventListener(t,up); });
});

var DEAD = 0.08;
function stick(el){
  var k = el.dataset.k, knob = el.firstElementChild;
  var id = null, cx=0, cy=0, R=1, t0=0, maxD=0;
  function setAx(x,y){ S.ax[k.toLowerCase()+'x']=x; S.ax[k.toLowerCase()+'y']=y; dirty=true; }
  function move(e){
    var dx=e.clientX-cx, dy=e.clientY-cy, d=Math.hypot(dx,dy);
    if(d>R){ dx*=R/d; dy*=R/d; d=R; }
    maxD=Math.max(maxD,d/R);
    knob.style.transform='translate('+dx+'px,'+dy+'px)';
    var x=dx/R, y=dy/R;
    if(Math.hypot(x,y)<DEAD){ x=0; y=0; }
    setAx(+x.toFixed(3), +y.toFixed(3));
  }
  el.addEventListener('pointerdown',function(e){
    if(id!==null) return; e.preventDefault();
    id=e.pointerId; el.setPointerCapture(id);
    var r=el.getBoundingClientRect(); cx=r.left+r.width/2; cy=r.top+r.height/2;
    R=r.width/2-knob.offsetWidth/2; t0=performance.now(); maxD=0;
    el.classList.add('on'); move(e);
  });
  el.addEventListener('pointermove',function(e){ if(e.pointerId===id) move(e); });
  function end(e){
    if(e.pointerId!==id) return; id=null;
    knob.style.transform=''; el.classList.remove('on'); setAx(0,0);
    if(performance.now()-t0<220 && maxD<0.25){
      var n=k+'3'; setBtn(n,true); setTimeout(function(){ setBtn(n,false); },90);
    }
  }
  ['pointerup','pointercancel'].forEach(function(t){ el.addEventListener(t,end); });
}
document.querySelectorAll('.stick').forEach(stick);

function snapshot(){
  var b={}; for(var k in S.btn) if(S.btn[k]) b[k]=true;
  return { buttons:b,
    axes:[S.ax.lx,S.ax.ly,S.ax.rx,S.ax.ry],
    triggers:[S.btn.LT?1:0, S.btn.RT?1:0] };
}
var dbg = $('#dbg');
setInterval(function(){
  var active = S.ax.lx||S.ax.ly||S.ax.rx||S.ax.ry;
  if(!dirty && !active) return;
  var s = snapshot();
  if(dirty){
    var names=Object.keys(s.buttons).join(' ');
    dbg.textContent = (names||'-') + (active ? ('  L('+s.axes[0].toFixed(1)+','+s.axes[1].toFixed(1)+') R('+s.axes[2].toFixed(1)+','+s.axes[3].toFixed(1)+')') : '');
  }
  dirty=false;
  window.XbTransport.send(s);
},16);

document.addEventListener('contextmenu',function(e){ e.preventDefault(); });
</script>
</body>
</html>`;
