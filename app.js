// 喵喵小窩 — app shell
const App = (function(){
  const $ = id => document.getElementById(id);
  const store = { get(k){try{return localStorage.getItem(k)}catch(e){return null}}, set(k,v){try{localStorage.setItem(k,v)}catch(e){}} };
  const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const cfg = window.MEOW_CONFIG || {};
  const { sprite, icon, COLORS, CNAME, palOf } = Pix;

  let B = null;
  const me = { uid:null, name: store.get("mw_name")||"", cat: store.get("mw_cat")||"" };
  let members = [], online = new Set(), messages = [], route = "home", connected = false;
  const games = [];
  const stateCache = {}, stateSubs = {};
  let curGame = null;

  // ---------- helpers ----------
  const partner = () => members.find(m => m.user_id !== me.uid) || null;
  const isOnline = uid => online.has(uid);
  const nameOf = uid => uid===me.uid ? (me.name||"我") : ((members.find(m=>m.user_id===uid)||{}).name || "另一半");
  const catOf = uid => uid===me.uid ? (me.cat||"orange") : ((members.find(m=>m.user_id===uid)||{}).cat || "white");
  const players = () => members.map(m=>m.user_id).sort();
  const clone = o => o==null ? o : JSON.parse(JSON.stringify(o));
  function toast(html, ms=2600){ const t=$("toast"); t.innerHTML=html; t.classList.remove("hidden"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.add("hidden"),ms); }
  const hhmm = d => { const x=new Date(d); return String(x.getHours()).padStart(2,"0")+":"+String(x.getMinutes()).padStart(2,"0"); };
  const dayStr = d => { const x=new Date(d); return `${x.getMonth()+1}/${x.getDate()}`; };

  // ---------- sound (synthesized 8-bit) ----------
  const SFX=(function(){
    let ctx=null, master=null, on = store.get("mw_sfx")!=="0";
    function ensure(){ if(!on) return null; try{ if(!ctx){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return null; ctx=new AC(); master=ctx.createGain(); master.gain.value=.22; master.connect(ctx.destination);} if(ctx.state==="suspended") ctx.resume(); }catch(e){return null} return ctx; }
    function tone(f,dur,o={}){ const c=ensure(); if(!c) return; const t=c.currentTime+(o.delay||0); const osc=c.createOscillator(), g=c.createGain(); osc.type=o.type||"square"; osc.frequency.setValueAtTime(f,t); if(o.to) osc.frequency.exponentialRampToValueAtTime(o.to,t+dur); const v=o.vol??.5; g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(v,t+.008); g.gain.exponentialRampToValueAtTime(.0001,t+dur); let n=osc; if(o.lp){const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=o.lp; osc.connect(lp); n=lp;} n.connect(g); g.connect(master); osc.start(t); osc.stop(t+dur+.02); }
    function meow(p=1,delay=0){ const c=ensure(); if(!c) return; const t=c.currentTime+delay, d=.42; const osc=c.createOscillator(), g=c.createGain(), bp=c.createBiquadFilter(), vib=c.createOscillator(), vg=c.createGain(); osc.type="sawtooth"; bp.type="bandpass"; bp.Q.value=2.2; osc.frequency.setValueAtTime(520*p,t); osc.frequency.linearRampToValueAtTime(820*p,t+.12); osc.frequency.linearRampToValueAtTime(600*p,t+d); bp.frequency.setValueAtTime(900,t); bp.frequency.linearRampToValueAtTime(2200,t+.12); bp.frequency.linearRampToValueAtTime(1000,t+d); vib.frequency.value=7; vg.gain.value=14*p; vib.connect(vg); vg.connect(osc.frequency); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.55,t+.05); g.gain.setValueAtTime(.5,t+.25); g.gain.exponentialRampToValueAtTime(.0001,t+d); osc.connect(bp); bp.connect(g); g.connect(master); osc.start(t); vib.start(t); osc.stop(t+d+.05); vib.stop(t+d+.05); }
    const N={C5:523,E5:659,G5:784,A5:880,C6:1047,E6:1319,G6:1568};
    return { get on(){return on}, toggle(){ on=!on; store.set("mw_sfx",on?"1":"0"); if(on) this.select(); return on; },
      tap(){ const f=900+Math.random()*300; tone(f,.06,{to:f*1.6,vol:.18,lp:3000}); },
      select(){ tone(N.E5,.07,{vol:.3}); tone(N.A5,.1,{vol:.3,delay:.07}); },
      match(){ [N.C5,N.E5,N.G5,N.C6].forEach((f,i)=>tone(f,.13,{vol:.32,delay:i*.09})); tone(N.E6,.25,{vol:.22,delay:.38,type:"triangle"}); tone(N.G6,.3,{vol:.18,delay:.46,type:"triangle"}); },
      miss(){ tone(392,.18,{to:330,vol:.3,type:"triangle"}); tone(330,.32,{to:220,vol:.3,type:"triangle",delay:.2}); },
      next(){ tone(440,.12,{to:1200,vol:.16,lp:2500}); },
      level(){ [N.G5,N.C6,N.E6,N.G6].forEach((f,i)=>tone(f,.16,{vol:.28,delay:i*.12})); meow(1.15,.6); },
      heart(){ tone(N.A5,.09,{vol:.28,type:"triangle"}); tone(N.E6,.16,{vol:.25,type:"triangle",delay:.09}); },
      msg(){ tone(N.E6,.08,{vol:.2,type:"triangle"}); tone(N.C6,.12,{vol:.2,type:"triangle",delay:.08}); },
      place(){ tone(220,.05,{vol:.35,type:"triangle"}); tone(160,.08,{vol:.25,type:"square",lp:800,delay:.02}); },
      key(p){ const base=[1046,1175,1318,1397,1568][(Math.random()*5)|0]*(p||1); tone(base,.035,{vol:.13,type:"square",lp:4000}); tone(base*2,.02,{vol:.05,type:"triangle",delay:.01}); },
      del(){ tone(520,.05,{to:300,vol:.12,type:"square",lp:2000}); },
      send(){ [N.G5,N.C6,N.E6].forEach((f,i)=>tone(f,.07,{vol:.2,delay:i*.05,type:"square",lp:3500})); tone(600,.25,{to:1800,vol:.08,type:"triangle",delay:.05}); },
      combo(){ [N.C6,N.E6,N.G6].forEach((f,i)=>tone(f,.08,{vol:.18,delay:i*.06,type:"triangle"})); },
      meow(p){ meow(p||1); }, join(){ meow(1.05); tone(N.E6,.18,{vol:.15,type:"triangle",delay:.45}); } };
  })();

  // ---------- tap fx + haptics ----------
  const SPARK_COLS=['#f08aa0','#f6c45f','#7cc7a5','#8fc4e8','#c6a8f0','#ffb38a'];
  ICON.sq=["OO","OO"]; ICON.spark=[".O.","OOO",".O."];
  function pawSvg(){ const p=palOf(me.cat||"orange"); return icon("bigpaw",{F:p.Y,O:p.O,P:'#f7a7b8'}); }
  function tapFx(x,y){
    const L=document.createElement("div"); L.style.cssText=`position:fixed;left:${x}px;top:${y}px;width:0;height:0;pointer-events:none;z-index:70`;
    const paw=document.createElement("div"); const rot=(Math.random()*24-12).toFixed(0);
    paw.style.cssText="position:absolute;width:50px;height:50px;left:-25px;top:-25px;filter:drop-shadow(2px 2px 0 rgba(90,59,46,.25))"; paw.innerHTML=pawSvg(); L.appendChild(paw);
    paw.animate([{transform:`rotate(${rot}deg) scale(.2)`},{transform:`rotate(${rot}deg) scale(1.25)`,offset:.25},{transform:`rotate(${rot}deg) scale(.95)`,offset:.45},{transform:`rotate(${rot}deg) scale(1)`,opacity:1,offset:.7},{transform:`rotate(${rot}deg) scale(1) translateY(-6px)`,opacity:0}],{duration:700,easing:"steps(10,end)",fill:"forwards"});
    const ring=document.createElement("div"); ring.style.cssText="position:absolute;left:-6px;top:-6px;width:12px;height:12px;border:3px dashed #f08aa0"; L.appendChild(ring);
    ring.animate([{transform:"scale(.5)",opacity:.9},{transform:"scale(4.2) rotate(45deg)",opacity:0}],{duration:450,easing:"steps(6,end)",fill:"forwards"});
    for(let i=0;i<8;i++){ const a=(Math.PI*2*i/8)+Math.random()*.4, d=44+Math.random()*24; const s=document.createElement("div");
      const k=i%4===0?"heart":i%4===2?"star":(i%2?"spark":"sq"), sz=(k==="heart"||k==="star")?16:10;
      s.style.cssText=`position:absolute;width:${sz}px;height:${sz}px;left:${-sz/2}px;top:${-sz/2}px`;
      s.innerHTML=(k==="heart"||k==="star")?icon(k):icon(k,{O:SPARK_COLS[(Math.random()*6)|0]}); L.appendChild(s);
      const dx=Math.cos(a)*d, dy=Math.sin(a)*d;
      s.animate([{transform:`translate(${dx*.45}px,${dy*.45}px) scale(.4)`,opacity:0},{transform:`translate(${dx*.8}px,${dy*.8}px) scale(1.1)`,opacity:1,offset:.5},{transform:`translate(${dx}px,${dy+14}px) scale(.6)`,opacity:0}],{duration:650+Math.random()*200,easing:"steps(9,end)",fill:"forwards"}); }
    document.body.appendChild(L); setTimeout(()=>L.remove(),1000);
  }
  let hapLabel=null;
  function setupHaptic(){ try{ const inp=document.createElement("input"); inp.type="checkbox"; inp.setAttribute("switch",""); inp.id="hapSw"; const lab=document.createElement("label"); lab.htmlFor="hapSw"; const w=document.createElement("div"); w.setAttribute("aria-hidden","true"); w.style.cssText="position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none"; w.append(inp,lab); document.body.appendChild(w); hapLabel=lab; }catch(e){} }
  function haptic(){ try{ if(typeof navigator.vibrate==="function"){ navigator.vibrate(12); return; } if(hapLabel) hapLabel.click(); }catch(e){} }
  function burst(){ for(let i=0;i<10;i++) setTimeout(()=>{ const d=document.createElement("div"); d.className="float"; d.innerHTML=icon(i%3===0?"fish":i%3===1?"heart":"star"); d.style.left=(8+Math.random()*80)+"vw"; d.style.top=(60+Math.random()*20)+"vh"; document.body.appendChild(d); setTimeout(()=>d.remove(),2300); }, i*80); }
  function floatSvg(svg, left){ const d=document.createElement("div"); d.className="float"; d.innerHTML=svg; d.style.left=(left??(20+Math.random()*60))+"vw"; d.style.top="70vh"; document.body.appendChild(d); setTimeout(()=>d.remove(),2300); }

  // ---------- shared game state (compare-and-swap) ----------
  async function getState(game){
    if(stateCache[game]) return stateCache[game];
    const r = await B.getState(game);
    if(r && (!stateCache[game] || r.version > stateCache[game].version)) stateCache[game] = { version:r.version, state:r.state };
    return stateCache[game] || null;
  }
  function emitState(game){ (stateSubs[game]||[]).forEach(h=>{ try{ h(stateCache[game] ? clone(stateCache[game].state) : null); }catch(e){ console.error(e); } }); if(game==="moqi") renderMeter(); }
  async function update(game, fn){
    for(let i=0;i<6;i++){
      const cur = await getState(game);
      const ns = fn(clone(cur ? cur.state : null));
      if(ns===undefined) return null;
      const v = await B.casState(game, cur ? cur.version : 0, ns);
      if(v){ if(!stateCache[game] || v > stateCache[game].version){ stateCache[game] = { version:v, state:ns }; emitState(game); } return ns; }
      const fresh = await B.getState(game);
      if(fresh) stateCache[game] = { version:fresh.version, state:fresh.state }; else delete stateCache[game];
    }
    toast("同步失敗，請再試一次"); return null;
  }
  function onState(game, h){ (stateSubs[game] = stateSubs[game]||[]).push(h); return ()=>{ stateSubs[game] = stateSubs[game].filter(x=>x!==h); }; }
  async function notifyPartner(text){ const p=partner(); if(!p || isOnline(p.user_id)) return; try{ const row=await B.send(text,"game",me.name,me.cat); addMessage(row); }catch(e){} }

  const ctx = { get me(){return me}, partner, isOnline, nameOf, catOf, players, sprite, icon, SFX, burst, toast, floatSvg, esc,
    getState, update, onState, notifyPartner, back: ()=>go("home") };

  // ---------- header ----------
  let lastHdr="", wasOnline=null;
  function renderHeader(){
    const p = partner(); const here = p && isOnline(p.user_id);
    const k = (me.cat||"orange")+(p?p.cat:"-")+here;
    if(k!==lastHdr){ lastHdr=k;
      $("catMe").innerHTML = sprite(me.cat||"orange","normal");
      $("catThem").innerHTML = p ? sprite(p.cat, here?"normal":"curl") : sprite("white","normal",{soft:true});
    }
    $("nmMe").textContent = me.name||"我";
    $("nmThem").textContent = p ? p.name : "???";
    const st=$("stThem"); st.textContent = !p ? "還沒加入" : here ? "● 在線" : "○ 睡著了"; st.className = "st"+(here?" on":"");
    if(p){ if(wasOnline===false && here){ SFX.join(); toast(`${sprite(p.cat,"wave")} ${esc(p.name)} 上線了！`); } wasOnline = !!here; }
  }

  // ---------- hub ----------
  const LV=[[0,"Lv1 陌生小貓"],[3,"Lv2 開始蹭蹭"],[8,"Lv3 心有靈喵"],[15,"Lv4 默契滿喵"],[25,"Lv5 靈魂貓伴"],[40,"Lv6 宇宙第一喵情侶"]];
  function lvInfo(h){ let i=0; while(i+1<LV.length&&h>=LV[i+1][0]) i++; const n=LV[i+1]; return {name:LV[i][1],cur:LV[i][0],next:n?n[0]:null,nextName:n?n[1]:null}; }
  ctx.lvInfo = lvInfo;
  function renderMeter(){
    const el=$("meter"); if(!el) return;
    const s = stateCache.moqi && stateCache.moqi.state; const h = s ? (s.hearts||0) : 0; const L=lvInfo(h);
    const frac = L.next ? (h-L.cur)/(L.next-L.cur) : 1;
    el.innerHTML = `<div class="top"><div class="lv">${L.name}</div><div class="fish">${icon("fish")}<span>${h}</span></div></div>
      <div class="segs">${[...Array(10)].map((_,i)=>`<i class="${i<Math.round(frac*10)?'f':''}"></i>`).join("")}</div>
      <div class="nx">${L.next?`再收集 ${L.next-h} 條小魚乾 → ${L.nextName}`:"已經是最高等級啦，喵！"}</div>`;
  }
  function viewHome(v){
    const p = partner();
    let html = `<div class="title">喵喵<b>小窩</b></div><div class="box meter" id="meter"></div>`;
    if(!p) html += `<div class="box banner"><span class="bi">${icon("heart")}</span><div style="flex:1">另一半還沒加入！<br>把邀請碼 <b style="font-weight:400;color:var(--pink);letter-spacing:2px">${esc(B.code||"")}</b> 傳給 ta</div><button class="btn" id="bInv">傳邀請</button></div>`;
    if(pushState()!=="on") html += `<div class="box banner"><span class="bi">${icon("bell")}</span><div style="flex:1">開啟通知，ta 傳訊息時手機會跳出來</div><button class="btn mint" id="bPush">開啟</button></div>`;
    html += `<div class="games">` + games.map(g=>`<button class="gcard" data-g="${g.id}"><span class="gi">${g.icon()}</span><span class="gn">${esc(g.name)}</span><span class="gd">${esc(g.desc)}</span>${g.badge&&g.badge()?`<span class="gb">${esc(g.badge())}</span>`:""}</button>`).join("")
      + `<div class="gcard soon"><span class="gi">${sprite("gray","sleep",{soft:true})}</span><span class="gn">新遊戲</span><span class="gd">敬請期待…</span></div></div>`;
    v.innerHTML = html;
    renderMeter();
    v.querySelectorAll("[data-g]").forEach(b=>b.addEventListener("click",()=>go("game-"+b.dataset.g)));
    const bi=$("bInv"); if(bi) bi.addEventListener("click", shareInvite);
    const bp=$("bPush"); if(bp) bp.addEventListener("click", ()=>enablePush().then(()=>render()));
  }

  // ---------- chat ----------
  const STK=["normal","happy","love","surprised","sleep","wave","loaf"];
  const QK = {
    "常用語": ["我愛你 ❤️","想你了","抱抱 🫂","親親 😘","晚安 🌙","早安 ☀️","在幹嘛？","吃飯了嗎？","好想見你","你最棒了！","對不起嘛 🥺","快回我～","我到家了","等等打給你","好喔 👌","哈哈哈哈"],
    "表情": ["❤️","💕","🥰","😘","😍","🥺","😭","😂","🤣","😳","😴","🤗","👍","👌","🙏","🎉","🌙","☀️","🍰","🐱","🐾","🌸","✨","💤"],
    "顏文字": ["ฅ^•ﻌ•^ฅ","(=^･ω･^=)","(つ≧▽≦)つ","(*´∀`)~♥","(´；ω；`)","╰(*°▽°*)╯","(｡･ω･｡)ﾉ♡","(*´з`)","(￣▽￣)ノ","( ˘ω˘ )zzZ","(๑•̀ㅂ•́)و✧","(⁄ ⁄•⁄ω⁄•⁄ ⁄)"],
  };
  let lastSeen = +(store.get("mw_seen")||0);
  const imgCache = {};
  function unread(){ return messages.filter(m=>m.id>lastSeen && m.sender!==me.uid).length; }
  let lastReported = 0;
  function markSeen(){
    const mx=messages.reduce((a,m)=>Math.max(a,m.id),0);
    if(mx>lastSeen){ lastSeen=mx; store.set("mw_seen",String(mx)); }
    renderBadge();
    if(chatVisible() && document.visibilityState==="visible" && mx>lastReported){
      const myRow = members.find(x=>x.user_id===me.uid);
      if(!myRow || (myRow.last_read||0) < mx){ lastReported = mx; B.updateMe({ last_read: mx }).catch(()=>{ lastReported = 0; }); }
    }
  }
  function renderBadge(){ const n=unread(); for(const id of ["badge","fabBadge"]){ const b=$(id); if(!b) continue; b.textContent=n>99?"99+":n; b.classList.toggle("hidden", n===0); } }
  // ---------- chat sheet (chat without leaving a game) ----------
  let sheetOpen = false, lastGame = null;
  function chatVisible(){ return route==="chat" || sheetOpen; }
  function openSheet(){
    if(sheetOpen) return;
    sheetOpen = true; kb = null;
    const sh = document.createElement("div"); sh.id="sheet"; sh.className="sheet";
    sh.innerHTML = `<div class="sheetIn"><div class="sheetHd"><span>${sprite(partner()?partner().cat:"white","happy")}</span><b>${esc(partner()?partner().name:"聊天")}</b><button id="sheetX">收起 ▾</button></div><div class="sheetBody" id="sheetBody"></div></div>`;
    document.body.appendChild(sh);
    sh.addEventListener("click", e=>{ if(e.target===sh) closeSheet(); });
    $("sheetX").addEventListener("click", closeSheet);
    viewChat($("sheetBody"));
    sh.querySelector(".sheetIn").animate([{transform:"translateY(100%)"},{transform:"translateY(-8px)",offset:.75},{transform:"translateY(0)"}],{duration:320,easing:"ease-out"});
    const f=$("fab"); if(f) f.classList.add("hidden");
  }
  function closeSheet(){
    if(!sheetOpen) return;
    sheetOpen = false; kb = null; document.body.classList.remove("kbd");
    const sh=$("sheet"); if(sh){ const a=sh.querySelector(".sheetIn").animate([{transform:"translateY(0)"},{transform:"translateY(100%)"}],{duration:200,easing:"ease-in"}); a.onfinish=()=>sh.remove(); }
    const f=$("fab"); if(f) f.classList.remove("hidden");
    renderBadge();
  }
  function msgHtml(m){
    const mine = m.sender===me.uid;
    if(m.kind==="game") return `<div class="msg sys"><div class="bub">🎮 ${esc(m.body)}</div></div>`;
    const av = `<span class="av">${sprite(m.cat||catOf(m.sender), m.kind==="poke"?"wave":"normal")}</span>`;
    let bub;
    if(m.kind==="sticker") bub = `<span class="stk">${m.body==="heart"?icon("heart"):sprite(m.cat||"orange", STK.includes(m.body)?m.body:"normal")}</span>`;
    else if(m.kind==="image") bub = `<span class="pic"><img data-media="${esc(m.media||"")}" ${imgCache[m.media]?`src="${esc(imgCache[m.media])}"`:""} alt="照片"></span>`;
    else if(m.kind==="poke") bub = `<div class="bub">戳了${mine?"對方":"你"}一下 🐾</div>`;
    else bub = `<div class="bub">${esc(m.body)}</div>`;
    const p = partner(); const read = mine && p && (p.last_read||0) >= m.id;
    return `<div class="msg ${mine?"me":""} ${m.kind==="poke"?"poke":""}">${mine?"":av}${bub}<span class="tm">${read?`<span class="rd">已讀</span>`:""}${hhmm(m.created_at)}</span></div>`;
  }
  let kb = null;
  function viewChat(v){
    v.innerHTML = `<div class="box chat"><div class="list" id="list"></div>
      <div class="stickers hidden" id="stk">${STK.map(s=>`<button data-s="${s}">${sprite(me.cat||"orange",s)}</button>`).join("")}<button data-s="poke" title="戳一下">${icon("paw")}</button></div>
      <div class="combo hidden" id="combo"></div>
      <div class="bar"><button id="bStk" title="貼圖">${sprite(me.cat||"orange","happy")}</button><button id="bPic" title="照片">${icon("camera")}</button>
      <textarea id="txt" placeholder="點這裡打字…" maxlength="1000" readonly inputmode="none"></textarea><button class="send" id="bSend">傳送</button></div>
      <div id="kbd" class="hidden"></div>
      <input type="file" id="fPic" accept="image/*" class="hidden"></div>`;
    drawList(true);
    const txt=$("txt"); let sysKb = false;
    const autoSize = () => { txt.style.height="44px"; txt.style.height=Math.min(110,txt.scrollHeight)+"px"; };
    const showKb = (on) => {
      $("kbd").classList.toggle("hidden", !on); document.body.classList.toggle("kbd", on);
      if(on){ $("stk").classList.add("hidden"); if(!kb) kb = IME.mount($("kbd"), { dictUrl:"zhuyin.txt", mascot: sprite(me.cat||"orange","loaf"), anim: ()=>store.get("mw_anim")||"jelly", art: kbArt(), phrases: QK["常用語"].concat(QK["顏文字"]), emojis: QK["表情"],
        commit: t => { txt.value = (txt.value + t).slice(0,1000); autoSize(); },
        backspace: () => { const arr=[...txt.value]; arr.pop(); txt.value = arr.join(""); autoSize(); },
        send: () => sendText(), toSys: () => toSys(), hide: () => showKb(false),
        fx: (k,n) => { if(k==="del") typeFx("del"); else if(k==="pick"){ SFX.select(); typeFx("key", n||1); } else typeFx("key", n||1); } });
        const L=$("list"); setTimeout(()=>{ L.scrollTop=L.scrollHeight; }, 50); }
    };
    function toSys(){ return toSys_(); }
    const toSys_ = () => { sysKb=true; showKb(false); txt.readOnly=false; txt.removeAttribute("inputmode"); txt.placeholder="手機鍵盤模式"; txt.focus(); $("bKb").classList.remove("hidden"); };
    const toMeow = () => { sysKb=false; txt.readOnly=true; txt.setAttribute("inputmode","none"); txt.placeholder="點這裡打字…"; txt.blur(); $("bKb").classList.add("hidden"); showKb(true); };
    txt.insertAdjacentHTML("beforebegin", `<button id="bKb" class="hidden" title="喵喵鍵盤">${icon("keys")}</button>`);
    $("bKb").addEventListener("click", toMeow);
    txt.addEventListener("click", ()=>{ if(!sysKb) showKb(true); });
    $("bSend").addEventListener("click", ()=>{ if(kb && kb.composing()) kb.flush(); sendText(); });
    txt.addEventListener("input", e=>{ if(!sysKb) return; autoSize(); if(e.inputType && e.inputType.startsWith("delete")) typeFx("del"); else typeFx("key"); });
    txt.addEventListener("keydown", e=>{ if(sysKb && e.key==="Enter" && !e.shiftKey && !e.isComposing && e.keyCode!==229){ e.preventDefault(); sendText(); } });
    $("bStk").addEventListener("click", ()=>{ showKb(false); $("stk").classList.toggle("hidden"); });
    $("bPic").addEventListener("click", ()=>$("fPic").click());
    $("fPic").addEventListener("change", e=>{ const f=e.target.files&&e.target.files[0]; e.target.value=""; if(f) sendPhoto(f); });
    $("stk").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{ if(b.dataset.s==="poke"){ sendMsg("poke","poke"); SFX.meow(); } else sendMsg(b.dataset.s,"sticker"); $("stk").classList.add("hidden"); }));
    $("list").addEventListener("click", e=>{ const im=e.target.closest(".pic img"); if(im && im.src){ viewPhoto(im.src); return; } showKb(false); });
    ctx._toSys = toSys;
    markSeen();
  }
  function insertText(t){ const x=$("txt"); x.value = (x.value + t).slice(0,1000); typeFx("key", [...t].length); }
  function keyPop(btn){ btn.animate([{transform:"translate(2px,2px) scale(.92)"},{transform:"translate(0,0) scale(1.06)"},{transform:"none"}],{duration:180,easing:"steps(3,end)"}); }
  // typing sound + effects
  let combo = 0, comboT = null;
  const TYPE_ICONS = ["heart","star","spark","paw","fish","sq"];
  function typeFx(kind, n=1){
    if(kind==="del"){ SFX.del(); combo=Math.max(0,combo-1); showCombo(); return; }
    SFX.key(); haptic();
    const bar = document.querySelector(".chat .bar"); if(!bar) return;
    const r = bar.getBoundingClientRect(), t=$("txt").getBoundingClientRect();
    for(let i=0;i<Math.min(n,4);i++){
      const d=document.createElement("div"); const k=TYPE_ICONS[(Math.random()*TYPE_ICONS.length)|0];
      const sz = k==="spark"||k==="sq" ? 10 : 18;
      d.style.cssText=`position:fixed;left:${t.left+20+Math.random()*(t.width-40)}px;top:${r.top-4}px;width:${sz}px;height:${sz}px;pointer-events:none;z-index:45`;
      d.innerHTML = (k==="spark"||k==="sq") ? icon(k,{O:SPARK_COLS[(Math.random()*6)|0]}) : icon(k);
      document.body.appendChild(d);
      const dx=(Math.random()-.5)*60, dy=-50-Math.random()*60;
      d.animate([{transform:"translate(0,0) scale(.3)",opacity:0},{transform:`translate(${dx*.5}px,${dy*.6}px) scale(1.15)`,opacity:1,offset:.35},{transform:`translate(${dx}px,${dy}px) scale(.7)`,opacity:0}],{duration:700,easing:"steps(8,end)",fill:"forwards"});
      setTimeout(()=>d.remove(),750);
    }
    combo += n; showCombo();
    if(combo>0 && combo%10===0){ SFX.combo(); const c=document.createElement("div"); c.className="float"; c.style.cssText+=`;left:${t.left+t.width/2-22}px;top:${r.top-50}px`; c.innerHTML=sprite(me.cat||"orange", combo%20===0?"love":"happy"); document.body.appendChild(c); setTimeout(()=>c.remove(),2300); }
  }
  function showCombo(){
    const c=$("combo"); if(!c) return;
    clearTimeout(comboT);
    if(combo<3){ c.classList.add("hidden"); }
    else { c.classList.remove("hidden"); c.innerHTML=`${icon("star")}<b>${combo}</b> 連擊！`; c.animate([{transform:"scale(1.3)"},{transform:"scale(1)"}],{duration:160,easing:"steps(2,end)"}); }
    comboT=setTimeout(()=>{ combo=0; c.classList.add("hidden"); },1600);
  }
  async function sendText(){
    const txt=$("txt"); const t=txt.value.trim(); if(!t) return;
    txt.value=""; txt.style.height="44px"; combo=0; showCombo();
    SFX.send(); sendFx();
    await sendMsg(t,"text");
  }
  function sendFx(){
    const b=$("bSend").getBoundingClientRect();
    for(let i=0;i<6;i++){ const d=document.createElement("div"); d.style.cssText=`position:fixed;left:${b.left+b.width/2-9}px;top:${b.top}px;width:18px;height:18px;pointer-events:none;z-index:45`; d.innerHTML=icon(i%2?"heart":"star"); document.body.appendChild(d);
      const dx=-30-Math.random()*120, dy=-80-Math.random()*120;
      d.animate([{transform:"translate(0,0) scale(.5)"},{transform:`translate(${dx}px,${dy}px) scale(1.2)`,opacity:1,offset:.6},{transform:`translate(${dx*1.2}px,${dy*1.3}px) scale(.5)`,opacity:0}],{duration:650,easing:"steps(8,end)",fill:"forwards"}); setTimeout(()=>d.remove(),700); }
  }
  function fillImages(){
    document.querySelectorAll(".pic img[data-media]").forEach(async im=>{
      const pth=im.dataset.media; if(!pth || im.getAttribute("src")) return;
      try{ if(!imgCache[pth]) imgCache[pth]=await B.imageUrl(pth); im.src=imgCache[pth]; }catch(e){ im.alt="照片載入失敗"; }
    });
  }
  function drawList(force){
    const L=$("list"); if(!L) return;
    const atBottom = force || (L.scrollHeight - L.scrollTop - L.clientHeight < 80);
    let html="", lastDay="";
    if(!messages.length) html = `<div class="day">還沒有訊息，先打個招呼吧 🐾</div>`;
    messages.forEach(m=>{ const d=dayStr(m.created_at); if(d!==lastDay){ html+=`<div class="day">${d}</div>`; lastDay=d; } html+=msgHtml(m); });
    L.innerHTML=html;
    L.querySelectorAll(".pic img").forEach(im=>im.addEventListener("load",()=>{ if(atBottom) L.scrollTop=L.scrollHeight; }));
    fillImages();
    if(atBottom) L.scrollTop=L.scrollHeight;
  }
  async function shrink(file){
    if(file.type==="image/gif" && file.size<6e6) return file;
    const url=URL.createObjectURL(file);
    try{
      const img=await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
      const max=1440, sc=Math.min(1, max/Math.max(img.naturalWidth,img.naturalHeight));
      const c=document.createElement("canvas"); c.width=Math.round(img.naturalWidth*sc); c.height=Math.round(img.naturalHeight*sc);
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      return await new Promise(r=>c.toBlob(r,"image/jpeg",.82));
    } finally { URL.revokeObjectURL(url); }
  }
  async function sendPhoto(file){
    if(!file.type.startsWith("image/")){ toast("只能傳圖片喔"); return; }
    toast(`${sprite(me.cat||"orange","happy")} 照片傳送中…`, 20000);
    try{
      const blob = await shrink(file);
      const path = await B.uploadImage(blob);
      imgCache[path] = URL.createObjectURL(blob);
      const row = await B.send("傳了一張照片 📷","image",me.name,me.cat,path);
      addMessage(row); SFX.send(); toast(`${sprite(me.cat||"orange","wave")} 照片傳出去了！`);
    }catch(e){ console.error(e); toast("照片傳送失敗："+esc(e.message||e), 5000); }
  }
  function viewPhoto(src){
    const o=document.createElement("div"); o.className="viewer"; o.innerHTML=`<img src="${esc(src)}" alt="照片"><div class="vx">點一下關閉</div>`;
    o.addEventListener("click",()=>o.remove()); document.body.appendChild(o);
  }
  async function sendMsg(body, kind){
    try{ const row = await B.send(body, kind, me.name, me.cat); addMessage(row); }
    catch(e){ toast("傳送失敗，請檢查網路"); }
  }
  function addMessage(m){
    if(!m || messages.some(x=>x.id===m.id)) return;
    messages.push(m); messages.sort((a,b)=>a.id-b.id); if(messages.length>300) messages=messages.slice(-300);
    if(chatVisible()){ drawList(false); markSeen(); }
    else renderBadge();
    if(m.sender!==me.uid){
      if(m.kind==="poke"){ SFX.meow(1.12); haptic(); floatSvg(sprite(m.cat||"white","wave")); }
      else if(m.kind==="sticker"){ SFX.heart(); }
      else SFX.msg();
      if(!chatVisible() && m.kind!=="game"){
        const txt = m.kind==="poke"?"戳了你一下 🐾":m.kind==="sticker"?"傳了一張貼圖":m.kind==="image"?"傳了一張照片 📷":m.body;
        toast(`${sprite(m.cat||"white","happy")}<span><b style="font-weight:400">${esc(m.name||"另一半")}</b>：${esc(txt.slice(0,40))}</span>`);
      }
    }
  }

  // ---------- keyboard look ----------
  const KB_THEMES = [["strawberry","草莓牛奶","#fff0f3","#f28ba3"],["milktea","奶茶","#f3e6d8","#b98560"],["mint","薄荷","#e6f5ee","#6cc49d"],["lavender","薰衣草","#f0ecfb","#a58be8"],["night","夜空","#2e3150","#ffc94d"],
    ["peach","蜜桃","#ffeee4","#ff9f7a"],["sky","天空藍","#e8f3fd","#7fb5ee"],["cream","奶油","#fbf6ec","#5a3b2e"],["tuxedo","黑白賓士貓","#ececec","#222222"],["matcha","抹茶","#eef2df","#93ad55"]];
  const KB_ANIMS = [["jelly","果凍彈跳"],["paw","貓掌蓋章"],["hearts","愛心爆炸"],["jump","跳跳落地"],["spin","旋轉星星"],["peek","貓咪探頭"],["ripple","波紋擴散"]];
  function applyKbTheme(){ document.body.dataset.kb = store.get("mw_kb") || "strawberry"; }
  function kbArt(){ const p=palOf(me.cat||"orange"); return { paw: icon("bigpaw",{F:p.Y,O:p.O,P:'#f7a7b8'}), heart: icon("heart"), star: icon("star"), cat: sprite(me.cat||"orange","happy") }; }

  // ---------- settings ----------
  function viewSettings(v){
    const ps=pushState();
    v.innerHTML = `<div class="box set"><h2>我的貓</h2><div class="picks" id="pk"></div><input id="nm" maxlength="10" value="${esc(me.name)}" style="font-size:17px;padding:8px;border:3px solid var(--line);text-align:center;border-radius:0"><button class="btn" id="bSave">儲存</button></div>
      <div class="box set"><h2>鍵盤配色</h2><div class="themes" id="thm">${KB_THEMES.map(([id,n,bg,ac])=>`<button data-t="${id}" class="${(store.get("mw_kb")||"strawberry")===id?"on":""}"><span class="sw" style="background:${bg}"><i style="background:${ac}"></i><i></i><i></i></span>${n}</button>`).join("")}</div>
        <h2 style="margin-top:8px">打字動畫</h2><div class="anims" id="anm">${KB_ANIMS.map(([id,n])=>`<button data-a="${id}" class="${(store.get("mw_anim")||"jelly")===id?"on":""}">${n}</button>`).join("")}</div>
        <div class="k">點一下可以預覽，只會改變你自己的手機。</div></div>
      <div class="box set"><h2>通知</h2><div class="k">${ps==="on"?"✅ 已開啟：ta 傳訊息時你的手機會跳通知":ps==="denied"?"❌ 通知被封鎖了，請到手機的瀏覽器設定裡允許通知":ps==="ios-home"?"📱 iPhone 要先把這個網頁「加入主畫面」，從主畫面圖示打開後才能開通知":ps==="unsupported"?"這個瀏覽器不支援通知，請用 Chrome（Android）或 Safari 加入主畫面（iPhone）":"還沒開啟"}</div>
        ${ps!=="on"&&ps!=="unsupported"&&ps!=="ios-home"?`<button class="btn mint" id="bPush2">開啟通知</button>`:""}${ps==="on"?`<button class="btn sub" id="bTest">傳一則測試訊息給 ta</button>`:""}</div>
      <div class="box set"><h2>邀請碼</h2><div class="code" style="text-align:center">${esc(B.code||"")}</div><div class="k">另一半打開網址後輸入這組碼就能加入。換手機時，用同一個名字再輸入一次即可。</div><button class="btn sub" id="bInv2">傳邀請連結</button></div>
      <div class="box set"><h2>其他</h2><div class="row" style="justify-content:flex-start"><button class="btn sub" id="bSnd">${SFX.on?"♪ 音效 開":"♪ 音效 關"}</button><button class="btn sub" id="bReload">重新整理</button></div>
        <div class="help">📱 <b style="font-weight:400">加入主畫面</b><br>Android（Chrome）：右上角「⋮」→「加到主畫面」<br>iPhone（Safari）：下方分享按鈕 →「加入主畫面」</div></div>`;
    let pick = me.cat||"orange";
    const drawPk=()=>{ $("pk").innerHTML=COLORS.map(c=>`<button class="${c===pick?"on":""}" data-c="${c}">${sprite(c,"normal")}</button>`).join(""); $("pk").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{pick=b.dataset.c;drawPk();})); };
    drawPk();
    $("bSave").addEventListener("click", async()=>{ const n=$("nm").value.trim().slice(0,10); if(!n) return; me.name=n; me.cat=pick; store.set("mw_name",n); store.set("mw_cat",pick); try{ await B.updateMe({name:n,cat:pick}); }catch(e){} B.track({name:n,cat:pick}); lastHdr=""; renderHeader(); toast(`${sprite(pick,"wave")} 已儲存！`); });
    const b2=$("bPush2"); if(b2) b2.addEventListener("click", ()=>enablePush().then(()=>render()));
    const bt=$("bTest"); if(bt) bt.addEventListener("click", ()=>{ sendMsg("（測試通知）喵～收到了嗎？","text"); toast("已送出，看看 ta 的手機有沒有跳通知"); });
    $("bInv2").addEventListener("click", shareInvite);
    $("thm").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{ store.set("mw_kb",b.dataset.t); applyKbTheme(); $("thm").querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b)); SFX.select(); }));
    $("anm").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{ store.set("mw_anim",b.dataset.a); $("anm").querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b)); SFX.key(); previewAnim(b); }));
    $("bSnd").addEventListener("click", e=>{ SFX.toggle(); e.target.textContent = SFX.on?"♪ 音效 開":"♪ 音效 關"; });
    $("bReload").addEventListener("click", ()=>location.reload());
  }
  function previewAnim(btn){
    // play the chosen animation on a little demo keyboard key
    let host = document.getElementById("animDemo");
    if(!host){ host=document.createElement("div"); host.id="animDemo"; btn.closest(".set").appendChild(host); }
    host.innerHTML=""; const k = IME.mount(host, { dictUrl:"zhuyin.txt", anim: ()=>store.get("mw_anim")||"jelly", art: kbArt(), phrases:[], emojis:[], commit(){}, backspace(){}, send(){}, fx(){ SFX.key(); } });
    const key = host.querySelector('.k[data-k="ㄇ"]'); if(key){ setTimeout(()=>key.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true})), 60); }
  }
  async function shareInvite(){
    const url = location.origin + location.pathname + "?join=" + encodeURIComponent(B.code||"");
    const text = `來我們的喵喵小窩玩 🐾 邀請碼：${B.code}\n${url}`;
    try{ if(navigator.share){ await navigator.share({ title:"喵喵小窩", text, url }); return; } }catch(e){ if(e && e.name==="AbortError") return; }
    try{ await navigator.clipboard.writeText(text); toast("邀請連結已複製，貼給 ta 吧！"); }catch(e){ toast("邀請碼："+esc(B.code||""), 6000); }
  }

  // ---------- push notifications ----------
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone===true;
  function pushState(){
    if(!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return isIOS && !standalone ? "ios-home" : "unsupported";
    if(Notification.permission==="denied") return "denied";
    if(Notification.permission==="granted" && store.get("mw_push")==="1") return "on";
    return "off";
  }
  function b64u(s){ const p="=".repeat((4-s.length%4)%4); const b=(s+p).replace(/-/g,"+").replace(/_/g,"/"); const raw=atob(b); return Uint8Array.from([...raw].map(c=>c.charCodeAt(0))); }
  async function subscribePush(){
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if(!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey: b64u(cfg.VAPID_PUBLIC_KEY) });
    await B.savePush(sub.toJSON());
    store.set("mw_push","1");
  }
  async function enablePush(){
    const st=pushState();
    if(st==="ios-home"){ toast("iPhone 請先「加入主畫面」，再從主畫面打開喔", 5000); return; }
    if(st==="unsupported"){ toast("這個瀏覽器不支援通知", 4000); return; }
    try{
      const perm = await Notification.requestPermission();
      if(perm!=="granted"){ toast("沒有允許通知，之後可以在設定裡再開"); return; }
      await subscribePush();
      toast(`${icon("bell")} 通知開好了！`);
    }catch(e){ console.error(e); toast("開啟通知失敗："+esc(e.message||e), 5000); }
  }

  // ---------- routing ----------
  function go(r){ if(location.hash!=="#"+r) location.hash=r; else render(); }
  function render(){
    const r = (location.hash||"#home").slice(1) || "home";
    if(curGame && curGame.unmount){ try{ curGame.unmount(); }catch(e){} } curGame=null; closeSheet(); kb=null; document.body.classList.remove("kbd"); const ofab=$("fab"); if(ofab) ofab.remove();
    route = r.startsWith("game-") ? "game" : r;
    document.body.classList.toggle("compact", route!=="home");
    document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on", b.dataset.go===route || (route==="game"&&b.dataset.go==="home")));
    const v=$("view");
    if(route==="chat") viewChat(v);
    else if(route==="settings") viewSettings(v);
    else if(route==="game"){
      const g = games.find(x=>x.id===r.slice(5));
      if(!g){ go("home"); return; }
      v.innerHTML = `<div class="gtop"><button class="btn sub" id="bBack">◀ 回小窩</button><span class="gname">${esc(g.name)}</span></div><div id="gArea"></div>`;
      $("bBack").addEventListener("click", ()=>go("home"));
      curGame = g; lastGame = r; g.mount($("gArea"), ctx);
      const fab=document.createElement("button"); fab.id="fab"; fab.className="fab"; fab.innerHTML=`${icon("chat")}<b id="fabBadge" class="hidden">0</b>`; fab.addEventListener("click", openSheet); document.body.appendChild(fab);
    } else { if(r==="home") lastGame = null; viewHome(v); }
    renderHeader(); renderBadge();
    window.scrollTo(0,0);
  }

  // ---------- onboarding ----------
  function onboarding(prefCode, errMsg){
    $("nav").classList.add("hidden"); $("top").classList.add("hidden");
    let pick = me.cat||"orange";
    const v=$("view");
    v.innerHTML = `<div class="title" style="margin-top:8px">喵喵<b>小窩</b></div>
      <div class="box form"><div class="preview" id="pv"></div><div>選一隻代表你的貓</div><div class="picks" id="pk"></div>
      <input id="nm" maxlength="10" placeholder="你的暱稱，例如：小橘" value="${esc(me.name)}">
      ${prefCode?`<div>你收到的邀請碼</div><input id="cd" maxlength="6" value="${esc(prefCode)}" style="letter-spacing:6px;text-transform:uppercase"><button class="btn" id="bJoin">加入小窩</button>`:
      `<button class="btn" id="bCreate">建立我們的小窩</button><button class="btn sub" id="bHave" style="width:100%">我有邀請碼</button>
       <div id="joinBox" class="hidden" style="display:flex;flex-direction:column;gap:10px"><input id="cd" maxlength="6" placeholder="輸入 6 碼邀請碼" style="letter-spacing:6px;text-transform:uppercase"><button class="btn" id="bJoin">加入小窩</button></div>`}
      <div class="err" id="err">${esc(errMsg||"")}</div></div>`;
    const drawPk=()=>{ $("pv").innerHTML=sprite(pick,"wave"); $("pk").innerHTML=COLORS.map(c=>`<button class="${c===pick?"on":""}" data-c="${c}">${sprite(c,"normal")}</button>`).join(""); $("pk").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{pick=b.dataset.c;drawPk();})); };
    drawPk();
    const getName=()=>{ const n=$("nm").value.trim().slice(0,10); if(!n){ $("err").textContent="先取個暱稱吧～"; $("nm").focus(); return null; } return n; };
    const save=(n)=>{ me.name=n; me.cat=pick; store.set("mw_name",n); store.set("mw_cat",pick); };
    const bc=$("bCreate"); if(bc) bc.addEventListener("click", async()=>{ const n=getName(); if(!n) return; bc.disabled=true; try{ save(n); await B.createCouple(n,pick); await enterNest(true); }catch(e){ bc.disabled=false; $("err").textContent="建立失敗："+(e.message||e); } });
    const bh=$("bHave"); if(bh) bh.addEventListener("click", ()=>{ $("joinBox").classList.remove("hidden"); bh.classList.add("hidden"); $("cd").focus(); });
    const bj=$("bJoin"); if(bj) bj.addEventListener("click", async()=>{ const n=getName(); if(!n) return; const c=$("cd").value.trim().toUpperCase(); if(c.length!==6){ $("err").textContent="邀請碼是 6 碼喔"; return; } bj.disabled=true;
      try{ save(n); await B.joinCouple(c,n,pick); history.replaceState(null,"",location.pathname+"#home"); await enterNest(false); }
      catch(e){ bj.disabled=false; const m=String(e.message||e); $("err").textContent = m.includes("code_not_found")?"找不到這個邀請碼，再確認一下":m.includes("full")?"這個小窩已經有兩個人了；如果是換手機，請用原本的名字加入":"加入失敗："+m; } });
  }

  // ---------- enter the nest ----------
  async function enterNest(justCreated){
    $("top").classList.remove("hidden"); $("nav").classList.remove("hidden");
    B.on("msg", addMessage);
    B.on("members", async()=>{ members = await B.members(); renderHeader(); if(route==="home") render(); else if(chatVisible()) drawList(false); });
    B.on("state", (game, version, state)=>{ if(!stateCache[game] || version > stateCache[game].version){ stateCache[game]={version,state}; emitState(game); } });
    B.on("presence", list=>{ online = new Set(list.map(x=>x.uid)); renderHeader(); (ctx._presence||[]).forEach(h=>h()); });
    B.on("status", s=>{ connected = s==="SUBSCRIBED"; if(s==="SUBSCRIBED") resync(); });
    members = await B.members();
    const mine = members.find(m=>m.user_id===me.uid); if(mine){ if(!me.name) me.name=mine.name; if(!me.cat) me.cat=mine.cat; }
    try{ messages = await B.messages(); }catch(e){ messages=[]; }
    await getState("moqi").catch(()=>{});
    B.track({ name: me.name, cat: me.cat });
    B.connect();
    if(justCreated) location.hash="settings"; else if(!location.hash || location.hash==="#") location.hash="home";
    render();
    if(justCreated) setTimeout(()=>toast(`${sprite(me.cat,"wave")} 小窩建好了！把邀請碼傳給另一半吧`, 5000), 300);
    if(pushState()==="on") subscribePush().catch(()=>{});
    clearNotifs();
  }
  async function resync(){
    try{ const ms = await B.messages(); ms.forEach(addMessage); }catch(e){}
    for(const g of Object.keys(stateSubs)){ try{ const r=await B.getState(g); if(r && (!stateCache[g] || r.version>stateCache[g].version)){ stateCache[g]={version:r.version,state:r.state}; emitState(g); } }catch(e){} }
    try{ members = await B.members(); renderHeader(); }catch(e){}
  }
  ctx.onPresence = h => { (ctx._presence = ctx._presence||[]).push(h); return ()=>{ ctx._presence = ctx._presence.filter(x=>x!==h); }; };

  // ---------- start ----------
  async function start(){
    setupHaptic(); applyKbTheme();
    document.addEventListener("pointerdown", e=>{ if(e.button>0) return; tapFx(e.clientX,e.clientY); haptic(); SFX.tap(); }, {passive:true});
    $("midHeart").innerHTML = icon("heart");
    $("niHome").innerHTML = icon("home"); $("niChat").innerHTML = icon("chat"); $("niSet").innerHTML = icon("gear");
    $("decos").innerHTML = [["orange","loaf","left:-8px;top:140px"],["gray","curl","right:-6px;top:340px"],["calico","normal","left:-10px;bottom:150px"],["black","happy","right:-8px;bottom:90px"]].map(([c,k,p])=>`<div class="deco" style="${p}">${sprite(c,k,{soft:true})}</div>`).join("");
    document.querySelectorAll("#nav button").forEach(b=>b.addEventListener("click",()=>{ const t=b.dataset.go; if(t==="home" && route!=="game" && lastGame) go(lastGame); else go(t); }));
    window.addEventListener("hashchange", ()=>{ if(B && B.coupleId) render(); });
    document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState==="visible" && B && B.coupleId){ B.reconnect(); clearNotifs(); if(chatVisible()) markSeen(); } });
    if("serviceWorker" in navigator && !window.__mock){ navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(r=>r.update()).catch(()=>{}); navigator.serviceWorker.addEventListener("message", e=>{ if(e.data && e.data.go) go(e.data.go); }); }
    if(!cfg.SUPABASE_URL && !window.__mock){ $("view").innerHTML = `<div class="box form"><h2>還沒設定好</h2><div class="help">config.js 裡還沒有填 Supabase 的網址和金鑰。</div></div>`; $("top").classList.add("hidden"); return; }
    $("view").innerHTML = `<div class="box form"><div class="preview">${sprite("orange","loaf")}</div>喵～載入中…</div>`;
    try{
      B = makeBackend(cfg);
      me.uid = await B.init();
      const code = new URLSearchParams(location.search).get("join");
      const mem = await B.membership();
      if(mem && (!code || code.toUpperCase()===mem.code)){ me.name = me.name||mem.name; me.cat = me.cat||mem.cat; await enterNest(false); }
      else onboarding(code||"");
    }catch(e){
      console.error(e);
      $("view").innerHTML = `<div class="box form"><div class="preview">${sprite("orange","surprised")}</div><h2>連不上小窩</h2><div class="err">${esc(e.message||e)}</div><button class="btn" onclick="location.reload()">再試一次</button></div>`;
    }
  }

  function clearNotifs(){ try{ if(navigator.serviceWorker) navigator.serviceWorker.ready.then(r=>r.getNotifications()).then(ns=>ns.forEach(n=>n.close())).catch(()=>{}); }catch(e){} }
  function registerGame(g){ games.push(g); }
  return { start, registerGame, ctx };
})();
