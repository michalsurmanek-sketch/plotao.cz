create or replace function public.plotao_update_job(p_job_id uuid,p_status text,p_site_address text,p_region text,p_planned_start date,p_planned_end date,p_note text,p_actor text default '')
returns public.plotao_jobs language plpgsql security definer set search_path=public,pg_temp as $$
declare saved public.plotao_jobs;
begin
 if p_status not in ('preparing','material_ordered','material_delivered','scheduled','in_progress','paused','completed','cancelled','complaint') then raise exception 'invalid job status'; end if;
 if char_length(coalesce(p_site_address,''))>255 or char_length(coalesce(p_note,''))>4000 then raise exception 'job field too long'; end if;
 if nullif(coalesce(p_region,''),'') is not null and p_region not in ('Hlavní město Praha','Středočeský kraj','Jihočeský kraj','Plzeňský kraj','Karlovarský kraj','Ústecký kraj','Liberecký kraj','Královéhradecký kraj','Pardubický kraj','Kraj Vysočina','Jihomoravský kraj','Olomoucký kraj','Zlínský kraj','Moravskoslezský kraj') then raise exception 'invalid region'; end if;
 update public.plotao_jobs set status=p_status,site_address=btrim(coalesce(p_site_address,'')),
  planned_start_at=case when p_planned_start is null then null else (p_planned_start::timestamp+time '09:00') at time zone 'Europe/Prague' end,
  planned_end_at=case when p_planned_end is null then null else (p_planned_end::timestamp+time '17:00') at time zone 'Europe/Prague' end,
  completed_at=case when p_status='completed' then coalesce(completed_at,now()) else null end,
  note=btrim(coalesce(p_note,'')),updated_at=now()
 where id=p_job_id returning * into saved;
 if saved.id is null then raise exception 'job not found'; end if;
 update public.plotao_leads set region=coalesce(p_region,''),updated_at=now() where id=saved.lead_id;
 return saved;
end;$$;
revoke all on function public.plotao_update_job(uuid,text,text,text,date,date,text,text) from public,anon,authenticated;
grant execute on function public.plotao_update_job(uuid,text,text,text,date,date,text,text) to service_role;

create or replace function public.plotao_update_job_referral(p_referral_id uuid,p_status text,p_response_note text,p_actor text)
returns public.plotao_job_referrals language plpgsql security definer set search_path=public,pg_temp as $$
declare ref public.plotao_job_referrals; saved public.plotao_job_referrals; firm text; lead_key uuid;
begin
 if p_status not in ('accepted','declined','withdrawn') then raise exception 'invalid response'; end if;
 if char_length(coalesce(p_response_note,''))>1000 then raise exception 'response note too long'; end if;
 select * into ref from public.plotao_job_referrals where id=p_referral_id for update;
 if ref.id is null then raise exception 'referral not found'; end if;
 if ref.status not in ('sent','accepted') then raise exception 'referral is not awaiting a response'; end if;
 update public.plotao_job_referrals set status=p_status,response_at=now(),response_note=btrim(coalesce(p_response_note,'')),response_by=left(coalesce(p_actor,''),254),updated_at=now() where id=ref.id returning * into saved;
 select lead_id into lead_key from public.plotao_jobs where id=ref.job_id;
 if p_status='accepted' then
  update public.plotao_jobs set partner_id=ref.partner_id,updated_at=now() where id=ref.job_id;
  select company_name into firm from public.plotao_partners where id=ref.partner_id;
  update public.plotao_leads set status='partner_assigned',partner_name=coalesce(firm,''),updated_at=now() where id=lead_key;
 else
  update public.plotao_jobs set partner_id=null,updated_at=now() where id=ref.job_id and partner_id=ref.partner_id;
  update public.plotao_leads set status='ordered',partner_name='',updated_at=now() where id=lead_key;
 end if;
 return saved;
end;$$;
revoke all on function public.plotao_update_job_referral(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.plotao_update_job_referral(uuid,text,text,text) to service_role;