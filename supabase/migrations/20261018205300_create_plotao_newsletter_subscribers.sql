create table if not exists public.plotao_newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 254),
  status text not null default 'pending' check (status in ('pending','confirmed','unsubscribed')),
  consent_at timestamptz not null default now(),
  consent_text_version text not null default 'newsletter-2026-10',
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  token_hash text,
  source text not null default 'plotao.cz' check (source = 'plotao.cz'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists plotao_newsletter_token_hash_uidx
  on public.plotao_newsletter_subscribers(token_hash) where token_hash is not null;
create index if not exists plotao_newsletter_status_idx
  on public.plotao_newsletter_subscribers(status, created_at desc);
alter table public.plotao_newsletter_subscribers enable row level security;
revoke all on public.plotao_newsletter_subscribers from anon, authenticated;

create table if not exists public.plotao_newsletter_rate_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  key_hash text not null check (char_length(key_hash) = 64)
);
create index if not exists plotao_newsletter_rate_events_lookup_idx
  on public.plotao_newsletter_rate_events(key_hash, created_at desc);
alter table public.plotao_newsletter_rate_events enable row level security;
revoke all on public.plotao_newsletter_rate_events from anon, authenticated;