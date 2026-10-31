// 遊戲：喵喵默契大考驗
(function(){
const Q = [
 ["t","{T} 最理想的週末是？",["睡到自然醒","出門走走","在家追劇","找朋友聚聚"]],
 ["t","{T} 比較喜歡哪種約會？",["看電影","吃好吃的","去大自然","在家煮飯"]],
 ["t","{T} 心情不好時最想要？",["抱抱","吃甜的","一個人靜靜","出去散心"]],
 ["t","{T} 最愛的飲料是？",["手搖飲","咖啡","茶","汽水"]],
 ["t","{T} 比較怕哪個？",["蟑螂","鬼故事","打針","沒網路"]],
 ["t","{T} 是早起鳥還是夜貓子？",["超級早起鳥","偏早睡","偏晚睡","重度夜貓子"]],
 ["t","如果放三天假，{T} 最想？",["出國","國內小旅行","宅在家","去吃遍美食"]],
 ["t","{T} 吃火鍋必點？",["肉肉","海鮮","蔬菜菇菇","火鍋料"]],
 ["t","{T} 最常用的表情符號是？",["😂","🥺","❤️","👍"]],
 ["t","{T} 最想養的寵物是？",["狗狗","貓咪","兔兔","不想養"]],
 ["t","收到禮物，{T} 最喜歡哪種？",["實用的","手作的","驚喜體驗","好吃的"]],
 ["t","{T} 覺得最浪漫的事是？",["牽手散步","一起看夕陽","收到手寫卡片","半夜一起吃宵夜"]],
 ["t","{T} 最喜歡的季節？",["春天","夏天","秋天","冬天"]],
 ["t","{T} 去夜市第一個買？",["雞排","臭豆腐","珍奶","烤玉米"]],
 ["t","{T} 如果是貓，會是哪種？",["愛撒嬌的橘貓","高冷的黑貓","黏人的白貓","調皮的三花"]],
 ["t","{T} 比較像貓的哪個習慣？",["一直睡","要人摸摸","突然暴衝","盯著窗外發呆"]],
 ["t","如果 {T} 是貓，最愛的玩具是？",["逗貓棒","紙箱","雷射筆","毛線球"]],
 ["t","如果有超能力，{T} 想要？",["瞬間移動","讀心術","隱形","時間暫停"]],
 ["t","{T} 被稱讚時會？",["害羞","超開心","假裝淡定","反過來稱讚"]],
 ["t","{T} 最喜歡哪種天氣？",["大晴天","下雨天","陰天涼涼","下雪天"]],
 ["t","{T} 的手機桌布比較可能是？",["我們的合照","寵物/動物","風景","預設桌布"]],
 ["t","{T} 理想中的家在？",["熱鬧城市","安靜郊區","海邊","山上"]],
 ["t","{T} 最拿手的是？",["做菜","逗人笑","收納整理","找好吃的"]],
 ["t","早餐 {T} 會選？",["蛋餅","三明治","飯糰","不吃早餐"]],
 ["t","{T} 最想跟對方一起學？",["做甜點","跳舞","潛水/衝浪","一個新語言"]],
 ["t","看電影 {T} 最愛哪類？",["喜劇","愛情","恐怖","動作/科幻"]],
 ["t","{T} 最喜歡被怎麼叫？",["暱稱","全名","寶貝類的","隨便都好"]],
 ["u","我們下次約會最該去？",["吃一頓大餐","去看海","逛街","在家做料理"]],
 ["u","中了一百萬，我們先？",["去旅行","存起來","吃好料","買想要很久的東西"]],
 ["u","我們最像哪一對？",["吵吵鬧鬧的好朋友","甜甜的熱戀","老夫老妻","一起冒險的夥伴"]],
 ["u","我們一起最開心的時刻通常是？",["一起吃東西","一起出去玩","一起耍廢","聊天聊到很晚"]],
 ["u","如果一起開店，要開？",["咖啡廳","甜點店","民宿","寵物店"]],
 ["u","一起旅行最想去？",["日本","歐洲","海島","台灣環島"]],
 ["u","下雨天我們最適合？",["窩在家看電影","去咖啡廳","雨中散步","睡一整天"]],
 ["u","我們的紀念日應該怎麼過？",["吃浪漫晚餐","小旅行","互送禮物","重溫第一次約會"]],
 ["u","如果我們是一道菜？",["甜甜的蛋糕","辣辣的麻辣鍋","暖暖的湯","什麼都有的便當"]],
 ["u","我們最常一起做的事？",["吃","看劇/影片","聊天","打電動"]],
 ["u","一起去遊樂園，第一個玩？",["雲霄飛車","旋轉木馬","鬼屋","摩天輪"]],
 ["u","我們之中誰比較會撒嬌？",["我","你","一樣多","都不會"]],
 ["u","我們老了以後最想？",["住在海邊","環遊世界","養一堆貓狗","開一間小店"]],
 ["u","如果我們一起養貓，要取什麼風格的名字？",["食物名（布丁、麻糬）","人名（阿明、小美）","可愛疊字（咪咪、啾啾）","霸氣名（大王、將軍）"]],
 ["u","我們兩隻貓窩在一起時最常？",["一起睡覺","互相理毛","搶同一個位置","一起看窗外"]],
 ["u","我們家的貓咖啡廳要叫？",["喵喵小屋","貓掌咖啡","懶貓食堂","兩隻貓的家"]],
];
function shuffle(n, seed){ const a=[...Array(n).keys()]; let s=seed>>>0||1; const rnd=()=>(s=(s*1664525+1013904223)>>>0)/4294967296; for(let i=n-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
const INIT = seed => ({ seed, round:0, hearts:0, hist:[], ans:{} });

App.registerGame({
  id: "moqi",
  name: "默契大考驗",
  desc: "一起答題，收集小魚乾",
  icon: () => Pix.sprite("orange","love"),
  mount(el, ctx){
    const { sprite, icon, esc, SFX } = ctx;
    let s = null, lastRound = null, revealed = -1, lastLv = null, notified = -1;
    el.innerHTML = `<div class="box card" id="mq"></div>`;
    const box = el.querySelector("#mq");

    function q(){ const order=shuffle(Q.length, s.seed); const [type,text,opts]=Q[order[s.round%Q.length]]; const ids=ctx.players(); return {type,text,opts,target: ids[s.round%2] || ids[0]}; }
    function ansOf(uid){ const a = s && s.ans && s.ans[uid]; return a && a.r===s.round ? a.c : -1; }

    function draw(){
      const p = ctx.partner();
      if(!p){ box.innerHTML = `<div class="preview">${sprite(ctx.me.cat,"loaf")}</div><div style="font-size:18px">等另一半加入小窩…</div><div class="muted" style="margin-top:6px;font-size:14px">到「設定」把邀請碼傳給 ta</div>`; return; }
      if(!s){ box.innerHTML = `<div class="muted">準備題目中…</div>`; return; }
      const Qn = q(), me = ctx.me.uid, pid = p.user_id;
      const mi = ansOf(me), ti = ansOf(pid), done = mi>=0 && ti>=0, match = done && mi===ti;
      const tName = ctx.nameOf(Qn.target);
      const tag = Qn.type==="t" ? `<span class="tag" style="display:inline-block;font-size:13px;padding:2px 10px;border:2px solid var(--line);background:var(--pinkL)">關於 ${esc(tName)}</span>` : `<span style="display:inline-block;font-size:13px;padding:2px 10px;border:2px solid var(--line);background:var(--mintL)">關於我們</span>`;
      const qtext = Qn.type==="t" ? Qn.text.replace("{T}", tName) : Qn.text;
      const sub = Qn.type==="t" ? (Qn.target===me ? "照實回答你自己的答案" : `猜猜看 ${tName} 會選哪個？`) : "選你心中的答案，看看是不是想到一起！";
      let html = `${tag}<div style="font-size:20px;margin:12px 0 4px;line-height:1.5">${esc(qtext)}</div><div class="muted" style="font-size:13px;margin-bottom:14px">${esc(sub)}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">` +
        Qn.opts.map((o,i)=>{
          const bg = done && i===mi && i===ti ? "var(--mintL)" : i===mi ? "var(--pinkL)" : "#fff";
          const badges = done ? (i===mi?`<span style="position:absolute;top:-14px;right:-8px;width:30px;height:30px">${sprite(ctx.me.cat,"happy")}</span>`:"") + (i===ti?`<span style="position:absolute;top:-14px;left:-8px;width:30px;height:30px">${sprite(p.cat,"happy")}</span>`:"") : "";
          return `<button data-i="${i}" ${done?"disabled":""} style="position:relative;font-size:16px;padding:14px 6px;min-height:62px;background:${bg};border:3px solid var(--line);box-shadow:3px 3px 0 var(--shadow)">${esc(o)}${badges}</button>`;
        }).join("") + `</div>`;
      if(done){
        let tip;
        if(match) tip = "喵！完全一樣～小魚乾 +1";
        else tip = "這題不一樣！<div class='muted' style='font-size:13px;margin-top:4px'>" + (Qn.type==="t" ? (Qn.target===me ? `跟 ${esc(p.name)} 說說為什麼是「${esc(Qn.opts[mi])}」吧` : `原來是「${esc(Qn.opts[ti])}」！又多認識 ${esc(p.name)} 一點了`) : "不一樣也很可愛喵～聊聊彼此的想法吧") + "</div>";
        html += `<div style="display:flex;justify-content:center;gap:4px;margin-top:12px">${sprite(ctx.me.cat, match?"wave":"surprised").replace("<svg ",'<svg width="90" height="90" ')}${sprite(p.cat, match?"love":"surprised").replace("<svg ",'<svg width="90" height="90" ')}</div>
          <div style="font-size:18px;color:${match?"#3f9c76":"#8a72d8"}">${tip}</div><button class="btn" id="mqNext" style="margin-top:14px">下一題 ▶</button>`;
        if(revealed!==s.round){ revealed=s.round; if(match){ SFX.match(); ctx.burst(); } else SFX.miss(); }
      } else {
        const here = ctx.isOnline(pid);
        const w = mi>=0 && ti<0 ? `已選好！等 ${esc(p.name)} 作答中…（還可以改）${here?"":"<br>ta 不在線上，已經用通知叫 ta 了 🔔"}`
          : mi<0 && ti>=0 ? `${esc(p.name)} 已經選好了，換你囉喵！` : "兩個人都選好就會公布答案";
        html += `<div class="muted" style="margin-top:14px;font-size:14px">${w}</div><div style="margin-top:12px"><button class="btn sub" id="mqSkip">換一題</button></div>`;
      }
      box.innerHTML = html;
      box.querySelectorAll("[data-i]").forEach(b=>b.addEventListener("click", ()=>answer(+b.dataset.i)));
      const nx = box.querySelector("#mqNext"); if(nx) nx.addEventListener("click", ()=>next(false));
      const sk = box.querySelector("#mqSkip"); if(sk) sk.addEventListener("click", ()=>next(true));
    }

    async function answer(c){
      SFX.select();
      const r = s.round;
      const ns = await ctx.update("moqi", st=>{ st = st || INIT(Date.now()%100000); if(st.round!==r) return undefined; st.ans = st.ans||{}; st.ans[ctx.me.uid] = {r, c}; return st; });
      if(ns){ s = ns; draw(); }
      const p = ctx.partner();
      if(p && !ctx.isOnline(p.user_id) && notified!==r && ansOf(p.user_id)<0){ notified=r; ctx.notifyPartner(`${ctx.me.name} 在「默契大考驗」答好了，換你囉！`); }
    }
    async function next(skip){
      const r = s.round, me = ctx.me.uid, p = ctx.partner();
      const ns = await ctx.update("moqi", st=>{
        if(!st || st.round!==r) return undefined;
        if(!skip && p){ const a=st.ans[me], b=st.ans[p.user_id]; if(a&&b&&a.r===r&&b.r===r){ const m = a.c===b.c?1:0; st.hist=(st.hist||[]).slice(-29); st.hist.push({r,m}); st.hearts=(st.hearts||0)+m; } }
        st.round = r+1; st.ans = {}; return st;
      });
      if(ns){ s = ns; draw(); }
    }
    function onNew(st){
      if(!st) return;
      if(lastRound!==null && st.round!==lastRound) SFX.next();
      const lv = ctx.lvInfo(st.hearts||0).name; if(lastLv!==null && lv!==lastLv){ setTimeout(()=>{ SFX.level(); ctx.toast(`${sprite(ctx.me.cat,"love")} 升級了！${esc(lv)}`, 4000); }, 700); }
      lastLv = lv; lastRound = st.round; s = st; draw();
    }
    this._unsub = ctx.onState("moqi", onNew);
    this._unp = ctx.onPresence(draw);
    (async()=>{
      let cur = await ctx.getState("moqi");
      if(!cur && ctx.partner()){ const seed = Math.floor(Math.random()*1e9); await ctx.update("moqi", st=> st ? undefined : INIT(seed)); cur = await ctx.getState("moqi"); }
      if(cur){ lastRound = cur.state.round; lastLv = ctx.lvInfo(cur.state.hearts||0).name; s = JSON.parse(JSON.stringify(cur.state)); }
      draw();
    })();
  },
  unmount(){ if(this._unsub) this._unsub(); if(this._unp) this._unp(); },
});
})();
