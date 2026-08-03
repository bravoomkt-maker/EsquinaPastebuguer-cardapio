-- Esquina Pasteburguer PDV - Núcleo de pedidos multi-canal
--
-- Estende `orders` para suportar pedidos de balcão, mesa, retirada e entrega
-- (hoje só existe entrega, com endereço obrigatório). Todas as colunas novas
-- têm default compatível com os pedidos já existentes (order_type = 'entrega',
-- source = 'cardapio'), então nenhum pedido antigo muda de comportamento.

alter table public.orders
  add column if not exists order_type text not null default 'entrega'
    check (order_type in ('balcao', 'mesa', 'retirada', 'entrega'));

alter table public.orders
  add column if not exists table_number text;

alter table public.orders
  add column if not exists pickup_at timestamptz;

alter table public.orders
  add column if not exists source text not null default 'cardapio'
    check (source in ('cardapio', 'pdv'));

alter table public.orders
  add column if not exists discount numeric(10, 2) not null default 0 check (discount >= 0);

alter table public.orders
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- FK para cash_registers é adicionada na migration 0020, depois que a tabela existir.
alter table public.orders
  add column if not exists cash_register_id uuid;

-- Endereço deixa de ser obrigatório: só pedidos de entrega precisam dele.
alter table public.orders alter column street drop not null;
alter table public.orders alter column number drop not null;
alter table public.orders alter column neighborhood_id drop not null;

alter table public.orders
  drop constraint if exists orders_delivery_requires_address;
alter table public.orders
  add constraint orders_delivery_requires_address check (
    order_type <> 'entrega'
    or (street is not null and number is not null and neighborhood_id is not null)
  );

-- Status rico: novo -> confirmado -> em preparação -> pronto -> saiu para
-- entrega -> finalizado, ou cancelado a qualquer momento. 'pending' e
-- 'cancelled' (únicos valores usados até hoje) continuam válidos.
alter table public.orders
  drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check check (
    status in ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')
  );

-- Número de pedido amigável e sequencial (exibido no PDV/cozinha/impressão).
alter table public.orders add column if not exists order_number bigint;

create sequence if not exists public.orders_order_number_seq;

with numbered as (
  select id, row_number() over (order by created_at) as rn
  from public.orders
  where order_number is null
)
update public.orders o
set order_number = numbered.rn
from numbered
where o.id = numbered.id;

select setval(
  'public.orders_order_number_seq',
  coalesce((select max(order_number) from public.orders), 0) + 1,
  false
);

alter table public.orders
  alter column order_number set default nextval('public.orders_order_number_seq');
alter table public.orders
  alter column order_number set not null;
alter table public.orders
  drop constraint if exists orders_order_number_unique;
alter table public.orders
  add constraint orders_order_number_unique unique (order_number);
alter sequence public.orders_order_number_seq owned by public.orders.order_number;

create index if not exists orders_order_type_idx on public.orders(order_type);
create index if not exists orders_status_idx on public.orders(status);

-- Histórico de status: registra automaticamente cada mudança, com horário.
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_id_idx
  on public.order_status_history(order_id);

create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, new.created_by);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists orders_log_status_insert on public.orders;
create trigger orders_log_status_insert
  after insert on public.orders
  for each row execute function public.log_order_status_change();

drop trigger if exists orders_log_status_update on public.orders;
create trigger orders_log_status_update
  after update of status on public.orders
  for each row execute function public.log_order_status_change();

alter table public.order_status_history enable row level security;

create policy "order_status_history_authenticated_read"
  on public.order_status_history for select
  to authenticated
  using (true);
