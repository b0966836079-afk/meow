// 遊戲：喵喵俄羅斯方塊（TETR.IO 風格的手機版）
// 每一格都是一顆方方的貓頭！現代規則：SRS 旋轉＋踢牆、180° 旋轉、收起來、5 個下一塊、
// 7 袋隨機、T-Spin、B2B、連擊、全部清空。模式：跟 ta 即時對戰、40 行競速、2 分鐘挑戰、經典、禪。
// 對戰：兩邊用同一組種子出一樣的方塊，消行會送「垃圾行」給對方，先疊到頂的人輸。
(function(){
const COLS = 10, VIS = 20, HID = 3, ROWS = VIS + HID, C = 12;   // board has 3 hidden rows on top
const O = "#5a3b2e";
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
function cellSprite(k, mode){   // mode: normal | ghost | flash | dead | junk
  const key = k + mode; if(cellCache[key]) return cellCache[key];
  const p = PIECES[k] || { fur:"#cfc6bd" };
  const fur = mode==="dead" ? "#7d768a" : mode==="junk" ? "#9b93aa" : mode==="flash" ? "#ffffff" : p.fur, dark = p.dark && mode==="normal";
  const pal = { O, F:fur, L:shade(fur, .45), D:shade(fur, -.16), K:"#f7a7b8", E: dark ? "#ffd84d" : "#2b1d18", B:"#f59ab0", N:"#f0708d", M: dark ? "#f7d6dc" : "#2b1d18" };
  if(mode==="flash"){ pal.E = pal.M = "#f0708d"; }
  if(mode==="junk" || mode==="dead"){ pal.K = pal.B = pal.N = shade(fur, -.1); pal.E = pal.M = "#4a4257"; }
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
// true SRS rotation inside the piece's bounding box (clockwise, y grows downward)
function rotCells(k, r){
  const p = PIECES[k]; if(k === "O") return p.cells.map(c=>c.slice());
  let cs = p.cells.map(c=>c.slice()); const n = p.size;
  for(let i=0;i<((r%4)+4)%4;i++) cs = cs.map(([x,y]) => [n-1-y, x]);
  return cs;
}
// SRS wall kicks (from the guideline, written with y pointing up; flipped when used)
const KICK = {
  "01":[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]], "10":[[0,0],[1,0],[1,-1],[0,2],[1,2]],
  "12":[[0,0],[1,0],[1,-1],[0,2],[1,2]],     "21":[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  "23":[[0,0],[1,0],[1,1],[0,-2],[1,-2]],    "32":[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  "30":[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],  "03":[[0,0],[1,0],[1,1],[0,-2],[1,-2]],
};
const KICK_I = {
  "01":[[0,0],[-2,0],[1,0],[-2,-1],[1,2]], "10":[[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  "12":[[0,0],[-1,0],[2,0],[-1,2],[2,-1]], "21":[[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  "23":[[0,0],[2,0],[-1,0],[2,1],[-1,-2]], "32":[[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  "30":[[0,0],[1,0],[-2,0],[1,-2],[-2,1]], "03":[[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
};
const KICK_180 = { "02":[[0,0],[0,1],[1,1],[-1,1],[1,0],[-1,0]], "20":[[0,0],[0,-1],[-1,-1],[1,-1],[-1,0],[1,0]],
  "13":[[0,0],[1,0],[1,2],[1,1],[0,2],[0,1]], "31":[[0,0],[-1,0],[-1,2],[-1,1],[0,2],[0,1]] };
function kicks(k, from, to){
  if(k === "O") return [[0,0]];
  const key = "" + from + to;
  const t = (Math.abs(from - to) === 2 ? KICK_180 : k === "I" ? KICK_I : KICK)[key] || [[0,0]];
  return t.map(([x,y]) => [x, -y]);
}
// seeded random so both phones get the same pieces in a match
function rng(seed){ let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const ATK_LINES = [0, 0, 1, 2, 4], ATK_TS = [0, 2, 4, 6], ATK_MINI = [0, 0, 1, 2];
const COMBO_ATK = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5];
const FEEL = { slow:{ das:.17, arr:.05, n:"穩穩" }, std:{ das:.133, arr:.033, n:"標準" }, fast:{ das:.1, arr:0, n:"超快" } };
const MODES = {
  vs:      { n:"⚔️ 對戰", top:"對戰" },
  sprint:  { n:"🏁 40 行競速", top:"40 行" },
  blitz:   { n:"⏱️ 2 分鐘挑戰", top:"2 分鐘" },
  marathon:{ n:"🐾 經典模式", top:"經典" },
  zen:     { n:"🌙 禪模式", top:"禪" },
};
const fmtT = s => { s = Math.max(0, s); const m = Math.floor(s/60), r = s - m*60; return `${m}:${r < 10 ? "0" : ""}${r.toFixed(2)}`; };
const fmtS = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; };

function play(opts){
  return new Promise(resolve=>{
    const SFX = opts.sfx || {}; const snd = (k, ...a) => { try{ SFX[k] && SFX[k](...a); }catch(e){} };
    const mode = opts.mode || "marathon", isVs = mode === "vs";
    const feel = FEEL[opts.feel] || FEEL.std;
    const ov = document.createElement("div"); ov.className = "tsGame m-" + mode;
    ov.innerHTML = `<div class="tsHud"><button class="tsQuit" id="tsQuit">${mode==="zen" ? "✔ 結束" : "🏳️ 退出"}</button>
        <div class="tsTop"><span>${MODES[mode].top}</span><b id="tsMain">0</b></div>
        ${isVs ? `<div class="tsVsName">vs <b>${esc(opts.foe || "ta")}</b></div>` : `<button class="tsPause" id="tsPa">⏸</button>`}</div>
      <div class="tsMid" id="tsMid">
        <div class="tsCol">
          <div class="tsBox tsHold" id="tsHold"><span>收起來</span><i></i></div>
          <div class="tsStats" id="tsStats"></div>
          <div class="tsAct" id="tsAct"></div>
        </div>
        <div class="tsWrap" id="tsWrap"><div class="tsGb" id="tsGb"><i></i></div><canvas id="tsCv" width="${COLS*C}" height="${VIS*C}"></canvas><div class="tsPop" id="tsPop"></div><div class="tsBigTx" id="tsBigTx"></div><div class="tsCd" id="tsCd"></div></div>
        <div class="tsCol">
          <div class="tsBox tsNext"><span>下一個</span>${[0,1,2,3,4].map(i=>`<i id="tsN${i}"></i>`).join("")}</div>
          ${isVs ? `<div class="tsFoe" id="tsFoe"><span>${esc(opts.foe || "ta")}</span><canvas id="tsFc" width="${COLS*4}" height="${VIS*4}"></canvas><em id="tsFg"></em></div>` : ""}
        </div>
      </div>
      <div class="tsPad">
        <div class="tsCl"><button data-a="L" class="tsB">◀</button><button data-a="R" class="tsB">▶</button><button data-a="H" class="tsB hold">收</button><button data-a="D" class="tsB">▼</button></div>
        <div class="tsCl"><button data-a="CCW" class="tsB rot">↺</button><button data-a="CW" class="tsB rot">↻</button><button data-a="F" class="tsB rot sm">180°</button><button data-a="X" class="tsB drop">⤓</button></div>
      </div>
      <canvas class="tsFx" id="tsFx"></canvas>
      <div class="tsEnd hidden" id="tsEnd"></div>`;
    document.body.appendChild(ov);
    const $ = s => ov.querySelector(s);
    const cv = $("#tsCv"), g = cv.getContext("2d"); g.imageSmoothingEnabled = false;
    // ---- animations (particles, trails, beams, attack orbs) drawn on a full-screen canvas ----
    const fx = $("#tsFx"), fg = fx.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
    let parts = [], trails = [], beams = [], orbs = [], lockFlash = null;
    const fxSize = () => { fx.width = Math.round(window.innerWidth * dpr); fx.height = Math.round(window.innerHeight * dpr); };
    const cellXY = (x, y) => { const r = cv.getBoundingClientRect(), cw = r.width / COLS; return [r.left + (x + .5) * cw, r.top + (y - HID + .5) * cw, cw]; };
    const furOf = k => k === "g" || k === "dead" ? "#b4abbd" : (PIECES[k] ? PIECES[k].fur : "#f7a7c0");
    function spark(x, y, c, n, spd, opt){ opt = opt || {}; for(let i=0;i<n;i++){ const a = opt.up ? -Math.PI/2 + (Math.random()-.5)*2.2 : Math.random()*Math.PI*2, v = spd * (.4 + Math.random()*.8);
      parts.push({ x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v - (opt.up ? spd*.3 : 0), t: 0, max: (opt.life || .7) * (.6 + Math.random()*.6), c: Array.isArray(c) ? c[(Math.random()*c.length)|0] : c, s: (opt.size || 4) * (.6 + Math.random()*.7), h: Math.random() < (opt.hearts || .12), g: opt.g == null ? 900 : opt.g, spin: Math.random()*6 }); } }
    const anim = (el, cls) => { if(!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
    function bigText(t, cls){ const b = $("#tsBigTx"); b.textContent = t; b.className = "tsBigTx"; void b.offsetWidth; b.className = "tsBigTx on " + (cls || ""); }
    const CONF = ["#f7a7c0","#a9cdee","#ffe08a","#9ed9b4","#c9b6f0","#f6a95c"];
    function confetti(n){ const r = cv.getBoundingClientRect(); for(let i=0;i<n;i++) spark(r.left + Math.random()*r.width, r.top - 10, CONF, 1, 160, { life: 1.6, size: 5, g: 380, hearts: .25 }); }
    function drawHeart(x, y, s){ const u = s / 4; [[1,0],[3,0],[0,1],[1,1],[2,1],[3,1],[4,1],[1,2],[2,2],[3,2],[2,3]].forEach(([a,b]) => fg.fillRect(x + (a-2.5)*u, y + (b-1.5)*u, u+.5, u+.5)); }
    function fxStep(dt){
      fg.setTransform(dpr, 0, 0, dpr, 0, 0); fg.clearRect(0, 0, fx.width, fx.height);
      trails = trails.filter(t => (t.t += dt) < .28);
      for(const t of trails){ const a = 1 - t.t/.28; const gr = fg.createLinearGradient(0, t.y0, 0, t.y1); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, t.c); fg.globalAlpha = a * .75; fg.fillStyle = gr; fg.fillRect(t.x - t.w*.42*a, t.y0, t.w*.84*a, t.y1 - t.y0); }
      beams = beams.filter(b => (b.t += dt) < .35);
      for(const b of beams){ const k = b.t/.35, r = cv.getBoundingClientRect(); fg.globalAlpha = (1-k) * .9; fg.fillStyle = "#fff"; const h = b.h * (1 + k*1.5); fg.fillRect(r.left - k*20, b.y - h/2, r.width + k*40, h); fg.globalAlpha = (1-k) * .5; fg.fillStyle = "#f7a7c0"; fg.fillRect(r.left - k*30, b.y - h*.08, r.width + k*60, h*.16); }
      orbs = orbs.filter(o => { o.t += dt; const k = Math.min(1, o.t / .45); if(k >= 1 && !o.hit){ o.hit = true; spark(o.x1, o.y1, ["#e5486a","#f7a7c0","#fff"], 14, 160, { life: .5, size: 4, g: 0 }); anim($("#tsFoe"), "hit"); } return o.t < .5; });
      for(const o of orbs){ const k = Math.min(1, o.t/.45), e = k*k*(3-2*k), x = o.x0 + (o.x1-o.x0)*e, y = o.y0 + (o.y1-o.y0)*e - Math.sin(k*Math.PI)*60;
        fg.globalAlpha = 1; fg.fillStyle = "#e5486a"; const rr = 5 + Math.min(8, o.n); fg.beginPath(); fg.arc(x, y, rr, 0, 7); fg.fill(); fg.fillStyle = "#fff"; fg.beginPath(); fg.arc(x - rr*.3, y - rr*.3, rr*.35, 0, 7); fg.fill();
        spark(x, y, ["#f7a7c0","#e5486a"], 1, 30, { life: .3, size: 4, g: 0, hearts: .3 }); }
      parts = parts.filter(p => (p.t += dt) < p.max);
      for(const p of parts){ p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .985; const a = 1 - p.t/p.max; fg.globalAlpha = Math.min(1, a * 1.4); fg.fillStyle = p.c;
        if(p.h) drawHeart(p.x, p.y, p.s * 1.6); else { const sz = p.s * (.5 + a*.5); fg.fillRect(p.x - sz/2, p.y - sz/2, sz, sz); } }
      fg.globalAlpha = 1;
    }
    const W = COLS*C, H = VIS*C;
    const bg = document.createElement("canvas"); bg.width = W; bg.height = H; { const b = bg.getContext("2d");
      b.fillStyle = "#fff9ef"; b.fillRect(0, 0, W, H);
      for(let y=0;y<VIS;y++) for(let x=0;x<COLS;x++){ b.fillStyle = (x+y)%2 ? "#fff3e6" : "#fff9ef"; b.fillRect(x*C, y*C, C, C); }
      b.fillStyle = "rgba(240,112,141,.14)"; for(let y=1;y<VIS;y+=4) for(let x=(y>>2)%2;x<COLS;x+=3){ const px = x*C+5, py = y*C+6; b.fillRect(px, py, 2, 2); b.fillRect(px-2, py-2, 1, 1); b.fillRect(px+3, py-2, 1, 1); } }
    const R = rng(opts.seed || ((Math.random()*1e9)|0));
    let board = Array.from({length:ROWS}, () => Array(COLS).fill(null));
    let bag = [], queue = [], cur = null, hold = null, held = false;
    let score = 0, lines = 0, level = 1, over = false, done = false, paused = false, started = false;
    let fallT = 0, lockT = 0, lockMoves = 0, lowY = 0, clearing = null, raf = 0, last = performance.now(), quitArm = 0;
    let combo = -1, b2b = -1, tm = 0, cdT = 0, pieces = 0, atkSent = 0, atkTotal = 0, lastRot = false, lastKick = 0;
    let incoming = [], foeSeen = performance.now(), sentBd = 0, bdDirty = true, result = null;
    const nextKind = () => { if(!bag.length){ bag = KINDS.slice(); for(let i=bag.length-1;i>0;i--){ const j = (R()*(i+1))|0; [bag[i],bag[j]] = [bag[j],bag[i]]; } } return bag.pop(); };
    while(queue.length < 6) queue.push(nextKind());
    const gravity = () => {
      let lv = level;
      if(mode === "vs") lv = 1 + Math.max(0, Math.floor((tm - 60) / 25));
      else if(mode === "sprint" || mode === "zen") lv = 1;
      return Math.max(0.03, 0.9 * Math.pow(0.82, lv-1));
    };
    const cells = (p, dx, dy, r) => rotCells(p.k, r==null ? p.r : r).map(([x,y]) => [x + p.x + (dx||0), y + p.y + (dy||0)]);
    const fits = (p, dx, dy, r) => cells(p, dx, dy, r).every(([x,y]) => x>=0 && x<COLS && y<ROWS && (y<0 || !board[y][x]));
    const live = () => cur && !clearing && !over && !paused && started;
    function spawn(k){
      cur = { k: k || queue.shift(), r: 0, x: 3, y: HID - 2 }; if(!k) queue.push(nextKind());
      if(!fits(cur)) { cur.y--; if(!fits(cur)) return topOut(); }
      if(fits(cur, 0, 1)) cur.y++;                    // guideline: drop one row right away
      fallT = 0; lockT = 0; lockMoves = 0; lowY = cur.y; lastRot = false; drawSide(); bdDirty = true;
      // hold the arrow key? keep sliding the new piece (DAS carries over)
      if(hdir && dasT >= feel.das && feel.arr === 0) while(fits(cur, hdir, 0)) cur.x += hdir;
    }
    function drawSide(){
      for(let i=0;i<5;i++) $("#tsN"+i).innerHTML = pieceHtml(queue[i]);
      $("#tsHold i").innerHTML = hold ? pieceHtml(hold, held ? "used" : "") : "";
    }
    const onGround = () => !fits(cur, 0, 1);
    function moved(){ if(onGround() && lockMoves < 15){ lockT = 0; lockMoves++; } bdDirty = true; }
    function move(dx){ if(!live()) return false; if(fits(cur, dx, 0)){ cur.x += dx; lastRot = false; snd("key"); moved(); return true; } return false; }
    function rotate(dir){   // 1 = cw, -1 = ccw, 2 = 180
      if(!live() || cur.k === "O") return false;
      const nr = (cur.r + dir + 4) % 4, ks = kicks(cur.k, cur.r, nr);
      for(let i=0;i<ks.length;i++){ const [kx, ky] = ks[i];
        if(fits(cur, kx, ky, nr)){ cur.x += kx; cur.y += ky; cur.r = nr; lastRot = true; lastKick = i; snd("tap"); moved(); return true; } }
      return false;
    }
    function soft(){ if(!live()) return; if(fits(cur, 0, 1)){ cur.y++; score += 1; fallT = 0; lastRot = false; bdDirty = true; } }
    function hard(){ if(!live()) return; const y0 = cur.y; let n = 0; while(fits(cur, 0, 1)){ cur.y++; n++; } if(n) lastRot = false; score += n*2;
      if(n > 0){ const top = {}; for(const [x,y] of cells(cur)){ if(top[x] == null || y < top[x]) top[x] = y; }
        for(const x in top){ const [cx, cyEnd, cw] = cellXY(+x, top[x]), cyStart = cellXY(+x, Math.max(HID - .5, top[x] - n))[1]; trails.push({ x: cx, y0: cyStart - cw/2, y1: cyEnd + cw/2, w: cw, c: furOf(cur.k), t: 0 }); }
        for(const [x,y] of cells(cur)) if(!fits(cur, 0, 1) && (y + 1 >= ROWS || board[y+1][x])) { const [cx, cy, cw] = cellXY(x, y); spark(cx, cy + cw/2, ["#fff", furOf(cur.k)], 2, 90, { up: true, life: .35, size: 3 }); }
        $("#tsWrap").style.setProperty("--bump", Math.min(7, 2 + n/3) + "px"); anim($("#tsWrap"), "bump"); }
      lock(); }
    function doHold(){ if(!live() || held) return; const k = cur.k; if(hold){ const h2 = hold; hold = k; spawn(h2); } else { hold = k; spawn(); } held = true; snd("select"); drawSide(); }
    function tSpin(){
      if(cur.k !== "T" || !lastRot) return 0;
      const filled = (x, y) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y][x]);
      const cx = cur.x + 1, cy = cur.y + 1;
      const cs = [[cx-1,cy-1],[cx+1,cy-1],[cx+1,cy+1],[cx-1,cy+1]].map(([x,y]) => !!filled(x,y));   // TL TR BR BL
      if(cs.filter(Boolean).length < 3) return 0;
      const front = [[0,1],[1,2],[2,3],[3,0]][cur.r];
      return (cs[front[0]] && cs[front[1]]) || lastKick === 4 ? 2 : 1;   // 2 = full, 1 = mini
    }
    function lock(){
      const ts = tSpin();
      const cs = cells(cur);
      if(cs.every(([,y]) => y < HID)) { for(const [x,y] of cs) if(y >= 0) board[y][x] = cur.k; return topOut(); }   // locked above the field
      for(const [x,y] of cs){ if(y >= 0) board[y][x] = cur.k; }
      lockFlash = { cells: cs, t: 0 };
      if(ts) for(const [x,y] of cs){ const [cx, cy] = cellXY(x, y); spark(cx, cy, ["#ffe08a","#fff","#f7a7c0"], 3, 120, { life: .5, size: 4, g: 0 }); }
      cur = null; held = false; pieces++; bdDirty = true;
      const full = []; for(let y=0;y<ROWS;y++) if(board[y].every(Boolean)) full.push(y);
      const n = full.length;
      if(n){
        combo++;
        const hardClear = n === 4 || ts > 0;
        if(hardClear) b2b++; else b2b = -1;
        const pc = board.every((row, y) => full.includes(y) || row.every(c => !c));
        // score (guideline)
        let pts = ts === 2 ? [400,800,1200,1600][n] : ts === 1 ? [100,200,400,400][n] : [0,100,300,500,800][n];
        if(hardClear && b2b > 0) pts = Math.floor(pts * 1.5);
        pts = pts * level + (combo > 0 ? 50 * combo * level : 0);
        if(pc) pts += (n === 4 && b2b > 0 ? 3200 : [0,800,1200,1800,2000][n]) * level;
        score += pts; lines += n;
        // attack (TETR.IO style)
        let atk = ts === 2 ? ATK_TS[Math.min(3,n)] : ts === 1 ? ATK_MINI[Math.min(3,n)] : ATK_LINES[n];
        if(hardClear && b2b > 0) atk += 1;
        atk += COMBO_ATK[Math.min(combo, COMBO_ATK.length - 1)];
        if(pc) atk += 10;
        atkTotal += atk;
        if(atk > 0){
          let a = atk;   // cancel incoming garbage first
          while(a > 0 && incoming.length){ const take = Math.min(a, incoming[0].n); incoming[0].n -= take; a -= take; if(!incoming[0].n) incoming.shift(); }
          if(a > 0 && isVs){ atkSent += a; send({ k:"atk", n:a, col:(Math.random() * COLS) | 0 });
            const fr = $("#tsFc") && $("#tsFc").getBoundingClientRect(), br = cv.getBoundingClientRect();
            if(fr) orbs.push({ x0: br.left + br.width/2, y0: br.top + br.height*.6, x1: fr.left + fr.width/2, y1: fr.top + fr.height/2, n: a, t: 0 }); }
          drawGb();
        }
        clearing = { rows: full, t: 0 };
        const big = n >= 4 || ts === 2 || pc;
        for(const y of full){ const [, cy, cw] = cellXY(0, y); beams.push({ y: cy, h: cw, t: 0 });
          for(let x=0;x<COLS;x++){ const [cx] = cellXY(x, y); spark(cx, cy, [furOf(board[y][x]), "#fff"], big ? 4 : 2, big ? 260 : 170, { up: true, life: big ? .9 : .65, size: cw*.32 }); } }
        if(big) anim($("#tsMid"), "shake");
        if(pc){ bigText("全部清空！", "pc"); confetti(60); }
        else if(ts === 2) bigText(`T-Spin ${["","單消","雙消","三消"][n]}！`, "ts");
        else if(n === 4) bigText(b2b > 0 ? `B2B 四消！` : "四消！", "quad");
        else if(combo >= 3) bigText(`${combo} 連擊！`, "combo");
        snd(n >= 4 || ts === 2 ? "level" : "combo", n);
        const name = ts === 2 ? `T-Spin ${["","單消","雙消","三消"][n]}！` : ts === 1 ? `T-Spin Mini ${["","單消","雙消"][n] || ""}` : n === 4 ? "四消 QUAD！🎉" : n === 3 ? "三消！" : n === 2 ? "雙消" : "";
        act([pc ? "✨ 全部清空！" : "", name, hardClear && b2b > 0 ? `B2B ×${b2b}` : "", combo > 0 ? `${combo} 連擊` : ""].filter(Boolean), pc || ts === 2 || n === 4);
        if(mode === "marathon" || mode === "blitz"){ const nl = Math.floor(lines / (mode === "blitz" ? 8 : 10)) + 1; if(nl > level){ level = nl; setTimeout(()=>pop(`等級 ${level}！變快囉`), 400); } }
        if(mode === "sprint" && lines >= 40){ lines = 40; return win("sprint"); }
      } else {
        combo = -1;
        if(ts) act([ts === 2 ? "T-Spin！" : "T-Spin Mini"], false);
        snd("place");
        if(incoming.length && !addGarbage()) return;
        spawn();
      }
      updHud();
    }
    function addGarbage(){
      let cap = 8;
      while(cap > 0 && incoming.length){
        const g0 = incoming[0], take = Math.min(cap, g0.n);
        for(let i=0;i<take;i++){
          const top = board.shift(); if(top.some(Boolean)){ board.unshift(top); incoming = []; drawGb(); topOut(); return false; }
          const row = Array(COLS).fill("g"); row[g0.col] = null; board.push(row);
        }
        g0.n -= take; cap -= take; if(!g0.n) incoming.shift();
      }
      snd("miss"); anim($("#tsWrap"), "hit"); { const r = cv.getBoundingClientRect(); for(let i=0;i<10;i++) spark(r.left + Math.random()*r.width, r.bottom, ["#b4abbd","#e5486a"], 1, 140, { up: true, life: .5, size: 4 }); }
      drawGb(); bdDirty = true; return true;
    }
    function drawGb(){ const n = incoming.reduce((a,b)=>a+b.n, 0); const i = $("#tsGb i"); i.style.height = Math.min(100, n / VIS * 100) + "%"; $("#tsGb").classList.toggle("on", n > 0); }
    let popT = 0, actT = 0;
    function pop(t){ if(!t) return; const P = $("#tsPop"); P.textContent = t; P.classList.remove("on"); void P.offsetWidth; P.classList.add("on"); clearTimeout(popT); popT = setTimeout(()=>P.classList.remove("on"), 1200); }
    function act(list, big){ if(!list.length) return; const A = $("#tsAct"); A.innerHTML = list.map(t=>`<div>${esc(t)}</div>`).join(""); A.classList.remove("on","big"); void A.offsetWidth; A.classList.add("on"); if(big) A.classList.add("big"); clearTimeout(actT); actT = setTimeout(()=>A.classList.remove("on"), 1600); }
    const pps = () => tm > 0.5 ? (pieces / tm).toFixed(2) : "0.00";
    const apm = () => tm > 0.5 ? (atkTotal / tm * 60).toFixed(1) : "0.0";
    function updHud(){
      const M = $("#tsMain"), S = $("#tsStats");
      const st = (k, v) => `<div><span>${k}</span><b>${v}</b></div>`;
      if(mode === "sprint"){ M.textContent = fmtT(tm); S.innerHTML = st("行數", `${lines}/40`) + st("每秒", pps()); }
      else if(mode === "blitz"){ M.textContent = fmtS(120 - tm); S.innerHTML = st("分數", score) + st("等級", level) + st("行數", lines); }
      else if(mode === "zen"){ M.textContent = lines; S.innerHTML = st("分數", score) + st("每秒", pps()); }
      else if(isVs){ M.textContent = fmtS(tm); S.innerHTML = st("攻擊", atkTotal) + st("每分攻擊", apm()) + st("每秒", pps()); }
      else { M.textContent = score; S.innerHTML = st("行數", lines) + st("等級", level); }
    }
    function topOut(){
      if(over) return;
      if(mode === "zen"){   // zen never ends: tidy up and keep going
        board = Array.from({length:ROWS}, () => Array(COLS).fill(null)); incoming = []; cur = null; pop("整理乾淨了～ 繼續 🌙"); snd("select"); spawn(); return;
      }
      over = true; cur = null; snd("miss");
      if(isVs) send({ k:"ko" });
      setTimeout(()=>{ if(!done) anim($("#tsWrap"), "fall"); }, 350);
      let y = ROWS - 1; const greyT = setInterval(()=>{ if(y < 0 || done){ clearInterval(greyT); return; } for(let x=0;x<COLS;x++) if(board[y][x]) board[y][x] = "dead"; y--; }, 30);
      setTimeout(()=>finish(isVs ? "lose" : mode === "sprint" ? "fail" : "over"), 1300);
    }
    function win(why){ if(over) return; over = true; cur = null; snd("level"); confetti(why === "win" ? 90 : 50); if(why === "win") bigText("KO！", "ko"); else if(why === "sprint") bigText("完成！", "pc"); else if(why === "blitz") bigText("時間到！", "quad"); setTimeout(()=>finish(why), why === "win" ? 1500 : 1100); }
    function finish(why){
      if(done || result) return;
      const r = result = { mode, why, score, lines, level, time: Math.round(tm * 1000), win: why === "win", atk: atkTotal, pps: +pps(), apm: +apm() };
      let coins = Math.min(60, lines); if(mode === "zen") coins = Math.min(20, Math.floor(lines / 2)); if(why === "win") coins += 5; if(why === "drop") coins = 0;
      r.coins = coins;
      const prev = opts.best;
      r.rec = mode === "sprint" ? why === "sprint" && (!prev || r.time < prev) : (mode === "blitz" || mode === "marathon") ? score > (prev || 0) && score > 0 : mode === "zen" ? lines > (prev || 0) : false;
      let head = "", big = "", sub = "";
      if(isVs){ head = why === "win" ? "🏆 你贏了！" : why === "drop" ? "對方好像斷線了 📶" : `這局 ${esc(opts.foe || "ta")} 贏了～`; big = why === "win" ? "WIN" : why === "drop" ? "—" : "KO";
        sub = `送出 <b>${atkSent}</b> 行垃圾・消了 ${lines} 行<br>每秒 ${r.pps} 塊・每分 ${r.apm} 攻擊`; }
      else if(mode === "sprint"){ head = why === "sprint" ? (r.rec ? "🎉 新紀錄！" : "🏁 完成 40 行！") : "疊到頂了～"; big = why === "sprint" ? fmtT(tm) : `${lines}/40`;
        sub = `每秒 ${r.pps} 塊${prev ? `<br>最快紀錄 ${fmtT(Math.min(prev, why === "sprint" ? r.time : prev)/1000)}` : ""}`; }
      else if(mode === "zen"){ head = "🌙 今天也辛苦了"; big = `${lines} 行`; sub = `${score} 分・每秒 ${r.pps} 塊`; }
      else { head = r.rec ? "🎉 新紀錄！" : mode === "blitz" ? "⏱️ 時間到！" : "疊到頂了～"; big = `${score} 分`; sub = `消了 <b>${lines}</b> 行・等級 ${level}${!r.rec && prev ? `<br>最高紀錄 ${prev} 分` : ""}`; }
      if(coins && opts.hasPet) sub += `<br>${coins} 個貓幣送進養貓房間了 🪙`;
      const E = $("#tsEnd"); E.classList.remove("hidden");
      E.innerHTML = `<div class="tsCard"><div class="tsCats">${["O","T","Z","I"].map(k=>`<img src="${cellUrl(k)}">`).join("")}</div><h3>${head}</h3>
        <p class="tsBig">${big}</p><p>${sub}</p>
        <div class="tsBtns"><button class="btn sub" id="tsBack">回去</button><button class="btn" id="tsAgain">${isVs ? "再來一場" : "再玩一次"}</button></div></div>`;
      Promise.resolve(opts.onEnd && opts.onEnd(r)).catch(()=>{});
      $("#tsBack").addEventListener("click", () => close(false));
      $("#tsAgain").addEventListener("click", () => close(true));
    }
    function setPause(p){ if(over || isVs || !started) return; paused = p; const b = $("#tsPa"); if(b) b.textContent = p ? "▶" : "⏸"; ov.classList.toggle("paused", p); }
    // ---- input: held directions with DAS / ARR, handled inside the game loop ----
    let hdir = 0, dasT = 0, arrT = 0, downHeld = false; const dirs = [];
    function press(d){ const i = dirs.indexOf(d); if(i >= 0) dirs.splice(i, 1); dirs.push(d); hdir = d; dasT = 0; arrT = 0; if(!move(d) && live()) anim(cv, d < 0 ? "nl" : "nr"); }
    function release(d){ const i = dirs.indexOf(d); if(i >= 0) dirs.splice(i, 1); const nd = dirs.length ? dirs[dirs.length-1] : 0; if(nd !== hdir){ hdir = nd; dasT = 0; arrT = 0; } }
    function update(dt){
      if(over || paused) return;
      if(!started){ cdT += dt; const cd = $("#tsCd"); const tx = cdT < 0.8 ? "準備…" : "開始！"; if(cd.textContent !== tx){ cd.textContent = tx; cd.className = "tsCd"; void cd.offsetWidth; cd.className = "tsCd on" + (cdT >= 0.8 ? " go" : ""); }
        if(cdT >= 1.2){ started = true; cd.className = "tsCd"; } return; }
      tm += dt;
      if(mode === "blitz" && tm >= 120){ tm = 120; updHud(); return win("blitz"); }
      if(isVs){
        if(performance.now() - sentBd > 250 && bdDirty){ sentBd = performance.now(); bdDirty = false; send({ k:"bd", b: enc(), gb: incoming.reduce((a,b)=>a+b.n, 0) }); }
        if(performance.now() - foeSeen > 15000){ over = true; cur = null; return finish("drop"); }
      }
      if(clearing){ clearing.t += dt; if(clearing.t > 0.18){ for(const y of clearing.rows.slice().sort((a,b)=>a-b)){ board.splice(y, 1); board.unshift(Array(COLS).fill(null)); } clearing = null; spawn(); updHud(); } return; }
      if(!cur) return;
      if(hdir){ dasT += dt; if(dasT >= feel.das){ if(feel.arr === 0){ while(fits(cur, hdir, 0)) move(hdir); } else { arrT += dt; while(arrT >= feel.arr){ arrT -= feel.arr; if(!move(hdir)) { arrT = 0; break; } } } } }
      if(!cur) return;
      if(onGround()){ lockT += dt; if(lockT > 0.5 || lockMoves >= 15 && lockT > 0.05) lock(); }
      else { fallT += dt * (downHeld ? 20 : 1); const sp = gravity(); while(fallT >= sp && cur && fits(cur, 0, 1)){ fallT -= sp; cur.y++; lastRot = false; bdDirty = true; if(downHeld) score += 1;
        if(cur.y > lowY){ lowY = cur.y; lockMoves = 0; } } }
      if(Math.floor(tm * 10) !== Math.floor((tm - dt) * 10)) updHud();
    }
    const ry = y => (y - HID) * C;
    function draw(){
      g.drawImage(bg, 0, 0);
      for(let y=HID;y<ROWS;y++) for(let x=0;x<COLS;x++){ const k = board[y][x]; if(!k) continue;
        const flash = clearing && clearing.rows.includes(y);
        if(flash){ const t = clearing.t / 0.18; const s = cellSprite(k === "g" ? "Z" : k, Math.floor(t*6)%2 ? "flash" : k === "g" ? "junk" : "normal"); const k2 = Math.max(0.1, 1 - t*0.6); const o = C*(1-k2)/2; g.drawImage(s, x*C+o, ry(y)+o - t*4, C*k2, C*k2); }
        else g.drawImage(k === "dead" ? cellSprite("Z", "dead") : k === "g" ? cellSprite("Z", "junk") : cellSprite(k, "normal"), x*C, ry(y)); }
      if(cur){
        let gy = 0; while(fits(cur, 0, gy+1)) gy++;
        if(gy > 0) for(const [x,y] of cells(cur, 0, gy)) if(y >= HID) g.drawImage(cellSprite(cur.k, "ghost"), x*C, ry(y));
        for(const [x,y] of cells(cur)) if(y >= HID) g.drawImage(cellSprite(cur.k, "normal"), x*C, ry(y));
      }
      if(lockFlash){ const a = 1 - lockFlash.t / .14; if(a <= 0) lockFlash = null; else { g.fillStyle = `rgba(255,255,255,${(a*.75).toFixed(2)})`; for(const [x,y] of lockFlash.cells) if(y >= HID) g.fillRect(x*C, ry(y), C, C); } }
      // danger: stack close to the top
      let top = ROWS; for(let y=0;y<ROWS && top===ROWS;y++) if(board[y].some(c => c && c !== "dead")) top = y;
      ov.classList.toggle("danger", !over && top < HID + 4);
    }
    // ---- versus: tiny copy of the other board ----
    const CODE = { I:"I", O:"O", T:"T", S:"S", Z:"Z", J:"J", L:"L", g:"g", dead:"g" };
    function enc(){ const b = board.map(r => r.slice()); if(cur) for(const [x,y] of cells(cur)) if(y >= 0) b[y][x] = cur.k; return b.slice(HID).map(r => r.map(c => c ? CODE[c] : ".").join("")).join(""); }
    function drawFoe(s, gb){
      const fc = $("#tsFc"); if(!fc) return; const f = fc.getContext("2d");
      f.fillStyle = "#fff9ef"; f.fillRect(0, 0, fc.width, fc.height);
      for(let i=0;i<Math.min(s.length, COLS*VIS);i++){ const c = s[i]; if(c === ".") continue; f.fillStyle = c === "g" ? "#b4abbd" : (PIECES[c] ? PIECES[c].fur : "#ccc"); f.fillRect((i % COLS) * 4, Math.floor(i / COLS) * 4, 4, 4); }
      const e = $("#tsFg"); if(e) e.textContent = gb ? `⚠️ 還有 ${gb} 行垃圾要收` : "";
    }
    function send(p){ try{ opts.net && opts.net.send(p); }catch(e){} }
    const offNet = opts.net && opts.net.on(p => {
      if(done) return; foeSeen = performance.now();
      if(p.k === "atk" && !over){ const n = Math.max(0, Math.min(20, p.n|0)); if(n){ incoming.push({ n, col: Math.max(0, Math.min(COLS-1, p.col|0)) }); drawGb(); anim($("#tsGb"), "pulse"); snd("tap"); } }
      else if(p.k === "bd") drawFoe(String(p.b || ""), p.gb|0);
      else if(p.k === "ko" && !over){ win("win"); }
    });
    function loop(t){ if(done) return; let dt = (t - last)/1000; last = t; if(dt > 0.1) dt = 0.1; update(dt); if(lockFlash) lockFlash.t += dt; try{ draw(); fxStep(dt); }catch(e){} raf = requestAnimationFrame(loop); }
    function size(){
      fxSize();
      const mid = $("#tsMid"), cols = ov.querySelectorAll(".tsCol");
      const sideW = cols[0].offsetWidth + cols[1].offsetWidth + 12;
      const aw = Math.min(mid.clientWidth - sideW, 360), ah = mid.clientHeight - 6;
      const k = Math.max(1, Math.min(aw / W, ah / H));
      cv.style.width = Math.floor(W*k) + "px"; cv.style.height = Math.floor(H*k) + "px";
    }
    // ---- buttons ----
    ov.querySelectorAll(".tsB").forEach(b => {
      const a = b.dataset.a;
      b.addEventListener("pointerdown", e => { e.preventDefault(); try{ b.setPointerCapture(e.pointerId); }catch(_){} b.classList.add("on");
        if(a==="L") press(-1); else if(a==="R") press(1); else if(a==="D"){ downHeld = true; soft(); }
        else if(a==="CW") rotate(1); else if(a==="CCW") rotate(-1); else if(a==="F") rotate(2); else if(a==="X") hard(); else if(a==="H") doHold(); });
      const up = () => { if(!b.classList.contains("on")) return; b.classList.remove("on"); if(a==="L") release(-1); else if(a==="R") release(1); else if(a==="D") downHeld = false; };
      b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
      b.addEventListener("contextmenu", e => e.preventDefault());
    });
    const onKey = e => { if(over) return; const k = e.key; if(e.repeat && k !== "ArrowDown") return;
      if(k==="ArrowLeft") press(-1); else if(k==="ArrowRight") press(1); else if(k==="ArrowUp" || k==="x" || k==="X") rotate(1); else if(k==="z" || k==="Z" || k==="Control") rotate(-1); else if(k==="a" || k==="A") rotate(2);
      else if(k==="ArrowDown"){ downHeld = true; } else if(k===" "){ e.preventDefault(); hard(); } else if(k==="c" || k==="C" || k==="Shift") doHold(); else if(k==="p" || k==="Escape") setPause(!paused); };
    const onKeyUp = e => { const k = e.key; if(k==="ArrowLeft") release(-1); else if(k==="ArrowRight") release(1); else if(k==="ArrowDown") downHeld = false; };
    document.addEventListener("keydown", onKey); document.addEventListener("keyup", onKeyUp);
    $("#tsHold").addEventListener("click", doHold);
    const pa = $("#tsPa"); if(pa) pa.addEventListener("click", () => { snd("tap"); setPause(!paused); });
    ov.addEventListener("click", e => { if(paused && e.target === ov) setPause(false); });
    const onVis = () => { if(document.visibilityState === "hidden") setPause(true); };
    document.addEventListener("visibilitychange", onVis);
    $("#tsQuit").addEventListener("click", () => {
      if(over) return; const t = Date.now();
      if(t - quitArm < 2500){ snd("tap");
        if(mode === "zen"){ over = true; cur = null; finish("zen"); return; }
        if(isVs){ topOut(); return; }       // leaving a match = giving up
        close(false); return; }
      quitArm = t; const q = $("#tsQuit"); const old = q.textContent; q.textContent = isVs ? "再按一次認輸" : "再按一次"; setTimeout(()=>{ if(q.isConnected) q.textContent = old; }, 2500); });
    function close(again){ if(done) return; done = true; cancelAnimationFrame(raf); if(offNet) offNet(); window.removeEventListener("resize", size); document.removeEventListener("keydown", onKey); document.removeEventListener("keyup", onKeyUp); document.removeEventListener("visibilitychange", onVis); ov.remove(); resolve(again ? "again" : "back"); }
    ov.__close = () => { if(isVs && !over && !done) send({ k:"ko" }); close(false); };
    window.addEventListener("resize", size);
    if(window.__mock) window.__ts = { board: () => board, cur: () => cur, HID, ROWS,
      fill(rows){ for(const [y, s] of rows) board[y] = [...s].map(c => c === "." ? null : c); },
      set(k, x, y, r, rot){ spawn(k); if(x != null){ cur.x = x; cur.y = y; cur.r = r || 0; lastRot = !!rot; lastKick = 0; } }, start(){ started = true; cdT = 9; },
      hard, move, rotate, soft, hold: doHold, score: () => score, lines: () => lines, end: topOut, pause: setPause,
      incoming: () => incoming, b2b: () => b2b, combo: () => combo, atk: () => atkTotal, sent: () => atkSent, result: () => result, setTm(t){ tm = t; }, queue: () => queue.slice() };
    spawn(); updHud(); drawGb();
    requestAnimationFrame(() => { size(); last = performance.now(); raf = requestAnimationFrame(loop); });
  });
}
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c])); }

window.CatTetris = { play, pieceHtml, cellUrl, rotCells, kicks };
if(window.GameArt) window.GameArt.cattris = () => `<span class="gaL tsArt" style="left:4%;bottom:4%;width:92%">${[["O",0,2],["O",1,2],["Z",2,2],["T",3,2],["T",4,2],["I",5,2],["O",0,1],["O",1,1],["Z",2,1],["Z",3,1],["T",4,1],["I",5,1],["L",1,0],["T",4,0],["I",5,0]].map(([k,x,y])=>`<img src="${cellUrl(k)}" style="left:${x*16.66}%;top:${y*33.3}%">`).join("")}</span>`;

App.registerGame({
  id: "cattris",
  name: "喵喵俄羅斯方塊",
  desc: "現代版俄羅斯方塊，還能跟 ta 即時對戰",
  icon: () => Pix.sprite("orange","happy"),
  mount(el, ctx){
    const { esc, SFX } = ctx;
    let s = null, playing = false, vsRun = 0, net = null;
    const me = () => ctx.me.uid;
    const partner = () => ctx.partner();
    const partnerOn = () => { const p = partner(); return !!(p && ctx.isOnline(p.user_id)); };
    const FRESH = 5 * 60 * 1000;
    const fresh = r => { const o = {}; for(const k in (r||{})) if(Date.now() - r[k] < FRESH) o[k] = r[k]; return o; };
    let feel = "std"; try{ feel = localStorage.getItem("mw_tsFeel") || "std"; }catch(e){}
    function lobby(){
      if(playing) return;
      const p = partner(), pid = p && p.user_id, st = s || {};
      const best = st.best || {}, sp = st.sprint || {}, bl = st.blitz || {}, zl = st.zenL || {};
      const vs = st.vs || {}, ready = fresh(vs.ready), w = vs.w || {};
      const two = (a, b, f) => `${f(a)}${p ? `<small>${esc(p.name)} ${f(b)}</small>` : ""}`;
      let vsTxt, vsCls = "";
      if(!p) vsTxt = "等 ta 加入小窩";
      else if(ready[me()] && !ready[pid]) { vsTxt = `等 ${esc(p.name)} 按接受…（點這裡取消）`; vsCls = "wait"; }
      else if(ready[pid] && !ready[me()]) { vsTxt = `💌 ${esc(p.name)} 想跟你對戰！點這裡開打`; vsCls = "inv"; }
      else if(!partnerOn()) vsTxt = `⚪ ${esc(p.name)} 不在線上`;
      else vsTxt = `🟢 ${esc(p.name)} 在線上，邀請 ta 對戰`;
      el.innerHTML = `<div class="box tsLobby">
        <div class="tsParade">${KINDS.map(k=>`<span title="${PIECES[k].name}">${pieceHtml(k)}</span>`).join("")}</div>
        <p class="tsIntro">現代版的貓貓俄羅斯方塊！<br>可以看 <b>5 個下一塊</b>、收起來、<b>180° 旋轉</b>、轉 <b>T-Spin</b>，還能跟 ta <b>即時對戰</b> ⚔️</p>
        <div class="tsModes">
          <button data-m="vs" class="vs ${vsCls}"><b>⚔️ 跟 ta 對戰</b><span>${vsTxt}</span>${p && (w[me()] || w[pid]) ? `<em>戰績 ${esc(ctx.me.name)} ${w[me()]||0} : ${w[pid]||0} ${esc(p.name)}</em>` : `<em>消行會送垃圾行給對方，先疊到頂的人輸</em>`}</button>
          <button data-m="sprint"><b>🏁 40 行競速</b><span>越快消完 40 行越厲害</span><em>${two(sp[me()], pid && sp[pid], v => v ? fmtT(v/1000) : "還沒完成")}</em></button>
          <button data-m="blitz"><b>⏱️ 2 分鐘挑戰</b><span>2 分鐘內拿最多分</span><em>${two(bl[me()], pid && bl[pid], v => `${v||0} 分`)}</em></button>
          <button data-m="marathon"><b>🐾 經典模式</b><span>越消越快，疊到頂就結束</span><em>${two(best[me()], pid && best[pid], v => `${v||0} 分`)}</em></button>
          <button data-m="zen"><b>🌙 禪模式</b><span>慢慢玩，不會輸</span><em>${two(zl[me()], pid && zl[pid], v => `最多 ${v||0} 行`)}</em></button>
        </div>
        <div class="tsFeel"><span>手感</span>${Object.entries(FEEL).map(([k,f])=>`<button data-f="${k}" class="${k===feel?"on":""}">${f.n}</button>`).join("")}</div>
        <div class="tsHow"><span>◀ ▶ 按住連續滑</span><span>▼ 加速</span><span>⤓ 直接落下</span><span>↺ ↻ 旋轉</span><span>180° 轉半圈</span><span>收 先收起來</span></div>
        <div class="k" style="text-align:center">每消一行得 1 個貓幣，對戰贏了再多 5 個 🪙</div></div>`;
      el.querySelectorAll("[data-f]").forEach(b => b.addEventListener("click", () => { feel = b.dataset.f; try{ localStorage.setItem("mw_tsFeel", feel); }catch(e){} SFX.tap(); lobby(); }));
      el.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { const m = b.dataset.m; if(m === "vs") vsTap(); else go(m); }));
    }
    async function vsTap(){
      const p = partner(); if(!p){ ctx.toast("要等 ta 加入小窩才能對戰喔"); return; }
      const pid = p.user_id, vs = (s && s.vs) || {}, ready = fresh(vs.ready);
      if(ready[me()] && !ready[pid]){   // cancel my invite
        SFX.tap(); await ctx.update("tetris", st=>{ st = st || {}; st.vs = st.vs || {}; const r = fresh(st.vs.ready); delete r[me()]; st.vs.ready = r; return st; }); return; }
      if(!partnerOn()){ ctx.toast(`要等 ${p.name} 也在線上才能對戰喔`); SFX.miss(); return; }
      SFX.select(); await vsReady();
    }
    async function vsReady(){
      const p = partner(); if(!p) return; const pid = p.user_id;
      await ctx.update("tetris", st=>{ st = st || {}; const vs = st.vs = st.vs || {}; const r = fresh(vs.ready); r[me()] = Date.now();
        if(r[pid]){ vs.live = true; vs.run = Date.now(); vs.seed = (Math.random()*1e9)|0; vs.p = [me(), pid]; vs.ready = {}; }
        else vs.ready = r;
        return st; });
    }
    function maybeStartVs(){
      const vs = s && s.vs; if(!vs || !vs.live || playing || vs.run === vsRun) return;
      if(!(vs.p||[]).includes(me()) || Date.now() - vs.run > 60000) return;
      vsRun = vs.run; go("vs", vs);
    }
    const subs = [];
    net = { send: p => ctx.broadcast(Object.assign({ g:"ts", run: vsRun }, p)), on: h => { subs.push(h); return () => { const i = subs.indexOf(h); if(i >= 0) subs.splice(i, 1); }; } };
    const offBc = ctx.onBroadcast(p => { if(!p || p.g !== "ts" || p.from === me() || p.run !== vsRun) return; subs.slice().forEach(h => h(p)); });
    async function go(mode, vs){
      if(document.querySelector(".tsGame")) return;
      SFX.tap(); playing = true;
      let again = true;
      while(again){
        const st0 = s || {};
        const best = mode === "sprint" ? (st0.sprint||{})[me()] : mode === "blitz" ? (st0.blitz||{})[me()] : mode === "zen" ? (st0.zenL||{})[me()] : mode === "marathon" ? (st0.best||{})[me()] : 0;
        const opts = { sfx: SFX, mode, feel, best: best || 0, hasPet: true, seed: vs ? vs.seed : 0, foe: partner() ? partner().name : "ta", net: mode === "vs" ? net : null };
        ctx.getState("pet").then(pet=>{ opts.hasPet = !!(pet && pet.state); }).catch(()=>{});
        const run = vsRun;
        const r = await play(Object.assign(opts, { onEnd: async r => {
          await ctx.update("tetris", st=>{ st = st || {}; ["best","lines","plays","sprint","blitz","zenL"].forEach(k => st[k] = st[k] || {});
            st.plays[me()] = (st.plays[me()]||0) + 1;
            if(mode === "marathon"){ if(r.score > (st.best[me()]||0)) st.best[me()] = r.score; if(r.lines > (st.lines[me()]||0)) st.lines[me()] = r.lines; }
            if(mode === "sprint" && r.why === "sprint" && (!st.sprint[me()] || r.time < st.sprint[me()])) st.sprint[me()] = r.time;
            if(mode === "blitz" && r.score > (st.blitz[me()]||0)) st.blitz[me()] = r.score;
            if(mode === "zen" && r.lines > (st.zenL[me()]||0)) st.zenL[me()] = r.lines;
            if(mode === "vs" && st.vs && st.vs.run === run && st.vs.live && (r.why === "lose" || r.why === "win")){
              const p = partner(), winner = r.why === "win" ? me() : (p ? p.user_id : "");
              st.vs.live = false; st.vs.res = { run, w: winner }; st.vs.w = st.vs.w || {}; if(winner) st.vs.w[winner] = (st.vs.w[winner]||0) + 1; }
            st.last = { by:me(), mode, score:r.score, at:Date.now() }; return st; });
          if(r.rec) ctx.notifyPartner(mode === "sprint" ? `${ctx.me.name} 在「喵喵俄羅斯方塊」40 行競速跑出新紀錄：${fmtT(r.time/1000)}！` : `${ctx.me.name} 在「喵喵俄羅斯方塊」${MODES[mode].n.slice(2)}拿到新紀錄：${mode === "zen" ? r.lines + " 行" : r.score + " 分"}！`);
          if(r.coins > 0) await ctx.update("pet", st=>{ if(!st || !window.PetLogic) return undefined; st = window.PetLogic.norm(JSON.parse(JSON.stringify(st)));
            st.coins = (st.coins||0) + r.coins; st.log = (st.log||[]).concat([{ by:me(), a:"cattris", n:r.coins, at:Date.now() }]).slice(-24); return st; });
        } }));
        again = r === "again";
        if(mode === "vs"){ if(again) await vsReady(); again = false; }
      }
      playing = false;
      lobby(); maybeStartVs();
    }
    this._u = ctx.onState("tetris", st=>{
      s = st;
      // the other side lost or left while broadcasts went missing
      if(playing && st && st.vs && st.vs.res && st.vs.res.run === vsRun && st.vs.res.w === me()) subs.slice().forEach(h => h({ k:"ko" }));
      if(!document.querySelector(".tsGame")) lobby();
      maybeStartVs();
    });
    this._b = offBc;
    (async()=>{ const cur = await ctx.getState("tetris").catch(()=>null); s = cur ? cur.state : null; lobby(); })();
  },
  unmount(){ if(this._u) this._u(); if(this._b) this._b(); const g = document.querySelector(".tsGame"); if(g && g.__close) g.__close(); },
});
})();
