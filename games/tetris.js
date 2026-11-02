// 遊戲：喵喵方塊（俄羅斯方塊）
// 每一格都是一顆方方的貓頭！排滿一整行就消掉。可以用下面的按鈕，也可以在板子上滑：
// 左右滑移動、點一下旋轉、往下快滑直接落下。每消一行得 1 個貓幣。
(function(){
const COLS = 10, ROWS = 20, C = 12;          // cell = 12 pixels, canvas scaled up crisp
const O = "#5a3b2e";
// piece: [name, cat fur, cells(rotation 0)]
const PIECES = {
  I: { name:"藍藍貓", fur:"#a9cdee", cells:[[0,1],[1,1],[2,1],[3,1]], size:4 },
  O: { name:"橘貓",   fur:"#f6a95c", cells:[[1,0],[2,0],[1,1],[2,1]], size:4 },
  T: { name:"粉粉貓", fur:"#f7a7c0", cells:[[1,0],[0,1],[1,1],[2,1]], size:3 },
  S: { name:"薄荷貓", fur:"#9ed9b4", cells:[[1,0],[2,0],[0,1],[1,1]], size:3 },
  Z: { name:"小黑貓", fur:"#3b3140", cells:[[0,0],[1,0],[1,1],[2,1]], size:3, dark:true },
  J: { name:"紫紫貓", fur:"#c9b6f0", cells:[[0,0],[0,1],[1,1],[2,1]], size:3 },
  L: { name:"奶油貓", fur:"#ffe08a", cells:[[2,0],[0,1],[1,1],[2,1]], size:3 },
};
const KINDS = Object.keys(PIECES);
const HEAD = [
  "OO........OO",
  "OKO......OKO",
  "OFFOOOOOOFFO",
  "OFLFFFFFFFFO",
  "OFFFFFFFFFFO",
  "OFFEFFFFEFFO",
  "OFFEFFFFEFFO",
  "OBFFFNNFFFBO",
  "OFFFMFFMFFFO",
  "OFFFFMMFFFFO",
  "ODDDDDDDDDDO",
  "OOOOOOOOOOOO"];
const hex = h => [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const shade = (h, a) => "#" + hex(h).map(v=>Math.max(0,Math.min(255,Math.round(a<0 ? v*(1+a) : v+(255-v)*a))).toString(16).padStart(2,"0")).join("");
const cellCache = {};
function cellSprite(k, mode){   // mode: normal | ghost | flash | dead
  const key = k + mode; if(cellCache[key]) return cellCache[key];
  const p = PIECES[k] || { fur:"#cfc6bd" };
  const fur = mode==="dead" ? "#cfc6bd" : mode==="flash" ? "#ffffff" : p.fur, dark = p.dark && mode==="normal";
  const pal = { O, F:fur, L:shade(fur, .45), D:shade(fur, -.16), K:"#f7a7b8", E: dark ? "#ffd84d" : "#2b1d18", B:"#f59ab0", N:"#f0708d", M: dark ? "#f7d6dc" : "#2b1d18" };
  if(mode==="flash"){ pal.E = pal.M = "#f0708d"; }
  const cv = document.createElement("canvas"); cv.width = C; cv.height = C; const g = cv.getContext("2d");
  HEAD.forEach((row, y) => [...row].forEach((ch, x) => { if(ch === ".") return; let c = pal[ch]; if(!c) return;
    if(mode==="ghost"){ if(ch !== "O") return; c = "rgba(90,59,46,.35)"; }
    g.fillStyle = c; g.fillRect(x, y, 1, 1); }));
  return cellCache[key] = cv;
}
const cellUrl = (k) => cellSprite(k, "normal").toDataURL();
function pieceHtml(k, cls){
  const p = PIECES[k], xs = p.cells.map(c=>c[0]), ys = p.cells.map(c=>c[1]), mx = Math.min(...xs), my = Math.min(...ys), w = Math.max(...xs)-mx+1, h = Math.max(...ys)-my+1, u = cellUrl(k);
  return `<span class="tsP ${cls||""}" style="--w:${w};--h:${h}">${p.cells.map(([x,y])=>`<img src="${u}" style="left:${(x-mx)/w*100}%;top:${(y-my)/h*100}%;width:${100/w}%">`).join("")}</span>`;
}
function rotCells(k, r){
  const p = PIECES[k]; if(k === "O") return p.cells.map(c=>c.slice());
  let cs = p.cells.map(c=>c.slice()); const n = p.size;
  for(let i=0;i<((r%4)+4)%4;i++) cs = cs.map(([x,y]) => [n-1-y, x]);
  return cs;
}

function play(opts){
  return new Promise(resolve=>{
    const SFX = opts.sfx || {}; const snd = (k, ...a) => { try{ SFX[k] && SFX[k](...a); }catch(e){} };
    const ov = document.createElement("div"); ov.className = "tsGame";
    ov.innerHTML = `<div class="tsHud"><button class="tsQuit" id="tsQuit">🏳️ 退出</button>
        <div class="tsStat"><span>分數</span><b id="tsSc">0</b></div><div class="tsStat"><span>行數</span><b id="tsLn">0</b></div><div class="tsStat"><span>等級</span><b id="tsLv">1</b></div>
        <button class="tsPause" id="tsPa">⏸</button></div>
      <div class="tsMid">
        <div class="tsStrip"><div class="tsBox tsHold" id="tsHold"><span>收起來</span><i></i></div><div class="tsBox tsNext"><span>下一個</span><i id="tsN0"></i><i id="tsN1" class="sm"></i><i id="tsN2" class="sm"></i></div></div>
        <div class="tsWrap" id="tsWrap"><canvas id="tsCv" width="${COLS*C}" height="${ROWS*C}"></canvas><div class="tsPop" id="tsPop"></div></div>
      </div>
      <div class="tsPad">
        <button data-a="L" class="tsB">◀</button><button data-a="R" class="tsB">▶</button><button data-a="D" class="tsB">▼</button>
        <button data-a="U" class="tsB rot">↻</button><button data-a="X" class="tsB drop">⤓</button>
      </div>
      <div class="tsTip">在板子上也可以滑：左右滑移動・點一下轉・往下快滑直接落下</div>
      <div class="tsEnd hidden" id="tsEnd"></div>`;
    document.body.appendChild(ov);
    const $ = s => ov.querySelector(s);
    const cv = $("#tsCv"), g = cv.getContext("2d"); g.imageSmoothingEnabled = false;
    const W = COLS*C, H = ROWS*C;
    const bg = document.createElement("canvas"); bg.width = W; bg.height = H; { const b = bg.getContext("2d");
      b.fillStyle = "#fff9ef"; b.fillRect(0, 0, W, H);
      for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){ b.fillStyle = (x+y)%2 ? "#fff3e6" : "#fff9ef"; b.fillRect(x*C, y*C, C, C); }
      b.fillStyle = "rgba(240,112,141,.14)"; for(let y=0;y<ROWS;y+=3) for(let x=(y/3)%2;x<COLS;x+=2){ const px = x*C+5, py = y*C+6; b.fillRect(px, py, 2, 2); b.fillRect(px-2, py-2, 1, 1); b.fillRect(px+3, py-2, 1, 1); } }
    let board = Array.from({length:ROWS}, () => Array(COLS).fill(null));
    let bag = [], queue = [], cur = null, hold = null, held = false;
    let score = 0, lines = 0, level = 1, over = false, done = false, paused = false;
    let fallT = 0, lockT = 0, lockMoves = 0, clearing = null, raf = 0, last = performance.now(), quitArm = 0, combo = -1;
    const nextKind = () => { if(!bag.length){ bag = KINDS.slice(); for(let i=bag.length-1;i>0;i--){ const j = (Math.random()*(i+1))|0; [bag[i],bag[j]] = [bag[j],bag[i]]; } } return bag.pop(); };
    while(queue.length < 4) queue.push(nextKind());
    const speed = () => Math.max(0.06, 0.8 * Math.pow(0.84, level-1));
    const cells = (p, dx, dy, r) => rotCells(p.k, r==null ? p.r : r).map(([x,y]) => [x + p.x + (dx||0), y + p.y + (dy||0)]);
    const fits = (p, dx, dy, r) => cells(p, dx, dy, r).every(([x,y]) => x>=0 && x<COLS && y<ROWS && (y<0 || !board[y][x]));
    function spawn(k){
      cur = { k: k || queue.shift(), r: 0, x: 3, y: -1 }; if(!k) queue.push(nextKind());
      if(cur.k === "O") cur.x = 3;
      if(!fits(cur)) { cur.y = -2; if(!fits(cur)) return gameOver(); }
      fallT = 0; lockT = 0; lockMoves = 0; drawSide();
    }
    function drawSide(){
      $("#tsN0").innerHTML = pieceHtml(queue[0]); $("#tsN1").innerHTML = pieceHtml(queue[1]); $("#tsN2").innerHTML = pieceHtml(queue[2]);
      $("#tsHold i").innerHTML = hold ? pieceHtml(hold, held ? "used" : "") : "";
    }
    const onGround = () => !fits(cur, 0, 1);
    function moved(){ if(onGround() && lockMoves < 15){ lockT = 0; lockMoves++; } }
    function move(dx){ if(!cur || clearing || over || paused) return false; if(fits(cur, dx, 0)){ cur.x += dx; snd("key"); moved(); return true; } return false; }
    function rotate(dir){
      if(!cur || clearing || over || paused || cur.k === "O") return;
      const nr = (cur.r + dir + 4) % 4;
      for(const [kx, ky] of [[0,0],[-1,0],[1,0],[0,-1],[-2,0],[2,0],[-1,-1],[1,-1]]){
        if(fits(cur, kx, ky, nr)){ cur.x += kx; cur.y += ky; cur.r = nr; snd("tap"); moved(); return; } }
    }
    function soft(){ if(!cur || clearing || over || paused) return; if(fits(cur, 0, 1)){ cur.y++; score += 1; fallT = 0; updHud(); } }
    function hard(){ if(!cur || clearing || over || paused) return; let n = 0; while(fits(cur, 0, 1)){ cur.y++; n++; } score += n*2; snd("place"); lock(); }
    function doHold(){ if(!cur || clearing || over || paused || held) return; const k = cur.k; if(hold){ const h2 = hold; hold = k; spawn(h2); } else { hold = k; spawn(); } held = true; snd("select"); drawSide(); }
    function lock(){
      for(const [x,y] of cells(cur)){ if(y < 0){ return gameOver(); } board[y][x] = cur.k; }
      cur = null; held = false;
      const full = []; for(let y=0;y<ROWS;y++) if(board[y].every(Boolean)) full.push(y);
      if(full.length){ clearing = { rows: full, t: 0 }; combo++; const pts = [0,100,300,500,800][full.length] * level + (combo > 0 ? 50*combo*level : 0); score += pts; lines += full.length;
        snd(full.length >= 4 ? "level" : "combo", full.length);
        pop(full.length === 4 ? "喵喵方塊！四行 🎉" : full.length === 3 ? "三行！太厲害了" : full.length === 2 ? "兩行～" : combo > 0 ? `連續 ${combo+1} 次！` : "", full.length >= 2 || combo > 0);
        const nl = Math.floor(lines/10) + 1; if(nl > level){ level = nl; setTimeout(()=>pop(`等級 ${level}！變快囉`, true), 500); }
      } else { combo = -1; snd("place"); spawn(); }
      updHud();
    }
    let popT = 0;
    function pop(t, show){ if(!t || !show) return; const P = $("#tsPop"); P.textContent = t; P.classList.remove("on"); void P.offsetWidth; P.classList.add("on"); clearTimeout(popT); popT = setTimeout(()=>P.classList.remove("on"), 1200); }
    function updHud(){ $("#tsSc").textContent = score; $("#tsLn").textContent = lines; $("#tsLv").textContent = level; }
    function gameOver(){
      if(over) return; over = true; cur = null; snd("miss");
      let y = ROWS - 1; const greyT = setInterval(()=>{ if(y < 0 || done){ clearInterval(greyT); return; } for(let x=0;x<COLS;x++) if(board[y][x]) board[y][x] = "dead"; y--; }, 35);
      setTimeout(finish, 900);
    }
    function finish(){
      if(done) return;
      const coins = Math.min(60, lines), best = Math.max(opts.best||0, score), rec = score > (opts.best||0) && score > 0;
      const E = $("#tsEnd"); E.classList.remove("hidden");
      E.innerHTML = `<div class="tsCard"><div class="tsCats">${["O","T","Z","I"].map(k=>`<img src="${cellUrl(k)}">`).join("")}</div><h3>${rec ? "🎉 新紀錄！" : "疊到頂了～"}</h3>
        <p class="tsBig">${score} 分</p><p>消了 <b>${lines}</b> 行・等級 ${level}${rec ? "" : `<br>最高紀錄 ${best} 分`}${coins && opts.hasPet ? `<br>${coins} 個貓幣送進養貓房間了 🪙` : ""}</p>
        <div class="tsBtns"><button class="btn sub" id="tsBack">回去</button><button class="btn" id="tsAgain">再玩一次</button></div></div>`;
      opts.best = best;
      Promise.resolve(opts.onEnd && opts.onEnd({ score, lines, level, coins, rec })).catch(()=>{});
      $("#tsBack").addEventListener("click", () => close(false));
      $("#tsAgain").addEventListener("click", () => close(true));
    }
    function setPause(p){ if(over) return; paused = p; $("#tsPa").textContent = p ? "▶" : "⏸"; ov.classList.toggle("paused", p); }
    function update(dt){
      if(over || paused) return;
      if(clearing){ clearing.t += dt; if(clearing.t > 0.32){ for(const y of clearing.rows){ board.splice(y, 1); board.unshift(Array(COLS).fill(null)); } clearing = null; spawn(); } return; }
      if(!cur) return;
      if(onGround()){ lockT += dt; if(lockT > 0.5) lock(); }
      else { fallT += dt * (downHeld ? 12 : 1); const sp = speed(); while(fallT >= sp && cur && fits(cur, 0, 1)){ fallT -= sp; cur.y++; if(downHeld){ score += 1; updHud(); } } }
    }
    function draw(){
      g.drawImage(bg, 0, 0);
      for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){ const k = board[y][x]; if(!k) continue;
        const flash = clearing && clearing.rows.includes(y);
        if(flash){ const t = clearing.t / 0.32; const s = cellSprite(k, Math.floor(t*8)%2 ? "flash" : "normal"); const k2 = Math.max(0.1, 1 - t*0.6); const o = C*(1-k2)/2; g.drawImage(s, x*C+o, y*C+o - t*6, C*k2, C*k2); }
        else g.drawImage(cellSprite(k === "dead" ? "Z" : k, k === "dead" ? "dead" : "normal"), x*C, y*C); }
      if(cur){
        let gy = 0; while(fits(cur, 0, gy+1)) gy++;
        if(gy > 0) for(const [x,y] of cells(cur, 0, gy)) if(y >= 0) g.drawImage(cellSprite(cur.k, "ghost"), x*C, y*C);
        for(const [x,y] of cells(cur)) if(y >= 0) g.drawImage(cellSprite(cur.k, "normal"), x*C, y*C);
      }
    }
    function loop(t){ if(done) return; let dt = (t - last)/1000; last = t; if(dt > 0.1) dt = 0.1; update(dt); try{ draw(); }catch(e){} raf = requestAnimationFrame(loop); }
    function size(){
      const mid = ov.querySelector(".tsMid"), strip = ov.querySelector(".tsStrip");
      const aw = Math.min(window.innerWidth - 28, 380), ah = (mid.clientHeight || window.innerHeight - 260) - (strip.offsetHeight || 44) - 8;
      const k = Math.max(1, Math.min(aw / W, (ah - 8) / H));
      cv.style.width = Math.floor(W*k) + "px"; cv.style.height = Math.floor(H*k) + "px";
    }
    // buttons with auto-repeat
    let downHeld = false;
    ov.querySelectorAll(".tsB").forEach(b => {
      const a = b.dataset.a; let rep = 0, rep2 = 0;
      const act = () => { if(a==="L") move(-1); else if(a==="R") move(1); else if(a==="U") rotate(1); else if(a==="X") hard(); };
      b.addEventListener("pointerdown", e => { e.preventDefault(); b.classList.add("on"); if(a==="D"){ downHeld = true; soft(); return; } act();
        if(a==="L" || a==="R"){ rep = setTimeout(()=>{ rep2 = setInterval(act, 55); }, 170); } });
      const up = () => { b.classList.remove("on"); clearTimeout(rep); clearInterval(rep2); if(a==="D") downHeld = false; };
      b.addEventListener("pointerup", up); b.addEventListener("pointerleave", up); b.addEventListener("pointercancel", up);
    });
    // gestures on the board
    const wrap = $("#tsWrap"); let gs = null;
    wrap.addEventListener("pointerdown", e => { if(over) return; gs = { x:e.clientX, y:e.clientY, t:performance.now(), mx:0, moved:false, dropped:false }; try{ wrap.setPointerCapture(e.pointerId); }catch(_){} });
    wrap.addEventListener("pointermove", e => { if(!gs) return; const cw = cv.getBoundingClientRect().width / COLS;
      const steps = Math.trunc((e.clientX - gs.x) / (cw*0.9)); while(gs.mx < steps){ move(1); gs.mx++; gs.moved = true; } while(gs.mx > steps){ move(-1); gs.mx--; gs.moved = true; }
      const dy = e.clientY - gs.y, dt = performance.now() - gs.t; if(!gs.dropped && dy > cw*2.2 && dy / Math.max(1,dt) > 0.6 && Math.abs(e.clientX-gs.x) < dy*0.6){ gs.dropped = true; gs.moved = true; hard(); } });
    wrap.addEventListener("pointerup", e => { if(!gs) return; if(!gs.moved && Math.abs(e.clientY-gs.y) < 12 && performance.now() - gs.t < 300) rotate(1); gs = null; });
    wrap.addEventListener("pointercancel", () => { gs = null; });
    const onKey = e => { if(over) return; const k = e.key; if(k==="ArrowLeft") move(-1); else if(k==="ArrowRight") move(1); else if(k==="ArrowUp" || k==="x") rotate(1); else if(k==="z") rotate(-1); else if(k==="ArrowDown") soft(); else if(k===" "){ e.preventDefault(); hard(); } else if(k==="c" || k==="Shift") doHold(); else if(k==="p" || k==="Escape") setPause(!paused); };
    document.addEventListener("keydown", onKey);
    $("#tsHold").addEventListener("click", doHold);
    $("#tsPa").addEventListener("click", () => { snd("tap"); setPause(!paused); });
    ov.addEventListener("click", e => { if(paused && e.target === ov) setPause(false); });
    const onVis = () => { if(document.visibilityState === "hidden") setPause(true); };
    document.addEventListener("visibilitychange", onVis);
    $("#tsQuit").addEventListener("click", () => { if(over) return; const t = Date.now(); if(t - quitArm < 2500){ snd("tap"); close(false); return; } quitArm = t; const q = $("#tsQuit"); q.textContent = "再按一次退出"; setTimeout(()=>{ if(q.isConnected) q.textContent = "🏳️ 退出"; }, 2500); });
    function close(again){ if(done) return; done = true; cancelAnimationFrame(raf); window.removeEventListener("resize", size); document.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onVis); ov.remove(); resolve(again ? "again" : "back"); }
    ov.__close = () => close(false);
    window.addEventListener("resize", size);
    if(window.__mock) window.__ts = { board: () => board, cur: () => cur, fill(rows){ for(const [y, s] of rows) board[y] = [...s].map(c => c === "." ? null : c); }, set(k){ spawn(k); }, hard, move, rotate, hold: doHold, score: () => score, lines: () => lines, end: gameOver, pause: setPause };
    spawn(); updHud();
    requestAnimationFrame(() => { size(); last = performance.now(); raf = requestAnimationFrame(loop); });
  });
}

