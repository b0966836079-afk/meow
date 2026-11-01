// 遊戲：你畫我猜（合作）。一個人選題目畫畫，另一個人用注音鍵盤猜；答對兩個人一起得分，還會幫我們的貓賺小魚乾。
// 同步方式：畫完一筆（手指離開）就把這一筆寫進 game_state，對方那邊會把這一筆「畫出來」的動畫重播。
(function(){
const WORDS = {
  "動物": ["貓咪","小狗","兔子","熊貓","長頸鹿","大象","企鵝","烏龜","章魚","金魚","老虎","獅子","猴子","蛇","恐龍","刺蝟","青蛙","蝴蝶","蜜蜂","螃蟹","鯨魚","鯊魚","小雞","豬","牛","馬","羊","老鼠","貓頭鷹","天鵝","孔雀","海豚","蝸牛","無尾熊","袋鼠","斑馬","鱷魚","狐狸","松鼠","水母"],
  "食物": ["蛋糕","披薩","漢堡","薯條","壽司","拉麵","珍珠奶茶","冰淇淋","西瓜","香蕉","蘋果","草莓","葡萄","鳳梨","荷包蛋","飯糰","水餃","熱狗","甜甜圈","棒棒糖","巧克力","吐司","咖啡","雞腿","玉米","胡蘿蔔","布丁","餅乾","爆米花","火鍋","小籠包","粽子","月餅","檸檬","櫻桃","鬆餅","蛋塔","泡麵","便當","烤肉"],
  "東西": ["手機","雨傘","眼鏡","帽子","襪子","鞋子","牙刷","剪刀","鉛筆","吹風機","電視","時鐘","鑰匙","氣球","禮物","蠟燭","風箏","吉他","鋼琴","相機","耳機","枕頭","沙發","馬桶","檯燈","書包","戒指","口紅","鏡子","梳子","電腦","滑板","腳踏車","汽車","飛機","火箭","帆船","火車","熱氣球","雪人"],
  "地方": ["海邊","山","公園","學校","醫院","便利商店","摩天輪","游泳池","電影院","圖書館","廚房","浴室","沙漠","島","瀑布","城堡","月亮","太陽","彩虹","星星","火山","森林","金字塔","燈塔","溜滑梯"],
  "動作": ["睡覺","跑步","游泳","跳舞","唱歌","釣魚","拍照","打噴嚏","刷牙","洗澡","放風箏","看電影","吃飯","擁抱","親親","牽手","打電動","騎車","划船","爬山","滑雪","打哈欠","生氣","哭哭","大笑"],
  "我們": ["約會","求婚","情人節","聖誕樹","生日","煙火","愛心","婚禮","情侶裝","看夜景","野餐","露營","搭帳篷","寫信","撒嬌","吃醋","晚安","早安","想你","抱抱"],
};
const ALL = []; for(const c in WORDS) for(const w of WORDS[c]) ALL.push([w,c]);
const COLORS = ["#3b2a24","#e5486a","#f39a3d","#f6c945","#5cb87a","#4a90d9","#9b6fd6","#f7a7b8","#8a5a33"];
const SIZES = [5, 11, 22];
const BG = "#fffaf2", W = 1000, H = 750, TIME = 100;
const norm = s => String(s||"").replace(/[\s，。！？!?,.~～、「」"'：:；;]/g,"").toLowerCase();

App.registerGame({
  id: "draw",
  name: "你畫我猜",
  desc: "一個畫一個猜，答對一起拿小魚乾",
  icon: () => Pix.sprite("calico","surprised"),
  mount(el, ctx){
    const { sprite, esc, SFX } = ctx;
    let s = null, drawn = 0, drawnKey = "", tool = { c:0, w:1, er:false }, cur = null, kb = null, guessText = "", tick = null, lastGuessN = 0, lastPhase = null, myPend = [];
    const me = () => ctx.me.uid, other = () => ctx.players().find(i=>i!==me());
    const $ = q => el.querySelector(q);
    el.innerHTML = `<div class="box dr" id="dr"></div>`;
    const box = $("#dr");

    function pickWords(used){
      const pool = ALL.filter(x=>!(used||[]).includes(x[0])), out = [];
      const cats = Object.keys(WORDS).sort(()=>Math.random()-.5);
      for(const c of cats){ const opts = pool.filter(x=>x[1]===c); if(opts.length) out.push(opts[Math.floor(Math.random()*opts.length)]); if(out.length===3) break; }
      return out;
    }
    const fresh = (drawer, prev) => ({ round:(prev&&prev.round||0)+1, drawer, phase:"pick", opts:pickWords(prev&&prev.used), word:null, cat:null, until:0, started:0, strokes:[], guesses:[], hint:0,
      solved:(prev&&prev.solved)||0, streak:(prev&&prev.streak)||0, best:(prev&&prev.best)||0, fast:(prev&&prev.fast)||0, used:(prev&&prev.used)||[], hist:(prev&&prev.hist)||[], result:null });

    // ---------- canvas ----------
    let cv = null, g = null, scale = 1;
    function setupCanvas(){
      cv = $("#drCv"); if(!cv) return;
      const r = cv.getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio||1);
      cv.width = Math.round(r.width*dpr); cv.height = Math.round(r.width*.75*dpr); cv.style.height = (r.width*.75)+"px";
      g = cv.getContext("2d"); scale = cv.width / W; g.lineCap = "round"; g.lineJoin = "round";
      redraw();
    }
    function paintStroke(st, upto){
      const p = st.p, n = Math.min(upto==null ? p.length/2 : upto, p.length/2); if(!n) return;
      g.strokeStyle = st.e ? BG : COLORS[st.c]; g.fillStyle = g.strokeStyle; g.lineWidth = SIZES[st.w]*scale*(st.e?1.8:1);
      if(n===1){ g.beginPath(); g.arc(p[0]*scale, p[1]*scale, g.lineWidth/2, 0, Math.PI*2); g.fill(); return; }
      g.beginPath(); g.moveTo(p[0]*scale, p[1]*scale);
      for(let i=1;i<n-1;i++){ const x=p[i*2]*scale, y=p[i*2+1]*scale, nx=p[i*2+2]*scale, ny=p[i*2+3]*scale; g.quadraticCurveTo(x, y, (x+nx)/2, (y+ny)/2); }
      g.lineTo(p[(n-1)*2]*scale, p[(n-1)*2+1]*scale); g.stroke();
    }
    function redraw(){
      if(!g) return; g.fillStyle = BG; g.fillRect(0,0,cv.width,cv.height);
      const all = (s && s.strokes || []).concat(myPend); all.forEach(st=>paintStroke(st)); if(cur) paintStroke(cur);
      drawn = s ? s.strokes.length : 0; drawnKey = strokeKey();
    }
    const strokeKey = () => s ? s.round+":"+(s.strokes[0] ? s.strokes[0].p.slice(0,4).join(",") : "") : "";
    function animateNew(){
      if(!g || !s) return;
      if(s.strokes.length < drawn || strokeKey()!==drawnKey){ redraw(); return; }
      const news = s.strokes.slice(drawn); drawn = s.strokes.length;
      (async()=>{ for(const st of news){ const n = st.p.length/2, steps = Math.min(24, Math.max(4, Math.round(n/2)));
        for(let k=1;k<=steps;k++){ await new Promise(r=>requestAnimationFrame(r)); paintStroke(st, Math.ceil(n*k/steps)); } } })();
    }
    function pos(e){ const r = cv.getBoundingClientRect(); return [Math.round((e.clientX-r.left)/r.width*W), Math.round((e.clientY-r.top)/r.height*H)]; }
    function bindDraw(){
      cv.addEventListener("pointerdown", e=>{ if(!isDrawer() || s.phase!=="draw") return; e.preventDefault(); cv.setPointerCapture(e.pointerId);
        const [x,y] = pos(e); cur = { c:tool.c, w:tool.w, e:tool.er?1:0, p:[x,y] }; paintStroke(cur); });
      cv.addEventListener("pointermove", e=>{ if(!cur) return; const [x,y] = pos(e), p = cur.p, lx = p[p.length-2], ly = p[p.length-1];
        if(Math.hypot(x-lx, y-ly) < 6) return; p.push(Math.max(0,Math.min(W,x)), Math.max(0,Math.min(H,y)));
        const n = p.length/2; g.strokeStyle = cur.e?BG:COLORS[cur.c]; g.lineWidth = SIZES[cur.w]*scale*(cur.e?1.8:1);
        g.beginPath(); g.moveTo(p[(n-2)*2]*scale, p[(n-2)*2+1]*scale); g.lineTo(p[(n-1)*2]*scale, p[(n-1)*2+1]*scale); g.stroke(); });
      const end = async ()=>{ if(!cur) return; const st = cur; cur = null; if(st.p.length > 400) st.p = st.p.slice(0, 400);
        myPend.push(st);
        const ns = await ctx.update("draw", x=>{ if(!x || x.phase!=="draw" || x.drawer!==me()) return undefined; x.strokes.push(st); if(x.strokes.length>160) x.strokes = x.strokes.slice(-160); return x; });
        myPend = myPend.filter(q=>q!==st); if(!ns) redraw(); };
      cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
      cv.style.touchAction = "none";
    }
    const isDrawer = () => s && s.drawer===me();
    const left = () => s ? Math.max(0, Math.ceil((s.until - Date.now())/1000)) : 0;
    const hintText = () => { if(!s || !s.word) return ""; const a=[...s.word]; return a.map((ch,i)=>i<s.hint?ch:"□").join(" "); };

    // ---------- views ----------
    function render(){
      const p = ctx.partner();
      if(!p){ box.innerHTML = `<div class="drWait">${sprite("white","sleep",{soft:true})}<p>等另一半加入小窩才能玩喔</p></div>`; return; }
      if(!s){ box.innerHTML = `<div class="drWait">${sprite(ctx.me.cat,"happy")}<p>準備中…</p></div>`; return; }
      const stats = `<div class="drStats">🤝 一起答對 <b>${s.solved||0}</b> 題・連續 <b>${s.streak||0}</b>・最快 <b>${s.fast?s.fast+" 秒":"—"}</b></div>`;
      if(s.phase==="pick"){
        if(isDrawer()){
          box.innerHTML = `<div class="drHd"><b>第 ${s.round} 回合・換你畫！</b></div><p class="drSub">選一個你想畫的題目（${esc(p.name)} 看不到喔）</p>
            <div class="drPick">${s.opts.map((o,i)=>`<button data-o="${i}"><i>${esc(o[1])}</i><b>${esc(o[0])}</b></button>`).join("")}</div>
            <button class="btn sub" id="drRe" style="width:100%;margin-top:8px">🔄 換一組題目</button>
            ${ctx.isOnline(p.user_id)?"":`<p class="drWarn">${esc(p.name)} 現在不在線上，選好題目後會通知 ta 來猜</p>`}${stats}`;
          box.querySelectorAll("[data-o]").forEach(b=>b.addEventListener("click", ()=>start(+b.dataset.o)));
          $("#drRe").addEventListener("click", ()=>{ SFX.tap(); ctx.update("draw", x=>{ if(!x || x.phase!=="pick" || x.drawer!==me()) return undefined; x.opts = pickWords(x.used); return x; }); });
        } else {
          box.innerHTML = `<div class="drWait">${sprite(p.cat,"normal")}<p><b>${esc(p.name)}</b> 正在選題目…</p><p class="drSub">等等你要負責猜 🤔</p></div>${stats}`;
        }
        return;
      }
      if(s.phase==="draw"){
        const drawer = isDrawer();
        if(!$("#drCv") || box.dataset.mode !== (drawer?"d":"g")+s.round){
          box.dataset.mode = (drawer?"d":"g")+s.round;
          box.innerHTML = `<div class="drTop"><span class="drWord" id="drWord"></span><span class="drTime" id="drTime"></span></div>
            <canvas class="drCv" id="drCv"></canvas>
            ${drawer ? `<div class="drTools" id="drTools">${COLORS.map((c,i)=>`<button data-c="${i}" style="background:${c}"></button>`).join("")}<button data-er class="er">🧽</button></div>
              <div class="drTools2"><span class="drSz">${SIZES.map((z,i)=>`<button data-w="${i}"><i style="width:${6+i*6}px;height:${6+i*6}px"></i></button>`).join("")}</span>
              <button class="btn sub" id="drUndo">↩ 復原</button><button class="btn sub" id="drClr">🗑 清空</button><button class="btn sub" id="drHint">💡 提示</button></div>
              <div class="drFeed" id="drFeed"></div><button class="btn sub drGive" id="drGive">😵 放棄這題</button>`
            : `<div class="drFeed" id="drFeed"></div>
              <div class="drGuess"><div class="drIn" id="drIn"><span class="ph">點這裡猜猜看…</span></div><button class="btn" id="drSend">猜！</button></div><div id="drKb" class="drKb"></div>`}`;
          setupCanvas(); bindDraw();
          if(drawer){
            box.querySelectorAll("[data-c]").forEach(b=>b.addEventListener("click", ()=>{ tool.c = +b.dataset.c; tool.er = false; SFX.tap(); toolsUi(); }));
            box.querySelector("[data-er]").addEventListener("click", ()=>{ tool.er = !tool.er; SFX.tap(); toolsUi(); });
            box.querySelectorAll("[data-w]").forEach(b=>b.addEventListener("click", ()=>{ tool.w = +b.dataset.w; SFX.tap(); toolsUi(); }));
            $("#drUndo").addEventListener("click", ()=>{ SFX.del(); ctx.update("draw", x=>{ if(!x || x.phase!=="draw" || !x.strokes.length) return undefined; x.strokes.pop(); return x; }); });
            $("#drClr").addEventListener("click", ()=>{ if(!s.strokes.length) return; SFX.del(); ctx.update("draw", x=>{ if(!x || x.phase!=="draw") return undefined; x.strokes = []; return x; }); });
            $("#drHint").addEventListener("click", ()=>{ if(s.hint >= [...s.word].length-1){ ctx.toast("不能再提示了，再說就是答案啦 😹"); return; } SFX.select(); ctx.update("draw", x=>{ if(!x || x.phase!=="draw") return undefined; x.hint = Math.min([...x.word].length-1, (x.hint||0)+1); return x; }); });
            $("#drGive").addEventListener("click", ()=>finish(false, "give"));
            toolsUi();
          } else {
            guessText = ""; paintGuess();
            $("#drIn").addEventListener("click", openKb);
            $("#drSend").addEventListener("click", sendGuess);
          }
        } else animateNew();
        $("#drWord").innerHTML = drawer ? `你要畫：<b>${esc(s.word)}</b>` : `提示：${esc(s.cat)}・<b class="hint">${esc(hintText())}</b>`;
        feed(); timeUi();
        return;
      }
      // done
      closeKb();
      const r = s.result || {}, secs = r.secs||0, pName = ctx.nameOf(s.drawer===me()?other():s.drawer);
      const head = r.ok ? `🎉 答對了！${r.secs?`只用了 ${secs} 秒`:""}` : r.why==="give" ? "😵 這題放棄了" : "⏰ 時間到了～";
      box.dataset.mode = "";
      box.innerHTML = `<div class="drRes ${r.ok?"ok":""}"><div class="drResHd">${head}</div><div class="drAns">答案是「<b>${esc(s.word||"")}</b>」</div>
        <canvas class="drCv" id="drCv"></canvas>
        <div class="drCats">${sprite(ctx.catOf(s.drawer), r.ok?"love":"cry")}<span>${r.ok?`${esc(ctx.nameOf(s.drawer))} 畫、${esc(ctx.nameOf(other()===s.drawer?me():other()))} 猜，默契滿分 💗${r.ok?"<br>我們的貓 +1 小魚乾 🐟":""}`:"沒關係，下一題一定可以！"}</span>${sprite(ctx.catOf(s.drawer===me()?other():me()), r.ok?"love":"cry")}</div>
        <button class="btn" id="drNext" style="width:100%">${s.drawer===me() ? `換 ${esc(pName)} 畫 ▶` : "換我畫 ▶"}</button></div>${stats}
        ${(s.hist||[]).length ? `<div class="drHist"><b>最近的題目</b>${s.hist.slice(-6).reverse().map(h=>`<span class="${h.ok?"ok":""}">${h.ok?"✔":"✘"} ${esc(h.w)}</span>`).join("")}</div>` : ""}`;
      setupCanvas();
      $("#drNext").addEventListener("click", next);
    }
    function toolsUi(){
      box.querySelectorAll("[data-c]").forEach(b=>b.classList.toggle("on", !tool.er && +b.dataset.c===tool.c));
      const er = box.querySelector("[data-er]"); if(er) er.classList.toggle("on", tool.er);
      box.querySelectorAll("[data-w]").forEach(b=>b.classList.toggle("on", +b.dataset.w===tool.w));
    }
    function timeUi(){ const t = $("#drTime"); if(!t || !s || s.phase!=="draw") return; const l = left(); t.textContent = `⏱ ${l}`; t.classList.toggle("low", l<=15); }
    function feed(){
      const f = $("#drFeed"); if(!f || !s) return;
      const list = (s.guesses||[]).slice(-6);
      f.innerHTML = list.length ? list.map(q=>`<span class="${q.close?"close":""}">${esc(q.by===me()?"你":ctx.nameOf(q.by))}：${esc(q.t)} ${q.close?"🔥 很接近！":"❌"}</span>`).join("") : `<span class="none">${isDrawer()?"猜的答案會出現在這裡":"猜錯也沒關係，多猜幾次！"}</span>`;
      f.scrollLeft = f.scrollWidth;
      const n = (s.guesses||[]).length;
      if(n > lastGuessN && lastGuessN){ const q = s.guesses[n-1]; if(q && q.by!==me()){ q.close ? SFX.select() : SFX.miss(); } }
      lastGuessN = n;
    }
    function paintGuess(){ const i = $("#drIn"); if(i) i.innerHTML = guessText ? esc(guessText) : `<span class="ph">點這裡猜猜看…</span>`; }
    function openKb(){
      const host = $("#drKb"); if(!host || kb) return;
      kb = ctx.keyboard(host, { enterLabel:"猜！", commit: t=>{ guessText = (guessText+t).slice(0,20); paintGuess(); },
        backspace: ()=>{ const a=[...guessText]; a.pop(); guessText=a.join(""); paintGuess(); }, send: ()=>sendGuess(), hide: closeKb });
      document.body.classList.add("drkb"); host.scrollIntoView({block:"end"});
    }
    function closeKb(){ const host = $("#drKb"); if(host) host.innerHTML = ""; kb = null; document.body.classList.remove("drkb"); }
    async function sendGuess(){
      if(kb && kb.composing()) kb.flush();
      const t = guessText.trim(); if(!t || !s || s.phase!=="draw") return;
      guessText = ""; paintGuess(); SFX.send();
      let won = false;
      await ctx.update("draw", x=>{ if(!x || x.phase!=="draw") return undefined;
        const a = norm(t), w = norm(x.word); won = !!a && (a===w || a.includes(w));
        const close = !won && [...w].filter(ch=>a.includes(ch)).length >= Math.max(1, Math.ceil(w.length/2));
        x.guesses = (x.guesses||[]).concat([{ t, by:me(), at:Date.now(), close }]).slice(-30);
        if(won) settle(x, true); return x; });
      if(won) celebrate();
    }
    function settle(x, ok, why){
      const secs = Math.max(1, Math.round((Date.now() - x.started)/1000));
      x.phase = "done"; x.result = { ok, secs, why: why||null };
      if(ok){ x.solved = (x.solved||0)+1; x.streak = (x.streak||0)+1; x.best = Math.max(x.best||0, x.streak); if(!x.fast || secs < x.fast) x.fast = secs; }
      else x.streak = 0;
      x.hist = (x.hist||[]).concat([{ w:x.word, ok, by:x.drawer, secs }]).slice(-20);
    }
    function celebrate(){ SFX.match(); ctx.burst(); }
    async function finish(ok, why){ await ctx.update("draw", x=>{ if(!x || x.phase!=="draw") return undefined; settle(x, ok, why); return x; }); }
    async function start(i){
      SFX.select();
      const ns = await ctx.update("draw", x=>{ if(!x || x.phase!=="pick" || x.drawer!==me()) return undefined; const o = x.opts[i]; if(!o) return undefined;
        x.word = o[0]; x.cat = o[1]; x.phase = "draw"; x.started = Date.now(); x.until = Date.now() + TIME*1000; x.strokes = []; x.guesses = []; x.hint = 0;
        x.used = (x.used||[]).concat([o[0]]).slice(-80); return x; });
      if(ns) ctx.notifyPartner(`${ctx.me.name} 在「你畫我猜」畫好題目了，快來猜！🎨`);
    }
    async function next(){
      SFX.next();
      const nextDrawer = s.drawer===me() ? other() : me();
      await ctx.update("draw", x=>{ if(!x || x.phase!=="done") return undefined; return fresh(nextDrawer, x); });
    }

    function onState(st){
      const prevPhase = s && s.phase, prevRound = s && s.round;
      s = st;
      if(s && prevPhase==="draw" && s.phase==="done" && s.round===prevRound){ if(s.result && s.result.ok) celebrate(); else SFX.miss(); }
      if(s && s.phase==="draw" && prevPhase!=="draw"){ drawn = 0; drawnKey = ""; lastGuessN = (s.guesses||[]).length; if(!isDrawer()) SFX.next(); }
      render();
      if(s && s.phase==="done" && g) redraw();
    }
    this._u = ctx.onState("draw", onState);
    tick = setInterval(()=>{ if(!s || s.phase!=="draw") return; timeUi(); if(Date.now() > s.until + 600) finish(false, "time"); }, 500);
    const onResize = () => { if(cv) setupCanvas(); };
    window.addEventListener("resize", onResize);
    this._cleanup = () => { document.body.classList.remove("drkb"); clearInterval(tick); window.removeEventListener("resize", onResize); };
    (async()=>{
      const I = ctx.players();
      let c = await ctx.getState("draw");
      if(!c && I.length>=2){ await ctx.update("draw", x=> x ? undefined : fresh(me(), null)); c = await ctx.getState("draw"); }
      s = c ? JSON.parse(JSON.stringify(c.state)) : null;
      if(s && s.phase==="draw") lastGuessN = (s.guesses||[]).length;
      render();
    })();
  },
  unmount(){ if(this._u) this._u(); if(this._cleanup) this._cleanup(); },
});
})();
