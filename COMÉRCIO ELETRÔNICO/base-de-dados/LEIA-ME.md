# Base de dados EasyShop (PostgreSQL)

`easyshop_local.sql` é a exportação da base de dados local do projecto EasyShop: estrutura (as migrações Prisma em `db/migrations`) e dados de demonstração (130 produtos, clientes, encomendas, pagamentos, avaliações e promoções).

Os dados são fictícios (contas `@easyshop.test` e `@exemplo.co.mz`). A palavra-passe de todas as contas de demonstração é `EasyShopTeste!2026`.

## Importar

O projecto usa **PostgreSQL** (não MySQL), por isso não abre no phpMyAdmin. Use pgAdmin, DBeaver ou a linha de comandos:

```bash
createdb -U postgres easyshop
psql -U postgres -d easyshop -f easyshop_local.sql
```

Depois, em `backend/.env`:

```
DATABASE_URL=postgresql://postgres:<palavra-passe>@localhost:5432/easyshop?schema=public
```

Alternativa sem importar: `npx prisma migrate deploy --schema=db/schema.prisma` seguido de `node db/seed.js` cria a mesma estrutura e um seed novo.
