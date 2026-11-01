// 遊戲卡片的像素小插圖：一眼看出是玩什麼
(function(){
const O = "#5a3b2e";
const L = (html, css) => `<span class="gaL" style="${css}">${html}</span>`;
const S = (c, f, flip) => Pix.sprite(c, f).replace("<svg", flip ? '<svg style="transform:scaleX(-1)"' : "<svg");
// exact-size pixel svg (no square padding, unlike pix())
const P = (rows, pal) => { pal = Object.assign({ O }, pal); const w = Math.max(...rows.map(r=>r.length)), h = rows.length; let r = "";
  rows.forEach((row,y)=>[...row].forEach((c,x)=>{ if(pal[c]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[c]}"/>`; }));
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${r}</svg>`; };

function board(){
  const n = 15, pts = [2,5,8,11], g = [];
  for(let y=0;y<n;y++){ const r = []; for(let x=0;x<n;x++){
    r.push(x===0||y===0||x===n-1||y===n-1 ? "O" : (pts.includes(x)||pts.includes(y)) ? "G" : "B"); } g.push(r); }
  const stones = [[5,5,"E"],[8,5,"W"],[8,8,"E"],[11,8,"W"],[5,8,"W"],[11,2,"E"],[2,11,"E"]];
  for(const [x,y,c] of stones) for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const X=x+dx, Y=y+dy; if(X>0&&Y>0&&X<n-1&&Y<n-1) g[Y][X] = (dx===0&&dy===0||c==="E") ? c : (c==="W" ? "W" : c); }
  return P(g.map(r=>r.join("")), { B:"#e9bd78", G:"#b8834a", E:"#2b1d18", W:"#ffffff" });
}
const QB = ["..OOOOOOO..",".OWWWWWWWO.","OWWWOOOWWWO","OWWOWWWOWWO","OWWWWWOWWWO","OWWWWOWWWWO","OWWWWOWWWWO",".OWWWWWWWO.","..OOOOOWWO.","......OOO..","....OOOO...","....OWWO...","....OOOO..."];
const PENCIL = [".........OO.","........OKKO",".......OYOKO","......OYYO..",".....OYYO...","....OYYO....","...OYYO.....","..OWWO......",".OWWO.......",".OEO........","OO.........."];
const SHIP = ["......O.........",".....OKO........",".....OKKO.......",".....OKKKO......",".....OOOOOO.....","......O.........","OOOOOOOOOOOOOOOO",".OYYYYYYYYYYYYO.","..OYYEYYEYYEYO..","...OOOOOOOOOO..."];
const WAVES = ["BB..BBB..BBB..BB",".BBBB.BBBB.BBBB.","................","..BB..BBB..BBB.."];
const HAT = ["....OOOOOO....","...OYYYYYYO...","...OYYYYYYO...","...ORRRRRRO...","OOOOYYYYYYOOOO","OYYYYYYYYYYYYO",".OOOOOOOOOOOO."];
const EXCL = ["OOOO","OKKO","OKKO","OKKO","OKKO","OOOO","....","OOOO","OKKO","OOOO"];
const CACTUS = ["...OO...","..OGGO..","..OGGO.O","O.OGGOOG","GOOGGOGO","OGGGGGGO",".OOGGOO.","..OGGO..","..OGGO..","..OGGO.."];
const ROD = ["OO..........","OGO.........",".OGO........","..OGO.......","...OGO......","....OGO.....",".....OGO....","......OGO...",".......OGO..","........OGO.",".........OO."];
const SPARK = ["....O....","...OYO...","O.OYYYO.O",".OYYWYYO.","OYYWWWYYO",".OYYWYYO.","O.OYYYO.O","...OYO...","....O...."];
const CANVAS = ["OOOOOOOOOOOOOO","OWWWWWWWWWWWWO","OWWKKWWWWWWWWO","OWKWWKWWWKKWWO","OWWWWWKWKWWKWO","OWWWWWWKWWWWWO","OWWBBWWWWWWWWO","OWBWWBWWWWBBWO","OWWBBWWWWBWWBO","OWWWWWWWWWBBWO","OOOOOOOOOOOOOO"];
const VAC = ["....OOOO..........OOOO....", "...OBBBBOOOOOOOOOOBBBBO...", "..OBBBBOYYYYYYYYYYOBBBBO..", "..OBBBOYYYYYYYYYYYYOBBBO..", "..OBBOYYLLYYYYYYLLYYOBBO..", "..OBBOYYEEYYYYYYEEYYOBBO..", "..OBBOYYEHYYYYYYEHYYOBBO..", "...OOYYYYYYWWWWYYYYYYOO...", "....OYYCYYWWNNWWYYCYYO....", "....OYYYYWWWNNWWWYYYYO....", "....OYYYWWWWWWWWWWYYYO....", ".....OYYWWWWOOWWWWYYO.....", "......OYWWWOKKOWWWYO......", ".......OOWWWKKWWWOO.......", ".........OOOKKOOO.........", "......OORRRRRRRRRROO......", ".....OYYYYYYGGYYYYYYO.....", "....OYYYYYYYGGYYYYYYYO....", "....OYWWYYYYYYYYYYWWYO....", "....OWWWOYYYYYYYYOWWWO....", "....OOOOO........OOOOO...."];
const VPAL = { Y:"#f5e2c4", B:"#b0784a", W:"#ffffff", E:"#2b1d18", H:"#ffffff", N:"#2b1d18", K:"#f0708d", R:"#e5486a", G:"#ffcf4a", L:"#fff6e6", C:"#f7b0bb" };
const PAL = { K:"#f0708d", W:"#ffffff", Y:"#ffd36b", E:"#2b1d18", B:"#6fb7e8", G:"#6cc49d", R:"#e5486a" };

window.GameArt = {
  moqi: () => L(S("orange","love"), "left:0;bottom:0;width:46%") + L(S("white","love",1), "right:0;bottom:0;width:46%") + L(P(QB, PAL), "left:36%;top:-4%;width:28%"),
  gomoku: () => L(board(), "left:12%;top:4%;width:76%"),
  fight: () => L(S("gray","angry"), "left:-4%;bottom:0;width:50%") + L(S("orange","angry",1), "right:-4%;bottom:0;width:50%") + L(P(SPARK, PAL), "left:38%;top:16%;width:24%"),
  draw: () => L(P(CANVAS, PAL), "left:6%;top:10%;width:70%") + L(P(PENCIL, PAL), "right:2%;bottom:2%;width:40%"),
  battleship: () => L(P(SHIP, PAL), "left:10%;top:8%;width:80%") + L(P(WAVES, PAL), "left:6%;bottom:6%;width:88%"),
  quickdraw: () => L(S("calico","surprised"), "left:4%;bottom:0;width:62%") + L(P(HAT, { Y:"#c98a4a", R:"#e5486a" }), "left:14%;top:4%;width:42%") + L(P(EXCL, PAL), "right:10%;top:10%;width:9%"),
  fishing: () => L(S("white","happy"), "left:0;bottom:0;width:56%") + L(P(ROD, { G:"#a0703c" }), "left:40%;top:0;width:44%") + L(Pix.icon("fish"), "right:0;bottom:8%;width:30%") + `<span class="gaLine"></span>`,
  runaway: () => L(P(VAC, VPAL), "left:2%;bottom:2%;width:44%") + L(S("orange","surprised",1), "right:2%;top:2%;width:46%") + L(P(SPARK, PAL), "left:44%;top:30%;width:14%"),
  runner: () => L(S("white","wave"), "left:4%;top:-4%;width:50%") + L(P(CACTUS, PAL), "right:10%;bottom:6%;width:22%") + `<span class="gaGround"></span>`,
};
})();
