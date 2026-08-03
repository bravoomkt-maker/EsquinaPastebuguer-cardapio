-- Esquina Pasteburguer PDV - Mesas como comanda aberta (consumo no local)
--
-- Até aqui, "mesa" era só um rótulo — funcionava igual ao balcão (cria
-- pedido, cobra na hora, fim). Uma mesa de verdade precisa ficar em aberto
-- enquanto o cliente pede mais coisas, e só ser cobrada quando ele pedir a
-- conta. `is_open_tab` marca esse estado; só pedidos do tipo 'mesa' podem
-- ficar em aberto (balcão/retirada/entrega continuam sendo pagos na hora,
-- sem nenhuma mudança de comportamento).

alter table public.orders
  add column if not exists is_open_tab boolean not null default false;

alter table public.orders
  drop constraint if exists orders_open_tab_only_mesa;
alter table public.orders
  add constraint orders_open_tab_only_mesa check (
    is_open_tab = false or order_type = 'mesa'
  );

create index if not exists orders_open_tab_idx
  on public.orders(order_type, is_open_tab)
  where is_open_tab = true;

-- Uma mesa recém-aberta ainda não tem forma de pagamento definida (só é
-- escolhida quando a mesa é fechada). payment_method deixa de ser
-- obrigatório - o cardápio digital e o balcão/retirada/entrega continuam
-- sempre preenchendo um valor real, então nada muda para eles.
alter table public.orders
  alter column payment_method drop not null;
