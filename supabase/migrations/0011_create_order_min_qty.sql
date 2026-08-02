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
  v_size_label text;
  v_second_product_id uuid;
  v_primary jsonb;
  v_second jsonb;
  v_category jsonb;
  v_unit_price numeric(10, 2);
  v_line_subtotal numeric(10, 2);
  v_item_name text;
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

    v_size_label := nullif(trim(coalesce(v_item->>'size_label', '')), '');
    v_second_product_id := nullif(v_item->>'second_product_id', '')::uuid;

    v_primary := public.get_priced_product((v_item->>'product_id')::uuid, v_size_label);
    v_unit_price := (v_primary->>'unit_price')::numeric;
    v_item_name := v_primary->>'name';

    if v_item_quantity < (v_primary->>'min_quantity')::integer then
      raise exception 'Quantidade mínima de % unidades para %', v_primary->>'min_quantity', v_item_name;
    end if;

    if v_second_product_id is not null then
      if v_size_label is null then
        raise exception 'Selecione um tamanho para o meio a meio';
      end if;

      v_category := (
        select to_jsonb(categories.*)
        from public.categories
        where categories.id = (v_primary->>'category_id')::uuid
      );

      if (v_category->>'allow_half_half')::boolean is not true then
        raise exception 'Este produto não permite meio a meio';
      end if;

      v_second := public.get_priced_product(v_second_product_id, v_size_label);

      if (v_second->>'category_id') is distinct from (v_primary->>'category_id') then
        raise exception 'Os dois sabores precisam ser da mesma categoria';
      end if;

      if (v_second->>'unit_price')::numeric > v_unit_price then
        v_unit_price := (v_second->>'unit_price')::numeric;
      end if;

      v_item_name := v_item_name || ' + ' || (v_second->>'name');
    end if;

    if v_size_label is not null then
      v_item_name := v_item_name || ' (' || v_size_label || ')';
    end if;

    v_line_subtotal := v_unit_price * v_item_quantity;
    v_subtotal := v_subtotal + v_line_subtotal;

    v_order_items := v_order_items || jsonb_build_object(
      'order_id', v_order_id,
      'product_id', v_primary->>'id',
      'product_name', v_item_name,
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
