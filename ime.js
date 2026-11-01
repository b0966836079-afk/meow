// 喵喵小窩 內建鍵盤：注音（含選字、詞語聯想）、英文、數字符號、常用語、表情
// 詞庫：zhuyin.txt（由酷音 libchewing 詞庫轉換，LGPL-2.1-or-later）
const IME = (function(){
  const INIT = "ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ", MED = "ㄧㄨㄩ", FIN = "ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ", TONE = "ˊˇˋ˙";
  const ZH_ROWS = ["ㄅㄉˇˋㄓˊ˙ㄚㄞㄢㄦ","ㄆㄊㄍㄐㄔㄗㄧㄛㄟㄣ","ㄇㄋㄎㄑㄕㄘㄨㄜㄠㄤ","ㄈㄌㄏㄒㄖㄙㄩㄝㄡㄥ"];
  const EN_ROWS = ["qwertyuiop","asdfghjkl","zxcvbnm"];
  const SYM_ROWS = [["1","2","3","4","5","6","7","8","9","0"],["，","。","？","！","、","：","；","「","」","…"],["～","（","）","@","#","%","&","+","❤"]];

  const hooks = {};   // hooks.listen(): played when voice input starts (set by app.js)
  // ---------- dictionary ----------
  const EXTRA = [["好想你",["ㄏㄠˇ","ㄒㄧㄤˇ","ㄋㄧˇ"]],["想你了",["ㄒㄧㄤˇ","ㄋㄧˇ","ㄌㄜ˙"]],["抱抱",["ㄅㄠˋ","ㄅㄠˋ"]],["親親",["ㄑㄧㄣ","ㄑㄧㄣ"]],["在幹嘛",["ㄗㄞˋ","ㄍㄢˋ","ㄇㄚˊ"]],
    ["到家了",["ㄉㄠˋ","ㄐㄧㄚ","ㄌㄜ˙"]],["下班了",["ㄒㄧㄚˋ","ㄅㄢ","ㄌㄜ˙"]],["等我",["ㄉㄥˇ","ㄨㄛˇ"]],["睡了嗎",["ㄕㄨㄟˋ","ㄌㄜ˙","ㄇㄚ˙"]],["想我嗎",["ㄒㄧㄤˇ","ㄨㄛˇ","ㄇㄚ˙"]],
    ["我愛你",["ㄨㄛˇ","ㄞˋ","ㄋㄧˇ"]],["愛你",["ㄞˋ","ㄋㄧˇ"]],["晚安",["ㄨㄢˇ","ㄢ"]],["早安",["ㄗㄠˇ","ㄢ"]],["寶貝",["ㄅㄠˇ","ㄅㄟˋ"]],["吃飯了嗎",["ㄔ","ㄈㄢˋ","ㄌㄜ˙","ㄇㄚ˙"]]];
  let dict = null, sylList = [], sylCode = {}, sylParts = [], loading = null;
  function parseSyl(s){ const o={i:"",m:"",f:"",t:""}; for(const ch of s){ if(INIT.includes(ch)) o.i=ch; else if(MED.includes(ch)) o.m=ch; else if(FIN.includes(ch)) o.f=ch; else if(TONE.includes(ch)) o.t=ch; } return o; }
  function load(url){
    if(dict) return Promise.resolve();
    if(loading) return loading;
    loading = fetch(url).then(r=>{ if(!r.ok) throw new Error("dict "+r.status); return r.text(); }).then(txt=>{
      const nl = txt.indexOf("\n");
      sylList = txt.slice(0,nl).split(" ");
      const A = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";
      sylList.forEach((s,i)=>{ sylCode[s] = A[(i/64)|0]+A[i%64]; sylParts[i] = parseSyl(s); });
      dict = new Map();
      let p = nl+1;
      while(p < txt.length){ let e = txt.indexOf("\n",p); if(e<0) e = txt.length; const t = txt.indexOf("\t",p); if(t>0 && t<e) dict.set(txt.slice(p,t), txt.slice(t+1,e)); p = e+1; }
      // couple phrases that should win over more "common" words
      for(const [w, ss] of EXTRA){ let key = ""; for(const x of ss){ const c = sylCode[x]; if(!c){ key = null; break; } key += c; } if(!key) continue;
        const cur = dict.get(key) || ""; if(!cur.split(" ").some(e=>e.split(":")[0]===w)) dict.set(key, (w+":9000000 "+cur).trim()); }
    });
    loading.catch(()=>{ loading = null; });
    return loading;
  }
  const parsed = new Map();
  function lookup(syls){
    let key = "";
    for(const s of syls){ const c = sylCode[s]; if(!c) return []; key += c; }
    if(parsed.has(key)) return parsed.get(key);
    const raw = dict && dict.get(key); if(!raw){ parsed.set(key, []); return []; }
    const out = raw.split(" ").map(x=>{ const k = x.lastIndexOf(":"); return k>0 ? { w:x.slice(0,k), f:+x.slice(k+1) } : { w:x, f:0 }; });
    parsed.set(key, out); return out;
  }
  // a syllable typed without a tone is stored as "ㄋㄧ*" and matches every tone
  function expand(s){ if(!s.endsWith("*")) return sylCode[s] ? [s] : []; const b = s.slice(0,-1); return [b, b+"ˊ", b+"ˇ", b+"ˋ", b+"˙"].filter(v=>sylCode[v]); }
  const anyCache = new Map();
  function lookupAny(syls){
    if(!syls.some(x=>x.endsWith("*"))) return lookup(syls);
    const key = syls.join("|"); if(anyCache.has(key)) return anyCache.get(key);
    let combos = [[]];
    for(const x of syls){ const v = expand(x); if(!v.length){ anyCache.set(key, []); return []; } const nx = []; outer: for(const c of combos) for(const y of v){ nx.push(c.concat([y])); if(nx.length >= 400) break outer; } combos = nx; }
    const best = new Map();
    for(const c of combos) for(const r of lookup(c)){ const o = best.get(r.w); if(!o || r.f > o.f) best.set(r.w, r); }
    const out = [...best.values()].sort((a,b)=>b.f-a.f); anyCache.set(key, out); return out;
  }
  function partialSyls(cur){
    // all known syllables matching what has been typed so far (any tone)
    const res = [];
    sylList.forEach((s,i)=>{ const p = sylParts[i]; if(!p.i && !p.m && !p.f) return;
      if(cur.i && p.i!==cur.i) return; if(!cur.i && p.i && (cur.m||cur.f)) return;
      if(cur.m && p.m!==cur.m) return; if(!cur.m && cur.f && p.m) return;
      if(cur.f && p.f!==cur.f) return; if(!cur.f && cur.m && p.f && !cur.i && false) return;
      res.push(s); });
    return res;
  }
  // best conversion of the syllables: prefer long phrases, then frequent characters
  function convert(syls){
    const n = syls.length; if(!n) return "";
    const best = new Array(n+1).fill(-1e9), back = new Array(n+1); best[0] = 0;
    for(let i=1;i<=n;i++) for(let j=Math.max(0,i-5);j<i;j++){
      if(best[j] < -1e8) continue;
      const c = lookupAny(syls.slice(j,i)); if(!c.length) continue;
      const sc = best[j] + (i-j>1 ? 9*(i-j) : 0) + Math.log((c[0].f||0)+2);
      if(sc > best[i]){ best[i] = sc; back[i] = [j, c[0].w]; }
    }
    if(best[n] < -1e8){ // unknown syllable somewhere: fall back per syllable
      return syls.map(s=>{ const c=lookupAny([s]); return c.length?c[0].w:s.replace("*",""); }).join("");
    }
    let out = "", i = n; while(i>0){ const [j,w] = back[i]; out = w + out; i = j; } return out;
  }

  // ---------- keyboard ----------
  function mount(root, opt){
    let mode = "zh", shift = false;
    const st = { syl: [], cur: {i:"",m:"",f:""} };
    const curStr = () => st.cur.i + st.cur.m + st.cur.f;
    const composing = () => st.syl.length>0 || !!curStr();
    root.innerHTML = `<div class="ime"><span class="ear l"></span><span class="ear r"></span>${opt.mascot?`<span class="mascot">${opt.mascot}</span>`:""}<div class="ime-top"><div class="pre" id="imePre"></div><div class="cands" id="imeCands"></div></div><div class="ime-body" id="imeBody"></div></div>`;
    const imeEl = root.querySelector(".ime");
    const preEl = root.querySelector("#imePre"), candEl = root.querySelector("#imeCands"), body = root.querySelector("#imeBody");
    let dictReady = false;
    load(opt.dictUrl).then(()=>{ dictReady = true; refresh(); }).catch(()=>{ candEl.innerHTML = `<span class="hint">字典載入失敗，請檢查網路後重開聊天室</span>`; });

    function candidates(){
      if(!dictReady) return [];
      const out = [], seen = new Set();
      const add = (w, n, takeCur) => { const k = w+"|"+n+"|"+(takeCur?1:0); if(seen.has(k)) return; seen.add(k); out.push({w, n, takeCur}); };
      const S = st.syl, P = curStr();
      if(P && S.length && expand(P+"*").length){ const whole = convert([...S, P+"*"]); if(whole) add(whole, S.length, true); }
      if(S.length>=2){ const whole = convert(S); if(whole) add(whole, S.length, false); }
      if(P && S.length){ // phrases including the syllable being typed
        for(const ps of partialSyls(st.cur).slice(0,40)) for(const c of lookupAny([...S, ps])) add(c.w, S.length, true);
      }
      for(let k=S.length;k>=2;k--) for(const c of lookupAny(S.slice(0,k))) add(c.w, k, false);
      if(S.length){ for(const c of lookupAny([S[0]]).slice().sort((a,b)=>b.f-a.f)) add(c.w, 1, false); }
      else if(P){
        const all = []; for(const ps of partialSyls(st.cur)) for(const c of lookup([ps])) all.push(c);
        all.sort((a,b)=>b.f-a.f); for(const c of all.slice(0,120)) add(c.w, 0, true);
      }
      return out.slice(0,150);
    }
    function refresh(){
      const conv = dictReady ? convert(st.syl) : st.syl.join("").replace(/\*/g,"");
      preEl.innerHTML = composing() ? `<u>${esc(conv)}</u><b>${esc(curStr())}</b>` : "";
      const cs = candidates();
      if(!composing()){ candEl.innerHTML = `<span class="hint">${dictReady ? (mode==="zh"?"用注音打字，空白鍵＝一聲":"") : "字典載入中…"}</span>${opt.toSys?`<button class="sysk">📱 手機鍵盤</button>`:""}${opt.hide?`<button class="sysk hidek">收起 ▾</button>`:""}`; const sk=candEl.querySelector(".sysk:not(.hidek)"); if(sk) sk.addEventListener("click", ()=>opt.toSys()); const hk=candEl.querySelector(".hidek"); if(hk) hk.addEventListener("click", ()=>opt.hide()); return; }
      candEl.innerHTML = cs.map((c,i)=>`<button data-i="${i}">${esc(c.w)}</button>`).join("") || `<span class="hint">沒有這個音，按 ⌫ 修改</span>`;
      candEl.scrollLeft = 0;
      candEl.querySelectorAll("button").forEach(b=>{ b.addEventListener("pointerdown", ()=>pop(b)); b.addEventListener("click", ()=>pick(cs[+b.dataset.i])); });
    }
    function pick(c){
      opt.commit(c.w);
      st.syl = st.syl.slice(c.n); if(c.takeCur) st.cur = {i:"",m:"",f:""};
      opt.fx("pick", [...c.w].length); refresh();
    }
    function commitAll(){ if(!composing()) return false; if(curStr() && dictReady) finishSyl("*"); const t = (dictReady?convert(st.syl):st.syl.join("")) + curStr(); st.syl=[]; st.cur={i:"",m:"",f:""}; if(t) opt.commit(t); opt.fx("pick",[...t].length); refresh(); return true; }
    function finishSyl(tone){
      const s = curStr(); if(!s) return false;
      st.syl.push(s + (tone||"")); st.cur = {i:"",m:"",f:""};
      if(st.syl.length > 12){ const t = convert(st.syl.slice(0,5)); opt.commit(t); st.syl = st.syl.slice(5); }
      return true;
    }
    function zhKey(k){
      if(TONE.includes(k)){ if(!finishSyl(k)){ /* tone with nothing typed: ignore */ } }
      else if(INIT.includes(k)){ if(st.cur.i||st.cur.m||st.cur.f){ finishSyl("*"); } st.cur.i = k; }
      else if(MED.includes(k)){ if(st.cur.m||st.cur.f){ finishSyl("*"); } st.cur.m = k; }
      else if(FIN.includes(k)){ if(st.cur.f){ finishSyl("*"); } st.cur.f = k; }
      opt.fx("key"); refresh();
    }
    function space(){
      if(mode==="zh" && curStr()){ finishSyl(""); opt.fx("key"); refresh(); return; }
      if(mode==="zh" && composing()){ commitAll(); return; }
      opt.commit(" "); opt.fx("key");
    }
    function back(){
      if(curStr()){ if(st.cur.f) st.cur.f=""; else if(st.cur.m) st.cur.m=""; else st.cur.i=""; }
      else if(st.syl.length){ const last = parseSyl(st.syl.pop()); st.cur = {i:last.i,m:last.m,f:last.f}; }
      else { opt.backspace(); }
      opt.fx("del"); refresh();
    }
    function enter(){ if(commitAll()) return; opt.send(); }

    function key(label, cls, act, bub){ const B = bub!==undefined ? bub : (act ? "" : label); return `<button class="k ${cls||""}" data-a="${act||""}" data-k="${esc(label)}" data-bub="${esc(B)}"><span class="kv">${label}</span></button>`; }
    function draw(){
      let h = "";
      if(mode==="zh"){
        h += ZH_ROWS.map((r,ri)=>`<div class="row r${ri}">${[...r].map(k=>key(k, TONE.includes(k)?"tone":"")).join("")}</div>`).join("");
      } else if(mode==="en"){
        h += EN_ROWS.map((r,i)=>`<div class="row r${i}">${i===2?key("⇧","fn"+(shift?" on":""),"shift"):""}${[...r].map(k=>key(shift?k.toUpperCase():k)).join("")}${i===2?key("⌫","fn","back"):""}</div>`).join("");
      } else if(mode==="sym"){
        h += SYM_ROWS.map((r,i)=>`<div class="row r${i}">${r.map(k=>key(k)).join("")}${i===2?key("⌫","fn","back"):""}</div>`).join("");
      } else if(mode==="fav" || mode==="emo"){
        const list = mode==="fav" ? opt.phrases : opt.emojis;
        h += `<div class="grid ${mode}">${list.map(k=>key(esc(k),"wide","ins")).join("")}</div>`;
      }
      const sw = (m, t) => key(t, "fn sw"+(mode===m?" on":""), "mode:"+m);
      h += `<div class="row bottom">${sw("zh","注")}${sw("en","ABC")}${sw("sym","123")}${sw("fav","♡")}${sw("emo","☺")}${key(art("mic")||"🎤","fn mic","mic","")}${key("ฅ 空白 ฅ","space","space")}${mode==="zh"||mode==="fav"||mode==="emo"?key("⌫","fn","back"):""}${key(composing()?"確定":(opt.enterLabel||"傳送 ฅ"),"send","enter")}</div>`;
      body.innerHTML = h;
      const act = b => {
        const a = b.dataset.a, k = b.dataset.k;
        if(a==="back"){ back(); updEnter(); }
        else if(a==="space"){ space(); updEnter(); }
        else if(a==="enter"){ enter(); draw(); }
        else if(a==="mic"){ mic(); }
        else if(a==="shift"){ shift=!shift; opt.fx("key"); draw(); }
        else if(a.startsWith("mode:")){ commitAll(); mode=a.slice(5); shift=false; opt.fx("key"); draw(); refresh(); }
        else if(a==="ins"){ opt.commit(b.textContent); opt.fx("key", [...b.textContent].length); }
        else if(mode==="zh") { zhKey(k); updEnter(); }
        else { opt.commit(k); opt.fx("key"); if(shift){ shift=false; draw(); } }
      };
      body.querySelectorAll(".k").forEach(b=>{
        if(b.dataset.a==="ins"){ // list keys: a tap must not fire while scrolling the list
          b.addEventListener("pointerdown", ()=>pop(b));
          b.addEventListener("click", ()=>act(b));
          return;
        }
        // act on touch-down: fast, works with two thumbs, and no lost taps from tiny finger slides
        b.addEventListener("pointerdown", e=>{
          if(e.pointerType==="mouse" && e.button) return;
          e.preventDefault();
          b.classList.add("down"); setTimeout(()=>b.classList.remove("down"), 110);
          act(b);
          requestAnimationFrame(()=>{ pop(b); bubble(b); });
          if(b.dataset.a==="back"){ // hold to keep deleting
            clearTimeout(rep.t); clearInterval(rep.i);
            const stop = ()=>{ clearTimeout(rep.t); clearInterval(rep.i); b.removeEventListener("pointerup", stop); b.removeEventListener("pointercancel", stop); b.removeEventListener("pointerleave", stop); };
            b.addEventListener("pointerup", stop); b.addEventListener("pointercancel", stop); b.addEventListener("pointerleave", stop);
            rep.t = setTimeout(()=>{ rep.i = setInterval(()=>{ back(); updEnter(); }, 75); }, 420);
          }
        });
        b.addEventListener("click", e=>{ if(e.detail===0) act(b); }); // keyboard/assistive "click" without a pointer
      });
    }
    const rep = {};
    // ---------- voice input ----------
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let rec = null;
    function micUi(text, cls){
      let ov = imeEl.querySelector(".micOv");
      if(!ov){ ov = document.createElement("div"); ov.className = "micOv";
        ov.innerHTML = `<div class="micCat">${art("cat")||"🐱"}<span class="micWave"><i></i><i></i><i></i></span></div><div class="micTxt"></div><div class="micBtns"><button class="micStop">✔ 好了</button><button class="micX">取消</button></div>`;
        ov.querySelector(".micStop").addEventListener("click", ()=>{ if(rec) rec.stop(); else closeMic(); });
        ov.querySelector(".micX").addEventListener("click", ()=>{ if(rec){ rec._cancel = true; rec.abort(); } closeMic(); });
        imeEl.appendChild(ov); }
      ov.className = "micOv " + (cls||""); ov.querySelector(".micTxt").textContent = text;
    }
    function closeMic(){ const ov = imeEl.querySelector(".micOv"); if(ov) ov.remove(); rec = null; }
    function sysFallback(msg){
      micUi(msg, "info");
      setTimeout(()=>{ closeMic(); if(opt.toSys) opt.toSys(); }, opt.toSys ? 1800 : 2600);
    }
    function mic(){
      commitAll();
      if(rec){ rec.stop(); return; }
      if(!SR){ sysFallback(opt.toSys ? "這支手機的 App 不支援直接語音，幫你換成手機鍵盤，按鍵盤上的 🎤 麥克風就能說話" : "這裡不支援語音輸入，可以到聊天室用手機鍵盤的 🎤"); return; }
      let finalText = "", heard = false;
      try{ rec = new SR(); }catch(e){ sysFallback("語音輸入開不起來，改用手機鍵盤的 🎤 試試"); return; }
      rec.lang = "zh-TW"; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
      rec.onresult = e => { let interim = ""; finalText = "";
        for(let i=0;i<e.results.length;i++){ const r = e.results[i]; if(r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript; }
        heard = true; micUi((finalText + interim) || "正在聽…", "on"); };
      rec.onerror = e => { const er = e.error; rec && (rec._err = er);
        if(er==="not-allowed" || er==="service-not-allowed"){ rec = null; sysFallback(opt.toSys ? "沒辦法使用麥克風，幫你換成手機鍵盤，按鍵盤上的 🎤 也能說話" : "沒有麥克風權限，請到手機設定允許麥克風"); }
        else if(er==="no-speech"){ micUi("沒聽到聲音，再按一次 🎤 試試", "info"); setTimeout(closeMic, 1500); }
        else if(er==="network"){ micUi("語音輸入需要網路喔", "info"); setTimeout(closeMic, 1500); }
        else if(er!=="aborted"){ micUi("沒聽清楚，再試一次", "info"); setTimeout(closeMic, 1500); } };
      rec.onend = () => { const r = rec; if(!r || r._err) return;
        const t = finalText.trim();
        if(t && !r._cancel){ opt.commit(t); opt.fx("pick", [...t].length); }
        closeMic(); };
      // a little "meow" first, then start listening once it has finished (so the meow isn't transcribed)
      micUi("喵～", "on");
      if(hooks.listen) hooks.listen();
      const r0 = rec;
      setTimeout(()=>{ if(rec!==r0 || r0._cancel) return; micUi("正在聽…說說看 🐾", "on");
        try{ r0.start(); }catch(e){ rec = null; sysFallback("語音輸入開不起來，改用手機鍵盤的 🎤 試試"); } }, hooks.listen ? 480 : 0);
    }
    function updEnter(){ const e = body.querySelector('.k[data-a="enter"]'); if(e) (e.querySelector(".kv")||e).innerHTML = composing() ? "確定" : (opt.enterLabel||"傳送 ฅ"); }
    // key press animations (chosen in settings)
    const ANIMS = {
      jelly(b){ b.animate([{transform:"scale(1)"},{transform:"scale(1.32) translateY(-5px)",offset:.3},{transform:"scale(.88)",offset:.62},{transform:"scale(1.06)",offset:.82},{transform:"scale(1)"}],{duration:340,easing:"ease-out"}); },
      paw(b){ b.animate([{transform:"scale(1)"},{transform:"scale(1.12,.78) translateY(3px)",offset:.3},{transform:"scale(.95,1.1)",offset:.65},{transform:"scale(1)"}],{duration:320,easing:"ease-out"});
        overlay(b, art("paw"), 30, [{transform:"translate(-50%,-50%) scale(.2) rotate(-20deg)",opacity:0},{transform:"translate(-50%,-50%) scale(1.25) rotate(8deg)",opacity:1,offset:.35},{transform:"translate(-50%,-50%) scale(1) rotate(0)",opacity:1,offset:.7},{transform:"translate(-50%,-50%) scale(.9)",opacity:0}], 420); },
      hearts(b){ b.animate([{transform:"scale(1)"},{transform:"scale(1.22)",offset:.35},{transform:"scale(1)"}],{duration:260,easing:"ease-out"});
        for(let i=0;i<6;i++){ const a=Math.PI*2*i/6+Math.random()*.5, d=26+Math.random()*12; overlay(b, art("heart"), 13, [{transform:"translate(-50%,-50%) scale(.3)",opacity:1},{transform:`translate(calc(-50% + ${Math.cos(a)*d}px),calc(-50% + ${Math.sin(a)*d}px)) scale(1.1)`,opacity:1,offset:.6},{transform:`translate(calc(-50% + ${Math.cos(a)*d*1.2}px),calc(-50% + ${Math.sin(a)*d*1.2-8}px)) scale(.6)`,opacity:0}], 520); } },
      jump(b){ b.animate([{transform:"translateY(0)"},{transform:"translateY(-16px) scale(1.12)",offset:.35},{transform:"translateY(0) scale(1.15,.82)",offset:.65},{transform:"translateY(0) scale(.96,1.05)",offset:.82},{transform:"none"}],{duration:380,easing:"ease-out"});
        [-1,1].forEach(sd=>overlay(b, `<i style="display:block;width:100%;height:100%;background:#fff;border:2px solid currentColor;border-radius:50%"></i>`, 8, [{transform:"translate(-50%,-50%)",opacity:0},{transform:"translate(-50%,-50%)",opacity:0,offset:.6},{transform:`translate(calc(-50% + ${sd*22}px),calc(-50% + 14px)) scale(1.3)`,opacity:.9,offset:.8},{transform:`translate(calc(-50% + ${sd*30}px),calc(-50% + 12px)) scale(.4)`,opacity:0}], 420)); },
      spin(b){ b.animate([{transform:"rotate(0) scale(1)"},{transform:"rotate(-14deg) scale(1.28)",offset:.3},{transform:"rotate(9deg) scale(1.05)",offset:.6},{transform:"rotate(0) scale(1)"}],{duration:360,easing:"ease-out"});
        [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([x,y])=>overlay(b, art("star"), 13, [{transform:"translate(-50%,-50%) scale(.2) rotate(0)",opacity:0},{transform:`translate(calc(-50% + ${x*22}px),calc(-50% + ${y*22}px)) scale(1.1) rotate(90deg)`,opacity:1,offset:.5},{transform:`translate(calc(-50% + ${x*28}px),calc(-50% + ${y*28}px)) scale(.4) rotate(180deg)`,opacity:0}], 460)); },
      peek(b){ b.animate([{transform:"scale(1)"},{transform:"scale(.9)",offset:.3},{transform:"scale(1.06)",offset:.7},{transform:"scale(1)"}],{duration:300,easing:"ease-out"});
        overlay(b, art("cat"), 30, [{transform:"translate(-50%,-10%) scale(.6)",opacity:0},{transform:"translate(-50%,-105%) scale(1.1)",opacity:1,offset:.35},{transform:"translate(-50%,-95%) scale(1)",opacity:1,offset:.7},{transform:"translate(-50%,-20%) scale(.6)",opacity:0}], 560); },
      ripple(b){ b.animate([{transform:"scale(1)",filter:"brightness(1)"},{transform:"scale(1.15)",filter:"brightness(1.12) saturate(1.6)",offset:.3},{transform:"scale(1)",filter:"brightness(1)"}],{duration:300,easing:"ease-out"});
        [0,120].forEach(dl=>overlay(b, `<i style="display:block;width:100%;height:100%;border:3px solid var(--kb-accent);border-radius:50%"></i>`, 20, [{transform:"translate(-50%,-50%) scale(.6)",opacity:.9},{transform:"translate(-50%,-50%) scale(3.4)",opacity:0}], 480, dl)); },
    };
    function art(n){ return (opt.art && opt.art[n]) || ""; }
    function overlay(b, html, size, frames, dur, delay){
      const r=b.getBoundingClientRect(), R=imeEl.getBoundingClientRect();
      const d=document.createElement("div"); d.className="kfx"; d.innerHTML=html;
      d.style.cssText=`left:${r.left-R.left+r.width/2}px;top:${r.top-R.top+r.height/2}px;width:${size}px;height:${size}px`;
      imeEl.appendChild(d);
      d.animate(frames,{duration:dur,delay:delay||0,easing:"ease-out",fill:"both"});
      setTimeout(()=>d.remove(), dur+(delay||0)+40);
    }
    function pop(b){ const a = (opt.anim && opt.anim()) || "jelly"; (ANIMS[a]||ANIMS.jelly)(b.querySelector(".kv") || b); }
    function bubble(b){
      const t = b.dataset.bub; if(!t || (opt.anim && opt.anim()==="peek")) return;
      const r = b.getBoundingClientRect(), R = imeEl.getBoundingClientRect();
      const d = document.createElement("div"); d.className = "keybub"; d.textContent = t;
      d.style.left = (r.left - R.left + r.width/2) + "px"; d.style.top = (r.top - R.top) + "px";
      imeEl.appendChild(d);
      d.animate([{transform:"translate(-50%,-30%) scale(.4)",opacity:0},{transform:"translate(-50%,-115%) scale(1.15)",opacity:1,offset:.35},{transform:"translate(-50%,-110%) scale(1)",opacity:1,offset:.7},{transform:"translate(-50%,-140%) scale(.8)",opacity:0}],{duration:420,easing:"ease-out",fill:"forwards"});
      setTimeout(()=>d.remove(),450);
    }
    function esc(s){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
    draw(); refresh();
    return { flush: commitAll, composing };
  }
  return { mount, load, hooks, _test: { convert, lookup, parseSyl, ready: ()=>!!dict } };
})();
