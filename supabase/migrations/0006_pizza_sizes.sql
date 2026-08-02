-- Esquina Pasteburguer - Tamanhos de produto e opcao de meio a meio
--
-- Permite que um produto (ex: pizza) tenha variacoes de tamanho com precos
-- proprios (product_sizes) e que categorias marcadas com allow_half_half
-- permitam combinar dois sabores no mesmo pedido, cobrando o maior valor
-- entre os dois (regra padrao de pizzaria). Produtos sem tamanhos cadastrados
-- continuam funcionando exatamente como antes (preco unico em products).

alter table public.categories
  add column if not exists allow_half_half boolean not null default false;

create table if not exists public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  price numeric(10, 2) not null check (price >= 0),
  promo_price numeric(10, 2) check (promo_price is null or promo_price >= 0),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, label),
  constraint size_promo_price_lower_than_price check (
    promo_price is null or promo_price < price
  )
);

create index if not exists product_sizes_product_id_idx on public.product_sizes(product_id);

alter table public.product_sizes enable row level security;

create policy "product_sizes_public_read_active_category"
  on public.product_sizes for select
  to anon
  using (
    exists (
      select 1
      from public.products p
      join public.categories c on c.id = p.category_id
      where p.id = product_sizes.product_id and c.active = true
    )
  );

create policy "product_sizes_authenticated_write"
  on public.product_sizes for all
  to authenticated
  using (true)
  with check (true);
