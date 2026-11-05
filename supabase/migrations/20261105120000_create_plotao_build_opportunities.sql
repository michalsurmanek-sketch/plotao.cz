create table if not exists public.plotao_build_opportunities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  location text not null check (char_length(btrim(location)) between 2 and 180),
  region text not null default '',
  project_type text not null default 'rodinne_domy' check (project_type in ('rodinne_domy','bytove_domy','komercni','verejne','jine')),
  stage text not null default 'zamer' check (stage in ('uzemni_plan','zamer','povoleno','realizace','dokonceno','pozastaveno')),
  units integer not null default 1 check (units between 0 and 100000),
  source_name text not null check (char_length(btrim(source_name)) between 2 and 180),
  source_url text not null default '' check (char_length(source_url) <= 1000),
  expected_start date,
  outreach_status text not null default 'neosloveno' check (outreach_status in ('neosloveno','pripraveno','osloveno','jednani','zakazka','bez_zajmu')),
  contact_name text not null default '' check (char_length(contact_name) <= 120),
  contact_email text not null default '' check (char_length(contact_email) <= 254),
  contact_phone text not null default '' check (char_length(contact_phone) <= 40),
  notes text not null default '' check (char_length(notes) <= 4000),
  latitude double precision,
  longitude double precision,
  verified_at timestamptz,
  constraint plotao_build_opportunities_coordinates check (
    (latitude is null and longitude is null) or
    (latitude between 47 and 52.5 and longitude between 11 and 20)
  )
);
create index if not exists plotao_build_opportunities_location_idx on public.plotao_build_opportunities (region, location);
create index if not exists plotao_build_opportunities_stage_idx on public.plotao_build_opportunities (stage, expected_start);
alter table public.plotao_build_opportunities enable row level security;
revoke all on public.plotao_build_opportunities from anon, authenticated;
grant all on public.plotao_build_opportunities to service_role;