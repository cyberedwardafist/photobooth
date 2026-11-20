-- Jalankan sekali di Supabase: SQL Editor > New query > Run

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 30),
  bg text not null check (bg ~ '^#[0-9a-fA-F]{6}$'),
  ink text not null check (ink ~ '^#[0-9a-fA-F]{6}$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.app_stats (
  key text primary key,
  value bigint not null default 0
);

insert into public.app_stats (key, value) values ('downloads', 0) on conflict (key) do nothing;

create or replace function public.increment_downloads()
returns bigint
language sql
security definer
set search_path = public
as $$
  update public.app_stats set value = value + 1 where key = 'downloads' returning value;
$$;

revoke execute on function public.increment_downloads() from public, anon, authenticated;
grant execute on function public.increment_downloads() to service_role;

-- Semua akses lewat API Vercel memakai service role, jadi RLS dikunci tanpa policy.
alter table public.templates enable row level security;
alter table public.app_stats enable row level security;

insert into public.templates (name, bg, ink)
select * from (values
  ('Langit Pagi', '#DBE2F8', '#1E2D5A'),
  ('Krem Stasiun', '#F5E6D5', '#1E2D5A'),
  ('Sakura', '#E6A5C3', '#3B1630'),
  ('Laut Biru', '#83C2F8', '#10285A'),
  ('Gerbong Teal', '#57A9B4', '#0B2F35')
) as v(name, bg, ink)
where not exists (select 1 from public.templates);

-- ===== Panel admin v2: pengaturan situs + log unduhan (idempoten) =====
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.download_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  frame text check (frame is null or char_length(frame) <= 40),
  layout text check (layout is null or char_length(layout) <= 8),
  files int not null default 1 check (files between 0 and 100)
);
create index if not exists download_log_at_idx on public.download_log (at desc);

alter table public.app_settings enable row level security;
alter table public.download_log enable row level security;

create or replace function public.log_download(p_frame text, p_layout text, p_files int)
returns bigint
language sql
security definer
set search_path = public
as $$
  insert into public.download_log (frame, layout, files)
  values (left(p_frame, 40), left(p_layout, 8), greatest(0, least(coalesce(p_files, 1), 100)));
  update public.app_stats set value = value + 1 where key = 'downloads' returning value;
$$;

revoke execute on function public.log_download(text, text, int) from public, anon, authenticated;
grant execute on function public.log_download(text, text, int) to service_role;
