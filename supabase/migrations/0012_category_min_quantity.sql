alter table public.categories
  add column if not exists min_quantity integer not null default 1;

alter table public.categories
  drop constraint if exists categories_min_quantity_check;

alter table public.categories
  add constraint categories_min_quantity_check check (min_quantity >= 1);
