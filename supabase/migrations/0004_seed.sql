-- Esquina Pasteburguer - Dados iniciais (opcional, útil para desenvolvimento/demo)

update public.store_settings
set
  store_name = 'Esquina Pasteburguer',
  whatsapp_number = '5588900000000',
  opening_hours = 'Seg a Dom, 18h às 23h',
  is_open = true,
  min_order_value = 15.00,
  estimated_delivery_time = '40-60 min',
  promo_text = 'Peça 2 pastéis e ganhe um refrigerante lata!'
where id = 1;

insert into public.neighborhoods (name, delivery_fee, position) values
  ('Centro', 5.00, 1),
  ('Planalto Universitário', 6.00, 2),
  ('Cristo Redentor', 7.00, 3),
  ('Belo Horizonte', 8.00, 4)
on conflict (name) do nothing;

insert into public.categories (name, position)
select v.name, v.position
from (values ('Pastéis', 1), ('Hambúrgueres', 2), ('Bebidas', 3)) as v(name, position)
where not exists (select 1 from public.categories c where c.name = v.name);

insert into public.products (category_id, name, description, price, promo_price, available, featured, position)
select c.id, p.name, p.description, p.price, p.promo_price, true, p.featured, p.position
from public.categories c
join (
  values
    ('Pastéis', 'Pastel de Carne', 'Pastel frito recheado com carne moída temperada', 9.00, null::numeric, false, 1),
    ('Pastéis', 'Pastel de Queijo', 'Pastel frito recheado com queijo derretido', 8.00, null::numeric, false, 2),
    ('Pastéis', 'Pastel de Frango com Catupiry', 'Pastel frito recheado com frango desfiado e catupiry', 10.00, 8.50, true, 3),
    ('Hambúrgueres', 'X-Burguer', 'Pão, hambúrguer bovino, queijo, alface e tomate', 15.00, null::numeric, false, 1),
    ('Hambúrgueres', 'X-Bacon', 'Pão, hambúrguer bovino, queijo, bacon, alface e tomate', 18.00, 16.00, true, 2),
    ('Bebidas', 'Refrigerante Lata', 'Lata 350ml', 6.00, null::numeric, false, 1),
    ('Bebidas', 'Suco Natural', 'Copo 500ml, sabores da casa', 7.00, null::numeric, false, 2)
) as p(category_name, name, description, price, promo_price, featured, position)
  on p.category_name = c.name
where not exists (
  select 1 from public.products existing
  where existing.category_id = c.id and existing.name = p.name
);
