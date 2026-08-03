-- Esquina Pasteburguer PDV - Papéis (admin/caixa/cozinha) e RLS por papel
--
-- Até aqui só existia o papel 'admin'. Esta migration formaliza os três
-- papéis do PDV e restringe escrita em cadastros (produtos, preços, taxas,
-- adicionais, configurações) a administradores - caixa e cozinha continuam
-- lendo tudo que precisam para operar, mas não editam cadastros.
--
-- Observação: RLS no Postgres controla linhas, não colunas. A cozinha não
-- deve ver valores/pagamentos do pedido - isso é reforçado na camada de
-- aplicação (a tela /cozinha nunca busca nem renderiza esses campos), já que
-- todo papel autenticado usa a mesma role de banco (authenticated).

alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'caixa', 'cozinha'));

-- security definer evita recursão de RLS ao ler o próprio papel dentro de
-- outras policies.
create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "profiles_admin_read_all"
  on public.profiles for select
  to authenticated
  using (public.current_profile_role() = 'admin');

create policy "profiles_admin_update_all"
  on public.profiles for update
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

-- Cadastros: leitura para toda a equipe autenticada (já existente),
-- escrita restrita a admin.
drop policy if exists "categories_authenticated_write" on public.categories;
create policy "categories_admin_write"
  on public.categories for all
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

drop policy if exists "products_authenticated_write" on public.products;
create policy "products_admin_write"
  on public.products for all
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

drop policy if exists "product_sizes_authenticated_write" on public.product_sizes;
create policy "product_sizes_admin_write"
  on public.product_sizes for all
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

drop policy if exists "neighborhoods_authenticated_write" on public.neighborhoods;
create policy "neighborhoods_admin_write"
  on public.neighborhoods for all
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

drop policy if exists "store_settings_authenticated_write" on public.store_settings;
create policy "store_settings_admin_write"
  on public.store_settings for update
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "modifier_groups_admin_write"
  on public.modifier_groups for all
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "modifiers_admin_write"
  on public.modifiers for all
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "product_modifier_groups_admin_write"
  on public.product_modifier_groups for all
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "payment_methods_admin_write"
  on public.payment_methods for all
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "app_settings_admin_write"
  on public.app_settings for update
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "printer_settings_admin_write"
  on public.printer_settings for update
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "customers_admin_delete"
  on public.customers for delete
  to authenticated
  using (public.current_profile_role() = 'admin');

-- Pedidos: cozinha e caixa atualizam status (fluxo operacional); cancelar
-- (a própria troca de status para 'cancelled') e excluir de vez continuam
-- restritos a admin - validado nas Server Actions de /admin/pedidos e /cozinha,
-- que checam o papel antes de chamar a mutação.
create policy "orders_staff_update"
  on public.orders for update
  to authenticated
  using (public.current_profile_role() in ('admin', 'caixa', 'cozinha'))
  with check (public.current_profile_role() in ('admin', 'caixa', 'cozinha'));

-- Caixa: abrir (insert) e fechar/atualizar o próprio caixa; admin pode
-- gerenciar e reabrir qualquer um.
create policy "cash_registers_staff_open"
  on public.cash_registers for insert
  to authenticated
  with check (
    public.current_profile_role() in ('admin', 'caixa')
    and opened_by = auth.uid()
  );

create policy "cash_registers_owner_or_admin_update"
  on public.cash_registers for update
  to authenticated
  using (opened_by = auth.uid() or public.current_profile_role() = 'admin')
  with check (opened_by = auth.uid() or public.current_profile_role() = 'admin');

create policy "cash_movements_staff_insert"
  on public.cash_movements for insert
  to authenticated
  with check (public.current_profile_role() in ('admin', 'caixa'));

create policy "cash_movements_admin_manage"
  on public.cash_movements for update
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "cash_movements_admin_delete"
  on public.cash_movements for delete
  to authenticated
  using (public.current_profile_role() = 'admin');

create policy "payments_admin_manage"
  on public.payments for update
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "payments_admin_delete"
  on public.payments for delete
  to authenticated
  using (public.current_profile_role() = 'admin');
