-- Esquina Pasteburguer PDV - Clientes e complemento de bairros/taxas
--
-- `neighborhoods` já funciona como cadastro de bairros/taxa de entrega
-- (reaproveitado, não duplicado) - só ganha campos de tempo médio e pedido
-- mínimo por bairro. `customers` é novo: cadastro simples buscável por telefone.

alter table public.neighborhoods
  add column if not exists estimated_time text;

alter table public.neighborhoods
  add column if not exists min_order_value numeric(10, 2) check (min_order_value is null or min_order_value >= 0);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  street text,
  number text,
  neighborhood_id uuid references public.neighborhoods(id) on delete set null,
  complement text,
  reference_point text,
  notes text,
  last_order_at timestamptz,
  orders_count integer not null default 0 check (orders_count >= 0),
  total_spent numeric(10, 2) not null default 0 check (total_spent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_phone_idx on public.customers(phone);

alter table public.orders
  add column if not exists customer_id uuid references public.customers(id) on delete set null;

create index if not exists orders_customer_id_idx on public.orders(customer_id);

alter table public.customers enable row level security;

create policy "customers_authenticated_read"
  on public.customers for select
  to authenticated
  using (true);

create policy "customers_authenticated_write"
  on public.customers for insert
  to authenticated
  with check (true);

create policy "customers_authenticated_update"
  on public.customers for update
  to authenticated
  using (true)
  with check (true);
