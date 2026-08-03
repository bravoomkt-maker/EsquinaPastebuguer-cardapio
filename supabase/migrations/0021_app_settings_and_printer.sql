-- Esquina Pasteburguer PDV - Configurações gerais do PDV e da impressora
-- (store_settings já existe e continua guardando os dados da loja/cardápio;
-- estas duas tabelas guardam configuração específica de operação do PDV).

create table if not exists public.app_settings (
  id integer primary key default 1,
  require_open_register_for_cash boolean not null default true,
  default_max_weight_grams integer not null default 5000 check (default_max_weight_grams > 0),
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.printer_settings (
  id integer primary key default 1,
  paper_width text not null default '80mm' check (paper_width in ('58mm', '80mm')),
  print_kitchen_copy boolean not null default true,
  print_customer_receipt boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint printer_settings_singleton check (id = 1)
);

insert into public.printer_settings (id) values (1) on conflict (id) do nothing;

alter table public.app_settings enable row level security;
alter table public.printer_settings enable row level security;

create policy "app_settings_authenticated_read"
  on public.app_settings for select
  to authenticated
  using (true);

create policy "printer_settings_authenticated_read"
  on public.printer_settings for select
  to authenticated
  using (true);
