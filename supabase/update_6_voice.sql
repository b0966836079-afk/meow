-- 喵喵小窩 更新 6：可以傳語音訊息
-- 到 Supabase → SQL Editor → New query，整段貼上按 Run 就好（重複執行也沒關係）
-- 讓存照片的空間也可以放錄音檔
update storage.buckets
   set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif',
                                  'audio/webm','audio/mp4','audio/aac','audio/mpeg','audio/ogg','audio/wav','audio/x-m4a']
 where id = 'photos';

select '語音訊息設定完成 🎤' as result;
