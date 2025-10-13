-- Allow public reading of profiles (dev convenience)
alter table public.profiles enable row level security;

-- Remove restrictive policies first (safe)
drop policy if exists "Profiles can view own" on public.profiles;

-- Create a permissive select policy so the anon client can read profiles
create policy "Allow public select on profiles"
  on public.profiles
  for select
  using (true);
