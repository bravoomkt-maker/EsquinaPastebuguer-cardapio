-- Esquina Pasteburguer PDV - Cancelar/trocar item de uma mesa em aberto
--
-- Permite remover um item já lançado numa mesa (cancelamento ou troca -
-- trocar = remover o item errado aqui e lançar o certo pela tela normal de
-- "+ Itens"). Só funciona em pedidos do tipo mesa que ainda estão abertos;
-- pedidos já fechados/pagos ou de outros canais não podem ser alterados
-- por aqui.

create or replace function public.remove_item_from_table_order(
  p_order_item_id uuid
)
returns table (
  order_id uuid,
  subtotal numeric,
  total numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_new_subtotal numeric(10, 2);
begin
  v_order_id := (
    select oi.order_id from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.id = p_order_item_id and o.order_type = 'mesa' and o.is_open_tab = true
  );

  if v_order_id is null then
    raise exception 'Item não encontrado ou a mesa já está fechada';
  end if;

  delete from public.order_items where id = p_order_item_id;

  v_new_subtotal := coalesce(
    (select sum(oi.subtotal) from public.order_items oi where oi.order_id = v_order_id),
    0
  );

  update public.orders
  set subtotal = v_new_subtotal, total = v_new_subtotal
  where id = v_order_id;

  return query select v_order_id, v_new_subtotal, v_new_subtotal;
end;
$$;

grant execute on function public.remove_item_from_table_order(uuid) to authenticated;
