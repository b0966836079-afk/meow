// 喵喵小窩 內建鍵盤：注音（含選字、詞語聯想）、英文、數字符號、常用語、表情
// 詞庫：zhuyin.txt（由酷音 libchewing 詞庫轉換，LGPL-2.1-or-later）
const IME = (function(){
  const INIT = "ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ", MED = "ㄧㄨㄩ", FIN = "ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ", TONE = "ˊˇˋ˙";
  const ZH_ROWS = ["ㄅㄉˇˋㄓˊ˙ㄚㄞㄢㄦ","ㄆㄊㄍㄐㄔㄗㄧㄛㄟㄣ","ㄇㄋㄎㄑㄕㄘㄨㄜㄠㄤ","ㄈㄌㄏㄒㄖㄙㄩㄝㄡㄥ"];
  const EN_ROWS = ["qwertyuiop","asdfghjkl","zxcvbnm"];
  const SYM_ROWS = [["1","2","3","4","5","6","7","8","9","0"],["，","。","？","！","、","：","；","「","」","…"],["～","（","）","@","#","%","&","+","❤"]];

  // ---------- dictionary ----------
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
      const c = lookup(syls.slice(j,i)); if(!c.length) continue;
      const sc = best[j] + (i-j>1 ? 9*(i-j) : 0) + Math.log((c[0].f||0)+2);
      if(sc > best[i]){ best[i] = sc; back[i] = [j, c[0].w]; }
    }
    if(best[n] < -1e8){ // unknown syllable somewhere: fall back per syllable
      return syls.map(s=>{ const c=lookup([s]); return c.length?c[0].w:s; }).join("");
    }
    let out = "", i = n; while(i>0){ const [j,w] = back[i]; out = w + out; i = j; } return out;
  }

  // ---------- keyboard ----------
  function mount(root, opt){
    let mode = "zh", shift = false;
    const st = { syl: [], cur: {i:"",m:"",f:""} };
    const curStr = () => st.cur.i + st.cur.m + st.cur.f;
    const composing = () => st.syl.length>0 || !!curStr();
    root.innerHTML = `<div class="ime"><div class="ime-top"><div class="pre" id="imePre"></div><div class="cands" id="imeCands"></div></div><div class="ime-body" id="imeBody"></div></div>`;
    const preEl = root.querySelector("#imePre"), candEl = root.querySelector("#imeCands"), body = root.querySelector("#imeBody");
    let dictReady = false;
    load(opt.dictUrl).then(()=>{ dictReady = true; refresh(); }).catch(()=>{ candEl.innerHTML = `<span class="hint">字典載入失敗，請檢查網路後重開聊天室</span>`; });

    function candidates(){
      if(!dictReady) return [];
      const out = [], seen = new Set();
      const add = (w, n, takeCur) => { const k = w+"|"+n+"|"+(takeCur?1:0); if(seen.has(k)) return; seen.add(k); out.push({w, n, takeCur}); };
      const S = st.syl, P = curStr();
      if(P && S.length){ // phrases including the syllable being typed
        for(const ps of partialSyls(st.cur).slice(0,40)) for(const c of lookup([...S, ps])) add(c.w, S.length, true);
      }
      for(let k=S.length;k>=2;k--) for(const c of lookup(S.slice(0,k))) add(c.w, k, false);
      if(S.length){ for(const c of lookup([S[0]]).slice().sort((a,b)=>b.f-a.f)) add(c.w, 1, false); }
      else if(P){
        const all = []; for(const ps of partialSyls(st.cur)) for(const c of lookup([ps])) all.push(c);
        all.sort((a,b)=>b.f-a.f); for(const c of all.slice(0,120)) add(c.w, 0, true);
      }
      return out.slice(0,150);
    }
    function refresh(){
      const conv = dictReady ? convert(st.syl) : st.syl.join("");
      preEl.innerHTML = composing() ? `<u>${esc(conv)}</u><b>${esc(curStr())}</b>` : "";
      const cs = candidates();
      if(!composing()){ candEl.innerHTML = `<span class="hint">${dictReady ? (mode==="zh"?"用注音打字，空白鍵＝一聲":"") : "字典載入中…"}</span>${opt.toSys?`<button class="sysk">📱 手機鍵盤</button>`:""}${opt.hide?`<button class="sysk hidek">收起 ▾</button>`:""}`; const sk=candEl.querySelector(".sysk:not(.hidek)"); if(sk) sk.addEventListener("click", ()=>opt.toSys()); const hk=candEl.querySelector(".hidek"); if(hk) hk.addEventListener("click", ()=>opt.hide()); return; }
      candEl.innerHTML = cs.map((c,i)=>`<button data-i="${i}">${esc(c.w)}</button>`).join("") || `<span class="hint">沒有這個音，按 ⌫ 修改</span>`;
      candEl.scrollLeft = 0;
      candEl.querySelectorAll("button").forEach(b=>b.addEventListener("click", ()=>{ pick(cs[+b.dataset.i]); pop(b); }));
    }
    function pick(c){
      opt.commit(c.w);
      st.syl = st.syl.slice(c.n); if(c.takeCur) st.cur = {i:"",m:"",f:""};
      opt.fx("pick", [...c.w].length); refresh();
    }
    function commitAll(){ if(!composing()) return false; const t = (dictReady?convert(st.syl):st.syl.join("")) + curStr(); st.syl=[]; st.cur={i:"",m:"",f:""}; if(t) opt.commit(t); opt.fx("pick",[...t].length); refresh(); return true; }
    function finishSyl(tone){
      const s = curStr(); if(!s) return false;
      st.syl.push(s + (tone||"")); st.cur = {i:"",m:"",f:""};
      if(st.syl.length > 10){ const t = convert(st.syl.slice(0,5)); opt.commit(t); st.syl = st.syl.slice(5); }
      return true;
    }
    function zhKey(k){
      if(TONE.includes(k)){ if(!finishSyl(k)){ /* tone with nothing typed: ignore */ } }
      else if(INIT.includes(k)){ if(st.cur.m||st.cur.f){ finishSyl(""); } st.cur.i = k; }
      else if(MED.includes(k)){ if(st.cur.f){ finishSyl(""); } st.cur.m = k; }
      else if(FIN.includes(k)) st.cur.f = k;
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

    function key(label, cls, act){ return `<button class="k ${cls||""}" data-a="${act||""}" data-k="${esc(label)}">${label}</button>`; }
    function draw(){
      let h = "";
      if(mode==="zh"){
        h += ZH_ROWS.map(r=>`<div class="row">${[...r].map(k=>key(k, TONE.includes(k)?"tone":"")).join("")}</div>`).join("");
      } else if(mode==="en"){
        h += EN_ROWS.map((r,i)=>`<div class="row">${i===2?key("⇧","fn"+(shift?" on":""),"shift"):""}${[...r].map(k=>key(shift?k.toUpperCase():k)).join("")}${i===2?key("⌫","fn","back"):""}</div>`).join("");
      } else if(mode==="sym"){
        h += SYM_ROWS.map((r,i)=>`<div class="row">${r.map(k=>key(k)).join("")}${i===2?key("⌫","fn","back"):""}</div>`).join("");
      } else if(mode==="fav" || mode==="emo"){
        const list = mode==="fav" ? opt.phrases : opt.emojis;
        h += `<div class="grid ${mode}">${list.map(k=>key(esc(k),"wide","ins")).join("")}</div>`;
      }
      const sw = (m, t) => key(t, "fn sw"+(mode===m?" on":""), "mode:"+m);
      h += `<div class="row bottom">${sw("zh","注")}${sw("en","ABC")}${sw("sym","123")}${sw("fav","♡")}${sw("emo","☺")}${key("空白","space","space")}${mode==="zh"||mode==="fav"||mode==="emo"?key("⌫","fn","back"):""}${key(composing()?"確定":"傳送","send","enter")}</div>`;
      body.innerHTML = h;
      body.querySelectorAll(".k").forEach(b=>{
        b.addEventListener("click", ()=>{
          pop(b);
          const a = b.dataset.a, k = b.dataset.k;
          if(a==="back") back();
          else if(a==="space") space();
          else if(a==="enter"){ enter(); draw(); }
          else if(a==="shift"){ shift=!shift; opt.fx("key"); draw(); }
          else if(a.startsWith("mode:")){ commitAll(); mode=a.slice(5); shift=false; opt.fx("key"); draw(); refresh(); }
          else if(a==="ins"){ opt.commit(b.textContent); opt.fx("key", [...b.textContent].length); }
          else if(mode==="zh") { zhKey(k); draw(); }
          else { opt.commit(k); opt.fx("key"); if(shift){ shift=false; draw(); } }
        });
      });
    }
    function pop(b){ b.animate([{transform:"translateY(2px) scale(.9)"},{transform:"translateY(-3px) scale(1.12)"},{transform:"none"}],{duration:170,easing:"steps(3,end)"}); }
    function esc(s){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
    draw(); refresh();
    return { flush: commitAll, composing };
  }
  return { mount, load, _test: { convert, lookup, parseSyl, ready: ()=>!!dict } };
})();
