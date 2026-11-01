-- 喵喵小窩 更新 7：每個小窩的相簿額度
-- 到 Supabase → SQL Editor → New query，整段貼上，
-- 先把最下面的 你的邀請碼 換成你們自己的 6 碼邀請碼（App「設定」裡看得到），再按 Run。

-- 1. 每個小窩預設 150 MB
alter table public.couples add column if not exists quota_mb int not null default 150;

-- 2. 我們這一組特別多：500 MB（數字可以自己改）
update public.couples set quota_mb = 500 where code = upper('你的邀請碼');

-- 3. 看一下結果：應該會看到你們的邀請碼，額度 500
select code, quota_mb from public.couples order by quota_mb desc;
