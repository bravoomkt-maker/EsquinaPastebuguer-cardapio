-- Esquina Pasteburguer PDV - Campos de produto para o PDV
--
-- Tudo com default que preserva o comportamento atual do cardápio: produtos
-- existentes continuam 'unit', visíveis no cardápio e no PDV, sem estoque
-- controlado e permitindo adicionais/observações.

alter table public.products
  add column if not exists pricing_type text not null default 'unit'
    check (pricing_type in ('unit', 'weight'));

alter table public.products
  add column if not exists price_per_kg numeric(10, 2) check (price_per_kg is null or price_per_kg >= 0);

alter table public.products
  add column if not exists max_weight_grams integer check (max_weight_grams is null or max_weight_grams > 0);

alter table public.products
  add column if not exists internal_code text;

alter table public.products
  add column if not exists track_stock boolean not null default false;

alter table public.products
  add column if not exists stock_quantity numeric(10, 2) not null default 0 check (stock_quantity >= 0);

alter table public.products
  add column if not exists allow_modifiers boolean not null default true;

alter table public.products
  add column if not exists allow_notes boolean not null default true;

alter table public.products
  add column if not exists visible_menu boolean not null default true;

alter table public.products
  add column if not exists visible_pos boolean not null default true;

alter table public.products
  drop constraint if exists products_weight_pricing_check;
alter table public.products
  add constraint products_weight_pricing_check check (
    pricing_type <> 'weight' or price_per_kg is not null
  );

create index if not exists products_internal_code_idx on public.products(internal_code);

-- Leitura pública do cardápio passa a exigir visible_menu = true. Como o
-- default é true, todo produto existente continua exatamente como está.
drop policy if exists "products_public_read_active_category" on public.products;
create policy "products_public_read_active_category"
  on public.products for select
  to anon
  using (
    visible_menu = true
    and exists (
      select 1 from public.categories c
      where c.id = products.category_id and c.active = true
    )
  );
