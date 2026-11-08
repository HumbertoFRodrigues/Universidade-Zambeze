# EasyShop

Base inicial do projeto com **Express 5**, **React 19 + Vite**, **PostgreSQL 16** e **Prisma ORM 6.19.0**. O Docker Compose executa toda a aplicação. Redis está preparado nos comentários, sem serviço ou cache ativo.

## Estrutura

```text
proj/
├── backend/
│   ├── Dockerfile
│   ├── .env.example
│   ├── src/
│   │   ├── config/          # Variáveis de ambiente
│   │   ├── controllers/     # Tratamento dos pedidos
│   │   ├── lib/             # Cliente Prisma
│   │   ├── middlewares/     # Tratamento de erros
│   │   ├── routes/          # Rotas HTTP
│   │   ├── app.js           # Aplicação Express
│   │   └── server.js        # Inicialização e encerramento
│   └── tests/{unit,integration}/
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf           # Servir React e encaminhar /api
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── hooks/          # Carregamento de dados
│   │   ├── pages/          # Início, catálogo, produto, carrinho e conta
│   │   ├── services/       # Comunicação HTTP
│   │   └── styles/
│   └── tests/{unit,integration}/
├── db/
│   ├── schema.prisma       # Estrutura do banco
│   ├── migrations/         # Alterações SQL versionadas
│   └── seed.js             # Dados opcionais de demonstração
├── tests/e2e/              # Reservado para testes completos
├── docs/                   # Documento de negócio e histórico
├── docker-compose.yml
├── .env.example            # Portas e credenciais locais do Compose
├── package.json            # Comandos comuns e workspaces npm
└── package-lock.json       # Dependências fixadas
```

## Executar inicialmente com Docker

É necessário instalar e **iniciar o Docker Desktop**, com Linux containers e Docker Compose v2. Não é necessário instalar Node para esta opção.

Na raiz do projeto, em PowerShell:

```powershell
Copy-Item .env.example .env
docker compose up --build -d
docker compose ps -a
```

O Compose inicia PostgreSQL, aplica as migrations num serviço temporário chamado `migrate`, inicia o backend e depois o frontend. O serviço `migrate` terminar com código 0 é o comportamento esperado. O catálogo começa vazio.

Para preencher todos os domínios com mais de 6 mil registos fictícios (incluindo 240 produtos e imagens Unsplash):

```powershell
docker compose exec backend npm run db:seed -w backend
```

Para apagar todos os dados do PostgreSQL local, reaplicar as migrations e inserir novamente o seed actualizado:

```powershell
npm run db:reset:seed
```

O script `scripts/reset-and-seed.ps1` usa `DATABASE_URL` do ambiente, se definida; caso contrário, lê `backend/.env`. O mesmo URL validado é passado ao Prisma e ao seed. Por segurança, só aceita PostgreSQL em `localhost`, `127.0.0.1` ou `::1` e exige confirmação manual da frase `APAGAR DADOS LOCAIS`. Não o utiliza para bancos remotos ou de produção. Se a base estiver apenas dentro da rede Docker, execute o reset no ambiente apropriado depois de garantir uma cópia de segurança; este script bloqueia intencionalmente esse alvo. A gravação do seed também sincroniza as sequências `autoincrement()` com os IDs já inseridos, para que novas inserções não colidam.

Abrir:

- Loja: http://localhost:3001
- API: http://localhost:3000/api/produtos
- Estado da API e ligação ao banco: http://localhost:3000/api/health
- Opções de entrega: `GET /api/entregas/opcoes`
- Cotação antes da compra: `POST /api/checkout/calcular-frete`
- Confirmação da compra: `POST /api/checkout/confirmar`
- Estado da entrega: `GET /api/encomendas/:codigo/entrega?email=...`
- Alteração administrativa do estado: `PATCH /api/admin/encomendas/:encomendaId/entrega`

