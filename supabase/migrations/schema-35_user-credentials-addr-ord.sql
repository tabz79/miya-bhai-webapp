-- enable uuid generator
create extension if not exists "pgcrypto";

-- user_credentials (password storage)
create table if not exists public.user_credentials (
  user_id uuid primary key references public.users(id) on delete cascade,
  password_hash text not null,
  created_at timestamptz default now()
);

-- addresses
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  label text,
  line1 text,
  line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function update_addresses_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

drop trigger if exists update_addresses_updated_at on public.addresses;
create trigger update_addresses_updated_at
before update on public.addresses
for each row
execute procedure update_addresses_updated_at();

-- orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  status text not null default 'pending',
  total numeric(10,2) not null default 0,
  delivery_address_id uuid references public.addresses(id),
  metadata jsonb,
  placed_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function update_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

drop trigger if exists update_orders_updated_at on public.orders;
create trigger update_orders_updated_at
before update on public.orders
for each row
execute procedure update_orders_updated_at();

-- order_items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id text,
  name text,
  quantity int default 1,
  unit_price numeric(10,2) not null default 0,
  total_price numeric(10,2) not null default 0,
  created_at timestamptz default now()
);
