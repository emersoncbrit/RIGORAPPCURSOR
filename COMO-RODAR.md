# Como rodar o RIGOR (Web + Autenticação Supabase)

## 1. Variáveis de ambiente

1. Copie o arquivo de exemplo:
   ```bash
   copy .env.example .env
   ```
2. Abra o `.env` e preencha (obrigatório):
   - **SUPABASE_URL** – no [Dashboard Supabase](https://supabase.com/dashboard) → seu projeto → **Settings** → **API** → Project URL.
   - **SUPABASE_ANON_KEY** – na mesma página, em **Project API keys** → `anon` (public).

O backend carrega o `.env` automaticamente ao subir.

## 2. Supabase – Autenticação

- No Supabase: **Authentication** → **Providers** → **Email**: deixe “Enable Email Signup” ativado.
- Se for usar **confirmação de email**: em **Authentication** → **URL Configuration** adicione em **Redirect URLs**:
  - `http://localhost:8081` (Expo web)
  - `http://localhost:5000` (opcional)

## 3. Rodar o projeto (Web)

São dois processos: o **backend** (API + Supabase) e o **frontend** (Expo).

**Terminal 1 – Backend**
```bash
npm run server:dev
```
Deve aparecer: `express server serving on port 5000`.

**Terminal 2 – Frontend (Expo)**

- Só **web** (abre no navegador):
  ```bash
  npm run web
  ```
- Ou Expo completo (depois pressione **w** para web):
  ```bash
  npm run expo:dev
  ```

O app web vai abrir em `http://localhost:8081` (ou outra porta que o Expo indicar) e a API será chamada em `http://localhost:5000`.

## 4. Testar autenticação

1. Acesse a tela de **Login** (ou **Sign up**).
2. Crie uma conta (Sign up) com email e senha.
3. Se o Supabase estiver com confirmação de email ativa, confira o email antes de fazer login.
4. Faça login com email e senha.

Se der erro de “Connection error” ou CORS, confira:

- O **Terminal 1** está rodando (`npm run server:dev`) e mostra “serving on port 5000”.
- O `.env` tem `SUPABASE_URL` e `SUPABASE_ANON_KEY` corretos (sem aspas extras, sem espaços).

## 5. Scripts úteis

| Script        | Uso                                      |
|---------------|------------------------------------------|
| `npm run server:dev` | Sobe o backend (Express) na porta 5000.  |
| `npm run expo:dev`   | Sobe o Expo; pressione **w** para web.  |
| `npm run web`        | Sobe o Expo já abrindo no navegador.    |
