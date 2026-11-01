// 喵喵小窩 service worker：負責跳通知、點通知打開 App
const CACHE = "meow-v41";
const SHELL = ["./", "index.html", "style.css", "pixel.js", "data.js", "ime.js", "zhuyin.txt", "app.js", "config.js", "games/moqi.js", "games/gomoku.js", "games/fight.js", "games/draw.js", "games/battleship.js", "games/quickdraw.js", "games/fishing.js", "games/runner.js", "games/pet.js", "icons/icon-192.png"];

self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {})); });
self.addEventListener("activate", e => { e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); await self.clients.claim(); })()); });

// network first, fall back to cache (so updates show up right away)
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)).catch(() => {}); return r; }).catch(() => caches.match(e.request)));
});

self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: "喵喵小窩", body: e.data ? e.data.text() : "" }; }
  e.waitUntil((async () => {
    // always show it: iPhone/Chrome may cancel the subscription if a push shows nothing.
    // (the app closes these by itself when it's open)
    await self.registration.showNotification(d.title || "喵喵小窩", {
      body: d.body || "",
      icon: "icons/icon-192.png",
      badge: "icons/badge-96.png",
      tag: d.tag || "meow",
      renotify: true,
      vibrate: [60, 40, 60],
      data: { url: d.url || "./#chat" },
    });
  })());
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./#chat", self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) { if ("focus" in w) { w.postMessage({ go: url.split("#")[1] || "chat" }); return w.focus(); } }
    return self.clients.openWindow(url);
  })());
});
