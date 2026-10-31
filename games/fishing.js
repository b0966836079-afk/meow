// 遊戲：喵喵釣魚大賽（60 秒一場，抓準時機拉竿；收集圖鑑、比最高分）
(function(){
// ---- fish catalogue: [name, rarity(0-4), shape, body, belly, fin] ----
const R = [
  { n:"普通", pts:10, w:.40, hits:1, spd:1.0, c:"#9aa3ad", p:50 },
  { n:"少見", pts:25, w:.32, hits:1, spd:1.25, c:"#5fb37d", p:28 },
  { n:"稀有", pts:60, w:.24, hits:2, spd:1.5, c:"#4f8fdc", p:15 },
  { n:"史詩", pts:150, w:.17, hits:3, spd:1.8, c:"#a66be0", p:6 },
  { n:"傳說", pts:500, w:.12, hits:4, spd:2.1, c:"#e8a628", p:1 },
];
const FISH = [
  ["小沙丁魚",0,"fish","#8fb3c9","#e8f1f6","#6d93ab"],["小鯽魚",0,"fish","#9aa58a","#e6e8d8","#7d8a6c"],["吳郭魚",0,"fish","#7d8a96","#d9dde0","#5f6b77"],
  ["小丑魚",0,"fish","#ff8a3d","#ffffff","#2b1d18"],["竹莢魚",0,"fish","#9fb7c4","#f2f6f8","#7a95a3"],["秋刀魚",0,"long","#7f95b8","#e9eef6","#5d7395"],
  ["小蝦米",0,"shrimp","#ff9e8a","#ffd9cf","#e8705a"],["寄居蟹",0,"crab","#e88a5a","#ffd0b0","#b85f35"],["舊靴子",0,"boot","#8a6a4a","#a88a68","#5a4030"],
  ["空罐罐",0,"can","#c9ced6","#ffffff","#9aa1ab"],["小河豚",0,"round","#e8d48a","#fff6d0","#b8a45a"],["鯖魚",0,"fish","#5f8fa8","#e8f0f2","#3f6f88"],
  ["黃尾鰤",1,"fish","#8fa8c0","#f0f4f8","#f0c84a"],["虹鱒",1,"fish","#9aa58f","#ffd0d8","#e87a9a"],["鱸魚",1,"fish","#6f8a78","#e0e8e0","#4f6a58"],
  ["花枝",1,"squid","#f0d0c0","#fff0e8","#d0a090"],["章魚",1,"squid","#e86a5a","#ffb0a0","#b84a3a"],["石斑",1,"fish","#a8805a","#f0dcc0","#806040"],
  ["鮭魚",1,"fish","#ff9a7a","#ffe0d0","#c8705a"],["鰻魚",1,"long","#5a6a4a","#c8d0a0","#3a4a2a"],["紅蟳",1,"crab","#d8503a","#ffb090","#a8301a"],
  ["鯛魚",1,"fish","#ff8a9a","#ffe0e6","#d85a6a"],["比目魚",1,"flat","#b89a78","#f0e6d6","#8a6a48"],["海星",1,"star","#ff9a5a","#ffd0a0","#d8703a"],
  ["鮪魚",2,"fish","#3f5f8f","#e0e8f2","#f0c84a"],["鬼頭刀",2,"fish","#5fc87a","#f0f080","#3a9a5a"],["旗魚",2,"long","#3f6fb8","#d8e6f6","#2a4f8a"],
  ["龍蝦",2,"shrimp","#c84a3a","#ff9a80","#8a2a1a"],["海馬",2,"seahorse","#f0b84a","#fff0c0","#c8902a"],["神仙魚",2,"tall","#f0f0f0","#ffffff","#3a3a3a"],
  ["鸚哥魚",2,"fish","#4ad0c0","#c0f0e8","#e870b0"],["燈籠魚",2,"round","#4a5a8a","#c0d0ff","#ffe060"],["鯉魚王",2,"fish","#ff6a3a","#ffe0a0","#ffffff"],
  ["水母",2,"jelly","#c0a0ff","#f0e8ff","#9070e0"],["藍鰭鮪",3,"fish","#2a4a8a","#e8f0ff","#4a8af0"],["翻車魚",3,"round","#a8b8c8","#f0f4f8","#7888a0"],
  ["魟魚",3,"flat","#6a7a8a","#e0e8f0","#4a5a6a"],["皇帶魚",3,"long","#e0e8f0","#ffffff","#ff5a5a"],["錘頭鯊",3,"shark","#7f8fa0","#e8eef4","#5a6a7a"],
  ["鬥魚",3,"tall","#e83a6a","#ff9ab8","#5a3ad8"],["櫻花蝦",3,"shrimp","#ffb0c8","#ffe8f0","#ff7aa0"],["夜光水母",3,"jelly","#7af0e0","#e0fff8","#4ad0c0"],
  ["彩虹鱒",3,"fish","#ff8a8a","#c0ffb0","#8a8aff"],["金魚將軍",3,"round","#ff7a2a","#ffd080","#ffffff"],["黃金鯨魚",4,"whale","#f0c040","#fff0b0","#c8902a"],
  ["龍宮使者",4,"long","#ff6a8a","#ffe0e8","#ffd040"],["星空魟",4,"flat","#2a2a5a","#8a8aff","#ffe060"],["彩虹錦鯉",4,"fish","#ff6a6a","#80ffd0","#a080ff"],
  ["貓咪魚",4,"cat","#f6b46a","#fff1df","#d98546"],["透明魚",4,"fish","#e8f8ff","#ffffff","#c0e8ff"],["鑽石蝦",4,"shrimp","#a0f0ff","#ffffff","#60c8e8"],
  ["月光鯊",4,"shark","#c8d0f0","#ffffff","#8890c0"],
].map((f,i)=>({ id:i, n:f[0], r:f[1], shape:f[2], b:f[3], l:f[4], f:f[5] }));

const SHAPES = {
  fish:  ["...FF......","..FBBBB...F",".BBBBBBB.FF","BEBBBBBBBFF","BBLLLLLBB.F",".BLLLLLB...","..FF......."],
  long:  ["............FF","..BBBBBBBBBBF.","BEBBBBBBBBBBBF","BBLLLLLLLLLLF.","..LLLLLLLLL..."],
  round: ["...F.F...","..BBBBB..",".BBBBBBB.","BEBBBBBBF","BBLLLLLBF",".BLLLLLB.","..BBBBB..","...F.F..."],
  tall:  ["....F.....","...FBB....","..BBBBB..F",".BEBBBBBFF",".BBLLLBBFF","..BBLLB..F","...BBB....","....F....."],
  flat:  ["....BBBB....","..BBBBBBBB..",".BBEBBBBBBB.","BBBBBBBBBBBB",".BBLLLLLLBB.","..BBBBBBBB.F","....BBBB..FF"],
  shark: [".....F.......","....FBB......","..BBBBBBBB..F",".BEBBBBBBBBFF","BBBLLLLLLBB.F",".BLLLLLLLB...","...F.........."],
  whale: ["............FF","...BBBBBB...F.","..BBBBBBBBBBF.",".BEBBBBBBBBBB.","BBLLLLLLLLBB..",".BLLLLLLLLB...","..BBBBBBBB...."],
  shrimp:["F........",".F.BBBB..","..BBBBBB.","..BEBBBBF","...BLLLBF","....BBBF.","......F.."],
  crab:  ["F.......F","FF.....FF",".F.E.E.F.","..BBBBB..",".BBBBBBB.","BBLLLLLBB",".F.F.F.F."],
  squid: ["..BBBB..",".BBBBBB.","BBEBBEBB","BBBBBBBB",".LLLLLL.",".F.F.F.F","F.F.F.F."],
  jelly: ["..BBBB..",".BBBBBB.","BBLBBLBB","BBBBBBBB",".F.F.F.F",".F..F..F","..F..F.."],
  seahorse:["..BBB.",".BEBBB","..BBF.","..BLF.","..BLB.","...BB.","..BB..","..B..."],
  star:  ["....B....","...BLB...","BBBBLBBBB",".BBLELBB.","..BBLBB..",".BB...BB.","BB.....BB"],
  boot:  ["..BBBB..","..BLLB..","..BLLB..","..BLLB..",".BBBBBBB","BBBBBBBB","FFFFFFFF"],
  can:   [".FFFFFF.","BBBBBBBB","BLLLLLLB","BL.EE.LB","BLLLLLLB","BBBBBBBB",".FFFFFF."],
  cat:   ["F.....F...","FB...BF...","BBBBBBB..F","BEBBBEB.FF","BBBLBBBBFF",".BLLLLB..F","..BBBB...."],
};
function fishSvg(f, silhouette){
  const rows = SHAPES[f.shape]||SHAPES.fish, w = rows[0].length, h = rows.length, pal = silhouette ? {B:"#3a3040",L:"#3a3040",F:"#3a3040",E:"#3a3040"} : {B:f.b,L:f.l,F:f.f,E:"#1d1a22"};
  let r = ""; rows.forEach((row,y)=>[...row].forEach((c,x)=>{ if(pal[c]) r += `<rect x="${x}" y="${y}" width="1.03" height="1.03" fill="${pal[c]}"/>`; }));
  const S = Math.max(w,h);
  return `<svg viewBox="${-(S-w)/2-.5} ${-(S-h)/2-.5} ${S+1} ${S+1}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${r}</svg>`;
}
function rollFish(){
  let x = Math.random()*100, tier = 0;
  for(let i=0;i<R.length;i++){ if(x < R[i].p){ tier = i; break; } x -= R[i].p; }
  const pool = FISH.filter(f=>f.r===tier); return pool[(Math.random()*pool.length)|0];
}

App.registerGame({
  id: "fishing",
  name: "釣魚大賽",
  desc: "60 秒釣魚，收集 52 種魚",
  icon: () => fishSvg(FISH[44]),
  mount(el, ctx){
    const { sprite, esc, SFX } = ctx;
    let s = null, view = "lobby", game = null, timers = [];
    el.innerHTML = `<div class="box fs" id="fsBox"></div>`;
    const box = el.querySelector("#fsBox");
    const me = () => ctx.me.uid;
    const clearT = () => { timers.forEach(t=>{ clearTimeout(t); clearInterval(t); }); timers = []; };
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));

    function lobby(){
      view = "lobby"; clearT();
      const p = ctx.partner(), dex = (s && s.dex) || {}, best = (s && s.best) || {};
      const mine = Object.keys(dex[me()]||{}).length, theirs = p ? Object.keys(dex[p.user_id]||{}).length : 0;
      const last = s && s.lastCatch;
      box.innerHTML = `<div class="fsHero">${sprite(ctx.me.cat,"happy")}<div class="fsRod"></div><div class="fsWater"></div></div>
        <div class="fsBoard">
          <div><b>${esc(ctx.me.name)}</b><span>最高 ${best[me()]||0} 分</span><span>圖鑑 ${mine}/${FISH.length}</span></div>
          ${p?`<div><b>${esc(p.name)}</b><span>最高 ${best[p.user_id]||0} 分</span><span>圖鑑 ${theirs}/${FISH.length}</span></div>`:""}
        </div>
        ${last ? `<div class="fsNews">📣 ${esc(ctx.nameOf(last.by))} 剛剛釣到 <b style="color:${R[FISH[last.id].r].c}">${R[FISH[last.id].r].n}・${esc(FISH[last.id].n)}</b>！</div>` : ""}
        <button class="btn fsGo" id="fsGo">開始釣魚！（60 秒）</button>
        <button class="btn sub" id="fsDex" style="width:100%;margin-top:8px">📖 圖鑑</button>
        <div class="fsRules">拋竿 → 浮標往下沉就快按「拉竿！」→ 看指針跑進綠色區域時按下去。<br>越稀有的魚，綠色區越窄、要按中的次數越多。</div>`;
      box.querySelector("#fsGo").addEventListener("click", start);
      box.querySelector("#fsDex").addEventListener("click", dexView);
    }
    function dexView(){
      view = "dex";
      const p = ctx.partner(), dex = (s && s.dex) || {}, mine = dex[me()]||{}, theirs = p ? (dex[p.user_id]||{}) : {};
      box.innerHTML = `<div class="fsDexHd"><button class="btn sub" id="fsBack">◀ 返回</button><b>魚類圖鑑 ${Object.keys(mine).length}/${FISH.length}</b></div>
        <div class="fsDex">${FISH.map(f=>{ const n = mine[f.id]||0, t = theirs[f.id]||0;
          return `<div class="fsCell ${n?"":"un"}" style="border-color:${R[f.r].c}">${fishSvg(f, !n)}<b>${n?esc(f.n):"？？？"}</b><i style="color:${R[f.r].c}">${R[f.r].n}</i>${n?`<span>x${n}</span>`:""}${t?`<em title="${p?esc(p.name):""}">💗</em>`:""}</div>`; }).join("")}</div>
        <div class="fsRules">💗 = ${p?esc(p.name):"對方"} 也釣過</div>`;
      box.querySelector("#fsBack").addEventListener("click", lobby);
    }
    // ---- one 60-second session ----
    function start(){
      view = "play"; clearT();
      game = { t:60, score:0, caught:[], phase:"idle", fish:null, hits:0, miss:0, pos:0, dir:1, zone:0 };
      box.innerHTML = `<div class="fsTop"><span id="fsT">⏱ 60</span><span id="fsS">0 分</span></div>
        <div class="fsPond" id="fsPond"><div class="fsCat">${sprite(ctx.me.cat,"normal")}</div><div class="fsLine" id="fsLine"></div><div class="fsBob" id="fsBob"></div><div class="fsBang hidden" id="fsBang">！</div><div class="fsCatch hidden" id="fsCatch"></div></div>
        <div class="fsReel hidden" id="fsReel"><div class="bar"><i class="zone" id="fsZone"></i><i class="needle" id="fsNeedle"></i></div><div class="lives" id="fsLives"></div></div>
        <button class="btn fsAct" id="fsAct">拋竿！</button>`;
      const act = box.querySelector("#fsAct");
      act.addEventListener("pointerdown", e=>{ e.preventDefault(); action(); });
      timers.push(setInterval(()=>{ game.t--; box.querySelector("#fsT").textContent = "⏱ "+game.t; if(game.t<=5 && game.t>0) SFX.beep(false); if(game.t<=0) finish(); }, 1000));
    }
    function setAct(t, cls){ const a = box.querySelector("#fsAct"); if(a){ a.textContent = t; a.className = "btn fsAct "+(cls||""); } }
    function action(){
      if(!game || game.t<=0) return;
      if(game.phase==="idle"){ cast(); }
      else if(game.phase==="wait"){ // pulled too early
        SFX.splash(); flash("太早了！魚跑掉了"); reset();
      } else if(game.phase==="bite"){ hook(); }
      else if(game.phase==="reel"){ reelTap(); }
    }
    function reset(){ game.phase="idle"; setAct("拋竿！"); const b=box.querySelector("#fsBob"); if(b) b.className="fsBob"; box.querySelector("#fsBang").classList.add("hidden"); box.querySelector("#fsReel").classList.add("hidden"); }
    function cast(){
      game.phase = "wait"; SFX.jump(); setAct("等魚上鉤…","wait");
      const bob = box.querySelector("#fsBob"); bob.className = "fsBob in";
      game.fish = rollFish();
      later(()=>{ if(game.phase!=="wait") return;
        game.phase = "bite"; bob.className = "fsBob in bite"; box.querySelector("#fsBang").classList.remove("hidden"); SFX.beep(true); setAct("拉竿！","go");
        if(navigator.vibrate) try{ navigator.vibrate(60); }catch(e){}
        later(()=>{ if(game.phase==="bite"){ SFX.splash(); flash("太慢了～魚跑掉了"); reset(); } }, 900);
      }, 1000 + Math.random()*2600);
    }
    function hook(){
      const tier = R[game.fish.r];
      game.phase = "reel"; game.hits = 0; game.miss = 0; game.pos = 0; game.dir = 1;
      box.querySelector("#fsBang").classList.add("hidden");
      const reel = box.querySelector("#fsReel"); reel.classList.remove("hidden");
      newZone(); setAct("按！","go"); SFX.charge();
      const step = () => { if(game.phase!=="reel") return; game.pos += game.dir * 0.018 * tier.spd; if(game.pos>1){ game.pos=1; game.dir=-1; } if(game.pos<0){ game.pos=0; game.dir=1; } box.querySelector("#fsNeedle").style.left = (game.pos*100)+"%"; };
      timers.push(setInterval(step, 16));
      lives();
    }
    function newZone(){ const w = R[game.fish.r].w; game.zone = Math.random()*(1-w); const z = box.querySelector("#fsZone"); z.style.left=(game.zone*100)+"%"; z.style.width=(w*100)+"%"; }
    function lives(){ const t = R[game.fish.r]; box.querySelector("#fsLives").innerHTML = `${"🎯".repeat(game.hits)}${"⚪".repeat(t.hits-game.hits)}　${"❤️".repeat(3-game.miss)}${"🖤".repeat(game.miss)}`; }
    function reelTap(){
      const t = R[game.fish.r], w = t.w;
      if(game.pos >= game.zone && game.pos <= game.zone + w){
        game.hits++; SFX.coin(); box.querySelector("#fsZone").animate([{filter:"brightness(1.6)"},{filter:"brightness(1)"}],{duration:200});
        if(game.hits >= t.hits){ caught(); return; }
        newZone();
      } else { game.miss++; SFX.miss(); box.querySelector("#fsReel").animate([{transform:"translateX(-6px)"},{transform:"translateX(6px)"},{transform:"none"}],{duration:200});
        if(game.miss >= 3){ clearT2(); flash("線斷了！魚跑掉了 😿"); reset(); return; } }
      lives();
    }
    function clearT2(){ /* stop needle interval (keep the clock) */ const clock = timers[0]; timers.slice(1).forEach(t=>{ clearInterval(t); clearTimeout(t); }); timers = [clock]; }
    function caught(){
      clearT2();
      const f = game.fish, t = R[f.r], cm = Math.round((8 + f.r*15 + Math.random()*(10+f.r*20))*10)/10;
      game.score += t.pts; game.caught.push(f.id);
      box.querySelector("#fsS").textContent = game.score + " 分";
      const c = box.querySelector("#fsCatch"); c.classList.remove("hidden");
      c.innerHTML = `<div class="fsCard" style="border-color:${t.c}"><i style="background:${t.c}">${t.n}</i>${fishSvg(f)}<b>${esc(f.n)}</b><span>${cm} cm・+${t.pts} 分</span></div>`;
      c.firstChild.animate([{transform:"scale(.3) rotate(-10deg)",opacity:0},{transform:"scale(1.15) rotate(3deg)",opacity:1,offset:.6},{transform:"scale(1)"}],{duration:450,easing:"ease-out"});
      if(f.r>=3){ SFX.level(); ctx.burst(); } else SFX.match();
      game.phase = "show"; box.querySelector("#fsReel").classList.add("hidden"); setAct("…");
      if(f.r>=3) save({ big: f.id });
      later(()=>{ c.classList.add("hidden"); if(game.t>0) reset(); }, f.r>=3 ? 1800 : 1100);
    }
    function flash(text){ const b = box.querySelector("#fsCatch"); b.classList.remove("hidden"); b.innerHTML = `<div class="fsMiss">${text}</div>`; later(()=>b.classList.add("hidden"), 900); }
    async function save(opt){
      opt = opt||{};
      const ids = game.caught.slice(), score = game.score;
      const ns = await ctx.update("fishing", st=>{
        st = st || { dex:{}, best:{}, lastCatch:null };
        const d = st.dex[me()] = st.dex[me()] || {};
        if(opt.final){ for(const id of ids) d[id] = (d[id]||0) + 1; if(score > (st.best[me()]||0)) st.best[me()] = score; }
        if(opt.big!=null) st.lastCatch = { by: me(), id: opt.big, at: Date.now() };
        return st;
      });
      if(opt.big!=null){ const f = FISH[opt.big]; ctx.notifyPartner(`${ctx.me.name} 在「釣魚大賽」釣到了${R[f.r].n}級的「${f.n}」！`); }
      return ns;
    }
    async function finish(){
      if(!game || game.phase==="end") return;
      clearT(); game.phase = "end";
      const prevBest = (s && s.best && s.best[me()]) || 0, prevDex = Object.keys((s && s.dex && s.dex[me()])||{});
      const newOnes = [...new Set(game.caught)].filter(id=>!prevDex.includes(String(id)));
      await save({ final:true });
      const rec = game.score > prevBest;
      if(rec && game.score>0){ ctx.notifyPartner(`${ctx.me.name} 在「釣魚大賽」刷新紀錄：${game.score} 分！`); }
      box.innerHTML = `<div class="fsEnd"><div class="fsBig">${sprite(ctx.me.cat, game.score?"love":"sleep")}</div>
        <div class="fsScore">${game.score} 分${rec&&game.score?`<em>新紀錄！</em>`:""}</div>
        <div>釣到 ${game.caught.length} 條魚${newOnes.length?`・<b>新圖鑑 +${newOnes.length}</b>`:""}</div>
        <div class="fsGot">${game.caught.map(id=>`<span title="${esc(FISH[id].n)}">${fishSvg(FISH[id])}</span>`).join("")||"（今天魚都不太餓…）"}</div>
        <button class="btn" id="fsAgain">再釣一場</button><button class="btn sub" id="fsHome" style="width:100%;margin-top:8px">回釣魚池</button></div>`;
      if(rec && game.score){ SFX.level(); ctx.burst(); } else SFX.next();
      box.querySelector("#fsAgain").addEventListener("click", start);
      box.querySelector("#fsHome").addEventListener("click", lobby);
    }
    this._u = ctx.onState("fishing", st=>{ s = st; if(view==="lobby") lobby(); });
    this._clear = clearT;
    (async()=>{ const cur = await ctx.getState("fishing"); s = cur ? JSON.parse(JSON.stringify(cur.state)) : null; lobby(); })();
  },
  unmount(){ if(this._u) this._u(); if(this._clear) this._clear(); },
});
})();
