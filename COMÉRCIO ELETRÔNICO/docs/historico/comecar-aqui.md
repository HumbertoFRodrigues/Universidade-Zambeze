# Começar aqui

Este pacote já inclui o código completo do template melhorado (Fase 2) e o histórico Git local.
Não é preciso clonar nada do GitHub nem descarregar o projecto de outro sítio.
Só as dependências (pacotes npm) são descarregadas pelo `pnpm install`.

## 1. Pôr a funcionar
Seguir `docs/alteracoes.md` e o guia “Fase 2: Configuração do Template” (Word). Resumo:

```bash
unzip loja-seguranca-template.zip && cd proj
corepack enable                      # pnpm 9.15.0
pnpm install --frozen-lockfile
docker compose up -d                 # PostgreSQL (ou usar um PostgreSQL local)
cp apps/backend/.env.template apps/backend/.env       # preencher segredos e DATABASE_URL
cp apps/storefront/.env.template apps/storefront/.env.local
cd apps/backend && pnpm medusa db:migrate && pnpm medusa user -e <email> -p "<palavra-passe>"
pnpm dev                             # backend em :9000 ; depois, noutro terminal, pnpm dev em apps/storefront (:8000)
```

## 2. Quando a equipa criar o repositório no GitHub
O repositório local já tem dois commits e a etiqueta `baseline-starter` (starter original, para comparação).

```bash
git remote add origin <URL do repositório vazio criado pela equipa>
git push -u origin main
git push origin baseline-starter
```

Antes do primeiro `push`, confirmar que `git status` não mostra ficheiros `.env` (estão no `.gitignore`)
e definir o nome e o email de cada membro: `git config user.name "..."` e `git config user.email "..."`.

## 3. Estado
Fase 2 concluída neste pacote; Fase 3 aguarda as decisões D2, D3, D4, D7, D8 e D12.