window.CatTetris = { play, pieceHtml, cellUrl };
if(window.GameArt) window.GameArt.tetris = () => `<span class="gaL tsArt" style="left:4%;bottom:4%;width:92%">${[["O",0,2],["O",1,2],["Z",2,2],["T",3,2],["T",4,2],["I",5,2],["O",0,1],["O",1,1],["Z",2,1],["Z",3,1],["T",4,1],["I",5,1],["L",1,0],["T",4,0],["I",5,0]].map(([k,x,y])=>`<img src="${cellUrl(k)}" style="left:${x*16.66}%;top:${y*33.3}%">`).join("")}</span>`;

App.registerGame({
  id: "tetris",
  name: "喵喵方塊",
  desc: "貓貓俄羅斯方塊，排滿一行就消掉",
  icon: () => Pix.sprite("orange","happy"),
  mount(el, ctx){
    const { esc, SFX } = ctx;
    let s = null;
    const me = () => ctx.me.uid;
    function lobby(){
      const p = ctx.partner(), best = (s && s.best) || {}, ln = (s && s.lines) || {};
      const row = (name, uid) => `<div><b>${esc(name)}</b><span>${best[uid]||0} 分</span><em>${ln[uid] ? `最多消 ${ln[uid]} 行` : "還沒玩過"}</em></div>`;
      el.innerHTML = `<div class="box tsLobby">
        <div class="tsParade">${KINDS.map(k=>`<span title="${PIECES[k].name}">${pieceHtml(k)}</span>`).join("")}</div>
        <p class="tsIntro">七種貓貓方塊從天上掉下來！<br>把它們排好，<b>排滿一整行</b>就會消掉 🐾</p>
        <div class="tsHow"><span>◀ ▶ 移動</span><span>↻ 旋轉</span><span>▼ 加速</span><span>⤓ 直接落下</span><span>點左邊的框可以先收起來</span></div>
        <div class="tsBest">${row(ctx.me.name, me())}${p ? row(p.name, p.user_id) : ""}</div>
        <button class="btn" id="tsGo">🧱 開始玩！</button>
        <div class="k" style="text-align:center">每消一行得 1 個貓幣，會送進養貓房間 🪙</div></div>`;
      el.querySelector("#tsGo").addEventListener("click", go);
    }
    async function go(){
      if(document.querySelector(".tsGame")) return;
      SFX.tap();
      let again = true;
      while(again){
        const opts = { sfx: SFX, best: (s && s.best && s.best[me()]) || 0, hasPet: true };
        ctx.getState("pet").then(pet=>{ opts.hasPet = !!(pet && pet.state); }).catch(()=>{});
        const r = await play(Object.assign(opts, { onEnd: async r => {
          await ctx.update("tetris", st=>{ st = st || {}; st.best = st.best||{}; st.lines = st.lines||{}; st.plays = st.plays||{};
            st.plays[me()] = (st.plays[me()]||0) + 1; if(r.score > (st.best[me()]||0)) st.best[me()] = r.score; if(r.lines > (st.lines[me()]||0)) st.lines[me()] = r.lines;
            st.last = { by:me(), score:r.score, at:Date.now() }; return st; });
          if(r.rec) ctx.notifyPartner(`${ctx.me.name} 在「喵喵方塊」拿到新紀錄：${r.score} 分！`);
          if(r.coins > 0) await ctx.update("pet", st=>{ if(!st || !window.PetLogic) return undefined; st = window.PetLogic.norm(JSON.parse(JSON.stringify(st)));
            st.coins = (st.coins||0) + r.coins; st.log = (st.log||[]).concat([{ by:me(), a:"tetris", n:r.coins, at:Date.now() }]).slice(-24); return st; });
        } }));
        again = r === "again";
      }
      lobby();
    }
    this._u = ctx.onState("tetris", st=>{ s = st; if(!document.querySelector(".tsGame")) lobby(); });
    (async()=>{ const cur = await ctx.getState("tetris").catch(()=>null); s = cur ? cur.state : null; lobby(); })();
  },
  unmount(){ if(this._u) this._u(); const g = document.querySelector(".tsGame"); if(g && g.__close) g.__close(); },
});
})();
