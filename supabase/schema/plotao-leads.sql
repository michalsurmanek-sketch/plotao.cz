-- PLOTAO lead backend schema.
-- Apply to the dedicated PLOTAO Supabase project only.
-- This file is intentionally a schema source, not a migration-history entry.
-- After applying with execute_sql, generate the canonical migration using the Supabase CLI/MCP workflow.

create table if not exists public.plotao_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submitted_at timestamptz not null,
  source text not null default 'plotao.cz' check (source = 'plotao.cz'),
  mode text not null check (mode in ('lead','help','partner')),
  name text not null check (char_length(name) between 2 and 120),
  phone text not null check (char_length(phone) between 9 and 20),
  email text not null check (char_length(email) between 3 and 254),
  place text not null default '' check (char_length(place) <= 200),
  note text not null default '' check (char_length(note) <= 4000),
  payload jsonb not null,
  status text not null default 'new' check (status in ('new','contacted','closed'))
);

create index if not exists plotao_leads_created_at_idx on public.plotao_leads (created_at desc);
create index if not exists plotao_leads_status_created_at_idx on public.plotao_leads (status, created_at desc);
create index if not exists plotao_leads_mode_created_at_idx on public.plotao_leads (mode, created_at desc);

alter table public.plotao_leads enable row level security;
revoke all on table public.plotao_leads from anon, authenticated;
grant select, insert, update on table public.plotao_leads to service_role;

comment on table public.plotao_leads is 'Private PLOTAO contact/lead intake. Browser roles have no table grants; writes go through the submit-lead Edge Function.';
comment on column public.plotao_leads.payload is 'Server-validated normalized lead snapshot. displayedPrice is informational only, never contractual.';

create table if not exists public.plotao_lead_rate_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  key_hash text not null check (char_length(key_hash) = 64)
);

create index if not exists plotao_lead_rate_events_key_created_idx
  on public.plotao_lead_rate_events (key_hash, created_at desc);

alter table public.plotao_lead_rate_events enable row level security;
revoke all on table public.plotao_lead_rate_events from anon, authenticated;
grant select, insert, delete on table public.plotao_lead_rate_events to service_role;

comment on table public.plotao_lead_rate_events is 'Short-lived anti-abuse events keyed by a salted SHA-256 digest. Raw IP addresses are never stored.';