O checkout aceita `utilizadorId` ou `tokenSessao`, aplica a promoção activa mais vantajosa por produto, valida stock e tarifa e exige `x-idempotency-key` na confirmação. A confirmação cria a encomenda e a entrega, regista o histórico inicial, actualiza movimentos de stock e limpa o carrinho na mesma transacção. A alteração dos estados de entrega requer `x-admin-id` de um administrador. Há exemplos encadeados em `tests/api/checkout.http`.

As portas e credenciais locais são configuradas em `.env` na raiz. Se alterar as portas, atualizar os endereços acima. As credenciais fornecidas são exemplos para desenvolvimento local. Na ligação DATABASE_URL, caracteres especiais da palavra-passe precisam de codificação URL.

Para acompanhar erros, parar ou reconstruir depois de alterar o código:

```powershell
docker compose logs --tail 100 backend migrate frontend
docker compose down
docker compose up --build -d
```

Os dados ficam no volume `database_data`. `docker compose down` preserva esse volume; `docker compose down -v` apaga os dados. A configuração usa um volume novo e não importa dados da antiga instalação Medusa.

## Desenvolvimento local com atualização automática

Instalar Node.js 22.20.0 (também indicado em `.nvmrc`) e npm. Usar Docker apenas para o PostgreSQL:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
npm ci
docker compose up -d database
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

A loja continua em :3001 e a API em :3000. O backend lê `backend/.env`, o Vite lê `frontend/.env` e o Compose lê `.env` na raiz. Se alterar credenciais ou a porta PostgreSQL, atualizar também DATABASE_URL em `backend/.env`. A variável `API_PROXY_TARGET` do frontend deve acompanhar alterações da porta da API.

Não executar simultaneamente os containers backend/frontend e os servidores locais nas mesmas portas. Se estiverem ativos:

```powershell
docker compose stop frontend backend
```

## Dependências e pastas node_modules

O projeto usa **npm workspaces**: o npm gere o `backend` e o `frontend` em conjunto a partir da raiz. Cada um tem o seu `package.json`, onde declara as bibliotecas de que precisa.

As pastas `node_modules` guardam as bibliotecas instaladas, necessárias para executar e compilar o projeto. É normal existir uma na raiz e também dentro do backend ou do frontend:

- `node_modules/` na raiz: o npm coloca aqui a maior parte das dependências, que podem ser utilizadas pelos dois workspaces.
- `backend/node_modules/` ou `frontend/node_modules/`: o npm pode colocar aqui dependências específicas, por exemplo quando precisa de manter versões diferentes da mesma biblioteca.

Pense na pasta da raiz como um armário comum e na pasta do backend como um armário próprio. Ao procurar uma biblioteca, o Node pode encontrá-la na pasta local ou na pasta da raiz. Ter estas pastas não significa que todas as bibliotecas estejam duplicadas.

O código que desenvolvemos fica em `backend/src` e `frontend/src`. Não editar `node_modules` manualmente nem incluí-la no Git: o npm gere essas pastas e o `.gitignore` já as exclui. No Docker, as dependências são instaladas dentro das imagens; a pasta local não é copiada para elas.

### Instalar dependências a partir da raiz

Executar os comandos na raiz do projeto e usar `-w` para indicar o workspace que precisa da biblioteca:

```powershell
# Biblioteca usada pelo backend
npm install express -w backend

# Biblioteca usada pelo frontend
npm install react -w frontend

# Ferramenta usada apenas no desenvolvimento do frontend
npm install -D vite -w frontend

# Ferramenta usada pelos comandos da raiz
npm install -D concurrently
```

Estes pacotes já estão declarados no projeto; os comandos acima são exemplos. Substituir o nome do pacote pela nova biblioteca que pretende instalar.

O `-w backend` regista a dependência em `backend/package.json`; o `-w frontend` regista-a em `frontend/package.json`. Sem `-w`, fica registada no `package.json` da raiz. A opção `-D` identifica uma ferramenta de desenvolvimento. **O local onde a biblioteca é declarada e o local onde o npm a guarda fisicamente podem ser diferentes.**

