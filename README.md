# 喵喵小窩 🐾

兩個人專用的小遊戲合輯＋聊天室（手機網頁 App / PWA）。

網址：https://b0966836079-afk.github.io/meow/

## 給以後的 Claude：這個專案怎麼做的

- **前端**：純 HTML/CSS/JS，沒有打包工具，放在 GitHub Pages（main 分支根目錄）。
  - `index.html` 載入順序：supabase-js(CDN) → `config.js` → `pixel.js` → `data.js` → `ime.js` → `app.js` → `games/*.js`
  - `app.js`：外殼（建立/加入小窩、首頁、聊天室、設定、推播、音效、點擊特效、在遊戲中開聊天的抽屜）
  - `data.js`：資料層，`makeBackend()` 正式用 Supabase；測試時用 `window.__mock` 的假後端
  - `pixel.js`：像素貓咪與圖示（5 種毛色、多種表情與姿勢）
  - `ime.js`：內建「喵喵鍵盤」（注音輸入＋選字、英文、符號、常用語、表情；10 種配色、7 種打字動畫）
  - `zhuyin.txt`：注音詞庫，由酷音 libchewing-data 轉換（LGPL-2.1-or-later，見 `zhuyin-LICENSE.txt`）
  - `sw.js`：Service Worker（推播通知、快取）。**每次改檔案記得把 `CACHE` 版本號 +1**
- **新增遊戲**：在 `games/` 放一個檔案，呼叫 `App.registerGame({ id, name, desc, icon, mount(el, ctx), unmount() })`，再到 `index.html` 和 `sw.js` 的清單各加一行。
  - 遊戲共享狀態用 `ctx.getState(id)` / `ctx.update(id, fn)`（版本號 compare-and-swap）/ `ctx.onState(id, cb)`
  - 其他：`ctx.players()`、`ctx.partner()`、`ctx.isOnline(uid)`、`ctx.notifyPartner(text)`（對方離線時發推播）、`ctx.SFX`、`ctx.burst()`、`ctx.toast()`
- **後端**：Supabase（專案 `ezkbhfpgjcsfahmnziyn`，Tokyo，Free 方案）
  - 匿名登入；資料表 `couples` / `members` / `messages` / `game_state` / `push_subs`，RLS 只讓同一個小窩的兩人存取
  - 照片存在 Storage bucket `photos`（私有）
  - 推播：Edge Function `push`（`supabase/push/index.ts`）由 Database Webhook（messages INSERT）觸發，用 Web Push / VAPID
  - 資料庫設定：`supabase/setup.sql`（整份可重跑）
- **目前遊戲**：默契大考驗（1015 題＋自己出題）、五子棋、貓咪格鬥、砲台大戰、喵喵海戰、西部快槍手、釣魚大賽、跳跳貓每日挑戰

## 更新流程

改好程式 → 推到 `main` → GitHub Pages 約 1～2 分鐘後上線 → 手機把 App 關掉再打開。

## Our cat & daily check-in
- `games/pet.js` (hidden game `pet`, opened from the home strip): state `pet` v2 = {v:2,cats:[{name,color,full,at,exp}],spent,gift,log:[{by,a,c,at}],petDay:{"uid:catIdx":day},playDay}; `PetLogic.norm` migrates v1 (single cat). Up to 2 cats; idle cat-to-cat interactions are local animations only. Food = moqi hearts + fishing total/5 + daily.done*2 + gift − spent. Fullness decays 2.2/h.
- Daily 早安(04–14)/晚安(19–04) check-in lives in app.js (`dailyCard`, `sayGreet`), state `daily` = {days:{"Y-M-D":{m:{uid:ts},n:{uid:ts}}}, done, best}. Day boundary is 04:00. Messages kind `greet`.
- Status board: `moodSt.status[uid]` = {s, until, at}; messages kind `status`.
