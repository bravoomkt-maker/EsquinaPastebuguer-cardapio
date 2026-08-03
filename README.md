# Esquina Pasteburguer — Cardápio Digital + PDV

Cardápio digital administrável **e sistema de PDV completo** para a lanchonete Esquina Pasteburguer (Quixadá-CE), construído com Next.js (App Router), TypeScript, Tailwind CSS e Supabase.

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
    (dashboard)/              # Área protegida (categorias, produtos, adicionais, bairros,
                               # formas de pagamento, relatórios, usuários, configurações, pedidos)
  pdv/                        # Tela do PDV (balcão) — venda por unidade e por peso
  cozinha/                    # Painel da cozinha em tempo real (Supabase Realtime)
  caixa/                      # Abertura/movimentação/fechamento de caixa
  imprimir/[orderId]/         # Comanda (cozinha) e comprovante (cliente), 58mm/80mm
components/
  public/                     # Header, banner, busca, carrinho, checkout (cardápio)
  admin/                      # Formulários e listas do painel admin
  pdv/                        # Grade de produtos, modais de peso/adicionais, carrinho do PDV
  cozinha/                    # Painel kanban da cozinha
  caixa/                      # Telas de abertura/fechamento de caixa
  print/                      # Layout de impressão térmica
  ui/                         # Button, Input, Select, Modal, Badge, Spinner...
lib/
  supabase/                   # Clientes Supabase (browser, server)
  store/                      # Zustand (carrinho do cardápio + carrinho do PDV)
  reports/                    # Agregação de dados para /admin/relatorios
  types/                      # Tipos TypeScript (incl. tipos do banco)
  utils/                      # currency, whatsapp, validation, date, cn, weight, payment
supabase/migrations/          # Migrations SQL, na ordem de aplicação
```

Rotas em `/admin` são protegidas diretamente no Server Component do layout (`app/admin/(dashboard)/layout.tsx`), que verifica a sessão do Supabase Auth e redireciona para `/admin/login` se não houver usuário logado — sem depender de Proxy/Middleware.

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
6. `0006` a `0014` — tamanhos de produto, meio a meio, quantidade mínima e políticas de escrita/exclusão de pedidos (evolução do cardápio digital)
7. **`0015` a `0025` — todo o PDV**: tipos/status de pedido, número sequencial, histórico de status; clientes; peso e adicionais em produtos/itens; formas de pagamento e pagamentos (já preparado para pagamento dividido no futuro); caixa (abertura/movimentações/fechamento); configurações do PDV e da impressora; papéis admin/caixa/cozinha com RLS; a função `create_pos_order`; Realtime; e um seed opcional com o produto "Açaí na tigela" (R$ 54,00/kg) e grupos de adicionais de exemplo

> **Dica:** rode um arquivo por vez e confira "Success" antes de colar o próximo. O SQL Editor do Supabase às vezes tem um assistente automático que pode alterar o texto colado — se aparecer um erro de sintaxe estranho, abra uma aba nova, cole novamente e rode sem esperar. Isso é especialmente importante nas funções `create_order` e `create_pos_order`, que evitam de propósito os padrões de SQL que costumam disparar esse bug (comentário no topo de cada arquivo).

> ⚠️ **Se o projeto já está em produção**: as migrations `0015+` só *adicionam* colunas/tabelas com valores padrão compatíveis com os dados existentes — nenhum pedido, produto ou bairro já cadastrado é alterado. Ainda assim, rode-as fora do horário de pico e confira o "Success" de cada uma.

## 3. Criar usuários (admin, caixa, cozinha)

Vá em **Authentication → Users → Add user**, crie com e-mail e senha, marcando a opção para confirmar o e-mail automaticamente. O trigger da migration `0002` cria automaticamente o registro correspondente em `profiles` com `role = 'admin'`.

Para criar **atendentes/caixa** e **cozinha**: crie o usuário do mesmo jeito em Authentication → Users e, depois, logue como admin, vá em **`/admin/usuarios`** e ajuste o papel (Administrador / Atendente-Caixa / Cozinha) e o nome de exibição. Isso é necessário porque o projeto não usa a `service role key` (decisão de segurança mantida deliberadamente — veja "Segurança" abaixo), então a criação de usuários em si só pode ser feita pelo painel do Supabase, não pelo app.

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
npm run test        # testes unitários (vitest) — cálculos de peso, troco e relatórios
```

## Sistema PDV

### Áreas do sistema

