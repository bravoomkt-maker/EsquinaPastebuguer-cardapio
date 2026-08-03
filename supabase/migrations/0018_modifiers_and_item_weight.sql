-- Esquina Pasteburguer PDV - Adicionais (modifiers) e venda por peso nos itens
--
-- Grupos de adicionais (ex: "Adicionais de hambúrguer") com min/max seleção,
-- vinculados a produtos via tabela de junção. Nenhum produto é obrigado a ter
-- grupos (o açaí, por exemplo, pode não usar nenhum).

create table if not exists public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  min_select integer not null default 0 check (min_select >= 0),
  max_select integer not null default 1 check (max_select >= 1),
  required boolean not null default false,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint modifier_groups_min_max_check check (min_select <= max_select)
);

create table if not exists public.modifiers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.modifier_groups(id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null default 0 check (price >= 0),
  active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists modifiers_group_id_idx on public.modifiers(group_id);

create table if not exists public.product_modifier_groups (
  product_id uuid not null references public.products(id) on delete cascade,
  modifier_group_id uuid not null references public.modifier_groups(id) on delete cascade,
  position integer not null default 0,
  primary key (product_id, modifier_group_id)
);

-- Itens vendidos por peso (ex: açaí): peso em gramas inteiras e preço por kg
-- vigente no momento da venda ficam gravados no item, imunes a alterações
-- futuras no preço do produto. Itens 'unit' continuam exatamente como hoje.
alter table public.order_items
  add column if not exists sale_type text not null default 'unit'
    check (sale_type in ('unit', 'weight'));

alter table public.order_items
  add column if not exists weight_grams integer check (weight_grams is null or weight_grams > 0);

alter table public.order_items
  add column if not exists price_per_kg numeric(10, 2) check (price_per_kg is null or price_per_kg >= 0);

alter table public.order_items
  drop constraint if exists order_items_weight_sale_check;
alter table public.order_items
  add constraint order_items_weight_sale_check check (
    sale_type <> 'weight' or (weight_grams is not null and price_per_kg is not null)
  );

create table if not exists public.order_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  modifier_id uuid references public.modifiers(id) on delete set null,
  modifier_name text not null,
  price numeric(10, 2) not null check (price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists order_item_modifiers_order_item_id_idx
  on public.order_item_modifiers(order_item_id);

alter table public.modifier_groups enable row level security;
alter table public.modifiers enable row level security;
alter table public.product_modifier_groups enable row level security;
alter table public.order_item_modifiers enable row level security;

create policy "modifier_groups_public_read_active"
  on public.modifier_groups for select
  to anon, authenticated
  using (active = true);

create policy "modifiers_public_read_active"
  on public.modifiers for select
  to anon, authenticated
  using (active = true);

create policy "product_modifier_groups_public_read"
  on public.product_modifier_groups for select
  to anon, authenticated
  using (true);

create policy "order_item_modifiers_authenticated_read"
  on public.order_item_modifiers for select
  to authenticated
  using (true);
