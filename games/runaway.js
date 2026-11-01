// 遊戲：喵喵大逃亡（三條跑道的 3D 無限跑酷）
// 偷吃了狗狗的零食，被可愛的狗狗追！左右滑換跑道、到路口滑向轉彎、上滑跳、下滑滑過去。撿到的小魚乾每 2 條換 1 個貓幣（養貓用）
(function(){
const RW = 180, RH = 320;                 // low-res pixel canvas, scaled up crisp
const HOR = 118, F = 300, CAMH = 1.6, CATZ = 3.2;
const LW = 0.55, HALF = 0.86;             // lane width, road half width
const laneX = l => (l-1)*LW;
const O = "#5a3b2e";

// ---------- pixel sprites ----------
const BACK = [
  "..O..........O..",
  ".OPO........OPO.",
  ".OPYO......OYPO.",
  ".OYYYOOOOOOYYYO.",
  "OYYYYYYYYYYYYYYO",
  "OYYSYYYSSYYYSYYO",
  "OYYYYYYSSYYYYYYO",
  ".OYYYYYYYYYYYYO.",
  "..OOYYYYYYYYOO..",
  ".OYYYYYYYYYYYYO.",
  "OYYYYSYYYYSYYYYO",
  "OYYYYYSYYSYYYYYO",
  "OYYYYYYYYYYYYYYO",
  ".OYYYYYYYYYYYYO.",
];
const LEGS = [["..OYYO....OOO...","..OOO..........."], ["...OOO....OYYO..","..........OOO..."], ["..OYYO....OYYO..","..OOO.....OOO..."]];
const TAILS = [[[8,12],[8,11],[8,10],[9,9],[9,8],[9,7],[8,6]], [[8,12],[8,11],[7,10],[7,9],[7,8],[7,7],[8,6]]];
const VAC = [
  "...OOOO........OOOO...",
  "..OBBBBOOOOOOOOBBBBO..",
  "..OBBBOYYYYYYYYOBBBO..",
  "..OBBOYYYYYYYYYYOBBO..",
  "..OBBOYEEYYYYEEYOBBO..",
  "..OBBOYEHYYYYEHYOBBO..",
  "...OOYYYYWWWWYYYYOO...",
  "....OYYYWWNNWWYYYO....",
  "....OYYYWWWWWWYYYO....",
  "....OYYWWWOOWWWYYO....",
  ".....OYWWWKKWWWYO.....",
  "......OOWWKKWWOO......",
  "....OORRRRRRRRRROO....",
  "...OYYYYYYGYYYYYYYO...",
  "...OYWWYYYYYYYYWWYO...",
  "...OOOOO......OOOOO...",
];
const VPAL = { O, Y:"#f5e2c4", B:"#b0784a", W:"#ffffff", E:"#2b1d18", H:"#ffffff", N:"#2b1d18", K:"#f0708d", R:"#e5486a", G:"#ffcf4a" };  // 追在後面的狗狗
const FISH = [".OOO..O.","OYYYOOYO","OEYYYYO.","OYYYOOYO",".OOO..O."];
const FPAL = { O, Y:"#f2a65a", E:"#2b1d18" };
const GOLD = { O, Y:"#ffcf4a", E:"#2b1d18" };
const ARROW = ["...O....","..OKO...",".OKKOOOO","OKKKKKKO",".OKKOOOO","..OKO...","...O...."];
const mirror = rows => rows.map(r=>[...r].reverse().join(""));
function blit(g, rows, pal, x, y, s){ // x,y = top-left in low-res px, s = px per sprite pixel
  for(let j=0;j<rows.length;j++){ const r = rows[j]; for(let i=0;i<r.length;i++){ const c = pal[r[i]]; if(c){ g.fillStyle = c; g.fillRect(Math.floor(x+i*s), Math.floor(y+j*s), Math.ceil(s), Math.ceil(s)); } } }
}
const pr = (x, y, z) => [RW/2 + x*F/z, HOR + (CAMH - y)*F/z];   // world → screen

// ---------- one run ----------
function play(opts){
  return new Promise(resolve=>{
    const SFX = opts.sfx || {}; const snd = (k, ...a) => { try{ SFX[k] && SFX[k](...a); }catch(e){} };
    const cpal = Object.assign({ O }, Pix.palOf(opts.color || "orange"));
    const ov = document.createElement("div"); ov.className = "raGame";
    ov.innerHTML = `<div class="raBox"><div class="raHud"><span id="raD">0 m</span><span id="raF">🐟 0</span><button id="raX">✕</button></div>
      <canvas id="raC"></canvas><div class="raMsg hidden" id="raM"></div><div class="raTip" id="raTip">左右滑：換跑道・上滑：跳・下滑：滑過去<br>看到箭頭的路口：往箭頭方向滑就會轉彎</div></div>`;
    document.body.appendChild(ov);
    const cv = ov.querySelector("#raC"), out = cv.getContext("2d"), $ = q => ov.querySelector(q);
    const lc = document.createElement("canvas"); lc.width = RW; lc.height = RH; const g = lc.getContext("2d");
    let raf = 0, last = 0, done = false, R = null;

    function newSeg(first){
      const len = 70 + Math.random()*60 + (first ? 30 : 0), lvl = R ? Math.min(1, R.t/90) : 0;
      const dirs = Math.random() < .3 ? "LR" : Math.random() < .5 ? "L" : "R";
      const obs = [], fish = [], deco = [];
      let p = first ? 22 : 12;
      while(p < len - 10){
        const t = Math.random(), lane = (Math.random()*3)|0;
        if(t < .30) obs.push({ k:"box", p, lanes:[lane] });
        else if(t < .42){ const free = (Math.random()*3)|0; obs.push({ k:"box", p, lanes:[0,1,2].filter(l=>l!==free) }); }
        else if(t < .60){ obs.push({ k:"yarn", p, lanes:[0,1,2] }); for(let i=-2;i<=2;i++) fish.push({ p:p+i*.7, lane, h:.22 + (.62-.12*i*i) * .9 }); }
        else if(t < .76) obs.push({ k:"bar", p, lanes:[0,1,2] });
        else if(t < .88) obs.push({ k:"puddle", p, lanes:[0,1,2] });
        else { for(let i=0;i<6;i++) fish.push({ p:p+i*.8, lane, h:.2 }); p += 3; }
        if(Math.random() < .5 && obs.length && obs[obs.length-1].k==="box"){ const ol = [0,1,2].find(l=>!obs[obs.length-1].lanes.includes(l)); if(ol!=null) for(let i=1;i<=4;i++) fish.push({ p:p-5+i*.8, lane:ol, h:.2 }); }
        if(Math.random() < .06) fish.push({ p:p+3, lane:(Math.random()*3)|0, h:.25, gold:1 });
        p += Math.max(5.2, 9.5 - lvl*3.5) + Math.random()*4;
      }
      for(let q=2; q<len+6; q+= 2.2 + Math.random()*2.5) deco.push({ p:q, side: Math.random()<.5?-1:1, k: Math.random()<.55 ? "tree" : Math.random()<.5 ? "flower" : "bush", off: Math.random()*.9 });
      return { len, dirs, obs, fish, deco };
    }
    function reset(){
      R = { t:0, pos:0, v:7, dist:0, fish:0, gold:0, lane:1, lx:1, jump:0, slide:0, seg:null, dead:false, deadT:0, turnT:1, turnDir:0, chase:1, frame:0, msg:"" };
      R.seg = newSeg(true);
    }
    function size(){ const r = cv.getBoundingClientRect(); const d = Math.min(2, window.devicePixelRatio||1); cv.width = r.width*d; cv.height = r.height*d; out.imageSmoothingEnabled = false; }

    // ---------- controls ----------
    let sx = 0, sy = 0, swiped = true;
    function input(dir){
      if(!R || R.dead) return;
      const cp = R.pos + CATZ, nearCorner = cp > R.seg.len - 4.5 && cp < R.seg.len + 1.7;
      if((dir==="L" || dir==="R") && nearCorner && R.seg.dirs.includes(dir)){ turn(dir); return; }
      if(dir==="L" && R.lane > 0){ R.lane--; snd("key", .9); }
      else if(dir==="R" && R.lane < 2){ R.lane++; snd("key", .9); }
      else if(dir==="U" && R.jump <= 0){ R.jump = 1e-6; R.slide = 0; snd("jump"); }
      else if(dir==="D"){ R.slide = 1e-6; if(R.jump > 0) R.jump = Math.max(R.jump, .8); snd("tap"); }
    }
    function turn(dir){
      const cp = R.pos + CATZ, over = cp - R.seg.len;
      R.seg = newSeg(false); R.pos = Math.max(0, over) + .85 - CATZ; R.turnT = 0; R.turnDir = dir==="L" ? -1 : 1; snd("select"); R.dist += 0;
    }
    cv.addEventListener("pointerdown", e=>{ sx = e.clientX; sy = e.clientY; swiped = false; try{ cv.setPointerCapture(e.pointerId); }catch(_){} });
    cv.addEventListener("pointermove", e=>{ if(swiped) return; const dx = e.clientX - sx, dy = e.clientY - sy; if(Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
      swiped = true; input(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "L" : "R") : (dy < 0 ? "U" : "D")); });
    cv.addEventListener("pointerup", ()=>{ swiped = true; });
    const key = e => { const m = { ArrowLeft:"L", ArrowRight:"R", ArrowUp:"U", ArrowDown:"D", a:"L", d:"R", w:"U", s:"D", " ":"U" }[e.key]; if(m){ e.preventDefault(); input(m); } };
    window.addEventListener("keydown", key); window.addEventListener("resize", size);

    // ---------- simulation ----------
    function crash(why){ R.dead = true; R.deadT = 0; R.msg = why; snd("hit"); if(navigator.vibrate) navigator.vibrate([60,40,90]); }
    function step(dt){
      R.frame += dt;
      if(R.turnT < 1) R.turnT = Math.min(1, R.turnT + dt/.28);
      if(R.dead){ R.deadT += dt; if(R.deadT > 1.4 && !R.ended){ R.ended = true; end(); } return; }
      R.t += dt; R.v = Math.min(16.5, 7 + R.t*.11);
      const d = R.v*dt; R.pos += d; R.dist += d;
      R.lx += (R.lane - R.lx) * Math.min(1, dt*16);
      if(R.jump > 0){ R.jump += dt/.62; if(R.jump >= 1) R.jump = 0; }
      if(R.slide > 0){ R.slide += dt/.62; if(R.slide >= 1) R.slide = 0; }
      R.chase = Math.max(0, R.chase - dt*.5);
      const cp = R.pos + CATZ, jh = R.jump > 0 ? 4*.58*R.jump*(1-R.jump) : 0, ln = Math.round(R.lx);
      if(cp > R.seg.len + 1.5){ crash("撞到樹叢了！"); return; }
      for(const o of R.seg.obs){ const L = o.k==="puddle" ? .9 : o.k==="bar" ? .18 : .4;
        if(cp+.15 < o.p || cp-.15 > o.p+L) continue;
        if(!o.lanes.includes(ln)) continue;
        if(o.k==="box"){ crash("撞到紙箱了！"); return; }
        if(o.k==="yarn" && jh < .22){ crash("被毛線纏住了！"); return; }
        if(o.k==="puddle" && jh < .1){ crash("踩到水坑，嚇一跳！"); return; }
        if(o.k==="bar" && !(R.slide > 0)){ crash("撞到曬衣繩了！"); return; }
      }
      for(const f of R.seg.fish){ if(f.got) continue; if(Math.abs(f.p - cp) < .38 && f.lane===ln && Math.abs(f.h - (jh + .2)) < .38){ f.got = 1; R.fish += f.gold ? 5 : 1; if(f.gold) R.gold++; snd(f.gold ? "heart" : "coin"); } }
    }

    // ---------- drawing ----------
    function draw(){
      const s = R.seg, cp = R.pos + CATZ;
      // sky + hills
      const sky = g.createLinearGradient(0,0,0,HOR); sky.addColorStop(0,"#9fd4f5"); sky.addColorStop(1,"#ffe1ea"); g.fillStyle = sky; g.fillRect(0,0,RW,HOR+1);
      g.fillStyle = "#ffffff"; for(const [cx,cy,w] of [[30,26,22],[120,18,30],[160,46,18]]){ const x = ((cx - R.dist*.6) % (RW+40) + RW+40) % (RW+40) - 20; g.fillRect(x,cy,w,6); g.fillRect(x+4,cy-4,w-8,4); }
      g.fillStyle = "#a8dcb4"; for(let x=0;x<RW;x+=2){ const h = 10 + Math.sin((x + R.dist*.3)*.05)*5 + Math.sin(x*.13)*2; g.fillRect(x, HOR-h, 2, h); }
      // ground, row by row
      for(let y=HOR+1; y<RH; y++){
        const z = CAMH*F/(y-HOR), p = R.pos + z, cx = RW/2, hw = HALF*F/z, lane = LW*F/z;
        const stripe = Math.floor((p + 1000)/1.3) % 2;
        g.fillStyle = stripe ? "#8fd18f" : "#9ddb9a"; g.fillRect(0,y,RW,1);
        if(p < s.len){
          const pud = s.obs.find(o=>o.k==="puddle" && p>=o.p && p<=o.p+.9);
          g.fillStyle = pud ? (stripe ? "#6fb7e8" : "#8fcaf0") : (stripe ? "#e9c79a" : "#f2d4aa"); g.fillRect(cx-hw, y, hw*2, 1);
          g.fillStyle = "#b8834a"; g.fillRect(cx-hw-Math.max(1,hw*.06), y, Math.max(1,hw*.06), 1); g.fillRect(cx+hw, y, Math.max(1,hw*.06), 1);
          if(!pud && stripe){ g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(cx-lane/2-.5, y, 1, 1); g.fillRect(cx+lane/2-.5, y, 1, 1); }
        } else if(p < s.len + 1.7){
          g.fillStyle = stripe ? "#e9c79a" : "#f2d4aa";
          const l = s.dirs.includes("L") ? 0 : cx-hw, r = s.dirs.includes("R") ? RW : cx+hw; g.fillRect(l, y, r-l, 1);
        }
      }
      // things, far → near
      const items = [];
      for(const o of s.obs){ const z = o.p - R.pos; if(z > .6 && z < 60) items.push({ z, f:()=>drawObs(o, z) }); }
      for(const f of s.fish){ const z = f.p - R.pos; if(!f.got && z > .6 && z < 45) items.push({ z, f:()=>drawFish(f, z) }); }
      for(const d of s.deco){ const z = d.p - R.pos; if(z > .5 && z < 60) items.push({ z, f:()=>drawDeco(d, z) }); }
      const hz = s.len + 1.7 - R.pos; if(hz > .6 && hz < 70) items.push({ z:hz, f:()=>drawHedge(hz, s) });
      const az = s.len - 6 - R.pos; if(az > 2 && az < 40) items.push({ z:az, f:()=>drawArrow(az, s.dirs) });
      items.push({ z:CATZ, f:drawCat });
      items.sort((a,b)=>b.z-a.z).forEach(it=>it.f());
      drawVac();
      // turning swoosh
      if(R.turnT < 1){ g.fillStyle = `rgba(255,255,255,${(1-R.turnT)*.55})`; g.fillRect(0,0,RW,RH); }
    }
    function box3(x, y, z, w, h, front, top){ const [l, b] = pr(x - w/2, y, z), [r, t] = pr(x + w/2, y + h, z);
      g.fillStyle = O; g.fillRect(l-1, t-1, r-l+2, b-t+2); g.fillStyle = front; g.fillRect(l, t, r-l, b-t); if(top){ g.fillStyle = top; g.fillRect(l, t, r-l, Math.max(1,(b-t)*.22)); } return [l,t,r,b]; }
    function drawObs(o, z){
      if(o.k==="box") for(const ln of o.lanes){ const [l,t,r,b] = box3(laneX(ln), 0, z, LW*.82, .42, "#d9a066", "#b07d45"); g.fillStyle = "#b07d45"; g.fillRect(l+(r-l)*.3, t+(b-t)*.5, (r-l)*.4, Math.max(1,(b-t)*.1)); }
      if(o.k==="yarn"){ const cols = ["#f0708d","#9b6fd6","#6fb7e8","#ffcf4a","#5cb87a"]; for(let i=0;i<5;i++){ const x = -HALF + .17 + i*.34; box3(x, 0, z, .3, .24, cols[(i + (o.p|0))%5]); const [a,bb] = pr(x-.08, .14, z), [c,d] = pr(x+.08, .1, z); g.fillStyle = "rgba(255,255,255,.6)"; g.fillRect(a,bb,Math.max(1,c-a),Math.max(1,d-bb)); } }
      if(o.k==="bar"){ for(const sx of [-HALF-.05, HALF+.05]) box3(sx, 0, z, .07, .66, "#a0703c");
        const [l, ry] = pr(-HALF-.05, .56, z), [r] = pr(HALF+.05, .56, z); g.fillStyle = O; g.fillRect(l, ry, r-l, Math.max(1, F/z*.025));
        const cl = ["#f0708d","#ffffff","#6fb7e8","#ffcf4a","#5cb87a","#cdb4f0"]; for(let i=0;i<6;i++){ const x = -HALF + .1 + i*.3; box3(x, .36, z, .16, .2, cl[i]); } }
      if(o.k==="puddle"){ const [l,t] = pr(-.35, .02, z), [r] = pr(.35, .02, z); g.fillStyle = "rgba(255,255,255,.7)"; g.fillRect(l+(r-l)*.2, t, (r-l)*.15, 1); }
    }
    function drawFish(f, z){ const [x, y] = pr(laneX(f.lane), f.h + Math.sin(R.frame*5 + f.p)*.03, z), s = F/z*.026; blit(g, FISH, f.gold ? GOLD : FPAL, x - 4*s, y - 2.5*s, s); }
    function drawDeco(d, z){ const x = d.side*(HALF + .5 + d.off), [sx, sy] = pr(x, 0, z), s = F/z*.05;
      if(d.k==="tree"){ g.fillStyle = "#8a5a2e"; g.fillRect(sx - s*1.5, sy - s*8, s*3, s*8); g.fillStyle = "#3f9a5a"; g.fillRect(sx - s*6, sy - s*18, s*12, s*11); g.fillStyle = "#5cb87a"; g.fillRect(sx - s*5, sy - s*17, s*8, s*6); g.fillStyle = "#f0708d"; g.fillRect(sx + s*2, sy - s*13, s*1.6, s*1.6); }
      else if(d.k==="bush"){ g.fillStyle = "#4fae6a"; g.fillRect(sx - s*4, sy - s*5, s*8, s*5); g.fillStyle = "#6cc47f"; g.fillRect(sx - s*3, sy - s*5, s*4, s*2); }
      else { g.fillStyle = "#5cb87a"; g.fillRect(sx - s*.5, sy - s*4, s, s*4); g.fillStyle = ["#f0708d","#ffd36b","#cdb4f0"][(d.p|0)%3]; g.fillRect(sx - s*1.5, sy - s*6, s*3, s*3); g.fillStyle = "#fff"; g.fillRect(sx - s*.5, sy - s*5, s, s); }
    }
    function drawHedge(z, s){ const [l, t] = pr(-6, .8, z), [r, b] = pr(6, 0, z); g.fillStyle = "#3f8f55"; g.fillRect(l, t, r-l, b-t); g.fillStyle = "#4fae6a"; for(let x=l; x<r; x+=Math.max(2,(b-t)*.6)) g.fillRect(x, t, Math.max(1,(b-t)*.35), Math.max(1,(b-t)*.25));
      const [cl, ct] = pr(-HALF, .8, z), [cr] = pr(HALF, .8, z); // gaps where the crossing road leaves
      g.fillStyle = "#f2d4aa"; if(s.dirs.includes("L")) g.fillRect(0, b-1, cl, 1); if(s.dirs.includes("R")) g.fillRect(cr, b-1, RW-cr, 1); }
    function drawArrow(z, dirs){ const [x, y] = pr(0, 1.1, z), s = Math.max(1, F/z*.06), pal = { O, K: Math.floor(R.frame*5)%2 ? "#e5486a" : "#ffffff" };
      if(dirs.includes("L")) blit(g, ARROW, pal, x - (dirs==="LR" ? 9 : 4)*s, y - 3.5*s, s);
      if(dirs.includes("R")) blit(g, mirror(ARROW), pal, x + (dirs==="LR" ? 1 : -4)*s, y - 3.5*s, s); }
    function drawCat(){
      const jh = R.jump > 0 ? 4*.58*R.jump*(1-R.jump) : 0, x = laneX(R.lx), [sx, sy] = pr(x, 0, CATZ), [, jy] = pr(x, jh, CATZ);
      const s = F/CATZ*.028, w = 16*s; let h = 14*s;
      g.fillStyle = "rgba(60,40,30,.25)"; g.fillRect(sx - w*.4, sy - 2, w*.8, 3);
      const ph = R.dead ? 2 : Math.floor(R.frame*10)%2, slide = R.slide > 0;
      const rows = BACK.concat(slide ? [] : LEGS[jh > .05 ? 2 : ph]);
      if(slide){ const half = BACK.filter((_,i)=>i%2===0 || i<3); blit(g, half, cpal, sx - w/2, sy - half.length*s, s); return; }
      let ox = 0; if(R.dead) ox = Math.sin(R.deadT*40) * s * (R.deadT < .4 ? 2 : 0);
      blit(g, rows, cpal, sx - w/2 + ox, jy - rows.length*s, s);
      const tl = TAILS[Math.floor(R.frame*6)%2]; for(const [tx,ty] of tl){ g.fillStyle = O; g.fillRect(sx - w/2 + ox + (tx-.5)*s, jy - rows.length*s + (ty-.3)*s, s*2, s*1.2); g.fillStyle = cpal.Y; g.fillRect(sx - w/2 + ox + tx*s, jy - rows.length*s + ty*s, s, s*.8); }
      if(R.dead){ g.font = "16px Cubic11, sans-serif"; g.textAlign = "center"; g.fillStyle = "#e5486a"; g.fillText("碰！", sx, jy - rows.length*s - 6); }
    }
    function drawVac(){
      // the puppy chases from the bottom at the start and catches up when you crash
      let k = R.dead ? Math.min(1, R.deadT/.9) : R.chase; if(k <= 0) return;
      const s = 3.2, w = VAC[0].length*s, y = RH - VAC.length*s*k*.9 + (1-k)*10 + Math.abs(Math.sin(R.frame*12))*-3, x = RW/2 - w/2 + Math.sin(R.frame*7)*2;
      blit(g, VAC, VPAL, x, y, s);
    }
    function render(){
      draw();
      const W = cv.width, H = cv.height, sc = Math.max(W/RW, H/RH), dw = RW*sc, dh = RH*sc;
      let off = 0; if(R.turnT < 1) off = R.turnDir * (1 - R.turnT) * W * .6;
      out.imageSmoothingEnabled = false; out.fillStyle = "#9ddb9a"; out.fillRect(0,0,W,H);
      out.drawImage(lc, (W-dw)/2 - off, (H-dh)/2, dw, dh);
      $("#raD").textContent = `${Math.floor(R.dist)} m`; $("#raF").textContent = `🐟 ${R.fish}`;
    }
    function loop(t){ if(done) return; const dt = Math.min(.05, (t - last)/1000 || 0); last = t; if(R && !R.paused) step(dt); if(R) render(); raf = requestAnimationFrame(loop); }

    function start(){ reset(); $("#raM").classList.add("hidden"); $("#raTip").classList.remove("hidden"); setTimeout(()=>{ const tp = $("#raTip"); if(tp) tp.classList.add("hidden"); }, 5000); snd("select"); last = performance.now(); }
    function end(){
      const score = Math.floor(R.dist) + R.fish*10, coins = Math.floor(R.fish/2), best = Math.max(opts.best||0, score), rec = score > (opts.best||0);
      $("#raM").innerHTML = `<b>${R.msg}</b><p>狗狗追上來舔你了 🐶💦</p><p class="raSc">${score} 分</p><p>跑了 ${Math.floor(R.dist)} m・撿到 🐟 ${R.fish}${R.gold?`（金魚 ${R.gold}）`:""}</p>
        <p>${rec ? "🎉 新紀錄！" : `最高紀錄 ${best} 分`}${coins && opts.hasPet ? `<br>${coins} 個貓幣送進養貓房間了 🪙` : ""}</p>
        <button class="btn" id="raAgain">再跑一次</button><button class="btn sub" id="raHome">回大廳</button>`;
      $("#raM").classList.remove("hidden"); opts.best = best; snd(rec ? "level" : "miss");
      Promise.resolve(opts.onEnd && opts.onEnd({ score, dist:Math.floor(R.dist), fish:R.fish, coins, rec })).catch(()=>{});
      $("#raAgain").addEventListener("click", start); $("#raHome").addEventListener("click", close);
    }
    function close(){ if(done) return; done = true; cancelAnimationFrame(raf); window.removeEventListener("keydown", key); window.removeEventListener("resize", size); ov.remove(); resolve(); }
    $("#raX").addEventListener("click", ()=>{ snd("tap"); close(); });
    ov.__close = close;
    requestAnimationFrame(()=>{ size(); start(); raf = requestAnimationFrame(loop); });
  });
}

App.registerGame({
  id: "runaway",
  name: "喵喵大逃亡",
  desc: "被狗狗追！滑動閃開障礙",
  icon: () => Pix.sprite("orange","surprised"),
  mount(el, ctx){
    const { sprite, esc, SFX } = ctx;
    let s = null;
    const me = () => ctx.me.uid;
    function lobby(){
      const p = ctx.partner(), best = (s && s.best) || {};
      el.innerHTML = `<div class="box raLobby">
        <div class="raStory"><span class="raVac">${(()=>{ let r=""; VAC.forEach((row,y)=>[...row].forEach((c,x)=>{ if(VPAL[c]) r+=`<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${VPAL[c]}"/>`; })); return `<svg viewBox="0 0 22 16" shape-rendering="crispEdges">${r}</svg>`; })()}</span>
          <span class="raMe">${sprite(ctx.me.cat,"surprised")}</span></div>
        <p class="raIntro">偷吃了狗狗的零食，被<b>狗狗</b>追著跑！<br>能跑多遠就跑多遠～</p>
        <div class="raHow"><span>左右滑：換跑道</span><span>上滑：跳過毛線、水坑</span><span>下滑：滑過曬衣繩</span><span>路口：往箭頭方向滑</span></div>
        <div class="raBest"><div><b>${esc(ctx.me.name)}</b><span>${best[me()]||0} 分</span></div>${p?`<div><b>${esc(p.name)}</b><span>${best[p.user_id]||0} 分</span></div>`:""}</div>
        <button class="btn raGo" id="raGo">🏃 開始逃跑！</button>
        <div class="k" style="text-align:center">撿到的小魚乾每 2 條換 1 個貓幣，會送進養貓房間 🪙</div></div>`;
      el.querySelector("#raGo").addEventListener("click", go);
    }
    async function go(){
      SFX.tap();
      const pet = await ctx.getState("pet").catch(()=>null);
      await play({ color: ctx.me.cat, sfx: SFX, best: (s && s.best && s.best[me()]) || 0, hasPet: !!(pet && pet.state),
        onEnd: async r => {
          await ctx.update("runaway", st=>{ st = st || { best:{}, runs:{} }; st.best = st.best||{}; st.runs = st.runs||{};
            st.runs[me()] = (st.runs[me()]||0) + 1; if(r.score > (st.best[me()]||0)) st.best[me()] = r.score; st.last = { by:me(), score:r.score, at:Date.now() }; return st; });
          if(r.rec && r.score > 0) ctx.notifyPartner(`${ctx.me.name} 在「喵喵大逃亡」跑出新紀錄：${r.score} 分！`);
          if(r.coins > 0) await ctx.update("pet", st=>{ if(!st || !window.PetLogic) return undefined; st = window.PetLogic.norm(JSON.parse(JSON.stringify(st)));
            st.coins = (st.coins||0) + r.coins; st.log = (st.log||[]).concat([{ by:me(), a:"run", n:r.coins, at:Date.now() }]).slice(-24); return st; });
        } });
      lobby();
    }
    this._u = ctx.onState("runaway", st=>{ s = st; if(!document.querySelector(".raGame")) lobby(); });
    (async()=>{ const cur = await ctx.getState("runaway").catch(()=>null); s = cur ? cur.state : null; lobby(); })();
  },
  unmount(){ if(this._u) this._u(); const g = document.querySelector(".raGame"); if(g){ if(g.__close) g.__close(); else g.remove(); } },
});
})();
