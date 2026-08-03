-- Esquina Pasteburguer PDV - Dados iniciais do PDV (opcional, mas recomendado)
--
-- Cria a categoria e o produto de Açaí (venda por peso, R$ 54,00/kg) e um
-- grupo de adicionais de exemplo para hambúrguer. Idempotente: seguro rodar
-- de novo (usa on conflict / not exists).

insert into public.categories (name, position)
select 'Açaí', coalesce((select max(position) from public.categories), 0) + 1
where not exists (select 1 from public.categories where name = 'Açaí');

insert into public.products (
  category_id, name, description, price, pricing_type, price_per_kg,
  max_weight_grams, available, position
)
select
  c.id, 'Açaí na tigela', 'Açaí vendido por peso, pesado na balança do balcão',
  0, 'weight', 54.00, 2000, true, 1
from public.categories c
where c.name = 'Açaí'
  and not exists (
    select 1 from public.products p where p.category_id = c.id and p.name = 'Açaí na tigela'
  );

insert into public.modifier_groups (name, min_select, max_select, required, position)
select 'Adicionais de hambúrguer', 0, 5, false, 1
where not exists (select 1 from public.modifier_groups where name = 'Adicionais de hambúrguer');

insert into public.modifiers (group_id, name, price, position)
select g.id, m.name, m.price, m.position
from public.modifier_groups g
join (
  values
    ('Queijo extra', 3.00, 1),
    ('Bacon', 4.00, 2),
    ('Carne extra', 6.00, 3),
    ('Molho especial', 2.00, 4)
) as m(name, price, position) on true
where g.name = 'Adicionais de hambúrguer'
  and not exists (
    select 1 from public.modifiers existing where existing.group_id = g.id and existing.name = m.name
  );

insert into public.modifier_groups (name, min_select, max_select, required, position)
select 'Complementos de açaí', 0, 6, false, 2
where not exists (select 1 from public.modifier_groups where name = 'Complementos de açaí');

insert into public.modifiers (group_id, name, price, position)
select g.id, m.name, m.price, m.position
from public.modifier_groups g
join (
  values
    ('Leite em pó', 2.00, 1),
    ('Paçoca', 2.00, 2),
    ('Granola', 2.00, 3),
    ('Frutas', 3.00, 4)
) as m(name, price, position) on true
where g.name = 'Complementos de açaí'
  and not exists (
    select 1 from public.modifiers existing where existing.group_id = g.id and existing.name = m.name
  );
