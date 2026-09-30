-- Jednorázová odpověď partnerské firmy k předané zakázce.
alter table public.plotao_job_referrals
  add column if not exists response_token_hash text;

create or replace function public.plotao_update_job_referral(
  p_referral_id uuid,
  p_status text,
  p_response_note text,
  p_actor text
) returns public.plotao_job_referrals
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare ref public.plotao_job_referrals; saved public.plotao_job_referrals; firm text; lead_key uuid;
begin
  if p_status not in ('accepted','declined','withdrawn') then raise exception 'invalid response'; end if;
  if char_length(coalesce(p_response_note,''))>1000 then raise exception 'response note too long'; end if;
  select * into ref from public.plotao_job_referrals where id=p_referral_id for update;
  if ref.id is null then raise exception 'referral not found'; end if;
  if ref.status not in ('sent','accepted') then raise exception 'referral is not awaiting a response'; end if;
  update public.plotao_job_referrals
    set status=p_status,response_at=now(),response_note=btrim(coalesce(p_response_note,'')),
        response_by=left(coalesce(p_actor,''),254),response_token_hash=null,updated_at=now()
    where id=ref.id returning * into saved;
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
end;
$$;
revoke all on function public.plotao_update_job_referral(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.plotao_update_job_referral(uuid,text,text,text) to service_role;

create or replace function public.plotao_record_job_partner_response(
  p_referral_id uuid,
  p_token_hash text,
  p_status text,
  p_response_note text
) returns public.plotao_job_referrals
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare ref public.plotao_job_referrals; saved public.plotao_job_referrals; firm text; lead_key uuid; actor_email text;
begin
  if p_status not in ('accepted','declined') then raise exception 'invalid response'; end if;
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid response token'; end if;
  if char_length(coalesce(p_response_note,''))>1000 then raise exception 'response note too long'; end if;
  select * into ref from public.plotao_job_referrals where id=p_referral_id for update;
  if ref.id is null or ref.status<>'sent' or ref.response_token_hash is distinct from p_token_hash then
    raise exception 'response link unavailable';
  end if;
  select email into actor_email from public.plotao_partners where id=ref.partner_id;
  update public.plotao_job_referrals
    set status=p_status,response_at=now(),response_note=btrim(coalesce(p_response_note,'')),
        response_by=left(coalesce(actor_email,''),254),response_token_hash=null,updated_at=now()
    where id=ref.id returning * into saved;
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
end;
$$;
revoke all on function public.plotao_record_job_partner_response(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.plotao_record_job_partner_response(uuid,text,text,text) to service_role;
