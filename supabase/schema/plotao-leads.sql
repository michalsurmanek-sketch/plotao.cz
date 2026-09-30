-- PLOTAO lead backend schema.
-- Apply to the dedicated PLOTAO Supabase project only.
-- This file is intentionally a schema source, not a migration-history entry.
-- After applying with execute_sql, generate the canonical migration using the Supabase CLI/MCP workflow.

create table if not exists public.plotao_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submitted_at timestamptz not null,
  source text not null default 'plotao.cz' check (source = 'plotao.cz'),
  mode text not null check (mode in ('lead','help','partner')),
  name text not null check (char_length(name) between 2 and 120),
  phone text not null default '' check (char_length(phone) = 0 or char_length(phone) between 9 and 20),
  email text not null default '' check (char_length(email) = 0 or char_length(email) between 3 and 254),
  place text not null default '' check (char_length(place) <= 200),
  note text not null default '' check (char_length(note) <= 4000),
  payload jsonb not null,
  status text not null default 'new' check (status in ('new','review','waiting_customer','preparing_quote','quote_sent','waiting_decision','ordered','partner_assigned','completed','closed','contacted')),
  assigned_to text not null default '',
  next_action text not null default '',
  next_action_at timestamptz,
  partner_name text not null default '',
  region text not null default '',
  outcome text not null default '',
  updated_at timestamptz not null default now(),
  communication jsonb not null default '[]'::jsonb
);

create index if not exists plotao_leads_created_at_idx on public.plotao_leads (created_at desc);
create index if not exists plotao_leads_status_created_at_idx on public.plotao_leads (status, created_at desc);
create index if not exists plotao_leads_mode_created_at_idx on public.plotao_leads (mode, created_at desc);

alter table public.plotao_leads enable row level security;
revoke all on table public.plotao_leads from anon, authenticated;
grant select, insert, update on table public.plotao_leads to service_role;

comment on table public.plotao_leads is 'Private PLOTAO contact/lead intake. Browser roles have no table grants; writes go through the submit-lead Edge Function.';
comment on column public.plotao_leads.payload is 'Server-validated normalized lead snapshot. displayedPrice is informational only, never contractual.';

create table if not exists public.plotao_lead_rate_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  key_hash text not null check (char_length(key_hash) = 64)
);

create index if not exists plotao_lead_rate_events_key_created_idx
  on public.plotao_lead_rate_events (key_hash, created_at desc);

alter table public.plotao_lead_rate_events enable row level security;
revoke all on table public.plotao_lead_rate_events from anon, authenticated;
grant select, insert, delete on table public.plotao_lead_rate_events to service_role;

comment on table public.plotao_lead_rate_events is 'Short-lived anti-abuse events keyed by a salted SHA-256 digest. Raw IP addresses are never stored.';


-- Partner registry and auditable, one-at-a-time lead handoff.
create table if not exists public.plotao_partners (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_name text not null check (char_length(btrim(company_name)) between 2 and 160),
  contact_name text not null default '' check (char_length(contact_name) <= 120),
  email text not null check (char_length(email) between 3 and 254),
  phone text not null default '' check (char_length(phone) <= 40),
  ico text not null default '' check (char_length(ico) <= 20),
  registered_address text not null default '' check (char_length(registered_address) <= 255),
  regions text[] not null default '{}',
  fence_types text[] not null default '{}',
  service_types text[] not null default ARRAY['material_only']::text[] check (
    cardinality(service_types) >= 1
    and service_types <@ ARRAY['installation_material','installation_only','material_only']::text[]
  ),
  active boolean not null default true
);

create index if not exists plotao_partners_active_idx on public.plotao_partners (active, company_name);
create index if not exists plotao_partners_regions_gin_idx on public.plotao_partners using gin (regions);
create index if not exists plotao_partners_fence_types_gin_idx on public.plotao_partners using gin (fence_types);
create index if not exists plotao_partners_service_types_gin_idx on public.plotao_partners using gin (service_types);

