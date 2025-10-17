-- Make user_id unique so ON CONFLICT (user_id) works
create unique index if not exists idx_profiles_user_id_unique on public.profiles (user_id);

-- quick verify
select column_name, column_default, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;

-- confirm indexes
select indexname, indexdef
from pg_indexes
where schemaname='public' and tablename='profiles';
