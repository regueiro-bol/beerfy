-- Aplicada en Supabase el 2026-11-07. Catálogo de cervezas de tanque, cervezas por bar y beer_id en ratings.
create table if not exists public.beers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brewery text not null,
  style text,
  unpasteurized boolean not null default false,
  description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.venue_beers (
  venue_id uuid not null references public.venues(id) on delete cascade,
  beer_id uuid not null references public.beers(id) on delete restrict,
  format text not null default 'tanque' check (format in ('tanque')),
  status text not null default 'confirmada' check (status in ('confirmada','por_confirmar','retirada')),
  source text not null default 'equipo' check (source in ('equipo','comunidad','bar')),
  last_confirmed_at timestamptz default now(),
  created_at timestamptz not null default now(),
  primary key (venue_id, beer_id)
);
create index if not exists venue_beers_beer_idx on public.venue_beers (beer_id) where status <> 'retirada';

alter table public.ratings add column if not exists beer_id uuid references public.beers(id);
create index if not exists ratings_venue_beer_idx on public.ratings (venue_id, beer_id) where status = 'visible';

alter table public.beers enable row level security;
alter table public.venue_beers enable row level security;
create policy "Public read published beers" on public.beers for select using (is_published);
create policy "Public read active venue beers" on public.venue_beers for select using (status <> 'retirada');

insert into public.beers (slug, name, brewery, style, unpasteurized, description)
values ('estrella-galicia-de-bodega', 'Estrella Galicia de Bodega', 'Hijos de Rivera', 'Lager', true,
        'Versión sin pasteurizar de Estrella Galicia que llega al bar en cisterna refrigerada y se sirve desde tanque.')
on conflict (slug) do nothing;

insert into public.venue_beers (venue_id, beer_id, source, last_confirmed_at)
select v.id, b.id, 'equipo', coalesce(v.published_at, now())
from public.venues v cross join public.beers b
where b.slug = 'estrella-galicia-de-bodega' and v.serves_eg_bodega
on conflict do nothing;

update public.ratings r set beer_id = b.id
from public.beers b
where b.slug = 'estrella-galicia-de-bodega' and r.beer_id is null;