create table if not exists public.plotao_lead_referrals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lead_id uuid not null references public.plotao_leads(id) on delete cascade,
  partner_id uuid not null references public.plotao_partners(id) on delete restrict,
  status text not null default 'sending' check (status in ('sending','sent','accepted','declined','withdrawn','failed')),
  sent_at timestamptz,
  sent_by text not null,
  provider text not null default 'resend',
  provider_id text,
  response_at timestamptz,
  response_note text not null default '' check (char_length(response_note) <= 1000),
  error_code text not null default '' check (char_length(error_code) <= 80)
);

create unique index if not exists plotao_one_active_referral_per_lead
  on public.plotao_lead_referrals (lead_id)
  where status in ('sending','sent','accepted');
create index if not exists plotao_referrals_lead_created_idx
  on public.plotao_lead_referrals (lead_id, created_at desc);
create index if not exists plotao_referrals_partner_created_idx
  on public.plotao_lead_referrals (partner_id, created_at desc);

alter table public.plotao_partners enable row level security;
alter table public.plotao_lead_referrals enable row level security;
revoke all on public.plotao_partners from anon, authenticated;
revoke all on public.plotao_lead_referrals from anon, authenticated;
grant select, insert, update, delete on public.plotao_partners to service_role;
grant select, insert, update, delete on public.plotao_lead_referrals to service_role;


-- Customer, offer, job and audit schema added 2026-09-30.
-- PLOTAO CRM and offer-to-job foundation. Additive and non-destructive.
create table if not exists public.plotao_customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 160),
  email text not null default '' check (char_length(email) <= 254),
  phone text not null default '' check (char_length(phone) <= 40),
  notes text not null default '' check (char_length(notes) <= 4000),
  email_key text generated always as (nullif(lower(btrim(email)), '')) stored
);
create unique index if not exists plotao_customers_email_key_idx
  on public.plotao_customers(email_key) where email_key is not null;
create index if not exists plotao_customers_name_idx
  on public.plotao_customers(lower(full_name));

alter table public.plotao_leads
  add column if not exists customer_id uuid references public.plotao_customers(id) on delete set null;
create index if not exists plotao_leads_customer_created_idx
  on public.plotao_leads(customer_id, created_at desc);

-- Backfill one CRM identity per normalized e-mail; phone-only requests retain
-- individual customer rows so shared household numbers never merge people.
insert into public.plotao_customers(id,full_name,email,phone,created_at,updated_at)
select distinct on (lower(btrim(email)))
  id, btrim(name), lower(btrim(email)), btrim(phone), created_at, now()
from public.plotao_leads
where nullif(btrim(email),'') is not null
order by lower(btrim(email)), created_at, id
on conflict (email_key) where email_key is not null do nothing;

insert into public.plotao_customers(id,full_name,email,phone,created_at,updated_at)
select l.id, btrim(l.name), '', btrim(l.phone), l.created_at, now()
from public.plotao_leads l
where nullif(btrim(l.email),'') is null
on conflict (id) do nothing;

update public.plotao_leads l
set customer_id=c.id
from public.plotao_customers c
where l.customer_id is null
  and (
    (nullif(btrim(l.email),'') is not null and c.email_key=lower(btrim(l.email)))
    or (nullif(btrim(l.email),'') is null and c.id=l.id)
  );

create table if not exists public.plotao_customer_addresses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_id uuid not null references public.plotao_customers(id) on delete cascade,
  lead_id uuid references public.plotao_leads(id) on delete set null,
  address_type text not null default 'project' check (address_type in ('project','billing','registered')),
  label text not null default '',
  address_text text not null check (char_length(address_text) between 2 and 255),
  region text not null default '',
  is_primary boolean not null default false
);
create unique index if not exists plotao_customer_addresses_lead_idx
  on public.plotao_customer_addresses(lead_id) where lead_id is not null;
create index if not exists plotao_customer_addresses_customer_idx
  on public.plotao_customer_addresses(customer_id, created_at desc);

