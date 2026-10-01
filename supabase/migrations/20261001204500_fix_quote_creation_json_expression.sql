create or replace function public.plotao_create_quote_from_lead(p_lead_id uuid, p_actor text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_lead public.plotao_leads%rowtype;
  v_quote public.plotao_quotes%rowtype;
  v_payload jsonb;
  v_segments jsonb;
  v_length numeric := 0;
  v_details text;
  v_name text;
  v_segment jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_lead_id::text, 0));
  select * into v_lead from public.plotao_leads where id = p_lead_id for update;
  if not found then return jsonb_build_object('error', 'lead_not_found'); end if;
  if v_lead.customer_id is null then return jsonb_build_object('error', 'customer_link_missing'); end if;

  select q.* into v_quote from public.plotao_quotes q
  where q.lead_id = p_lead_id order by q.version desc, q.created_at desc limit 1;
  if found then return to_jsonb(v_quote); end if;

  v_payload := case when jsonb_typeof(v_lead.payload) = 'object' then v_lead.payload else '{}'::jsonb end;
  v_segments := case when jsonb_typeof(v_payload->'segments') = 'array' then v_payload->'segments' else '[]'::jsonb end;
  for v_segment in select value from jsonb_array_elements(v_segments)
  loop
    v_length := v_length + greatest(0, coalesce(nullif(v_segment->>'length','')::numeric,0));
  end loop;

  v_details := concat_ws(E'\n',
    nullif(v_payload->>'scope',''),
    case when nullif(v_payload->>'height','') is not null then 'Výška ' || (v_payload->>'height') || ' cm' end,
    (select string_agg('Úsek '||n||': '||coalesce(nullif(value->>'length',''),'0')||' m','; ' order by n)
      from jsonb_array_elements(v_segments) with ordinality s(value,n)),
    (select string_agg(value,' · ')
      from jsonb_array_elements_text(case when jsonb_typeof(v_payload->'options')='array' then v_payload->'options' else '[]'::jsonb end)),
    case when nullif(v_lead.note,'') is not null then 'Poznámka: '||v_lead.note end
  );

  v_name := left(coalesce(nullif(v_payload->>'fenceType',''),'Oplocení'),200);
  insert into public.plotao_quotes(lead_id,customer_id,version,status,created_by,source_snapshot)
  values(v_lead.id,v_lead.customer_id,1,'draft',left(coalesce(p_actor,'admin'),254),v_payload)
  returning * into v_quote;

  insert into public.plotao_quote_items(quote_id,position,category,product_name,description,quantity,unit,purchase_unit_price,sale_unit_price,vat_percent)
  values(v_quote.id,1,'material',v_name,left(coalesce(v_details,''),1000),
    case when v_length>0 then v_length else 1 end,
    case when v_length>0 then 'm' else 'soubor' end,0,0,21);
  return to_jsonb(v_quote);
end;
$$;
revoke all on function public.plotao_create_quote_from_lead(uuid,text) from public, anon, authenticated;
grant execute on function public.plotao_create_quote_from_lead(uuid,text) to service_role;
