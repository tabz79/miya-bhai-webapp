-- 1) ensure gen_random_uuid() is available
create extension if not exists "pgcrypto";

-- 2) set a default for id so inserts generate UUIDs
alter table public.profiles
  alter column id set default gen_random_uuid();

-- 3) fill any existing NULL ids (if any)
update public.profiles
set id = gen_random_uuid()
where id is null;

-- 4) (optional) ensure id is NOT NULL and remains PK
alter table public.profiles
  alter column id set not null;

-- 5) quick verify
select id, user_id, email from public.profiles limit 5;