insert into public.plotao_customer_addresses(customer_id,lead_id,address_type,label,address_text,region,created_at)
select customer_id,id,'project','Místo realizace',btrim(place),coalesce(region,''),created_at
from public.plotao_leads
where customer_id is not null and char_length(btrim(place))>=2
on conflict (lead_id) where lead_id is not null do nothing;

create or replace function public.plotao_resolve_lead_customer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare resolved_customer_id uuid;
begin
  if new.customer_id is not null then return new; end if;
  if nullif(btrim(new.email),'') is not null then
    insert into public.plotao_customers(full_name,email,phone)
    values (btrim(new.name),lower(btrim(new.email)),btrim(new.phone))
    on conflict (email_key) where email_key is not null
    do update set
      phone=case when public.plotao_customers.phone='' then excluded.phone else public.plotao_customers.phone end,
      updated_at=now()
    returning id into resolved_customer_id;
  else
    insert into public.plotao_customers(full_name,email,phone)
    values (btrim(new.name),'',btrim(new.phone))
    returning id into resolved_customer_id;
  end if;
  new.customer_id:=resolved_customer_id;
  return new;
end;
$$;
drop trigger if exists plotao_leads_resolve_customer on public.plotao_leads;
create trigger plotao_leads_resolve_customer
before insert on public.plotao_leads
for each row execute function public.plotao_resolve_lead_customer();

create or replace function public.plotao_capture_lead_address()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.customer_id is not null and char_length(btrim(new.place))>=2 then
    insert into public.plotao_customer_addresses(customer_id,lead_id,address_type,label,address_text,region)
    values (new.customer_id,new.id,'project','Místo realizace',btrim(new.place),coalesce(new.region,''))
    on conflict (lead_id) where lead_id is not null do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists plotao_leads_capture_address on public.plotao_leads;
create trigger plotao_leads_capture_address
after insert on public.plotao_leads
for each row execute function public.plotao_capture_lead_address();

create sequence if not exists public.plotao_quote_number_seq;
create sequence if not exists public.plotao_job_number_seq;

create table if not exists public.plotao_quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  quote_number text not null unique,
  version integer not null default 1 check (version > 0),
  lead_id uuid not null references public.plotao_leads(id) on delete restrict,
  customer_id uuid not null references public.plotao_customers(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','sent','accepted','declined','expired','cancelled')),
  currency text not null default 'CZK' check (currency='CZK'),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  note text not null default '' check (char_length(note)<=4000),
  valid_until date,
  sent_at timestamptz,
  responded_at timestamptz,
  created_by text not null default '',
  source_snapshot jsonb not null default '{}'::jsonb
);
create unique index if not exists plotao_quotes_lead_version_idx on public.plotao_quotes(lead_id,version);
create index if not exists plotao_quotes_customer_created_idx on public.plotao_quotes(customer_id,created_at desc);
create index if not exists plotao_quotes_status_created_idx on public.plotao_quotes(status,created_at desc);

create or replace function public.plotao_assign_document_number()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_table_name='plotao_quotes' and (new.quote_number is null or new.quote_number='') then
    new.quote_number:='NAB-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.plotao_quote_number_seq')::text,5,'0');
  elsif tg_table_name='plotao_jobs' and (new.job_number is null or new.job_number='') then
    new.job_number:='ZAK-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.plotao_job_number_seq')::text,5,'0');
  end if;
  return new;
end;
$$;
drop trigger if exists plotao_quotes_number on public.plotao_quotes;
create trigger plotao_quotes_number before insert on public.plotao_quotes
for each row execute function public.plotao_assign_document_number();

