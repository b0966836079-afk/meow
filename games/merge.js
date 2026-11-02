// 遊戲：喵喵合成（像合成大西瓜）
// 從上面丟下圓滾滾的貓，兩隻一樣的貓碰在一起就會合成更大的貓，最後合出「貓貓神」！
// 貓疊到虛線上面太久就結束。每個人比自己的最高分，分數換貓幣送進養貓房間。
(function(){
const W = 200, H = 360, LINE = 52, DROPY = 26;     // world = canvas pixels (scaled up crisp)
const G = 900;
const O = "#5a3b2e";
// tier: [radius, name, fur, extra]
const CATS = [
  [8,   "粉粉貓",   "#ffc2d1"],
  [10.5,"奶油貓",   "#fff1d6"],
  [13.5,"小橘貓",   "#f6a95c"],
  [17,  "三花貓",   "#fff8ee"],
  [21,  "小黑貓",   "#3b3140"],
  [25.5,"虎斑貓",   "#b3b5c4"],
  [30,  "暹羅貓",   "#f4e6cc"],
  [35,  "賓士貓",   "#2f2830"],
  [41,  "大胖橘",   "#f39a45"],
  [47,  "國王貓",   "#e8defc"],
  [54,  "貓貓神",   "#ffe3ef"],
];
const PTS = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66];
const MAXT = CATS.length - 1;
const SPAWN = [0,0,0,1,1,1,2,2,2,3,3,4];   // weighted first five

// ---------- pixel cat sprites (generated once) ----------
const hex = h => [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const shade = (h, a) => { const c = hex(h); return "#" + c.map(v=>Math.max(0,Math.min(255,Math.round(a<0 ? v*(1+a) : v+(255-v)*a))).toString(16).padStart(2,"0")).join(""); };
const sprites = [];
function triIn(px, py, a, b, c){ const s = (p1,p2,p3) => (p1[0]-p3[0])*(p2[1]-p3[1]) - (p2[0]-p3[0])*(p1[1]-p3[1]);
  const d1 = s([px,py],a,b), d2 = s([px,py],b,c), d3 = s([px,py],c,a); return !((d1<0||d2<0||d3<0) && (d1>0||d2>0||d3>0)); }
function makeCat(t){
  const [r, , fur] = CATS[t];
  const earH = Math.round(r*0.5) + 1, top = earH + (t===9 ? Math.round(r*0.35) : t===10 ? Math.round(r*0.4) : 0);
  const w = Math.ceil(2*r) + 4, h = Math.ceil(2*r) + 4 + top, cx = w/2, cy = top + r + 2;
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const g = cv.getContext("2d");
  const col = new Array(w*h).fill(null);
  const set = (x, y, c) => { x |= 0; y |= 0; if(x>=0 && y>=0 && x<w && y<h) col[y*w+x] = c; };
  const earL = [[cx-0.86*r, cy-0.38*r], [cx-0.18*r, cy-0.9*r], [cx-0.78*r, cy-r-earH*0.75]];
  const earR = earL.map(([x,y]) => [2*cx-x, y]);
  const inner = e => { const m = [(e[0][0]+e[1][0]+e[2][0])/3, (e[0][1]+e[1][1]+e[2][1])/3]; return e.map(([x,y]) => [m[0]+(x-m[0])*0.5, m[1]+(y-m[1])*0.5]); };
  const eLi = inner(earL), eRi = inner(earR);
  const earCol = t===6 ? "#8a6248" : t===2||t===8 ? shade(fur,-0.12) : t===3 ? "#f6a95c" : fur;
  const inEar = (x, y, rr) => triIn(x, y, rr[0], rr[1], rr[2]);
  // body + ears
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const px = x+.5, py = y+.5, nx = (px-cx)/r, ny = (py-cy)/r, d = Math.hypot(nx, ny);
    if(d <= 1){
      let c = fur;
      if(t===2 || t===8){ if(ny < -0.35 && Math.abs(nx) < 0.4 && (Math.floor((nx+1)*r/2.6) % 2 === 0)) c = shade(fur,-0.18);
        if(Math.abs(nx) > 0.7 && (Math.floor((ny+1)*r/3) % 2 === 0)) c = shade(fur,-0.18); }
      if(t===8 && ny > 0.35 && Math.abs(nx) < 0.55) c = "#fff6e6";
      if(t===3){ const n1 = Math.hypot(nx+0.45, ny+0.45), n2 = Math.hypot(nx-0.55, ny+0.35), n3 = Math.hypot(nx-0.35, ny-0.7);
        if(n1 < 0.48) c = "#f6a95c"; else if(n2 < 0.4) c = "#3b3140"; else if(n3 < 0.3) c = "#f6a95c"; }
      if(t===5 && Math.abs(nx) > 0.45 && (Math.floor((ny+1)*r/3.2) % 2 === 0)) c = shade(fur,-0.25);
      if(t===5 && ny < -0.4 && Math.abs(nx) < 0.3 && (Math.floor((nx+1)*r/2.4) % 2 === 0)) c = shade(fur,-0.25);
      if(t===6){ const m = Math.hypot(nx/1.2, ny-0.18); if(m < 0.5) c = m < 0.38 ? "#8a6248" : "#b88a68"; }
      if(t===7 && Math.hypot(nx/0.6, (ny-0.62)/0.5) < 1) c = "#ffffff";
      if(t===10 && ny > 0.45){ const rb = ["#ffb3c6","#ffd9a0","#fff3a8","#c8f0c0","#b8e2ff","#d9c8ff"]; c = rb[Math.min(5, Math.floor((ny-0.45)/0.55*6))]; }
      set(x, y, c);
    } else if(inEar(px, py, earL) || inEar(px, py, earR)){
      set(x, y, (inEar(px, py, eLi) || inEar(px, py, eRi)) ? "#f7a7b8" : earCol);
    }
  }
  // crown / halo
  if(t===9){ const cw = r*0.86, ch = r*0.5, x0 = cx - cw/2, yb = cy - r*0.8;
    for(let y=Math.floor(yb-ch); y<=yb; y++) for(let x=Math.floor(x0); x<=x0+cw; x++){ const fx = (x+.5-x0)/cw, fy = (yb - (y+.5))/ch; if(fx < 0 || fx > 1 || fy < 0 || fy > 1) continue;
      let inside = fy < 0.42; if(!inside) for(let k=0;k<3;k++){ const c0 = (k+0.5)/3; if(Math.abs(fx - c0) < (1/6)*(1 - (fy-0.42)/0.58)*1.05) inside = true; }
      if(inside) set(x, y, (fy < 0.42 && fy > 0.12 && Math.abs(fx-0.5) < 0.09) ? "#e5486a" : (fy < 0.12 ? "#e8a92e" : "#ffcf4a")); } }
  if(t===10){ const hy = cy - r - earH*0.55, hr = r*0.42; for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const e = Math.hypot((x+.5-cx)/hr, (y+.5-hy)/(hr*0.32)); if(e > 0.72 && e <= 1) set(x, y, "#ffcf4a"); } }
  // outline
  const out = col.slice();
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ if(col[y*w+x]) continue;
    if((x>0&&col[y*w+x-1]) || (x<w-1&&col[y*w+x+1]) || (y>0&&col[(y-1)*w+x]) || (y<h-1&&col[(y+1)*w+x])) out[y*w+x] = O; }
  // face
  const F = (x, y, ww, hh, c) => { for(let j=0;j<hh;j++) for(let i=0;i<ww;i++) { const X = Math.round(x)+i, Y = Math.round(y)+j; if(X>=0&&Y>=0&&X<w&&Y<h) out[Y*w+X] = c; } };
  const e = Math.max(1, Math.round(r*0.15)), ey = cy - r*0.02 - e/2, dark = t===4 || t===7;
  const eyeC = dark ? "#ffd84d" : "#2b1d18";
  for(const sx of [-1, 1]){
    const ex = cx + sx*r*0.38 - e/2;
    if(t===10 || t===0){ // happy closed eyes ^ ^
      const k = Math.max(1, Math.round(e*0.5)); F(ex, ey+k, k, k, "#2b1d18"); F(ex+k, ey, Math.max(1,e-2*k)||1, k, "#2b1d18"); F(ex+e-k, ey+k, k, k, "#2b1d18");
    } else {
      F(ex, ey, e, e+(e>2?1:0), eyeC);
      if(dark) F(ex + e/2 - 0.5, ey, 1, e+(e>2?1:0), "#2b1d18");
      if(e >= 3) F(ex, ey, Math.max(1, Math.round(e/3)), Math.max(1, Math.round(e/3)), "#ffffff");
    }
    if(r >= 10){ const bw = Math.max(2, Math.round(r*0.2)); F(cx + sx*r*0.6 - bw/2, cy + r*0.2, bw, Math.max(1, Math.round(bw/2)), "#f59ab0"); }
  }
  // nose + ω mouth
  const ny0 = cy + r*0.16, u = Math.max(1, Math.round(r/14));
  F(cx - u, ny0, 2*u, u, "#f0708d");
  if(r >= 10){ const mc = dark && t===4 ? "#f7d6dc" : "#2b1d18"; F(cx - 3*u, ny0 + u, u, u, mc); F(cx - 2*u, ny0 + 2*u, u, u, mc); F(cx - u, ny0 + u, u, u, mc); F(cx, ny0 + u, u, u, mc); F(cx + u, ny0 + 2*u, u, u, mc); F(cx + 2*u, ny0 + u, u, u, mc); }
  if(t===10){ F(cx - r*0.75, cy - r*0.55, 2, 2, "#ffcf4a"); F(cx + r*0.7, cy + r*0.55, 2, 2, "#8fd3ff"); F(cx + r*0.55, cy - r*0.7, 2, 2, "#f0708d"); }
  const im = g.createImageData(w, h);
  out.forEach((c, i) => { if(!c) return; const [R,Gc,Bc] = hex(c); im.data[i*4] = R; im.data[i*4+1] = Gc; im.data[i*4+2] = Bc; im.data[i*4+3] = 255; });
  g.putImageData(im, 0, 0);
  return { cv, cx, cy, w, h };
}
function spr(t){ return sprites[t] || (sprites[t] = makeCat(t)); }
const urls = [];
function catUrl(t){ return urls[t] || (urls[t] = spr(t).cv.toDataURL()); }
const catImg = (t, cls) => `<img class="${cls||""}" src="${catUrl(t)}" alt="${CATS[t][1]}" style="image-rendering:pixelated">`;

