# Banco de dados
PostgreSQL gerido pelo Prisma ORM 6.19.0. O schema é a fonte de verdade; as alterações são aplicadas por migrations versionadas, sem scripts SQL de inicialização paralelos.

- `schema.prisma`: 29 modelos e 13 enums, incluindo os domínios do documento de dados EasyShop.
- `migrations/`: histórico SQL; aplicado pelo serviço migrate antes da API.
- `seed.js` e `seed/`: conjunto de mais de 6 mil registos fictícios, cobrindo todos os 29 modelos. Ver [guia do seed](seed/README.md).
- `package.json`: define ES modules para o seed.

Executar os comandos `npm run db:*` a partir da raiz. A ligação local é lida de `backend/.env`; no Docker é fornecida pelo Compose. Os dados persistem num volume Docker, não nesta pasta.

Para evoluir o schema: editar schema.prisma, executar `npm run db:migrate -- --name nome_da_alteracao` e versionar a migration gerada. As migrations não migram dados nem tabelas do Medusa.

## Modelo de dados EasyShop

O documento fornecido foi convertido em modelos, campos, relações, índices, enums e acções de eliminação. As entidades recomendadas e opcionais também foram incluídas: histórico de estados, movimentos de stock, tokens de recuperação e auditoria.

Os novos modelos têm nomes em português e campos em camelCase no Prisma, mapeados para tabelas e colunas em português, snake_case e singular no PostgreSQL. Usam IDs Int autoincrementais; MovimentoStock e RegistoAuditoria usam BigInt. Valores monetários são Decimal(12, 2), classificações são SMALLINT e as datas novas são TIMESTAMPTZ(6).

### Modelo Produto e renomeação

O modelo Prisma é `Produto` e mapeia para a tabela `produto`. Usa nomes em português: nome, descricao, preco, quantidadeStock, criadoEm e actualizadoEm. O backend e o seed usam `prisma.produto`.

- Os IDs existentes continuam String/cuid e todas as FKs produtoId mantêm o mesmo tipo, conforme a regra de preservar a PK existente.
- slug foi mantido para os links e a consulta por URL; codigoMoeda conserva a moeda existente (MZN por defeito).
- nome é VARCHAR(200); descricao é TEXT; as datas passam para TIMESTAMPTZ(6).
- codigo e categoriaId continuam opcionais durante o preenchimento dos registos existentes. Torná-los obrigatórios requer uma migration posterior.
- A migration `20261011000200_renomear_produto` renomeia a tabela products e as colunas antigas, sem apagar/recriar os registos. PostgreSQL actualiza as referências das FKs.
- As datas antigas são interpretadas como UTC. Antes de aplicar num banco com dados, verificar esta convenção e confirmar que nenhum nome excede 200 caracteres; a conversão rejeita nomes maiores.
- As migrations anteriores são mantidas como histórico e continuam a usar os nomes que existiam na altura.

### API de produtos

`GET /api/produtos` devolve `{ produtos: [...] }`; `GET /api/produtos/:slug` devolve `{ produto: {...} }`. Os campos usam os nomes do novo modelo, incluindo categoria e imagens (principal primeiro, depois ordem e ID). O preço Decimal é serializado como string. Produtos inactivos não aparecem no catálogo e a consulta de um produto inexistente ou inactivo responde 404. Produtos sem stock continuam visíveis para consulta.

As rotas `/api/products` e `/api/products/:slug` também existem como aliases, com o mesmo formato de resposta em português.

### Migration pronta, ainda não aplicada

`migrations/20261011000100_modelo_easyshop/migration.sql` acrescenta os novos campos, tabelas, enums e relações sem DROP de tabelas ou colunas. Inclui uma transacção para aplicar tudo ou reverter em caso de erro.

Inclui também as regras que Prisma 6 não representa no schema:

- CHECKs de preços, stock, quantidades, descontos, totais, avaliações, datas de confirmação/entrega, motivo de rejeição e configuração única.
- CHECKs de sinal e origem dos movimentos de stock.
- Um único pagamento CONFIRMADO ou REEMBOLSADO por encomenda.
- Uma imagem principal por produto e um endereço predefinido por utilizador.
- Unicidade do email por `lower(email)`, além da unicidade simples usada pelo cliente Prisma.

Não usar `prisma db push` para instalar este modelo: os CHECKs e índices SQL personalizados só são instalados pelas migrations. Preservar estes trechos ao rever futuras migrations.

Antes de aplicar num banco existente que ainda usa a tabela antiga `products`, confirmar que não há produtos com preço <= 0, stock negativo ou nomes com mais de 200 caracteres. As migrations rejeitam esses dados em vez de os alterar automaticamente:

```sql
SELECT id, name, price, stock
FROM products
WHERE price <= 0 OR stock < 0 OR length(name) > 200;
```

Com DATABASE_URL configurada em `backend/.env`, executar na raiz quando quiser aplicar:

```powershell
npm run db:deploy
npm run db:generate
```

### Validações que continuam no backend

Adicionar o schema não implementa os fluxos de negócio. Checkout, stock, pagamentos, devoluções e permissões ainda precisam das transacções descritas no documento. Em particular:

- Recalcular preços, descontos e frete; exigir pelo menos um item; verificar stock e tarifa activa.
- Usar actualizações condicionais para descontar/repor stock e reservar/libertar quantidades devolvidas.
- Validar transições de estado, pagamentos pelo total correcto e reembolsos elegíveis.
- Garantir que o item devolvido pertence à encomenda indicada e que a origem do movimento corresponde ao produto.
- Exigir motivo de AJUSTE e de devolução OUTRO; associar promoções a categoria ou produtos.
- Autorizar avaliações apenas após entrega e reposições apenas após verificação REVENDAVEL.
- Impedir alterações dos valores históricos e gerir versões dos Termos e políticas.
- Guardar apenas hashes de palavras-passe e tokens; normalizar emails e controlar acesso por perfil.

Mantiveram-se as escolhas provisórias do documento: escala de avaliações de 1 a 5, versaoTermos opcional e Reembolso.devolucaoId opcional. Não se decidiram os pontos de negócio ainda em aberto.

Ao devolver campos BigInt numa API JSON, convertê-los explicitamente para string; JSON.stringify não serializa BigInt directamente. Para dinheiro, usar Decimal e evitar cálculos com números de ponto flutuante.
