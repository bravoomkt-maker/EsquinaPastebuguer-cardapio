-- Esquina Pasteburguer PDV - Função de criação de pedido do PDV
--
-- Espelha o cuidado de `create_order` (0003/0008/.../0013): roda com
-- privilégios do dono (security definer) e recalcula TUDO a partir do banco -
-- preço unitário, tamanho, meio a meio, peso × preço/kg vigente, adicionais,
-- taxa de entrega e troco nunca confiam em valor vindo do cliente.
--
-- Diferente de create_order (cardápio, sem login), esta função exige usuário
-- autenticado (grant só para `authenticated`) e não é chamada por anônimos.
--
-- Por segurança contra o bug conhecido do SQL Editor do Supabase (ver
-- comentário em 0003_functions.sql), evitamos "select ... into" (usamos
-- ":=" com subquery entre parênteses) e "função(...) as alias(coluna tipo)".
-- "insert ... returning ... into" é um comando diferente e não é afetado.
--
-- Decisão de escopo: ao contrário do cardápio digital, o PDV não aplica a
-- quantidade mínima por produto/categoria (regra pensada para o cliente final
-- online) - o atendente pode vender qualquer quantidade no balcão.

create or replace function public.create_pos_order(
  p_order_type text,
  p_customer_name text,
  p_customer_phone text,
  p_table_number text,
  p_street text,
  p_number text,
  p_complement text,
  p_reference_point text,
  p_neighborhood_id uuid,
  p_pickup_at timestamptz,
  p_notes text,
  p_discount numeric,
  p_items jsonb,
  p_payments jsonb,
  p_cash_register_id uuid
)
returns table (
  order_id uuid,
  order_number bigint,
  subtotal numeric,
  discount numeric,
  delivery_fee numeric,
  total numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_created_by uuid := auth.uid();
  v_delivery_fee numeric(10, 2) := 0;
  v_subtotal numeric(10, 2) := 0;
  v_discount numeric(10, 2) := coalesce(p_discount, 0);
  v_total numeric(10, 2);
  v_order_id uuid := gen_random_uuid();
  v_order_number bigint;
  v_item jsonb;
  v_modifier jsonb;
  v_product jsonb;
  v_second jsonb;
  v_second_price numeric(10, 2);
  v_quantity integer;
  v_weight_grams integer;
  v_size_label text;
  v_second_product_id uuid;
  v_unit_price numeric(10, 2);
  v_price_per_kg numeric(10, 2);
  v_sale_type text;
  v_line_subtotal numeric(10, 2);
  v_modifiers_subtotal numeric(10, 2);
  v_item_name text;
  v_notes text;
  v_order_item_id uuid;
  v_modifier_row jsonb;
  v_modifier_qty integer;
  v_max_weight integer;
  v_default_max_weight integer;
  v_require_open_register boolean;
  v_payment jsonb;
  v_payment_method jsonb;
  v_payment_amount numeric(10, 2);
  v_received numeric(10, 2);
  v_change numeric(10, 2);
  v_payments_total numeric(10, 2) := 0;
  v_customer_id uuid;
begin
  if p_order_type not in ('balcao', 'mesa', 'retirada', 'entrega') then
    raise exception 'Tipo de pedido inválido';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'O pedido precisa ter ao menos um item';
  end if;

  -- Validado aqui (antes do pedido "rascunho" ser inserido) porque
  -- orders.payment_method é NOT NULL e é preenchido já nesse insert, a
  -- partir da primeira forma de pagamento informada.
  if p_payments is null or jsonb_array_length(p_payments) = 0 then
    raise exception 'Informe ao menos uma forma de pagamento';
  end if;

  if not exists (
    select 1 from public.payment_methods pm
    where pm.id = (p_payments->0->>'payment_method_id')::uuid and pm.active = true
  ) then
    raise exception 'Forma de pagamento inválida';
  end if;

  if p_order_type = 'entrega' then
    if p_street is null or trim(p_street) = '' then
      raise exception 'Rua é obrigatória para entrega';
    end if;
    if p_number is null or trim(p_number) = '' then
      raise exception 'Número é obrigatório para entrega';
    end if;

    v_delivery_fee := (
      select n.delivery_fee from public.neighborhoods n
      where n.id = p_neighborhood_id and n.active = true
    );

    if v_delivery_fee is null then
      raise exception 'Bairro inválido ou indisponível para entrega';
    end if;
  end if;

  v_default_max_weight := coalesce(
    (select a.default_max_weight_grams from public.app_settings a where a.id = 1),
    5000
  );

  -- O pedido é criado como rascunho ANTES do loop de itens, porque
  -- order_items.order_id tem chave estrangeira para orders.id: o pedido
  -- precisa existir no banco antes de qualquer item ser inserido. Valores
  -- financeiros (subtotal/desconto/total/forma de pagamento) são zerados
  -- aqui e preenchidos com um UPDATE depois que os itens e pagamentos forem
  -- validados e calculados.
  insert into public.orders (
    id, customer_name, customer_phone, street, number, complement, reference_point,
    neighborhood_id, payment_method, change_for, notes, subtotal, delivery_fee, total,
    status, order_type, table_number, pickup_at, source, discount, created_by,
    cash_register_id, customer_id
  ) values (
    v_order_id,
    coalesce(nullif(trim(p_customer_name), ''), 'Cliente balcão'),
    coalesce(nullif(trim(p_customer_phone), ''), ''),
    nullif(trim(coalesce(p_street, '')), ''),
    nullif(trim(coalesce(p_number, '')), ''),
    nullif(trim(coalesce(p_complement, '')), ''),
    nullif(trim(coalesce(p_reference_point, '')), ''),
    p_neighborhood_id,
    (
      select pm.code from public.payment_methods pm
      where pm.id = (p_payments->0->>'payment_method_id')::uuid
    ),
    (
      select nullif(pay->>'received_amount', '')::numeric - nullif(pay->>'amount', '')::numeric
      from jsonb_array_elements(p_payments) pay
      where (select code from public.payment_methods where id = (pay->>'payment_method_id')::uuid) = 'dinheiro'
      limit 1
    ),
    nullif(trim(coalesce(p_notes, '')), ''),
    0, v_delivery_fee, 0,
    'confirmed', p_order_type, nullif(trim(coalesce(p_table_number, '')), ''), p_pickup_at, 'pdv', 0, v_created_by,
    p_cash_register_id, null
  )
  -- Qualificado com "orders." de propósito: como a função retorna uma
  -- coluna chamada order_number (returns table), o PL/pgSQL cria uma
  -- variável implícita com esse nome, que fica ambígua com a coluna da
  -- tabela se referenciada sem qualificação aqui.
  returning orders.order_number into v_order_number;

  for v_item in select jsonb_array_elements(p_items) loop
    if (v_item->>'product_id') is null then
      raise exception 'Item de pedido inválido';
    end if;

    v_product := (
      select to_jsonb(p.*) from public.products p where p.id = (v_item->>'product_id')::uuid
    );

    if v_product is null then
      raise exception 'Produto não encontrado';
    end if;

    if (v_product->>'available')::boolean is false then
      raise exception 'Produto indisponível: %', v_product->>'name';
    end if;

    if (v_product->>'visible_pos')::boolean is false then
      raise exception 'Produto não disponível no PDV: %', v_product->>'name';
    end if;

    v_sale_type := v_product->>'pricing_type';
    v_notes := nullif(trim(coalesce(v_item->>'notes', '')), '');
    v_item_name := v_product->>'name';
    v_weight_grams := null;
    v_price_per_kg := null;
    v_size_label := null;
    v_second_product_id := null;

    if v_sale_type = 'weight' then
      v_weight_grams := nullif(v_item->>'weight_grams', '')::integer;
      v_quantity := 1;

      if v_weight_grams is null or v_weight_grams <= 0 then
        raise exception 'Peso inválido para %', v_item_name;
      end if;

      v_max_weight := coalesce((v_product->>'max_weight_grams')::integer, v_default_max_weight);

      if v_weight_grams > v_max_weight then
        raise exception 'Peso de % g excede o máximo permitido (% g) para %',
          v_weight_grams, v_max_weight, v_item_name;
      end if;

      v_price_per_kg := (v_product->>'price_per_kg')::numeric;
      v_line_subtotal := round(v_weight_grams::numeric * v_price_per_kg / 1000.0, 2);
      v_unit_price := v_price_per_kg;
    else
      v_quantity := (v_item->>'quantity')::integer;
      if v_quantity is null or v_quantity <= 0 then
        raise exception 'Quantidade inválida para %', v_item_name;
      end if;

      v_size_label := nullif(trim(coalesce(v_item->>'size_label', '')), '');
      v_second_product_id := nullif(v_item->>'second_product_id', '')::uuid;

      if v_size_label is not null then
        v_unit_price := (
          select coalesce(ps.promo_price, ps.price) from public.product_sizes ps
          where ps.product_id = (v_product->>'id')::uuid and ps.label = v_size_label
        );
        if v_unit_price is null then
          raise exception 'Tamanho "%" indisponível para %', v_size_label, v_item_name;
        end if;
      else
        v_unit_price := coalesce((v_product->>'promo_price')::numeric, (v_product->>'price')::numeric);
      end if;

      if v_second_product_id is not null then
        v_second := (
          select to_jsonb(p.*) from public.products p where p.id = v_second_product_id
        );

        if v_second is null or (v_second->>'available')::boolean is false then
          raise exception 'Segundo sabor indisponível';
        end if;
        if (v_second->>'category_id') is distinct from (v_product->>'category_id') then
          raise exception 'Os dois sabores precisam ser da mesma categoria';
        end if;

        if v_size_label is not null then
          v_second_price := (
            select coalesce(ps.promo_price, ps.price) from public.product_sizes ps
            where ps.product_id = v_second_product_id and ps.label = v_size_label
          );
        else
          v_second_price := coalesce((v_second->>'promo_price')::numeric, (v_second->>'price')::numeric);
        end if;

        if v_second_price is not null and v_second_price > v_unit_price then
          v_unit_price := v_second_price;
        end if;

        v_item_name := v_item_name || ' + ' || (v_second->>'name');
      end if;

      if v_size_label is not null then
        v_item_name := v_item_name || ' (' || v_size_label || ')';
      end if;

      v_line_subtotal := v_unit_price * v_quantity;
    end if;

    v_modifiers_subtotal := 0;

    insert into public.order_items (
      order_id, product_id, product_name, quantity, unit_price, notes, subtotal,
      sale_type, weight_grams, price_per_kg
    ) values (
      v_order_id, (v_product->>'id')::uuid, v_item_name, v_quantity, v_unit_price, v_notes, v_line_subtotal,
      v_sale_type, v_weight_grams, v_price_per_kg
    )
    returning id into v_order_item_id;

    if v_item ? 'modifiers' and jsonb_array_length(coalesce(v_item->'modifiers', '[]'::jsonb)) > 0 then
      for v_modifier in select jsonb_array_elements(v_item->'modifiers') loop
        v_modifier_row := (
          select to_jsonb(m.*) from public.modifiers m
          where m.id = (v_modifier->>'modifier_id')::uuid and m.active = true
        );

        if v_modifier_row is null then
          raise exception 'Adicional indisponível';
        end if;

        v_modifier_qty := coalesce(nullif(v_modifier->>'quantity', '')::integer, 1);
        if v_modifier_qty <= 0 then
          raise exception 'Quantidade inválida para o adicional %', v_modifier_row->>'name';
        end if;

        insert into public.order_item_modifiers (order_item_id, modifier_id, modifier_name, price, quantity)
        values (
          v_order_item_id,
          (v_modifier_row->>'id')::uuid,
          v_modifier_row->>'name',
          (v_modifier_row->>'price')::numeric,
          v_modifier_qty
        );

        v_modifiers_subtotal := v_modifiers_subtotal + (v_modifier_row->>'price')::numeric * v_modifier_qty;
      end loop;

      update public.order_items
      set subtotal = order_items.subtotal + v_modifiers_subtotal
      where id = v_order_item_id;
    end if;

    v_subtotal := v_subtotal + v_line_subtotal + v_modifiers_subtotal;
  end loop;

  if v_discount > v_subtotal then
    raise exception 'Desconto não pode ser maior que o subtotal';
  end if;

  v_total := v_subtotal - v_discount + v_delivery_fee;

  v_require_open_register := coalesce(
    (select a.require_open_register_for_cash from public.app_settings a where a.id = 1),
    true
  );

  for v_payment in select jsonb_array_elements(p_payments) loop
    v_payment_method := (
      select to_jsonb(pm.*) from public.payment_methods pm
      where pm.id = (v_payment->>'payment_method_id')::uuid and pm.active = true
    );

    if v_payment_method is null then
      raise exception 'Forma de pagamento inválida';
    end if;

    v_payment_amount := (v_payment->>'amount')::numeric;
    if v_payment_amount is null or v_payment_amount <= 0 then
      raise exception 'Valor de pagamento inválido';
    end if;

    if (v_payment_method->>'code') = 'dinheiro' then
      if v_require_open_register and p_cash_register_id is null then
        raise exception 'Abra o caixa antes de registrar pagamento em dinheiro';
      end if;

      v_received := nullif(v_payment->>'received_amount', '')::numeric;
      if v_received is null or v_received < v_payment_amount then
        raise exception 'Valor recebido não pode ser menor que o valor a pagar em dinheiro';
      end if;
    end if;

    v_payments_total := v_payments_total + v_payment_amount;
  end loop;

  if round(v_payments_total, 2) <> round(v_total, 2) then
    raise exception 'A soma dos pagamentos (%) não confere com o total do pedido (%)', v_payments_total, v_total;
  end if;

  if p_cash_register_id is not null then
    if not exists (
      select 1 from public.cash_registers cr
      where cr.id = p_cash_register_id and cr.status = 'open'
    ) then
      raise exception 'Caixa informado não está aberto';
    end if;
  end if;

  if p_customer_phone is not null and trim(p_customer_phone) <> '' then
    insert into public.customers (
      name, phone, street, number, neighborhood_id, complement, reference_point,
      last_order_at, orders_count, total_spent
    ) values (
      coalesce(nullif(trim(p_customer_name), ''), 'Cliente'),
      trim(p_customer_phone),
      nullif(trim(coalesce(p_street, '')), ''),
      nullif(trim(coalesce(p_number, '')), ''),
      p_neighborhood_id,
      nullif(trim(coalesce(p_complement, '')), ''),
      nullif(trim(coalesce(p_reference_point, '')), ''),
      now(), 1, v_total
    )
    on conflict (phone) do update set
      name = coalesce(nullif(trim(p_customer_name), ''), public.customers.name),
      street = coalesce(nullif(trim(coalesce(p_street, '')), ''), public.customers.street),
      number = coalesce(nullif(trim(coalesce(p_number, '')), ''), public.customers.number),
      neighborhood_id = coalesce(p_neighborhood_id, public.customers.neighborhood_id),
      complement = coalesce(nullif(trim(coalesce(p_complement, '')), ''), public.customers.complement),
      reference_point = coalesce(nullif(trim(coalesce(p_reference_point, '')), ''), public.customers.reference_point),
      last_order_at = now(),
      orders_count = public.customers.orders_count + 1,
      total_spent = public.customers.total_spent + v_total,
      updated_at = now()
    returning id into v_customer_id;
  end if;

  update public.orders set
    subtotal = v_subtotal,
    discount = v_discount,
    total = v_total,
    payment_method = (
      select pm.code from public.payment_methods pm
      where pm.id = (p_payments->0->>'payment_method_id')::uuid
    ),
    change_for = (
      select nullif(pay->>'received_amount', '')::numeric - nullif(pay->>'amount', '')::numeric
      from jsonb_array_elements(p_payments) pay
      where (select code from public.payment_methods where id = (pay->>'payment_method_id')::uuid) = 'dinheiro'
      limit 1
    ),
    customer_id = v_customer_id
  where id = v_order_id;

  for v_payment in select jsonb_array_elements(p_payments) loop
    v_payment_method := (
      select to_jsonb(pm.*) from public.payment_methods pm
      where pm.id = (v_payment->>'payment_method_id')::uuid
    );
    v_payment_amount := (v_payment->>'amount')::numeric;

    if (v_payment_method->>'code') = 'dinheiro' then
      v_received := nullif(v_payment->>'received_amount', '')::numeric;
      v_change := round(v_received - v_payment_amount, 2);
    else
      v_received := null;
      v_change := null;
    end if;

    insert into public.payments (order_id, payment_method_id, amount, received_amount, change_amount, cash_register_id)
    values (v_order_id, (v_payment_method->>'id')::uuid, v_payment_amount, v_received, v_change, p_cash_register_id);

    if p_cash_register_id is not null then
      insert into public.cash_movements (
        cash_register_id, type, amount, payment_method_id, order_id, description, created_by
      ) values (
        p_cash_register_id, 'venda', v_payment_amount, (v_payment_method->>'id')::uuid, v_order_id,
        'Pedido #' || v_order_number, v_created_by
      );
    end if;
  end loop;

  return query select v_order_id, v_order_number, v_subtotal, v_discount, v_delivery_fee, v_total;
end;
$$;

grant execute on function public.create_pos_order(
  text, text, text, text, text, text, text, text, uuid, timestamptz, text, numeric, jsonb, jsonb, uuid
) to authenticated;