// ---------- the game ----------
function play(opts){
  return new Promise(resolve=>{
    const SFX = opts.sfx || {}; const snd = (k, ...a) => { try{ SFX[k] && SFX[k](...a); }catch(e){} };
    const ov = document.createElement("div"); ov.className = "cmGame";
    ov.innerHTML = `<div class="cmHud"><button class="cmQuit" id="cmQuit">🏳️ 退出</button><div class="cmScore"><span>分數</span><b id="cmSc">0</b></div><div class="cmNext"><span>下一隻</span><i id="cmNx"></i></div></div>
      <div class="cmWrap" id="cmWrap"><canvas id="cmCv" width="${W}" height="${H}"></canvas></div>
      <div class="cmTip">手指左右移動，放開就丟下去 · 一樣的貓碰在一起會合成！</div>
      <div class="cmEnd hidden" id="cmEnd"></div>`;
    document.body.appendChild(ov); document.body.classList.add("inGameFs");
    const $ = s => ov.querySelector(s);
    const cv = $("#cmCv"), g = cv.getContext("2d"); g.imageSmoothingEnabled = false;
    // background (jar) pre-rendered
    const bg = document.createElement("canvas"); bg.width = W; bg.height = H; { const b = bg.getContext("2d");
      const gr = b.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#fff9ef"); gr.addColorStop(1, "#ffe7ee"); b.fillStyle = gr; b.fillRect(0, 0, W, H);
      b.fillStyle = "rgba(240,112,141,.10)"; for(let y=8;y<H;y+=22) for(let x=(y/22)%2?6:17;x<W;x+=22){ b.fillRect(x, y, 2, 2); b.fillRect(x-2, y-3, 1, 2); b.fillRect(x+3, y-3, 1, 2); }
      b.fillStyle = "#f3d6c4"; b.fillRect(0, H-6, W, 6); b.fillStyle = "#e9c3ad"; b.fillRect(0, H-6, W, 1); }
    let balls = [], parts = [], pops = [], score = 0, top = 0, cur = SPAWN[(Math.random()*7)|0], nxt = SPAWN[(Math.random()*SPAWN.length)|0];
    let aimX = W/2, lastDrop = -9, now = 0, danger = 0, over = false, done = false, raf = 0, last = performance.now(), acc = 0, quitArm = 0, idc = 0;
    const R = t => CATS[t][0];
    const drawNext = () => { $("#cmNx").innerHTML = catImg(nxt); };
    drawNext();
    function size(){
      const wrap = $("#cmWrap"), aw = wrap.clientWidth || window.innerWidth - 20, ah = wrap.clientHeight || window.innerHeight - 140;
      let k = Math.min(aw / W, ah / H); if(k > 1.5) k = Math.floor(k*4)/4;
      cv.style.width = Math.floor(W*k) + "px"; cv.style.height = Math.floor(H*k) + "px";
    }
    size(); window.addEventListener("resize", size);
    // input
    const toX = e => { const rc = cv.getBoundingClientRect(); return (e.clientX - rc.left) / rc.width * W; };
    let down = false;
    const wrap = $("#cmWrap");
    wrap.addEventListener("pointerdown", e => { if(over) return; down = true; aimX = toX(e); try{ wrap.setPointerCapture(e.pointerId); }catch(_){} });
    wrap.addEventListener("pointermove", e => { if(over) return; if(down || e.pointerType === "mouse") aimX = toX(e); });
    wrap.addEventListener("pointerup", e => { if(!down || over) return; down = false; aimX = toX(e); drop(); });
    wrap.addEventListener("pointercancel", () => { down = false; });
    function drop(){
      if(now - lastDrop < 0.45) return;
      const r = R(cur), x = Math.max(r+1, Math.min(W-r-1, aimX));
      balls.push({ id: ++idc, x, y: DROPY, vx: 0, vy: 0, t: cur, r, born: now, sq: 0 });
      lastDrop = now; snd("place"); cur = nxt; nxt = SPAWN[(Math.random()*SPAWN.length)|0]; drawNext();
    }
    function add(t, x, y, vx, vy){ const b = { id: ++idc, x, y, vx, vy, t, r: R(t), born: now - 1, sq: 1 }; balls.push(b); return b; }
    function burst(x, y, n, cols){ for(let i=0;i<n;i++){ const a = Math.random()*Math.PI*2, s = 40 + Math.random()*90; parts.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s - 40, life: .5 + Math.random()*.4, c: cols[i % cols.length], s: Math.random() < .3 ? 2 : 1 }); } }
    function step(dt){
      now += dt;
      for(const b of balls){ b.vy += G*dt; b.x += b.vx*dt; b.y += b.vy*dt; if(b.sq > 0) b.sq = Math.max(0, b.sq - dt*4); }
      const merges = [];
      for(let it=0; it<6; it++){
        for(let i=0;i<balls.length;i++){ const a = balls[i]; if(a.gone) continue;
          for(let j=i+1;j<balls.length;j++){ const b = balls[j]; if(b.gone) continue;
            const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r; if(dx*dx + dy*dy >= rr*rr) continue;
            const d = Math.sqrt(dx*dx + dy*dy) || 0.01, nx = dx/d, ny = dy/d, ov2 = rr - d;
            if(a.t === b.t && it === 0 && !a.gone && !b.gone){ a.gone = b.gone = true; merges.push([a, b]); continue; }
            const ma = a.r*a.r, mb = b.r*b.r, sa = mb/(ma+mb), sb = ma/(ma+mb);
            a.x -= nx*ov2*sa; a.y -= ny*ov2*sa; b.x += nx*ov2*sb; b.y += ny*ov2*sb;
            if(it === 0){ const vn = (b.vx-a.vx)*nx + (b.vy-a.vy)*ny;
              if(vn < 0){ const jimp = -(1.15)*vn / (1/ma + 1/mb); a.vx -= jimp*nx/ma; a.vy -= jimp*ny/ma; b.vx += jimp*nx/mb; b.vy += jimp*ny/mb;
                // contact friction
                const tx = -ny, ty = nx, vt = (b.vx-a.vx)*tx + (b.vy-a.vy)*ty, f = vt*0.12; a.vx += f*tx*sa*2; a.vy += f*ty*sa*2; b.vx -= f*tx*sb*2; b.vy -= f*ty*sb*2; } }
          } }
        for(const b of balls){
          if(b.x - b.r < 0){ b.x = b.r; if(b.vx < 0) b.vx *= -0.2; }
          if(b.x + b.r > W){ b.x = W - b.r; if(b.vx > 0) b.vx *= -0.2; }
          if(b.y + b.r > H - 5){ b.y = H - 5 - b.r; if(b.vy > 0) b.vy *= -0.12; b.vx *= 0.985; }
        }
      }
      for(const b of balls){ b.vx *= 0.998; b.vy *= 0.998; }
      if(merges.length){
        balls = balls.filter(b => !b.gone);
        for(const [a, b] of merges){
          const x = (a.x + b.x)/2, y = (a.y + b.y)/2;
          if(a.t < MAXT){ const t = a.t + 1, nb = add(t, x, y, (a.vx+b.vx)/2, Math.min(0, (a.vy+b.vy)/2) - 30); nb.y = Math.min(nb.y, H - 5 - nb.r);
            score += PTS[t]; if(t > top){ top = t; if(t >= 5) pops.push({ t, life: 1.6 }); }
            burst(x, y, 6 + t*2, ["#f0708d", "#ffcf4a", "#ffffff", CATS[t][2]]); snd(t >= 7 ? "level" : "combo", t);
            if(t === MAXT){ pops.push({ t, life: 2.4, god: true }); snd("boom", true); } }
          else { score += 300; burst(x, y, 50, ["#ffcf4a", "#f0708d", "#8fd3ff", "#ffffff"]); pops.push({ t: MAXT, life: 2.4, bye: true }); snd("level"); }
        }
        $("#cmSc").textContent = score;
      }
      for(const p of parts){ p.vy += 300*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt; }
      parts = parts.filter(p => p.life > 0);
      for(const p of pops) p.life -= dt; pops = pops.filter(p => p.life > 0);
      // over the line?
      let hi = false; for(const b of balls) if(now - b.born > 1.2 && b.y - b.r < LINE && Math.abs(b.vy) < 120) { hi = true; break; }
      danger = hi ? danger + dt : Math.max(0, danger - dt*2);
      if(danger > 2.6 && !over) finish();
    }
    function draw(){
      g.drawImage(bg, 0, 0);
      // danger line
      const blink = danger > 0 && Math.floor(now*6) % 2 === 0;
      g.fillStyle = danger > 0 ? (blink ? "#e5486a" : "#f7a7b8") : "rgba(240,112,141,.45)";
      for(let x=2;x<W;x+=8) g.fillRect(x, LINE, 4, 1);
      // aim guide + held cat
      if(!over){
        const r = R(cur), x = Math.round(Math.max(r+1, Math.min(W-r-1, aimX))), ready = now - lastDrop >= 0.45;
        g.fillStyle = "rgba(90,59,46,.22)"; for(let y=DROPY+r+4; y<H-6; y+=6) g.fillRect(x, y, 1, 3);
        if(ready){ const s = spr(cur); g.globalAlpha = 0.95; g.drawImage(s.cv, Math.round(x - s.cx), Math.round(DROPY - s.cy)); g.globalAlpha = 1; }
      }
      for(const b of balls){ const s = spr(b.t), k = 1 + b.sq*0.25*Math.sin(b.sq*Math.PI);
        if(k === 1) g.drawImage(s.cv, Math.round(b.x - s.cx), Math.round(b.y - s.cy));
        else { const ww = Math.round(s.w*k), hh = Math.round(s.h*k); g.drawImage(s.cv, Math.round(b.x - s.cx*k), Math.round(b.y - s.cy*k), ww, hh); } }
      for(const p of parts){ g.fillStyle = p.c; g.fillRect(Math.round(p.x), Math.round(p.y), p.s+1, p.s+1); }
      if(pops.length){ const p = pops[pops.length-1], a = Math.min(1, p.life*2);
        g.globalAlpha = a; g.fillStyle = "rgba(255,255,255,.85)"; g.fillRect(0, H*0.38, W, 26); g.fillStyle = O; g.fillRect(0, H*0.38, W, 1); g.fillRect(0, H*0.38+25, W, 1);
        g.font = "13px Cubic11, monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#e5486a";
        g.fillText(p.bye ? "兩隻貓貓神升天了！+300" : p.god ? "✨ 貓貓神降臨！✨" : `合出${CATS[p.t][1]}了！`, W/2, H*0.38 + 13); g.globalAlpha = 1; }
    }
    function loop(t){
      if(done) return;
      let dt = (t - last)/1000; last = t; if(dt > 0.1) dt = 0.1; acc += dt;
      const STEP = 1/120; let n = 0; while(acc >= STEP && n < 12){ if(!over) step(STEP); acc -= STEP; n++; } if(n >= 12) acc = 0;
      try{ draw(); }catch(e){}
      raf = requestAnimationFrame(loop);
    }
    function finish(){
      if(over) return; over = true; snd("miss");
      const coins = Math.min(60, Math.floor(score / 80)), best = Math.max(opts.best||0, score), rec = score > (opts.best||0) && score > 0;
      const E = $("#cmEnd"); E.classList.remove("hidden");
      E.innerHTML = `<div class="cmCard"><div class="cmTop">${catImg(top, "big")}</div><h3>${rec ? "🎉 新紀錄！" : "裝滿了～"}</h3>
        <p class="cmBig">${score} 分</p><p>最大合出：<b>${CATS[top][1]}</b>${rec ? "" : `<br>最高紀錄 ${best} 分`}${coins && opts.hasPet ? `<br>${coins} 個貓幣送進養貓房間了 🪙` : ""}</p>
        <div class="cmBtns"><button class="btn sub" id="cmBack">回去</button><button class="btn" id="cmAgain">再玩一次</button></div></div>`;
      opts.best = best;
      Promise.resolve(opts.onEnd && opts.onEnd({ score, top, coins, rec })).catch(()=>{});
      $("#cmBack").addEventListener("click", () => close(false));
      $("#cmAgain").addEventListener("click", () => close(true));
    }
    function close(again){ if(done) return; done = true; cancelAnimationFrame(raf); window.removeEventListener("resize", size); ov.remove(); document.body.classList.remove("inGameFs"); resolve(again ? "again" : "back"); }
    ov.__close = () => close(false);
    $("#cmQuit").addEventListener("click", () => { if(over) return; const t = Date.now(); if(t - quitArm < 2500){ snd("tap"); close(false); return; } quitArm = t; const q = $("#cmQuit"); q.textContent = "再按一次退出（不算分）"; setTimeout(()=>{ if(q.isConnected) q.textContent = "🏳️ 退出"; }, 2500); });
    if(window.__mock) window.__mg = { add: (t, x, y) => add(t, x, y, 0, 0), balls: () => balls.map(b=>({ t: b.t, x: b.x, y: b.y })), score: () => score, top: () => top, end: () => finish(), set aim(v){ aimX = v; }, drop: () => { lastDrop = -9; drop(); } };
    requestAnimationFrame(() => { size(); last = performance.now(); raf = requestAnimationFrame(loop); });
  });
}

