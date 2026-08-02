create or replace function public.get_priced_product(p_product_id uuid, p_size_label text)
returns jsonb
language plpgsql
stable
as $$
declare
  v_product jsonb;
  v_size jsonb;
  v_price numeric(10, 2);
begin
  v_product := (
    select to_jsonb(products.*)
    from public.products
    where products.id = p_product_id
  );

  if v_product is null then
    raise exception 'Produto não encontrado';
  end if;

  if (v_product->>'available')::boolean is false then
    raise exception 'Produto indisponível: %', v_product->>'name';
  end if;

  if p_size_label is not null then
    v_size := (
      select to_jsonb(product_sizes.*)
      from public.product_sizes
      where product_sizes.product_id = p_product_id
        and product_sizes.label = p_size_label
    );

    if v_size is null then
      raise exception 'Tamanho "%" indisponível para o produto %', p_size_label, v_product->>'name';
    end if;

    v_price := coalesce((v_size->>'promo_price')::numeric, (v_size->>'price')::numeric);
  else
    v_price := coalesce((v_product->>'promo_price')::numeric, (v_product->>'price')::numeric);
  end if;

  return jsonb_build_object(
    'id', v_product->>'id',
    'name', v_product->>'name',
    'category_id', v_product->>'category_id',
    'unit_price', v_price
  );
end;
$$;