| Rota | Quem acessa | Função |
|---|---|---|
| `/pdv` | admin, caixa | Venda no balcão/mesa/retirada/entrega, por unidade ou por peso |
| `/cozinha` | admin, caixa, cozinha | Painel em tempo real dos pedidos (sem valores) |
| `/caixa` | admin, caixa | Abertura, sangria/suprimento/entrada/saída, fechamento |
| `/admin/pedidos` | admin, caixa, cozinha | Lista completa de pedidos com histórico de status |
| `/admin/produtos` | admin | Cadastro de produtos, incl. venda por peso e por unidade |
| `/admin/adicionais` | admin | Grupos de adicionais (ex: bacon, queijo extra) |
| `/admin/bairros` | admin | Bairros, taxa de entrega, tempo médio e pedido mínimo |
| `/admin/formas-pagamento` | admin | Ativar/desativar/criar formas de pagamento |
| `/admin/relatorios` | admin | Faturamento, ticket médio, produtos mais vendidos, etc. |
| `/admin/usuarios` | admin | Papel (admin/caixa/cozinha) e nome de cada usuário |
| `/admin/configuracoes` | admin | Dados da loja + configurações do PDV/impressora |

As permissões são aplicadas em duas camadas: a interface esconde ações que o papel do usuário não deveria fazer, e o banco (Row Level Security) bloqueia a escrita mesmo que alguém tente contornar a interface. A única exceção documentada: como todo usuário autenticado usa o mesmo papel de banco (`authenticated`), o RLS não consegue esconder *colunas* — a tela `/cozinha` simplesmente nunca busca nem exibe valores financeiros, em vez de o banco bloquear a leitura dessas colunas.

### Vendendo açaí (ou qualquer produto por peso)

1. Em `/admin/produtos`, cadastre o produto com **Tipo de venda = Por peso (kg)** e informe o **preço por quilo**.
2. No PDV, clique no produto → abre um modal com atalhos (100g, 250g, 300g, 500g, 750g, 1kg) e um campo para digitar o peso exibido na balança.
3. O valor é calculado automaticamente (`peso em gramas × preço por kg ÷ 1000`) e gravado no pedido — alterar o preço por kg depois **não** muda pedidos já feitos.

### Impressão (comanda e comprovante)

Depois de finalizar uma venda no PDV (ou pela lista `/admin/pedidos`), use os botões **Comanda** (sem valores, para a cozinha) e **Comprovante** (com valores, para o cliente). Cada um abre `/imprimir/[pedido]?tipo=...` em uma nova aba, com um seletor de largura (58mm/80mm) e o botão "Imprimir", que usa a impressão nativa do navegador (`window.print()` + CSS `@media print`). A largura padrão vem de `/admin/configuracoes`.

Isso funciona com qualquer impressora térmica já instalada como impressora do Windows/Linux/macOS (a maioria das USB/Bluetooth de 58/80mm aparece assim). A arquitetura já isola essa lógica em `components/print/PrintReceipt.tsx`, então trocar para impressão automática via **QZ Tray** no futuro não exige redesenhar as telas — só trocar o botão "Imprimir" por uma chamada ao QZ Tray.

### PWA (instalação no computador/tablet)

O projeto tem `app/manifest.ts` (nome "Esquina Pasteburguer PDV", `start_url: /pdv`) e um service worker mínimo (`public/sw.js`) só para habilitar a instalação — ele **não** cria cache de dados nem modo offline, porque o sistema depende do Supabase em tempo real. Quando a internet cai, uma faixa vermelha fixa no topo avisa "Sem conexão com a internet" (`components/OfflineBanner.tsx`), em vez de fingir que tudo continua funcionando.

Para instalar: abra o site publicado no Chrome/Edge (computador ou tablet) e use "Instalar app" na barra de endereço, ou "Adicionar à tela inicial" no menu do navegador.

