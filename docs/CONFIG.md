# Configuração do projeto RIGOR

## Variáveis de ambiente

Ver [.env.example](../.env.example) na raiz do projeto. Resumo:

| Variável | Onde | Obrigatória | Uso |
|----------|------|-------------|-----|
| `PORT` | Backend | Não (default 5000) | Porta do servidor Express |
| `SUPABASE_URL` | Backend | **Sim** | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Backend | **Sim** | Chave anônima (pública) do Supabase |
| `SUPABASE_SERVICE_KEY` | Backend | Não | Não usada pelo código atual |
| `CORS_ORIGINS` | Backend | Não (prod) | Origens permitidas (ex: `https://meuapp.com`) |
| `EXPO_PUBLIC_DOMAIN` | Cliente | **Sim** | Host da API (ex: `localhost:5000` ou `api.meuapp.com`) |
| `EXPO_PUBLIC_API_URL` | Cliente | Não | URL completa da API (substitui DOMAIN) |
| `DATABASE_URL` | Drizzle CLI | Só se usar drizzle-kit | Connection string Postgres (schema legado) |

---

## Supabase

### Onde as credenciais são usadas

- **SUPABASE_URL** e **SUPABASE_ANON_KEY**: usadas em um único arquivo, [server/supabase.ts](../server/supabase.ts).
  - Cliente global: `supabase` (validação de token em `authMiddleware` e em rotas).
  - `createAuthClient()`: signup, login, forgot-password, refresh (sem token de usuário).
  - `createUserClient(accessToken)`: todas as rotas autenticadas (contract, records, squads) com RLS do Supabase.

- **SUPABASE_SERVICE_KEY**: não é referenciada em nenhum arquivo do projeto. Pode ser usada no futuro para operações server-side com permissão total (ex: admin).

### Arquivos que conectam ao Supabase

| Arquivo | Uso |
|---------|-----|
| **server/supabase.ts** | Cria os clientes Supabase (url + anon key; user client com Bearer token). |
| **server/routes.ts** | Importa `supabase`, `createAuthClient`, `createUserClient`; todas as rotas de auth e dados usam esses clientes. |

O app **Expo (cliente)** não fala com o Supabase diretamente: ele chama apenas a **API Express** (em `lib/query-client.ts` e `lib/rigor-context.tsx`), e o Express usa o Supabase no backend.

---

## Drizzle ORM e banco de dados

- **Em runtime**: o backend **não usa Drizzle**. Toda persistência é feita via **Supabase** (Postgres gerenciado pelo Supabase, com tabelas e RLS configurados no dashboard).

- **Drizzle no repositório**:
  - **drizzle.config.ts**: aponta para `shared/schema.ts` e `DATABASE_URL`. Use apenas se for rodar `drizzle-kit push` ou migrations em um Postgres próprio.
  - **shared/schema.ts**: define apenas a tabela `users` (id, username, password). Esse schema é **legado**; o app real usa as tabelas do Supabase (ex.: `contracts`, `day_records`, `squads`, `squad_members` criadas no Supabase).

- **server/storage.ts**: implementa `MemStorage` em memória usando tipos de `shared/schema`. Não é usado pelas rotas atuais (auth e dados vêm do Supabase).

### Schema do banco (Supabase)

As tabelas efetivas estão no **Supabase**, não em arquivos `db/` ou `server/` do repo. Pelo uso em [server/routes.ts](../server/routes.ts), o backend espera algo como:

- **contracts**: user_id, rule, deadline_hour, deadline_minute, duration_days, started_at, ends_at, status, created_at
- **day_records**: user_id, contract_id, date, completed (e possivelmente RPC `mark_day_complete`)
- **squads**: name, code, created_by
- **squad_members**: squad_id, user_id, joined_at

Para ver o schema exato, use o **Table Editor** do projeto no dashboard do Supabase ou as migrations do Supabase (se existirem no projeto).

---

## Arquivos de configuração principais

| Arquivo | Função |
|---------|--------|
| **.env** | Variáveis de ambiente (não versionado). Use .env.example como modelo. |
| **server/index.ts** | Entrada do Express: CORS, body, rotas, servir landing e estáticos. |
| **server/routes.ts** | Todas as rotas da API e middleware de auth. |
| **server/supabase.ts** | Configuração dos clientes Supabase. |
| **lib/query-client.ts** | Base URL da API (EXPO_PUBLIC_DOMAIN / EXPO_PUBLIC_API_URL) e fetch autenticado. |
| **drizzle.config.ts** | Config do Drizzle Kit (schema + DATABASE_URL). |
| **shared/schema.ts** | Schema Drizzle legado (tabela `users`). |
| **app.json** | Nome, slug, plugins Expo (ex.: expo-router origin). |

---

## Rodar localmente

1. Copie `.env.example` para `.env` e preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY`.
2. Defina `EXPO_PUBLIC_DOMAIN=localhost:5000` no `.env` (ou no script já usa isso).
3. Terminal 1: `npm run server:dev`
4. Terminal 2: `npm run expo:dev`

O app Expo (web ou dispositivo) vai chamar a API em `http://localhost:5000`.
