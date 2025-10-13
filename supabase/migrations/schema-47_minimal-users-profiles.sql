-- 1) Create minimal users table (if missing)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text,
  created_at timestamptz default now(),
  email_verified_at timestamptz
);

-- 2) Create minimal profiles table (if missing)
create table if not exists public.profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  email text,
  created_at timestamptz default now()
);

-- 3) Optional: small sample row for quick smoke test (delete after)
insert into public.users (email, name)
select 'debug@example.com', 'Debug User'
where not exists (select 1 from public.users where email='debug@example.com');