> Nota de polimento: os ícones do manifest reaproveitam `public/logo-icon.png`, que não tem exatamente 192×192/512×512px. Funciona (o navegador redimensiona), mas para um resultado mais nítido vale gerar ícones quadrados nesses tamanhos exatos (ex: em [realfavicongenerator.net](https://realfavicongenerator.net)) e trocar os arquivos em `public/`.

### Testes automatizados

```bash
npm run test
```

Cobre os cálculos financeiros e de peso (os que têm regra de negócio exata e valem a pena travar com teste): valor do item por peso (incl. os exemplos de 100g/250g/350g/500g/750g/1000g a R$54/kg), arredondamento em centavos, rejeição de peso zero/negativo, cálculo de troco, e a agregação dos relatórios (faturamento ignora cancelados, ticket médio, descontos, taxas de entrega, peso total vendido).

Os demais cenários do roteiro de testes (pedido com adicionais ponta a ponta, entrega com taxa por bairro, abertura/fechamento de caixa, tempo real na cozinha, impressão 58mm/80mm, permissões por papel, reconexão sem duplicar pedido) dependem de um Supabase real logado como usuário de cada papel — não são simuláveis em teste unitário. Faça esse roteiro manualmente depois de aplicar as migrations, usando um usuário de cada papel (admin/caixa/cozinha).

### Funcionalidades implementadas

- Cardápio digital (já existia, mantido 100% funcional) + checkout via WhatsApp
- PDV com venda por unidade e por peso, adicionais, tipos de atendimento (balcão/mesa/retirada/entrega), busca de cliente por telefone com preenchimento automático de endereço
- Cálculo de troco e bloqueio de dinheiro sem caixa aberto (configurável)
- Pedidos com status completo (novo → confirmado → em preparação → pronto → saiu para entrega → finalizado / cancelado) e histórico automático de cada mudança
- Painel da cozinha em tempo real (Supabase Realtime), sem dados financeiros, com destaque de pedidos atrasados
- Caixa: abertura, entrada/suprimento/saída/sangria/estorno, fechamento com conferência (esperado × contado × diferença)
- Impressão de comanda (cozinha) e comprovante (cliente) em 58mm/80mm
- Relatórios com filtro por período (hoje/ontem/7 dias/mês/personalizado): faturamento, ticket médio, vendas por tipo/forma de pagamento/funcionário, produtos mais/menos vendidos, peso e faturamento de açaí, horários de pico, cancelamentos, descontos e taxas
- Papéis admin/caixa/cozinha com permissões na interface **e** no banco (RLS)
- PWA instalável, com aviso claro de conexão perdida
- Testes unitários dos cálculos financeiros e de peso

### Limitações conhecidas e melhorias futuras

- **Cancelamento de pedido já pago não estorna automaticamente** a movimentação de caixa correspondente — hoje isso precisa ser lançado manualmente como "Estorno" em `/caixa`. Automatizar isso é a melhoria mais importante a fazer a seguir.
- **Pagamento dividido**: o banco já suporta (`payments` aceita várias linhas por pedido), mas a tela do PDV hoje só oferece uma forma de pagamento por venda. Adicionar múltiplas formas na mesma tela é uma extensão da interface, não do banco.
- **Cardápio digital não cria/atualiza clientes**: para não arriscar tocar na função `create_order` (frágil por um bug documentado do SQL Editor do Supabase), o cadastro automático de clientes por telefone só acontece em vendas feitas pelo PDV.
- **Sem impressão automática**: a impressão usa o diálogo nativo do navegador. A arquitetura já está pronta para integrar **QZ Tray** depois, sem redesenhar as telas.
- **Ícones do PWA** reaproveitam a logo existente, não estão em 192×192/512×512px exatos.
- **Sem controle de estoque decrementado automaticamente**: o campo de estoque existe no cadastro do produto, mas nada abate o estoque a cada venda ainda.

## Publicando na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, adicione `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os mesmos valores do `.env.local`.
4. Clique em **Deploy**.

Nenhuma configuração adicional é necessária — o projeto usa apenas rotas padrão do App Router (a proteção de `/admin`, `/pdv`, `/cozinha` e `/caixa` é feita em Server Components, sem depender de Proxy/Middleware), suportado nativamente pela Vercel.

## Segurança

- Row Level Security ativo em todas as tabelas, incluindo as novas do PDV.
- Leitura pública liberada apenas para categorias/bairros ativos e produtos de categorias ativas/visíveis no cardápio; escrita em cadastros (produtos, preços, categorias, bairros, adicionais, formas de pagamento, configurações) restrita ao papel **admin**.
- Pedidos do cardápio digital são gravados exclusivamente pela função `create_order` (SQL, `SECURITY DEFINER`); pedidos do PDV, pela função `create_pos_order` (mesmo princípio). As duas recalculam preços, promoções, peso × preço/kg e taxa de entrega a partir do banco no momento da venda — o valor enviado pelo navegador nunca é confiado.
- Papéis (admin/caixa/cozinha) são verificados tanto na interface quanto no banco via `public.current_profile_role()`, usada nas políticas de RLS.
- A `service_role key` do Supabase **não é usada em nenhum lugar do projeto** — inclusive o PDV, o caixa e os relatórios seguem o mesmo padrão de RLS + funções `SECURITY DEFINER` já usado no cardápio.
