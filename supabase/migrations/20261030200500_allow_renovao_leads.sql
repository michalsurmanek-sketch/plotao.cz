ALTER TABLE public.plotao_leads
  DROP CONSTRAINT IF EXISTS plotao_leads_source_check;

ALTER TABLE public.plotao_leads
  ADD CONSTRAINT plotao_leads_source_check
  CHECK (source IN ('plotao.cz', 'poptejplot.cz', 'poptejcenu.cz', 'montao.cz', 'betonao.cz', 'vibrao.cz', 'renovao.cz', 'profiplot.cz'));
