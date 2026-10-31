// 遊戲：喵喵砲台大戰（回合制拋物線射擊、可破壞地形、風向、特殊彈）
(function(){
const W = 360, H = 240, COLS = 180, CW = W/COLS;           // world units
const G = 120, MAXHP = 100, CAT_X = [36, 324];
const WEAP = {
  fish:  { n:"魚罐頭", i:"🐟", r:22, dmg:34, ammo:Infinity, d:"普通砲彈" },
  split: { n:"分裂罐頭", i:"🎆", r:15, dmg:18, ammo:2, d:"飛到最高點分成三顆" },
  yarn:  { n:"毛線球", i:"🧶", r:20, dmg:28, ammo:2, d:"會彈跳兩次再爆炸" },
};
// tiny seeded RNG
function rng(seed){ let s = seed>>>0 || 1; return ()=> (s = (s*1664525 + 1013904223)>>>0) / 4294967296; }
function makeTerrain(seed){
  const r = rng(seed), p = [r()*6.28, r()*6.28, r()*6.28], a = [18+r()*14, 8+r()*8, 4+r()*4], f = [1+r()*1.5, 3+r()*2, 7+r()*4];
  const h = [];
  for(let i=0;i<COLS;i++){
    const x = i/COLS;
    let y = 70 + a[0]*Math.sin(x*f[0]*6.28+p[0]) + a[1]*Math.sin(x*f[1]*6.28+p[1]) + a[2]*Math.sin(x*f[2]*6.28+p[2]);
    y += 34*Math.exp(-Math.pow((x-.5)/.12,2)) * (r()>.3?1:.4);       // a hill in the middle
    h.push(Math.round(Math.max(20, Math.min(150, y))));
  }
  for(const cx of CAT_X){ const c = Math.round(cx/CW); const lvl = h[c]; for(let i=c-5;i<=c+5;i++) if(h[i]!==undefined) h[i] = lvl; }
  return h;
}
const ground = (t, x) => { const i = Math.floor(x/CW); return i<0||i>=COLS ? -999 : t[i]; };
const catPos = (t, k) => ({ x: CAT_X[k], y: ground(t, CAT_X[k]) });

// simulate a shot: returns paths (for animation), booms, damage, new terrain
function simulate(st, shooterK, angle, power, weapon){
  const t = st.terrain.slice(), wind = st.wind;
  const cats = [catPos(t,0), catPos(t,1)];
  const v0 = 40 + power*175, rad = angle*Math.PI/180, dir = shooterK===0 ? 1 : -1;
  const start = { x: cats[shooterK].x + dir*8, y: cats[shooterK].y + 16 };
  const shells = [{ x:start.x, y:start.y, vx: Math.cos(rad)*v0*dir, vy: Math.sin(rad)*v0, bounces: weapon==="yarn"?2:0, split: weapon==="split", path:[] }];
  const booms = [], dt = 1/60, donePaths = [];
  let guard = 0;
  while(shells.length && guard++ < 2400){
    for(let k=shells.length-1;k>=0;k--){
      const sh = shells[k];
      const pvy = sh.vy;
      sh.vx += wind*7*dt; sh.vy -= G*dt; sh.x += sh.vx*dt; sh.y += sh.vy*dt;
      if(guard % 2 === 0) sh.path.push(Math.round(sh.x*10)/10, Math.round(sh.y*10)/10);
      if(sh.split && pvy > 0 && sh.vy <= 0){
        sh.split = false;
        for(const dvx of [-28, 28]) shells.push({ x:sh.x, y:sh.y, vx: sh.vx+dvx, vy: sh.vy, bounces:0, split:false, path:[], child:true, from: sh.path.length });
      }
      const hitCat = cats.findIndex(c => Math.abs(sh.x-c.x)<9 && sh.y-c.y > -2 && sh.y-c.y < 20);
      const g = ground(t, sh.x);
      const out = sh.x < -40 || sh.x > W+40 || sh.y < -30;
      if(hitCat>=0 || (g>-999 && sh.y <= g) || out){
        if(sh.bounces>0 && hitCat<0 && !out){ sh.bounces--; sh.y = g+0.5; sh.vy = Math.abs(sh.vy)*0.55; sh.vx *= 0.8; continue; }
        sh.path.push(Math.round(sh.x*10)/10, Math.round(Math.max(sh.y, g)*10)/10);
        if(!out) booms.push({ x: Math.round(sh.x*10)/10, y: Math.round(Math.max(sh.y, g)*10)/10, r: WEAP[sh.child||weapon==="split"?"split":weapon].r, dmg: WEAP[weapon==="split"?"split":weapon].dmg });
        sh.done = true;
        shells.splice(k,1);
        donePaths.push({ pts: sh.path, from: sh.from||0, child: !!sh.child });
      }
    }
  }
  const paths = donePaths;
  // damage + craters
  const dmg = [0,0];
  for(const b of booms){
    for(let k=0;k<2;k++){ const c = cats[k]; const d = Math.hypot(b.x-c.x, b.y-(c.y+8)); if(d < b.r+8) dmg[k] += Math.round(b.dmg * (1 - d/(b.r+8))); }
    for(let i=0;i<COLS;i++){ const cx = i*CW+CW/2, dx = cx-b.x; if(Math.abs(dx) < b.r){ const depth = Math.sqrt(b.r*b.r-dx*dx); const bottom = b.y - depth; if(t[i] > bottom) t[i] = Math.max(4, Math.round(bottom)); } }
  }
  return { paths, booms, dmg, terrain: t };
}
const fresh = (ids, sc, seed) => {
  seed = seed || Math.floor(Math.random()*1e9);
  return { seed, terrain: makeTerrain(seed), hp:{[ids[0]]:MAXHP,[ids[1]]:MAXHP}, ammo:{[ids[0]]:{split:2,yarn:2},[ids[1]]:{split:2,yarn:2}},
    turn: ids[0], wind: Math.round((Math.random()-.5)*8), shot:0, last:null, win:null, sc: sc||{}, aim:{[ids[0]]:{a:45,p:.6},[ids[1]]:{a:45,p:.6}} };
};

App.registerGame({
  id: "cannon",
  name: "砲台大戰",
  desc: "算好角度和風向，轟！",
  icon: () => Pix.sprite("orange","surprised"),
  mount(el, ctx){
    const { sprite, icon, esc, SFX } = ctx;
    let s = null, shownShot = 0, anim = null, angle = 45, power = .6, weapon = "fish", busy = false, shake = 0;
    el.innerHTML = `<div class="box cn">
      <div class="cnTop" id="cnTop"></div>
      <div class="cnField"><canvas id="cnC"></canvas><div class="cnWind" id="cnWind"></div><div class="cnTurn" id="cnTurn"></div></div>
      <div class="cnCtl" id="cnCtl">
        <div class="cnSl"><span>角度</span><button data-k="a" data-d="-1">－</button><input type="range" id="cnA" min="5" max="85" step="1"><button data-k="a" data-d="1">＋</button><b id="cnAv"></b></div>
        <div class="cnSl"><span>力道</span><button data-k="p" data-d="-0.01">－</button><input type="range" id="cnP" min="0.05" max="1" step="0.01"><button data-k="p" data-d="0.01">＋</button><b id="cnPv"></b></div>
        <div class="cnW" id="cnW"></div>
        <button class="btn cnFire" id="cnFire">發射！</button>
        <div class="cnHint">也可以直接在畫面上用手指拖曳瞄準</div>
      </div>
      <div style="text-align:center;margin-top:8px"><button class="btn sub" id="cnNew">換新地圖重新開戰</button></div></div>`;
    const $ = q => el.querySelector(q);
    const cv = $("#cnC"), g = cv.getContext("2d");
    const ids = () => ctx.players();
    const me = () => ctx.me.uid;
    const kOf = u => ids().indexOf(u);
    let scale = 1;
    const imgs = {};
    function catImg(color, face, flip){
      const k = color+face+flip; if(imgs[k]) return imgs[k];
      const im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(sprite(color, face).replace("<svg ", `<svg width="100" height="100" `));
      im.onload = () => draw(); imgs[k] = im; return im;
    }
    const fishImg = (()=>{ const im=new Image(); im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(icon("fish").replace("<svg ",'<svg width="60" height="40" ')); return im; })();
    function resize(){ const r = cv.getBoundingClientRect(); if(!r.width) return; const d = window.devicePixelRatio||1; cv.width = r.width*d; cv.height = r.width*H/W*d; scale = r.width/W; g.setTransform(d*scale,0,0,d*scale,0,0); g.imageSmoothingEnabled=false; draw(); }
    const sy = y => H - y;   // world y (up) -> canvas y (down)

    function previewPts(){
      if(!s) return [];
      const k = kOf(me()), c = catPos(s.terrain, k), dir = k===0?1:-1, v0 = 40+power*175, rad = angle*Math.PI/180;
      let x=c.x+dir*8, y=c.y+16, vx=Math.cos(rad)*v0*dir, vy=Math.sin(rad)*v0; const pts=[];
      for(let i=0;i<40;i++){ for(let j=0;j<3;j++){ vy-=G/60; x+=vx/60; y+=vy/60; } pts.push([x,y]); if(y<ground(s.terrain,x)) break; }
      return pts.slice(0, 14);
    }
    function draw(){
      if(!s || !cv.width) return;
      g.save();
      if(shake>0){ g.translate((Math.random()-.5)*shake, (Math.random()-.5)*shake); }
      // sky
      const sk = g.createLinearGradient(0,0,0,H); sk.addColorStop(0,"#bfe3ff"); sk.addColorStop(1,"#ffe9f0"); g.fillStyle=sk; g.fillRect(-10,-10,W+20,H+20);
      // clouds (wind drifts them)
      const tnow = performance.now()/1000;
      g.fillStyle="rgba(255,255,255,.85)";
      for(let i=0;i<4;i++){ const cx = ((i*97 + tnow*s.wind*3) % (W+60) + W+60) % (W+60) - 30, cy = 30+i*14; g.fillRect(cx,cy,26,8); g.fillRect(cx+6,cy-6,14,6); }
      // terrain
      const t = (anim && anim.terrain) || s.terrain;
      for(let i=0;i<COLS;i++){ const x=i*CW, h=t[i]; g.fillStyle="#c9925c"; g.fillRect(x, sy(h), CW+.3, h); g.fillStyle = (i%2?"#7cc47f":"#86cf88"); g.fillRect(x, sy(h), CW+.3, 4); g.fillStyle="rgba(120,70,30,.18)"; if(i%5===0) g.fillRect(x, sy(h)+10, CW, 3); }
      // cats
      const I = ids();
      for(let k=0;k<2;k++){
        const u = I[k]; if(!u) continue;
        const c = catPos(t, k), hp = s.hp[u];
        const face = s.win ? (s.win===u?"love":"sleep") : (anim && anim.hurt && anim.hurt[k] ? "surprised" : (s.turn===u ? "happy" : "normal"));
        const im = catImg(ctx.catOf(u), face, k===1);
        if(im.complete){ g.save(); g.translate(c.x, sy(c.y)-15); if(k===1) g.scale(-1,1); g.drawImage(im, -16, -16, 32, 32); g.restore(); }
        // cannon barrel for current shooter
        if(!s.win && s.turn===u && !anim){
          const a = (u===me()? angle : (s.aim&&s.aim[u]?s.aim[u].a:45))*Math.PI/180, dir = k===0?1:-1;
          g.strokeStyle="#5a3b2e"; g.lineWidth=4; g.beginPath(); g.moveTo(c.x+dir*4, sy(c.y+10)); g.lineTo(c.x+dir*4+Math.cos(a)*14*dir, sy(c.y+10+Math.sin(a)*14)); g.stroke();
        }
        // hp bar
        g.fillStyle="#5a3b2e"; g.fillRect(c.x-15, sy(c.y)-39, 30, 6); g.fillStyle = hp>30?"#7cc7a5":"#f08aa0"; g.fillRect(c.x-14, sy(c.y)-38, 28*Math.max(0,hp)/MAXHP, 4);
      }
      // aim preview
      if(!anim && s && !s.win && s.turn===me()){
        g.fillStyle="rgba(90,59,46,.55)";
        previewPts().forEach(([x,y],i)=>{ const r = 2.2 - i*0.1; g.fillRect(x-r/2, sy(y)-r/2, r, r); });
      }
      // projectiles + explosions
      if(anim){
        for(const sh of anim.shells){ if(sh.on){ g.save(); g.translate(sh.x, sy(sh.y)); g.rotate(-sh.rot); g.drawImage(fishImg, -9, -6, 18, 12); g.restore(); } }
        for(const e of anim.fx){ const p = e.t/e.life; if(p>=1) continue;
          if(e.kind==="boom"){ g.fillStyle=`rgba(255,${180-p*120|0},80,${1-p})`; const r=e.r*(.4+p*.8); g.beginPath(); g.arc(e.x, sy(e.y), r, 0, 6.29); g.fill(); g.fillStyle=`rgba(255,255,220,${(1-p)*.9})`; g.beginPath(); g.arc(e.x, sy(e.y), r*.5, 0, 6.29); g.fill(); }
          else if(e.kind==="bit"){ g.fillStyle = e.c; g.fillRect(e.x+e.vx*e.t, sy(e.y+e.vy*e.t-60*e.t*e.t), 2.4, 2.4); }
          else if(e.kind==="txt"){ g.font="bold 14px DotGothic16, monospace"; g.textAlign="center"; g.lineWidth=3; g.strokeStyle="#fff"; g.fillStyle="#e5486a"; g.strokeText(e.s, e.x, sy(e.y+20+p*24)); g.fillText(e.s, e.x, sy(e.y+20+p*24)); }
        }
      }
      g.restore();
    }
    function ui(){
      const I = ids(), p = ctx.partner();
      if(!p || I.length<2){ $("#cnTurn").textContent = "等另一半加入小窩…"; $("#cnCtl").classList.add("off"); return; }
      $("#cnTop").innerHTML = I.map((u,k)=>`<div class="cnP ${s.turn===u&&!s.win?"on":""}"><span>${sprite(ctx.catOf(u),"normal")}</span><b>${esc(ctx.nameOf(u))}</b><i>${s.sc[u]||0} 勝</i></div>`).join(`<span class="vs">VS</span>`);
      const w = s.wind; $("#cnWind").innerHTML = w===0 ? "無風" : `風 ${w>0?"→":"←"} ${"▮".repeat(Math.abs(w))}`;
      const mine = !s.win && s.turn===me() && !busy;
      $("#cnTurn").innerHTML = s.win ? (s.win===me() ? "你贏了！🏆" : `${esc(ctx.nameOf(s.win))} 贏了～`) : s.turn===me() ? (busy ? "" : "輪到你開砲！") : `等 ${esc(ctx.nameOf(s.turn))} 瞄準中…`;
      $("#cnCtl").classList.toggle("off", !mine);
      $("#cnA").value = angle; $("#cnP").value = power; $("#cnAv").textContent = angle+"°"; $("#cnPv").textContent = Math.round(power*100)+"%";
      const am = s.ammo[me()] || {split:0,yarn:0};
      if(weapon!=="fish" && !(am[weapon]>0)) weapon = "fish";
      $("#cnW").innerHTML = Object.entries(WEAP).map(([k,v])=>{ const left = k==="fish" ? "∞" : (am[k]||0); return `<button data-w="${k}" class="${weapon===k?"on":""}" ${k!=="fish"&&!(am[k]>0)?"disabled":""}><span>${v.i}</span><b>${v.n}</b><i>剩 ${left}</i></button>`; }).join("");
      $("#cnW").querySelectorAll("button").forEach(b=>b.addEventListener("click", ()=>{ weapon=b.dataset.w; SFX.select(); ui(); }));
      draw();
    }
    // controls
    $("#cnA").addEventListener("input", e=>{ angle=+e.target.value; $("#cnAv").textContent=angle+"°"; draw(); });
    $("#cnP").addEventListener("input", e=>{ power=+e.target.value; $("#cnPv").textContent=Math.round(power*100)+"%"; draw(); });
    el.querySelectorAll(".cnSl button").forEach(b=>b.addEventListener("click", ()=>{ const d=+b.dataset.d; if(b.dataset.k==="a") angle=Math.max(5,Math.min(85,angle+d)); else power=Math.max(.05,Math.min(1,Math.round((power+d)*100)/100)); SFX.key(); ui(); }));
    // drag-to-aim on the field
    let dragging=false;
    cv.addEventListener("pointerdown", e=>{ if(!s||s.win||s.turn!==me()||busy) return; dragging=true; cv.setPointerCapture(e.pointerId); aimAt(e); });
    cv.addEventListener("pointermove", e=>{ if(dragging) aimAt(e); });
    cv.addEventListener("pointerup", ()=>{ dragging=false; }); cv.addEventListener("pointercancel", ()=>{ dragging=false; });
    function aimAt(e){
      const r = cv.getBoundingClientRect(), x = (e.clientX-r.left)/scale, y = H-(e.clientY-r.top)/scale;
      const k = kOf(me()), c = catPos(s.terrain,k), dir = k===0?1:-1;
      const dx = (x-c.x)*dir, dy = y-(c.y+12);
      angle = Math.round(Math.max(5, Math.min(85, Math.atan2(Math.max(dy,1), Math.max(dx,1))*180/Math.PI)));
      power = Math.round(Math.max(.05, Math.min(1, Math.hypot(dx,dy)/170))*100)/100;
      ui();
    }
    $("#cnFire").addEventListener("click", async ()=>{
      if(!s || s.win || s.turn!==me() || busy) return;
      const I = ids(), k = kOf(me()), w = weapon, a = angle, p = power;
      SFX.shoot();
      const ns = await ctx.update("cannon", st=>{
        if(!st || st.win || st.turn!==me()) return undefined;
        if(w!=="fish" && !(st.ammo[me()][w]>0)) return undefined;
        const res = simulate(st, k, a, p, w);
        const other = I[1-k];
        st.hp[I[0]] = Math.max(0, st.hp[I[0]]-res.dmg[0]); st.hp[I[1]] = Math.max(0, st.hp[I[1]]-res.dmg[1]);
        st.terrain = res.terrain; if(w!=="fish") st.ammo[me()][w]--;
        st.shot = (st.shot||0)+1;
        st.last = { shot: st.shot, by: me(), k, w, paths: res.paths, booms: res.booms, dmg: res.dmg, before: null };
        st.aim = st.aim || {}; st.aim[me()] = { a, p };
        if(st.hp[I[0]]<=0 || st.hp[I[1]]<=0){ st.win = st.hp[I[0]]<=0 && st.hp[I[1]]<=0 ? "draw" : st.hp[I[0]]<=0 ? I[1] : I[0]; if(st.win!=="draw") st.sc[st.win]=(st.sc[st.win]||0)+1; }
        else { st.turn = other; st.wind = Math.round((Math.random()-.5)*10); }
        return st;
      });
      if(ns && !ns.win) { const pp = ctx.partner(); if(pp && !ctx.isOnline(pp.user_id)) ctx.notifyPartner(`${ctx.me.name} 在「砲台大戰」開砲了，換你反擊！`); }
    });
    // replay a shot from state
    function play(prev, st){
      return new Promise(done=>{
        busy = true; ui();
        const L = st.last, shells = L.paths.map(p=>({ pts:p.pts, from:p.from, i:0, on:false, x:0, y:0, rot:0, child:p.child }));
        const parentLen = shells.find(x=>!x.child) ? shells.find(x=>!x.child).pts.length : 0;
        anim = { shells, fx: [], terrain: prev.terrain.slice(), hurt:[0,0] };
        let frame = 0, boomed = false; const fx = anim.fx;
        const total = Math.max(...shells.map(sh=>(sh.child? sh.from : 0) + sh.pts.length)) / 2;
        const tick = () => {
          frame++;
          for(const sh of shells){
            const startAt = sh.child ? sh.from/2 : 0, i = (frame - startAt);
            if(i < 0){ sh.on=false; continue; }
            const idx = Math.min(sh.pts.length/2-1, i);
            const nx = sh.pts[idx*2], ny = sh.pts[idx*2+1];
            sh.rot = Math.atan2(ny-sh.y, nx-sh.x); sh.x = nx; sh.y = ny; sh.on = i < sh.pts.length/2;
          }
          for(const e of fx) e.t += 1/60;
          if(!boomed && frame >= total){
            boomed = true;
            anim.terrain = st.terrain.slice();
            for(const b of L.booms){
              fx.push({ kind:"boom", x:b.x, y:b.y, r:b.r*1.2, t:0, life:.5 });
              for(let j=0;j<16;j++) fx.push({ kind:"bit", x:b.x, y:b.y, vx:(Math.random()-.5)*120, vy:40+Math.random()*80, c: j%2?"#c9925c":"#ffcf66", t:0, life:.8 });
            }
            L.dmg.forEach((d,k)=>{ if(d>0){ const c = catPos(st.terrain,k); fx.push({ kind:"txt", s:`-${d}`, x:c.x, y:c.y, t:0, life:1.1 }); anim.hurt[k]=1; } });
            shake = 6; SFX.boom(L.booms.length>1 || L.dmg.some(d=>d>20)); if(L.dmg.some(d=>d>0)) setTimeout(()=>SFX.hit(), 120);
          }
          if(shake>0) shake = Math.max(0, shake-.4);
          draw();
          if(frame < total + 70) requestAnimationFrame(tick);
          else { anim = null; busy = false; shake = 0; done(); }
        };
        requestAnimationFrame(tick);
      });
    }
    async function onState(st){
      if(!st) return;
      const prev = s;
      if(prev && st.last && st.last.shot > shownShot && st.seed===prev.seed){
        shownShot = st.last.shot;
        s = Object.assign({}, st, { hp: prev.hp, terrain: prev.terrain, win: null, turn: st.last.by });
        await play(prev, st);
      }
      shownShot = st.last ? st.last.shot : 0;
      s = st;
      if(st.turn===me() && st.aim && st.aim[me()] && !busy && prev && prev.turn!==me()){ angle = st.aim[me()].a; power = st.aim[me()].p; }
      ui();
      if(st.win && prev && !prev.win){ if(st.win===me()){ SFX.match(); ctx.burst(); } else SFX.miss(); }
      if(!st.win && prev && prev.turn!==me() && st.turn===me()) SFX.beep(true);
    }
    $("#cnNew").addEventListener("click", async ()=>{ const I=ids(); if(I.length<2||busy) return; await ctx.update("cannon", st=>fresh(I, st?st.sc:{})); });
    let pending = null;
    this._u = ctx.onState("cannon", st=>{ if(busy){ pending = st; const w = ()=>{ if(busy) return setTimeout(w,200); const p=pending; pending=null; onState(p); }; setTimeout(w,200); } else onState(st); });
    this._p = ctx.onPresence(()=>{ if(s && !busy) ui(); });
    this._ro = new ResizeObserver(resize); this._ro.observe(cv);
    // clouds drift
    const loop = () => { if(!el.isConnected) return; if(!busy) draw(); this._raf = setTimeout(loop, 120); }; loop();
    (async()=>{
      const I = ids();
      let cur = await ctx.getState("cannon");
      if(!cur && I.length>=2){ await ctx.update("cannon", st=> st ? undefined : fresh(I, {})); cur = await ctx.getState("cannon"); }
      if(cur && I.length>=2 && !I.every(i=>i in cur.state.hp)){ await ctx.update("cannon", st=>fresh(I, st?st.sc:{})); cur = await ctx.getState("cannon"); }
      if(cur){ s = JSON.parse(JSON.stringify(cur.state)); shownShot = s.last ? s.last.shot : 0; if(s.aim && s.aim[me()]){ angle=s.aim[me()].a; power=s.aim[me()].p; } }
      if(s) ui(); else $("#cnTurn").textContent = "等另一半加入小窩…";
      resize();
    })();
  },
  unmount(){ if(this._u) this._u(); if(this._p) this._p(); if(this._ro) this._ro.disconnect(); clearTimeout(this._raf); },
});
})();
