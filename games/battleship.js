// 遊戲：喵喵海戰（擺好貓咪艦隊，輪流猜座標開砲；打中可以再打一次）
(function(){
const N = 8;
const SHIPS = [{ len:4, n:"大貓郵輪" }, { len:3, n:"橘貓快艇" }, { len:3, n:"白貓帆船" }, { len:2, n:"小魚舟" }];
const ROWS = "ABCDEFGH";
function cellsOf(x, y, len, vert){ const c=[]; for(let k=0;k<len;k++){ const cx=x+(vert?0:k), cy=y+(vert?k:0); if(cx>=N||cy>=N) return null; c.push(cy*N+cx); } return c; }
function valid(fleet, idx, cells){
  const taken = new Set(); fleet.forEach((s,i)=>{ if(i!==idx) s.cells.forEach(c=>taken.add(c)); });
  return cells && cells.every(c=>!taken.has(c));
}
function randomFleet(){
  for(let tries=0;tries<200;tries++){
    const fleet = []; let ok = true;
    for(const sh of SHIPS){
      let placed = false;
      for(let t=0;t<200 && !placed;t++){
        const vert = Math.random()<.5, x = (Math.random()*N)|0, y = (Math.random()*N)|0, cells = cellsOf(x,y,sh.len,vert);
        if(cells && valid(fleet, -1, cells)){ fleet.push({ len:sh.len, n:sh.n, cells, vert }); placed = true; }
      }
      if(!placed){ ok=false; break; }
    }
    if(ok) return fleet;
  }
}
const fresh = (ids, sc) => ({ phase:"place", fleets:{}, ready:{}, shots:{[ids[0]]:[],[ids[1]]:[]}, turn: ids[Math.random()<.5?0:1], win:null, sc: sc||{}, last:null });

App.registerGame({
  id: "battleship",
  name: "喵喵海戰",
  desc: "擺好艦隊，猜座標開砲",
  icon: () => Pix.sprite("white","wave"),
  mount(el, ctx){
    const { sprite, esc, SFX } = ctx;
    let s = null, myFleet = null, sel = -1, aim = -1, shownLast = null, busy = false;
    el.innerHTML = `<div class="box bs"><div class="bsMsg" id="bsMsg"></div><div id="bsBody"></div>
      <div style="text-align:center;margin-top:10px"><button class="btn sub" id="bsNew">重新開一局</button></div></div>`;
    const $ = q => el.querySelector(q);
    const ids = () => ctx.players(), me = () => ctx.me.uid, opp = () => ids().find(i=>i!==me());
    const shipAt = (fleet, c) => fleet ? fleet.findIndex(s=>s.cells.includes(c)) : -1;
    const sunk = (ship, shots) => ship.cells.every(c=>shots.includes(c));

    function grid(kind){
      // kind: "place" | "enemy" | "mine"
      const myShots = s.shots[me()]||[], theirShots = s.shots[opp()]||[];
      const fleet = kind==="enemy" ? (s.fleets[opp()]||[]) : (kind==="place" ? myFleet : s.fleets[me()]);
      const shots = kind==="enemy" ? myShots : theirShots;
      let h = `<div class="bsGrid ${kind}"><span></span>${[...Array(N)].map((_,i)=>`<span class="lb">${i+1}</span>`).join("")}`;
      for(let y=0;y<N;y++){
        h += `<span class="lb">${ROWS[y]}</span>`;
        for(let x=0;x<N;x++){
          const c = y*N+x, si = shipAt(fleet, c), shot = shots.includes(c);
          let cls = "c", inner = "";
          if(kind==="enemy"){
            if(shot){ if(si>=0){ cls += sunk(fleet[si], shots) ? " sunk" : " hit"; inner = sunk(fleet[si], shots) ? "😿" : "💥"; } else { cls += " miss"; inner = "💧"; } }
            if(c===aim) cls += " aim";
          } else {
            if(si>=0){ cls += " ship"; if(kind==="place" && si===sel) cls += " sel"; const sh = fleet[si]; if(sh.cells[0]===c) cls += sh.vert?" headv":" headh"; }
            if(shot){ cls += si>=0 ? " hit" : " miss"; inner = si>=0 ? "💥" : "·"; }
          }
          h += `<button class="${cls}" data-c="${c}">${inner}</button>`;
        }
      }
      return h + `</div>`;
    }
    function render(){
      const p = ctx.partner();
      if(!p || ids().length<2){ $("#bsMsg").textContent = "等另一半加入小窩…"; $("#bsBody").innerHTML=""; return; }
      if(!s) return;
      const pn = esc(p.name);
      if(s.phase==="place"){
        const ready = !!s.ready[me()];
        if(!myFleet) myFleet = (s.fleets[me()] && JSON.parse(JSON.stringify(s.fleets[me()]))) || randomFleet();
        $("#bsMsg").innerHTML = ready ? (s.ready[opp()] ? "開戰！" : `已佈陣！等 ${pn} 擺好艦隊…`) : `擺好你的艦隊 ⚓<br><small>點船選取，再點空格移動；也可以直接隨機</small>`;
        $("#bsBody").innerHTML = grid("place") + (ready ? "" : `<div class="bsTools"><button class="btn sub" id="bsRand">🎲 隨機擺放</button><button class="btn sub" id="bsRot" ${sel<0?"disabled":""}>↻ 旋轉</button></div>
          <div class="bsList">${myFleet.map((sh,i)=>`<span class="${i===sel?"on":""}">${"▮".repeat(sh.len)} ${sh.n}</span>`).join("")}</div>
          <button class="btn" id="bsReady">確定佈陣！</button>`) + `<div class="bsOpp">${s.ready[opp()]?`✔ ${pn} 已經擺好了`:`${pn} 還在擺…`}</div>`;
        if(!ready){
          $("#bsBody").querySelectorAll(".bsGrid button").forEach(b=>b.addEventListener("click", ()=>tapPlace(+b.dataset.c)));
          $("#bsRand").addEventListener("click", ()=>{ myFleet = randomFleet(); sel=-1; SFX.splash(); render(); });
          $("#bsRot").addEventListener("click", rotate);
          $("#bsReady").addEventListener("click", ready_);
        }
        return;
      }
      const myTurn = s.phase==="play" && s.turn===me();
      const enemyFleet = s.fleets[opp()]||[], myShots = s.shots[me()]||[];
      const leftEnemy = enemyFleet.filter(sh=>!sunk(sh, myShots)).length, leftMine = (s.fleets[me()]||[]).filter(sh=>!sunk(sh, s.shots[opp()]||[])).length;
      $("#bsMsg").innerHTML = s.phase==="end" ? (s.win===me() ? "<b>全部擊沉！你贏了 🏆</b>" : `${pn} 贏了～ 你的艦隊沉光了 😿`)
        : myTurn ? `<b>輪到你開砲！</b>${s.last && s.last.by===me() && s.last.hit ? "（打中了，再來一砲！）" : ""}` : `${pn} 正在瞄準你的艦隊…`;
      $("#bsBody").innerHTML = `<div class="bsLabel">🎯 ${pn} 的海域・剩 ${leftEnemy} 艘</div>` + grid("enemy") +
        (s.phase==="play" ? `<button class="btn bsFire" id="bsFire" ${myTurn && aim>=0 ? "" : "disabled"}>${aim>=0 ? `開砲！${ROWS[(aim/N)|0]}${aim%N+1}` : "點上面的海域瞄準"}</button>` : "") +
        `<div class="bsLabel">⚓ 我的艦隊・剩 ${leftMine} 艘</div><div class="bsMine">${grid("mine")}</div>`;
      if(myTurn) $("#bsBody").querySelectorAll(".bsGrid.enemy button").forEach(b=>b.addEventListener("click", ()=>{ const c=+b.dataset.c; if(myShots.includes(c)) return; aim = c; SFX.key(); render(); }));
      const f = $("#bsFire"); if(f) f.addEventListener("click", fire);
    }
    function tapPlace(c){
      const si = shipAt(myFleet, c);
      if(si>=0){ sel = si===sel ? -1 : si; SFX.key(); render(); return; }
      if(sel<0) return;
      const sh = myFleet[sel], cells = cellsOf(c%N, (c/N)|0, sh.len, sh.vert);
      if(valid(myFleet, sel, cells)){ sh.cells = cells; SFX.splash(); render(); } else SFX.miss();
    }
    function rotate(){
      if(sel<0) return; const sh = myFleet[sel], h = sh.cells[0];
      const cells = cellsOf(h%N, (h/N)|0, sh.len, !sh.vert);
      if(valid(myFleet, sel, cells)){ sh.vert = !sh.vert; sh.cells = cells; SFX.select(); render(); } else { SFX.miss(); ctx.toast("這裡轉不過去，先移到空一點的地方"); }
    }
    async function ready_(){
      const fleet = myFleet; SFX.select();
      await ctx.update("battleship", st=>{
        if(!st || st.phase!=="place") return undefined;
        st.fleets[me()] = fleet; st.ready[me()] = true;
        if(ids().every(i=>st.ready[i])) st.phase = "play";
        return st;
      });
      const p = ctx.partner(); if(p && !ctx.isOnline(p.user_id)) ctx.notifyPartner(`${ctx.me.name} 在「喵喵海戰」擺好艦隊了，快來擺你的！`);
    }
    async function fire(){
      if(aim<0 || busy) return; const c = aim; aim = -1;
      SFX.shoot();
      const ns = await ctx.update("battleship", st=>{
        if(!st || st.phase!=="play" || st.turn!==me()) return undefined;
        const shots = st.shots[me()]; if(shots.includes(c)) return undefined;
        shots.push(c);
        const fleet = st.fleets[opp()], si = shipAt(fleet, c), hit = si>=0;
        const sk = hit && sunk(fleet[si], shots);
        st.last = { by: me(), c, hit, sunk: sk ? fleet[si].n : null, n: (st.last ? st.last.n : 0) + 1 };
        if(fleet.every(sh=>sunk(sh, shots))){ st.phase = "end"; st.win = me(); st.sc[me()] = (st.sc[me()]||0)+1; }
        else if(!hit) st.turn = opp();
        return st;
      });
      if(ns && ns.phase==="play" && ns.turn!==me()){ const p = ctx.partner(); if(p && !ctx.isOnline(p.user_id)) ctx.notifyPartner(`${ctx.me.name} 在「喵喵海戰」開砲了，換你！`); }
    }
    function fx(last){
      // splash / boom where the shot landed
      const mine = last.by===me();
      const cell = el.querySelector(`.bsGrid.${mine?"enemy":"mine"} button[data-c="${last.c}"]`);
      if(cell){ cell.animate([{transform:"scale(1.8)",filter:"brightness(1.6)"},{transform:"scale(.9)"},{transform:"scale(1)"}],{duration:420,easing:"ease-out"}); }
      if(last.hit){ SFX.boom(!!last.sunk); if(last.sunk) ctx.toast(`${sprite(mine?ctx.catOf(me()):ctx.catOf(opp()), mine?"love":"surprised")} ${mine?"擊沉了":"被擊沉了"}「${esc(last.sunk)}」！`, 2600); }
      else SFX.splash();
    }
    function onState(st){
      if(!st) return;
      const prev = s; s = st;
      if(st.phase!=="place") myFleet = null;
      render();
      if(st.last && (!shownLast || st.last.n!==shownLast)){ if(prev) fx(st.last); shownLast = st.last.n; }
      if(prev && prev.phase!=="end" && st.phase==="end"){ if(st.win===me()){ SFX.match(); ctx.burst(); } else SFX.miss(); }
      if(prev && prev.phase==="place" && st.phase==="play") SFX.beep(true);
    }
    $("#bsNew").addEventListener("click", async ()=>{ const I=ids(); if(I.length<2) return; myFleet=null; sel=-1; aim=-1; await ctx.update("battleship", st=>fresh(I, st?st.sc:{})); });
    this._u = ctx.onState("battleship", onState);
    this._p = ctx.onPresence(()=>{ if(s) render(); });
    (async()=>{
      const I = ids();
      let cur = await ctx.getState("battleship");
      if(!cur && I.length>=2){ await ctx.update("battleship", st=> st ? undefined : fresh(I, {})); cur = await ctx.getState("battleship"); }
      if(cur && I.length>=2 && !I.every(i=>i in cur.state.shots)){ await ctx.update("battleship", st=>fresh(I, st?st.sc:{})); cur = await ctx.getState("battleship"); }
      if(cur){ s = JSON.parse(JSON.stringify(cur.state)); shownLast = s.last ? s.last.n : null; }
      render();
    })();
  },
  unmount(){ if(this._u) this._u(); if(this._p) this._p(); },
});
})();
