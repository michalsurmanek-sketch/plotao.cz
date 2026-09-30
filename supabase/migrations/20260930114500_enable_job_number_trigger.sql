drop trigger if exists plotao_jobs_number on public.plotao_jobs;
create trigger plotao_jobs_number
before insert on public.plotao_jobs
for each row execute function public.plotao_assign_document_number();