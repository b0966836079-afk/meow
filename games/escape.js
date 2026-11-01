// 遊戲：喵喵密室逃脫（兩個人看到不同的房間，要互相描述線索才解得開）
(function(){
const ART = {"chest": ["..OOOOOOOOOOOO..", ".OYYYYYYYYYYYYO.", "OYNNNNNNNNNNNNYO", "OYNNNNNNNNNNNNYO", "OOOOOOOGGOOOOOOO", "OYYYYYYGKGYYYYYO", "OYNNNNNGGNNNNNYO", "OYNNNNNNNNNNNNYO", "OYNNNNNNNNNNNNYO", "OYYYYYYYYYYYYYYO", "OOOOOOOOOOOOOOOO"], "wardrobe": ["OOOOOOOOOOOOOO", "ONNNNNNONNNNNO", "ONYYYYNONYYYYO", "ONYYYYNONYYYYO", "ONYYYYNONYYYYO", "ONYYYGNONGYYYO", "ONYYYYNONYYYYO", "ONYYYYNONYYYYO", "ONYYYYNONYYYYO", "ONYYYYNONYYYYO", "ONNNNNNONNNNNO", "OOOOOOOOOOOOOO", ".ON........NO.", ".OO........OO."], "painting": ["OOOOOOOOOOOOOO", "OYYYYYYYYYYYYO", "OYWWWWWWWWWWYO", "OYWKKWWBBWWGYO", "OYWKKWWBBWGGYO", "OYWWWWWWWWWWYO", "OYWWWWWWWWWWYO", "OYYYYYYYYYYYYO", "OOOOOOOOOOOOOO"], "oven": ["OOOOOOOOOOOOOO", "OWWWWWWWWWWWWO", "OWEWEWEWWOOOWO", "OWWWWWWWWOKOWO", "OOOOOOOOOOOOOO", "OWOOOOOOOOOOWO", "OWODDDDDDDDOWO", "OWODDKKKKDDOWO", "OWODDDDDDDDOWO", "OWOOOOOOOOOOWO", "OWWWWWWWWWWWWO", "OOOOOOOOOOOOOO"], "note": ["OOOOOOOOOO", "OWWWWWWWWO", "OWEEEEEEWO", "OWWWWWWWWO", "OWEEEEEWWO", "OWWWWWWWWO", "OWEEEEEEWO", "OWWWWWWWWO", "OWEEEWWWWO", "OOOOOOOOOO"], "panel": ["OOOOOOOOOOOO", "ODDDDDDDDDDO", "ODWODWODWODO", "ODOODOODOODO", "ODWODWODWODO", "ODOODOODOODO", "ODWODWODWODO", "ODDDDDDDDDDO", "ODDDDKKDDDDO", "OOOOOOOOOOOO"], "window": ["OOOOOOOOOOOOOO", "OWWWWWWWWWWWWO", "OWSSSOSSSOSSWO", "OWSSSOSSSOSSWO", "OWOOOOOOOOOOWO", "OWSSSOSSSOSSWO", "OWSSSOSSSOSSWO", "OWOOOOOOOOOOWO", "OWSSSOSSSOSSWO", "OWSSSOSSSOSSWO", "OWWWWWWWWWWWWO", "OOOOOOOOOOOOOO"], "drawer": ["OOOOOOOOOOOOOO", "ONNNNNNNNNNNNO", "OOOOOOOOOOOOOO", "ONNNNNOONNNNNO", "ONNNNNGGNNNNNO", "OOOOOOOOOOOOOO", "ONNNNNOONNNNNO", "ONNNNNOONNNNNO", "OOOOOOOOOOOOOO", ".ON........NO.", ".OO........OO."], "gate": ["O..O..O..O..O..O", "OO.OO.OO.OO.OO.O", "OWOOWOOWOOWOOWOO", "OWOOWOOWOOWOOWOO", "OOOOOOOOOOOOOOOO", "OWOOWOOWGGWOOWOO", "OWOOWOOWGGWOOWOO", "OOOOOOOOOOOOOOOO", "OWOOWOOWOOWOOWOO", "OWOOWOOWOOWOOWOO", "OOOOOOOOOOOOOOOO"], "pawmat": ["................", "..OO........OO..", ".OKKO......OKKO.", "..OO..OO....OO..", ".....OKKO.......", "......OO....OO..", "...........OKKO.", "..OO.........OO.", ".OKKO...OO......", "..OO...OKKO.....", "........OO......"], "shed": [".......OO.......", "......ORRO......", ".....ORRRRO.....", "....ORRRRRRO....", "...ORRRRRRRRO...", "..ORRRRRRRRRRO..", ".OOOOOOOOOOOOOO.", ".ONNNNNNNNNNNNO.", ".ONSSONNNNOOONO.", ".ONSSONNNNOKONO.", ".ONNNNNNNNOOONO.", ".ONNNNNNNNOOONO.", ".OOOOOOOOOOOOOO."], "telescope": ["..........OOO.", ".........OBBBO", "........OBBBO.", ".......OBBBO..", "......OBBBO...", ".....OBBBO....", "....OOOOO.....", ".....OO.......", "....O..O......", "...O....O.....", "..O......O....", ".O........O..."], "tube": ["....O.....", "...OKO....", "...OKO....", "..OOOOO...", "..ORRRO...", "..OWWWO...", "..ORRRO...", "..OWWWO...", "..ORRRO...", "..OOOOO...", "OOOOOOOOO."], "wishbox": ["...OOOOOO...", "..OKKKKKKO..", ".OOOOOOOOOO.", "OKKKKOOKKKKO", "OKKKKOYOKKKO", "OKKKKOOKKKKO", "OKKKKKKKKKKO", "OKKKKKKKKKKO", "OOOOOOOOOOOO"], "starbox": ["....OOOOOO....", "...OVVVVVVO...", "..OOOOOOOOOO..", ".OVVVVOOVVVVO.", ".OVVVVOYOVVVO.", ".OVYVVOOVVYVO.", ".OVVVVVVVVVVO.", ".OVVYVVVVYVVO.", ".OOOOOOOOOOOO."], "bookshelf": ["OOOOOOOOOOOOOO", "ONNNNNNNNNNNNO", "ONRRUUGGRUGRNO", "ONRRUUGGRUGRNO", "OOOOOOOOOOOOOO", "ONGURRGUURGGNO", "ONGURRGUURGGNO", "OOOOOOOOOOOOOO", "ONRUGGRUGURRNO", "ONRUGGRUGURRNO", "OOOOOOOOOOOOOO", "ON..........NO", "OO..........OO"], "flowerbed": ["..K...Y..U...K..", ".KKK.YYY.UUU.KKK", "..K...Y..U...K..", "..G...G..G...G..", "OOOOOOOOOOOOOOOO", "ONNNNNNNNNNNNNNO", "OOOOOOOOOOOOOOOO"], "door": ["OOOOOOOOOOOO", "ONNNNNNNNNNO", "ONOOOOOOOONO", "ONONNNNNNONO", "ONONNNNNNONO", "ONOOOOOOOONO", "ONNNNNNNNYNO", "ONOOOOOOOONO", "ONONNNNNNONO", "ONONNNNNNONO", "ONOOOOOOOONO", "ONNNNNNNNNNO", "OOOOOOOOOOOO"]};
const AP = { O:"#5a3b2e", Y:"#e9b872", N:"#c98b4f", G:"#ffcf4a", K:"#f0708d", W:"#ffffff", E:"#8a7a6a", D:"#3a3542", S:"#bfe3ff", R:"#e5486a", B:"#6fb7e8", U:"#6fb7e8", V:"#9b6fd6" };
const px = (rows, pal) => { const w = rows[0].length, h = rows.length; let r = "";
  rows.forEach((row,y)=>[...row].forEach((c,x)=>{ if(pal[c]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[c]}"/>`; }));
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${r}</svg>`; };
const art = id => ART[id] ? px(ART[id], AP) : (window.PetDeco ? window.PetDeco.art(id) : "");
const bgOf = id => (window.PetDeco && window.PetDeco.BY[id] && window.PetDeco.BY[id].bg) || "";
const COLORS = [ { id:"pink", n:"粉紅", c:"#f7a7b8" }, { id:"blue", n:"藍色", c:"#6fb7e8" }, { id:"mint", n:"綠色", c:"#7fd4a8" }, { id:"yellow", n:"黃色", c:"#ffd36b" }, { id:"purple", n:"紫色", c:"#b99be6" }, { id:"orange", n:"橘色", c:"#ffa45a" } ];
const SYMS = [ { id:"fish", n:"小魚" }, { id:"heart", n:"愛心" }, { id:"star", n:"星星" }, { id:"paw", n:"肉球" }, { id:"flower", n:"小花" }, { id:"moon", n:"月亮" } ];
const icon = id => Pix.icon(id);
function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const shuffle = (a, r) => { a = a.slice(); for(let i=a.length-1;i>0;i--){ const j = (r()*(i+1))|0; [a[i],a[j]] = [a[j],a[i]]; } return a; };
const ri = (r, a, b) => a + ((r()*(b-a+1))|0);

// ---------- the five rooms: who sees what, and the random answers ----------
// each room: two locks. Side "a" holds lock A whose clue is in side "b"'s room, and the other way round.
function makeRoom(n, seed){
  const r = rng(seed * 31 + n * 7919);
  if(n===0){
    const cols = shuffle(COLORS, r).slice(0,3), digs = cols.map(()=>ri(r,1,9)), order = shuffle([0,1,2], r);
    const cush = shuffle(COLORS, r).slice(0,4);
    return { name:"臥室與客廳",
      a: { name:"臥室", wall:"wpPink", floor:"fl0", lock:{ type:"dial", obj:"寶箱", labels: order.map(i=>({ dot: cols[i].c, n: cols[i].n })), answer: order.map(i=>digs[i]) },
           items:[ { art:"bigbed_pink", x:4, b:22, w:40, kind:"clue", clue:{ type:"cushions", cols:cush }, label:"床上的抱枕" },
                   { art:"chest", x:56, b:22, w:20, kind:"lock", label:"寶箱" },
                   { art:"lamp_yellow", x:82, b:22, w:10, kind:"text", text:"暖暖的黃色小燈，好想就這樣睡著 ( ˘ω˘ )zzZ" },
                   { art:"teddy_brown", x:44, b:22, w:10, kind:"text", text:"熊熊說：「要跟 ta 好好聊天才出得去喔！」" },
                   { art:"posterH_white", x:60, b:62, w:13, kind:"text", text:"一張愛心海報，好像沒什麼特別的。" } ] },
      b: { name:"客廳", wall:"wpMint", floor:"flCarpet", lock:{ type:"color", obj:"衣櫃", n:4, answer: cush.map(c=>c.id) },
           items:[ { art:"painting", x:10, b:56, w:26, kind:"clue", clue:{ type:"yarn", cols, digs }, label:"牆上的畫" },
                   { art:"wardrobe", x:66, b:22, w:22, kind:"lock", label:"衣櫃" },
                   { art:"sofa_blue", x:6, b:22, w:38, kind:"text", text:"軟綿綿的沙發，坐上去就不想動了 (っ´ω`c)" },
                   { art:"plant2", x:47, b:22, w:14, kind:"text", text:"盆栽的葉子後面……只有一隻小蟲 (・_・;)" } ] },
      hintA:["牆上的畫","ta 的客廳"], hintB:["床上的抱枕","ta 的臥室"] };
  }
  if(n===1){
    const h = ri(r,1,12), m = ri(r,0,11)*5, rec = shuffle(SYMS, r).slice(0,4);
    return { name:"廚房與餐廳",
      a: { name:"廚房", wall:"wpYellow", floor:"flTile", lock:{ type:"dial", obj:"烤箱", labels:[{t:"時"},{t:"時"},{t:"分"},{t:"分"}], answer:[(h/10)|0, h%10, (m/10)|0, m%10], max:9 },
           items:[ { art:"oven", x:60, b:22, w:22, kind:"lock", label:"烤箱" },
                   { art:"note", x:16, b:58, w:12, kind:"clue", clue:{ type:"recipe", syms:rec }, label:"牆上的食譜" },
                   { art:"table_white", x:6, b:22, w:34, kind:"text", text:"桌上有一點點蛋糕屑，是誰偷吃的 (¬‿¬)" },
                   { art:"cake_pink", x:15, b:30, w:12, kind:"text", text:"草莓蛋糕！可是現在不是吃的時候 (￣﹃￣)" },
                   { art:"radio_red", x:42, b:22, w:14, kind:"text", text:"收音機在唱：「喵～喵～喵～」" } ] },
      b: { name:"餐廳", wall:"wpBlue", floor:"flBlue", lock:{ type:"symbol", obj:"冰箱", n:4, answer: rec.map(s=>s.id) },
           items:[ { art:"catclock", x:40, b:58, w:16, kind:"clue", clue:{ type:"clock", h, m }, label:"牆上的貓咪時鐘" },
                   { art:"fridge_mint", x:70, b:22, w:18, kind:"lock", label:"冰箱" },
                   { art:"fishbowl", x:12, b:22, w:16, kind:"text", text:"金魚吐了一個泡泡：「啵～」" },
                   { art:"tulip_pink", x:32, b:22, w:12, kind:"text", text:"粉紅色的鬱金香，好香 (*´▽`*)" } ] },
      hintA:["牆上的貓咪時鐘","ta 的餐廳"], hintB:["牆上的食譜","ta 的廚房"] };
  }
  if(n===2){
    const pat = [...Array(9)].map(()=>false); shuffle([0,1,2,3,4,5,6,7,8], r).slice(0, ri(r,3,5)).forEach(i=>pat[i]=true);
    const bc = { red: ri(r,2,7), blue: ri(r,2,7), green: ri(r,2,7) }, ord = shuffle(["red","blue","green"], r);
    const BN = { red:{n:"紅色", c:"#e5486a"}, blue:{n:"藍色", c:"#6fb7e8"}, green:{n:"綠色", c:"#5cb87a"} };
    return { name:"書房與琴房",
      a: { name:"書房", wall:"wpWood", floor:"flDark", lock:{ type:"switch", obj:"開關面板", answer: pat },
           items:[ { art:"bookshelf", x:6, b:22, w:28, kind:"clue", clue:{ type:"books", bc }, label:"書架" },
                   { art:"panel", x:62, b:48, w:16, kind:"lock", label:"開關面板" },
                   { art:"lamp_purple", x:40, b:22, w:10, kind:"text", text:"檯燈下壓著一張紙條：「書不是拿來啃的」(ﾟ∀ﾟ)" },
                   { art:"catpic", x:44, b:60, w:14, kind:"text", text:"貓咪掛畫，畫裡的貓好像在對你眨眼 ฅ^•ﻌ•^ฅ" },
                   { art:"beanbag", x:62, b:22, w:26, kind:"text", text:"懶骨頭上有貓毛，一定有貓常常在這裡睡覺。" } ] },
      b: { name:"琴房", wall:"wpPurple", floor:"flCarpet", lock:{ type:"dial", obj:"抽屜", labels: ord.map(k=>({ dot: BN[k].c, n: BN[k].n })), answer: ord.map(k=>bc[k]), max:9 },
           items:[ { art:"window", x:8, b:50, w:24, kind:"clue", clue:{ type:"window", pat }, label:"窗戶" },
                   { art:"drawer", x:68, b:22, w:22, kind:"lock", label:"抽屜" },
                   { art:"piano_black", x:30, b:22, w:34, kind:"text", text:"彈了一下：「Do～」貓咪嚇一跳 Σ(°△°|||)" },
                   { art:"mirror", x:8, b:22, w:12, kind:"text", text:"鏡子裡有一隻很可愛的貓 (〃▽〃)" } ] },
      hintA:["窗戶","ta 的琴房"], hintB:["書架","ta 的書房"] };
  }
  if(n===3){
    // a 5-step paw path on a 5x5 grid that never steps on itself
    let path; for(let t=0;t<50;t++){ const st = [ri(r,1,3), ri(r,1,3)], seen = new Set([st.join()]), mv = []; let p = st.slice(), ok = true;
      for(let k=0;k<5;k++){ const opts = [["U",0,-1],["D",0,1],["L",-1,0],["R",1,0]].filter(([d,dx,dy])=>{ const q = [p[0]+dx, p[1]+dy]; return q[0]>=0&&q[1]>=0&&q[0]<5&&q[1]<5&&!seen.has(q.join()); });
        if(!opts.length){ ok = false; break; } const o = opts[(r()*opts.length)|0]; p = [p[0]+o[1], p[1]+o[2]]; seen.add(p.join()); mv.push({ d:o[0], p:p.slice() }); }
      if(ok){ path = { st, mv }; break; } }
    const FL = [ { id:"pink", n:"粉紅花", c:"#f7a7b8" }, { id:"yellow", n:"黃花", c:"#ffd36b" }, { id:"blue", n:"藍花", c:"#6fb7e8" }, { id:"purple", n:"紫花", c:"#b99be6" } ];
    const fc = FL.map(()=>ri(r,1,6)), ford = shuffle([0,1,2,3], r);
    return { name:"花園",
      a: { name:"前院", wall:"wpSakura", floor:"flGrass", lock:{ type:"arrows", obj:"柵欄門", n:5, answer: path.mv.map(m=>m.d) },
           items:[ { art:"gate", x:56, b:22, w:30, kind:"lock", label:"柵欄門" },
                   { art:"flowerbed", x:6, b:22, w:34, kind:"clue", clue:{ type:"flowers", fl: FL, fc }, label:"花圃" },
                   { art:"sunflower", x:42, b:22, w:10, kind:"text", text:"向日葵一直看著太陽，好認真 (｀・ω・´)" },
                   { art:"duck", x:88, b:22, w:8, kind:"text", text:"小鴨鴨：「呱！」" } ] },
      b: { name:"後院", wall:"wpBlue", floor:"flGrass", lock:{ type:"dial", obj:"小木屋", labels: ford.map(i=>({ dot: FL[i].c, n: FL[i].n })), answer: ford.map(i=>fc[i]), max:9 },
           items:[ { art:"pawmat", x:6, b:22, w:30, kind:"clue", clue:{ type:"paws", path }, label:"地上的腳印" },
                   { art:"shed", x:60, b:22, w:28, kind:"lock", label:"小木屋" },
                   { art:"snowman", x:42, b:22, w:12, kind:"text", text:"夏天的雪人？應該是魔法吧 (⊙_⊙)" },
                   { art:"bush", x:88, b:22, w:10, kind:"text", text:"草叢裡有東西在動……原來是蝴蝶 ヾ(•ω•`)o" } ] },
      hintA:["地上的腳印","ta 的後院"], hintB:["花圃","ta 的前院"] };
  }
  // n===4: the roof at night
  const sky = shuffle(SYMS, r).slice(0,4), fw = shuffle(COLORS, r).slice(0,4);
  return { name:"屋頂",
    a: { name:"屋頂東邊", wall:"wpNight", floor:"flDark", lock:{ type:"symbol", obj:"星星寶盒", n:4, answer: sky.map(s=>s.id) },
         items:[ { art:"starbox", x:58, b:22, w:22, kind:"lock", label:"星星寶盒" },
                 { art:"tube", x:12, b:22, w:14, kind:"clue", clue:{ type:"fireworks", cols: fw }, label:"煙火筒" },
                 { art:"moon", x:40, b:62, w:12, kind:"text", text:"月亮好圓，好想跟 ta 一起看 (♡˙︶˙♡)" },
                 { art:"lights", x:20, b:80, w:56, kind:"text", text:"一串小燈泡，一閃一閃的 ✧" } ] },
    b: { name:"屋頂西邊", wall:"wpNight", floor:"flDark", lock:{ type:"color", obj:"許願箱", n:4, answer: fw.map(c=>c.id) },
         items:[ { art:"telescope", x:10, b:22, w:22, kind:"clue", clue:{ type:"sky", syms: sky }, label:"望遠鏡" },
                 { art:"wishbox", x:62, b:22, w:20, kind:"lock", label:"許願箱" },
                 { art:"stars", x:40, b:62, w:22, kind:"text", text:"好多星星，要許什麼願望呢？(｡･ω･｡)ﾉ♡" } ] },
    hintA:["望遠鏡","ta 的屋頂西邊"], hintB:["煙火筒","ta 的屋頂東邊"] };
}
const ROOMS = 5;
if(window.__mock) window.__esMake = makeRoom;   // tests only