create table if not exists public.plotao_quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.plotao_quotes(id) on delete cascade,
  position integer not null default 0,
  category text not null default 'other' check (category in ('material','installation','transport','other')),
  product_name text not null check (char_length(btrim(product_name)) between 1 and 200),
  description text not null default '' check (char_length(description)<=1000),
  sku text not null default '' check (char_length(sku)<=80),
  quantity numeric(12,3) not null default 1 check (quantity>0),
  unit text not null default 'ks' check (char_length(unit) between 1 and 20),
  purchase_unit_price numeric(12,2) not null default 0 check (purchase_unit_price>=0),
  sale_unit_price numeric(12,2) not null default 0 check (sale_unit_price>=0),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  vat_percent numeric(5,2) not null default 21 check (vat_percent between 0 and 100),
  net_total numeric(14,2) generated always as (round(quantity*sale_unit_price*(1-discount_percent/100),2)) stored,
  cost_total numeric(14,2) generated always as (round(quantity*purchase_unit_price,2)) stored,
  vat_total numeric(14,2) generated always as (round(quantity*sale_unit_price*(1-discount_percent/100)*vat_percent/100,2)) stored
);
create index if not exists plotao_quote_items_quote_position_idx on public.plotao_quote_items(quote_id,position);

create table if not exists public.plotao_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  job_number text not null unique,
  lead_id uuid not null references public.plotao_leads(id) on delete restrict,
  quote_id uuid unique references public.plotao_quotes(id) on delete restrict,
  customer_id uuid not null references public.plotao_customers(id) on delete restrict,
  partner_id uuid references public.plotao_partners(id) on delete set null,
  status text not null default 'preparing' check (status in ('preparing','material_ordered','material_delivered','scheduled','in_progress','paused','completed','cancelled','complaint')),
  site_address text not null default '',
  planned_start_at timestamptz,
  planned_end_at timestamptz,
  completed_at timestamptz,
  purchase_total numeric(14,2) not null default 0 check (purchase_total>=0),
  sale_total numeric(14,2) not null default 0 check (sale_total>=0),
  note text not null default '' check (char_length(note)<=4000),
  created_by text not null default ''
);
create index if not exists plotao_jobs_customer_created_idx on public.plotao_jobs(customer_id,created_at desc);
create index if not exists plotao_jobs_partner_status_idx on public.plotao_jobs(partner_id,status);
create index if not exists plotao_jobs_status_planned_idx on public.plotao_jobs(status,planned_start_at);

create table if not exists public.plotao_job_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.plotao_jobs(id) on delete cascade,
  position integer not null default 0,
  category text not null default 'other' check (category in ('material','installation','transport','other')),
  product_name text not null check (char_length(btrim(product_name)) between 1 and 200),
  description text not null default '',
  sku text not null default '',
  quantity numeric(12,3) not null default 1 check (quantity>0),
  unit text not null default 'ks',
  purchase_unit_price numeric(12,2) not null default 0 check (purchase_unit_price>=0),
  sale_unit_price numeric(12,2) not null default 0 check (sale_unit_price>=0),
  vat_percent numeric(5,2) not null default 21 check (vat_percent between 0 and 100)
);
create index if not exists plotao_job_items_job_position_idx on public.plotao_job_items(job_id,position);

create table if not exists public.plotao_audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  entity_type text not null check (entity_type in ('lead','customer','address','quote','quote_item','job','job_item','partner','referral')),
  entity_id uuid not null,
  action text not null check (action in ('created','updated','deleted','status_changed')),
  actor_email text not null default '',
  before_data jsonb,
  after_data jsonb,
  request_id text not null default ''
);
create index if not exists plotao_audit_entity_created_idx on public.plotao_audit_log(entity_type,entity_id,created_at desc);
create index if not exists plotao_audit_created_idx on public.plotao_audit_log(created_at desc);

create or replace function public.plotao_audit_business_row()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  old_data jsonb;
  new_data jsonb;
  row_id uuid;
  entity text;
  actor text;
  action_name text;
