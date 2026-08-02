alter table public.products
  add column if not exists min_quantity integer not null default 1;

alter table public.products
  drop constraint if exists products_min_quantity_check;

alter table public.products
  add constraint products_min_quantity_check check (min_quantity >= 1);
