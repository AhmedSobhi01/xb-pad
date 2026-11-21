// Gamepad UI + WebRTC client, shown inside the WebView.
// No backticks / dollar-brace inside the HTML (it lives in a String.raw template).
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
  #status{color:#c9a227;padding:.8vh 1.6vh;border:1px solid var(--line);border-radius:1vh;background:#0c0c0c}
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

  <div id="bar"><span id="status">غير متصل · اضغط هنا</span><span id="dbg">-</span></div>
</div>

<script>
var S = { btn:{}, ax:{lx:0,ly:0,rx:0,ry:0} };
var dirty = true;
var lastSend = 0;
function $(s){ return document.querySelector(s); }
function post(o){ try{ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }catch(e){} }

window.XbStatus = function(text, ok){ var el=$('#status'); el.textContent=text; el.className = ok ? 'ok' : ''; };
$('#status').addEventListener('click', function(){ post({t:'menu'}); });

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
  var held = false; for(var k in S.btn){ if(S.btn[k]) held = true; }
  var now = Date.now();
  var live = window.XbRtc && window.XbRtc.ready;
  if(!dirty && !active && !held){
    if(!(live && now-lastSend>1000)) return;
  }
  var s = snapshot();
  if(dirty){
    var names=Object.keys(s.buttons).join(' ');
    dbg.textContent = (names||'-') + (active ? ('  L('+s.axes[0].toFixed(1)+','+s.axes[1].toFixed(1)+') R('+s.axes[2].toFixed(1)+','+s.axes[3].toFixed(1)+')') : '');
  }
  dirty=false;
  if(live){ window.XbRtc.sendState(s); lastSend = now; }
},16);

document.addEventListener('contextmenu',function(e){ e.preventDefault(); });
</script>

<script>
/* ---------- Xbox Remote Play: WebRTC + data channels ----------
   RN app does the HTTP calls (auth, SDP, ICE); this page only does WebRTC.
   Protocol ported from the open-source xbox-xcloud-player. */
