# AT42 — Ambiente de demonstração e roteiro de arranque

Responsável: Humberto Rodrigues · Auxiliar: Anibal

## 1. Arrancar a partir de um clone limpo (Docker)

Requisito: Docker Desktop iniciado (Linux containers, Compose v2). Não é preciso Node.

```powershell
git clone https://github.com/filipetaremba/epi-ecommerce.git
cd epi-ecommerce
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
docker compose up --build -d --wait
docker compose exec backend npm run db:seed -w backend
```

- Loja: http://localhost:3001 · API: http://localhost:3000/api/health
- Para recomeçar do zero: `docker compose down -v` e repetir os dois últimos comandos.

## 2. Arrancar sem Docker (Node 20+ e PostgreSQL 16)

```powershell
npm ci
Copy-Item backend/.env.example backend/.env      # ajustar DATABASE_URL
npx prisma migrate deploy --schema=db/schema.prisma
node db/seed.js                                  # 130 produtos, contas, encomendas e campanhas
npm run dev                                      # backend :3000 + frontend :3001
```

Numa base que já tinha dados (o seed nunca sobrescreve registos), actualizar textos e políticas com:
`node db/seed/actualizar-politicas.js` e `node db/seed/actualizar-textos.js`.

## 3. Contas de demonstração

Palavra-passe de todas: `EasyShopTeste!2026` (alterável com a variável `SEED_PASSWORD` antes do seed).

| Perfil | E-mail | Onde entrar |
|---|---|---|
| Administrador | `admin1@easyshop.test` (até `admin4`) | /entrar → /admin |
| Cliente | `cliente001@easyshop.test` (até `cliente120`) | /entrar → /conta |
| Empresa aprovada (B2B) | `empresa1@easyshop.test` | /entrar → /conta/empresa (cotações) |
| Empresa pendente | `empresa3@easyshop.test` | só leitura até aprovação |

## 4. Roteiro da demonstração (≈ 10 minutos)

1. **Loja (visitante)**: página inicial, categorias (EPI, videovigilância, redes, acessos, alarmes, cofres), marcas, popup de promoções.
2. **Produto**: preço promocional, disponibilidade, descontos por quantidade, garantia.
3. **Checkout sem conta**: zona e modalidade (frete calculado no servidor), pagamento por cartão, transferência, numerário ou e-Mola (simulados) ou M-Pesa (API real em sandbox, ver secção 5). A conta é criada automaticamente.
4. **Factura**: descarregar o PDF na confirmação.
5. **Cliente** (`cliente001`): encomendas, pagamentos, pedido de devolução, avaliações.
6. **Administrador**: encomendas (mudar estado de encomenda e entrega), devoluções (aprovar/rejeitar → receber → reembolsar), reembolsos, avaliações, configuração da loja e políticas (as alterações aparecem logo em /info/*).
7. **Empresas**: aprovar a empresa pendente e responder a uma cotação.

## 5. Pagamentos M-Pesa

Sem chaves, todos os métodos funcionam em simulação. Com chaves no `backend/.env`, o M-Pesa usa a API C2B da Vodacom e deixa de poder ser confirmado por simulação:

```env
PAGAMENTOS_SIMULACAO=false
MPESA_SANDBOX=true
MPESA_SERVICE_PROVIDER_CODE=171717
MPESA_API_KEY=<chave do portal developer.mpesa.vm.co.mz>
MPESA_PUBLIC_KEY=<chave pública do portal>
```

No sandbox, o pedido USSD só chega a números registados como teste no portal da Vodacom. Para receber no telemóvel real é preciso a conta de produção (`MPESA_SANDBOX=false`) com o código de serviço da empresa.

## 6. Verificações rápidas antes da apresentação

```powershell
npm run check          # lint backend, frontend e seed + validação do schema
npm run test:seed      # 7 testes
npm run build          # build do frontend
```

Problemas comuns: portas 3000/3001/5432 ocupadas; seed numa base antiga (criar uma base nova ou usar os scripts de actualização).
