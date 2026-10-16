create unique index if not exists plotao_products_sku_unique
  on public.plotao_products (sku)
  where sku <> '';

insert into public.plotao_products (
  sku, name, category, dimensions, color, unit,
  purchase_price, sale_price, vat_percent, availability,
  photo_url, notes, active, updated_by
)
select
  case when length(source_sku) <= 78 then 'P-' || source_sku
       else left(source_sku, 68) || '-' || substr(md5(source_sku), 1, 8) end,
  left(btrim(product_name), 200),
  case
    when lower(source_category || ' ' || product_name) ~ 'panel|panelov' then 'panel'
    when lower(source_category || ' ' || product_name) ~ 'pletiv|pletivo|dr[aá]t[eě]|sva[rř]ovan[eé] pletivo|ohradn[ií]' then 'mesh'
    when lower(source_category || ' ' || product_name) ~ 'beton' then 'concrete'
    when lower(source_category || ' ' || product_name) ~ 'gabion' then 'gabion'
    when lower(source_category || ' ' || product_name) ~ 'hlin[ií]k|aluminium' then 'aluminium'
    when lower(source_category || ' ' || product_name) ~ 'br[aá]n|brank|z[aá]vora' then 'gate'
    when lower(source_category || ' ' || product_name) ~ 'zd[ií]c|zdiv|cihl|tv[aá]rn' then 'masonry'
    when lower(source_category || ' ' || product_name) ~ 'doprava|p[rř]eprav|transport' then 'transport'
    when lower(source_category || ' ' || product_name) ~ 'kovov|kov|ocel' then 'metal'
    when lower(source_category || ' ' || product_name) ~ 'p[rř][ií]slu[sš]enstv[ií]|mont[aá][zž]|[uú]chyt|sloupek|obj[ií]mk|[sš]roub|konzol|[sš]rouben|spojk|dr[zž][aá]k' then 'accessory'
    else 'other'
  end,
  '', '', 'ks', 0, price_net, 21,
  case
    when lower(availability) ~ 'vyprod[aá]no|nedostupn[eé]' then 'unavailable'
    when lower(availability) ~ 'zak[aá]zku|v[yý]robu|na dotaz' then 'made_to_order'
    when lower(availability) ~ 'objedn[aá]me|na objedn[aá]vku|do [0-9]+ dn' then 'on_order'
    else 'available'
  end,
  '', 'Výchozí katalogová položka; doplňte prodejní cenu, dostupnost, parametry a produktovou fotografii.',
  true, 'katalog-import'
from public.plotao_competitor_prices
where not exists (
  select 1 from public.plotao_products p
  where p.sku = case when length(plotao_competitor_prices.source_sku) <= 78
                     then 'P-' || plotao_competitor_prices.source_sku
                     else left(plotao_competitor_prices.source_sku, 68) || '-' || substr(md5(plotao_competitor_prices.source_sku), 1, 8) end
);