window.CatMerge = { play, catImg, CATS };
if(window.GameArt) window.GameArt.merge = () => `<span class="gaL" style="left:2%;bottom:2%;width:56%">${catImg(8)}</span><span class="gaL" style="right:4%;bottom:2%;width:34%">${catImg(4)}</span><span class="gaL" style="right:14%;top:4%;width:22%">${catImg(2)}</span><span class="gaL" style="left:40%;top:6%;width:16%">${catImg(0)}</span>`;

App.registerGame({
  id: "merge",
  name: "喵喵合成",
  desc: "一樣的貓碰在一起會變大！",
  icon: () => Pix.sprite("orange","happy"),
  mount(el, ctx){
    const { esc, SFX } = ctx;
    let s = null;
    const me = () => ctx.me.uid;
    function lobby(){
      const p = ctx.partner(), best = (s && s.best) || {}, tp = (s && s.top) || {};
      const row = (name, uid) => `<div><b>${esc(name)}</b><span>${best[uid]||0} 分</span><em>${tp[uid] != null ? `${catImg(tp[uid], "mini")}${CATS[tp[uid]][1]}` : "還沒玩過"}</em></div>`;
      el.innerHTML = `<div class="box cmLobby">
        <div class="cmChain">${CATS.map((c,i)=>`<span title="${c[1]}" style="--i:${i}">${catImg(i)}</span>`).join("")}</div>
        <p class="cmIntro">把圓滾滾的貓丟進罐子裡，<b>兩隻一樣的貓</b>碰在一起就會合成更大的貓！<br>一路合到最後的「<b>貓貓神</b>」✨</p>
        <div class="cmHow"><span>手指左右移動選位置</span><span>放開就丟下去</span><span>貓疊超過虛線太久就結束</span></div>
        <div class="cmBest">${row(ctx.me.name, me())}${p ? row(p.name, p.user_id) : ""}</div>
        <button class="btn" id="cmGo">🐱 開始合成！</button>
        <div class="k" style="text-align:center">每 80 分換 1 個貓幣，會送進養貓房間 🪙</div></div>`;
      el.querySelector("#cmGo").addEventListener("click", go);
    }
    async function go(){
      if(document.querySelector(".cmGame")) return;
      SFX.tap();
      let again = true;
      while(again){
        const opts = { sfx: SFX, best: (s && s.best && s.best[me()]) || 0, hasPet: true };
        ctx.getState("pet").then(pet=>{ opts.hasPet = !!(pet && pet.state); }).catch(()=>{});
        const r = await play(Object.assign(opts, { onEnd: async r => {
          const prevTop = s && s.top && s.top[me()];
          await ctx.update("merge", st=>{ st = st || {}; st.best = st.best||{}; st.top = st.top||{}; st.plays = st.plays||{};
            st.plays[me()] = (st.plays[me()]||0) + 1; if(r.score > (st.best[me()]||0)) st.best[me()] = r.score;
            if(st.top[me()] == null || r.top > st.top[me()]) st.top[me()] = r.top; st.last = { by:me(), score:r.score, at:Date.now() }; return st; });
          if(r.top === MAXT && prevTop !== MAXT) ctx.notifyPartner(`${ctx.me.name} 在「喵喵合成」合出了貓貓神！✨`);
          else if(r.rec) ctx.notifyPartner(`${ctx.me.name} 在「喵喵合成」拿到新紀錄：${r.score} 分！`);
          if(r.coins > 0) await ctx.update("pet", st=>{ if(!st || !window.PetLogic) return undefined; st = window.PetLogic.norm(JSON.parse(JSON.stringify(st)));
            st.coins = (st.coins||0) + r.coins; st.log = (st.log||[]).concat([{ by:me(), a:"merge", n:r.coins, at:Date.now() }]).slice(-24); return st; });
        } }));
        again = r === "again";
      }
      lobby();
    }
    this._u = ctx.onState("merge", st=>{ s = st; if(!document.querySelector(".cmGame")) lobby(); });
    (async()=>{ const cur = await ctx.getState("merge").catch(()=>null); s = cur ? cur.state : null; lobby(); })();
  },
  unmount(){ if(this._u) this._u(); const g = document.querySelector(".cmGame"); if(g && g.__close) g.__close(); },
});
})();
