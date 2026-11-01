// 遊戲：你畫我猜（合作）。一個人選題目畫畫，另一個人用注音鍵盤猜；答對兩個人一起得分，還會幫我們的貓賺小魚乾。
// 同步方式：畫完一筆（手指離開）就把這一筆寫進 game_state，對方那邊會把這一筆「畫出來」的動畫重播。
(function(){
let WORDS_B;
const WORDS = {
  "動物": ["貓咪","小狗","兔子","熊貓","長頸鹿","大象","企鵝","烏龜","章魚","金魚","老虎","獅子","猴子","蛇","恐龍","刺蝟","青蛙","蝴蝶","蜜蜂","螃蟹","鯨魚","鯊魚","小雞","豬","牛","馬","羊","老鼠","貓頭鷹","天鵝","孔雀","海豚","蝸牛","無尾熊","袋鼠","斑馬","鱷魚","狐狸","松鼠","水母","河馬","犀牛","駱駝","北極熊","浣熊","倉鼠","鸚鵡","火烈鳥","啄木鳥","蜘蛛","螞蟻","瓢蟲","蜻蜓","蚊子","毛毛蟲","海星","海馬","龍蝦","蝦子","魷魚","獨角獸","龍","鴨子","鵝","公雞","母雞","乳牛","狼","熊","鹿","蝙蝠","鴿子","麻雀","老鷹","河豚","烏鴉","柴犬","臘腸狗","哈士奇","黑貓","樹懶","水獺","羊駝","海獺","鯉魚","變色龍","蚯蚓","螢火蟲","蠍子"],
  "食物": ["蛋糕","披薩","漢堡","薯條","壽司","拉麵","珍珠奶茶","冰淇淋","西瓜","香蕉","蘋果","草莓","葡萄","鳳梨","荷包蛋","飯糰","水餃","熱狗","甜甜圈","棒棒糖","巧克力","吐司","咖啡","雞腿","玉米","胡蘿蔔","布丁","餅乾","爆米花","火鍋","小籠包","粽子","月餅","檸檬","櫻桃","鬆餅","蛋塔","泡麵","便當","烤肉","臭豆腐","滷肉飯","牛肉麵","雞排","地瓜","芒果","奇異果","桃子","酪梨","椰子","茄子","番茄","南瓜","香菇","花椰菜","洋蔥","辣椒","黃瓜","豆漿","油條","蛋餅","包子","饅頭","湯圓","刨冰","豆花","鹹酥雞","蚵仔煎","烤香腸","關東煮","三明治","義大利麵","牛排","炸蝦","生魚片","章魚燒","鯛魚燒","馬卡龍","杯子蛋糕","生日蛋糕","果凍","可樂","牛奶","啤酒","紅酒","柳橙汁","茶","蜂蜜","起司","奶油","麵包","可頌","貝果","雞蛋","炒飯","咖哩飯","涼麵","鍋貼","春捲","烤地瓜","棉花糖","口香糖","洋芋片","糖葫蘆","冰棒","優格"],
  "東西": ["手機","雨傘","眼鏡","帽子","襪子","鞋子","牙刷","剪刀","鉛筆","吹風機","電視","時鐘","鑰匙","氣球","禮物","蠟燭","風箏","吉他","鋼琴","相機","耳機","枕頭","沙發","馬桶","檯燈","書包","戒指","口紅","鏡子","梳子","電腦","滑板","腳踏車","汽車","飛機","火箭","帆船","火車","熱氣球","雪人","牙膏","毛巾","衛生紙","垃圾桶","掃把","拖把","洗衣機","冰箱","微波爐","電風扇","冷氣","電燈泡","插頭","電池","遙控器","鬧鐘","手錶","錢包","背包","行李箱","筆記本","書","橡皮擦","尺","釘書機","膠帶","信封","郵票","紙飛機","望遠鏡","放大鏡","指南針","地圖","地球儀","骰子","撲克牌","拼圖","積木","泰迪熊","娃娃","溜溜球","陀螺","彈弓","弓箭","寶劍","盾牌","皇冠","魔杖","掃帚","喇叭","麥克風","小提琴","鼓","口琴","鈴鐺","杯子","盤子","碗","筷子","湯匙","叉子","刀子","鍋子","平底鍋","茶壺","奶瓶","圍巾","手套","領帶","裙子","褲子","外套","T恤","洋裝","比基尼","拖鞋","高跟鞋","雨鞋","口罩","項鍊","耳環","蝴蝶結","髮夾","指甲油","香水","化妝品","浴缸","蓮蓬頭","床","衣櫃","書桌","椅子","窗戶","門","樓梯","梯子","帳篷","睡袋","手電筒","打火機","摩托車","公車","計程車","救護車","消防車","警車","卡車","挖土機","直升機","潛水艇","太空船","飛碟","機器人","紅綠燈","路燈","郵筒","信箱","安全帽","輪椅","嬰兒車","購物車","沙漏","天秤","磁鐵","鎖","鐵鎚","螺絲起子","鋸子","水桶","澆水器","花盆","仙人掌","向日葵","玫瑰","鬱金香","四葉草","聖誕襪"],
  "地方": ["海邊","山","公園","學校","醫院","便利商店","摩天輪","游泳池","電影院","圖書館","廚房","浴室","沙漠","島","瀑布","城堡","月亮","太陽","彩虹","星星","火山","森林","金字塔","燈塔","溜滑梯","夜市","動物園","遊樂園","雲霄飛車","旋轉木馬","鬼屋","水族館","博物館","機場","火車站","捷運","加油站","停車場","超市","百貨公司","咖啡廳","餐廳","麵包店","花店","寵物店","理髮店","健身房","教堂","寺廟","鳥居","101大樓","艾菲爾鐵塔","自由女神","長城","橋","隧道","碼頭","農場","果園","稻田","菜園","溫泉","滑雪場","籃球場","足球場","操場","教室","宿舍","臥室","客廳","陽台","屋頂","地下室","監獄","銀行","警察局","消防局","郵局","洞穴","冰山","草原","河流","湖","池塘","雪山","叢林","太空","地球","銀河","外星球"],
  "動作": ["睡覺","跑步","游泳","跳舞","唱歌","釣魚","拍照","打噴嚏","刷牙","洗澡","放風箏","看電影","吃飯","擁抱","親親","牽手","打電動","騎車","划船","爬山","滑雪","打哈欠","生氣","哭哭","大笑","走路","跳繩","打籃球","踢足球","打棒球","打網球","打羽毛球","桌球","保齡球","高爾夫","衝浪","潛水","溜冰","拳擊","瑜珈","舉重","射箭","跳水","盪鞦韆","翻跟斗","倒立","伏地挺身","仰臥起坐","喝水","煮飯","洗碗","洗衣服","掃地","拖地","澆花","遛狗","餵貓","化妝","刮鬍子","吹頭髮","剪頭髮","穿衣服","綁鞋帶","看書","寫字","畫畫","彈鋼琴","打鼓","拍手","揮手","比讚","比愛心","敬禮","鞠躬","握手","擊掌","眨眼","偷看","打電話","傳訊息","自拍","滑手機","購物","排隊","搭飛機","開車","等公車","搬家","打掃","搔癢","打呼","做夢","發呆","偷吃","吹蠟燭","許願","拆禮物","堆雪人","打雪仗","放煙火","抓娃娃","玩躲貓貓"],
  "職業": ["醫生","護士","警察","消防員","老師","廚師","甜點師","理髮師","司機","機長","空姐","太空人","科學家","畫家","歌手","演員","魔術師","小丑","外送員","郵差","農夫","漁夫","工程師","建築工人","牙醫","獸醫","律師","法官","記者","攝影師","偵探","海盜","忍者","武士","騎士","公主","王子","國王","女王","巫婆","天使","惡魔","吸血鬼","殭屍","鬼","超人","聖誕老人","美人魚","新娘","新郎","嬰兒","老爺爺","老奶奶"],
  "天氣": ["下雨","下雪","打雷","閃電","颱風","龍捲風","雲","太陽雨","冰雹","霧","大風","地震","流星","日出","日落","月蝕","極光","雪花","冰柱","落葉","楓葉","櫻花","春天","夏天","秋天","冬天"],
  "身體": ["眼睛","鼻子","嘴巴","耳朵","頭髮","眉毛","睫毛","牙齒","舌頭","脖子","肩膀","手","手指","指甲","腳","腳趾","膝蓋","肚子","肚臍","屁股","心臟","骨頭","肌肉","鬍子","酒窩","雀斑","雙下巴","黑眼圈","痘痘","光頭","馬尾","雙馬尾","捲髮","瀏海"],
  "我們": ["約會","求婚","情人節","聖誕樹","生日","煙火","愛心","婚禮","情侶裝","看夜景","野餐","露營","搭帳篷","寫信","撒嬌","吃醋","晚安","早安","想你","抱抱","牽手散步","一起看電影","一起煮飯","一起旅行","交換禮物","慶祝紀念日","吵架","和好","道歉","驚喜","告白","初吻","情書","玫瑰花束","婚戒","結婚蛋糕","蜜月","小窩","養貓","同居","視訊","遠距離","等你下班","接你下班","摸頭","公主抱","背你","餵你吃","一起睡覺","打卡","自拍合照","大頭貼","情侶對戒","抓娃娃機","夾到娃娃","看日出","看流星","許願池"],
};
WORDS_B = ["逛街","下午茶","自拍","交換禮物","唱KTV","敷面膜","睡衣派對","追劇","八卦","做指甲","拍貼","吃甜點","閨蜜旅行","穿同款","喝珍奶","聊通宵","化妝","夾娃娃","減肥","吃到飽","演唱會","應援棒","偶像","抱抱","生日派對","野餐","煙火","寫卡片","跳舞","瑜珈","逛夜市","自拍棒","美甲","購物袋","試衣間","咖啡廳","鬆餅","馬卡龍","拍照打卡","姊妹淘","秘密","說悄悄話","打電話聊天","一起哭","一起大笑","畢業典禮","合照","手搖飲","瀏海","捲髮棒"];
const ALL = []; for(const c in WORDS) for(const w of WORDS[c]) ALL.push([w,c]);
const ALL_B = ALL.filter(x=>x[1]!=="我們").concat(WORDS_B.map(w=>[w,"閨蜜"]));
const WORDS_M = ["打籃球","打電動","烤肉","喝啤酒","機車","健身","釣魚","露營","看球賽","吃宵夜","鹹酥雞","網咖","開黑","打撞球","保齡球","爬山","騎腳踏車","衝浪","賽車","擊掌","勾肩搭背","畢業旅行","當兵","拔河","打雪仗","抓娃娃","吃到飽","漢堡","拉麵","啞鈴","球鞋","棒球帽","遊戲手把","耳機麥克風","外送","熬夜","打呼","搞笑自拍","生日驚喜","夜衝","看日出","吃火鍋","便利商店","泡麵","背包旅行","足球","桌球","滑板","烤香腸","乾杯"];
const ALL_M = ALL.filter(x=>x[1]!=="我們").concat(WORDS_M.map(w=>[w,"兄弟"]));
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
      const pool = (ctx.mode()==="bestie"?ALL_B:ctx.mode()==="bro"?ALL_M:ALL).filter(x=>!(used||[]).includes(x[0])), out = [];
      const cats = [...new Set(pool.map(x=>x[1]))].sort(()=>Math.random()-.5);
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
      if(!p){ box.innerHTML = `<div class="drWait">${sprite("white","sleep",{soft:true})}<p>等${ctx.pw()}加入小窩才能玩喔</p></div>`; return; }
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
        x.used = (x.used||[]).concat([o[0]]).slice(-300); return x; });
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
