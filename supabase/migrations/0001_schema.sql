-- Esquina Pasteburguer - Schema inicial

create extension if not exists "pgcrypto";

-- profiles: espelha auth.users para administradores
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  promo_price numeric(10, 2) check (promo_price is null or promo_price >= 0),
  image_url text,
  available boolean not null default true,
  featured boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promo_price_lower_than_price check (
    promo_price is null or promo_price < price
  )
);

create table if not exists public.neighborhoods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  delivery_fee numeric(10, 2) not null check (delivery_fee >= 0),
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id integer primary key default 1,
  store_name text not null default 'Esquina Pasteburguer',
  whatsapp_number text not null default '',
  opening_hours text not null default '',
  is_open boolean not null default true,
  min_order_value numeric(10, 2) not null default 0,
  estimated_delivery_time text not null default '30-45 min',
  logo_url text,
  banner_url text,
  promo_text text,
  updated_at timestamptz not null default now(),
  constraint store_settings_singleton check (id = 1)
);

insert into public.store_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  street text not null,
  number text not null,
  complement text,
  reference_point text,
  neighborhood_id uuid not null references public.neighborhoods(id) on delete restrict,
  payment_method text not null,
  change_for numeric(10, 2),
  notes text,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2) not null check (delivery_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  notes text,
  subtotal numeric(10, 2) not null check (subtotal >= 0)
);

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists orders_neighborhood_id_idx on public.orders(neighborhood_id);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
