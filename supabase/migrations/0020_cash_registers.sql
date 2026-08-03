-- Esquina Pasteburguer PDV - Caixa (abertura, movimentações, fechamento)

create table if not exists public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid not null references public.profiles(id) on delete restrict,
  opened_at timestamptz not null default now(),
  opening_amount numeric(10, 2) not null check (opening_amount >= 0),
  opening_notes text,
  closed_by uuid references public.profiles(id) on delete restrict,
  closed_at timestamptz,
  closing_notes text,
  counted_cash_amount numeric(10, 2) check (counted_cash_amount is null or counted_cash_amount >= 0),
  expected_cash_amount numeric(10, 2),
  cash_difference numeric(10, 2),
  status text not null default 'open' check (status in ('open', 'closed')),
  constraint cash_registers_closed_fields_check check (
    status = 'open' or (closed_by is not null and closed_at is not null)
  )
);

create index if not exists cash_registers_status_idx on public.cash_registers(status);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  cash_register_id uuid not null references public.cash_registers(id) on delete cascade,
  type text not null check (
    type in ('venda', 'entrada', 'suprimento', 'saida', 'sangria', 'estorno', 'cancelamento')
  ),
  amount numeric(10, 2) not null check (amount > 0),
  payment_method_id uuid references public.payment_methods(id) on delete restrict,
  order_id uuid references public.orders(id) on delete set null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists cash_movements_cash_register_id_idx on public.cash_movements(cash_register_id);
create index if not exists cash_movements_type_idx on public.cash_movements(type);

alter table public.orders
  drop constraint if exists orders_cash_register_id_fkey;
alter table public.orders
  add constraint orders_cash_register_id_fkey
  foreign key (cash_register_id) references public.cash_registers(id) on delete set null;

alter table public.payments
  drop constraint if exists payments_cash_register_id_fkey;
alter table public.payments
  add constraint payments_cash_register_id_fkey
  foreign key (cash_register_id) references public.cash_registers(id) on delete set null;

-- Soma abertura + vendas em dinheiro + entradas/suprimentos - saídas/sangrias
-- de um caixa. Usada na tela de fechamento para calcular o valor esperado
-- em dinheiro antes de comparar com o valor contado pelo funcionário.
create or replace function public.cash_register_expected_cash(p_cash_register_id uuid)
returns numeric
language sql
stable
as $$
  select
    coalesce((select cr.opening_amount from public.cash_registers cr where cr.id = p_cash_register_id), 0)
    + coalesce((
        select sum(m.amount) from public.cash_movements m
        where m.cash_register_id = p_cash_register_id
          and m.type in ('venda', 'entrada', 'suprimento')
          and m.payment_method_id in (select id from public.payment_methods where code = 'dinheiro')
      ), 0)
    + coalesce((
        select sum(m.amount) from public.cash_movements m
        where m.cash_register_id = p_cash_register_id
          and m.type in ('entrada', 'suprimento')
          and m.payment_method_id is null
      ), 0)
    - coalesce((
        select sum(m.amount) from public.cash_movements m
        where m.cash_register_id = p_cash_register_id
          and m.type in ('saida', 'sangria', 'estorno', 'cancelamento')
      ), 0);
$$;

alter table public.cash_registers enable row level security;
alter table public.cash_movements enable row level security;

create policy "cash_registers_authenticated_read"
  on public.cash_registers for select
  to authenticated
  using (true);

create policy "cash_movements_authenticated_read"
  on public.cash_movements for select
  to authenticated
  using (true);
