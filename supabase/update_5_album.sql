-- 喵喵小窩 更新 5：相簿可以刪照片
-- 到 Supabase → SQL Editor → New query，整段貼上按 Run 就好（重複執行也沒關係）

-- 1. 允許小窩裡的兩個人刪掉自己小窩的照片檔案
drop policy if exists photos_delete on storage.objects;
create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = public.my_couple()::text);

-- 2. 把聊天室裡對應的照片訊息標成「照片已刪除」
create or replace function public.delete_photos(ids bigint[]) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.messages
     set kind = 'photo_gone', media = null, body = '照片已刪除'
   where id = any(ids) and couple_id = public.my_couple() and kind = 'image';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.delete_photos(bigint[]) from public, anon;
grant execute on function public.delete_photos(bigint[]) to authenticated;

select '相簿刪除功能設定完成 📷' as result;
