
# RIGOR APP

## Instalação e Uso

1. Instale as dependências:
	```
	npm install
	```

2. Configure as variáveis de ambiente:
	- Copie `.env.example` para `.env` e preencha com seus dados do Supabase e domínio.

3. Rode o backend:
	```
	npm run server:dev
	```

4. Rode o frontend (Expo):
	```
	npm run expo:dev
	```

5. Para gerar o backup completo do código:
	- Use o arquivo `rigor-codigo-completo.txt` (contém todo o código das pastas app, components, lib, constants).


## Deploy na Vercel

1. Gere o static-build (veja instruções acima).
2. Certifique-se de que existe o arquivo `static-build/index.html` (já criado).
3. O arquivo `vercel.json` já está configurado para direcionar `/` para `static-build/index.html`.
4. Faça deploy pelo painel da Vercel ou CLI.

Se aparecer erro 404, verifique se o static-build está presente e se o index.html está na pasta correta.

## Atualização no GitHub

1. Faça commit das alterações:
	```
	git add .
	git commit -m "Atualiza código e instruções"
	```
2. Faça push para o repositório:
	```
	git push
	```

## Contribuição

Pull requests e sugestões são bem-vindas!

---

**Backup:**
O arquivo `rigor-codigo-completo.txt` pode ser usado para replicar o app em outras plataformas ou IA.