-- Esquina Pasteburguer - Row Level Security

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.neighborhoods enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- profiles: cada admin só enxerga/edita o próprio perfil
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- categories: leitura pública apenas das ativas; autenticados leem/gerenciam tudo
create policy "categories_public_read_active"
  on public.categories for select
  to anon
  using (active = true);

create policy "categories_authenticated_write"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);

-- products: leitura pública apenas de produtos de categorias ativas (inclui
-- indisponíveis, para o cardápio poder exibi-los como "esgotado"); autenticados leem/gerenciam tudo
create policy "products_public_read_active_category"
  on public.products for select
  to anon
  using (
    exists (
      select 1 from public.categories c
      where c.id = products.category_id and c.active = true
    )
  );

create policy "products_authenticated_write"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- neighborhoods: leitura pública apenas dos ativos; autenticados leem/gerenciam tudo
create policy "neighborhoods_public_read_active"
  on public.neighborhoods for select
  to anon
  using (active = true);

create policy "neighborhoods_authenticated_write"
  on public.neighborhoods for all
  to authenticated
  using (true)
  with check (true);

-- store_settings: leitura pública (necessária para header/status/pedido mínimo); escrita só autenticados
create policy "store_settings_public_read"
  on public.store_settings for select
  to anon, authenticated
  using (true);

create policy "store_settings_authenticated_write"
  on public.store_settings for update
  to authenticated
  using (true)
  with check (true);

-- orders / order_items: sem escrita pública direta (feita via função create_order,
-- que roda com privilégios de definer e valida preços/taxas no servidor).
-- Apenas administradores autenticados podem visualizar os pedidos salvos.
create policy "orders_authenticated_read"
  on public.orders for select
  to authenticated
  using (true);

create policy "order_items_authenticated_read"
  on public.order_items for select
  to authenticated
  using (true);

-- Cria automaticamente um profile de admin quando um usuário é criado no Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'admin')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