// ---------- clue pictures (what you see when you tap a clue) ----------
function clueView(c){
  const S = (w, h, body, bg) => `<svg viewBox="0 0 ${w} ${h}" class="esPic" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${bg?`<rect width="${w}" height="${h}" fill="${bg}"/>`:""}${body}</svg>`;
  const ball = (x, y, col) => `<circle cx="${x}" cy="${y}" r="9" fill="${col}" stroke="#5a3b2e" stroke-width="2"/><path d="M${x-6} ${y-3} q6 4 12 0 M${x-6} ${y+3} q6 -4 12 0" stroke="#fff" stroke-width="1.5" fill="none" opacity=".7"/>`;
  const txt = (x, y, t, col, sz) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${sz||12}" fill="${col||"#5a3b2e"}" font-family="Cubic11,sans-serif">${t}</text>`;
  if(c.type==="yarn") return S(120, 70, `<rect x="4" y="4" width="112" height="62" fill="#fff8ee" stroke="#c98b4f" stroke-width="5"/>` + c.cols.map((k,i)=>ball(28 + i*32, 28, k.c) + txt(28 + i*32, 56, c.digs[i], "#5a3b2e", 14)).join(""), "#e9b872") + `<p>畫裡有三顆毛線球，下面各寫著一個數字。</p>`;
  if(c.type==="cushions") return S(120, 60, `<rect x="6" y="30" width="108" height="24" fill="#f7a7b8" stroke="#5a3b2e" stroke-width="2"/><rect x="6" y="20" width="108" height="12" fill="#fff" stroke="#5a3b2e" stroke-width="2"/>` + c.cols.map((k,i)=>`<rect x="${12 + i*26}" y="8" width="22" height="18" rx="4" fill="${k.c}" stroke="#5a3b2e" stroke-width="2"/>`).join(""), "#ffe1ea") + `<p>床上從左到右排著四個抱枕。</p>`;
  if(c.type==="clock"){ const ha = ((c.h%12) + c.m/60) * 30 - 90, ma = c.m*6 - 90, R = Math.PI/180;
    return S(100, 100, `<circle cx="50" cy="50" r="44" fill="#fff" stroke="#5a3b2e" stroke-width="4"/>` + [12,3,6,9].map((n,i)=>txt(50 + Math.cos((i*90-90)*R)*34, 54 + Math.sin((i*90-90)*R)*34, n, "#5a3b2e", 12)).join("") +
      [...Array(12)].map((_,i)=>`<circle cx="${50 + Math.cos(i*30*R)*40}" cy="${50 + Math.sin(i*30*R)*40}" r="1.5" fill="#5a3b2e"/>`).join("") +
      `<line x1="50" y1="50" x2="${50 + Math.cos(ha*R)*22}" y2="${50 + Math.sin(ha*R)*22}" stroke="#5a3b2e" stroke-width="5" stroke-linecap="round"/><line x1="50" y1="50" x2="${50 + Math.cos(ma*R)*34}" y2="${50 + Math.sin(ma*R)*34}" stroke="#e5486a" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="50" r="4" fill="#5a3b2e"/>`, "#dcefff") + `<p>貓咪時鐘停在這個時間。短針是時、長針是分。</p>`; }
  if(c.type==="recipe") return `<div class="esRecipe"><b>貓咪特製料理</b>${c.syms.map((s,i)=>`<div><i>${i+1}.</i><span>${icon(s.id)}</span>${s.n}</div>`).join("")}</div><p>食譜上照順序寫著四樣材料。</p>`;
  if(c.type==="window") return S(90, 90, `<rect x="3" y="3" width="84" height="84" fill="#fff" stroke="#5a3b2e" stroke-width="4"/>` + c.pat.map((on,i)=>`<rect x="${9 + (i%3)*26}" y="${9 + ((i/3)|0)*26}" width="22" height="22" fill="${on?"#ffe08a":"#3b3f73"}" stroke="#5a3b2e" stroke-width="2"/>${on?`<rect x="${12 + (i%3)*26}" y="${12 + ((i/3)|0)*26}" width="5" height="5" fill="#fff"/>`:""}`).join(""), "#c9b6f0") + `<p>對面房子的窗戶，有些格子亮著燈。</p>`;
  if(c.type==="books"){ const BN = { red:"#e5486a", blue:"#6fb7e8", green:"#5cb87a" }; let list = []; for(const k in c.bc) for(let i=0;i<c.bc[k];i++) list.push(k);
    const r = rng(c.bc.red*100 + c.bc.blue*10 + c.bc.green); list = shuffle(list, r);
    const perRow = Math.ceil(list.length/2); let body = `<rect x="2" y="2" width="136" height="76" fill="#c98b4f" stroke="#5a3b2e" stroke-width="3"/><rect x="6" y="38" width="128" height="4" fill="#5a3b2e"/>`;
    list.forEach((k,i)=>{ const row = i < perRow ? 0 : 1, j = row ? i - perRow : i; body += `<rect x="${8 + j*14}" y="${row ? 46 : 10}" width="11" height="28" fill="${BN[k]}" stroke="#5a3b2e" stroke-width="1.5"/><rect x="${10 + j*14}" y="${row ? 52 : 16}" width="7" height="2" fill="#fff" opacity=".7"/>`; });
    return S(140, 80, body) + `<p>書架上有好多不同顏色的書。</p>`; }
  if(c.type==="paws"){ const cell = 18; let body = `<rect width="94" height="94" fill="#9ddb9a"/>`;
    for(let y=0;y<5;y++) for(let x=0;x<5;x++) body += `<rect x="${2 + x*cell}" y="${2 + y*cell}" width="${cell-2}" height="${cell-2}" fill="${(x+y)%2?"#8fd18f":"#a8e0a4"}"/>`;
    const paw = (x, y, o, rot) => `<g opacity="${o}" transform="rotate(${rot} ${x} ${y})"><circle cx="${x}" cy="${y+2}" r="3.5" fill="#5a3b2e"/><circle cx="${x-4}" cy="${y-3}" r="1.6" fill="#5a3b2e"/><circle cx="${x}" cy="${y-5}" r="1.6" fill="#5a3b2e"/><circle cx="${x+4}" cy="${y-3}" r="1.6" fill="#5a3b2e"/></g>`;
    const cx = p => 1 + p[0]*cell + cell/2, cy = p => 1 + p[1]*cell + cell/2;
    body += `<rect x="${cx(c.path.st)-7}" y="${cy(c.path.st)-7}" width="14" height="14" fill="#f0708d" stroke="#5a3b2e" stroke-width="1.5"/>` + txt(cx(c.path.st), cy(c.path.st)+4, "起", "#fff", 10);
    c.path.mv.forEach((m,i)=>{ body += paw(cx(m.p), cy(m.p), .6 + i*.08, { U:0, R:90, D:180, L:270 }[m.d]); });
    return S(94, 94, body) + `<p>從粉紅色的「起」開始，地上有一串貓掌印，腳趾朝著走的方向。</p>`; }
  if(c.type==="flowers"){ const r = rng(c.fc.join("")*1 + 7); let body = `<rect width="140" height="70" fill="#9ddb9a"/>`; const spots = [];
    c.fl.forEach((f,k)=>{ for(let i=0;i<c.fc[k];i++) spots.push(f); });
    shuffle(spots, r).forEach((f,i)=>{ const x = 10 + (i%8)*16 + r()*4, y = 14 + ((i/8)|0)*26 + r()*6;
      body += `<rect x="${x+2}" y="${y+6}" width="2" height="10" fill="#3f9a5a"/><circle cx="${x+3}" cy="${y+4}" r="5" fill="${f.c}" stroke="#5a3b2e" stroke-width="1.2"/><circle cx="${x+3}" cy="${y+4}" r="1.6" fill="#ffd36b"/>`; });
    return S(140, 70, body) + `<p>花圃裡開著四種顏色的花。</p>`; }
  if(c.type==="sky"){ const r = rng(7); let body = `<rect width="140" height="80" fill="#1f2450"/>`;
    for(let i=0;i<30;i++) body += `<rect x="${(r()*138)|0}" y="${(r()*78)|0}" width="1.5" height="1.5" fill="#fff" opacity="${.4 + r()*.6}"/>`;
    const slots = shuffle([[12,8],[78,6],[40,40],[104,42]], rng(c.syms.map(x=>x.id).join("").length * 13 + c.syms[0].id.length));
    c.syms.forEach((s,i)=>{ const [x, y] = slots[i];
      body += `<foreignObject x="${x}" y="${y}" width="22" height="22"><div xmlns="http://www.w3.org/1999/xhtml" class="esSkyI">${icon(s.id)}</div></foreignObject>` + [...Array(i+1)].map((_,d)=>`<circle cx="${x + 11 - i*3 + d*6}" cy="${y + 28}" r="2" fill="#ffd36b"/>`).join(""); });
    return S(140, 80, body) + `<p>從望遠鏡看出去，有四個發光的圖案，每個下面有幾顆小星星。</p>`; }
  if(c.type==="fireworks"){ let body = `<rect width="140" height="70" fill="#1f2450"/>`;
    c.cols.forEach((k,i)=>{ const x = 20 + i*33, y = 28; for(let a=0;a<12;a++){ const t = a*Math.PI/6; body += `<line x1="${x}" y1="${y}" x2="${x + Math.cos(t)*12}" y2="${y + Math.sin(t)*12}" stroke="${k.c}" stroke-width="2.5" stroke-linecap="round"/>`; }
      body += `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/>` + txt(x, 60, `第${i+1}發`, "#fff", 10); });
    return S(140, 70, body) + `<p>煙火筒上的說明圖：煙火會照這個順序放。</p>`; }
  return "";
}

