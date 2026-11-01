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
- **目前遊戲**：默契大考驗（1015 題＋自己出題）、五子棋、貓咪格鬥、你畫我猜（`games/draw.js`，735 詞，合作制）、喵喵海戰、西部快槍手、釣魚大賽、跳跳貓（橫向全螢幕）、我們的貓（`games/pet.js`，隱藏遊戲，從首頁進入）。砲台大戰已依使用者要求移除。
- **其他功能**：聊天（內建注音鍵盤、30 張貼圖、照片、已讀、「我愛你」親親動畫）、心情小站（心情/休戰旗/寫信/和好）、狀態牌（上班中…＋忙完通知）、早安晚安打卡、相簿（含容量提醒與刪除）、聊天背景、鍵盤配色與打字動畫。
- **App 圖示**：原版吐司喵（橘色 loaf 貓、淡橘背景），在 `icons/`。

## 給以後的 Claude：使用者與合作方式
- 使用者說繁體中文（台灣），用 Redmi（Android）；男朋友用 iPhone。用 GitHub Pages 加到主畫面使用。
- 使用者不會寫程式：**直接推到 GitHub**（Claude GitHub App 只裝在這個 repo），不要叫她上傳檔案。需要動 Supabase 資料庫時，把 SQL 放在 `supabase/update_N_*.sql`，給她 raw.githubusercontent.com 連結＋ SQL Editor 連結（https://supabase.com/dashboard/project/ezkbhfpgjcsfahmnziyn/sql/new），一步一步教。
- 已執行過的 SQL：`setup.sql`、`update_5_album.sql`。`update_4_truce.sql`（休戰時間到推播）還沒執行。
- 絕對不要索取 service_role key、資料庫密碼或帳號密碼。不要放線條小狗或任何有版權的角色（repo 是公開的）。
- 風格：像素貓咪、可愛、情侶間不起衝突的合作玩法。改完功能用兩個瀏覽器的假後端（`window.__mock`）跑 Playwright 測試，截圖給她看效果。
- 每次改檔：`sw.js` 的 `CACHE` 版本 +1，commit 後 `git push origin HEAD:main`。


## 更新流程

改好程式 → 推到 `main` → GitHub Pages 約 1～2 分鐘後上線 → 手機把 App 關掉再打開。

## Our cat & daily check-in
- `games/pet.js` (hidden game `pet`, opened from the home strip): state `pet` v2 = {v:2,cats:[{name,color,full,at,exp}],spent,gift,log:[{by,a,c,at}],petDay:{"uid:catIdx":day},playDay}; `PetLogic.norm` migrates v1 (single cat). Up to 2 cats; idle cat-to-cat interactions are local animations only. Food = moqi hearts + fishing total/5 + daily.done*2 + gift − spent. Fullness decays 2.2/h.
- `games/petdeco.js` (window.PetDeco): 16 furniture + 10 cat accessories with pixel art and unlock conditions computed live from shared metrics (cat exp/stage/days, moqi hearts, fishing dex union, daily done/best streak, draw solved, album count, mood.makeup.count). Equipped items live in `pet.deco = {room:{slot:id}, wear:{catIdx:{hat,neck}}}` (slots: floorL/floorR/wallL/wallR/window/rug; hat/neck). 「🛋️ 佈置・裝扮」 bottom sheet in the pet room; new-unlock toasts use localStorage `mw_pdSeen`.
- Daily 早安(04–14)/晚安(19–04) check-in lives in app.js (`dailyCard`, `sayGreet`), state `daily` = {days:{"Y-M-D":{m:{uid:ts},n:{uid:ts}}}, done, best}. Day boundary is 04:00. Messages kind `greet`.
- Status board: `moodSt.status[uid]` = {s, until, at}; messages kind `status`.

## Album
- Route `album` (4th nav button). Lists `kind='image'` messages (`B.images`), thumbnails at `<path>_t.jpg` (uploaded on send; old photos fall back to full image). Signed URLs cached in localStorage `mw_urls`.
- Usage: `B.photoUsage()` lists the couple folder in storage and sums sizes; stored in game_state `album` = {bytes,count,at,warned,deleted[]}. Limit = `couples.quota_mb` (update_7_quota.sql; default 150, owner couple 500) or 1 GB if the column is missing; uploads are blocked client-side when full. Crossing 70/85/95% posts a `kind='album'` message (push to partner) + modal for the sender.
- Deleting needs `supabase/update_5_album.sql` (storage delete policy + rpc `delete_photos` which turns messages into `kind='photo_gone'`).

## Voice
- Chat send button shows 🎤 when the box is empty → records with MediaRecorder (prefers audio/mp4 AAC for iPhone playback), meow before recording, max 60 s. Uploaded to `photos/<couple>/v/…`, message `kind='voice'`, body `🎤 傳了一段語音（N 秒）`. Needs `supabase/update_6_voice.sql` (adds audio MIME types to the bucket).
- Keyboard 🎤 key = speech-to-text (Web Speech, zh-TW), falls back to the phone keyboard's dictation.

## Room mode (情侶 / 閨蜜 / 兄弟)
- game_state `room` = {mode:"couple"|"bestie"|"bro"} (MODES table in app.js); chosen on create (onboarding `#mPick`), switchable in settings. `ctx.mode()`, `ctx.pw()` ("另一半"/"閨蜜").
- Bestie mode: moqi uses `BANK_B` (romance questions filtered by `ROMANCE` regex + `BESTIE_Q`), draw swaps the 「我們」 category for 「閨蜜」, different LV names, quick phrases, love animation says 抱抱.
- Voice messages expire after 24 h unless saved (long-press → 儲存). Saved paths in game_state `voice` = {saved:[paths]}; `cleanupVoices()` deletes unsaved files older than 25 h from `<couple>/v/` (file names start with the upload timestamp).

## Font
- Pixel font 俐方體11號 Cubic 11 (`fonts/Cubic_11.woff2`, OFL-1.1, license in `fonts/Cubic_11-OFL.txt`) is the default UI font; settings → 字體 can switch back to the system font (`body[data-font="sys"]`, localStorage `mw_font`).

## Pinned messages
- Long-press any chat message (`[data-mid]`) → `msgMenu`: 置頂 / 取消置頂, copy text, and (voice) save. Pins in game_state `pins` = {list:[{id,kind,text,name,cat,by,at}]} (max 10, text copied so old messages still show). Pin bar `.pinBar` at top of chat; pinning posts a `kind='pin'` system message (pushes to partner).
- Replies: long-press → 回覆, or swipe a message right. Stored in the `media` column of text/sticker messages as JSON `{"r":id,"n":name,"t":preview}` (no schema change); quote is tappable (jumps to the original).
- Site limits (`update_8_site.sql`): `app_settings.max_couples` (default 4) enforced by trigger `couples_limit` (raises `site_full`); `couples.is_owner` marks the owner nest, rpc `site_usage()` returns total bucket bytes + nest count only to the owner (shown in the album, warning modal at 70/85/95%).
