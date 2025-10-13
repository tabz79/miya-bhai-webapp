-- Insert a profile for the existing user (dev convenience)
insert into public.profiles (id, full_name, phone, avatar_url)
values (
  '8b320dfc-1d3a-4266-9e84-757df14bd6cb', -- your user id
  'Charcoal Dinerr',
  '+91-000-000-0000',
  null
)
on conflict (id) do update set
  full_name = excluded.full_name,
  phone = excluded.phone,
  updated_at = now();
