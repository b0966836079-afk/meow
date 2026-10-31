// 我們的貓：兩個人一起養的小貓。用小魚乾餵牠、摸摸牠、陪牠玩，會慢慢長大。
// 小魚乾來源：默契大考驗答對（hearts）＋ 釣魚每 5 條 ＋ 早安/晚安一起打卡每次 2 條 ＋ 領養禮 5 條，扣掉已經餵掉的。
(function(){
const STAGES = [[0,"小奶貓",.5],[8,"小貓",.64],[25,"大貓",.78],[60,"胖胖貓",.9],[120,"貓咪大王",.95]];
const DECAY = 2.2;            // fullness lost per hour (~45h from full to empty)
const dayKey = t => { const d = new Date((t||Date.now()) - 4*3600e3); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); };
const P = {
  STAGES,
  fullness(p, now){ if(!p) return 0; return Math.max(0, Math.min(100, p.full - ((now||Date.now()) - p.at)/3600e3*DECAY)); },
  stage(p){ let i=0; const e=(p&&p.exp)||0; while(i+1<STAGES.length && e>=STAGES[i+1][0]) i++; return { i, name:STAGES[i][1], scale:STAGES[i][2], next: STAGES[i+1]||null }; },
  earned(moqi, fishing, daily){
    let fish = 0; const dex = fishing && fishing.dex || {};
    for(const u in dex) for(const id in dex[u]) fish += dex[u][id]||0;
    return ((moqi&&moqi.hearts)||0) + Math.floor(fish/5) + ((daily&&daily.done)||0)*2;
  },
  food(p, earned){ return Math.max(0, earned + ((p&&p.gift)||0) - ((p&&p.spent)||0)); },
  mood(p){
    const f = P.fullness(p), h = new Date().getHours();
    if(f < 15) return { face:"curl", text:"餓扁了…快餵我 🥺", hungry:2 };
    if(f < 40) return { face:"cry", text:"肚子餓了～", hungry:1 };
    if(h>=0 && h<6) return { face:"sleep", text:"呼嚕呼嚕睡覺中", hungry:0 };
    if(f >= 70) return { face:"happy", text:"吃飽飽，好開心！", hungry:0 };
    return { face:"normal", text:"在等你們陪牠玩", hungry:0 };
  },
  dayKey,
};
window.PetLogic = P;

const COLORS = ["orange","white","calico","black","gray"];
const NAMES = ["小吐司","麻糬","布丁","奶茶","豆花","湯圓","饅頭","芋圓"];

App.registerGame({
  id: "pet",
  hidden: true,
  name: "我們的貓",
  desc: "一起養的小貓",
  icon: () => Pix.sprite("orange","loaf"),
  mount(el, ctx){
    const { sprite, esc, SFX, icon } = ctx;
    let s = null, src = { moqi:null, fishing:null, daily:null }, lastLog = null, timer = null, busy = false;
    const subs = [];
    const me = () => ctx.me.uid;
    const $ = q => el.querySelector(q);

    function adopt(){
      let pick = "white", name = NAMES[Math.floor(Math.random()*NAMES.length)];
      el.innerHTML = `<div class="box petAdopt">
        <h2>🐾 領養一隻我們的貓</h2>
        <p>你們兩個一起養，用小魚乾餵牠、摸摸牠，牠會慢慢長大～</p>
        <div class="paCats" id="paCats">${COLORS.map(c=>`<button data-c="${c}" class="${c===pick?"on":""}">${sprite(c,"normal")}<i>${Pix.CNAME[c]}</i></button>`).join("")}</div>
        <label class="paName">名字 <input id="paNm" maxlength="8" value="${esc(name)}"></label>
        <div class="paSug">${NAMES.map(n=>`<button data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div>
        <button class="btn" id="paGo" style="width:100%">🏠 帶牠回家</button>
        <div class="k">領養禮：送 5 條小魚乾 🐟</div></div>`;
      el.querySelectorAll("[data-c]").forEach(b=>b.addEventListener("click", ()=>{ pick=b.dataset.c; el.querySelectorAll("[data-c]").forEach(x=>x.classList.toggle("on",x===b)); SFX.select(); }));
      el.querySelectorAll("[data-n]").forEach(b=>b.addEventListener("click", ()=>{ $("#paNm").value=b.dataset.n; SFX.tap(); }));
      $("#paGo").addEventListener("click", async ()=>{
        const nm = ($("#paNm").value||"").trim().slice(0,8) || "小吐司";
        const ns = await ctx.update("pet", st => st ? undefined : { name:nm, color:pick, born:Date.now(), full:70, at:Date.now(), exp:0, spent:0, gift:5, log:[{by:me(),a:"adopt",at:Date.now()}], petDay:{}, playDay:{} });
        if(ns){ SFX.level(); ctx.burst(); ctx.notifyPartner(`${ctx.me.name} 領養了我們的貓「${nm}」！快來看牠 🐾`); }
      });
    }

    function shell(){
      el.innerHTML = `<div class="box petBox">
        <div class="petHd"><button class="petName" id="ptName"></button><span class="petStage" id="ptStage"></span></div>
        <div class="petRoom" id="ptRoom">
          <div class="prWin"></div><div class="prFloor"></div><div class="prRug"></div>
          <div class="prBowl" id="ptBowl">🥣</div>
          <div class="prCat" id="ptCat"></div><div class="prSay" id="ptSay"></div>
        </div>
        <div class="petBars">
          <div class="pb"><span>🍗 飽足</span><div class="pbBar"><i id="ptFull"></i></div><b id="ptFullN"></b></div>
          <div class="pb"><span>⭐ 長大</span><div class="pbBar exp"><i id="ptExp"></i></div><b id="ptExpN"></b></div>
        </div>
        <div class="petBtns">
          <button id="ptFeed"><span>${icon("fish")}</span>餵小魚乾<i id="ptFood"></i></button>
          <button id="ptPet"><span>✋</span>摸摸<i id="ptPetI"></i></button>
          <button id="ptPlay"><span>🧶</span>逗貓棒<i id="ptPlayI"></i></button>
        </div>
        <div class="petHow">小魚乾怎麼來：默契大考驗答對 +1・釣魚每 5 條 +1・兩個人都說早安/晚安 +2</div>
        <ul class="petLog" id="ptLog"></ul></div>`;
      $("#ptFeed").addEventListener("click", feed);
      $("#ptPet").addEventListener("click", ()=>care("pet"));
      $("#ptPlay").addEventListener("click", ()=>care("play"));
      $("#ptCat").addEventListener("click", ()=>care("pet"));
      $("#ptName").addEventListener("click", rename);
    }

    const earned = () => P.earned(src.moqi, src.fishing, src.daily);
    const ago = t => { const m = Math.round((Date.now()-t)/60000); return m<1?"剛剛":m<60?`${m} 分鐘前`:m<1440?`${Math.round(m/60)} 小時前`:`${Math.round(m/1440)} 天前`; };
    const LOGT = { adopt:"領養了牠 🏠", feed:"餵了小魚乾 🐟", pet:"摸摸牠 ✋", play:"陪牠玩逗貓棒 🧶", grow:"", rename:"幫牠改了名字 ✏️" };

    function render(){
      if(!s){ adopt(); return; }
      if(!$("#ptRoom")) shell();
      const f = P.fullness(s), st = P.stage(s), md = P.mood(s), food = P.food(s, earned()), dk = P.dayKey();
      $("#ptName").textContent = s.name + " ✏️";
      $("#ptStage").textContent = st.name;
      const cat = $("#ptCat");
      if(!cat.dataset.busy){ cat.innerHTML = (st.i===4?`<span class="crown">👑</span>`:"") + sprite(s.color, md.face); }
      cat.style.setProperty("--sc", st.scale);
      $("#ptSay").textContent = md.text;
      $("#ptSay").classList.toggle("hungry", md.hungry>0);
      $("#ptFull").style.width = f+"%"; $("#ptFull").className = f<15?"low":f<40?"mid":"";
      $("#ptFullN").textContent = Math.round(f);
      const lo = STAGES[st.i][0], hi = st.next ? st.next[0] : lo;
      $("#ptExp").style.width = (st.next ? ((s.exp-lo)/(hi-lo))*100 : 100)+"%";
      $("#ptExpN").textContent = st.next ? `${s.exp}/${hi}` : "MAX";
      $("#ptFood").textContent = `剩 ${food} 條`;
      $("#ptPetI").textContent = (s.petDay||{})[me()]===dk ? "今天 ⭐ 拿過了" : "今天 +1 ⭐";
      $("#ptPlayI").textContent = (s.playDay||{})[me()]===dk ? "今天 ⭐ 拿過了" : "今天 +1 ⭐";
      $("#ptLog").innerHTML = (s.log||[]).slice(-6).reverse().map(l=>`<li><b>${esc(l.by===me()?"你":ctx.nameOf(l.by))}</b> ${l.a==="grow"?`看到牠長大成「${esc(l.t||"")}」🎉`:LOGT[l.a]||""}<i>${ago(l.at)}</i></li>`).join("");
    }

    function catAnim(face, keyframes, ms){
      const cat = $("#ptCat"); if(!cat) return; const st = P.stage(s);
      cat.dataset.busy = "1"; cat.innerHTML = (st.i===4?`<span class="crown">👑</span>`:"") + sprite(s.color, face);
      cat.animate(keyframes, { duration: ms, easing:"ease-out" });
      clearTimeout(catAnim._t); catAnim._t = setTimeout(()=>{ delete cat.dataset.busy; render(); }, ms+500);
    }
    function pop(text){ const r = $("#ptRoom"); if(!r) return; const d = document.createElement("div"); d.className = "prPop"; d.innerHTML = text; r.appendChild(d); setTimeout(()=>d.remove(), 1400); }

    function playFeed(){
      const r = $("#ptRoom"); if(!r) return;
      const fsh = document.createElement("div"); fsh.className = "prFish"; fsh.innerHTML = icon("fish"); r.appendChild(fsh);
      fsh.animate([{transform:"translate(0,0) rotate(0)"},{transform:"translate(-90px,-40px) rotate(-200deg)",offset:.5},{transform:"translate(-150px,10px) rotate(-360deg) scale(.6)",opacity:1},{opacity:0}],{duration:700,easing:"ease-in",fill:"forwards"}).onfinish=()=>fsh.remove();
      setTimeout(()=>{ SFX.coin(); catAnim("happy", [{transform:"scale(var(--sc))"},{transform:"scale(calc(var(--sc)*1.08),calc(var(--sc)*.92))"},{transform:"scale(var(--sc))"},{transform:"scale(calc(var(--sc)*1.08),calc(var(--sc)*.92))"},{transform:"scale(var(--sc))"}], 700); pop("+25 🍗"); }, 650);
    }
    function playPet(){ SFX.meow(1.2); catAnim("love", [{transform:"scale(var(--sc)) rotate(0)"},{transform:"scale(var(--sc)) rotate(-6deg)"},{transform:"scale(var(--sc)) rotate(6deg)"},{transform:"scale(var(--sc)) rotate(0)"}], 900); pop("💗"); setTimeout(()=>pop("💕"),300); }
    function playPlay(){
      const r = $("#ptRoom"); if(!r) return;
      const y = document.createElement("div"); y.className = "prYarn"; y.textContent = "🧶"; r.appendChild(y);
      y.animate([{transform:"translate(0,0)"},{transform:"translate(-60px,-70px)"},{transform:"translate(-120px,0)"},{transform:"translate(-60px,-50px)"},{transform:"translate(0,0)"}],{duration:1400,easing:"ease-in-out"}).onfinish=()=>y.remove();
      SFX.jump(); setTimeout(()=>SFX.jump(), 500);
      catAnim("surprised", [{transform:"scale(var(--sc)) translateY(0)"},{transform:"scale(var(--sc)) translateY(-30%)"},{transform:"scale(var(--sc)) translateY(0)"},{transform:"scale(var(--sc)) translateY(-24%)"},{transform:"scale(var(--sc)) translateY(0)"}], 1300);
      setTimeout(()=>pop("好好玩！"), 900);
    }

    function grewMsg(before, after){
      if(after.i > before.i){ setTimeout(()=>{ SFX.level(); ctx.burst(); ctx.toast(`${sprite(s.color,"love")} ${esc(s.name)} 長大成「${after.name}」了！`, 4000); }, 900);
        ctx.notifyPartner(`我們的貓「${s.name}」長大成「${after.name}」了！🎉`); }
    }
    async function feed(){
      if(busy || !s) return;
      const f = P.fullness(s), food = P.food(s, earned());
      if(food < 1){ ctx.toast(`${sprite(s.color,"cry")} 沒有小魚乾了！玩默契大考驗、釣魚，或兩個人一起說早安晚安就能賺`, 4500); return; }
      if(f >= 95){ ctx.toast(`${sprite(s.color,"happy")} ${esc(s.name)} 吃不下了，晚點再餵～`); return; }
      busy = true; const before = P.stage(s);
      const ns = await ctx.update("pet", st=>{ if(!st) return undefined; const now = Date.now(); if(P.food(st, earned()) < 1) return undefined;
        st.full = Math.min(100, P.fullness(st, now) + 25); st.at = now; st.spent = (st.spent||0)+1; st.exp = (st.exp||0)+1;
        const a = P.stage(st); st.log = (st.log||[]).concat([{by:me(),a:"feed",at:now}], a.i>before.i?[{by:me(),a:"grow",t:a.name,at:now}]:[]).slice(-20); return st; });
      busy = false;
      if(ns){ s = ns; lastLog = logKey(ns); playFeed(); render(); grewMsg(before, P.stage(ns)); }
    }
    async function care(kind){
      if(busy || !s) return;
      const dk = P.dayKey(), field = kind==="pet" ? "petDay" : "playDay";
      if(kind==="play" && P.fullness(s) < 10){ ctx.toast(`${sprite(s.color,"curl")} 太餓了沒力氣玩…先餵牠吧`); return; }
      const gain = (s[field]||{})[me()] !== dk;
      kind==="pet" ? playPet() : playPlay();
      if(!gain) return;              // the animation is free, the ⭐ is once a day
      busy = true; const before = P.stage(s);
      const ns = await ctx.update("pet", st=>{ if(!st) return undefined; st[field] = st[field]||{}; if(st[field][me()]===dk) return undefined; const now = Date.now();
        st[field][me()] = dk; st.exp = (st.exp||0)+1;
        if(kind==="play"){ st.full = Math.max(0, P.fullness(st, now) - 5); st.at = now; }
        const a = P.stage(st); st.log = (st.log||[]).concat([{by:me(),a:kind,at:now}], a.i>before.i?[{by:me(),a:"grow",t:a.name,at:now}]:[]).slice(-20); return st; });
      busy = false;
      if(ns){ s = ns; lastLog = logKey(ns); setTimeout(()=>pop("+1 ⭐"), 400); render(); grewMsg(before, P.stage(ns)); }
    }
    function rename(){
      const nm = prompt("幫牠取新名字（最多 8 個字）", s.name); if(nm==null) return;
      const v = nm.trim().slice(0,8); if(!v || v===s.name) return;
      ctx.update("pet", st=>{ if(!st) return undefined; st.name = v; st.log = (st.log||[]).concat([{by:me(),a:"rename",at:Date.now()}]).slice(-20); return st; });
    }
    const logKey = st => { const l = st && st.log && st.log[st.log.length-1]; return l ? l.at+l.by+l.a : null; };

    function onPet(ns){
      const k = logKey(ns), prev = s;
      s = ns;
      if(prev && k && k!==lastLog){ const l = ns.log[ns.log.length-1];
        if(l.by!==me()){ if(l.a==="feed"){ playFeed(); } else if(l.a==="pet"){ playPet(); } else if(l.a==="play"){ playPlay(); } else if(l.a==="grow"){ SFX.level(); ctx.burst(); } } }
      lastLog = k;
      if(!prev && ns){ el.innerHTML = ""; }
      render();
    }
    (async()=>{
      for(const g of ["moqi","fishing","daily"]){ try{ const r = await ctx.getState(g); src[g] = r ? r.state : null; }catch(e){} subs.push(ctx.onState(g, st=>{ src[g] = st; if(s) render(); })); }
      const cur = await ctx.getState("pet").catch(()=>null);
      s = cur ? JSON.parse(JSON.stringify(cur.state)) : null; lastLog = logKey(s);
      subs.push(ctx.onState("pet", onPet));
      render();
      timer = setInterval(()=>{ if(s) render(); }, 30000);
    })();
    this._cleanup = () => { subs.forEach(u=>u&&u()); clearInterval(timer); };
  },
  unmount(){ if(this._cleanup) this._cleanup(); },
});
})();
