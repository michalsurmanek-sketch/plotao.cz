alter table public.plotao_newsletter_subscribers
  add column if not exists token_expires_at timestamptz,
  add column if not exists unsubscribe_token_hash text;
create unique index if not exists plotao_newsletter_unsubscribe_token_hash_uidx
  on public.plotao_newsletter_subscribers(unsubscribe_token_hash)
  where unsubscribe_token_hash is not null;
create index if not exists plotao_newsletter_pending_expiry_idx
  on public.plotao_newsletter_subscribers(token_expires_at)
  where status = 'pending';

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
select cron.schedule(
  'plotao-newsletter-expired-pending-cleanup',
  '17 3 * * *',
  $$delete from public.plotao_newsletter_subscribers where status = 'pending' and token_expires_at < now()$$
);
select cron.schedule(
  'plotao-newsletter-rate-events-cleanup',
  '23 3 * * *',
  $$delete from public.plotao_newsletter_rate_events where created_at < now() - interval '24 hours'$$
);