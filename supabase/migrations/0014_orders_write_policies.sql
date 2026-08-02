create policy "orders_authenticated_update"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

create policy "orders_authenticated_delete"
  on public.orders for delete
  to authenticated
  using (true);

create policy "order_items_authenticated_delete"
  on public.order_items for delete
  to authenticated
  using (true);