App.registerGame({
  id: "escape",
  name: "喵喵密室逃脫",
  desc: "兩人看到不同房間，互相描述線索",
  icon: () => Pix.sprite("calico","surprised"),
  mount(el, ctx){
    const { sprite, esc, SFX } = ctx;
    let s = null, R = null;
    const me = () => ctx.me.uid;
    const side = () => ctx.players()[0] === me() ? "a" : "b";
    const other = () => side()==="a" ? "b" : "a";
    const pname = () => { const p = ctx.partner(); return p ? p.name : "ta"; };

    function lobby(){
      const best = s && s.best;
      el.innerHTML = `<div class="box esLobby">
        <div class="esHero">${sprite(ctx.catOf(ctx.players()[0])||"orange","surprised")}<span class="esDoor">${art("door")}</span>${sprite(ctx.catOf(ctx.players()[1])||"white","surprised")}</div>
        <p class="esIntro">一覺醒來，兩隻貓被關在<b>不同的房間</b>裡！<br>你看到的鎖，線索在 ta 的房間；ta 的鎖，線索在你這邊。<br>互相描述看到的東西，一起逃出去吧～</p>
        <div class="esHow"><span>點房間裡的東西可以調查</span><span>🔒 是你要打開的鎖</span><span>用聊天或電話告訴對方你看到什麼</span><span>兩個鎖都開了才能去下一間</span></div>
        ${s && s.room!=null && !s.done ? `<button class="btn" id="esGo">繼續逃脫（第 ${s.room+1} 間）</button><button class="btn sub" id="esNew" style="width:100%;margin-top:8px">重新開始</button>` : `<button class="btn" id="esNew">開始逃脫！</button>`}
        ${best ? `<div class="k" style="text-align:center">最快紀錄：${Math.floor(best/60)} 分 ${best%60} 秒</div>` : ""}
        <div class="k" style="text-align:center">每次開始，密碼都會重新隨機・一共 ${ROOMS} 間</div></div>`;
      const go = el.querySelector("#esGo"); if(go) go.addEventListener("click", ()=>{ SFX.select(); room(); });
      el.querySelector("#esNew").addEventListener("click", async ()=>{ SFX.select();
        await ctx.update("escape", st=>{ st = st || {}; st.seed = (Math.random()*1e9)|0; st.room = 0; st.solved = {}; st.t0 = Date.now(); st.done = false; st.hints = 0; return st; });
        ctx.notifyPartner(`${ctx.me.name} 開始了「喵喵密室逃脫」，快來一起逃出去！`); });
    }
    function room(){
      if(!s || s.room==null){ lobby(); return; }
      if(s.done){ ending(); return; }
      R = makeRoom(s.room, s.seed);
      const mine = R[side()], solved = s.solved || {}, myOk = !!solved[side()], theirOk = !!solved[other()];
      el.innerHTML = `<div class="box esRoom">
        <div class="esTop"><b>第 ${s.room+1}/${ROOMS} 間・${esc(mine.name)}</b><span class="esLocks"><i class="${myOk?"ok":""}">你 ${myOk?"🔓":"🔒"}</i><i class="${theirOk?"ok":""}">${esc(pname())} ${theirOk?"🔓":"🔒"}</i></span></div>
        <div class="esScene" style="background:${bgOf(mine.wall)}"><div class="esFloor" style="background:${bgOf(mine.floor)}"></div>
          ${mine.items.map((it,i)=>`<button class="esIt ${it.kind}${it.kind==="lock"&&myOk?" open":""}" data-i="${i}" style="left:${it.x}%;bottom:${it.b}%;width:${it.w}%">${art(it.art)}${it.kind==="lock"?`<em>${myOk?"🔓":"🔒"}</em>`:it.kind==="clue"?`<em class="sp">${icon("spark")}</em>`:""}</button>`).join("")}
          <span class="esMe">${sprite(ctx.me.cat||"orange", myOk ? "happy" : "normal")}</span>
          ${myOk && theirOk ? `<div class="esOpen"><b>門打開了！</b><button class="btn" id="esNext">${s.room+1 < ROOMS ? "前往下一間 ▶" : "逃出去！"}</button></div>` : ""}
        </div>
        <div class="esBar"><button class="btn sub" id="esHint">💡 提示</button><button class="btn sub" id="esChat">💬 跟 ta 說</button><button class="btn sub" id="esOut">暫停</button></div>
        <div class="esTip">${myOk ? (theirOk ? "兩個鎖都開了！" : `你的鎖開了！換你幫 ${esc(pname())}：把你房間的線索告訴 ta`) : "找到你房間的鎖，問問 ta 那邊看到什麼"}</div></div>`;
      el.querySelectorAll("[data-i]").forEach(b=>b.addEventListener("click", ()=>{ SFX.tap(); open(mine.items[+b.dataset.i], mine); }));
      el.querySelector("#esHint").addEventListener("click", ()=>{ SFX.tap(); hint(); });
      el.querySelector("#esChat").addEventListener("click", ()=>{ const fab = document.getElementById("fab") || document.querySelector("#nav button[data-go=chat]"); if(fab) fab.click(); });
      el.querySelector("#esOut").addEventListener("click", ()=>{ SFX.tap(); lobby(); });
      const nx = el.querySelector("#esNext"); if(nx) nx.addEventListener("click", next);
    }
    function hint(){
      const h = side()==="a" ? R.hintA : R.hintB, h2 = side()==="a" ? R.hintB : R.hintA;
      modal(`<h3>💡 提示</h3><p>你的鎖的線索在 <b>${esc(h[1])}</b> 的「${esc(h[0])}」。<br>請 ${esc(pname())} 去看看，再描述給你聽！</p><p>${esc(pname())} 的線索則在你這邊的「${esc(h2[0])}」，記得也告訴 ta 喔。</p><button class="btn" data-close>知道了</button>`);
    }
    function modal(html){
      const o = document.createElement("div"); o.className = "esModal"; o.innerHTML = `<div class="esBox">${html}</div>`;
      document.body.appendChild(o);
      o.addEventListener("click", e=>{ if(e.target===o || e.target.closest("[data-close]")) o.remove(); });
      return o;
    }
    function open(it, mine){
      if(it.kind==="text"){ modal(`<div class="esArt">${art(it.art)}</div><p>${esc(it.text)}</p><button class="btn" data-close>好</button>`); return; }
      if(it.kind==="clue"){ modal(`<h3>${esc(it.label)}</h3>${clueView(it.clue)}<p class="esSay">把這個描述給 ${esc(pname())} 聽吧！</p><button class="btn" data-close>好</button>`); return; }
      if((s.solved||{})[side()]){ modal(`<div class="esArt">${art(it.art)}</div><p>${esc(it.label)}已經打開了 🔓</p><button class="btn" data-close>好</button>`); return; }
      lockUI(mine.lock, it);
    }
    // ---------- locks ----------
    function lockUI(L, it){
      let val, body;
      const o = modal(`<h3>🔒 ${esc(L.obj)}</h3><div class="esLock" id="esL"></div><div class="esBtns"><button class="btn sub" data-close>先不要</button><button class="btn" id="esTry">打開！</button></div>`);
      const box = o.querySelector("#esL");
      const draw = () => {
        if(L.type==="dial") box.innerHTML = `<div class="esDials">${val.map((v,i)=>{ const lb = L.labels[i]; return `<div class="esDial"><span class="lb">${lb.dot?`<i style="background:${lb.dot}"></i>${esc(lb.n)}`:esc(lb.t)}</span><button data-up="${i}">▲</button><b>${v}</b><button data-dn="${i}">▼</button></div>`; }).join("")}</div>`;
        if(L.type==="color") box.innerHTML = `<div class="esSlots">${val.map((v,i)=>{ const c = COLORS.find(k=>k.id===v); return `<button data-s="${i}" style="background:${c?c.c:"#eee"}">${c?"":"?"}</button>`; }).join("")}</div><div class="k">點格子換顏色</div>`;
        if(L.type==="symbol") box.innerHTML = `<div class="esSlots sym">${val.map((v,i)=>`<button data-s="${i}">${v ? icon(v) : "?"}</button>`).join("")}</div><div class="k">點格子換圖案</div>`;
        if(L.type==="switch") box.innerHTML = `<div class="esSw">${val.map((v,i)=>`<button data-s="${i}" class="${v?"on":""}"></button>`).join("")}</div><div class="k">點一下開燈 / 關燈</div>`;
        if(L.type==="arrows") box.innerHTML = `<div class="esArr">${[...Array(L.n)].map((_,i)=>`<span>${val[i] ? {U:"↑",D:"↓",L:"←",R:"→"}[val[i]] : "·"}</span>`).join("")}</div><div class="esArrB"><button data-a="U">↑</button><button data-a="L">←</button><button data-a="R">→</button><button data-a="D">↓</button><button data-a="X">⌫</button></div>`;
        box.querySelectorAll("[data-up]").forEach(b=>b.addEventListener("click", ()=>{ const i=+b.dataset.up; val[i] = (val[i]+1) % 10; SFX.key(); draw(); }));
        box.querySelectorAll("[data-dn]").forEach(b=>b.addEventListener("click", ()=>{ const i=+b.dataset.dn; val[i] = (val[i]+9) % 10; SFX.key(); draw(); }));
        box.querySelectorAll("[data-s]").forEach(b=>b.addEventListener("click", ()=>{ const i=+b.dataset.s; SFX.key();
          if(L.type==="color"){ const k = COLORS.findIndex(c=>c.id===val[i]); val[i] = COLORS[(k+1) % COLORS.length].id; }
          if(L.type==="symbol"){ const k = SYMS.findIndex(c=>c.id===val[i]); val[i] = SYMS[(k+1) % SYMS.length].id; }
          if(L.type==="switch") val[i] = !val[i];
          draw(); }));
        box.querySelectorAll("[data-a]").forEach(b=>b.addEventListener("click", ()=>{ const a = b.dataset.a; SFX.key(); if(a==="X") val.pop(); else if(val.length < L.n) val.push(a); draw(); }));
      };
      val = L.type==="dial" ? L.answer.map(()=>0) : L.type==="switch" ? L.answer.map(()=>false) : L.type==="arrows" ? [] : [...Array(L.n)].map(()=>null);
      draw();
      o.querySelector("#esTry").addEventListener("click", async ()=>{
        const ok = JSON.stringify(val) === JSON.stringify(L.answer);
        if(!ok){ SFX.miss(); const b = o.querySelector(".esBox"); b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); if(navigator.vibrate) navigator.vibrate(60); return; }
        SFX.level(); ctx.burst(); o.remove();
        const sd = side(), rm = s.room;
        await ctx.update("escape", st=>{ if(!st || st.room!==rm) return undefined; st.solved = st.solved || {}; st.solved[sd] = true; return st; });
        ctx.toast(`🔓 ${esc(L.obj)}打開了！`);
      });
    }
    async function next(){
      SFX.select(); const rm = s.room;
      await ctx.update("escape", st=>{ if(!st || st.room!==rm || !(st.solved||{}).a || !(st.solved||{}).b) return undefined;
        if(rm + 1 >= ROOMS){ st.done = true; st.secs = Math.round((Date.now() - st.t0)/1000); if(!st.best || st.secs < st.best) st.best = st.secs; }
        else { st.room = rm + 1; st.solved = {}; }
        return st; });
    }
    function ending(){
      const t = s.secs || 0;
      el.innerHTML = `<div class="box esEnd"><div class="esSky">${[...Array(5)].map((_,i)=>`<span class="fw f${i}"></span>`).join("")}
        <div class="esRoof"></div><div class="esCats">${sprite(ctx.catOf(ctx.players()[0])||"orange","love")}${sprite(ctx.catOf(ctx.players()[1])||"white","love")}</div></div>
        <h2>我們逃出來了！</h2><p>花了 ${Math.floor(t/60)} 分 ${t%60} 秒，兩隻貓一起在屋頂看煙火 (♡˙︶˙♡)</p>
        <button class="btn" id="esAgain">再玩一次（密碼會換）</button></div>`;
      SFX.match(); ctx.burst();
      el.querySelector("#esAgain").addEventListener("click", async ()=>{ await ctx.update("escape", st=>{ st = st || {}; st.seed = (Math.random()*1e9)|0; st.room = 0; st.solved = {}; st.t0 = Date.now(); st.done = false; return st; }); });
    }
    let shownRoom = null;
    this._u = ctx.onState("escape", st=>{
      const prev = s; s = st;
      if(!st){ lobby(); return; }
      const solvedNow = st.solved || {}, was = (prev && prev.solved) || {};
      if(prev && prev.room===st.room && !was[other()] && solvedNow[other()]) ctx.toast(`${esc(pname())} 的鎖打開了！`);
      if(el.querySelector(".esLobby") && prev && prev.seed===st.seed && prev.room===st.room) { lobby(); return; }
      document.querySelectorAll(".esModal").forEach(m=>{ if(!prev || prev.room!==st.room || prev.seed!==st.seed) m.remove(); });
      room();
    });
    (async()=>{ const cur = await ctx.getState("escape").catch(()=>null); s = cur ? cur.state : null; lobby(); })();
  },
  unmount(){ if(this._u) this._u(); document.querySelectorAll(".esModal").forEach(m=>m.remove()); },
});
})();
