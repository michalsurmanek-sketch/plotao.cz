alter table public.plotao_jobs
  add column if not exists quote_discount_percent numeric(5,2) not null default 0
  check (quote_discount_percent between 0 and 100);
alter table public.plotao_job_items
  add column if not exists discount_percent numeric(5,2) not null default 0
  check (discount_percent between 0 and 100);

create or replace function public.plotao_create_job_from_quote(p_quote_id uuid,p_actor text default '')
returns public.plotao_jobs
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  q public.plotao_quotes;
  l public.plotao_leads;
  existing_job public.plotao_jobs;
  created_job public.plotao_jobs;
  item_count integer;
  purchase_sum numeric(14,2);
  sale_sum numeric(14,2);
begin
  select * into q from public.plotao_quotes where id=p_quote_id for update;
  if q.id is null then raise exception 'quote not found'; end if;

  select * into existing_job from public.plotao_jobs where quote_id=p_quote_id;
  if existing_job.id is not null then return existing_job; end if;
  if q.status<>'accepted' then raise exception 'quote must be accepted'; end if;

  select * into l from public.plotao_leads where id=q.lead_id;
  if l.id is null or q.customer_id is null then raise exception 'quote relationship missing'; end if;

  select count(*),
         coalesce(sum(cost_total),0),
         coalesce(sum(net_total+vat_total),0)
    into item_count,purchase_sum,sale_sum
    from public.plotao_quote_items where quote_id=q.id;
  if item_count=0 then raise exception 'accepted quote has no items'; end if;

  insert into public.plotao_jobs(
    lead_id,quote_id,customer_id,status,site_address,purchase_total,sale_total,
    quote_discount_percent,note,created_by
  ) values (
    q.lead_id,q.id,q.customer_id,'preparing',left(coalesce(l.place,''),255),
    purchase_sum,round(sale_sum*(1-q.discount_percent/100),2),
    q.discount_percent,left(coalesce(q.note,''),4000),left(coalesce(p_actor,''),254)
  ) returning * into created_job;

  insert into public.plotao_job_items(
    job_id,position,category,product_name,description,sku,quantity,unit,
    purchase_unit_price,sale_unit_price,vat_percent,discount_percent
  )
  select created_job.id,position,category,product_name,description,sku,quantity,unit,
         purchase_unit_price,sale_unit_price,vat_percent,discount_percent
    from public.plotao_quote_items
   where quote_id=q.id
   order by position;

  return created_job;
end;
$$;
revoke all on function public.plotao_create_job_from_quote(uuid,text) from public,anon,authenticated;
grant execute on function public.plotao_create_job_from_quote(uuid,text) to service_role;