Ao adicionar uma dependência, versionar o `package.json` alterado e o `package-lock.json` da raiz. Para instalar todas as dependências já registadas, depois de obter o projeto ou apagar as pastas `node_modules`, executar na raiz:

```powershell
npm ci
```

Este comando instala as versões fixadas no lockfile e recria as pastas necessárias.

## Prisma e alterações do banco

O schema e as migrations estão em `db/`. O cliente Prisma é usado pelo backend. Foi fixada a versão 6.19.0, com o fluxo de configuração Prisma 6.

Após editar `db/schema.prisma`, com o banco local ativo:

```powershell
npm run db:migrate -- --name nome_da_alteracao
npm run db:generate
```

Versionar o schema e a migration gerada. Para aplicar migrations existentes usar `npm run db:deploy`. Para inspecionar os dados usar `npm run db:studio`. O comando migrate dev é para desenvolvimento; o Compose usa migrate deploy.

O seed é opcional e pode ser repetido: cria os registos ausentes sem sobrescrever os existentes. Inclui produtos, clientes, encomendas, pagamentos simulados, entregas, promoções, stock, avaliações, assistência, devoluções e reembolsos. O inventário, as contas e os cenários de teste estão em [db/seed/README.md](db/seed/README.md).

Para pré-visualizar as quantidades sem ligar ao banco, usar `npm run db:seed:preview`. Para verificar a consistência dos dados e a repetição do seed, usar `npm run test:seed`.

O schema inclui o modelo de dados EasyShop para catálogo, clientes, carrinho, encomendas, pagamentos, entregas, promoções, stock e pós-venda. Os detalhes de compatibilidade, a migration e as regras SQL estão em [db/README.md](db/README.md). A existência dos modelos não implementa automaticamente estes fluxos na API.

## Telas e API disponíveis

- `/`: início.
- `/produtos`: catálogo real lido da API.
- `/produtos/:slug`: detalhes do produto.
- `/carrinho` e `/conta`: telas iniciais que indicam funcionalidades ainda indisponíveis.
- `GET /api/health`: verifica a ligação ao banco.
- `GET /api/produtos`: lista produtos com paginação (12 por omissão, máximo 50), pesquisa por texto, categoria, várias marcas, disponibilidade, promoções e ordenação. A resposta inclui totais e facetas de categoria, marca e stock. `precoMin` e `precoMax` continuam disponíveis para clientes existentes.
- `GET /api/produtos/:slug`: consulta um produto.

Esta reorganização substitui o template Medusa/Next.js. Os fluxos B2B, autenticação, carrinho, checkout, administração e pagamentos do template antigo não foram portados. O histórico Git conserva o código anterior; os documentos antigos estão identificados em `docs/historico/`. O documento de negócio e a licença foram preservados.

## Redis e testes

O serviço Redis, volume e variável REDIS_URL estão comentados no Compose e nos exemplos de ambiente. Não há dependência Redis instalada. Ativar cache numa fase futura exige descomentar a infraestrutura e implementar o cliente e a política de invalidação no backend.

Os conteúdos dos testes antigos foram removidos. A organização está descrita em `tests/README.md`; as pastas ainda vazias são preservadas por `.gitkeep`. Há sete testes automatizados para os dados do seed e a gravação idempotente: `npm run test:seed`. Não há ainda suites de integração com um PostgreSQL real ou testes completos no navegador.

Para validar a configuração e compilar:

```powershell
npm run db:generate
npm run check
npm run build
docker compose config --quiet
```

A CI executa estes passos. `npm run check` lê DATABASE_URL de `backend/.env` através do Prisma; não precisa de um banco ativo para validar o schema. Os containers servem a compilação React por Nginx; no desenvolvimento local o Vite oferece atualização automática.

## Referências

- [Prisma 6 e migrations](https://www.prisma.io/docs/orm/v6/prisma-migrate/getting-started)
- [Vite](https://vite.dev/guide/)
- [Licença MIT](LICENSE)
