// 遊戲：喵喵大富翁（兩個人輪流擲骰子，買地、蓋房子、收租金；橫向全螢幕）
// 不用同時在線：狀態存在 game_state "mono"，輪到誰就由誰的手機推進。規則跟經典大富翁一樣：
// 起點 +200、買地、整組顏色租金加倍、蓋房子到旅館、抵押、機會/命運卡、洗澡間（坐牢）、交易、破產。
(function(){
const O = "#5a3b2e";
const START_MONEY = 1500, GO_MONEY = 200, JAIL_FINE = 50, JAIL = 11;
const GROUPS = {
  brown:  { c:"#b07d45", n:"咖啡" }, lb: { c:"#8fd0f5", n:"天空" }, pink: { c:"#f7a7b8", n:"粉紅" }, orange: { c:"#ffa45a", n:"橘子" },
  red:    { c:"#e5486a", n:"草莓" }, yellow: { c:"#ffd36b", n:"檸檬" }, green: { c:"#6cc47f", n:"薄荷" }, db: { c:"#5b78c7", n:"星空" },
};
const P = (n, g, price, rent, house) => ({ t:"prop", n, g, price, rent, house });
const SQ = [
  { t:"go", n:"起點" },
  P("紙箱小屋","brown",60,[2,10,30,90,160,250],50),
  { t:"chest", n:"小窩寶箱" },
  P("貓抓板公寓","brown",60,[4,20,60,180,320,450],50),
  { t:"tax", n:"貓草稅", amt:200 },
  { t:"st", n:"南站公車", price:200 },
  P("毛線球街","lb",100,[6,30,90,270,400,550],50),
  { t:"chance", n:"喵喵機會" },
  P("小魚乾巷","lb",100,[6,30,90,270,400,550],50),
  P("逗貓棒路","lb",120,[8,40,100,300,450,600],50),
  { t:"util", n:"罐頭工廠", price:150 },
  { t:"jail", n:"洗澡間" },
  P("貓薄荷花園","pink",140,[10,50,150,450,625,750],100),
  P("陽台躺椅","pink",140,[10,50,150,450,625,750],100),
  P("窗台觀景台","pink",160,[12,60,180,500,700,900],100),
  { t:"st", n:"西站公車", price:200 },
  P("肉球公園","orange",180,[14,70,200,550,750,950],100),
  { t:"chest", n:"小窩寶箱" },
  { t:"park", n:"曬太陽" },
  P("呼嚕咖啡廳","orange",180,[14,70,200,550,750,950],100),
  P("喵喵麵包店","orange",200,[16,80,220,600,800,1000],100),
  { t:"chance", n:"喵喵機會" },
  P("貓咪遊樂園","red",220,[18,90,250,700,875,1050],150),
  P("摩天輪","red",220,[18,90,250,700,875,1050],150),
  P("旋轉木馬","red",240,[20,100,300,750,925,1100],150),
  { t:"st", n:"北站公車", price:200 },
  P("罐罐超市","yellow",260,[22,110,330,800,975,1150],150),
  { t:"util", n:"貓砂公司", price:150 },
  P("布丁百貨","yellow",280,[24,120,360,850,1025,1200],150),
  { t:"gojail", n:"去洗澡" },
  P("貓咪溫泉","green",300,[26,130,390,900,1100,1275],200),
  P("星空露營區","green",320,[28,150,450,1000,1200,1400],200),
  { t:"st", n:"東站公車", price:200 },
  P("海邊別墅","db",350,[35,175,500,1100,1300,1500],200),
  { t:"tax", n:"罐罐奢侈稅", amt:100 },
  P("貓咪城堡","db",400,[50,200,600,1400,1700,2000],200),
];
const N = SQ.length;
const buyable = i => ["prop","st","util"].includes(SQ[i].t);
const priceOf = i => SQ[i].price || 0;
// board position: 12 x 8 ring, start at the bottom-right corner and go clockwise
const cellOf = i => i <= 11 ? [11 - i, 7] : i <= 17 ? [0, 7 - (i - 11)] : i <= 29 ? [i - 18, 0] : [11, i - 29];

// ---------- cards ----------
const CHANCE = [
  { t:"前進到起點，領 200 元", go:0 },
  { t:"前進到「貓咪城堡」", go:35 },
  { t:"前進到「肉球公園」，經過起點可以領 200 元", go:16 },
  { t:"前進到「貓咪遊樂園」，經過起點可以領 200 元", go:22 },
  { t:"前進到最近的公車站，有主人的話付兩倍車費", near:"st" },
  { t:"前進到最近的工廠，有主人的話付骰子點數 × 10", near:"util" },
  { t:"罐罐銀行發紅利，領 50 元", money:50 },
  { t:"免洗澡卡：下次被抓去洗澡可以用掉它", card:1 },
  { t:"後退 3 格", back:3 },
  { t:"被抓去洗澡！直接去洗澡間，不能經過起點", jail:1 },
  { t:"房子大掃除：每間房子付 25 元，每間旅館付 100 元", repair:[25,100] },
  { t:"在走廊奔跑被罰款 15 元", money:-15 },
  { t:"坐公車去「南站公車」，經過起點可以領 200 元", go:5 },
  { t:"你被選為小窩班長，付給對方 50 元", toOther:-50 },
  { t:"投資小魚乾成功，領 150 元", money:150 },
  { t:"撿到別人掉的罐罐，領 100 元", money:100 },
];
const CHEST = [
  { t:"前進到起點，領 200 元", go:0 },
  { t:"罐罐銀行算錯錢，你多領 200 元", money:200 },
  { t:"帶貓咪看獸醫，付 50 元", money:-50 },
  { t:"賣掉舊的貓抓板，領 50 元", money:50 },
  { t:"免洗澡卡：下次被抓去洗澡可以用掉它", card:1 },
  { t:"弄得全身髒兮兮，直接去洗澡間", jail:1 },
  { t:"生日快樂！對方送你 10 元", toOther:10 },
  { t:"貓咪保險到期，領 100 元", money:100 },
  { t:"吃太多罐罐要看醫生，付 100 元", money:-100 },
  { t:"上貓咪才藝班，付 50 元", money:-50 },
  { t:"幫鄰居顧貓，領 25 元", money:25 },
  { t:"屋頂漏水要修：每間房子付 40 元，每間旅館付 115 元", repair:[40,115] },
  { t:"貓咪選美比賽第二名，領 10 元", money:10 },
  { t:"阿嬤寄來紅包，領 100 元", money:100 },
  { t:"貓草稅退稅，領 20 元", money:20 },
  { t:"零用錢存滿了，領 100 元", money:100 },
];
const shuffle = n => { const a = [...Array(n).keys()]; for(let i=n-1;i>0;i--){ const j = (Math.random()*(i+1))|0; [a[i],a[j]] = [a[j],a[i]]; } return a; };

// ---------- rules (all work on a plain state object) ----------
const R = {
  fresh(ids){ const players = {}; ids.forEach(u=>players[u] = { pos:0, money:START_MONEY, jail:0, cards:0, dbl:0 });
    return { v:1, run:Date.now(), order:ids.slice(), players, turn:ids[0], phase:"roll", owned:{}, dice:null, log:[], decks:{ chance:shuffle(CHANCE.length), chest:shuffle(CHEST.length) }, card:null, trade:null, over:null, turns:0, rolledDouble:false, move:null }; },
  other: (st, u) => st.order.find(x=>x!==u),
  log(st, t){ st.log = (st.log||[]).concat([{ t, at:Date.now() }]).slice(-40); },
  owner: (st, i) => st.owned[i] && st.owned[i].by,
  groupSquares: g => SQ.map((s,i)=>s.g===g ? i : -1).filter(i=>i>=0),
  ownsGroup: (st, u, g) => R.groupSquares(g).every(i=>R.owner(st,i)===u),
  count: (st, u, t) => SQ.reduce((n,s,i)=>n + (s.t===t && R.owner(st,i)===u ? 1 : 0), 0),
  rent(st, i, roll){
    const o = st.owned[i], s = SQ[i]; if(!o || o.mort) return 0;
    if(s.t==="st") return 25 * Math.pow(2, R.count(st, o.by, "st") - 1);
    if(s.t==="util") return roll * (R.count(st, o.by, "util") >= 2 ? 10 : 4);
    if(o.h > 0) return s.rent[o.h];
    return s.rent[0] * (R.ownsGroup(st, o.by, s.g) ? 2 : 1);
  },
  pay(st, from, to, amt, why){ st.players[from].money -= amt; if(to) st.players[to].money += amt; },
  houses(st, u){ let h = 0, ho = 0; for(const k in st.owned){ const o = st.owned[k]; if(o.by===u){ if(o.h===5) ho++; else h += o.h||0; } } return [h, ho]; },
  worth(st, u){ let w = st.players[u].money; for(const k in st.owned){ const o = st.owned[k]; if(o.by!==u) continue; const s = SQ[k]; w += o.mort ? priceOf(k)/2 : priceOf(k); if(s.house) w += (o.h||0)*s.house; } return w; },
  // how much a player could raise by selling every house and mortgaging everything
  liquid(st, u){ let v = st.players[u].money; for(const k in st.owned){ const o = st.owned[k]; if(o.by!==u) continue; const s = SQ[k]; if(s.house) v += (o.h||0)*s.house/2; if(!o.mort) v += priceOf(k)/2; } return v; },
  // move forward n squares (collect GO), or straight to a square
  moveTo(st, u, to, passGo){ const p = st.players[u]; if(passGo && to < p.pos) { p.money += GO_MONEY; R.log(st, `${R.nm(st,u)} 經過起點，領 ${GO_MONEY} 元`); } st.move = { u, from:p.pos, to, at:Date.now(), steps: passGo !== "jump" }; p.pos = to; },
  toJail(st, u){ const p = st.players[u]; st.move = { u, from:p.pos, to:JAIL, at:Date.now(), steps:false }; p.pos = JAIL; p.jail = 3; p.dbl = 0; st.rolledDouble = false; R.log(st, `${R.nm(st,u)} 被抓去洗澡了 🛁`); },
  nm: (st, u) => (st.names && st.names[u]) || "貓咪",
  // what happens on the square you landed on
  land(st, u, roll, depth){
    depth = depth || 0; if(depth > 4) return;
    const p = st.players[u], i = p.pos, s = SQ[i], other = R.other(st, u);
    if(s.t==="go" || s.t==="park" || s.t==="jail") return;
    if(s.t==="gojail"){ R.toJail(st, u); return; }
    if(s.t==="tax"){ R.pay(st, u, null, s.amt, s.n); R.log(st, `${R.nm(st,u)} 繳了${s.n} ${s.amt} 元`); return; }
    if(s.t==="chance" || s.t==="chest"){
      const deck = st.decks[s.t]; const id = deck.shift(); deck.push(id); const c = (s.t==="chance" ? CHANCE : CHEST)[id];
      st.card = { by:u, kind:s.t, id, at:Date.now() }; R.log(st, `${R.nm(st,u)} 抽到${s.n}：${c.t}`);
      if(c.money){ p.money += c.money; }
      if(c.toOther){ R.pay(st, c.toOther > 0 ? other : u, c.toOther > 0 ? u : other, Math.abs(c.toOther)); }
      if(c.card){ p.cards = (p.cards||0) + 1; }
      if(c.repair){ const [h, ho] = R.houses(st, u); R.pay(st, u, null, h*c.repair[0] + ho*c.repair[1]); }
      if(c.jail){ R.toJail(st, u); return; }
      if(c.back){ const to = (i - c.back + N) % N; st.move = { u, from:i, to, at:Date.now(), steps:false }; p.pos = to; R.land(st, u, roll, depth+1); return; }
      if(c.go != null){ R.moveTo(st, u, c.go, true); R.land(st, u, roll, depth+1); return; }
      if(c.near){ let j = i; do { j = (j + 1) % N; } while(SQ[j].t !== c.near); R.moveTo(st, u, j, true);
        const o = st.owned[j];
        if(o && o.by !== u && !o.mort){ const amt = c.near==="st" ? R.rent(st, j, roll)*2 : roll*10; R.pay(st, u, o.by, amt); R.log(st, `${R.nm(st,u)} 付給 ${R.nm(st,o.by)} ${amt} 元`); return; }
        R.land(st, u, roll, depth+1); return; }
      return;
    }
    if(buyable(i)){
      const o = st.owned[i];
      if(!o){ st.phase = "buy"; return; }
      if(o.by === u){ return; }
      if(o.mort){ R.log(st, `${s.n} 抵押中，不用付租金`); return; }
      const amt = R.rent(st, i, roll); R.pay(st, u, o.by, amt); R.log(st, `${R.nm(st,u)} 在「${s.n}」付給 ${R.nm(st,o.by)} ${amt} 元租金`);
    }
  },
  // after the landing is resolved: roll again on doubles, otherwise the turn can end
  settle(st, u){
    if(st.phase === "buy") return;
    if(st.players[u].money < 0){ st.phase = "debt"; return; }
    st.phase = (st.rolledDouble && st.players[u].jail === 0) ? "roll" : "end";
  },
  roll(st, u){
    const p = st.players[u], d = [1 + (Math.random()*6|0), 1 + (Math.random()*6|0)], sum = d[0] + d[1], dbl = d[0] === d[1];
    st.dice = { d, by:u, at:Date.now() }; st.card = null; st.move = null; st.rolledDouble = false;
    if(p.jail > 0){
      if(dbl){ p.jail = 0; R.log(st, `${R.nm(st,u)} 擲出 ${d[0]}、${d[1]} 一樣的點數，洗好澡出來了！`); }
      else { p.jail--; if(p.jail > 0){ R.log(st, `${R.nm(st,u)} 擲出 ${d[0]}、${d[1]}，還要再洗一下澡`); st.phase = "end"; return; }
        R.pay(st, u, null, JAIL_FINE); R.log(st, `${R.nm(st,u)} 洗了三次澡，付 ${JAIL_FINE} 元出來了`); }
    } else {
      if(dbl){ p.dbl = (p.dbl||0) + 1; if(p.dbl >= 3){ R.log(st, `${R.nm(st,u)} 連續三次一樣點數，太興奮被抓去洗澡！`); R.toJail(st, u); st.phase = "end"; return; } st.rolledDouble = true; }
      else p.dbl = 0;
      R.log(st, `${R.nm(st,u)} 擲出 ${d[0]} + ${d[1]} = ${sum}`);
    }
    R.moveTo(st, u, (p.pos + sum) % N, true);
    R.land(st, u, sum);
    R.settle(st, u);
  },
  endTurn(st, u){ const o = R.other(st, u); st.players[u].dbl = 0; st.turn = o; st.phase = st.players[o].money < 0 ? "debt" : "roll"; st.rolledDouble = false; st.turns++; st.card = null; st.move = null; },
  canBuild(st, u, i){ const s = SQ[i], o = st.owned[i]; if(!s.house || !o || o.by!==u || o.mort || (o.h||0) >= 5) return false;
    if(!R.ownsGroup(st, u, s.g)) return false; const gs = R.groupSquares(s.g); if(gs.some(j=>st.owned[j].mort)) return false;
    return (o.h||0) <= Math.min(...gs.map(j=>st.owned[j].h||0)); },
  canSell(st, u, i){ const s = SQ[i], o = st.owned[i]; if(!o || o.by!==u || !(o.h > 0)) return false; const gs = R.groupSquares(s.g); return o.h >= Math.max(...gs.map(j=>st.owned[j].h||0)); },
  canMort(st, u, i){ const o = st.owned[i]; if(!o || o.by!==u || o.mort) return false; const s = SQ[i]; if(s.g && R.groupSquares(s.g).some(j=>st.owned[j] && st.owned[j].h > 0)) return false; return true; },
  finish(st, reason, loser){ const [a, b] = st.order; let win;
    if(loser) win = R.other(st, loser); else { const wa = R.worth(st, a), wb = R.worth(st, b); win = wa >= wb ? a : b; }
    st.over = { win, reason, at:Date.now(), worth:{ [a]:R.worth(st,a), [b]:R.worth(st,b) } }; st.phase = "over"; },
};

// ---------- pixel icons for the special squares ----------
const ICONS = {
  go:     [["..OO......","..ORO.....","..ORRO....","..ORRRO...","..ORRO....","..ORO.....","..OO......","..O.......","..O.......",".OOO......"], { R:"#e5486a" }],
  jail:   [["...WW.W...","..W.WW.W..",".OOOOOOOO.","OBBBBBBBBO","OBWBBWBBBO","OBBBBBBBBO",".OBBBBBBO.","..O....O.."], { B:"#8fd0f5", W:"#ffffff" }],
  park:   [["....Y.....",".Y.YYY.Y..","..YYYYY...","YYYYYYYYY.","..YYYYY...",".Y.YYY.Y..","....Y....."], { Y:"#ffcf4a" }],
  gojail: [["OOOOOOO...","O.....O...","OOOOOOO...","..B.B.B...",".B.B.B....","..B.B.B...",".OOOOOOOO.","OPPPPPPPPO"], { B:"#6fb7e8", P:"#f7a7b8" }],
  chance: [["..OOOO..",".OKKKKO.","OKKOOKKO","....OKKO","...OKKO.","...OKO..","........","...OKO..","...OOO.."], { K:"#ffcf4a" }],
  chest:  [["..OOOOOO..",".OYYYYYYO.","OOOOOOOOOO","OYYYOOYYYO","OYYYOKOYYO","OYYYYYYYYO","OOOOOOOOOO"], { Y:"#d9a066", K:"#ffcf4a" }],
  tax:    [["...G.G...","..GGGGG..","...GGG...","....G....","..OOOOO..",".OYYYYYO.",".OYOYOYO.",".OYYYYYO.","..OOOOO.."], { G:"#5cb87a", Y:"#ffd36b" }],
  st:     [[".OOOOOOOO.","OBBBBBBBBO","OBWWBBWWBO","OBWWBBWWBO","OBBBBBBBBO","OYBBBBBBYO","OOOOOOOOOO",".OO....OO."], { B:"#6fb7e8", W:"#e9f6ff", Y:"#ffd36b" }],
  util:   [["....OO....","...OWWO...","..OOOOOO..","..OKKKKO..","..OKWWKO..","..OKKKKO..","..OKKKKO..","..OOOOOO.."], { W:"#d6dbe3", K:"#f0708d" }],
  house:  [["...OO...","..OGGO..",".OGGGGO.","OOOOOOOO",".OGGGGO.",".OGOOGO.",".OOOOOO."], { G:"#5cb87a" }],
  hotel:  [["..OOOO..",".ORRRRO.","OOOOOOOO","OWROORWO","ORRRRRRO","ORRWWRRO","OOOOOOOO"], { R:"#e5486a", W:"#fff3a0" }],
};
const px = (rows, pal) => { const w = rows[0].length, h = rows.length; let r = "";
  rows.forEach((row,y)=>[...row].forEach((c,x)=>{ const col = c==="O" ? O : pal[c]; if(col) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${col}"/>`; }));
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${pxC(r)}</svg>`; };
const icon = k => px(ICONS[k][0], ICONS[k][1]);
const DIE = n => { const dots = { 1:[[2,2]], 2:[[1,1],[3,3]], 3:[[1,1],[2,2],[3,3]], 4:[[1,1],[3,1],[1,3],[3,3]], 5:[[1,1],[3,1],[2,2],[1,3],[3,3]], 6:[[1,1],[3,1],[1,2],[3,2],[1,3],[3,3]] }[n] || [];
  return `<svg viewBox="0 0 5 5" shape-rendering="crispEdges"><rect width="5" height="5" fill="${O}"/><rect x=".4" y=".4" width="4.2" height="4.2" fill="#fff"/>${dots.map(([x,y])=>`<rect x="${x-.35}" y="${y-.35}" width=".7" height=".7" fill="${n===1?"#e5486a":O}"/>`).join("")}</svg>`; };

App.registerGame({
  id: "mono",
  name: "喵喵大富翁",
  desc: "擲骰子買地蓋房子，橫向全螢幕",
  icon: () => Pix.sprite("orange","love"),
  mount(el, ctx){
    const { sprite, esc, SFX } = ctx;
    let s = null, shown = null, anim = null, full = null, alive = true;
    this._rs = ctx.restartable("mono", { title:"喵喵大富翁", done: ()=>!s || !!s.over, run: async ()=>{ await newGame(); } });
    const me = () => ctx.me.uid;
    const pnm = u => u===me() ? "你" : ctx.nameOf(u);
    const myTurn = () => s && !s.over && s.turn === me();
    const money = n => `${n < 0 ? "-" : ""}💰${Math.abs(n)}`;
    async function act(fn, note){ const ns = await ctx.update("mono", st=>{ if(!st || st.over) return undefined; st = JSON.parse(JSON.stringify(st)); st.names = st.names || {}; st.order.forEach(u=>st.names[u] = ctx.nameOf(u)); if(fn(st) === false) return undefined; return st; }); if(ns && note) note(ns); return ns; }

    // ---------- lobby (in the normal page) ----------
    function lobby(){
      const g = s && !s.over;
      el.innerHTML = `<div class="box mnLobby">
        <div class="mnLogo"><span class="mnL1">喵喵</span><span class="mnL2">大富翁</span><div class="mnLogoCats">${sprite(ctx.catOf(ctx.players()[0])||"orange","love")}<span class="mnDiceL">${DIE(5)}${DIE(3)}</span>${sprite(ctx.catOf(ctx.players()[1])||"white","love")}</div></div>
        <p class="mnIntro">兩個人輪流擲骰子，買地、蓋房子、收租金！<br>把對方的錢收光就贏了 (๑•̀ㅂ•́)و✧</p>
        <div class="mnRules"><span>🏠 買下整組顏色，租金加倍、可以蓋房子</span><span>🏨 蓋滿 4 間房子可以升級旅館</span><span>❓ 喵喵機會、小窩寶箱有各種驚喜</span><span>🛁 被抓去洗澡要擲出一樣的點數才能出來</span><span>🤝 可以跟對方交易地產</span><span>📱 不用同時在線，輪到你再玩就好</span></div>
        ${g ? `<div class="mnNow">${s.turn===me() ? "🎲 現在輪到<b>你</b>！" : `等 <b>${esc(ctx.nameOf(s.turn))}</b> 擲骰子中…`}・第 ${s.turns+1} 回合</div>` : ""}
        <button class="btn mnGo" id="mnGo">${g ? "🎲 進入遊戲（橫向全螢幕）" : "🎲 開始新的一局"}</button>
        ${g ? `<button class="btn sub" id="mnNew" style="width:100%;margin-top:8px">重新開一局</button>` : ""}
        ${s && s.over ? `<div class="k" style="text-align:center">上一局：${esc(ctx.nameOf(s.over.win))} 贏了！</div>` : ""}
        <div class="k" style="text-align:center">把手機橫過來玩比較好看喔</div></div>`;
      el.querySelector("#mnGo").addEventListener("click", async ()=>{
        if(!ctx.partner()){ ctx.toast("要等 ta 加入小窩才能玩喔"); return; }
        SFX.select(); if(!g) await newGame(); openFull(); });
      const nb = el.querySelector("#mnNew"); if(nb) nb.addEventListener("click", ()=>{ SFX.tap(); ctx.askRestart("mono"); });
    }
    async function newGame(){
      const ids = ctx.players(); if(ids.length < 2) return;
      await ctx.update("mono", ()=>{ const st = R.fresh(ids.slice().sort(()=>Math.random()-.5)); st.names = {}; ids.forEach(u=>st.names[u] = ctx.nameOf(u)); R.log(st, `新的一局開始！${st.names[st.turn]} 先擲骰子`); return st; });
      ctx.notifyPartner(`${ctx.me.name} 開了一局「喵喵大富翁」，快來擲骰子！`);
    }

    // ---------- fullscreen landscape ----------
    function openFull(){
      if(full) return;
      full = document.createElement("div"); full.className = "mnFull";
      full.innerHTML = `<div class="mnStage" id="mnStage"><div class="mnBoard" id="mnBoard"></div><div class="mnSide" id="mnSide"></div><div class="mnPop hidden" id="mnPop"></div></div>`;
      document.body.appendChild(full); document.body.classList.add("rnLock");
      (async()=>{ try{ if(document.documentElement.requestFullscreen && !document.fullscreenElement) await document.documentElement.requestFullscreen({ navigationUI:"hide" }); }catch(e){}
        try{ if(screen.orientation && screen.orientation.lock) await screen.orientation.lock("landscape"); }catch(e){} setTimeout(layout, 80); setTimeout(layout, 450); })();
      window.addEventListener("resize", layout);
      shown = null; buildBoard(); layout(); render(true);
    }
    async function closeFull(){
      if(!full) return; full.remove(); full = null; document.body.classList.remove("rnLock"); window.removeEventListener("resize", layout);
      try{ if(screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }catch(e){}
      try{ if(document.fullscreenElement) await document.exitFullscreen(); }catch(e){}
      lobby();
    }
    function layout(){
      if(!full) return; const st = full.querySelector("#mnStage");
      const vw = window.innerWidth, vh = window.innerHeight, portrait = vh > vw, long = portrait ? vh : vw, short = portrait ? vw : vh;
      st.classList.toggle("rot", portrait); st.style.width = long + "px"; st.style.height = short + "px";
      const cell = Math.floor(Math.min((short - 12)/8, (long*.64)/12)); st.style.setProperty("--c", cell + "px");
      placeTokens(true);
    }

    // ---------- the board ----------
    function sqHtml(i){
      const sq = SQ[i], [c, r] = cellOf(i), side = r===7 ? "b" : r===0 ? "t" : c===0 ? "l" : "r", corner = [0,11,18,29].includes(i);
      const band = sq.t==="prop" ? `<i class="band" style="background:${GROUPS[sq.g].c}"></i>` : "";
      const ic = sq.t==="prop" ? "" : `<span class="ic">${icon(sq.t)}</span>`;
      const price = sq.t==="tax" ? `<em>-${sq.amt}</em>` : buyable(i) ? `<em>${sq.price}</em>` : "";
      return `<div class="sq ${sq.t} ${side} ${corner?"corner":""}" data-i="${i}" style="grid-column:${c+1};grid-row:${r+1}">${band}${ic}<b>${esc(sq.n)}</b>${price}<span class="own" id="own${i}"></span><span class="bld" id="bld${i}"></span></div>`;
    }
    function buildBoard(){
      const b = full.querySelector("#mnBoard");
      b.innerHTML = SQ.map((_,i)=>sqHtml(i)).join("") + `<div class="mnCenter" id="mnCenter"><div class="mnBrand"><span>喵喵</span><span>大富翁</span></div><div class="mnDice" id="mnDice"></div><div class="mnCard" id="mnCard"></div><div class="mnDeco">${sprite("calico","happy")}${sprite("gray","sleep")}</div></div><div class="tokens" id="mnTokens"></div>`;
      b.querySelectorAll(".sq").forEach(x=>x.addEventListener("click", ()=>{ SFX.tap(); info(+x.dataset.i); }));
      const tk = b.querySelector("#mnTokens");
      tk.innerHTML = (s ? s.order : []).map((u,k)=>`<div class="tok k${k}" data-u="${u}">${sprite(ctx.catOf(u)||"orange","happy")}</div>`).join("");
    }
    const tokPos = {};
    function placeTokens(now){
      if(!full || !s) return;
      s.order.forEach((u,k)=>{ const t = full.querySelector(`.tok[data-u="${u}"]`); if(!t) return; const pos = anim && anim.u===u ? anim.cur : s.players[u].pos; setTok(t, pos, k, now); });
    }
    function setTok(t, pos, k, now){
      const cell = full.querySelector(`.sq[data-i="${pos}"]`); if(!cell) return;
      const x = cell.offsetLeft + cell.offsetWidth*(k ? .66 : .34), y = cell.offsetTop + cell.offsetHeight*.56;
      t.style.transition = now ? "none" : ""; t.style.transform = `translate(${x}px, ${y}px)`;
    }
    // walk the token square by square when somebody moved
    function animateMove(mv){
      const u = mv.u, k = s.order.indexOf(u), t = full && full.querySelector(`.tok[data-u="${u}"]`); if(!t){ placeTokens(true); return Promise.resolve(); }
      const path = []; if(mv.steps){ let p = mv.from; while(p !== mv.to && path.length < 40){ p = (p + 1) % N; path.push(p); } } else path.push(mv.to);
      anim = { u, cur: mv.from };
      return new Promise(res=>{ let i = 0; const step = () => { if(!full){ anim = null; return res(); } if(i >= path.length){ anim = null; placeTokens(); return res(); }
        anim.cur = path[i++]; setTok(t, anim.cur, k); t.classList.remove("hop"); void t.offsetWidth; t.classList.add("hop"); SFX.key && SFX.key(1.1); setTimeout(step, mv.steps ? 170 : 420); }; step(); });
    }

    // ---------- render ----------
    async function render(first){
      if(!full || !s) return;
      const prev = shown; shown = JSON.parse(JSON.stringify(s));
      // ownership & buildings
      for(let i=0;i<N;i++){ const o = s.owned[i], own = full.querySelector("#own"+i), bld = full.querySelector("#bld"+i); if(!own) continue;
        own.innerHTML = o ? `<span class="${s.order.indexOf(o.by) ? "pB" : "pA"} ${o.mort?"mort":""}">${sprite(ctx.catOf(o.by)||"orange","normal")}</span>` : "";
        bld.innerHTML = o && o.h ? (o.h===5 ? `<i>${icon("hotel")}</i>` : Array(o.h).fill(`<i>${icon("house")}</i>`).join("")) : "";
        full.querySelector(`.sq[data-i="${i}"]`).classList.toggle("owned", !!o); }
      // dice + movement animation
      const newRoll = s.dice && (!prev || !prev.dice || prev.dice.at !== s.dice.at);
      if(newRoll && !first){ await rollAnim(s.dice.d); }
      else drawDice();
      if(s.move && (!prev || !prev.move || prev.move.at !== s.move.at) && !first){ await animateMove(s.move); } else placeTokens(true);
      drawCard(prev, first);
      side();
      if(s.trade && s.trade.to === me() && (!prev || !prev.trade || prev.trade.at !== s.trade.at)) tradeIncoming();
      if(s.over && (!prev || !prev.over)) showOver();
    }
    function drawDice(){ const d = full && full.querySelector("#mnDice"); if(!d) return; d.innerHTML = s.dice ? `<span>${DIE(s.dice.d[0])}</span><span>${DIE(s.dice.d[1])}</span>` : `<span>${DIE(6)}</span><span>${DIE(6)}</span>`; }
    function rollAnim(final){
      return new Promise(res=>{ const d = full.querySelector("#mnDice"); let n = 0; d.classList.add("rolling"); SFX.toggle ? SFX.toggle() : SFX.tap();
        const tick = () => { if(!full){ return res(); } if(n++ < 9){ d.innerHTML = `<span>${DIE(1 + (Math.random()*6|0))}</span><span>${DIE(1 + (Math.random()*6|0))}</span>`; setTimeout(tick, 60); }
          else { d.classList.remove("rolling"); d.innerHTML = `<span>${DIE(final[0])}</span><span>${DIE(final[1])}</span>`; if(final[0]===final[1]) SFX.combo ? SFX.combo() : SFX.coin(); res(); } }; tick(); });
    }
    function drawCard(prev, first){
      const box = full.querySelector("#mnCard"); if(!box) return;
      if(s.card){ const c = (s.card.kind==="chance" ? CHANCE : CHEST)[s.card.id];
        box.innerHTML = `<div class="card ${s.card.kind}"><b>${s.card.kind==="chance" ? "❓ 喵喵機會" : "🎁 小窩寶箱"}</b><p>${esc(c.t)}</p><i>${esc(pnm(s.card.by))}抽到的</i></div>`;
        if(!first && (!prev || !prev.card || prev.card.at !== s.card.at)){ box.firstChild.animate([{ transform:"rotateY(90deg) scale(.6)" }, { transform:"none" }], { duration:420, easing:"ease-out" }); SFX.heart(); } }
      else { const L = s.log[s.log.length-1]; box.innerHTML = L ? `<div class="lastLog">${esc(L.t)}</div>` : ""; }
    }
    function side(){
      const box = full.querySelector("#mnSide"); if(!box) return;
      const pl = s.order.map((u,k)=>{ const p = s.players[u], n = Object.keys(s.owned).filter(i=>s.owned[i].by===u).length;
        return `<div class="pl k${k} ${s.turn===u && !s.over ? "on" : ""}">${sprite(ctx.catOf(u)||"orange", s.turn===u ? "happy" : "normal")}<div><b>${esc(pnm(u))}</b><span class="${p.money<0?"neg":""}">${money(p.money)}</span><i>🏠${n}${p.jail?"・🛁洗澡中":""}${p.cards?`・🎫${p.cards}`:""}</i></div></div>`; }).join("");
      let acts = "";
      const p = s.players[me()];
      if(s.over) acts = `<div class="msg">${esc(ctx.nameOf(s.over.win))} 贏了！</div><button class="btn" data-a="again">再玩一局</button>`;
      else if(!myTurn()) acts = `<div class="msg">等 ${esc(ctx.nameOf(s.turn))} ${s.phase==="buy" ? "決定要不要買…" : s.phase==="debt" ? "想辦法還錢…" : "擲骰子…"}</div>`;
      else if(s.phase==="roll"){
        if(p.jail > 0) acts = `<div class="msg">🛁 你在洗澡間（還要 ${p.jail} 次）</div><button class="btn big" data-a="roll">🎲 擲骰子（一樣點數就出來）</button><button class="btn sub" data-a="fine" ${p.money < JAIL_FINE ? "disabled" : ""}>付 ${JAIL_FINE} 元出來</button>${p.cards ? `<button class="btn sub" data-a="card">用免洗澡卡</button>` : ""}`;
        else acts = `<button class="btn big" data-a="roll">🎲 擲骰子${s.rolledDouble ? "（一樣點數，再擲一次！）" : ""}</button>`;
      }
      else if(s.phase==="buy"){ const i = p.pos, sq = SQ[i];
        acts = `<div class="buyCard">${cardHtml(i)}</div><button class="btn big" data-a="buy" ${p.money < sq.price ? "disabled" : ""}>買下（💰${sq.price}）</button><button class="btn sub" data-a="pass">不買</button>`; }
      else if(s.phase==="end") acts = `<button class="btn big" data-a="end">結束回合 ➜</button>`;
      else if(s.phase==="debt") acts = `<div class="msg neg">錢不夠！還差 💰${-p.money}<br>把房子賣掉或抵押地產來還錢</div><button class="btn" data-a="assets">💼 管理資產</button>${R.liquid(s, me()) < 0 ? `<button class="btn sub" data-a="bankrupt">宣告破產</button>` : ""}<button class="btn" data-a="paid" ${p.money < 0 ? "disabled" : ""}>錢還好了 ➜</button>`;
      const tools = s.over ? `<div class="tools"><button class="btn sub" data-a="log">📜 紀錄</button><button class="btn sub" data-a="leave">⬅ 離開</button></div>` : `<div class="tools"><button class="btn sub" data-a="assets">💼 資產</button><button class="btn sub" data-a="trade" ${myTurn() && (s.phase==="end"||s.phase==="roll") ? "" : "disabled"}>🤝 交易</button><button class="btn sub" data-a="log">📜 紀錄</button><button class="btn sub" data-a="finish">🏁 結算</button><button class="btn sub" data-a="leave">⬅ 離開</button></div>`;
      box.innerHTML = `<div class="pls">${pl}</div><div class="acts">${acts}</div>${tools}`;
      box.querySelectorAll("[data-a]").forEach(b=>b.addEventListener("click", ()=>{ SFX.tap(); doAct(b.dataset.a, b); }));
    }
    function cardHtml(i){
      const sq = SQ[i], o = s && s.owned[i];
      const head = sq.t==="prop" ? `<div class="pcHead" style="background:${GROUPS[sq.g].c}">${esc(sq.n)}</div>` : `<div class="pcHead other"><span>${icon(sq.t)}</span>${esc(sq.n)}</div>`;
      let body = "";
      if(sq.t==="prop") body = `<table><tr><td>租金</td><td>${sq.rent[0]}</td></tr><tr><td>整組顏色</td><td>${sq.rent[0]*2}</td></tr>${[1,2,3,4].map(h=>`<tr><td>${h} 間房子</td><td>${sq.rent[h]}</td></tr>`).join("")}<tr><td>旅館</td><td>${sq.rent[5]}</td></tr></table><p>蓋一間房子 💰${sq.house}・抵押 💰${sq.price/2}</p>`;
      if(sq.t==="st") body = `<table><tr><td>有 1 站</td><td>25</td></tr><tr><td>有 2 站</td><td>50</td></tr><tr><td>有 3 站</td><td>100</td></tr><tr><td>有 4 站</td><td>200</td></tr></table><p>抵押 💰100</p>`;
      if(sq.t==="util") body = `<p>有 1 間：骰子點數 × 4<br>2 間都有：骰子點數 × 10</p><p>抵押 💰75</p>`;
      if(sq.t==="tax") body = `<p>走到這裡要繳 💰${sq.amt}</p>`;
      if(sq.t==="go") body = `<p>每次經過起點，領 💰${GO_MONEY}</p>`;
      if(sq.t==="jail") body = `<p>被抓來洗澡的話，要擲出一樣的點數、付 ${JAIL_FINE} 元，或用免洗澡卡才能出來。<br>只是路過的話沒事～</p>`;
      if(sq.t==="gojail") body = `<p>走到這裡會被直接抓去洗澡間 🛁</p>`;
      if(sq.t==="park") body = `<p>在這裡曬曬太陽，什麼事都不會發生 ☀️</p>`;
      if(sq.t==="chance" || sq.t==="chest") body = `<p>抽一張卡，可能有好事也可能有壞事！</p>`;
      const price = buyable(i) ? `<div class="pcPrice">價格 💰${priceOf(i)}</div>` : "";
      const owner = o ? `<div class="pcOwner">${sprite(ctx.catOf(o.by)||"orange","normal")}${esc(pnm(o.by))}的${o.mort ? "（抵押中）" : ""}${o.h ? `・${o.h===5 ? "旅館" : o.h + " 間房子"}` : ""}</div>` : "";
      return `<div class="pCard">${head}${price}${body}${owner}</div>`;
    }
    function pop(html, cls){ const p = full.querySelector("#mnPop"); p.className = "mnPop " + (cls||""); p.innerHTML = `<div class="mnPopBox">${html}</div>`;
      p.onclick = e=>{ if(e.target===p || e.target.closest("[data-close]")) p.className = "mnPop hidden"; }; return p; }
    function info(i){ pop(cardHtml(i) + `<button class="btn" data-close>關閉</button>`); }

    // ---------- actions ----------
    async function doAct(a, btn){
      const u = me();
      if(a==="roll"){ await act(st=>{ if(st.turn!==u || st.phase!=="roll") return false; R.roll(st, u); }, ns=>{ if(ns.turn!==u) ctx.notifyPartner(`輪到你在「喵喵大富翁」擲骰子囉！`); }); return; }
      if(a==="fine"){ await act(st=>{ const p = st.players[u]; if(st.turn!==u || !p.jail || p.money < JAIL_FINE) return false; p.money -= JAIL_FINE; p.jail = 0; R.log(st, `${R.nm(st,u)} 付了 ${JAIL_FINE} 元，洗好澡出來了`); }); return; }
      if(a==="card"){ await act(st=>{ const p = st.players[u]; if(st.turn!==u || !p.jail || !p.cards) return false; p.cards--; p.jail = 0; R.log(st, `${R.nm(st,u)} 用了免洗澡卡`); }); return; }
      if(a==="buy"){ await act(st=>{ const p = st.players[u], i = p.pos; if(st.turn!==u || st.phase!=="buy" || st.owned[i] || p.money < priceOf(i)) return false; p.money -= priceOf(i); st.owned[i] = { by:u, h:0, mort:false }; R.log(st, `${R.nm(st,u)} 買下了「${SQ[i].n}」🏠`); st.phase = "x"; R.settle(st, u); }); SFX.coin(); ctx.burst(); return; }
      if(a==="pass"){ await act(st=>{ if(st.turn!==u || st.phase!=="buy") return false; R.log(st, `${R.nm(st,u)} 沒有買「${SQ[st.players[u].pos].n}」`); st.phase = "x"; R.settle(st, u); }); return; }
      if(a==="end"){ await act(st=>{ if(st.turn!==u || st.phase!=="end") return false; R.endTurn(st, u); }); ctx.notifyPartner(`輪到你在「喵喵大富翁」擲骰子囉！`); return; }
      if(a==="paid"){ await act(st=>{ if(st.turn!==u || st.phase!=="debt" || st.players[u].money < 0) return false; st.phase = "x"; R.settle(st, u); }); return; }
      if(a==="bankrupt"){ if(!btn.classList.contains("ask")){ btn.classList.add("ask"); btn.textContent = "確定要破產嗎？"; return; } await act(st=>{ R.log(st, `${R.nm(st,u)} 破產了 😿`); R.finish(st, "bankrupt", u); }); return; }
      if(a==="again"){ await newGame(); return; }
      if(a==="leave"){ closeFull(); return; }
      if(a==="assets"){ assets(); return; }
      if(a==="trade"){ tradeMaker(); return; }
      if(a==="log"){ pop(`<h3>📜 遊戲紀錄</h3><div class="mnLog">${s.log.slice().reverse().map(l=>`<div>${esc(l.t)}</div>`).join("")}</div><button class="btn" data-close>關閉</button>`); return; }
      if(a==="finish"){ pop(`<h3>🏁 結算這一局？</h3><p>現在就結束，比較兩個人的總資產（現金 + 地產 + 房子）決定誰贏。</p><p>你：💰${R.worth(s, u)}・${esc(ctx.nameOf(R.other(s,u)))}：💰${R.worth(s, R.other(s,u))}</p><button class="btn" id="mnFin">結算！</button><button class="btn sub" data-close>再玩一下</button>`);
        full.querySelector("#mnFin").addEventListener("click", async ()=>{ full.querySelector("#mnPop").className = "mnPop hidden"; await act(st=>{ R.log(st, `${R.nm(st,u)} 按下了結算`); R.finish(st, "worth"); }); }); return; }
    }
    function assets(){
      const u = me(), mine = Object.keys(s.owned).map(Number).filter(i=>s.owned[i].by===u).sort((a,b)=>a-b);
      const row = i => { const sq = SQ[i], o = s.owned[i];
        return `<div class="aRow"><i class="dot" style="background:${sq.g ? GROUPS[sq.g].c : "#ccc"}"></i><b>${esc(sq.n)}</b><span>${o.mort ? "抵押中" : o.h ? (o.h===5 ? "旅館" : o.h + " 間") : ""}</span>
          ${sq.house ? `<button data-b="${i}" ${R.canBuild(s,u,i) && s.players[u].money >= sq.house ? "" : "disabled"}>+🏠 ${sq.house}</button><button data-s="${i}" ${R.canSell(s,u,i) ? "" : "disabled"}>-🏠 +${sq.house/2}</button>` : ""}
          ${o.mort ? `<button data-um="${i}" ${s.players[u].money >= Math.ceil(priceOf(i)/2*1.1) ? "" : "disabled"}>贖回 ${Math.ceil(priceOf(i)/2*1.1)}</button>` : `<button data-m="${i}" ${R.canMort(s,u,i) ? "" : "disabled"}>抵押 +${priceOf(i)/2}</button>`}</div>`; };
      const p = pop(`<h3>💼 我的資產・${money(s.players[u].money)}</h3>${mine.length ? `<div class="aList">${mine.map(row).join("")}</div>` : "<p>還沒有地產喔</p>"}<p class="k">整組顏色都買下才能蓋房子，要平均蓋；4 間房子之後是旅館。抵押可以拿一半的錢，贖回要多付一成。</p><button class="btn" data-close>關閉</button>`, "wide");
      const go = async (fn) => { await act(fn); assets(); };
      p.querySelectorAll("[data-b]").forEach(b=>b.addEventListener("click", ()=>{ const i = +b.dataset.b; SFX.place ? SFX.place() : SFX.tap(); go(st=>{ if(!R.canBuild(st,u,i) || st.players[u].money < SQ[i].house) return false; st.players[u].money -= SQ[i].house; st.owned[i].h = (st.owned[i].h||0) + 1; R.log(st, `${R.nm(st,u)} 在「${SQ[i].n}」蓋了${st.owned[i].h===5 ? "旅館 🏨" : "房子 🏠"}`); }); }));
      p.querySelectorAll("[data-s]").forEach(b=>b.addEventListener("click", ()=>{ const i = +b.dataset.s; go(st=>{ if(!R.canSell(st,u,i)) return false; st.owned[i].h--; st.players[u].money += SQ[i].house/2; R.log(st, `${R.nm(st,u)} 賣掉「${SQ[i].n}」的一間房子`); }); }));
      p.querySelectorAll("[data-m]").forEach(b=>b.addEventListener("click", ()=>{ const i = +b.dataset.m; go(st=>{ if(!R.canMort(st,u,i)) return false; st.owned[i].mort = true; st.players[u].money += priceOf(i)/2; R.log(st, `${R.nm(st,u)} 抵押了「${SQ[i].n}」`); }); }));
      p.querySelectorAll("[data-um]").forEach(b=>b.addEventListener("click", ()=>{ const i = +b.dataset.um, c = Math.ceil(priceOf(i)/2*1.1); go(st=>{ const o = st.owned[i]; if(!o || o.by!==u || !o.mort || st.players[u].money < c) return false; o.mort = false; st.players[u].money -= c; R.log(st, `${R.nm(st,u)} 贖回了「${SQ[i].n}」`); }); }));
    }
    // ---------- trading ----------
    function tradeMaker(){
      const u = me(), o = R.other(s, u), free = by => Object.keys(s.owned).map(Number).filter(i=>s.owned[i].by===by && !(s.owned[i].h > 0));
      const mineL = free(u), theirsL = free(o), pick = { give:new Set(), get:new Set() };
      const chip = (i, k) => `<button class="tChip" data-${k}="${i}"><i style="background:${SQ[i].g ? GROUPS[SQ[i].g].c : "#ccc"}"></i>${esc(SQ[i].n)}${s.owned[i].mort ? "（抵押）" : ""}</button>`;
      const p = pop(`<h3>🤝 跟 ${esc(ctx.nameOf(o))} 交易</h3>
        <div class="tCols"><div><b>我給 ta</b><div class="tChips">${mineL.map(i=>chip(i,"g")).join("") || "<span class=k>沒有可以給的地</span>"}</div><label>＋ 錢 <input id="tGM" type="number" min="0" step="10" value="0"></label></div>
        <div><b>我想要</b><div class="tChips">${theirsL.map(i=>chip(i,"w")).join("") || "<span class=k>ta 沒有可以給的地</span>"}</div><label>＋ 錢 <input id="tWM" type="number" min="0" step="10" value="0"></label></div></div>
        <p class="k">有蓋房子的地要先把房子賣掉才能交易</p><button class="btn" id="tSend">送出交易邀請</button><button class="btn sub" data-close>取消</button>`, "wide");
      p.querySelectorAll("[data-g]").forEach(b=>b.addEventListener("click", ()=>{ const i = +b.dataset.g; pick.give.has(i) ? pick.give.delete(i) : pick.give.add(i); b.classList.toggle("on"); }));
      p.querySelectorAll("[data-w]").forEach(b=>b.addEventListener("click", ()=>{ const i = +b.dataset.w; pick.get.has(i) ? pick.get.delete(i) : pick.get.add(i); b.classList.toggle("on"); }));
      p.querySelector("#tSend").addEventListener("click", async ()=>{
        const gm = Math.max(0, +p.querySelector("#tGM").value|0), wm = Math.max(0, +p.querySelector("#tWM").value|0);
        if(!pick.give.size && !pick.get.size && !gm && !wm){ ctx.toast("先選要交易的東西"); return; }
        if(gm > s.players[u].money){ ctx.toast("你的錢不夠"); return; }
        await act(st=>{ st.trade = { from:u, to:o, give:[...pick.give], get:[...pick.get], gm, wm, at:Date.now() }; R.log(st, `${R.nm(st,u)} 提出了交易邀請 🤝`); });
        p.className = "mnPop hidden"; ctx.toast("交易邀請送出了！"); ctx.notifyPartner(`${ctx.me.name} 在「喵喵大富翁」想跟你交易地產 🤝`);
      });
    }
    function tradeIncoming(){
      const t = s.trade, list = a => a.map(i=>`「${esc(SQ[i].n)}」`).join("、");
      const p = pop(`<h3>🤝 ${esc(ctx.nameOf(t.from))} 想跟你交易</h3><p><b>ta 給你：</b>${list(t.give) || ""}${t.gm ? ` 💰${t.gm}` : ""}${!t.give.length && !t.gm ? "（什麼都沒有）" : ""}</p><p><b>ta 想要：</b>${list(t.get) || ""}${t.wm ? ` 💰${t.wm}` : ""}${!t.get.length && !t.wm ? "（什麼都不要）" : ""}</p>
        <button class="btn" id="tOk">答應</button><button class="btn sub" id="tNo">拒絕</button>`);
      p.querySelector("#tOk").addEventListener("click", async ()=>{ p.className = "mnPop hidden";
        const ok = await act(st=>{ const t = st.trade; if(!t || t.to!==me()) return false; const A = st.players[t.from], Bp = st.players[t.to];
          if(A.money < t.gm || Bp.money < t.wm){ st.trade = null; R.log(st, "交易失敗：錢不夠"); return; }
          if(t.give.some(i=>!st.owned[i] || st.owned[i].by!==t.from || st.owned[i].h) || t.get.some(i=>!st.owned[i] || st.owned[i].by!==t.to || st.owned[i].h)){ st.trade = null; R.log(st, "交易失敗：地產已經變了"); return; }
          t.give.forEach(i=>st.owned[i].by = t.to); t.get.forEach(i=>st.owned[i].by = t.from); A.money += t.wm - t.gm; Bp.money += t.gm - t.wm;
          R.log(st, `${R.nm(st,t.to)} 答應了交易 🤝`); st.trade = null; });
        if(ok){ SFX.match(); ctx.burst(); } });
      p.querySelector("#tNo").addEventListener("click", async ()=>{ p.className = "mnPop hidden"; await act(st=>{ if(!st.trade) return false; R.log(st, `${R.nm(st,st.trade.to)} 拒絕了交易`); st.trade = null; }); });
    }
    function showOver(){
      const o = s.over, w = o.worth || {};
      pop(`<div class="overBox"><div class="overCat">${sprite(ctx.catOf(o.win)||"orange","love")}</div><h3>🏆 ${esc(pnm(o.win))}${o.win===me() ? "贏了！" : " 贏了！"}</h3><p>${o.reason==="bankrupt" ? "對方破產了" : "比總資產"}</p>${s.order.map(u=>`<p>${esc(pnm(u))}：總資產 💰${w[u] != null ? w[u] : R.worth(s,u)}</p>`).join("")}<button class="btn" data-close>好</button></div>`);
      if(o.win===me()){ SFX.match(); ctx.burst(); } else SFX.miss();
    }

    // ---------- state ----------
    this._u = ctx.onState("mono", st=>{ s = st; if(full){ if(!st){ closeFull(); return; } if(shown && shown.run !== st.run){ buildBoard(); layout(); shown = null; render(true); return; } render(false); } else lobby(); });
    this._p = ctx.onPresence(()=>{ if(!full) lobby(); });
    this._close = () => { alive = false; if(full){ full.remove(); full = null; document.body.classList.remove("rnLock"); window.removeEventListener("resize", layout); try{ if(screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }catch(e){} try{ if(document.fullscreenElement) document.exitFullscreen(); }catch(e){} } };
    (async()=>{ const cur = await ctx.getState("mono").catch(()=>null); s = cur ? cur.state : null; lobby(); })();
    if(window.__mock) window.__mn = { R, SQ, get s(){ return s; }, doAct };   // tests only
  },
  unmount(){ if(this._rs) this._rs(); if(this._u) this._u(); if(this._p) this._p(); if(this._close) this._close(); },
});
})();
