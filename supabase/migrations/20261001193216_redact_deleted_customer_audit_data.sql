-- Remove one complete CRM customer group only when it has no offers or jobs.
-- The Edge Function authenticates the administrator before invoking this RPC.
create or replace function public.plotao_admin_delete_customer_leads(
  p_lead_ids uuid[],
  p_identity_type text,
  p_identity_value text
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  lead_count integer;
  expected_count integer;
  quote_count integer;
  job_count integer;
  customer_ids uuid[];
  address_ids uuid[];
  customer_count integer := 0;
begin
  if p_lead_ids is null or cardinality(p_lead_ids) < 1 or cardinality(p_lead_ids) > 100
     or cardinality(p_lead_ids) <> (select count(distinct lead_id) from unnest(p_lead_ids) as u(lead_id))
     or p_identity_type not in ('email','phone','lead')
     or nullif(btrim(p_identity_value),'') is null then
    return jsonb_build_object('error','invalid_customer_selection');
  end if;

  -- Briefly serialize against concurrent lead submissions so the verified
  -- CRM group cannot gain a new row between validation and deletion.
  lock table public.plotao_leads in share row exclusive mode;

  -- Lock and verify the entire group, so a stale UI selection cannot delete
  -- only part of a customer history or records belonging to another contact.
  if p_identity_type='email' then
    select count(*) into expected_count from public.plotao_leads
      where nullif(btrim(email),'') is not null and lower(btrim(email))=lower(btrim(p_identity_value));
  elsif p_identity_type='phone' then
    select count(*) into expected_count from public.plotao_leads
      where nullif(btrim(email),'') is null
        and regexp_replace(coalesce(phone,''),'\D','','g')=p_identity_value;
  else
    select count(*) into expected_count from public.plotao_leads
      where id::text=p_identity_value and nullif(btrim(email),'') is null
        and nullif(regexp_replace(coalesce(phone,''),'\D','','g'),'') is null;
  end if;

  perform l.id from public.plotao_leads l
    where l.id=any(p_lead_ids)
      and case p_identity_type
        when 'email' then nullif(btrim(l.email),'') is not null and lower(btrim(l.email))=lower(btrim(p_identity_value))
        when 'phone' then nullif(btrim(l.email),'') is null and regexp_replace(coalesce(l.phone,''),'\D','','g')=p_identity_value
        else l.id::text=p_identity_value and nullif(btrim(l.email),'') is null and nullif(regexp_replace(coalesce(l.phone,''),'\D','','g'),'') is null
      end
    for update;
  select count(*) into lead_count from public.plotao_leads l
    where l.id=any(p_lead_ids)
      and case p_identity_type
        when 'email' then nullif(btrim(l.email),'') is not null and lower(btrim(l.email))=lower(btrim(p_identity_value))
        when 'phone' then nullif(btrim(l.email),'') is null and regexp_replace(coalesce(l.phone,''),'\D','','g')=p_identity_value
        else l.id::text=p_identity_value and nullif(btrim(l.email),'') is null and nullif(regexp_replace(coalesce(l.phone,''),'\D','','g'),'') is null
      end;
  if lead_count<>cardinality(p_lead_ids) or lead_count<>expected_count then
    return jsonb_build_object('error','customer_group_changed');
  end if;

  select coalesce(array_agg(distinct customer_id) filter (where customer_id is not null),'{}'::uuid[])
    into customer_ids from public.plotao_leads where id=any(p_lead_ids);
  perform 1 from public.plotao_customers where id=any(customer_ids) for update;
  select coalesce(array_agg(id),'{}'::uuid[]) into address_ids
    from public.plotao_customer_addresses where customer_id=any(customer_ids) or lead_id=any(p_lead_ids);

  select count(*) into quote_count from public.plotao_quotes
    where lead_id=any(p_lead_ids) or customer_id=any(customer_ids);
  select count(*) into job_count from public.plotao_jobs
    where lead_id=any(p_lead_ids) or customer_id=any(customer_ids);
  if quote_count>0 or job_count>0 then
    return jsonb_build_object('error','customer_has_quotes_or_jobs','quote_count',quote_count,'job_count',job_count);
  end if;

  delete from public.plotao_leads where id=any(p_lead_ids);

  -- Remove customer records only when nothing else still refers to them.
  delete from public.plotao_customers c
    where c.id=any(customer_ids)
      and not exists(select 1 from public.plotao_leads l where l.customer_id=c.id)
      and not exists(select 1 from public.plotao_quotes q where q.customer_id=c.id)
      and not exists(select 1 from public.plotao_jobs j where j.customer_id=c.id);
  get diagnostics customer_count = row_count;

  -- Keep the audit event metadata, but remove retained contact and address data.
  update public.plotao_audit_log set before_data=null,after_data=null
    where (entity_type='lead' and entity_id=any(p_lead_ids))
       or (entity_type='customer' and entity_id=any(customer_ids))
       or (entity_type='address' and entity_id=any(address_ids));

  return jsonb_build_object('deleted_leads',lead_count,'deleted_customers',customer_count);
end;
$$;

revoke all on function public.plotao_admin_delete_customer_leads(uuid[],text,text) from public, anon, authenticated;
grant delete on public.plotao_leads to service_role;
grant execute on function public.plotao_admin_delete_customer_leads(uuid[],text,text) to service_role;
