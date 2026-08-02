-- Esquina Pasteburguer - Storage bucket para imagens de produtos

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "products_bucket_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'products');

create policy "products_bucket_authenticated_write"
on storage.objects for all
to authenticated
using (bucket_id = 'products')
with check (bucket_id = 'products');