begin
  entity:=case tg_table_name
    when 'plotao_leads' then 'lead'
    when 'plotao_partners' then 'partner'
    when 'plotao_quotes' then 'quote'
    when 'plotao_quote_items' then 'quote_item'
    when 'plotao_jobs' then 'job'
    when 'plotao_job_items' then 'job_item'
    else 'customer'
  end;
  actor:=coalesce(nullif((nullif(current_setting('request.jwt.claims',true),'')::jsonb)->>'email',''),'michalsurmanek@seznam.cz');
  if tg_op='INSERT' then
    new_data:=to_jsonb(new)-'communication';
    row_id:=(new_data->>'id')::uuid;
    action_name:='created';
    old_data:=null;
  elsif tg_op='UPDATE' then
    old_data:=to_jsonb(old)-'communication';
    new_data:=to_jsonb(new)-'communication';
    row_id:=(new_data->>'id')::uuid;
    if old_data=new_data then return new; end if;
    action_name:=case when old_data->>'status' is distinct from new_data->>'status' then 'status_changed' else 'updated' end;
  else
    old_data:=to_jsonb(old)-'communication';
    row_id:=(old_data->>'id')::uuid;
    new_data:=null;
    action_name:='deleted';
  end if;
  insert into public.plotao_audit_log(entity_type,entity_id,action,actor_email,before_data,after_data)
  values(entity,row_id,action_name,actor,old_data,new_data);
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

-- No browser role receives direct access; reads/writes are served by authenticated
-- Edge Functions using service_role after user authorization.
alter table public.plotao_customers enable row level security;
alter table public.plotao_customer_addresses enable row level security;
alter table public.plotao_quotes enable row level security;
alter table public.plotao_quote_items enable row level security;
alter table public.plotao_jobs enable row level security;
alter table public.plotao_job_items enable row level security;
alter table public.plotao_audit_log enable row level security;

revoke all on public.plotao_customers,public.plotao_customer_addresses,public.plotao_quotes,public.plotao_quote_items,public.plotao_jobs,public.plotao_job_items,public.plotao_audit_log from anon,authenticated;
grant select,insert,update,delete on public.plotao_customers,public.plotao_customer_addresses,public.plotao_quotes,public.plotao_quote_items,public.plotao_jobs,public.plotao_job_items,public.plotao_audit_log to service_role;
grant usage,select on sequence public.plotao_quote_number_seq,public.plotao_job_number_seq,public.plotao_audit_log_id_seq to service_role;

drop trigger if exists plotao_leads_audit on public.plotao_leads;
create trigger plotao_leads_audit after update or delete on public.plotao_leads
for each row execute function public.plotao_audit_business_row();
drop trigger if exists plotao_partners_audit on public.plotao_partners;
create trigger plotao_partners_audit after insert or update or delete on public.plotao_partners
for each row execute function public.plotao_audit_business_row();
drop trigger if exists plotao_quotes_audit on public.plotao_quotes;
create trigger plotao_quotes_audit after insert or update or delete on public.plotao_quotes
for each row execute function public.plotao_audit_business_row();
drop trigger if exists plotao_quote_items_audit on public.plotao_quote_items;
create trigger plotao_quote_items_audit after insert or update or delete on public.plotao_quote_items
for each row execute function public.plotao_audit_business_row();
drop trigger if exists plotao_jobs_audit on public.plotao_jobs;
create trigger plotao_jobs_audit after insert or update or delete on public.plotao_jobs
for each row execute function public.plotao_audit_business_row();
drop trigger if exists plotao_job_items_audit on public.plotao_job_items;
create trigger plotao_job_items_audit after insert or update or delete on public.plotao_job_items
for each row execute function public.plotao_audit_business_row();

