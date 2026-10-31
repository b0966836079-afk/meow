// 遊戲：喵喵五子棋
(function(){
const N = 15;
function checkWin(board, idx, c){
  const x=idx%N, y=(idx/N)|0;
  for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]){
    const line=[idx];
    for(const s of [1,-1]){ let nx=x+dx*s, ny=y+dy*s; while(nx>=0&&ny>=0&&nx<N&&ny<N&&board[ny*N+nx]===c){ line.push(ny*N+nx); nx+=dx*s; ny+=dy*s; } }
    if(line.length>=5) return line;
  }
  return null;
}
const fresh = (b, w, sc) => ({ board: ".".repeat(N*N), turn:"b", last:-1, win:null, sc: sc||{}, b, w, n:0 });

App.registerGame({
  id: "gomoku",
  name: "五子棋",
  desc: "先連成五顆就贏",
  icon: () => Pix.sprite("black","happy"),
  badge: null,
  mount(el, ctx){
    const { sprite, esc, SFX } = ctx;
    let s = null, preview = -1, shownWin = -1;
    el.innerHTML = `<div class="box card" style="padding:12px">
      <div style="display:flex;gap:8px;margin-bottom:8px" id="gmP"></div>
      <div id="gmS" style="font-size:16px;min-height:22px;margin-bottom:8px"></div>
      <div style="position:relative;width:100%;aspect-ratio:1/1;border:3px solid var(--line);background:#e9c48f;box-shadow:4px 4px 0 var(--shadow)"><canvas id="gmC" style="width:100%;height:100%;display:block;touch-action:manipulation"></canvas></div>
      <div class="muted" style="font-size:12px;margin-top:8px">點一下預覽，再點同一格確定落子</div>
      <div style="margin-top:10px"><button class="btn sub" id="gmNew">重新開一局</button></div></div>`;
    const cv = el.querySelector("#gmC"), g = cv.getContext("2d");
    let size=0, cell=0, pad=0;
    function resize(){ const r=cv.getBoundingClientRect(); const d=window.devicePixelRatio||1; cv.width=r.width*d; cv.height=r.height*d; g.setTransform(d,0,0,d,0,0); size=r.width; cell=size/N; pad=cell/2; draw(); }
    const xy = i => [pad+(i%N)*cell, pad+((i/N)|0)*cell];
    function stone(x,y,c,a){ g.globalAlpha=a||1; const r=cell*.44, gr=g.createRadialGradient(x-r*.35,y-r*.35,r*.1,x,y,r); if(c==="b"){gr.addColorStop(0,"#777");gr.addColorStop(1,"#111");}else{gr.addColorStop(0,"#fff");gr.addColorStop(1,"#d6d6d6");} g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fillStyle=gr; g.fill(); g.strokeStyle="rgba(0,0,0,.35)"; g.lineWidth=1; g.stroke(); g.globalAlpha=1; }
    function myColor(){ if(!s) return null; return s.b===ctx.me.uid?"b":s.w===ctx.me.uid?"w":null; }
    function draw(){
      if(!size) return;
      g.clearRect(0,0,size,size);
      g.strokeStyle="rgba(90,55,25,.75)"; g.lineWidth=1;
      for(let i=0;i<N;i++){ g.beginPath(); g.moveTo(pad,pad+i*cell); g.lineTo(pad+(N-1)*cell,pad+i*cell); g.stroke(); g.beginPath(); g.moveTo(pad+i*cell,pad); g.lineTo(pad+i*cell,pad+(N-1)*cell); g.stroke(); }
      g.fillStyle="rgba(90,55,25,.9)"; for(const [a,b] of [[3,3],[3,11],[11,3],[11,11],[7,7]]){ g.fillRect(pad+a*cell-3,pad+b*cell-3,6,6); }
      if(!s) return;
      for(let i=0;i<N*N;i++){ const c=s.board[i]; if(c!=="."){ const [x,y]=xy(i); stone(x,y,c); } }
      if(s.last>=0){ const [x,y]=xy(s.last); g.fillStyle="#f08aa0"; g.fillRect(x-3,y-3,6,6); }
      if(s.win&&s.win.line){ g.strokeStyle="#f08aa0"; g.lineWidth=3; for(const i of s.win.line){ const [x,y]=xy(i); g.strokeRect(x-cell*.46,y-cell*.46,cell*.92,cell*.92); } }
      if(preview>=0&&s.board[preview]==="."){ const [x,y]=xy(preview); stone(x,y,myColor(),.5); g.strokeStyle="#f08aa0"; g.lineWidth=2; g.strokeRect(x-cell*.46,y-cell*.46,cell*.92,cell*.92); }
    }
    function ui(){
      const p = ctx.partner();
      const P = el.querySelector("#gmP"), S = el.querySelector("#gmS");
      if(!p){ P.innerHTML=""; S.textContent="等另一半加入小窩…"; draw(); return; }
      if(!s){ S.textContent="準備棋盤中…"; return; }
      const card = (uid,c)=>`<div style="flex:1;display:flex;align-items:center;gap:6px;padding:4px 6px;border:3px solid ${!s.win&&s.turn===c?"var(--pink)":"var(--shadow)"};background:#fff">
        <span style="width:36px;height:36px">${sprite(ctx.catOf(uid),"normal")}</span><span style="text-align:left;min-width:0"><div style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(ctx.nameOf(uid))}</div><div class="muted" style="font-size:11px">${c==="b"?"⚫ 黑・先手":"⚪ 白"}</div></span><b style="margin-left:auto;font-weight:400;color:var(--pink);font-size:20px">${s.sc[uid]||0}</b></div>`;
      P.innerHTML = card(s.b,"b") + card(s.w,"w");
      const mc = myColor();
      if(s.win){ const wid = s.win.c==="b"?s.b:s.w; S.innerHTML = s.win.c==="draw" ? "平手！" : wid===ctx.me.uid ? "你贏了！🎉" : `${esc(ctx.nameOf(wid))} 贏了～`;
        if(shownWin!==s.n){ shownWin=s.n; if(wid===ctx.me.uid){ SFX.match(); ctx.burst(); } else SFX.miss(); } }
      else if(mc===s.turn){ S.innerHTML = `<span style="color:var(--pink)">輪到你了！</span>`; }
      else S.textContent = `等 ${ctx.nameOf(s.turn==="b"?s.b:s.w)} 下棋…`;
      draw();
    }
    cv.addEventListener("click", async ev=>{
      if(!s||s.win||myColor()!==s.turn) return;
      const r=cv.getBoundingClientRect(); const gx=Math.round((ev.clientX-r.left-pad)/cell), gy=Math.round((ev.clientY-r.top-pad)/cell);
      if(gx<0||gy<0||gx>=N||gy>=N) return; const idx=gy*N+gx; if(s.board[idx]!==".") return;
      if(preview!==idx){ preview=idx; draw(); return; }
      preview=-1; SFX.place();
      const me=ctx.me.uid;
      const ns = await ctx.update("gomoku", st=>{
        if(!st||st.win) return undefined;
        const c = st.b===me?"b":st.w===me?"w":null; if(c!==st.turn||st.board[idx]!==".") return undefined;
        st.board = st.board.slice(0,idx)+c+st.board.slice(idx+1); st.last=idx; st.n++; st.turn = c==="b"?"w":"b";
        const line = checkWin(st.board, idx, c);
        if(line){ st.win={c,line}; st.sc[me]=(st.sc[me]||0)+1; } else if(st.n>=N*N) st.win={c:"draw",line:[]};
        return st;
      });
      if(ns){ s=ns; ui(); const p=ctx.partner(); if(p && !ns.win) ctx.notifyPartner(`${ctx.me.name} 在「五子棋」下了一步，輪到你囉！`); }
    });
    el.querySelector("#gmNew").addEventListener("click", async()=>{
      const ids = ctx.players(); if(ids.length<2) return;
      const ns = await ctx.update("gomoku", st=> st ? fresh(st.w, st.b, st.sc) : fresh(ids[0], ids[1], {}));
      if(ns){ s=ns; preview=-1; ui(); }
    });
    this._ro = new ResizeObserver(resize); this._ro.observe(cv);
    this._unsub = ctx.onState("gomoku", st=>{ if(!st) return; if(s && st.n>s.n && st.last>=0 && st.board[st.last] !== myColor()) SFX.place(); s=st; ui(); });
    this._unp = ctx.onPresence(ui);
    (async()=>{
      let cur = await ctx.getState("gomoku");
      const ids = ctx.players();
      if(!cur && ids.length>=2){ await ctx.update("gomoku", st=> st ? undefined : fresh(ids[0], ids[1], {})); cur = await ctx.getState("gomoku"); }
      // a player switched phones: hand their seat to the current member
      if(cur && ids.length>=2 && (!ids.includes(cur.state.b) || !ids.includes(cur.state.w))){
        await ctx.update("gomoku", st=>{ if(!st) return undefined; const free = ids.filter(i=>i!==st.b && i!==st.w); if(!ids.includes(st.b)) st.b = free.shift(); if(!ids.includes(st.w)) st.w = free.shift(); return st; });
        cur = await ctx.getState("gomoku");
      }
      if(cur){ s = JSON.parse(JSON.stringify(cur.state)); shownWin = s.win ? s.n : -1; }
      ui(); resize();
    })();
  },
  unmount(){ if(this._ro) this._ro.disconnect(); if(this._unsub) this._unsub(); if(this._unp) this._unp(); },
});
})();
