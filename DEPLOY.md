# Guia de deploy – RIGOR (Expo + Express)

Este guia cobre o deploy do **backend Express** e a **distribuição do app Expo** (web, iOS, Android), com variáveis de ambiente e scripts necessários.

---

## 1. Plataforma para o backend (Express)

Recomendações:

| Plataforma | Prós | Contras | Recomendação |
|------------|------|---------|--------------|
| **Render** | Grátis (tier Free), HTTPS automático, deploy via Git, variáveis de ambiente fáceis | Serviço “dorme” após inatividade no Free | **Boa opção para começar** |
| **Railway** | Simples, bom free tier, logs e métricas | Limites no plano gratuito | Ótima alternativa |
| **Fly.io** | Bom free tier, regiões globais | Curva de aprendizado um pouco maior | Se precisar de baixa latência global |
| **Vercel** | Ótimo para front estático | Serverless; Express precisa de adaptação (serverless functions) | Menos direto para este projeto |
| **Replit** | Já estava configurado | Dependência de um único provedor | Pode manter se quiser |

**Sugestão:** usar **Render** (Web Service) para o backend: criar repositório no GitHub, conectar no Render e fazer deploy automático a cada push.

---

## 2. Build e distribuição do app Expo

O app tem três “saídas”:

| Saída | Como | Onde distribuir |
|-------|------|-------------------|
| **Web** | Build estático (Expo) + servido pelo mesmo backend (landing + `static-build`) ou por um CDN | Mesmo domínio do backend ou subdomínio (ex: `app.rigor.com`) |
| **iOS** | EAS Build (Expo Application Services) ou build local | App Store (ou TestFlight para beta) |
| **Android** | EAS Build ou build local | Google Play (ou link direto para .apk em beta) |

**Recomendações:**

- **Web:** usar o script `expo:static:build` (que roda `scripts/build.js`) para gerar os bundles e manifestos; o backend Express já está preparado para servir a landing e os arquivos em `static-build`. Em produção, defina `EXPO_PUBLIC_DOMAIN` (ou `EXPO_PUBLIC_API_URL`) apontando para a URL do backend.
- **Mobile (iOS/Android):** usar **EAS Build** (Expo) para gerar os binários e, em seguida, publicar na App Store e na Play Store (ou distribuir via link). O app já chama a API via `EXPO_PUBLIC_DOMAIN` / `EXPO_PUBLIC_API_URL`, então basta configurar essas variáveis no EAS para produção.

---

## 3. Variáveis de ambiente em produção

### Backend (Render / Railway / etc.)

Definir no painel da plataforma:

| Variável | Valor (exemplo) | Obrigatória |
|----------|------------------|-------------|
| `PORT` | `5000` (ou a que a plataforma injetar) | Não (geralmente a plataforma define) |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | **Sim** |
| `SUPABASE_ANON_KEY` | `eyJ...` (chave anônima do Supabase) | **Sim** |
| `CORS_ORIGINS` | `https://seu-dominio.com,https://www.seu-dominio.com` | Recomendado em produção |

Não é necessário `REPLIT_*` em produção fora do Replit.

### Cliente (Expo) em produção

O app lê a API via `EXPO_PUBLIC_DOMAIN` ou `EXPO_PUBLIC_API_URL`. Essas variáveis são **embutidas no build**. Para produção:

- **Web (build estático):** ao rodar `expo:static:build`, definir `EXPO_PUBLIC_DOMAIN` (ou `EXPO_PUBLIC_API_URL`) com a URL do backend em produção (ex: `rigor-backend.onrender.com` ou `api.rigor.com`).
- **EAS Build (mobile):** no projeto EAS (expo), configurar as mesmas variáveis no perfil de build de produção para que o app já saia apontando para a API correta.

Exemplo para produção:

- `EXPO_PUBLIC_DOMAIN=rigor-backend.onrender.com`  
  ou  
- `EXPO_PUBLIC_API_URL=https://rigor-backend.onrender.com`

---

## 4. Scripts de build necessários

Já existentes no `package.json`:

| Script | Uso |
|--------|-----|
| `npm run server:dev` | Backend em desenvolvimento local (tsx). |
| `npm run server:build` | Gera `server_dist/index.js` (bundle do Express). |
| `npm run server:prod` | Roda o backend em produção (`node server_dist/index.js`). |
| `npm run expo:dev` | Expo em desenvolvimento local (API em `localhost:5000`). |
| `npm run expo:static:build` | Gera `static-build/` (bundles + manifestos) para deploy web. |

Para deploy do backend em Render/Railway, o comando de start em produção deve ser:

```bash
npm run server:build && npm run server:prod
```

Ou, se a plataforma rodar só um comando:

```bash
npm run server:prod
```

(assumindo que o build já foi feito no passo de build ou que você faz o build no passo de deploy.)

---

## 5. Passo a passo – Deploy do backend (Render)

### 5.1 Preparar o repositório

1. Garanta que o código está no **GitHub** (ou GitLab).
2. No `.env` local não commite credenciais; use `.env.example` como modelo (já criado).

### 5.2 Render – Web Service

