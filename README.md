# Esquina Pasteburguer — Cardápio Digital

Cardápio digital administrável para a lanchonete Esquina Pasteburguer (Quixadá-CE), construído com Next.js (App Router), TypeScript, Tailwind CSS e Supabase.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS 4** — identidade visual preto/vermelho/branco
- **Supabase** — Database (Postgres), Auth, Storage
- **Zustand** — estado do carrinho, persistido em localStorage
- **Deploy**: Vercel

## Estrutura do projeto

```
app/
  page.tsx                    # Cardápio público
  admin/
    login/                    # Login do admin (Supabase Auth)
    (dashboard)/              # Área protegida (categorias, produtos, bairros, configurações, pedidos)
components/
  public/                     # Header, banner, busca, carrinho, checkout...
  admin/                      # Formulários e listas do painel admin
  ui/                         # Button, Input, Select, Modal, Badge, Spinner...
lib/
  supabase/                   # Clientes Supabase (browser, server, proxy)
  store/                      # Zustand (carrinho)
  types/                      # Tipos TypeScript (incl. tipos do banco)
  utils/                      # currency, whatsapp, validation, date, cn
proxy.ts                      # Proteção de rotas /admin (equivalente ao middleware no Next 16)
supabase/migrations/          # Migrations SQL, na ordem de aplicação
```

## 1. Criar o projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Settings → API**, copie a **Project URL** e a **anon public key**.

## 2. Aplicar as migrations

Abra o **SQL Editor** do painel Supabase e rode os arquivos de `supabase/migrations/` **em ordem**, um de cada vez:

1. `0001_schema.sql` — cria as tabelas (`profiles`, `categories`, `products`, `neighborhoods`, `store_settings`, `orders`, `order_items`)
2. `0002_rls.sql` — ativa Row Level Security, cria as políticas e o trigger que cria automaticamente um `profile` de admin para cada novo usuário do Supabase Auth
3. `0003_functions.sql` — cria a função `create_order`, usada pelo checkout para gravar pedidos com preços e taxas recalculados no servidor
4. `0004_seed.sql` — dados de exemplo (opcional, útil para testar localmente)
5. `0005_storage.sql` — cria o bucket `products` no Storage (upload de imagens de produtos)

> **Dica:** rode um arquivo por vez e confira "Success" antes de colar o próximo. O SQL Editor do Supabase às vezes tem um assistente automático que pode alterar o texto colado — se aparecer um erro de sintaxe estranho, abra uma aba nova, cole novamente e rode sem esperar.

## 3. Criar o primeiro usuário admin

Vá em **Authentication → Users → Add user**, crie com e-mail e senha, marcando a opção para confirmar o e-mail automaticamente. O trigger da migration `0002` cria automaticamente o registro correspondente em `profiles` com `role = 'admin'`.

## 4. Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

> Essas duas chaves são públicas por design (protegidas pelo RLS) e podem ficar no bundle do cliente. **Nunca** coloque a `service_role key` no projeto — ela não é usada em nenhum lugar do código.

## 5. Rodando localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000` para o cardápio público e `http://localhost:3000/admin/login` para o painel administrativo.

## 6. Configurar a loja

Depois de logar em `/admin`, vá em **Configurações** e preencha:

- Número de WhatsApp (com DDI e DDD, só números — ex: `5588900000000`)
- Horário de funcionamento e tempo estimado de entrega
- Pedido mínimo
- Texto do banner de promoção (opcional)
- Status da loja (aberta/fechada)

Depois cadastre **Categorias**, **Produtos** (com upload de imagem) e **Bairros** com suas taxas de entrega.

## Scripts

```bash
npm run dev         # ambiente de desenvolvimento
npm run build       # build de produção
npm run start       # servidor de produção
npm run lint        # eslint
npm run type-check  # verificação de tipos TypeScript
```

## Publicando na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os mesmos valores do `.env.local`.
4. Clique em **Deploy**.

Nenhuma configuração adicional é necessária — o projeto usa apenas rotas padrão do App Router e Proxy (equivalente ao middleware), ambos suportados nativamente pela Vercel.

## Segurança

- Row Level Security ativo em todas as tabelas.
- Leitura pública liberada apenas para categorias/bairros ativos e produtos de categorias ativas; escrita restrita a usuários autenticados.
- Pedidos são gravados exclusivamente pela função `create_order` (SQL, `SECURITY DEFINER`), que recalcula preços, promoções e taxa de entrega a partir do banco — o valor enviado pelo navegador nunca é confiado.
- A `service_role key` do Supabase não é usada em nenhum lugar do projeto.
