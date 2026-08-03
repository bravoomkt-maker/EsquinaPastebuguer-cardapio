-- Esquina Pasteburguer PDV - Formas de pagamento e pagamentos
--
-- `payments` guarda uma linha por forma de pagamento usada em um pedido -
-- hoje sempre uma linha (pagamento único), mas a estrutura já suporta
-- pagamento dividido no futuro sem precisar de migration nova.

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  active boolean not null default true,
  allows_change boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.payment_methods (code, name, allows_change, position) values
  ('dinheiro', 'Dinheiro', true, 0),
  ('pix', 'Pix', false, 1),
  ('debito', 'Cartão de débito', false, 2),
  ('credito', 'Cartão de crédito', false, 3),
  ('entrega', 'Pagamento na entrega', false, 4)
on conflict (code) do nothing;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  payment_method_id uuid not null references public.payment_methods(id) on delete restrict,
  amount numeric(10, 2) not null check (amount > 0),
  received_amount numeric(10, 2) check (received_amount is null or received_amount >= 0),
  change_amount numeric(10, 2) check (change_amount is null or change_amount >= 0),
  cash_register_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments(order_id);

alter table public.payment_methods enable row level security;
alter table public.payments enable row level security;

create policy "payment_methods_public_read_active"
  on public.payment_methods for select
  to anon, authenticated
  using (active = true);

create policy "payments_authenticated_read"
  on public.payments for select
  to authenticated
  using (true);
