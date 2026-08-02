-- Esquina Pasteburguer - Função de criação de pedido
--
-- Roda com privilégios do dono da função (security definer), contornando o RLS
-- que bloqueia INSERT direto em orders/order_items para o público. Isso garante
-- que preço unitário, disponibilidade do produto e taxa de entrega sejam sempre
-- recalculados a partir do banco - nunca confiando em valores vindos do cliente.
--
-- Observação: o corpo evita completamente dois padrões que o SQL Editor do
-- Supabase interpreta erroneamente como criação de tabela nova (injetando
-- "ALTER TABLE ... ENABLE ROW LEVEL SECURITY" no meio do código e corrompendo
-- a função): "select ... into <var> from ..." e "funcao(...) as alias(coluna tipo, ...)".
-- Por isso usamos atribuição direta (:=) e jsonb_array_elements sem lista de colunas.

create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_street text,
  p_number text,
  p_complement text,
  p_reference_point text,
  p_neighborhood_id uuid,
  p_payment_method text,
  p_change_for numeric,
  p_notes text,
  p_items jsonb
)
returns table (order_id uuid, subtotal numeric, delivery_fee numeric, total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery_fee numeric(10, 2);
  v_min_order numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_order_id uuid := gen_random_uuid();
  v_order_items jsonb := '[]'::jsonb;
  v_item jsonb;
  v_item_quantity integer;
  v_product jsonb;
  v_unit_price numeric(10, 2);
  v_line_subtotal numeric(10, 2);
begin
  if p_customer_name is null or trim(p_customer_name) = '' then
    raise exception 'Nome do cliente é obrigatório';
  end if;
  if p_customer_phone is null or trim(p_customer_phone) = '' then
    raise exception 'Telefone é obrigatório';
  end if;
  if p_street is null or trim(p_street) = '' then
    raise exception 'Rua é obrigatória';
  end if;
  if p_number is null or trim(p_number) = '' then
    raise exception 'Número é obrigatório';
  end if;
  if p_payment_method is null or trim(p_payment_method) = '' then
    raise exception 'Forma de pagamento é obrigatória';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'O pedido precisa ter ao menos um item';
  end if;

  v_delivery_fee := (
    select neighborhoods.delivery_fee
    from public.neighborhoods
    where neighborhoods.id = p_neighborhood_id and neighborhoods.active = true
  );

  if v_delivery_fee is null then
    raise exception 'Bairro inválido ou indisponível para entrega';
  end if;

  v_min_order := (select store_settings.min_order_value from public.store_settings where store_settings.id = 1);

  for v_item in select jsonb_array_elements(p_items) loop
    if (v_item->>'product_id') is null then
      raise exception 'Item de pedido inválido';
    end if;

    v_item_quantity := (v_item->>'quantity')::integer;

    if v_item_quantity is null or v_item_quantity <= 0 then
      raise exception 'Quantidade inválida para um dos itens';
    end if;

    v_product := (
      select to_jsonb(products.*)
      from public.products
      where products.id = (v_item->>'product_id')::uuid
    );

    if v_product is null then
      raise exception 'Produto não encontrado';
    end if;

    if (v_product->>'available')::boolean is false then
      raise exception 'Produto indisponível: %', v_product->>'name';
    end if;

    v_unit_price := coalesce(
      (v_product->>'promo_price')::numeric,
      (v_product->>'price')::numeric
    );
    v_line_subtotal := v_unit_price * v_item_quantity;
    v_subtotal := v_subtotal + v_line_subtotal;

    v_order_items := v_order_items || jsonb_build_object(
      'order_id', v_order_id,
      'product_id', v_product->>'id',
      'product_name', v_product->>'name',
      'quantity', v_item_quantity,
      'unit_price', v_unit_price,
      'notes', nullif(trim(coalesce(v_item->>'notes', '')), ''),
      'subtotal', v_line_subtotal
    );
  end loop;

  if v_min_order is not null and v_subtotal < v_min_order then
    raise exception 'Pedido mínimo de R$ % não atingido', v_min_order;
  end if;

  insert into public.orders (
    id, customer_name, customer_phone, street, number, complement,
    reference_point, neighborhood_id, payment_method, change_for, notes,
    subtotal, delivery_fee, total
  ) values (
    v_order_id,
    trim(p_customer_name),
    trim(p_customer_phone),
    trim(p_street),
    trim(p_number),
    nullif(trim(coalesce(p_complement, '')), ''),
    nullif(trim(coalesce(p_reference_point, '')), ''),
    p_neighborhood_id,
    p_payment_method,
    p_change_for,
    nullif(trim(coalesce(p_notes, '')), ''),
    v_subtotal,
    v_delivery_fee,
    v_subtotal + v_delivery_fee
  );

  insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, notes, subtotal)
  select
    (elem->>'order_id')::uuid,
    (elem->>'product_id')::uuid,
    elem->>'product_name',
    (elem->>'quantity')::integer,
    (elem->>'unit_price')::numeric,
    elem->>'notes',
    (elem->>'subtotal')::numeric
  from jsonb_array_elements(v_order_items) as elem;

  return query select v_order_id, v_subtotal, v_delivery_fee, v_subtotal + v_delivery_fee;
end;
$$;

grant execute on function public.create_order(
  text, text, text, text, text, text, uuid, text, numeric, text, jsonb
) to anon, authenticated;
