-- QTrace accounts + cloud snapshots.
-- Run once in the Supabase SQL editor, then create the `datasets` storage
-- bucket (private) before running the storage policy at the bottom.

-- ── Tables ──────────────────────────────────────────────────────────────

create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  frame_count int not null,
  point_count int not null,
  storage_path text not null,
  byte_size bigint,
  checksum text,                       -- sha-256 of the raw frames JSON, for dedupe
  created_at timestamptz not null default now()
);

create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dataset_id uuid not null references public.datasets(id) on delete cascade,
  name text not null,
  action_type text not null default 'named_snapshot',
  label text,
  params jsonb not null default '{}',
  buffer_range int[] not null,
  signal_range int[] not null,
  i_min int not null,
  i_max int not null,
  created_at timestamptz not null default now()
);

create index if not exists datasets_user_created_idx
  on public.datasets (user_id, created_at desc);
-- Supports the upload dedupe lookup.
create index if not exists datasets_user_checksum_idx
  on public.datasets (user_id, checksum);
create index if not exists snapshots_user_created_idx
  on public.snapshots (user_id, created_at desc);
create index if not exists snapshots_dataset_idx
  on public.snapshots (dataset_id);

-- ── Row-level security ──────────────────────────────────────────────────
-- The anon key is public; these policies are what actually separate users.

alter table public.datasets enable row level security;
alter table public.snapshots enable row level security;

drop policy if exists "own datasets" on public.datasets;
create policy "own datasets" on public.datasets
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own snapshots" on public.snapshots;
create policy "own snapshots" on public.snapshots
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Storage ─────────────────────────────────────────────────────────────
-- Create a PRIVATE bucket named `datasets` in the dashboard first.
-- Objects live at `<user_id>/<dataset_id>.json.gz`, so the first path segment
-- is the owner.

drop policy if exists "own dataset files" on storage.objects;
create policy "own dataset files" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'datasets'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'datasets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
