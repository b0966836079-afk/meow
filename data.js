// Data layer. The app only talks to `Backend`; it is Supabase in real use,
// and an in-memory mock when the test harness provides window.__mock.
(function(){
  const LS = { get(k){try{return localStorage.getItem(k)}catch(e){return null}}, set(k,v){try{localStorage.setItem(k,v)}catch(e){}} };

  // ---------------- Supabase ----------------
  function SupabaseBackend(cfg){
    const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "meow-auth" },
      realtime: { params: { eventsPerSecond: 10 } },
    });
    const B = { kind: "supabase", uid: null, coupleId: null, code: null, _ch: null,
      _h: { msg: [], state: [], members: [], presence: [], status: [] } };

    B.init = async () => {
      let { data: { session } } = await sb.auth.getSession();
      if (!session) {
        const { data, error } = await sb.auth.signInAnonymously();
        if (error) throw new Error("anon:" + error.message);
        session = data.session;
      }
      B.uid = session.user.id;
      return B.uid;
    };
    B.membership = async () => {
      const { data, error } = await sb.from("members").select("couple_id,name,cat,couples(code)").eq("user_id", B.uid).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      B.coupleId = data.couple_id; B.code = data.couples && data.couples.code;
      return { couple_id: data.couple_id, code: B.code, name: data.name, cat: data.cat };
    };
    B.createCouple = async (name, cat) => {
      const { data, error } = await sb.rpc("create_couple", { p_name: name, p_cat: cat });
      if (error) throw error;
      B.coupleId = data.couple_id; B.code = data.code; return data;
    };
    B.joinCouple = async (code, name, cat) => {
      const { data, error } = await sb.rpc("join_couple", { p_code: code, p_name: name, p_cat: cat });
      if (error) throw new Error((error.message || "").includes("code_not_found") ? "code_not_found" : (error.message || "").includes("full") ? "full" : error.message);
      B.coupleId = data.couple_id; B.code = data.code; return data;
    };
    B.updateMe = async (patch) => {
      const { error } = await sb.from("members").update(Object.assign({ updated_at: new Date().toISOString() }, patch)).eq("user_id", B.uid);
      if (error) throw error;
    };
    B.members = async () => {
      const { data, error } = await sb.from("members").select("user_id,name,cat,created_at").eq("couple_id", B.coupleId).order("created_at");
      if (error) throw error; return data || [];
    };
    B.messages = async (limit = 80) => {
      const { data, error } = await sb.from("messages").select("*").eq("couple_id", B.coupleId).order("id", { ascending: false }).limit(limit);
      if (error) throw error; return (data || []).reverse();
    };
    B.send = async (body, kind, name, cat) => {
      const { data, error } = await sb.from("messages").insert({ couple_id: B.coupleId, sender: B.uid, body, kind: kind || "text", name, cat }).select().single();
      if (error) throw error; return data;
    };
    B.getState = async (game) => {
      const { data, error } = await sb.from("game_state").select("version,state").eq("couple_id", B.coupleId).eq("game", game).maybeSingle();
      if (error) throw error; return data;
    };
    B.casState = async (game, version, state) => {
      const { data, error } = await sb.rpc("cas_state", { p_game: game, p_version: version, p_state: state });
      if (error) throw error; return data; // new version or null on conflict
    };
    B.savePush = async (sub) => {
      const { error } = await sb.from("push_subs").upsert({ endpoint: sub.endpoint, sub, user_id: B.uid, couple_id: B.coupleId }, { onConflict: "endpoint" });
      if (error) throw error;
    };
    B.connect = () => {
      if (B._ch) sb.removeChannel(B._ch);
      const f = `couple_id=eq.${B.coupleId}`;
      const ch = sb.channel("couple-" + B.coupleId, { config: { presence: { key: B.uid } } });
      ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: f }, p => B._h.msg.forEach(h => h(p.new)));
      ch.on("postgres_changes", { event: "*", schema: "public", table: "game_state", filter: f }, p => { const r = p.new; if (r && r.game) B._h.state.forEach(h => h(r.game, r.version, r.state)); });
      ch.on("postgres_changes", { event: "*", schema: "public", table: "members", filter: f }, () => B._h.members.forEach(h => h()));
      ch.on("presence", { event: "sync" }, () => {
        const st = ch.presenceState(); const list = [];
        for (const k in st) { const m = st[k][0]; if (m) list.push(Object.assign({ uid: k }, m)); }
        B._h.presence.forEach(h => h(list));
      });
      ch.subscribe(status => { B._h.status.forEach(h => h(status)); if (status === "SUBSCRIBED" && B._meta) ch.track(B._meta); });
      B._ch = ch;
    };
    B.track = (meta) => { B._meta = meta; if (B._ch) B._ch.track(meta).catch(() => {}); };
    B.on = (what, h) => { B._h[what].push(h); };
    B.reconnect = () => { if (B.coupleId) B.connect(); };
    return B;
  }

  // ---------------- Mock (tests only) ----------------
  function MockBackend(){
    const call = (op, args) => window.__mock(op, args || {});
    const B = { kind: "mock", uid: null, coupleId: null, code: null, _h: { msg: [], state: [], members: [], presence: [], status: [] } };
    window.__mockEvent = (ev) => {
      if (ev.coupleId !== B.coupleId) return;
      if (ev.t === "msg") B._h.msg.forEach(h => h(ev.row));
      if (ev.t === "state") B._h.state.forEach(h => h(ev.game, ev.version, ev.state));
      if (ev.t === "members") B._h.members.forEach(h => h());
      if (ev.t === "presence") B._h.presence.forEach(h => h(ev.list));
    };
    B.init = async () => { let id = LS.get("mock_uid"); if (!id) { id = "u" + Math.random().toString(36).slice(2, 8); LS.set("mock_uid", id); } B.uid = id; await call("hello", { uid: id }); return id; };
    B.membership = async () => { const m = await call("membership", { uid: B.uid }); if (m) { B.coupleId = m.couple_id; B.code = m.code; } return m; };
    B.createCouple = async (name, cat) => { const d = await call("create", { uid: B.uid, name, cat }); B.coupleId = d.couple_id; B.code = d.code; return d; };
    B.joinCouple = async (code, name, cat) => { const d = await call("join", { uid: B.uid, code, name, cat }); if (d.error) throw new Error(d.error); B.coupleId = d.couple_id; B.code = d.code; return d; };
    B.updateMe = async (patch) => call("update", { uid: B.uid, patch });
    B.members = async () => call("members", { cid: B.coupleId });
    B.messages = async () => call("messages", { cid: B.coupleId });
    B.send = async (body, kind, name, cat) => call("send", { cid: B.coupleId, uid: B.uid, body, kind: kind || "text", name, cat });
    B.getState = async (game) => call("get", { cid: B.coupleId, game });
    B.casState = async (game, version, state) => call("cas", { cid: B.coupleId, game, version, state });
    B.savePush = async () => {};
    B.connect = () => { B._h.status.forEach(h => h("SUBSCRIBED")); if (B._meta) call("track", { cid: B.coupleId, uid: B.uid, meta: B._meta }); };
    B.track = (meta) => { B._meta = meta; if (B.coupleId) call("track", { cid: B.coupleId, uid: B.uid, meta }); };
    B.on = (what, h) => { B._h[what].push(h); };
    B.reconnect = () => B.connect();
    return B;
  }

  window.makeBackend = function(cfg){
    if (window.__mock) return MockBackend();
    return SupabaseBackend(cfg);
  };
})();
