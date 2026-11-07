-- Puntuación por criterios (1–5 cada uno). `rating` sigue siendo la nota global 1–5 (media redondeada).
alter table public.ratings
  add column if not exists score_temperature smallint check (score_temperature between 1 and 5),
  add column if not exists score_foam smallint check (score_foam between 1 and 5),
  add column if not exists score_glass smallint check (score_glass between 1 and 5),
  add column if not exists score_freshness smallint check (score_freshness between 1 and 5);

alter table public.ratings alter column status set default 'visible';

create index if not exists ratings_venue_visible_idx on public.ratings (venue_id) where status = 'visible';
create index if not exists ratings_iphash_venue_idx on public.ratings (ip_hash, venue_id, created_at desc);

-- Las inserciones pasan por el servidor (validación + límite por IP). Se elimina la inserción pública directa,
-- que permitía a cualquiera con la clave pública escribir valoraciones saltándose las validaciones.
drop policy if exists "Allow public insert for ratings" on public.ratings;

-- Origen de las coordenadas: 'google' (caché temporal, máx. 30 días según los términos de Google Maps Platform)
-- o 'manual' (verificadas por el equipo en el propio local: dato propio, sin caducidad).
alter table public.venues
  add column if not exists coords_source text not null default 'google' check (coords_source in ('google','manual')),
  add column if not exists coords_updated_at timestamptz;

update public.venues set coords_updated_at = coalesce(updated_at, now())
  where coords_updated_at is null and latitude is not null;
