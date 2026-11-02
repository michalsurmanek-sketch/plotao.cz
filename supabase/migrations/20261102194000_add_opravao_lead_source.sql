alter table public.plotao_leads
  drop constraint if exists plotao_leads_source_check;

alter table public.plotao_leads
  add constraint plotao_leads_source_check
  check (source = any (array[
    'plotao.cz',
    'poptejplot.cz',
    'poptejcenu.cz',
    'montao.cz',
    'betonao.cz',
    'vibrao.cz',
    'renovao.cz',
    'profiplot.cz',
    'opravao.cz'
  ]));
