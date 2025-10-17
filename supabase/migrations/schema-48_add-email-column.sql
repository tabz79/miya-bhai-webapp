-- add missing email column if it doesn't exist
alter table public.profiles
  add column if not exists email text;

-- sanity: list columns for verification
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
order by ordinal_position;
