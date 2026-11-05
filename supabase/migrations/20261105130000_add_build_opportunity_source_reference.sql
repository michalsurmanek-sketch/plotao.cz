alter table public.plotao_build_opportunities
  add column if not exists external_ref text not null default '' check (char_length(external_ref) <= 120);
create unique index if not exists plotao_build_opportunities_external_ref_uidx
  on public.plotao_build_opportunities (external_ref) where external_ref <> '';