-- Full audit coverage for CRM identities and handoff response history.
create or replace function public.plotao_audit_business_row()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare old_data jsonb; new_data jsonb; row_id uuid; entity text; actor text; action_name text;
begin
  entity:=case tg_table_name
    when 'plotao_leads' then 'lead'
    when 'plotao_customers' then 'customer'
    when 'plotao_customer_addresses' then 'address'
    when 'plotao_partners' then 'partner'
    when 'plotao_lead_referrals' then 'referral'
    when 'plotao_quotes' then 'quote'
    when 'plotao_quote_items' then 'quote_item'
    when 'plotao_jobs' then 'job'
    when 'plotao_job_items' then 'job_item'
    else 'customer'
  end;
  actor:=coalesce(nullif((nullif(current_setting('request.jwt.claims',true),'')::jsonb)->>'email',''),case when tg_op='INSERT' and entity in ('lead','customer','address') then 'web intake' else 'michalsurmanek@seznam.cz' end);
  if tg_op='INSERT' then new_data:=to_jsonb(new)-'communication';row_id:=(new_data->>'id')::uuid;action_name:='created';old_data:=null;
  elsif tg_op='UPDATE' then old_data:=to_jsonb(old)-'communication';new_data:=to_jsonb(new)-'communication';row_id:=(new_data->>'id')::uuid;if old_data=new_data then return new;end if;action_name:=case when old_data->>'status' is distinct from new_data->>'status' then 'status_changed' else 'updated' end;
  else old_data:=to_jsonb(old)-'communication';row_id:=(old_data->>'id')::uuid;new_data:=null;action_name:='deleted';end if;
  insert into public.plotao_audit_log(entity_type,entity_id,action,actor_email,before_data,after_data) values(entity,row_id,action_name,actor,old_data,new_data);
  if tg_op='DELETE' then return old;end if;return new;
end;
$$;
drop trigger if exists plotao_leads_audit_insert on public.plotao_leads;
create trigger plotao_leads_audit_insert after insert on public.plotao_leads for each row execute function public.plotao_audit_business_row();
drop trigger if exists plotao_customers_audit on public.plotao_customers;
create trigger plotao_customers_audit after insert or update or delete on public.plotao_customers for each row execute function public.plotao_audit_business_row();
drop trigger if exists plotao_customer_addresses_audit on public.plotao_customer_addresses;
create trigger plotao_customer_addresses_audit after insert or update or delete on public.plotao_customer_addresses for each row execute function public.plotao_audit_business_row();
drop trigger if exists plotao_referrals_audit on public.plotao_lead_referrals;
create trigger plotao_referrals_audit after insert or update or delete on public.plotao_lead_referrals for each row execute function public.plotao_audit_business_row();
revoke all on function public.plotao_resolve_lead_customer() from public,anon,authenticated;
revoke all on function public.plotao_capture_lead_address() from public,anon,authenticated;
revoke all on function public.plotao_audit_business_row() from public,anon,authenticated;


-- Transactional draft quote save: replace line items and quote metadata together.
create or replace function public.plotao_save_quote(p_quote_id uuid,p_discount_percent numeric,p_note text,p_valid_until date,p_items jsonb)
returns public.plotao_quotes
language plpgsql security definer set search_path=public,pg_temp as $$
declare saved_quote public.plotao_quotes;
begin
 if p_discount_percent is null or p_discount_percent<0 or p_discount_percent>100 then raise exception 'invalid discount'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>100 then raise exception 'invalid items'; end if;
 update public.plotao_quotes set discount_percent=p_discount_percent,note=left(coalesce(p_note,''),4000),valid_until=p_valid_until,updated_at=now() where id=p_quote_id and status='draft' returning * into saved_quote;
 if saved_quote.id is null then raise exception 'draft quote not found'; end if;
 delete from public.plotao_quote_items where quote_id=p_quote_id;
 insert into public.plotao_quote_items(quote_id,position,category,product_name,description,sku,quantity,unit,purchase_unit_price,sale_unit_price,discount_percent,vat_percent)
 select p_quote_id,item.position,item.category,left(item.product_name,200),left(coalesce(item.description,''),2000),left(coalesce(item.sku,''),80),item.quantity,left(item.unit,30),item.purchase_unit_price,item.sale_unit_price,item.discount_percent,item.vat_percent from jsonb_to_recordset(p_items) as item(position integer,category text,product_name text,description text,sku text,quantity numeric,unit text,purchase_unit_price numeric,sale_unit_price numeric,discount_percent numeric,vat_percent numeric) order by item.position;
 return saved_quote;
end;
$$;
revoke all on function public.plotao_save_quote(uuid,numeric,text,date,jsonb) from public,anon,authenticated;
grant execute on function public.plotao_save_quote(uuid,numeric,text,date,jsonb) to service_role;
