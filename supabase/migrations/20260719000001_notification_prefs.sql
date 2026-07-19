-- Notification preferences + chat read-status support
-- 2026-07-19

-- Allow buyers/merchants to opt out of push notifications (default on).
alter table public.profiles
  add column if not exists push_notifications_enabled boolean not null default true;

-- UPDATE policy for chat_messages so participants can mark messages as read.
create policy "chat_messages_update_participant" on public.chat_messages
  for update using (
    exists (
      select 1 from public.chat_threads t
      where t.id = thread_id
        and (
          t.buyer_id = auth.uid()
          or exists (
            select 1 from public.locations lo
            join public.merchant_orgs mo on mo.id = lo.org_id
            where lo.id = t.location_id and mo.owner_id = auth.uid()
          )
        )
    )
  );

-- Keep chat_threads.last_message_at current when a new message is inserted.
create or replace function public.update_last_message_at()
returns trigger as $$
begin
  update public.chat_threads
  set last_message_at = new.created_at
  where id = new.thread_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists chat_messages_update_thread_timestamp on public.chat_messages;
create trigger chat_messages_update_thread_timestamp
  after insert on public.chat_messages
  for each row
  execute function public.update_last_message_at();