1. Acesse [render.com](https://render.com) e crie conta (ou faça login).
2. **New → Web Service**.
3. Conecte o repositório do RIGOR.
4. Configuração sugerida:
   - **Name:** `rigor-backend` (ou outro nome).
   - **Region:** escolha a mais próxima dos usuários.
   - **Branch:** `main` (ou a branch de produção).
   - **Root Directory:** em branco (raiz do repo).
   - **Runtime:** `Node`.
   - **Build Command:**  
     `npm install && npm run server:build`
   - **Start Command:**  
     `npm run server:prod`
   - **Instance Type:** Free (ou pago, se precisar).

5. **Environment** (Environment Variables):
   - `SUPABASE_URL` = URL do projeto Supabase.
   - `SUPABASE_ANON_KEY` = chave anônima do Supabase.
   - `CORS_ORIGINS` = `https://seu-dominio-frontend.com` (ou a URL do app web, se for outro domínio).
   - Não defina `PORT`; o Render injeta automaticamente.

6. Clique em **Create Web Service**. O Render vai fazer o build e subir o serviço. A URL ficará tipo `https://rigor-backend.onrender.com`.

7. Teste:  
   `curl https://rigor-backend.onrender.com/`  
   Deve retornar a landing page em HTML.

---

## 6. Passo a passo – Build do app web (Expo estático)

Para servir o app web pelo mesmo backend (ou por outro host que sirva os arquivos estáticos):

1. **Definir domínio da API no build**  
   Use a URL do backend em produção, por exemplo:
   - `EXPO_PUBLIC_DOMAIN=rigor-backend.onrender.com`  
   ou  
   - `EXPO_PUBLIC_API_URL=https://rigor-backend.onrender.com`

2. **Gerar o build estático** (na sua máquina ou em CI):
   ```bash
   set EXPO_PUBLIC_DOMAIN=rigor-backend.onrender.com
   npm run expo:static:build
   ```
   (No Linux/mac use `export EXPO_PUBLIC_DOMAIN=...`.)

   O script `expo:static:build` (scripts/build.js) inicia o Metro, gera os bundles e manifestos e preenche as URLs no build com o domínio informado.

3. **Artefatos gerados:**  
   A pasta `static-build/` conterá os arquivos que o `server/index.ts` já serve em `/` e em rotas como `/static-build/...`. Se o deploy do backend (Render) for feito a partir do mesmo repositório, você precisa **incluir `static-build/` no deploy** (commitar após o build ou gerar o build no próprio Render com um build command que rode também `expo:static:build`).  
   Alternativa: gerar `static-build/` em um pipeline de CI e fazer deploy só do backend + `static-build/` (por exemplo, gerando o build na máquina e fazendo push da pasta, ou usando um step de build no Render que rode o script acima e mantenha a pasta).

4. **CORS:**  
   Se o app web for aberto em outro domínio (ex: `https://rigor.app`), adicione esse domínio em `CORS_ORIGINS` no backend.

---

## 7. Passo a passo – Build e distribuição mobile (EAS)

1. **Instalar EAS CLI e fazer login:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Configurar o projeto:**
   ```bash
   eas build:configure
   ```
   Crie perfis (ex: `development`, `preview`, `production`).

3. **Variáveis de ambiente no EAS:**  
   No dashboard do Expo (expo.dev) → seu projeto → **Build** → **Environment variables**, defina para o perfil de produção:
   - `EXPO_PUBLIC_DOMAIN` = `rigor-backend.onrender.com`  
   ou  
   - `EXPO_PUBLIC_API_URL` = `https://rigor-backend.onrender.com`

4. **Builds:**
   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```

5. **Publicação (opcional):**
   ```bash
   eas submit --platform ios --profile production
   eas submit --platform android --profile production
   ```

Assim o app mobile em produção já usa a API do backend deployado.

---

## 8. Checklist rápido

- [ ] Backend: variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `CORS_ORIGINS` (prod) configuradas.
- [ ] Cliente: `EXPO_PUBLIC_DOMAIN` ou `EXPO_PUBLIC_API_URL` definidos no build (web e EAS) com a URL do backend em produção.
- [ ] Build do backend: `npm run server:build`; start: `npm run server:prod`.
- [ ] Build web: `expo:static:build` com domínio de produção; servir `static-build/` pelo backend ou CDN.
- [ ] EAS: variáveis de API configuradas no perfil de produção; builds e submissão para as lojas conforme necessário.

---

## 9. Resumo dos arquivos de configuração

| Arquivo | Uso no deploy |
|---------|----------------|
| **.env** / variáveis no painel | Backend: SUPABASE_*, CORS_ORIGINS. Cliente (build): EXPO_PUBLIC_DOMAIN ou EXPO_PUBLIC_API_URL. |
| **server/index.ts** | Serve `/`, manifest, assets e `static-build`. |
| **server/routes.ts** | Todas as rotas da API. |
| **server/supabase.ts** | Lê SUPABASE_URL e SUPABASE_ANON_KEY. |
| **lib/query-client.ts** | Lê EXPO_PUBLIC_DOMAIN / EXPO_PUBLIC_API_URL para chamar a API. |
| **scripts/build.js** | Build estático Expo; usa EXPO_PUBLIC_DOMAIN para as URLs no bundle. |
| **drizzle.config.ts** | Opcional; só se for usar Drizzle com outro Postgres (DATABASE_URL). |

Para mais detalhes sobre variáveis e Supabase, veja [docs/CONFIG.md](docs/CONFIG.md).
