create table if not exists public.plotao_competitor_prices (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  source_sku text not null,
  source_product_id text not null default '',
  product_name text not null,
  source_category text not null default '',
  source_url text not null,
  price_net numeric(12,2) not null check (price_net >= 0),
  price_gross numeric(12,2) not null check (price_gross >= 0),
  availability text not null default '',
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plotao_competitor_prices_source_sku_unique unique (source_key, source_sku),
  constraint plotao_competitor_prices_source_key_check check (source_key = 'ploty-dobry'),
  constraint plotao_competitor_prices_name_check check (char_length(btrim(product_name)) between 2 and 250),
  constraint plotao_competitor_prices_url_check check (source_url like 'https://www.levne-pletivo.cz/%')
);

create index if not exists plotao_competitor_prices_category_name_idx
  on public.plotao_competitor_prices (source_category, product_name);
create index if not exists plotao_competitor_prices_observed_idx
  on public.plotao_competitor_prices (observed_at desc);

alter table public.plotao_competitor_prices enable row level security;
revoke all on public.plotao_competitor_prices from anon, authenticated;
grant select, insert, update, delete on public.plotao_competitor_prices to service_role;
