// 我們的貓：房間家具＋貓咪飾品（達成條件就解鎖，兩個人一起解鎖）
(function(){
const O = "#5a3b2e";
const px = (rows, pal) => { pal = Object.assign({ O }, pal); const w = Math.max(...rows.map(r=>r.length)), h = rows.length; let r = "";
  rows.forEach((row,y)=>[...row].forEach((c,x)=>{ if(pal[c]) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[c]}"/>`; }));
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${r}</svg>`; };

const A = {
  box: [["..OOOO..OOOO..",".OYYYYO.OYYYYO","OOOOOOOOOOOOOO","OYYYYYYYYYYYYO","OYYYYGGGGYYYYO","OYYYYYYYYYYYYO","OYYYYYYYYYYYYO","OOOOOOOOOOOOOO"], { Y:"#d9a066", G:"#b07d45" }],
  scratch: [["OOOOOOOO","OKKKKKKO","OOOOOOOO","..OWWO..","..OSSO..","..OWWO..","..OSSO..","..OWWO..","..OSSO..","..OWWO..","OOOOOOOO","OKKKKKKO","OOOOOOOO"], { K:"#f7a7b8", W:"#e6c48f", S:"#c9a46a" }],
  tree: [["OOOOOOOO........","OKKKKKKO........","OOOOOOOO........","...OSO..........","...OSO....OOOOOO","...OSO....OKKKKO","...OSO....OOOOOO","...OSO......OSO.","...OSO......OSO.","OOOOOOOOOOOOOOOO","OKKKKKKKKKKKKKKO","OOOOOOOOOOOOOOOO"], { K:"#a9d4f5", S:"#c9a46a" }],
  beanbag: [["....OOOOOO....","..OOPPPPPPOO..",".OPPPPWPPPPPO.","OPPPPPPPPPPPPO","OPPPPPPPPPPPPO","OPPPPPPPPPPPPO",".OOOOOOOOOOOO."], { P:"#f6b06a", W:"#ffd8a8" }],
  throne: [["O....OO....O","OYO.OYYO.OYO","OYYOYYYYOYYO","OYYYYKKYYYYO","OYYYKKKKYYYO","OYYYYYYYYYYO","OOOOOOOOOOOO","OKKKKKKKKKKO","OKKKKKKKKKKO","OOOOOOOOOOOO","OYO......OYO","OOO......OOO"], { Y:"#ffcf4a", K:"#e5486a" }],
  plant: [["....GG.....","..GG.GG.G..",".G.GGG.GG..","..GGGGG.G..","....G.GG...","...OOOOO...","...OPPPO...","...OPPPO...","....OOO...."], { G:"#5cb87a", P:"#e98a5a" }],
  tank: [["OOOOOOOOOOOOOO","OBBBBBBBBBBBBO","OBBBWBBBBBBBBO","OBBYYOBBBBBBBO","OBBBYYBBBBBKBO","OBBBBBBBBBKKBO","OBGBBBBGBBBBBO","OGGGBBGGGBBGGO","OOOOOOOOOOOOOO",".OSO......OSO."], { B:"#bfe3ff", W:"#ffffff", Y:"#ffb04a", K:"#f0708d", G:"#5cb87a", S:"#a0703c" }],
  easel: [["...OOOOOOO...","...OWWWWWO...","...OWKKWWO...","...OWWBBWO...","...OWWWWWO...","...OOOOOOO...","....O...O....","...O.....O...","..O.......O.."], { W:"#ffffff", K:"#f0708d", B:"#6fb7e8" }],
  frame: [["OOOOOOOOOO","OYYYYYYYYO","OYOOOOOOYO","OYOKOOKOYO","OYOKKKKOYO","OYOOKKOOYO","OYOOOOOOYO","OYYYYYYYYO","OOOOOOOOOO"], { Y:"#d9a066", K:"#f0708d" }],
  clock: [["..OOOOO..",".OWWWWWO.","OWWWOWWWO","OWWWOWWWO","OWWWOOOWO","OWWWWWWWO",".OWWWWWO.","..OOOOO.."], { W:"#ffffff" }],
  lights: [["OOOOOOOOOOOOOOOOOOOO",".Y...K...B...Y...K..",".Y...K...B...Y...K..","...O...O...O...O....","...B...Y...K...B....","...B...Y...K...B...."], { Y:"#ffd36b", K:"#f0708d", B:"#6fb7e8" }],
  flags: [["OOOOOOOOOOOOOOOOO","OBO.OKO.OYO.OGO.O",".O...O...O...O..."], { B:"#6fb7e8", K:"#f0708d", Y:"#ffd36b", G:"#5cb87a" }],
  flower: [[".K.Y.K.","KYKYKYK",".K.Y.K.","GGGGGGG","OOOOOOO"], { K:"#f0708d", Y:"#ffd36b", G:"#5cb87a" }],
  doll: [["..OOO..",".OWWWO.","OWEWEWO",".OWWWO.","..OOO..",".OWWWO.","OWWWWWO","O.O.O.O"], { W:"#ffffff", E:"#2b1d18" }],
  // accessories (drawn on the cat)
  bow: [["OO...OO","OKO.OKO","OKKOKKO","OKO.OKO","OO...OO"], { K:"#e5486a" }],
  bell: [["OOOOOOOOO","ORRRRRRRO","OOOOOOOOO","...OYO...","..OYYYO..","..OOOOO.."], { R:"#e5486a", Y:"#ffd36b" }],
  scarf: [["OOOOOOOOOO","OBBWBBWBBO","OOOOOOOBBO",".......OBO",".......OOO"], { B:"#6fb7e8", W:"#ffffff" }],
  pearls: [["OW.......WO",".OW.....WO.","..OWOWOWO..","....OKO....",".....O....."], { W:"#ffffff", K:"#f7a7b8" }],
  straw: [["...OOOO...","..OYYYYO..","..ORRRRO..","OOOYYYYOOO","OYYYYYYYYO","OOOOOOOOOO"], { Y:"#f0cf7a", R:"#e5486a" }],
  crown: [["O..O..O","OO.O.OO","OYOYOYO","OYYYYYO","OYKYKYO","OOOOOOO"], { Y:"#ffcf4a", K:"#e5486a" }],
  wizard: [[".....OO..",".....OPO.","....OPPO.","...OPYPO.","...OPPPPO","..OPPPPPO","OOOOOOOOO"], { P:"#9b6fd6", Y:"#ffd36b" }],
  phones: [["..OOOOO..",".O.....O.","O.......O","OKO...OKO","OKO...OKO","OOO...OOO"], { K:"#f0708d" }],
  santa: [["......OO.","....OOWWO","..OORRO..",".ORRRRO..","ORRRRRRO.","OWWWWWWO.","OOOOOOOO."], { R:"#e5486a", W:"#ffffff" }],
  wreath: [[".K.Y.K.Y.K.","KYKGKYKGKYK","GGGGGGGGGGG",".G.......G."], { G:"#5cb87a", K:"#f0708d", Y:"#ffd36b" }],
};
const art = id => A[id] ? px(A[id][0], A[id][1]) : "";

// m = metrics computed by the pet room
const ITEMS = [
  // furniture: slot decides where it goes in the room (one item per slot)
  { id:"scratch", k:"f", slot:"floorL", n:"貓抓板", need:"一開始就有", ok:m=>true },
  { id:"box", k:"f", slot:"floorR", n:"紙箱", need:"一開始就有", ok:m=>true },
  { id:"tree", k:"f", slot:"floorL", n:"貓跳台", need:"貓咪成長值加起來 30", ok:m=>m.exp>=30, p:m=>m.exp/30 },
  { id:"beanbag", k:"f", slot:"floorL", n:"懶骨頭", need:"默契大考驗答對 15 題", ok:m=>m.moqi>=15, p:m=>m.moqi/15 },
  { id:"throne", k:"f", slot:"floorL", n:"貓咪王座", need:"有一隻長大成貓咪大王", ok:m=>m.stage>=4, p:m=>m.stage/4 },
  { id:"plant", k:"f", slot:"floorR", n:"小盆栽", need:"早安晚安一起打卡 5 次", ok:m=>m.daily>=5, p:m=>m.daily/5 },
  { id:"tank", k:"f", slot:"floorR", n:"魚缸", need:"釣魚圖鑑收集 60 種", ok:m=>m.dex>=60, p:m=>m.dex/60 },
  { id:"easel", k:"f", slot:"floorR", n:"畫架", need:"你畫我猜答對 10 題", ok:m=>m.draw>=10, p:m=>m.draw/10 },
  { id:"frame", k:"f", slot:"wallL", n:"愛心相框", need:"相簿放了 10 張照片", ok:m=>m.photos>=10, p:m=>m.photos/10 },
  { id:"clock", k:"f", slot:"wallL", n:"小時鐘", need:"領養滿 7 天", ok:m=>m.days>=7, p:m=>m.days/7 },
  { id:"lights", k:"f", slot:"wallR", n:"星星燈串", need:"早安或晚安連續 7 天", ok:m=>m.streak>=7, p:m=>m.streak/7 },
  { id:"flags", k:"f", slot:"wallR", n:"彩色小旗子", need:"釣魚圖鑑收集 30 種", ok:m=>m.dex>=30, p:m=>m.dex/30 },
  { id:"flower", k:"f", slot:"window", n:"窗台小花", need:"養兩隻貓", ok:m=>m.cats>=2, p:m=>m.cats/2 },
  { id:"doll", k:"f", slot:"window", n:"晴天娃娃", need:"早安晚安一起打卡 20 次", ok:m=>m.daily>=20, p:m=>m.daily/20 },
  { id:"rugHeart", k:"f", slot:"rug", n:"愛心地毯", need:"默契大考驗答對 30 題", ok:m=>m.moqi>=30, p:m=>m.moqi/30, rug:"heart" },
  { id:"rugRainbow", k:"f", slot:"rug", n:"彩虹地毯", need:"一起和好過 1 次", ok:m=>m.makeup>=1, p:m=>m.makeup, rug:"rainbow" },
  // accessories: hat or neck, per cat
  { id:"bow", k:"a", slot:"neck", n:"紅色蝴蝶結", need:"一開始就有", ok:m=>true },
  { id:"bell", k:"a", slot:"neck", n:"鈴鐺項圈", need:"貓咪成長值加起來 10", ok:m=>m.exp>=10, p:m=>m.exp/10 },
  { id:"scarf", k:"a", slot:"neck", n:"小圍巾", need:"早安或晚安連續 14 天", ok:m=>m.streak>=14, p:m=>m.streak/14 },
  { id:"pearls", k:"a", slot:"neck", n:"珍珠項鍊", need:"默契大考驗答對 50 題", ok:m=>m.moqi>=50, p:m=>m.moqi/50 },
  { id:"straw", k:"a", slot:"hat", n:"小草帽", need:"早安晚安一起打卡 10 次", ok:m=>m.daily>=10, p:m=>m.daily/10 },
  { id:"crown", k:"a", slot:"hat", n:"小皇冠", need:"有一隻長大成胖胖貓", ok:m=>m.stage>=3, p:m=>m.stage/3 },
  { id:"wizard", k:"a", slot:"hat", n:"魔法帽", need:"你畫我猜答對 20 題", ok:m=>m.draw>=20, p:m=>m.draw/20 },
  { id:"phones", k:"a", slot:"hat", n:"耳機", need:"釣魚圖鑑收集 100 種", ok:m=>m.dex>=100, p:m=>m.dex/100 },
  { id:"santa", k:"a", slot:"hat", n:"聖誕帽", need:"領養滿 30 天", ok:m=>m.days>=30, p:m=>m.days/30 },
  { id:"wreath", k:"a", slot:"hat", n:"花圈", need:"一起和好過 1 次", ok:m=>m.makeup>=1, p:m=>m.makeup },
];
const BY = Object.fromEntries(ITEMS.map(x=>[x.id,x]));
window.PetDeco = { ITEMS, BY, art };
})();