window.XbRtc = (function(){
  var api = { ready:false };
  var pc = null, ch = {}, cand = [], seq = 0, kf = null, lastBuzz = 0;
  var VIDEO_KBPS = 0;   // 0 = no limit. Set e.g. 500 to ask for low video bitrate.

  function post(o){ try{ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }catch(e){} }
  function enc(s){ return new TextEncoder().encode(s); }
  function uuid(){
    try{ if(window.crypto && crypto.randomUUID) return crypto.randomUUID(); }catch(e){}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){
      var r=Math.random()*16|0; return (c==='x'?r:(r&3|8)).toString(16); });
  }
  function sendCh(name,data){
    var c = ch[name];
    if(!c || c.readyState !== 'open') return false;
    try{ c.send(typeof data === 'string' ? enc(data) : data); return true; }catch(e){ return false; }
  }

  function codecPrefs(){
    try{
      var caps = RTCRtpReceiver.getCapabilities('video').codecs;
      var t1=[],t2=[],t3=[],t4=[];
      caps.forEach(function(c){
        var m=c.mimeType, f=c.sdpFmtpLine||'';
        if(m.indexOf('H264')>=0){
          if(f.indexOf('profile-level-id=4d')>=0) t1.push(c);
          else if(f.indexOf('profile-level-id=42e')>=0) t2.push(c);
          else if(f.indexOf('profile-level-id=420')>=0) t3.push(c);
        } else if(m.indexOf('ulpfec')>=0||m.indexOf('flexfec')>=0||m.indexOf('VP9')>=0||m.indexOf('VP8')>=0){
          t4.push(c);
        }
      });
      return t1.concat(t2,t3,t4);
    }catch(e){ return []; }
  }

  function setBitrate(sdp,media,br){
    var lines = sdp.split('\n'), line = -1;
    for(var i=0;i<lines.length;i++){ if(lines[i].indexOf('m='+media)===0){ line=i; break; } }
    if(line===-1) return sdp;
    line++;
    while(lines[line].indexOf('i=')===0 || lines[line].indexOf('c=')===0) line++;
    if(lines[line].indexOf('b')===0){ lines[line]='b=AS:'+br+'\r'; return lines.join('\n'); }
    lines.splice(line,0,'b=AS:'+br+'\r');
    return lines.join('\n');
  }
  function tune(sdp){
    try{
      if(VIDEO_KBPS>0) sdp = setBitrate(sdp,'video',VIDEO_KBPS);
      sdp = sdp.replace('useinbandfec=1','useinbandfec=1; stereo=1');
    }catch(e){}
    return sdp;
  }

  function open(name,cfg){
    var c = pc.createDataChannel(name,cfg);
    c.binaryType = 'arraybuffer';
    ch[name] = c;
    c.onopen = function(){ if(name==='message') handshake(); };
    c.onmessage = function(e){ onChannelMessage(name,e); };
    c.onclose = function(){ if(name==='message' && api.ready){ api.ready=false; post({t:'rtc',state:'closed'}); } };
  }

  function handshake(){
    sendCh('message', JSON.stringify({ type:'Handshake', version:'messageV1', id:'be0bfc6d-1e83-4c8a-90ed-fa8601c5a179', cv:'0' }));
  }

  function gen(path,data){
    return JSON.stringify({ type:'Message', content:JSON.stringify(data), id:uuid(), target:path, cv:'' });
  }
  function sendConfig(){
    sendCh('message', gen('/streaming/systemUi/configuration', { version:[0,2,0], systemUis:[] }));
    sendCh('message', gen('/streaming/properties/clientappinstallidchanged', { clientAppInstallId:'c97d7ee0-73b2-4239-bf1d-9d805a338429' }));
    sendCh('message', gen('/streaming/characteristics/orientationchanged', { orientation:0 }));
    sendCh('message', gen('/streaming/characteristics/touchinputenabledchanged', { touchInputEnabled:false }));
    sendCh('message', gen('/streaming/characteristics/clientdevicecapabilities', {}));
    sendCh('message', gen('/streaming/characteristics/dimensionschanged', {
      horizontal:1920, vertical:1080, preferredWidth:1920, preferredHeight:1080,
      safeAreaLeft:0, safeAreaTop:0, safeAreaRight:1920, safeAreaBottom:1080, supportsCustomResolution:true }));
  }

  function gamepadChanged(added){
    sendCh('control', JSON.stringify({ message:'gamepadChanged', gamepadIndex:0, wasAdded:added }));
  }
  function controlAuth(){
    sendCh('control', JSON.stringify({ message:'authorizationRequest', accessKey:'4BDB3609-C1F1-4195-9B37-FEFF45DA8B8E' }));
    gamepadChanged(true);
    gamepadChanged(false);
    setTimeout(function(){ gamepadChanged(true); }, 300);
    if(kf) clearInterval(kf);
    kf = setInterval(function(){
      sendCh('control', JSON.stringify({ message:'videoKeyframeRequested', ifrRequested:true }));
    }, 5000);
  }

  function inputStart(){
    var dv = new DataView(new ArrayBuffer(15));
    dv.setUint16(0, 8, true);            // ClientMetadata
    dv.setUint32(2, 0, true);
    dv.setFloat64(6, performance.now(), true);
    dv.setUint8(14, 1);                  // max touch points
    sendCh('input', dv);
  }

  function afterHandshake(){
    controlAuth();
    inputStart();
    sendConfig();
    api.ready = true;
    post({t:'rtc', state:'ready'});
  }

  function complete(id,data){
    sendCh('message', JSON.stringify({ type:'TransactionComplete', content:JSON.stringify(data), id:id, cv:'' }));
  }

  function onChannelMessage(name,e){
    if(name === 'message'){
      var d = e.data;
      if(typeof d !== 'string'){ try{ d = new TextDecoder().decode(d); }catch(x){ return; } }
      var m; try{ m = JSON.parse(d); }catch(x){ return; }
      if(m.type === 'HandshakeAck'){ afterHandshake(); }
      else if(m.type === 'TransactionStart' || m.type === 'Message'){
        if(m.target === '/streaming/sessionLifetimeManagement/serverInitiatedDisconnect'){
          complete(m.id,''); api.ready=false; post({t:'rtc',state:'closed'});
        } else if(m.target === '/streaming/systemUi/messages/ShowMessageDialog'){
          complete(m.id,{ Result:0 });
        }
      }
    } else if(name === 'input'){
      try{
        var dv = new DataView(e.data);
        if(dv.getUint8(0) === 128){      // rumble report -> vibrate the phone
          var l = dv.getUint8(4), r = dv.getUint8(5);
          var p = Math.max(l,r), now = Date.now();
          if(p > 0 && now-lastBuzz > 80){
            lastBuzz = now;
            var dur = dv.getUint16(8,true);
            post({t:'buzz', ms: Math.min(300, Math.max(20, dur||40))});
          }
        }
      }catch(x){}
    }
  }

  function ax(v){ var n = Math.round(v*32767); return n>32767?32767:(n<-32767?-32767:n); }
  var BITS = { Nexus:2, Menu:4, View:8, A:16, B:32, X:64, Y:128, Up:256, Down:512, Left:1024, Right:2048,
               LB:4096, RB:8192, L3:16384, R3:32768 };

  api.sendState = function(s){
    var c = ch.input;
    if(!c || c.readyState !== 'open') return;
    var mask = 0;
    for(var k in BITS){ if(s.buttons[k]) mask |= BITS[k]; }
    var dv = new DataView(new ArrayBuffer(38));
    seq++;
    dv.setUint16(0, 2, true);               // Gamepad report
    dv.setUint32(2, seq, true);
    dv.setFloat64(6, performance.now(), true);
    dv.setUint8(14, 1);                     // one frame
    dv.setUint8(15, 0);                     // gamepad index
    dv.setUint16(16, mask, true);
    dv.setInt16(18, ax(s.axes[0]), true);   // left X
    dv.setInt16(20, ax(-s.axes[1]), true);  // left Y (up = positive on the wire)
    dv.setInt16(22, ax(s.axes[2]), true);   // right X
    dv.setInt16(24, ax(-s.axes[3]), true);  // right Y
    dv.setUint16(26, s.triggers[0] ? 65535 : 0, true);
    dv.setUint16(28, s.triggers[1] ? 65535 : 0, true);
    dv.setUint32(30, 1, true);
    dv.setUint32(34, 1, false);
    try{ c.send(dv); }catch(e){}
  };

  api.start = function(){
    api.stop();
    cand = []; seq = 0;
    pc = new RTCPeerConnection({});
    pc.addTransceiver('audio', { direction:'sendrecv' });
    var vt = pc.addTransceiver('video', { direction:'recvonly' });
    try{ var pref = codecPrefs(); if(pref.length) vt.setCodecPreferences(pref); }catch(e){}
    pc.onicecandidate = function(e){ if(e.candidate) cand.push(e.candidate); };
    pc.onconnectionstatechange = function(){
      var st = pc.connectionState;
      if(st === 'failed' || st === 'closed' || st === 'disconnected'){ api.ready=false; }
      post({t:'rtc', state: st});
    };
    pc.ontrack = function(){};
    open('chat',    { ordered:true, protocol:'chatV1' });
    open('control', { ordered:true, protocol:'controlV1' });
    open('input',   { ordered:true, protocol:'1.0' });
    open('message', { ordered:true, protocol:'messageV1' });
    pc.createOffer({ offerToReceiveAudio:true, offerToReceiveVideo:true }).then(function(o){
      var offer = { type:o.type, sdp:tune(o.sdp) };
      return pc.setLocalDescription(offer).then(function(){ post({t:'offer', sdp:offer.sdp}); });
    }).catch(function(e){ post({t:'rtcerr', msg:String(e)}); });
  };

  api.setAnswer = function(sdp){
    pc.setRemoteDescription({ type:'answer', sdp:sdp }).catch(function(e){ post({t:'rtcerr', msg:'answer: '+String(e)}); });
  };

  api.sendIce = function(ip){
    var t0 = Date.now();
    (function wait(){
      if(pc.iceGatheringState === 'complete' || Date.now()-t0 > 2500){
        var out = cand.map(function(c){
          var j = c.toJSON();
          if(ip && j.candidate){
            var p = j.candidate.split(' ');
            if(p.length > 4 && /\.local$/.test(p[4])){ p[4] = ip; j.candidate = p.join(' '); }
          }
          return j;
        });
        post({t:'ice', candidates:out});
      } else { setTimeout(wait,100); }
    })();
  };

  api.addIce = function(list){
    (list||[]).forEach(function(c){
      if(!c || !c.candidate || c.candidate === 'a=end-of-candidates') return;
      pc.addIceCandidate({ candidate:c.candidate, sdpMid:c.sdpMid, sdpMLineIndex:c.sdpMLineIndex }).catch(function(){});
    });
  };

  api.stop = function(){
    api.ready = false;
    if(kf){ clearInterval(kf); kf = null; }
    for(var k in ch){ try{ ch[k].close(); }catch(e){} }
    ch = {};
    if(pc){ try{ pc.close(); }catch(e){} pc = null; }
  };

  return api;
})();
</script>
</body>
</html>`;
