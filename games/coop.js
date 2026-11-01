// 遊戲：冰火喵喵（兩個人各用自己的手機，即時合作過關）
// 火焰貓可以走過岩漿、怕水；水水貓可以走過水、怕岩漿；綠色毒水兩隻都不行。
// 按鈕要有貓站著才會開門，拉桿碰一下就切換。兩隻貓都走到自己的家才過關。
// 位置用 ctx.broadcast 即時互傳（不存檔），關卡進度存在 game_state "coop"。
(function(){
const T = 32, PX = 4;                       // tile size in canvas px, art pixel size
const COLS = 24, ROWS = 16, VC = 14;       // the phone shows 14 columns; the camera follows your cat
// '#' wall  'L' lava  'W' water  'G' poison  'f'/'w' spawns  'F'/'U' homes  'r'/'b' red / blue fish
// '1'..'3' buttons (held)  '7','8' levers (toggle)
// gates (solid until opened): 'x'=1 'y'=2 'z'=3 'm'=7 'n'=8    bridges (solid only when on): 'X' 'Y' 'Z' 'M' 'N'
const GATE = { x:1, y:2, z:3, m:7, n:8 }, BRIDGE = { X:1, Y:2, Z:3, M:7, N:8 };
const LEVELS = [
  { n:"第一步", map:[
    "########################",
    "#                      #",
    "#                      #",
    "#                      #",
    "#   F r U              #",
    "#  ########            #",
    "#                      #",
    "#             b        #",
    "#           ######     #",
    "#                      #",
    "#                   r  #",
    "#                 ######",
    "#       b      r       #",
    "# fw                   #",
    "#######LLL####WWW#######",
    "########################"] },
  { n:"一起開門", map:[
    "########################",
    "#              #       #",
    "#              #       #",
    "#              #       #",
    "#              #       #",
    "#              #       #",
    "#              #       #",
    "# 1 r          #       #",
    "######         #       #",
    "#              #       #",
    "#    b         x       #",
    "#  #####  b r  x       #",
    "#              x       #",
    "# fw           x1 F  U #",
    "#########LL#WW##########",
    "########################"] },
  { n:"拉桿與毒水", map:[
    "########################",
    "#                      #",
    "#                      #",
    "#                      #",
    "#    7  b              #",
    "#   #####              #",
    "#                      #",
    "# r                 F U#",
    "####               #####",
    "#                      #",
    "#                      #",
    "#   ###         ##     #",
    "#                      #",
    "# fw    MMMMMMMM   r   #",
    "#####WW#GGGGGGGGLL######",
    "########################"] },
  { n:"換你幫我", map:[
    "########################",
    "#         #     #      #",
    "#         #     #      #",
    "#         #     #      #",
    "#         #     #      #",
    "#         #     #      #",
    "#         #     #      #",
    "#         #     #      #",
    "#         #     #      #",
    "#         x     y      #",
    "#     b1  x     y      #",
    "#     ### x     y      #",
    "#   r     x b   y  r   #",
    "# fw      x1  2 y2 F U #",
    "####LL######WW##########",
    "########################"] },
  { n:"爬樓梯", map:[
    "########################",
    "#                      #",
    "#                      #",
    "#            r    b    #",
    "#               F   U  #",
    "#             ##########",
    "#                      #",
    "#   b    r             #",
    "#####WW######          #",
    "#    ##                #",
    "#       r          b   #",
    "#             ###LL#####",
    "#                ##    #",
    "# fw      b    r       #",
    "########GG##############",
    "########################"] },
  { n:"撐住別放手", map:[
    "########################",
    "#                      #",
    "#                      #",
    "#                      #",
    "#                      #",
    "#                      #",
    "#                      #",
    "#                      #",
    "#                      #",
    "#                    r #",
    "#                 F   U#",
    "#   br           ##LW###",
    "#          rb      ##  #",
    "# fw   1 XXXXXX 1      #",
    "#########GGGGGG#########",
    "########################"] },
  { n:"分頭行動", map:[
    "########################",
    "#              n       #",
    "#              n       #",
    "#              n       #",
    "#              n       #",
    "#              n       #",
    "#   r  r       n       #",
    "# f        7 r n    F  #",
    "######LLL########GG#####",
    "########################",
    "#              m       #",
    "#              m       #",
    "#   b  b       m       #",
    "# w        8 b m    U  #",
    "######WWW########GG#####",
    "########################"] },
  { n:"我來接你", map:[
    "########################",
    "#                      #",
    "#                      #",
    "#                      #",
    "#                      #",
    "#                      #",
    "#                      #",
    "#                      #",
    "#                      #",
    "#                    b #",
    "#b1r                F U#",
    "####     r    b    #####",
    "#                      #",
    "# f w XXXXXXXXXXXX 1   #",
    "######WWLLWWLLWWLL######",
    "########################"] },
  { n:"天花板的門", map:[
    "########################",
    "#                      #",
    "#                      #",
    "#                      #",
    "#                      #",
    "#   F  U 2  r     b    #",
    "##############yy########",
    "#                      #",
    "#             ##       #",
    "#  b  2          1 r   #",
    "##########xx############",
    "#                      #",
    "#     b   ##   r       #",
    "# fw1                  #",
    "######WW#######LL#######",
    "########################"] },
  { n:"火塔與水塔", map:[
    "########################",
    "#       n      m       #",
    "#       n      m       #",
    "#       n      m       #",
    "#       n  rb  m       #",
    "# 7     n F  U m     8 #",
    "######   ######   ######",
    "#     r          b     #",
    "#    LLL        WWW    #",
    "#    ###        ###    #",
    "#  r                b  #",
    "# LLL              WWW #",
    "# ###              ### #",
    "# f                  w #",
    "###########GG###########",
    "########################"] },
];
// make every row exactly COLS wide (pads / trims hand-typed maps)
LEVELS.forEach(l => { l.map = l.map.map(r => (r + " ".repeat(COLS)).slice(0, COLS)); });

const O = "#5a3b2e";
const svgImg = svg => { const im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); return im; };

App.registerGame({
  id: "coop",
  name: "冰火喵喵",
  desc: "兩個人各用手機，合作過關",
  icon: () => Pix.sprite("orange","happy"),
  mount(el, ctx){
    const { sprite, esc, SFX } = ctx;
    let s = null, G = null, raf = 0, alive = true;
    const me = () => ctx.me.uid;
    const roles = () => { const ids = ctx.players(); return { fire: ids[0], water: ids[1] }; };
    const myRole = () => roles().fire === me() ? "fire" : "water";
    const partnerOn = () => { const p = ctx.partner(); return p && ctx.isOnline(p.user_id); };

    // ---------- lobby ----------
    function lobby(){
      if(G) stopGame();
      const p = ctx.partner(), clear = (s && s.clear) || {}, best = (s && s.best) || {};
      const role = myRole();
      el.innerHTML = `<div class="box cpLobby">
        <div class="cpDuo"><div class="cpWho fire">${sprite(ctx.catOf(roles().fire)||"orange","happy")}<b>🔥 火焰貓</b><i>${esc(ctx.nameOf(roles().fire)||"")}</i><small>走得過岩漿・怕水</small></div>
          <div class="cpWho water">${sprite(ctx.catOf(roles().water)||"white","happy")}<b>💧 水水貓</b><i>${esc(roles().water ? ctx.nameOf(roles().water) : "等待加入")}</i><small>走得過水・怕岩漿</small></div></div>
        <p class="cpIntro">你是 <b>${role==="fire"?"🔥 火焰貓":"💧 水水貓"}</b>！兩個人要同時在線，一起幫忙開門、拉拉桿，<br>兩隻貓都走回自己的家才過關。綠色毒水兩隻都不能碰喔！</p>
        <div class="cpOn">${p ? (partnerOn() ? `🟢 ${esc(p.name)} 在線上，可以開始！` : `⚪ ${esc(p.name)} 不在線上，要兩個人一起才能玩`) : "等 ta 加入小窩"}</div>
        <div class="cpLv">${LEVELS.map((l,i)=>{ const open = i===0 || clear[i-1]; return `<button data-lv="${i}" ${open?"":"disabled"} class="${clear[i]?"done":""}"><b>${i+1}</b><span>${esc(l.n)}</span><i>${clear[i] ? `✔ ${best[i] ? best[i]+" 秒" : ""}` : open ? "▶ 開始" : "🔒"}</i></button>`; }).join("")}</div>
        <div class="k" style="text-align:center">任何一個人選關卡，兩支手機會一起開始</div></div>`;
      el.querySelectorAll("[data-lv]").forEach(b=>b.addEventListener("click", ()=>pick(+b.dataset.lv)));
    }
    async function pick(lv){
      if(!partnerOn()){ ctx.toast(`要等 ${esc(ctx.partner() ? ctx.partner().name : "ta")} 也在線上才能一起玩喔`); SFX.miss(); return; }
      SFX.select();
      await ctx.update("coop", st=>{ st = st || { clear:{}, best:{} }; st.lv = lv; st.run = Date.now(); st.won = null; return st; });
    }

    // ---------- the level ----------
    function startGame(){
      const L = LEVELS[s.lv]; if(!L){ lobby(); return; }
      if(G) stopGame();
      el.innerHTML = `<div class="box cpPlay"><div class="cpTop"><span>第 ${s.lv+1} 關・${esc(L.n)}</span><span id="cpFish"></span><span id="cpTime">0 秒</span></div>
        <div class="cpStage"><canvas id="cpC" width="${VC*T}" height="${ROWS*T}"></canvas><div class="cpMsg hidden" id="cpMsg"></div></div>
        <div class="cpPad"><button data-k="L">◀</button><button data-k="R">▶</button><span></span><button data-k="J" class="jump">跳</button></div>
        <div class="cpBar"><span id="cpHint">你是${myRole()==="fire"?"🔥 火焰貓":"💧 水水貓"}</span><button class="btn sub" id="cpRe">重來</button><button class="btn sub" id="cpOut">離開</button></div></div>`;
      const cv = el.querySelector("#cpC"), g = cv.getContext("2d"); g.imageSmoothingEnabled = false;
      const grid = L.map.map(r=>[...r]);
      const fish = [], buttons = [], levers = [], homes = {}, spawn = {};
      grid.forEach((row,y)=>row.forEach((c,x)=>{
        if(c==="r"||c==="b"){ fish.push({ x, y, c: c==="r" ? "fire" : "water", got:false }); grid[y][x] = " "; }
        if("123".includes(c)){ buttons.push({ x, y, id:+c }); grid[y][x] = " "; }
        if("78".includes(c)){ levers.push({ x, y, id:+c }); grid[y][x] = " "; }
        if(c==="F") homes.fire = { x, y }; if(c==="U") homes.water = { x, y };
        if(c==="f") spawn.fire = { x, y }; if(c==="w") spawn.water = { x, y };
        if("FUfw".includes(c)) grid[y][x] = " ";
      }));
      const role = myRole(), other = role==="fire" ? "water" : "fire";
      const mk = r => ({ x: spawn[r].x + .15, y: spawn[r].y + .2, vx:0, vy:0, w:.7, h:.8, ground:false, face:1, home:false, dead:false });
      G = { cam: Math.max(0, Math.min(COLS - VC, spawn[role].x - VC/2)), L, grid, fish, buttons, levers, homes, cats: { [role]: mk(role), [other]: mk(other) }, lever:{}, keys:{}, t0: performance.now(), run: s.run, last: 0, sent: 0, otherSeen: 0, otherHome: false, ended: false, cv, g, frame: 0, tgt: null };
      G.tgt = { x: G.cats[other].x, y: G.cats[other].y, face: 1 };
      // cat images (each player's own cat colour)
      const ids = roles();
      G.img = { fire: { n: svgImg(Pix.sprite(ctx.catOf(ids.fire)||"orange","normal")), h: svgImg(Pix.sprite(ctx.catOf(ids.fire)||"orange","happy")), c: svgImg(Pix.sprite(ctx.catOf(ids.fire)||"orange","cry")) },
                water:{ n: svgImg(Pix.sprite(ctx.catOf(ids.water)||"white","normal")), h: svgImg(Pix.sprite(ctx.catOf(ids.water)||"white","happy")), c: svgImg(Pix.sprite(ctx.catOf(ids.water)||"white","cry")) } };
      // controls
      const down = k => { G.keys[k] = true; if(k==="J") G.jumpReq = true; };
      el.querySelectorAll(".cpPad [data-k]").forEach(b=>{
        const k = b.dataset.k;
        b.addEventListener("pointerdown", e=>{ e.preventDefault(); try{ b.setPointerCapture(e.pointerId); }catch(_){} b.classList.add("on"); down(k); });
        const up = e=>{ b.classList.remove("on"); G && (G.keys[k] = false); };
        b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
        b.addEventListener("contextmenu", e=>e.preventDefault());
      });
      G.keyH = e => { const m = { ArrowLeft:"L", ArrowRight:"R", ArrowUp:"J", " ":"J", a:"L", d:"R", w:"J" }[e.key]; if(!m) return; e.preventDefault(); if(e.type==="keydown"){ if(!G.keys[m]) down(m); } else G.keys[m] = false; };
      window.addEventListener("keydown", G.keyH); window.addEventListener("keyup", G.keyH);
      el.querySelector("#cpRe").addEventListener("click", ()=>restart("重來一次～"));
      el.querySelector("#cpOut").addEventListener("click", async ()=>{ SFX.tap(); ctx.broadcast({ g:"coop", k:"out", run:G.run }); await ctx.update("coop", st=>{ if(!st) return undefined; st.lv = null; return st; }); });
      G.last = performance.now(); raf = requestAnimationFrame(loop);
      hud();
    }
    function stopGame(){ cancelAnimationFrame(raf); if(G && G.keyH){ window.removeEventListener("keydown", G.keyH); window.removeEventListener("keyup", G.keyH); } G = null; }

    // ---------- world rules ----------
    const active = id => {
      if(id >= 7) return !!G.lever[id];
      const on = c => G.buttons.some(b=>b.id===id && Math.abs((c.x + c.w/2) - (b.x + .5)) < .7 && Math.abs((c.y + c.h) - (b.y + 1)) < .35);
      return on(G.cats.fire) || on(G.cats.water);
    };
    function solidAt(tx, ty){
      if(tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
      const c = G.grid[ty][tx];
      if(c==="#") return true;
      if(GATE[c]) return !active(GATE[c]);
      if(BRIDGE[c]) return active(BRIDGE[c]);
      return false;
    }
    const tileAt = (tx, ty) => (G.grid[ty] && G.grid[ty][tx]) || "#";
    function collide(c, ax){
      const x0 = Math.floor(c.x), x1 = Math.floor(c.x + c.w - 1e-4), y0 = Math.floor(c.y), y1 = Math.floor(c.y + c.h - 1e-4);
      for(let ty=y0; ty<=y1; ty++) for(let tx=x0; tx<=x1; tx++) if(solidAt(tx, ty)){
        if(ax==="x"){ if(c.vx > 0) c.x = tx - c.w; else if(c.vx < 0) c.x = tx + 1; c.vx = 0; }
        else { if(c.vy > 0){ c.y = ty - c.h; c.ground = true; } else if(c.vy < 0) c.y = ty + 1; c.vy = 0; }
        return true;
      }
      return false;
    }
    function stepMe(dt){
      const role = myRole(), c = G.cats[role];
      if(c.dead) return;
      const dir = (G.keys.R ? 1 : 0) - (G.keys.L ? 1 : 0);
      c.vx = dir * 5.6; if(dir) c.face = dir;
      if(G.jumpReq && c.ground){ c.vy = -15.6; c.ground = false; SFX.jump(); }
      G.jumpReq = false;
      c.vy = Math.min(18, c.vy + 38*dt);
      c.x += c.vx*dt; collide(c, "x");
      c.ground = false; c.y += c.vy*dt; collide(c, "y");
      // liquids
      const fx = Math.floor(c.x + c.w/2), fy = Math.floor(c.y + c.h - .15), liq = tileAt(fx, fy);
      if(liq==="G" || (liq==="W" && role==="fire") || (liq==="L" && role==="water")){
        c.dead = true; SFX.hit(); if(navigator.vibrate) navigator.vibrate(80);
        restart(liq==="G" ? "掉進毒水了 😿" : role==="fire" ? "火焰貓碰到水了 😿" : "水水貓碰到岩漿了 😿");
        return;
      }
      // fish
      for(const [i,f] of G.fish.entries()) if(!f.got && f.c===role && Math.abs(c.x + c.w/2 - (f.x + .5)) < .6 && Math.abs(c.y + c.h/2 - (f.y + .5)) < .7){
        f.got = true; SFX.coin(); ctx.broadcast({ g:"coop", k:"fish", i, run:G.run }); hud(); }
      // levers: flip when you walk into one
      for(const lv of G.levers){ const inside = Math.abs(c.x + c.w/2 - (lv.x + .5)) < .6 && Math.abs(c.y + c.h - (lv.y + 1)) < .6;
        if(inside && !lv.inside){ G.lever[lv.id] = !G.lever[lv.id]; SFX.toggle ? SFX.toggle() : SFX.select(); ctx.broadcast({ g:"coop", k:"lever", id:lv.id, on:G.lever[lv.id], run:G.run }); }
        lv.inside = inside; }
      // home
      const h = G.homes[role]; c.home = !!h && Math.abs(c.x + c.w/2 - (h.x + .5)) < .6 && Math.abs(c.y + c.h - (h.y + 1)) < .3;
    }
    function stepOther(dt){
      const other = myRole()==="fire" ? "water" : "fire", c = G.cats[other], t = G.tgt;
      const k = Math.min(1, dt*14); c.x += (t.x - c.x)*k; c.y += (t.y - c.y)*k; c.face = t.face; c.moving = t.moving;
    }
    function hud(){
      if(!G) return; const role = myRole(), mine = G.fish.filter(f=>f.c===role), all = G.fish.filter(f=>f.got).length;
      const fe = el.querySelector("#cpFish"); if(fe) fe.textContent = `🐟 ${all}/${G.fish.length}`;
    }
    async function restart(msg){
      if(!G || G.ended) return;
      G.ended = true; showMsg(msg, true);
      ctx.broadcast({ g:"coop", k:"die", run:G.run, msg });
      const run = G.run;
      setTimeout(()=>ctx.update("coop", st=>{ if(!st || st.run!==run) return undefined; st.run = Date.now(); st.won = null; return st; }), 1100);
    }
    function showMsg(t, bad){ const m = el.querySelector("#cpMsg"); if(!m) return; m.className = "cpMsg" + (bad ? " bad" : ""); m.innerHTML = t; }
    async function checkWin(){
      const role = myRole(), c = G.cats[role];
      if(G.ended || !c.home || !G.otherHome || performance.now() - G.otherSeen > 1500) return;
      G.ended = true;
      const secs = Math.round((performance.now() - G.t0)/1000), lv = s.lv, run = G.run, fishN = G.fish.filter(f=>f.got).length;
      ctx.broadcast({ g:"coop", k:"win", run, secs, fishN });
      await ctx.update("coop", st=>{ if(!st || st.run!==run || st.won) return undefined; st.won = { run, secs, fish:fishN, of:G.fish.length };
        st.clear = st.clear||{}; st.best = st.best||{}; st.clear[lv] = true; if(!st.best[lv] || secs < st.best[lv]) st.best[lv] = secs; return st; });
    }
    function showWin(w){
      if(!G) return; G.ended = true;
      const next = s.lv + 1 < LEVELS.length;
      showMsg(`<b>🎉 過關！</b><p>${w.secs} 秒・🐟 ${w.fish}/${w.of}</p>${next ? `<button class="btn" id="cpNext">下一關 ▶</button>` : `<p>全部的關卡都過了！你們好有默契 💗</p>`}<button class="btn sub" id="cpLobby">選關卡</button>`);
      SFX.match(); ctx.burst();
      const nb = el.querySelector("#cpNext"); if(nb) nb.addEventListener("click", ()=>pick(s.lv + 1));
      el.querySelector("#cpLobby").addEventListener("click", ()=>ctx.update("coop", st=>{ if(!st) return undefined; st.lv = null; return st; }));
    }

    // ---------- drawing ----------
    const P = (x, y, w, h, c) => { g().fillStyle = c; g().fillRect(x, y, w, h); };
    const g = () => G.g;
    function drawTile(x, y, c){
      const X = x*T, Y = y*T, f = G.frame;
      if(c==="#"){ const top = y>0 && G.grid[y-1][x]!=="#";
        P(X, Y, T, T, "#b98a5e"); P(X, Y + T/2 - 2, T, 2, "#a0734a"); P(X + ((y%2)?T/2:0), Y, 2, T/2, "#a0734a"); P(X + ((y%2)?0:T/2), Y + T/2, 2, T/2, "#a0734a");
        if(top){ P(X, Y, T, 8, "#7cc47f"); P(X, Y + 8, T, 4, "#5aa865"); P(X + 6, Y + 12, 4, 4, "#5aa865"); P(X + 22, Y + 12, 4, 2, "#5aa865"); } return; }
      const liquid = { L:["#ff7a3a","#ffb04a","#ffe08a"], W:["#4a9be8","#7fc4ff","#d6efff"], G:["#4fbf5a","#8fe08a","#d0ffc0"] }[c];
      if(liquid){ const wav = Math.sin(f*3 + x)*2; P(X, Y + 10 + wav, T, T - 10 - wav, liquid[0]); P(X, Y + 8 + wav, T, 4, liquid[1]);
        if((Math.floor(f*4) + x) % 5 === 0) P(X + 10, Y + 16, 4, 4, liquid[2]); return; }
      const gid = GATE[c] || BRIDGE[c];
      if(gid){ const solid = solidAt(x, y), col = { 1:"#f0708d", 2:"#6fb7e8", 3:"#9b6fd6", 7:"#ffcf4a", 8:"#5cb87a" }[gid];
        if(solid){ P(X, Y, T, T, O); P(X + 2, Y + 2, T - 4, T - 4, col); for(let i=0;i<T;i+=8) P(X + 2, Y + i + 2, T - 4, 3, "rgba(255,255,255,.35)"); }
        else { g().strokeStyle = col; g().setLineDash([4,4]); g().lineWidth = 2; g().strokeRect(X + 3, Y + 3, T - 6, T - 6); g().setLineDash([]); }
      }
    }
    function drawCat(role){
      const c = G.cats[role], im = c.dead ? G.img[role].c : (Math.abs(c.vx) > .1 || c.moving) ? G.img[role].h : G.img[role].n;
      const size = T*1.45, cx = (c.x + c.w/2)*T, by = (c.y + c.h)*T, hop = (Math.abs(c.vx) > .1 || c.moving) && c.ground !== false ? Math.abs(Math.sin(G.frame*14))*4 : 0;
      const gg = g(); gg.save(); gg.translate(cx, by - hop); gg.scale(c.face < 0 ? -1 : 1, 1);
      if(im.complete) gg.drawImage(im, -size/2, -size + 4, size, size); gg.restore();
      // role badge: red scarf + flame / blue scarf + droplet
      const col = role==="fire" ? "#e5486a" : "#4a90d6";
      P(cx - 12, by - hop - size*.42, 24, 5, col);
      const ix = cx - 6, iy = by - hop - size - 8;
      if(role==="fire"){ P(ix + 4, iy, 4, 4, "#ffcf4a"); P(ix + 2, iy + 4, 8, 4, "#ff7a3a"); P(ix, iy + 8, 12, 4, "#e5486a"); }
      else { P(ix + 4, iy, 4, 4, "#7fc4ff"); P(ix + 2, iy + 4, 8, 4, "#4a90d6"); P(ix + 2, iy + 8, 8, 4, "#4a90d6"); }
      if(role !== myRole()){ g().font = "14px Cubic11, sans-serif"; g().textAlign = "center"; g().fillStyle = "#ffffff"; g().fillText(ctx.nameOf(roles()[role])||"", cx, iy - 4); }
    }
    function draw(){
      const gg = g(); G.frame += 1/60;
      const mc = G.cats[myRole()], want = Math.max(0, Math.min(COLS - VC, mc.x + mc.w/2 - VC/2));
      G.cam += (want - G.cam) * .12; const cam = Math.round(G.cam*T);
      gg.setTransform(1,0,0,1,0,0);
      const sky = gg.createLinearGradient(0,0,0,ROWS*T); sky.addColorStop(0,"#3b3f73"); sky.addColorStop(1,"#6a5a8f"); gg.fillStyle = sky; gg.fillRect(0,0,VC*T,ROWS*T);
      for(let i=0;i<40;i++){ const x = ((i*97 - cam*.3)%(VC*T) + VC*T)%(VC*T), y = (i*53)%(ROWS*T*.7); P(x, y, 2, 2, (Math.floor(G.frame*2 + i)%4) ? "rgba(255,255,255,.5)" : "#ffffff"); }
      gg.setTransform(1,0,0,1,-cam,0);
      for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){ const c = G.grid[y][x]; if(c!==" ") drawTile(x, y, c); }
      // homes (little cat houses)
      for(const r of ["fire","water"]){ const h = G.homes[r]; if(!h) continue; const X = h.x*T - 8, Y = h.y*T - 16, col = r==="fire" ? "#e5486a" : "#4a90d6", lit = G.cats[r].home;
        P(X + 4, Y + 18, 40, 30, O); P(X + 7, Y + 21, 34, 27, "#fff3e0"); for(let i=0;i<6;i++) P(X + 24 - 4 - i*4, Y + i*4, 8 + i*8, 4, col);
        P(X + 17, Y + 30, 14, 18, lit ? "#ffe08a" : "#3a2a28"); P(X + 22, Y + 25, 4, 4, lit ? "#ffcf4a" : col); }
      // buttons & levers
      for(const b of G.buttons){ const on = active(b.id), col = { 1:"#f0708d", 2:"#6fb7e8", 3:"#9b6fd6" }[b.id]; P(b.x*T + 4, b.y*T + T - (on ? 5 : 9), T - 8, on ? 5 : 9, O); P(b.x*T + 6, b.y*T + T - (on ? 4 : 8), T - 12, on ? 3 : 6, col); }
      for(const l of G.levers){ const on = !!G.lever[l.id], X = l.x*T, Y = l.y*T; P(X + 6, Y + T - 8, T - 12, 8, O); P(X + 8, Y + T - 6, T - 16, 5, "#8a8aa0");
        gg.save(); gg.translate(X + T/2, Y + T - 7); gg.rotate(on ? .6 : -.6); P(-2, -20, 4, 20, O); P(-5, -26, 10, 8, "#ffcf4a"); gg.restore(); }
      // fish
      for(const f of G.fish){ if(f.got) continue; const X = f.x*T + 6, Y = f.y*T + 10 + Math.sin(G.frame*4 + f.x)*3, col = f.c==="fire" ? "#ff7a3a" : "#4a90d6";
        P(X, Y + 2, 14, 10, O); P(X + 2, Y + 4, 10, 6, col); P(X + 14, Y, 6, 14, O); P(X + 15, Y + 3, 4, 8, col); P(X + 3, Y + 5, 2, 2, "#ffffff"); }
      drawCat(myRole()==="fire" ? "water" : "fire"); drawCat(myRole());
      gg.setTransform(1,0,0,1,0,0);
      // where is my partner? arrow at the screen edge when they're out of view
      const oc = G.cats[myRole()==="fire" ? "water" : "fire"], ox = (oc.x + oc.w/2)*T - cam;
      if(ox < 0 || ox > VC*T){ const left = ox < 0, ay = Math.max(30, Math.min(ROWS*T - 30, (oc.y + oc.h/2)*T)), ax = left ? 8 : VC*T - 8;
        gg.fillStyle = "rgba(255,255,255,.9)"; gg.beginPath(); gg.moveTo(ax, ay); gg.lineTo(ax + (left ? 18 : -18), ay - 14); gg.lineTo(ax + (left ? 18 : -18), ay + 14); gg.fill();
        gg.font = "14px Cubic11, sans-serif"; gg.textAlign = left ? "left" : "right"; gg.fillText(ctx.nameOf(roles()[myRole()==="fire" ? "water" : "fire"])||"", ax + (left ? 22 : -22), ay + 5); }
      if(!partnerOn()){ gg.fillStyle = "rgba(0,0,0,.45)"; gg.fillRect(0, 0, VC*T, 40); gg.font = "18px Cubic11, sans-serif"; gg.textAlign = "center"; gg.fillStyle = "#ffffff"; gg.fillText("對方離線了…等 ta 回來", VC*T/2, 26); }
    }
    function loop(t){
      if(!alive || !G) return;
      const dt = Math.min(.04, (t - G.last)/1000 || 0); G.last = t;
      if(!G.ended){ stepMe(dt); checkWin(); }
      stepOther(dt);
      // send my position ~12 times a second
      if(t - G.sent > 80){ G.sent = t; const c = G.cats[myRole()]; ctx.broadcast({ g:"coop", k:"pos", run:G.run, x:+c.x.toFixed(3), y:+c.y.toFixed(3), f:c.face, m: Math.abs(c.vx) > .1 ? 1 : 0, h: c.home ? 1 : 0 }); }
      const tm = el.querySelector("#cpTime"); if(tm && !G.ended) tm.textContent = Math.floor((performance.now() - G.t0)/1000) + " 秒";
      try{ draw(); }catch(e){}
      raf = requestAnimationFrame(loop);
    }

    // ---------- network ----------
    const offBc = ctx.onBroadcast(p=>{
      if(!p || p.g!=="coop" || !G || p.run!==G.run) return;
      const other = myRole()==="fire" ? "water" : "fire";
      if(p.k==="pos"){ G.tgt = { x:p.x, y:p.y, face:p.f, moving:!!p.m }; G.otherHome = !!p.h; G.cats[other].home = !!p.h; G.otherSeen = performance.now(); }
      if(p.k==="fish" && G.fish[p.i]){ G.fish[p.i].got = true; hud(); }
      if(p.k==="lever"){ G.lever[p.id] = p.on; G.levers.forEach(l=>{ if(l.id===p.id) l.inside = false; }); }
      if(p.k==="die" && !G.ended){ G.ended = true; G.cats[other].dead = true; showMsg(p.msg || "再試一次～", true); }
    });
    this._u = ctx.onState("coop", st=>{
      const prev = s; s = st;
      if(!st || st.lv==null){ if(!prev || prev.lv!=null) lobby(); else if(!G) lobby(); return; }
      if(!G || G.run !== st.run){ startGame(); return; }
      if(st.won && st.won.run===G.run) showWin(st.won);
    });
    this._p = ctx.onPresence(()=>{ if(!G) lobby(); });
    this._b = offBc;
    this._stop = () => { alive = false; stopGame(); };
    (async()=>{ const cur = await ctx.getState("coop").catch(()=>null); s = cur ? cur.state : null; if(s && s.lv!=null && !s.won) startGame(); else lobby(); })();
  },
  unmount(){ if(this._u) this._u(); if(this._p) this._p(); if(this._b) this._b(); if(this._stop) this._stop(); },
});
})();
