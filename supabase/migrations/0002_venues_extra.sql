-- Enable vector extension (just in case it was missed)
create extension if not exists vector;

-- Safely add missing columns to venues using IF NOT EXISTS
alter table public.venues add column if not exists description_ai_version text;
alter table public.venues add column if not exists description_edited_by_human boolean default false;
alter table public.venues add column if not exists pour_quality_ai_score numeric;
alter table public.venues add column if not exists pour_quality_ai_notes text;
alter table public.venues add column if not exists cluster_tags text[];
alter table public.venues add column if not exists embedding vector(1024);

-- Table: Ratings
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues on delete cascade not null,
  rating smallint check (rating between 1 and 5) not null,
  pour_quality text check (pour_quality in ('good','average','bad')),
  comment text,
  visitor_email_hash text,
  user_agent text,
  ip_hash text,
  status text check (status in ('visible','hidden')) default 'visible',
  created_at timestamptz default now()
);

-- Table: Venue Review Synthesis
create table if not exists public.venue_review_synthesis (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues on delete cascade not null,
  generated_at timestamptz default now(),
  source text default 'google_places',
  source_review_count int,
  strengths text[],
  weaknesses text[],
  overall_tone text,
  pour_specific_mentions text,
  ai_prompt_version text not null,
  is_visible boolean default true
);

-- Table: AI Usage Log
create table if not exists public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  function_name text not null,
  prompt_version text not null,
  model text not null,
  input_tokens int,
  output_tokens int,
  estimated_cost_usd numeric(8,4),
  duration_ms int,
  status text check (status in ('success','error','rate_limited')),
  target_type text,
  target_id uuid,
  error_detail text,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.ratings enable row level security;
alter table public.venue_review_synthesis enable row level security;
alter table public.ai_usage_log enable row level security;

-- Policies for public access (anon/authenticated)
create policy "Allow public select for visible ratings" on public.ratings
  for select to public using (status = 'visible');

create policy "Allow public insert for ratings" on public.ratings
  for insert to public with check (true);

create policy "Allow public select for visible review synthesis" on public.venue_review_synthesis
  for select to public using (is_visible = true);

-- ai_usage_log has no policies (only accessible via service_role by default)

-- Indexes for performance
create index if not exists idx_ratings_venue_id on public.ratings (venue_id);
create index if not exists idx_ai_usage_log_created_func on public.ai_usage_log (created_at, function_name);

-- HNSW Vector Index on venues embedding for cosine similarity search
create index if not exists idx_venues_embedding_hnsw on public.venues using hnsw (embedding vector_cosine_ops);
