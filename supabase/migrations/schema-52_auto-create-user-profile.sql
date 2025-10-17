-- ONE-PASTE SAFE MAINTENANCE SCRIPT
-- 1) backup profiles table
create table if not exists public.profiles_backup as
select * from public.profiles;

-- 2) archive orphaned profiles (profiles whose user_id is NOT present in auth.users)
create table if not exists public.profiles_orphaned_archive as
select * from public.profiles p
where not exists (select 1 from auth.users u where u.id = p.user_id);

-- 3) delete the orphaned profile rows (they are archived above)
delete from public.profiles p
where not exists (select 1 from auth.users u where u.id = p.user_id);

-- 4) drop the existing FK constraint on profiles that might point to the wrong table
--    If the constraint name differs, this uses a lookup to drop any FK constraints on profiles.
do $$
declare
  rec record;
begin
  for rec in
    select conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'profiles' and c.contype = 'f'
  loop
    execute format('alter table public.profiles drop constraint if exists %I', rec.conname);
  end loop;
end;
$$;

-- 5) add correct FK referencing auth.users(id)
alter table public.profiles
  add constraint profiles_user_id_fkey
  foreign key (user_id) references auth.users (id)
  on delete cascade;

-- 6) drop any existing trigger/function duplicates and recreate safe trigger function + trigger
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert a profile row if none exists for this auth user (safe defaults)
  if not exists (select 1 from public.profiles where user_id = new.id) then
    insert into public.profiles (user_id, full_name, email, avatar_url, created_at)
    values (
      new.id,
      coalesce(
        nullif(new.raw_user_meta_data->>'full_name',''),
        nullif(new.raw_user_meta_data->>'name',''),
        nullif(new.raw_user_meta_data->>'username',''),
        null
      ),
      new.email,
      coalesce(nullif(new.raw_user_meta_data->>'avatar_url',''), nullif(new.raw_user_meta_data->>'picture',''), null)
    )
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- 7) backfill profiles for any auth.users that still lack a profile (now FK is correct)
insert into public.profiles (user_id, email, created_at)
select u.id, u.email, now()
from auth.users u
where not exists (
  select 1 from public.profiles p where p.user_id = u.id
);

-- 8) quick verification queries (returns counts)
--    (These are harmless selects that show results in the SQL editor)
select
  (select count(*) from public.profiles) as profiles_count,
  (select count(*) from public.profiles_backup) as profiles_backup_count,
  (select count(*) from public.profiles_orphaned_archive) as orphaned_archived_count;
