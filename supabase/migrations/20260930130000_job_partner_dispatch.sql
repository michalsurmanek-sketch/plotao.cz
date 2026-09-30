create table if not exists public.plotao_job_referrals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  job_id uuid not null references public.plotao_jobs(id) on delete cascade,
  partner_id uuid not null references public.plotao_partners(id) on delete restrict,
  status text not null default 'sending' check (status in ('sending','sent','accepted','declined','withdrawn','failed')),
  sent_at timestamptz,
  sent_by text not null,
  provider text not null default 'resend',
  provider_id text,
  response_at timestamptz,
  response_note text not null default '' check (char_length(response_note)<=1000),
  error_code text not null default '' check (char_length(error_code)<=80),
  response_by text not null default ''
);
alter table public.plotao_job_referrals add column if not exists response_by text not null default '';
create unique index if not exists plotao_one_active_referral_per_job on public.plotao_job_referrals(job_id) where status in ('sending','sent','accepted');
create index if not exists plotao_job_referrals_job_created_idx on public.plotao_job_referrals(job_id,created_at desc);
create index if not exists plotao_job_referrals_partner_created_idx on public.plotao_job_referrals(partner_id,created_at desc);
alter table public.plotao_job_referrals enable row level security;
revoke all on public.plotao_job_referrals from public,anon,authenticated;
grant select,insert,update,delete on public.plotao_job_referrals to service_role;
alter table public.plotao_audit_log drop constraint if exists plotao_audit_log_entity_type_check;
alter table public.plotao_audit_log add constraint plotao_audit_log_entity_type_check check (entity_type in ('lead','customer','address','quote','quote_item','job','job_item','partner','referral','job_referral'));

create or replace function public.plotao_audit_business_row()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare old_data jsonb; new_data jsonb; row_id uuid; entity text; actor text; action_name text;
begin
  entity:=case tg_table_name
    when 'plotao_leads' then 'lead' when 'plotao_customers' then 'customer'
    when 'plotao_customer_addresses' then 'address' when 'plotao_partners' then 'partner'
    when 'plotao_lead_referrals' then 'referral' when 'plotao_job_referrals' then 'job_referral'
    when 'plotao_quotes' then 'quote' when 'plotao_quote_items' then 'quote_item'
    when 'plotao_jobs' then 'job' when 'plotao_job_items' then 'job_item'
    else 'customer' end;
  actor:=coalesce(nullif((nullif(current_setting('request.jwt.claims',true),'')::jsonb)->>'email',''),case when tg_op='INSERT' and entity in ('lead','customer','address') then 'web intake' else 'michalsurmanek@seznam.cz' end);
  if tg_op='INSERT' then new_data:=to_jsonb(new)-'communication';row_id:=(new_data->>'id')::uuid;action_name:='created';old_data:=null;
  elsif tg_op='UPDATE' then old_data:=to_jsonb(old)-'communication';new_data:=to_jsonb(new)-'communication';row_id:=(new_data->>'id')::uuid;if old_data=new_data then return new;end if;action_name:=case when old_data->>'status' is distinct from new_data->>'status' then 'status_changed' else 'updated' end;
  else old_data:=to_jsonb(old)-'communication';row_id:=(old_data->>'id')::uuid;new_data:=null;action_name:='deleted';end if;
  insert into public.plotao_audit_log(entity_type,entity_id,action,actor_email,before_data,after_data) values(entity,row_id,action_name,actor,old_data,new_data);
  if tg_op='DELETE' then return old;end if;return new;
end;$$;
drop trigger if exists plotao_job_referrals_audit on public.plotao_job_referrals;
create trigger plotao_job_referrals_audit after insert or update or delete on public.plotao_job_referrals for each row execute function public.plotao_audit_business_row();