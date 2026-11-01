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
      boom(big){ const c=ensure(); if(!c) return; const t=c.currentTime, d=big?.7:.45; const buf=c.createBuffer(1, c.sampleRate*d, c.sampleRate), ch=buf.getChannelData(0); for(let i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*Math.pow(1-i/ch.length, 2.2); const src=c.createBufferSource(); src.buffer=buf; const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.setValueAtTime(big?1800:1200,t); lp.frequency.exponentialRampToValueAtTime(120,t+d); const g=c.createGain(); g.gain.value=big?.9:.6; src.connect(lp); lp.connect(g); g.connect(master); src.start(t); tone(big?90:120,d*.8,{to:40,vol:.5,type:"sine"}); },
      shoot(){ tone(300,.18,{to:900,vol:.18,type:"sawtooth",lp:2000}); tone(180,.12,{to:80,vol:.3,type:"square",lp:600}); },
      hit(){ tone(160,.12,{to:70,vol:.4,type:"square",lp:900}); tone(900,.05,{vol:.15,type:"square",delay:.01}); },
      block(){ tone(1400,.06,{vol:.18,type:"square"}); tone(700,.1,{vol:.15,type:"triangle",delay:.03}); },
      charge(){ tone(300,.35,{to:1200,vol:.14,type:"triangle"}); },
      beep(hi){ tone(hi?1320:660,.09,{vol:.22,type:"square"}); },
      bang(){ this.boom(false); tone(1800,.04,{vol:.2,type:"square"}); },
      splash(){ const c=ensure(); if(!c) return; const t=c.currentTime; const buf=c.createBuffer(1,c.sampleRate*.4,c.sampleRate), ch=buf.getChannelData(0); for(let i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*Math.pow(1-i/ch.length,1.5); const src=c.createBufferSource(); src.buffer=buf; const bp=c.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=1800; bp.Q.value=.8; const g=c.createGain(); g.gain.value=.35; src.connect(bp); bp.connect(g); g.connect(master); src.start(t); },
      jump(){ tone(420,.12,{to:900,vol:.16,type:"square",lp:2500}); },
      coin(){ tone(1568,.06,{vol:.16,type:"square"}); tone(2093,.12,{vol:.14,type:"square",delay:.06}); },
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
    const k = (me.cat||"orange")+(p?p.cat:"-")+here+JSON.stringify(moodSt&&moodSt.moods||{})+JSON.stringify(moodSt&&moodSt.status||{});
    if(k!==lastHdr){ lastHdr=k;
      $("catMe").innerHTML = sprite(me.cat||"orange", moodFace(me.uid,"normal"));
      $("catThem").innerHTML = p ? sprite(p.cat, moodFace(p.user_id, here?"normal":"curl")) : sprite("white","normal",{soft:true});
    }
    $("nmMe").textContent = me.name||"我";
    $("nmThem").textContent = p ? p.name : "???";
    const pm = p && moodOf(p.user_id), mm = moodOf(me.uid);
    const st=$("stThem"); const ps = p && statusOf(p.user_id);
    st.textContent = (!p ? "還沒加入" : ps && ps.def[0]!=="free" ? (here?"● ":"○ ")+ps.def[2]+ps.def[1] : here ? "● 在線" : "○ 睡著了") + (pm ? " "+pm[2] : ""); st.className = "st"+(here?" on":"");
    const sm = document.querySelector("#top .who .st:not(#stThem)"); if(sm) sm.textContent = "● 你" + (mm ? " "+mm[2] : "");
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
    let html = `<div class="title">喵喵<b>小窩</b></div><div id="truceHome">${truceBar()}</div>${statusCard()}${dailyCard()}${petStrip()}${careCard()}<div class="box meter" id="meter"></div>`;
    if(!p) html += `<div class="box banner"><span class="bi">${icon("heart")}</span><div style="flex:1">另一半還沒加入！<br>把邀請碼 <b style="font-weight:400;color:var(--pink);letter-spacing:2px">${esc(B.code||"")}</b> 傳給 ta</div><button class="btn" id="bInv">傳邀請</button></div>`;
    const alb = stateCache.album && stateCache.album.state, apct = alb ? (alb.bytes||0)/ALBUM_LIMIT : 0;
    if(apct >= .7) html = html.replace('<div id="truceHome">', `<div class="box banner ${apct>=.85?"warn":""}" id="albBan"><span class="bi">${icon("camera")}</span><div style="flex:1">相簿已經用了 ${Math.round(apct*100)}%${apct>=.85?"，該刪一些照片了 🥺":"，可以開始整理照片囉"}</div><button class="btn" id="bAlbum">去整理</button></div><div id="truceHome">`);
    if(false) html += `<div class="box banner ${apct>=.85?"warn":""}"><span class="bi">${icon("camera")}</span><div style="flex:1">相簿已經用了 ${Math.round(apct*100)}%${apct>=.85?"，該刪一些照片了 🥺":"，可以開始整理照片囉"}</div><button class="btn" id="bAlbum">去整理</button></div>`;
    if(pushState()!=="on") html += `<div class="box banner"><span class="bi">${icon("bell")}</span><div style="flex:1">開啟通知，ta 傳訊息時手機會跳出來</div><button class="btn mint" id="bPush">開啟</button></div>`;
    html += `<div class="games">` + games.filter(g=>!g.hidden).map(g=>`<button class="gcard" data-g="${g.id}"><span class="gi">${g.icon()}</span><span class="gn">${esc(g.name)}</span><span class="gd">${esc(g.desc)}</span>${g.badge&&g.badge()?`<span class="gb">${esc(g.badge())}</span>`:""}</button>`).join("")
      + `<div class="gcard soon"><span class="gi">${sprite("gray","sleep",{soft:true})}</span><span class="gn">新遊戲</span><span class="gd">敬請期待…</span></div></div>`;
    v.innerHTML = html;
    renderMeter();
    v.querySelectorAll("[data-g]").forEach(b=>b.addEventListener("click",()=>go("game-"+b.dataset.g)));
    bindCare(v); bindStatus(v); bindDaily(v); const pg=$("petGo"); if(pg) pg.addEventListener("click", ()=>go("game-pet"));
    const bi=$("bInv"); if(bi) bi.addEventListener("click", shareInvite);
    const ba=$("bAlbum"); if(ba) ba.addEventListener("click", ()=>go("album"));
    const bp=$("bPush"); if(bp) bp.addEventListener("click", ()=>enablePush().then(()=>render()));
  }

  // ---------- chat ----------
  const STK=["normal","happy","love","surprised","sleep","wave","loaf"];
  // [id, face/pose, caption, decoration]
  const STICKERS = [
    ["loveyou","love","愛你","hearts"],["miss","cry","想你","hearts"],["hug","wave","抱抱","hearts"],["kiss","love","啾～","kiss"],
    ["morning","happy","早安","sun"],["night","sleep","晚安","moon"],["sleepy","sleep","好睏","zzz"],["bye","wave","掰掰",""],
    ["haha","happy","哈哈哈","sparkle"],["yay","happy","耶～","sparkle"],["good","happy","讚啦","star"],["ok","normal","OK","" ],
    ["thanks","love","謝謝","flower"],["sorry","cry","對不起","sweat"],["cry","cry","哭哭","tears"],["angry","angry","哼！","anger"],
    ["what","surprised","蛤？","q"],["shock","surprised","嚇死","excl"],["hungry","normal","好餓","food"],["eat","happy","吃飯了","food"],
    ["shy","love","害羞","blush"],["busy","angry","忙碌中","sweat"],["home","wave","到家了","home"],["wait","normal","等我","sweat"],
    ["cute","love","你好可愛","sparkle"],["best","happy","你最棒","star"],["jealous","angry","吃醋","anger"],["please","cry","拜託嘛","sparkle"],
    ["loaf","loaf","耍廢中","zzz"],["curl","curl","不想動","zzz"],
  ];
  const STK_BY = Object.fromEntries(STICKERS.map(x=>[x[0],x]));
  const DECO = {
    hearts: '<span class="d d1">💗</span><span class="d d2">💕</span>', kiss:'<span class="d d1">💋</span>', sun:'<span class="d d1">☀️</span>', moon:'<span class="d d1">🌙</span><span class="d d2">⭐</span>',
    zzz:'<span class="d d1 z">z</span><span class="d d2 z">Z</span>', sparkle:'<span class="d d1">✨</span><span class="d d2">✨</span>', star:'<span class="d d1">👍</span>', flower:'<span class="d d1">🌸</span>',
    sweat:'<span class="d d1">💦</span>', tears:'<span class="d d1">💧</span><span class="d d2">💧</span>', anger:'<span class="d d1">💢</span>', q:'<span class="d d1 q">？</span>', excl:'<span class="d d1 q">！</span>',
    food:'<span class="d d1">🍙</span>', blush:'<span class="d d1">///</span>', home:'<span class="d d1">🏠</span>',
  };
  function stickerHtml(id, cat){
    const st = STK_BY[id];
    if(!st){ return id==="heart" ? icon("heart") : sprite(cat||"orange", STK.includes(id)?id:"normal"); }
    return `<span class="stkArt">${sprite(cat||"orange", st[1])}${DECO[st[3]]||""}<b>${esc(st[2])}</b></span>`;
  }
  const QK = {
    "常用語": ["我愛你 ❤️","想你了","抱抱 🫂","親親 😘","晚安 🌙","早安 ☀️","在幹嘛？","吃飯了嗎？","好想見你","你最棒了！","對不起嘛 🥺","快回我～","我到家了","等等打給你","好喔 👌","哈哈哈哈"],
    "表情": ["❤️","💕","🥰","😘","😍","🥺","😭","😂","🤣","😳","😴","🤗","👍","👌","🙏","🎉","🌙","☀️","🍰","🐱","🐾","🌸","✨","💤"],
    "顏文字": ["ฅ^•ﻌ•^ฅ","(=^･ω･^=)","(つ≧▽≦)つ","(*´∀`)~♥","(´；ω；`)","╰(*°▽°*)╯","(｡･ω･｡)ﾉ♡","(*´з`)","(￣▽￣)ノ","( ˘ω˘ )zzZ","(๑•̀ㅂ•́)و✧","(⁄ ⁄•⁄ω⁄•⁄ ⁄)"],
  };
  let lastSeen = +(store.get("mw_seen")||0);
  const imgCache = {};
  function unread(){ return messages.filter(m=>m.id>lastSeen && m.sender!==me.uid && m.kind!=="ping").length; }
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
    if(m.kind==="game") return `<div class="msg sys"><div class="bub">${/^[🏳🤝💗]/u.test(m.body)||m.body.includes("心情")?"":"🎮 "}${esc(m.body)}</div></div>`;
    if(m.kind==="ping") return "";
    if(m.kind==="album") return `<div class="msg sys albumMsg"><button class="bub" data-goalbum>${esc(m.body)}<br><small>點我去整理相簿 ▶</small></button></div>`;
    if(m.kind==="photo_gone") return `<div class="msg ${mine?"me":""}">${mine?"":`<span class="av">${sprite(m.cat||catOf(m.sender),"normal")}</span>`}<div class="bub gone">📷 照片已刪除</div><span class="tm">${hhmm(m.created_at)}</span></div>`;
    if(m.kind==="greet") return `<div class="msg sys greet"><div class="bub">${esc(m.body)}</div></div>`;
    if(m.kind==="status") return `<div class="msg sys status"><div class="bub">${esc(m.body)}</div></div>`;
    if(m.kind==="truce") return `<div class="msg sys truce"><div class="bub">${esc(m.body)}</div></div>`;
    if(m.kind==="letter"){ const opened = mine || openedLetters.has(m.id);
      return `<div class="msg ${mine?"me":""}">${mine?"":`<span class="av">${sprite(m.cat||catOf(m.sender),"normal")}</span>`}<button class="letterBub ${opened?"":"new"}" data-letter="${m.id}"><span class="lb1">💌</span><span><b>${mine?"你寫的信":"一封信"}</b><i>${opened?"點開再看一次":"點我拆信"}</i></span></button><span class="tm">${hhmm(m.created_at)}</span></div>`; }
    if(m.kind==="makeup"){ const mk = (moodSt&&moodSt.makeup)||{}; const pending = !mine && mk.req && mk.req[m.sender] && Date.now()-mk.req[m.sender] < 864e5;
      return `<div class="msg ${mine?"me":""}">${mine?"":`<span class="av">${sprite(m.cat||catOf(m.sender),"cry")}</span>`}<div class="bub makeupBub">${mine?"你說：想跟 ta 和好 🤝":`${esc(m.name||"")} 想跟你和好 🥺`}${pending?`<button class="btn" data-makeup>🤝 好，我們和好</button>`:""}${!mk.req||!mk.req[m.sender]?`<i class="mkDone">${m.created_at && mk.last && mk.last.at > new Date(m.created_at).getTime() ? "已和好 💗" : "（已取消）"}</i>`:""}</div><span class="tm">${hhmm(m.created_at)}</span></div>`; }
    const av = `<span class="av">${sprite(m.cat||catOf(m.sender), m.kind==="poke"?"wave":"normal")}</span>`;
    let bub;
    if(m.kind==="sticker") bub = `<span class="stk">${stickerHtml(m.body, m.cat||catOf(m.sender))}</span>`;
    else if(m.kind==="image") bub = `<span class="pic"><img data-media="${esc(m.media||"")}" ${imgCache[m.media]?`src="${esc(imgCache[m.media])}"`:""} alt="照片"></span>`;
    else if(m.kind==="poke") bub = `<div class="bub">戳了${mine?"對方":"你"}一下 🐾</div>`;
    else bub = `<div class="bub">${esc(m.body)}</div>`;
    const p = partner(); const read = mine && p && (p.last_read||0) >= m.id;
    return `<div class="msg ${mine?"me":""} ${m.kind==="poke"?"poke":""}">${mine?"":av}${bub}<span class="tm">${read?`<span class="rd">已讀</span>`:""}${hhmm(m.created_at)}</span></div>`;
  }
  let kb = null;
  function viewChat(v){
    v.innerHTML = `<div class="box chat"><div class="chatTruce">${truceBar()}${busyBar()}</div><div class="list" id="list"></div>
      <div class="stickers hidden" id="stk"><button data-s="poke" class="pokeBtn" title="戳一下">${icon("paw")}<b>戳一下</b></button>${STICKERS.map(x=>`<button data-s="${x[0]}">${stickerHtml(x[0], me.cat||"orange")}</button>`).join("")}${STK.map(s=>`<button data-s="${s}">${sprite(me.cat||"orange",s)}</button>`).join("")}</div>
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
    $("list").addEventListener("click", e=>{ const im=e.target.closest(".pic img"); if(im && im.src){ viewPhoto(im.src); return; }
      if(e.target.closest("[data-goalbum]")){ go("album"); return; }
      const lt=e.target.closest("[data-letter]"); if(lt){ const m=messages.find(x=>x.id===+lt.dataset.letter); if(m) openLetter(m); return; }
      if(e.target.closest("[data-makeup]")){ askMakeup(); return; }
      showKb(false); });
    ctx._toSys = toSys;
    const unreadLove = messages.filter(m=>m.id>lastSeen && m.sender!==me.uid && isLove(m));
    if(unreadLove.length) setTimeout(()=>playLove(unreadLove.length, unreadLove[0].sender), 350);
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
  // ---------- "我愛你" kiss animation ----------
  const LOVE_RE = /我愛你|我愛妳|愛你|愛妳|love\s*you|ily/i;
  const isLove = m => m && (m.kind==="text" ? LOVE_RE.test(m.body) : (m.kind==="sticker" && (m.body==="loveyou"||m.body==="kiss")));
  let loveBusy = false, loveQueue = 0, loveFrom = null, loveT = null;
  function queueLove(fromUid){ loveQueue++; loveFrom = fromUid; clearTimeout(loveT); loveT = setTimeout(()=>{ const n=loveQueue; loveQueue=0; playLove(n, loveFrom); }, 500); }
  function playLove(n, fromUid){
    if(loveBusy || !n) return; loveBusy = true;
    const p = partner(); if(!p){ loveBusy=false; return; }
    const fromCat = catOf(fromUid), toUid = fromUid===me.uid ? p.user_id : me.uid, toCat = catOf(toUid);
    const o = document.createElement("div"); o.className = "loveFx";
    o.innerHTML = `<div class="lfBg"></div><div class="lfStage"><div class="lfCat l" id="lfL">${sprite(fromCat,"happy")}</div><div class="lfCat r" id="lfR">${sprite(toCat,"happy")}</div>
      <div class="lfKiss hidden" id="lfKiss">啾～</div><div class="lfBig hidden" id="lfBig">${icon("heart")}${n>1?`<b>×${n}</b>`:""}</div></div>
      <div class="lfTxt">${esc(nameOf(fromUid))} 說：我愛你${n>1?` ×${n}`:""} 💗</div>`;
    document.body.appendChild(o);
    const L = o.querySelector("#lfL"), R = o.querySelector("#lfR");
    const walk = [{transform:"translateX(0) translateY(0)"},{transform:"translateX(25%) translateY(-6px)"},{transform:"translateX(50%) translateY(0)"},{transform:"translateX(75%) translateY(-6px)"},{transform:"translateX(100%) translateY(0)"}];
    L.animate(walk,{duration:1300,easing:"steps(8,end)",fill:"forwards"});
    R.animate(walk.map(k=>({transform:k.transform.replace("translateX(","translateX(-")})),{duration:1300,easing:"steps(8,end)",fill:"forwards"});
    SFX.meow(1); setTimeout(()=>SFX.meow(1.15), 350);
    const done = () => { o.animate([{opacity:1},{opacity:0}],{duration:350,fill:"forwards"}).onfinish=()=>{ o.remove(); loveBusy=false; }; };
    let finished = false; const finish = ()=>{ if(finished) return; finished=true; done(); };
    o.addEventListener("click", finish);
    setTimeout(()=>{
      L.innerHTML = sprite(fromCat,"love"); R.innerHTML = sprite(toCat,"love");
      L.animate([{transform:"translateX(100%) rotate(0)"},{transform:"translateX(108%) rotate(10deg)"},{transform:"translateX(100%) rotate(0)"}],{duration:600,fill:"forwards"});
      R.animate([{transform:"translateX(-100%) rotate(0)"},{transform:"translateX(-108%) rotate(-10deg)"},{transform:"translateX(-100%) rotate(0)"}],{duration:600,fill:"forwards"});
      const k = o.querySelector("#lfKiss"); k.classList.remove("hidden"); k.animate([{transform:"translate(-50%,0) scale(.3)",opacity:0},{transform:"translate(-50%,-20px) scale(1.2)",opacity:1,offset:.5},{transform:"translate(-50%,-30px) scale(1)",opacity:1}],{duration:500,fill:"forwards"});
      SFX.heart(); haptic();
      for(let i=0;i<14;i++) setTimeout(()=>{ const h=document.createElement("div"); h.className="float"; h.innerHTML=icon(i%3?"heart":"star"); h.style.left=(35+Math.random()*30)+"vw"; h.style.top=(45+Math.random()*10)+"vh"; document.body.appendChild(h); setTimeout(()=>h.remove(),2300); }, i*70);
    }, 1350);
    setTimeout(()=>{ const b = o.querySelector("#lfBig"); b.classList.remove("hidden"); b.animate([{transform:"translate(-50%,-50%) scale(0)"},{transform:"translate(-50%,-50%) scale(1.3)",offset:.6},{transform:"translate(-50%,-50%) scale(1)"}],{duration:500,easing:"ease-out",fill:"forwards"}); if(n>1) SFX.combo(); }, 1900);
    setTimeout(finish, 3600);
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
      let tsz = 0; try{ const tb = await makeThumb(blob); if(tb){ await B.uploadThumb(thumbOf(path), tb); tsz = tb.size; } }catch(e){}
      const row = await B.send("傳了一張照片 📷","image",me.name,me.cat,path);
      addMessage(row); SFX.send(); toast(`${sprite(me.cat||"orange","wave")} 照片傳出去了！`);
      const st = await update("album", st=>{ st = st || { bytes:0, count:0, warned:0 }; st.bytes = (st.bytes||0) + blob.size + tsz; st.count = (st.count||0)+1; return st; });
      if(st) checkCapacity(st);
    }catch(e){ console.error(e); const full = /exceed|quota|size|limit/i.test(String(e.message||e)); toast(full ? "照片傳不出去，相簿可能滿了，去「相簿」刪一些照片吧" : "照片傳送失敗："+esc(e.message||e), 5000); }
  }
  async function makeThumb(blob){
    const url = URL.createObjectURL(blob);
    try{
      const img = await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=url; });
      const sc = Math.min(1, 360/Math.min(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth*sc); c.height = Math.round(img.naturalHeight*sc);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      return await new Promise(r=>c.toBlob(r, "image/jpeg", .72));
    } finally { URL.revokeObjectURL(url); }
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
    if(chatVisible()){ drawList(false); markSeen(); if(isLove(m)) queueLove(m.sender); }
    else renderBadge();
    if(m.sender!==me.uid){
      if(m.kind==="poke"){ SFX.meow(1.12); haptic(); floatSvg(sprite(m.cat||"white","wave")); }
      else if(m.kind==="sticker"){ SFX.heart(); }
      else SFX.msg();
      if(!chatVisible() && m.kind!=="game" && m.kind!=="ping"){
        const txt = m.kind==="poke"?"戳了你一下 🐾":m.kind==="sticker"?"傳了一張貼圖":m.kind==="image"?"傳了一張照片 📷":m.kind==="letter"?"寫了一封信給你 💌":m.body;
        toast(`${sprite(m.cat||"white","happy")}<span><b style="font-weight:400">${esc(m.name||"另一半")}</b>：${esc(txt.slice(0,40))}</span>`);
      }
    }
  }

  // ---------- keyboard look ----------
  const KB_THEMES = [["strawberry","草莓牛奶","#fff0f3","#f28ba3"],["milktea","奶茶","#f3e6d8","#b98560"],["mint","薄荷","#e6f5ee","#6cc49d"],["lavender","薰衣草","#f0ecfb","#a58be8"],["night","夜空","#2e3150","#ffc94d"],
    ["peach","蜜桃","#ffeee4","#ff9f7a"],["sky","天空藍","#e8f3fd","#7fb5ee"],["cream","奶油","#fbf6ec","#5a3b2e"],["tuxedo","黑白賓士貓","#ececec","#222222"],["matcha","抹茶","#eef2df","#93ad55"]];
  const KB_ANIMS = [["jelly","果凍彈跳"],["paw","貓掌蓋章"],["hearts","愛心爆炸"],["jump","跳跳落地"],["spin","旋轉星星"],["peek","貓咪探頭"],["ripple","波紋擴散"]];
  function applyKbTheme(){ document.body.dataset.kb = store.get("mw_kb") || "strawberry"; }
  const WALLS = [["paws","貓掌"],["night","星空"],["aqua","魚缸"],["sky","雲朵"],["sakura","櫻花"],["picnic","野餐布"],["meadow","小花園"],["dots","點點"],["photo","我的照片"]];
  function applyWall(){
    const w = store.get("mw_wall") || "paws", img = store.get("mw_wall_img");
    document.body.dataset.wall = (w==="photo" && !img) ? "paws" : w;
    if(img) document.body.style.setProperty("--wall-img", `url("${img}")`);
  }
  function wallCss(id){
    const prev = document.body.dataset.wall;
    const probe = document.createElement("div"); probe.className="chat"; probe.style.cssText="position:absolute;left:-9999px;width:60px;height:80px"; probe.innerHTML='<div class="list" style="height:80px"></div>';
    document.body.appendChild(probe); document.body.dataset.wall = (id==="photo" && !store.get("mw_wall_img")) ? "paws" : id;
    const cs = getComputedStyle(probe.firstChild); const css = `background:${cs.backgroundImage==="none"?"":cs.backgroundImage} ${cs.backgroundColor};background-size:${cs.backgroundSize};background-position:${cs.backgroundPosition};background-repeat:${cs.backgroundRepeat}`;
    document.body.dataset.wall = prev; probe.remove(); return css;
  }
  async function pickWallPhoto(){
    return new Promise(res=>{
      const inp=document.createElement("input"); inp.type="file"; inp.accept="image/*";
      inp.onchange = async ()=>{ const f=inp.files&&inp.files[0]; if(!f) return res(false);
        const url=URL.createObjectURL(f); const im=new Image();
        im.onload=()=>{ const max=900, sc=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight)); const c=document.createElement("canvas"); c.width=Math.round(im.naturalWidth*sc); c.height=Math.round(im.naturalHeight*sc); c.getContext("2d").drawImage(im,0,0,c.width,c.height);
          let q=.75, data=c.toDataURL("image/jpeg",q); while(data.length>1200000 && q>.3){ q-=.15; data=c.toDataURL("image/jpeg",q); }
          URL.revokeObjectURL(url); store.set("mw_wall_img", data); store.set("mw_wall","photo"); applyWall(); res(true); };
        im.onerror=()=>res(false); im.src=url; };
      inp.click();
    });
  }
  function kbArt(){ const p=palOf(me.cat||"orange"); return { paw: icon("bigpaw",{F:p.Y,O:p.O,P:'#f7a7b8'}), heart: icon("heart"), star: icon("star"), cat: sprite(me.cat||"orange","happy") }; }


  // ================= 吵架救援：心情、休戰旗、和好信箱、和好儀式 =================
  const MOODS = [["happy","開心","😊","happy"],["love","超愛你","🥰","love"],["ok","普通","🙂","normal"],["tired","好累","😴","sleep"],["sad","難過","😢","cry"],["angry","生氣","😠","angry"],["hug","需要抱抱","🫂","cry"]];
  const MOOD_BY = Object.fromEntries(MOODS.map(m=>[m[0],m]));
  let moodSt = null, truceTimer = null;
  const moodOf = uid => { const m = moodSt && moodSt.moods && moodSt.moods[uid]; return m && (Date.now()-m.at < 36*3600e3) ? MOOD_BY[m.m] : null; };
  function moodFace(uid, fallback){ const m = moodOf(uid); return m ? m[3] : fallback; }
  const truce = () => moodSt && moodSt.truce && !moodSt.truce.done ? moodSt.truce : null;
  const fmtLeft = ms => { ms=Math.max(0,ms); const m=Math.floor(ms/60000), s=Math.floor(ms%60000/1000); return `${m}:${String(s).padStart(2,"0")}`; };

  function careCard(){
    const p = partner(); if(!p) return "";
    const mm = moodOf(me.uid), pm = moodOf(p.user_id), mk = (moodSt && moodSt.makeup) || {};
    const myReq = mk.req && mk.req[me.uid] && Date.now()-mk.req[me.uid] < 864e5, theirReq = mk.req && mk.req[p.user_id] && Date.now()-mk.req[p.user_id] < 864e5;
    // the 和好 button only shows up when there's something to make up for
    const upset = m => m && ["angry","sad","hug"].includes(m[0]);
    const conflict = !!(truce() || upset(mm) || upset(pm) || myReq || theirReq);
    return `<div class="box care" id="care">
      <div class="careHd">💗 心情小站${mk.count?`<span>一起和好過 ${mk.count} 次</span>`:""}</div>
      <div class="careMoods">
        <button class="cm" id="cmMe"><span class="cmCat">${sprite(me.cat||"orange", mm?mm[3]:"normal")}</span><b>${esc(me.name||"我")}</b><i>${mm?`${mm[2]} ${mm[1]}`:"點我設定心情"}</i></button>
        <div class="cmMid">${theirReq&&!myReq?`<span class="cmHeart">🤝</span>`:`<span class="cmHeart">${icon("heart")}</span>`}</div>
        <div class="cm"><span class="cmCat">${sprite(p.cat, pm?pm[3]:"normal")}</span><b>${esc(p.name)}</b><i>${pm?`${pm[2]} ${pm[1]}`:"還沒設定"}</i></div>
      </div>
      ${theirReq && !myReq ? `<div class="careAsk">${esc(p.name)} 想跟你和好 🥺 <button class="btn" id="cmYes">🤝 好，我們和好</button></div>`:""}
      <div class="careBtns ${conflict?"":"three"}">
        <button id="cbMood"><span>🌡️</span>心情</button><button id="cbTruce"><span>🏳️</span>休戰旗</button><button id="cbLetter"><span>💌</span>寫信</button>${conflict?`<button id="cbMake" class="${myReq?"on":""}"><span>🤝</span>${myReq?"等 ta 回應":"和好"}</button>`:""}
      </div></div>`;
  }
  function bindCare(root){
    const q = id => root.querySelector("#"+id);
    if(q("cmMe")) q("cmMe").addEventListener("click", moodPicker);
    if(q("cbMood")) q("cbMood").addEventListener("click", moodPicker);
    if(q("cbTruce")) q("cbTruce").addEventListener("click", trucePicker);
    if(q("cbLetter")) q("cbLetter").addEventListener("click", ()=>letterWriter());
    if(q("cbMake")) q("cbMake").addEventListener("click", ()=>{
      const mk = (moodSt && moodSt.makeup) || {}, mine = mk.req && mk.req[me.uid] && Date.now()-mk.req[me.uid] < 864e5;
      if(!mine){ askMakeup(); return; }
      const o = modal(`<h3>🤝 已經跟 ta 說想和好了</h3><p>在等 ${esc(partner()?partner().name:"ta")} 按下和好。<br>不小心按到的話可以取消。</p>
        <button class="btn sub" id="mkCancel" style="width:100%">取消和好請求</button><button class="btn" id="mkKeep" style="width:100%;margin-top:8px">繼續等 ta</button>`);
      o.querySelector("#mkKeep").addEventListener("click", ()=>o.remove());
      o.querySelector("#mkCancel").addEventListener("click", async ()=>{ o.remove(); await cancelMakeup(); });
    });
    if(q("cmYes")) q("cmYes").addEventListener("click", askMakeup);
  }
  function modal(html, cls){
    const o = document.createElement("div"); o.className = "careModal "+(cls||""); o.innerHTML = `<div class="cmBox">${html}</div>`;
    o.addEventListener("click", e=>{ if(e.target===o) o.remove(); }); document.body.appendChild(o);
    o.firstChild.animate([{transform:"translateY(40px) scale(.95)",opacity:0},{transform:"none",opacity:1}],{duration:220,easing:"ease-out"});
    return o;
  }
  // ---- mood ----
  function moodPicker(){
    const cur = moodOf(me.uid);
    const o = modal(`<h3>你現在的心情是？</h3><div class="mdGrid">${MOODS.map(m=>`<button data-m="${m[0]}" class="${cur&&cur[0]===m[0]?"on":""}"><span>${sprite(me.cat||"orange", m[3])}</span>${m[2]} ${m[1]}</button>`).join("")}</div><div class="k">對方會在首頁和頂端看到你的貓咪表情</div>`);
    o.querySelectorAll("[data-m]").forEach(b=>b.addEventListener("click", async ()=>{
      const m = b.dataset.m; o.remove(); SFX.select();
      await update("mood", st=>{ st = st || {}; st.moods = st.moods || {}; st.moods[me.uid] = { m, at: Date.now() }; return st; });
      const md = MOOD_BY[m];
      if(["sad","angry","hug","tired"].includes(m)){ const pp = partner(); if(pp){ try{ const row = await B.send(`${me.name} 現在的心情：${md[2]} ${md[1]}`, "game", me.name, me.cat); addMessage(row); }catch(e){} } }
      toast(`${sprite(me.cat||"orange", md[3])} 心情設定成「${md[1]}」`);
    }));
  }
  // ---- truce flag ----
  function trucePicker(){
    const t = truce();
    if(t){ const mine = t.by===me.uid;
      const o = modal(`<h3>🏳️ 休戰中</h3><p>${mine?"你":esc(nameOf(t.by))} 想冷靜一下，還剩 <b>${fmtLeft(t.until-Date.now())}</b></p>${mine?`<button class="btn" id="tcEnd">我好了，提早結束</button>`:`<p class="k">先讓 ta 冷靜一下，時間到會提醒你們 💗</p>`}<button class="btn sub" id="tcClose" style="width:100%;margin-top:8px">關閉</button>`);
      o.querySelector("#tcClose").addEventListener("click", ()=>o.remove());
      const e = o.querySelector("#tcEnd"); if(e) e.addEventListener("click", async ()=>{ o.remove(); await endTruce(true); });
      return; }
    const o = modal(`<h3>🏳️ 舉起休戰旗</h3><p>想先冷靜一下嗎？選一段時間，對方會知道你<b>會回來</b>，不是不理 ta。</p>
      <div class="tcGrid">${[10,20,30,60].map(m=>`<button data-min="${m}">${m} 分鐘</button>`).join("")}</div><div class="k">時間到的時候，兩邊都會收到提醒</div>`);
    o.querySelectorAll("[data-min]").forEach(b=>b.addEventListener("click", async ()=>{
      const min = +b.dataset.min; o.remove(); SFX.select();
      await update("mood", st=>{ st = st || {}; st.truce = { by: me.uid, until: Date.now()+min*60000, min, done:false }; return st; });
      try{ const row = await B.send(`🏳️ ${me.name} 想先冷靜 ${min} 分鐘，等等一定回來找你 💗`, "truce", me.name, me.cat); addMessage(row); }catch(e){}
    }));
  }
  async function endTruce(early){
    const ok = await update("mood", st=>{ if(!st || !st.truce || st.truce.done) return undefined; st.truce.done = true; return st; });
    if(ok){ try{ const row = await B.send(early ? `🏳️ ${me.name} 冷靜好了，想跟你聊聊 💗` : "🏳️ 冷靜時間到了，可以聊聊了嗎？💗", "game", me.name, me.cat); addMessage(row); }catch(e){} }
  }
  function truceBar(){
    const t = truce(); if(!t) return "";
    const mine = t.by===me.uid;
    return `<div class="truceBar" data-truce>🏳️ <span>${mine?"你正在冷靜":esc(nameOf(t.by))+" 想先冷靜一下"}</span><b class="tLeft">${fmtLeft(t.until-Date.now())}</b></div>`;
  }
  function tickTruce(){
    if(Date.now()%20000 < 1000) refreshStatus(false);
    const t = truce();
    document.querySelectorAll("[data-truce] .tLeft").forEach(e=>e.textContent = t ? fmtLeft(t.until-Date.now()) : "");
    if(t && Date.now() >= t.until) endTruce(false);
  }
  // ---- letters ----
  function letterWriter(){
    const p = partner(); if(!p) return;
    let text = "";
    const o = modal(`<div class="ltPaper"><div class="ltTo">給 ${esc(p.name)}：</div><div class="ltBody" id="ltBody"><span class="ph">想說的話，寫在這裡…</span></div><div class="ltFrom">—— ${esc(me.name)}</div></div>
      <div class="ltBtns"><button class="btn sub" id="ltCancel">取消</button><button class="btn" id="ltSend">💌 寄出</button></div><div id="ltKb" class="ltKb"></div>`, "letter");
    const body = o.querySelector("#ltBody");
    const paint = () => { body.innerHTML = text ? esc(text).replace(/\n/g,"<br>") : `<span class="ph">想說的話，寫在這裡…</span>`; body.scrollTop = body.scrollHeight; };
    const kbx = IME.mount(o.querySelector("#ltKb"), { dictUrl:"zhuyin.txt", anim: ()=>store.get("mw_anim")||"jelly", art: kbArt(), phrases: QK["常用語"], emojis: QK["表情"], enterLabel:"換行",
      commit: t => { text = (text + t).slice(0, 800); paint(); }, backspace: () => { const a=[...text]; a.pop(); text=a.join(""); paint(); },
      send: () => { text += "\n"; paint(); }, fx: (k,n) => { if(k==="del") SFX.del(); else SFX.key(); } });
    o.querySelector("#ltCancel").addEventListener("click", ()=>o.remove());
    o.querySelector("#ltSend").addEventListener("click", async ()=>{
      if(kbx.composing()) kbx.flush();
      const t = text.trim(); if(!t){ toast("先寫點什麼吧"); return; }
      o.remove();
      try{ const row = await B.send("💌 寫了一封信給你", "letter", me.name, me.cat, t); addMessage(row); SFX.send(); toast(`${sprite(me.cat||"orange","love")} 信寄出去了！`); }catch(e){ toast("寄信失敗，請再試一次"); }
    });
  }
  const openedLetters = new Set(JSON.parse(store.get("mw_letters")||"[]"));
  function openLetter(m){
    openedLetters.add(m.id); store.set("mw_letters", JSON.stringify([...openedLetters].slice(-300)));
    const from = m.sender===me.uid ? "你" : esc(m.name||nameOf(m.sender)), to = m.sender===me.uid ? esc(partner()?partner().name:"") : esc(me.name);
    const o = document.createElement("div"); o.className = "ltOpen";
    o.innerHTML = `<div class="env"><div class="envBack"></div><div class="ltPaper inEnv"><div class="ltTo">給 ${to}：</div><div class="ltBody">${esc(m.media||"").replace(/\n/g,"<br>")}</div><div class="ltFrom">—— ${from}</div></div><div class="envFront"></div><div class="envFlap"></div><div class="envSeal">💗</div></div><div class="k" style="color:#fff;margin-top:14px">點一下關閉</div>`;
    document.body.appendChild(o);
    const flap = o.querySelector(".envFlap"), paper = o.querySelector(".inEnv"), seal = o.querySelector(".envSeal");
    seal.animate([{transform:"translate(-50%,-50%) scale(1)"},{transform:"translate(-50%,-50%) scale(1.4)",opacity:1},{transform:"translate(-50%,-50%) scale(0)",opacity:0}],{duration:400,fill:"forwards"});
    flap.animate([{transform:"rotateX(0)"},{transform:"rotateX(180deg)"}],{duration:500,delay:300,fill:"forwards",easing:"ease-in-out"});
    paper.animate([{transform:"translateY(0)"},{transform:"translateY(-62%)"}],{duration:600,delay:750,fill:"forwards",easing:"ease-out"});
    setTimeout(()=>{ paper.classList.add("up"); SFX.heart(); }, 1350);
    SFX.select();
    o.addEventListener("click", ()=>{ o.animate([{opacity:1},{opacity:0}],{duration:250}).onfinish=()=>o.remove(); drawList(false); });
  }
  // ---- make up ----
  async function askMakeup(){
    const p = partner(); if(!p) return;
    let completed = false, count = 0;
    const ok = await update("mood", st=>{
      st = st || {}; st.makeup = st.makeup || { count:0, req:{} }; st.makeup.req = st.makeup.req || {};
      const theirs = st.makeup.req[p.user_id];
      if(theirs && Date.now()-theirs < 864e5){
        st.makeup.count = (st.makeup.count||0)+1; st.makeup.req = {}; st.makeup.last = { at: Date.now(), n: st.makeup.count };
        if(st.truce) st.truce.done = true;
        st.moods = st.moods || {}; for(const u of [me.uid, p.user_id]) st.moods[u] = { m:"love", at: Date.now() };
        completed = true; count = st.makeup.count;
      } else {
        if(st.makeup.req[me.uid] && Date.now()-st.makeup.req[me.uid] < 864e5) return undefined;
        st.makeup.req[me.uid] = Date.now();
      }
      return st;
    });
    if(!ok){ toast("已經跟 ta 說想和好了，等 ta 回應 🥺"); return; }
    try{
      const row = completed ? await B.send(`🤝 我們和好了！這是第 ${count} 次一起和好 💗`, "game", me.name, me.cat)
                            : await B.send("想跟你和好 🤝", "makeup", me.name, me.cat);
      addMessage(row);
    }catch(e){}
    if(!completed) toast(`${sprite(me.cat||"orange","cry")} 已經跟 ${esc(p.name)} 說了，等 ta 按下和好`);
  }
  async function cancelMakeup(){
    const ok = await update("mood", st=>{ if(!st || !st.makeup || !st.makeup.req || !st.makeup.req[me.uid]) return undefined; delete st.makeup.req[me.uid]; return st; });
    if(ok) toast(`${sprite(me.cat||"orange","normal")} 已經取消和好請求`);
  }
  let shownMakeup = null;
  function playHug(n){
    const p = partner(); if(!p) return;
    const o = document.createElement("div"); o.className = "loveFx hugFx";
    o.innerHTML = `<div class="lfBg"></div><div class="lfStage"><div class="lfCat l" id="hgL">${sprite(me.cat||"orange","cry")}</div><div class="lfCat r" id="hgR">${sprite(p.cat,"cry")}</div>
      <div class="lfKiss hidden" id="hgTxt">抱抱～</div><div class="lfBig hidden" id="hgBig">🤝</div></div><div class="lfTxt">和好了！第 ${n} 次一起和好 💗</div>`;
    document.body.appendChild(o);
    const L=o.querySelector("#hgL"), R=o.querySelector("#hgR");
    L.animate([{transform:"translateX(0)"},{transform:"translateX(118%)"}],{duration:1200,easing:"steps(8,end)",fill:"forwards"});
    R.animate([{transform:"translateX(0)"},{transform:"translateX(-118%)"}],{duration:1200,easing:"steps(8,end)",fill:"forwards"});
    setTimeout(()=>{ L.innerHTML=sprite(me.cat||"orange","love"); R.innerHTML=sprite(p.cat,"love"); const t=o.querySelector("#hgTxt"); t.classList.remove("hidden"); t.animate([{transform:"translate(-50%,0) scale(.3)",opacity:0},{transform:"translate(-50%,-20px) scale(1.2)",opacity:1}],{duration:400,fill:"forwards"}); SFX.level(); burst(); haptic(); }, 1250);
    setTimeout(()=>{ const b=o.querySelector("#hgBig"); b.classList.remove("hidden"); b.animate([{transform:"translate(-50%,-50%) scale(0)"},{transform:"translate(-50%,-50%) scale(1.3)",offset:.6},{transform:"translate(-50%,-50%) scale(1)"}],{duration:500,fill:"forwards"}); }, 1800);
    const close=()=>{ o.animate([{opacity:1},{opacity:0}],{duration:300}).onfinish=()=>o.remove(); };
    o.addEventListener("click", close); setTimeout(close, 4200);
  }
  // ---- status board (上班中 / 開會中 …) ----
  const STATUSES = [["free","有空","🟢"],["work","上班中","💼"],["meeting","開會中","🗣️"],["drive","開車中","🚗"],["busy","忙碌中","⏳"],["eat","吃飯中","🍙"],["bath","洗澡中","🛁"],["sleep","睡覺中","🌙"],["out","出門中","🚶"],["game","打遊戲","🎮"]];
  const STATUS_BY = Object.fromEntries(STATUSES.map(x=>[x[0],x]));
  const GRACE = 3*3600e3;
  // returns {def, until, over} or null when nothing worth showing
  function statusOf(uid){
    const s = moodSt && moodSt.status && moodSt.status[uid]; if(!s || !STATUS_BY[s.s]) return null;
    const now = Date.now(), def = STATUS_BY[s.s];
    if(s.s==="free") return now - s.at < GRACE ? { def, until:null, over:false } : null;
    const end = s.until || (s.at + 12*3600e3);
    if(now > end + (s.until ? GRACE : 0)) return null;
    return { def, until: s.until||null, over: !!s.until && now > s.until };
  }
  const isBusy = uid => { const x = statusOf(uid); return !!x && x.def[0]!=="free"; };
  function fmtUntil(t){
    const d = new Date(t), now = new Date(), tm = hhmm(t);
    if(d.toDateString()===now.toDateString()) return tm;
    const tmr = new Date(now); tmr.setDate(now.getDate()+1);
    return (d.toDateString()===tmr.toDateString() ? "明天 " : `${d.getMonth()+1}/${d.getDate()} `) + tm;
  }
  const statusLine = x => !x ? "" : x.def[0]==="free" ? "現在有空" : x.until ? (x.over ? `說 ${fmtUntil(x.until)} 有空・快好了？` : `大概 ${fmtUntil(x.until)} 有空`) : "還不確定幾點有空";
  function statusCard(){
    const p = partner(); if(!p) return "";
    const mine = statusOf(me.uid), theirs = statusOf(p.user_id), busy = mine && mine.def[0]!=="free";
    const tile = (x, name, who) => `<span class="stEm">${x?x.def[2]:"🐾"}</span><span class="stTx"><b>${esc(name)}${x?`・${x.def[1]}`:""}</b><i>${x?statusLine(x):who==="me"?"點我設定狀態":"還沒設定狀態"}</i></span>`;
    return `<div class="box statBox" id="statBox">
      <div class="careHd">📋 狀態牌</div>
      <div class="stTiles"><button class="stT" id="stMe">${tile(mine, me.name||"我", "me")}</button><div class="stT them ${theirs&&theirs.def[0]!=="free"?"busy":""}">${tile(theirs, p.name, "them")}</div></div>
      ${busy ? `<div class="stAct">${mine.over?`<span>已經過了你說的時間，忙完了嗎？</span>`:""}<button class="btn mint" id="stDone">🟢 我忙完了</button>${mine.over?`<button class="btn sub" id="stMore">還在忙 +1 小時</button>`:""}</div>` : ""}
    </div>`;
  }
  function bindStatus(root){
    const q = id => root.querySelector("#"+id);
    if(q("stMe")) q("stMe").addEventListener("click", statusPicker);
    if(q("stDone")) q("stDone").addEventListener("click", ()=>setStatus("free", null));
    if(q("stMore")) q("stMore").addEventListener("click", ()=>{ const cur = moodSt.status[me.uid]; setStatus(cur.s, Date.now()+3600e3, true); });
  }
  function busyBar(){
    const p = partner(); if(!p) return ""; const x = statusOf(p.user_id);
    if(!x || x.def[0]==="free") return "";
    return `<div class="busyBar">${x.def[2]} <span>${esc(p.name)} ${x.def[1]}，${statusLine(x)}<br><small>訊息可能會晚點回喔</small></span></div>`;
  }
  let statusKey = "";
  function refreshStatus(force){
    const p = partner();
    const k = JSON.stringify([statusOf(me.uid), p && statusOf(p.user_id)]);
    if(!force && k===statusKey) return; statusKey = k;
    if(route==="home"){ const c=$("statBox"); if(c){ const tmp=document.createElement("div"); tmp.innerHTML=statusCard(); if(tmp.firstChild){ c.replaceWith(tmp.firstChild); bindStatus($("view")); } } }
    document.querySelectorAll(".chatTruce").forEach(e=>e.innerHTML = truceBar()+busyBar());
    lastHdr = ""; renderHeader();
  }
  function statusPicker(){
    const cur = statusOf(me.uid);
    const o = modal(`<h3>你現在在做什麼？</h3><div class="stGrid">${STATUSES.map(x=>`<button data-s="${x[0]}" class="${cur&&cur.def[0]===x[0]?"on":""} ${x[0]==="free"?"free":""}"><span>${x[2]}</span>${x[1]}</button>`).join("")}</div><div class="k">對方會在大廳、聊天室上面看到你的狀態</div>`);
    o.querySelectorAll("[data-s]").forEach(b=>b.addEventListener("click", ()=>{
      const sid = b.dataset.s; SFX.select();
      if(sid==="free"){ o.remove(); setStatus("free", null); return; }
      untilPicker(o, sid);
    }));
  }
  function untilPicker(o, sid){
    const def = STATUS_BY[sid], now = new Date();
    const at = (h,m) => { const d = new Date(now); d.setHours(h,m,0,0); if(d <= now) d.setDate(d.getDate()+1); return d.getTime(); };
    const opts = [["不確定", null],["30 分鐘", Date.now()+30*60e3],["1 小時", Date.now()+3600e3],["2 小時", Date.now()+2*3600e3],["3 小時", Date.now()+3*3600e3]];
    if(sid==="work") opts.push(["到 18:00", at(18,0)]);
    if(sid==="sleep") opts.push(["到早上 8:00", at(8,0)]);
    const def0 = new Date(Date.now()+3600e3);
    o.querySelector(".cmBox").innerHTML = `<h3>${def[2]} ${def[1]}・大概什麼時候有空？</h3>
      <div class="tcGrid">${opts.map((x,i)=>`<button data-u="${i}">${x[0]}</button>`).join("")}</div>
      <div class="stTime"><span>或指定時間</span><input type="time" id="stT" value="${hhmm(def0)}"><button class="btn" id="stTOk">好</button></div>
      <div class="k">時間到之後，你這邊會問你忙完了沒</div>`;
    o.querySelectorAll("[data-u]").forEach(b=>b.addEventListener("click", ()=>{ o.remove(); setStatus(sid, opts[+b.dataset.u][1]); }));
    o.querySelector("#stTOk").addEventListener("click", ()=>{
      const v = o.querySelector("#stT").value; if(!/^\d\d:\d\d$/.test(v)) return;
      o.remove(); setStatus(sid, at(+v.slice(0,2), +v.slice(3)));
    });
  }
  async function setStatus(sid, until, quiet){
    const was = isBusy(me.uid);
    const ok = await update("mood", st=>{ st = st || {}; st.status = st.status || {}; st.status[me.uid] = { s: sid, until: until||null, at: Date.now() }; return st; });
    if(!ok) return;
    const def = STATUS_BY[sid], p = partner();
    if(sid==="free"){
      toast(`${sprite(me.cat||"orange","happy")} 狀態改成「有空」`);
      if(was && p){ try{ const row = await B.send(`🟢 ${me.name} 忙完了，現在有空！`, "status", me.name, me.cat); addMessage(row); }catch(e){} }
    } else {
      toast(`${sprite(me.cat||"orange","normal")} 狀態改成「${def[1]}」`);
      if(p && !quiet){ try{ const row = await B.send(`${def[2]} ${me.name} ${def[1]}，${until?`大概 ${fmtUntil(until)} 有空`:"晚點回你"}`, "status", me.name, me.cat); addMessage(row); }catch(e){} }
    }
  }
  // ---- home box helper ----
  function refreshHomeBox(id, html, bind){
    if(route!=="home") return; const c=$(id); if(!c) return;
    const tmp=document.createElement("div"); tmp.innerHTML=html(); if(tmp.firstElementChild){ c.replaceWith(tmp.firstElementChild); if(bind) bind($("view")); }
  }
  // ---- our cat (strip on home; the room itself lives in games/pet.js) ----
  function petStrip(){
    const P = window.PetLogic; if(!P || !partner()) return "";
    const ps = stateCache.pet && P.norm(stateCache.pet.state);
    if(!ps || !ps.cats.length) return `<button class="box petStrip" id="petGo"><span class="psCat">${sprite("white","curl",{soft:true})}</span><span class="psTx"><b>領養一隻我們的貓 🐾</b><i>兩個人一起餵牠、陪牠長大</i></span><span class="psGo">▶</span></button>`;
    const cs = ps.cats, hungry = cs.filter(c=>P.mood(c).hungry), lo = Math.min(...cs.map(c=>P.fullness(c)));
    const text = hungry.length ? `${hungry.map(c=>esc(c.name)).join("、")} 肚子餓了～` : cs.length>1 ? "兩隻在家裡玩得很開心 💗" : esc(P.mood(cs[0]).text) + "・可以再養一隻喔";
    return `<button class="box petStrip ${hungry.length?"hungry":""}" id="petGo"><span class="psCats">${cs.map(c=>`<span class="psCat">${sprite(c.color, P.mood(c).face)}</span>`).join("")}</span><span class="psTx"><b>${cs.map(c=>esc(c.name)).join(" & ")}</b><i>${text}</i><span class="pbBar"><i class="${lo<15?"low":lo<40?"mid":""}" style="width:${lo}%"></i></span></span><span class="psGo">▶</span></button>`;
  }
  // ---- 早安 / 晚安 check-in ----
  const dayKeyOf = t => { const d = new Date((t||Date.now()) - 4*3600e3); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); };
  const prevDay = k => { const [y,m,d] = k.split("-").map(Number); const x = new Date(y, m-1, d-1, 12); return x.getFullYear()+"-"+(x.getMonth()+1)+"-"+x.getDate(); };
  function greetSlot(){ const h = new Date().getHours(); return h>=4 && h<14 ? "m" : (h>=19 || h<4) ? "n" : null; }
  const SLOT = { m:["☀️","早安"], n:["🌙","晚安"] };
  function dayDone(st, k, slot){ const p = partner(); const x = st && st.days && st.days[k] && st.days[k][slot]; return !!(x && p && x[me.uid] && x[p.user_id]); }
  function streak(st, slot){
    let k = dayKeyOf(), n = 0;
    if(!dayDone(st, k, slot)) k = prevDay(k);
    while(dayDone(st, k, slot) && n < 400){ n++; k = prevDay(k); }
    return n;
  }
  function dailyCard(){
    const p = partner(); if(!p) return "";
    const st = stateCache.daily && stateCache.daily.state, k = dayKeyOf(), slot = greetSlot();
    const row = sl => {
      const n = streak(st, sl), best = st && st.best && st.best[sl] || 0, x = (st && st.days && st.days[k] && st.days[k][sl]) || {};
      const broke = n===0 && best>0;
      return `<div class="dyRow ${broke?"broke":""}"><span class="dyIc">${broke?sprite(me.cat||"orange","cry"):SLOT[sl][0]}</span><span class="dyTx"><b>${SLOT[sl][1]}${n?` 連續 🔥${n} 天`:broke?"・斷掉了…今天重新開始吧":"・還沒開始"}</b><i>你 ${x[me.uid]?"✔":"—"}・${esc(p.name)} ${x[p.user_id]?"✔":"—"}${best?`・最高 ${best} 天`:""}</i></span></div>`;
    };
    let btn;
    if(!slot) btn = `<button class="btn sub" disabled>晚上 7 點後可以說晚安 🌙</button>`;
    else { const x = (st && st.days && st.days[k] && st.days[k][slot]) || {};
      btn = x[me.uid] ? `<button class="btn sub" disabled>${SLOT[slot][0]} 你今天說過${SLOT[slot][1]}了${x[p.user_id]?" 💗":"，等 ta"}</button>`
                      : `<button class="btn" id="dyBtn">${SLOT[slot][0]} 跟 ${esc(p.name)} 說${SLOT[slot][1]}</button>`; }
    return `<div class="box daily" id="dailyBox"><div class="careHd">📅 早安晚安打卡<span>兩個人都說了才算一天 · 每次 +2 🐟</span></div>${row("m")}${row("n")}${btn}</div>`;
  }
  function bindDaily(root){ const b = root.querySelector("#dyBtn"); if(b) b.addEventListener("click", sayGreet); }
  async function sayGreet(){
    const slot = greetSlot(), p = partner(); if(!slot || !p) return;
    const k = dayKeyOf(); let completed = false;
    const ns = await update("daily", st=>{
      st = st || { days:{}, done:0, best:{} }; st.days = st.days||{}; st.best = st.best||{};
      const d = st.days[k] = st.days[k] || {}, x = d[slot] = d[slot] || {};
      if(x[me.uid]) return undefined;
      x[me.uid] = Date.now(); completed = !!x[p.user_id];
      if(completed){ st.done = (st.done||0)+1; }
      const kn = q => q.split("-").reduce((t,v)=>t*100+ +v, 0); const keys = Object.keys(st.days).sort((a,b)=>kn(b)-kn(a)); for(const old of keys.slice(60)) delete st.days[old];
      return st;
    });
    if(!ns) return;
    const n = streak(ns, slot);
    if(completed && n > ((ns.best||{})[slot]||0)){ await update("daily", st=>{ if(!st) return undefined; st.best = st.best||{}; if(n <= (st.best[slot]||0)) return undefined; st.best[slot] = n; return st; }); }
    SFX.select();
    const [ic, word] = SLOT[slot];
    const body = completed ? `${ic} ${me.name} 也說${word}了！${word}連續 🔥${n} 天・小魚乾 +2 🐟` : `${ic} ${me.name} 說${word}！${slot==="m"?"今天也要加油喔":"好好睡喔"} 💗`;
    try{ const row = await B.send(body, "greet", me.name, me.cat); addMessage(row); }catch(e){}
    if(completed){ SFX.level(); burst(); toast(`${sprite(me.cat||"orange","love")} ${word}連續 ${n} 天！我們的貓多了 2 條小魚乾`, 3500); }
    else toast(`${sprite(me.cat||"orange", slot==="m"?"wave":"sleep")} 已經跟 ${esc(p.name)} 說${word}，等 ta 也說就算一天`);
  }
  function onMood(st){
    const prev = moodSt; moodSt = st;
    const mk = st && st.makeup && st.makeup.last;
    if(mk && shownMakeup!==null && mk.n !== shownMakeup) playHug(mk.n);
    if(mk) shownMakeup = mk.n; else if(shownMakeup===null) shownMakeup = 0;
    lastHdr = ""; renderHeader();
    if(route==="home"){ const c=$("care"); if(c){ const tmp=document.createElement("div"); tmp.innerHTML=careCard(); c.replaceWith(tmp.firstChild); bindCare($("view")); } const tb=$("truceHome"); if(tb) tb.innerHTML = truceBar(); }
    document.querySelectorAll(".chatTruce").forEach(e=>e.innerHTML = truceBar()+busyBar());
    refreshStatus(true);
    if(chatVisible()) drawList(false);
  }

  // ---------- album ----------
  const ALBUM_LIMIT = 1e9;   // Supabase free plan: 1 GB of file storage
  const thumbOf = p => p.replace(/\.\w+$/, "_t.jpg");
  const fmtMB = b => b >= 1e9 ? (b/1e9).toFixed(2)+" GB" : b < 1e5 ? Math.max(1,Math.round(b/1e3))+" KB" : (b/1e6).toFixed(b<1e8?1:0)+" MB";
  let urlCache = {}; try{ urlCache = JSON.parse(store.get("mw_urls")||"{}"); }catch(e){}
  async function getUrls(paths){
    const now = Date.now(), need = [...new Set(paths)].filter(p=>!(urlCache[p] && urlCache[p][1] > now+3600e3));
    if(need.length){
      for(let i=0;i<need.length;i+=60){ const part = need.slice(i,i+60); let got = {}; try{ got = await B.imageUrls(part); }catch(e){} for(const p of part) urlCache[p] = [got[p]||"", now+6.5*864e5]; }
      const keys = Object.keys(urlCache); if(keys.length > 4000) keys.slice(0, keys.length-4000).forEach(k=>delete urlCache[k]);
      store.set("mw_urls", JSON.stringify(urlCache));
    }
    return Object.fromEntries(paths.map(p=>[p, urlCache[p] ? urlCache[p][0] : ""]));
  }
  async function urlFor(path){ if(imgCache[path]) return imgCache[path]; const u = (await getUrls([path]))[path]; if(u) imgCache[path] = u; return u; }
  const LEVEL_MSG = [null,
    p=>`📷 相簿已經用了 ${p}%，可以開始整理一下照片囉`,
    p=>`📷 相簿快滿了！已經用了 ${p}%，該刪一些照片了 🥺`,
    p=>`🚨 相簿幾乎滿了（${p}%）！再不刪照片就傳不了新照片了`];
  async function checkCapacity(st){
    const pct = (st.bytes||0)/ALBUM_LIMIT, lv = pct>=.95?3 : pct>=.85?2 : pct>=.7?1 : 0, warned = st.warned||0;
    if(lv === warned) return;
    const ok = await update("album", s=>{ if(!s || (s.warned||0)===lv) return undefined; s.warned = lv; return s; });
    if(!ok || lv < warned) return;
    const p = Math.round(pct*100);
    try{ const row = await B.send(LEVEL_MSG[lv](p), "album", me.name, me.cat); addMessage(row); }catch(e){}
    const o = modal(`<h3>${lv>=3?"🚨":"📷"} 相簿${lv>=2?"快滿了":"用了不少"}！</h3><p>已經用了 <b>${fmtMB(st.bytes)}</b> / 1 GB（${p}%）<br>${lv>=2?"該刪一些照片了，不然之後會傳不了新照片 🥺":"可以開始整理一下舊照片囉"}</p><p class="k">${esc(partner()?partner().name:"另一半")} 也會收到通知</p>
      <button class="btn" id="cpGo" style="width:100%">去相簿整理</button><button class="btn sub" id="cpLater" style="width:100%;margin-top:8px">晚點再說</button>`);
    o.querySelector("#cpGo").addEventListener("click", ()=>{ o.remove(); go("album"); });
    o.querySelector("#cpLater").addEventListener("click", ()=>o.remove());
  }
  async function recountAlbum(){
    const u = await B.photoUsage();
    const st = await update("album", s=>{ s = s || { warned:0 }; s.bytes = u.bytes; s.count = u.count; s.at = Date.now(); return s; });
    if(st) checkCapacity(st);
    return u;
  }
  function onAlbumState(st){
    const del = new Set((st && st.deleted) || []); let changed = false;
    for(const m of messages){ if(del.has(m.id) && m.kind==="image"){ m.kind = "photo_gone"; m.media = null; changed = true; } }
    if(changed && chatVisible()) drawList(false);
    if(route==="album" && album.rows){ const before = album.rows.length; album.rows = album.rows.filter(r=>!del.has(r.id)); if(album.rows.length!==before) drawAlbum(); }
    if(route==="album") drawUsage();
  }
  const album = { rows:null, filter:"all", sel:null };
  function drawUsage(){
    const el = $("alUse"); if(!el) return;
    const st = stateCache.album && stateCache.album.state; if(!st){ el.innerHTML = "還沒有照片"; return; }
    const pct = Math.min(1, (st.bytes||0)/ALBUM_LIMIT), avg = st.count ? st.bytes/st.count : 3e5, left = Math.max(0, Math.floor((ALBUM_LIMIT-(st.bytes||0))/avg));
    el.innerHTML = `<div class="auTop"><span>已用 <b>${fmtMB(st.bytes||0)}</b> / 1 GB</span><span>${st.count||0} 張</span></div><div class="pbBar auBar"><i class="${pct>=.85?"low":pct>=.7?"mid":""}" style="width:${Math.max(1,pct*100)}%"></i></div>
      <div class="auTip">${pct>=.85?"🥺 快滿了，刪一些不需要的照片吧":pct>=.7?"📷 用了七成囉，可以開始整理":`大約還能再放 ${left} 張照片`}</div>`;
  }
  async function viewAlbum(v){
    const p = partner();
    album.sel = null;
    v.innerHTML = `<div class="box album"><div class="alHd"><h2>📷 我們的相簿</h2><button class="btn sub" id="alSel">選取</button></div>
      <div class="alUse" id="alUse"></div>
      <div class="alTabs" id="alTabs">${[["all","全部"],["me","我傳的"],["them",(p?esc(p.name):"ta")+" 傳的"]].map(([k,n])=>`<button data-f="${k}" class="${album.filter===k?"on":""}">${n}</button>`).join("")}</div>
      <div class="alGrid" id="alGrid"><div class="k">載入中…</div></div></div>`;
    const bar = document.createElement("div"); bar.className = "alBar hidden"; bar.id = "alBar";
    bar.innerHTML = `<span id="alCnt">已選 0 張</span><button class="btn sub" id="alOld">選最舊 30 張</button><button class="btn" id="alDel">🗑 刪除</button>`;
    document.body.appendChild(bar);
    drawUsage();
    $("alTabs").querySelectorAll("[data-f]").forEach(b=>b.addEventListener("click", ()=>{ album.filter = b.dataset.f; $("alTabs").querySelectorAll("button").forEach(x=>x.classList.toggle("on", x===b)); drawAlbum(); }));
    $("alSel").addEventListener("click", ()=>{ album.sel = album.sel ? null : new Set(); $("alSel").textContent = album.sel ? "取消" : "選取"; drawAlbum(); });
    $("alOld").addEventListener("click", ()=>{ const rows = shownRows(); rows.slice(-30).forEach(r=>album.sel.add(r.id)); drawAlbum(); });
    $("alDel").addEventListener("click", ()=>{ if(album.sel && album.sel.size) confirmDelete(album.rows.filter(r=>album.sel.has(r.id))); });
    try{ album.rows = await B.images(); }catch(e){ $("alGrid").innerHTML = `<div class="k">相簿載入失敗，請檢查網路</div>`; return; }
    if(route!=="album") return;
    drawAlbum();
    recountAlbum().then(()=>drawUsage()).catch(()=>{});
  }
  const shownRows = () => (album.rows||[]).filter(r=> album.filter==="all" || (album.filter==="me") === (r.sender===me.uid));
  let alObs = null;
  function drawAlbum(){
    const g = $("alGrid"); if(!g || !album.rows) return;
    const rows = shownRows();
    if(!rows.length){ g.innerHTML = `<div class="alEmpty">${sprite(me.cat||"orange","sleep")}<div>${album.rows.length?"這裡還沒有照片":"還沒有照片～<br>在聊天室按 📷 傳照片，就會自動收進相簿"}</div></div>`; updBar(); return; }
    let html = "", mon = "";
    for(const r of rows){
      const d = new Date(r.created_at), mk = `${d.getFullYear()} 年 ${d.getMonth()+1} 月`;
      if(mk!==mon){ if(mon) html += `</div>`; mon = mk; html += `<div class="alMon">${mk}</div><div class="alRow">`; }
      const on = album.sel && album.sel.has(r.id);
      html += `<button class="alCell ${on?"on":""} ${album.sel?"selmode":""}" data-id="${r.id}"><img data-p="${esc(r.media)}" alt="">${r.sender!==me.uid?`<span class="alWho">${sprite(r.cat||catOf(r.sender),"normal")}</span>`:""}${album.sel?`<span class="alChk">${on?"✔":""}</span>`:""}</button>`;
    }
    g.innerHTML = html + `</div>`;
    g.querySelectorAll(".alCell").forEach(c=>c.addEventListener("click", ()=>{
      const id = +c.dataset.id;
      if(album.sel){ album.sel.has(id) ? album.sel.delete(id) : album.sel.add(id); c.classList.toggle("on"); c.querySelector(".alChk").textContent = album.sel.has(id)?"✔":""; updBar(); return; }
      openAlbumPhoto(rows.findIndex(r=>r.id===id), rows);
    }));
    if(alObs) alObs.disconnect();
    let pend = [], tmr = null;
    const flush = async ()=>{ const imgs = pend; pend = []; tmr = null;
      const th = await getUrls(imgs.map(i=>thumbOf(i.dataset.p)));
      const miss = imgs.filter(i=>!th[thumbOf(i.dataset.p)]);
      const full = miss.length ? await getUrls(miss.map(i=>i.dataset.p)) : {};
      for(const i of imgs){ const u = th[thumbOf(i.dataset.p)] || full[i.dataset.p] || imgCache[i.dataset.p]; if(u) i.src = u; else i.alt = "載入失敗"; } };
    alObs = new IntersectionObserver(es=>{ for(const e of es){ if(e.isIntersecting){ alObs.unobserve(e.target); pend.push(e.target); } } if(pend.length && !tmr) tmr = setTimeout(flush, 80); }, { rootMargin:"300px" });
    g.querySelectorAll("img[data-p]").forEach(i=>alObs.observe(i));
    updBar();
  }
  function updBar(){
    const bar = $("alBar"); if(!bar) return;
    bar.classList.toggle("hidden", !album.sel);
    if(album.sel){ const st = stateCache.album && stateCache.album.state, avg = st && st.count ? st.bytes/st.count : 3e5;
      $("alCnt").innerHTML = `已選 <b>${album.sel.size}</b> 張${album.sel.size?`<br><small>約可空出 ${fmtMB(album.sel.size*avg)}</small>`:""}`; $("alDel").disabled = !album.sel.size; }
  }
  async function openAlbumPhoto(i, rows){
    const r = rows[i]; if(!r) return;
    const o = document.createElement("div"); o.className = "viewer alView";
    const d = new Date(r.created_at);
    o.innerHTML = `<div class="avTop"><span>${esc(r.sender===me.uid?"你":(r.name||nameOf(r.sender)))}・${d.getMonth()+1}/${d.getDate()} ${hhmm(r.created_at)}</span><button class="avX">✕</button></div>
      <div class="avImg">${i>0?`<button class="avNav l">◀</button>`:""}<img alt="照片">${i<rows.length-1?`<button class="avNav r">▶</button>`:""}</div>
      <div class="avBtns"><button class="btn sub" id="avSave">⬇ 存到手機</button><button class="btn" id="avDel">🗑 刪除</button></div>`;
    document.body.appendChild(o);
    const img = o.querySelector("img"); const th = urlCache[thumbOf(r.media)]; if(th && th[0]) img.src = th[0];
    urlFor(r.media).then(u=>{ if(u) img.src = u; });
    const close = ()=>o.remove();
    o.querySelector(".avX").addEventListener("click", close);
    o.addEventListener("click", e=>{ if(e.target===o || e.target.classList.contains("avImg")) close(); });
    const l = o.querySelector(".avNav.l"), rr = o.querySelector(".avNav.r");
    if(l) l.addEventListener("click", ()=>{ close(); openAlbumPhoto(i-1, rows); });
    if(rr) rr.addEventListener("click", ()=>{ close(); openAlbumPhoto(i+1, rows); });
    let sx = null; img.addEventListener("touchstart", e=>{ sx = e.touches[0].clientX; }, {passive:true});
    img.addEventListener("touchend", e=>{ if(sx==null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if(Math.abs(dx)>60){ const j = dx<0 ? i+1 : i-1; if(rows[j]){ close(); openAlbumPhoto(j, rows); } } });
    o.querySelector("#avSave").addEventListener("click", async ()=>{
      try{ const u = await urlFor(r.media); const blob = await (await fetch(u)).blob(); const f = new File([blob], `meow-${r.id}.jpg`, { type: blob.type||"image/jpeg" });
        if(navigator.canShare && navigator.canShare({ files:[f] })){ await navigator.share({ files:[f] }); return; }
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); toast("照片下載中 📥");
      }catch(e){ if(e && e.name==="AbortError") return; toast("存不下來的話，長按照片選「下載圖片」", 4000); }
    });
    o.querySelector("#avDel").addEventListener("click", ()=>{ confirmDelete([r], close); });
  }
  function confirmDelete(rows, after){
    const n = rows.length;
    const o = modal(`<h3>🗑 要刪掉 ${n} 張照片嗎？</h3><p>你們兩個的相簿和聊天室裡都會消失，<br><b>刪了就救不回來喔</b></p>
      <button class="btn" id="dlYes" style="width:100%">確定刪除</button><button class="btn sub" id="dlNo" style="width:100%;margin-top:8px">不要刪</button>`);
    o.querySelector("#dlNo").addEventListener("click", ()=>o.remove());
    o.querySelector("#dlYes").addEventListener("click", async ()=>{
      o.querySelector("#dlYes").disabled = true; o.querySelector("#dlYes").textContent = "刪除中…";
      try{
        for(let i=0;i<rows.length;i+=50) await B.deletePhotos(rows.slice(i,i+50));
        o.remove(); if(after) after();
        const ids = rows.map(r=>r.id);
        await update("album", s=>{ s = s || {}; s.deleted = (s.deleted||[]).concat(ids).slice(-400); return s; });
        album.rows = (album.rows||[]).filter(r=>!ids.includes(r.id)); if(album.sel) album.sel = new Set();
        drawAlbum(); SFX.del(); toast(`${sprite(me.cat||"orange","happy")} 刪掉 ${n} 張照片了`);
        recountAlbum().then(()=>drawUsage()).catch(()=>{});
      }catch(e){
        o.remove(); console.error(e);
        if(String(e.message||e).includes("NEED_SQL")) modal(`<h3>還差一步 🔧</h3><p>刪除照片要先在 Supabase 開啟權限：<br>用電腦到 Supabase → <b>SQL Editor</b>，執行 <b>update_5_album.sql</b> 就好（只要做一次）。</p>`);
        else toast("刪除失敗："+esc(e.message||e), 5000);
      }
    });
  }
  // ---------- settings ----------
  function viewSettings(v){
    const ps=pushState();
    v.innerHTML = `<div class="box set"><h2>我的貓</h2><div class="picks" id="pk"></div><input id="nm" maxlength="10" value="${esc(me.name)}" style="font-size:17px;padding:8px;border:3px solid var(--line);text-align:center;border-radius:0"><button class="btn" id="bSave">儲存</button></div>
      <div class="box set"><h2>鍵盤配色</h2><div class="themes" id="thm">${KB_THEMES.map(([id,n,bg,ac])=>`<button data-t="${id}" class="${(store.get("mw_kb")||"strawberry")===id?"on":""}"><span class="sw" style="background:${bg}"><i style="background:${ac}"></i><i></i><i></i></span>${n}</button>`).join("")}</div>
        <h2 style="margin-top:8px">打字動畫</h2><div class="anims" id="anm">${KB_ANIMS.map(([id,n])=>`<button data-a="${id}" class="${(store.get("mw_anim")||"jelly")===id?"on":""}">${n}</button>`).join("")}</div>
        <div class="k">點一下可以預覽，只會改變你自己的手機。</div></div>
      <div class="box set"><h2>聊天背景</h2><div class="walls" id="wls">${WALLS.map(([id,n])=>`<button data-w="${id}" class="${(store.get("mw_wall")||"paws")===id?"on":""}"><span class="wv" data-wall="${id}"><span class="chat"><span class="list"></span></span></span>${n}</button>`).join("")}</div>
        <div class="k">「我的照片」可以選一張你們的合照當背景（只存在這支手機）。</div></div>
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
    // wallpaper previews reuse the real CSS by scoping data-wall on each swatch
    $("wls").querySelectorAll(".wv").forEach(v=>{ const id=v.dataset.wall; v.querySelector(".list").style.cssText = wallCss(id); });
    $("wls").querySelectorAll("button").forEach(b=>b.addEventListener("click", async ()=>{
      const id=b.dataset.w;
      if(id==="photo"){ const ok = await pickWallPhoto(); if(!ok) return; } else { store.set("mw_wall", id); applyWall(); }
      $("wls").querySelectorAll("button").forEach(x=>x.classList.toggle("on", x===b)); SFX.select();
      $("wls").querySelectorAll(".wv").forEach(v=>{ v.querySelector(".list").style.cssText = wallCss(v.dataset.wall); });
      toast(`${sprite(me.cat||"orange","love")} 聊天背景換好了！`);
    }));
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
    { const ab=$("alBar"); if(ab) ab.remove(); }
    if(curGame && curGame.unmount){ try{ curGame.unmount(); }catch(e){} } curGame=null; closeSheet(); kb=null; document.body.classList.remove("kbd"); const ofab=$("fab"); if(ofab) ofab.remove();
    route = r.startsWith("game-") ? "game" : r;
    document.body.classList.toggle("compact", route!=="home");
    document.body.classList.toggle("ingame", route==="game");
    document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on", b.dataset.go===route || (route==="game"&&b.dataset.go==="home")));
    const v=$("view");
    if(route==="chat") viewChat(v);
    else if(route==="settings") viewSettings(v);
    else if(route==="album") viewAlbum(v);
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
    try{ const md = await getState("mood"); moodSt = md ? clone(md.state) : null; shownMakeup = moodSt && moodSt.makeup && moodSt.makeup.last ? moodSt.makeup.last.n : 0; }catch(e){}
    onState("mood", onMood);
    for(const g of ["daily","pet","fishing","album"]) await getState(g).catch(()=>{});
    onState("album", onAlbumState);
    setTimeout(()=>{ const a = stateCache.album && stateCache.album.state; if(!a || Date.now()-(a.at||0) > 12*3600e3) recountAlbum().catch(()=>{}); }, 4000);
    onState("daily", ()=>refreshHomeBox("dailyBox", dailyCard, bindDaily));
    onState("pet", ()=>refreshHomeBox("petGo", petStrip, v=>{ const pg=$("petGo"); if(pg) pg.addEventListener("click", ()=>go("game-pet")); }));
    clearInterval(truceTimer); truceTimer = setInterval(tickTruce, 1000);
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
    setupHaptic(); applyKbTheme(); applyWall();
    document.addEventListener("pointerdown", e=>{ if(e.button>0) return; tapFx(e.clientX,e.clientY); haptic(); SFX.tap(); }, {passive:true});
    $("midHeart").innerHTML = icon("heart");
    $("niHome").innerHTML = icon("home"); $("niChat").innerHTML = icon("chat"); $("niSet").innerHTML = icon("gear"); $("niAlb").innerHTML = icon("camera");
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
