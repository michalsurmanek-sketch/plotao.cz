insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('plotao-site-assets','plotao-site-assets',true,524288,array['image/png','image/x-icon','image/vnd.microsoft.icon'])
on conflict (id) do update set name=excluded.name,public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.plotao_site_settings (
  id text primary key check (id = 'default'),
  favicon_url text,
  updated_at timestamptz not null default now()
);
insert into public.plotao_site_settings (id,favicon_url) values ('default',null)
on conflict (id) do nothing;
alter table public.plotao_site_settings enable row level security;
grant select on public.plotao_site_settings to anon, authenticated;
create policy "Public can read site settings" on public.plotao_site_settings for select to anon, authenticated using (true);
