create or replace function public.plotao_save_quote_with_snapshot(
  p_quote_id uuid,
  p_discount_percent numeric,
  p_note text,
  p_valid_until date,
  p_items jsonb,
  p_source_snapshot jsonb
)
returns public.plotao_quotes
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  saved_quote public.plotao_quotes;
begin
  if p_discount_percent is null or p_discount_percent < 0 or p_discount_percent > 100 then
    raise exception 'invalid discount';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 100 then
    raise exception 'invalid items';
  end if;
  if p_source_snapshot is not null and jsonb_typeof(p_source_snapshot) <> 'object' then
    raise exception 'invalid source snapshot';
  end if;

  update public.plotao_quotes
  set discount_percent = p_discount_percent,
      note = left(coalesce(p_note, ''), 4000),
      valid_until = p_valid_until,
      source_snapshot = coalesce(p_source_snapshot, source_snapshot),
      updated_at = now()
  where id = p_quote_id and status = 'draft'
  returning * into saved_quote;
  if saved_quote.id is null then
    raise exception 'draft quote not found';
  end if;

  delete from public.plotao_quote_items where quote_id = p_quote_id;
  insert into public.plotao_quote_items(
    quote_id, position, category, product_name, description, sku,
    quantity, unit, purchase_unit_price, sale_unit_price, discount_percent, vat_percent
  )
  select p_quote_id, item.position, item.category, left(item.product_name, 200),
         left(coalesce(item.description, ''), 1000), left(coalesce(item.sku, ''), 80),
         item.quantity, left(item.unit, 20), item.purchase_unit_price,
         item.sale_unit_price, item.discount_percent, item.vat_percent
  from jsonb_to_recordset(p_items) as item(
    position integer, category text, product_name text, description text, sku text,
    quantity numeric, unit text, purchase_unit_price numeric, sale_unit_price numeric,
    discount_percent numeric, vat_percent numeric
  )
  order by item.position;

  return saved_quote;
end;
$$;

revoke all on function public.plotao_save_quote_with_snapshot(uuid,numeric,text,date,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.plotao_save_quote_with_snapshot(uuid,numeric,text,date,jsonb,jsonb) to service_role;
