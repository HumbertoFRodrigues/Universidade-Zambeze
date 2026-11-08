# Seed completo EasyShop

Conjunto de **6 029 registos fictícios**, distribuídos pelos **29 modelos**. Facilita testes do catálogo e dos futuros módulos de negócio. Os cenários são simulados: não há chamadas a fornecedores de pagamento, envio de mensagens, downloads de imagens ou dados pessoais reais.

## Executar sem Docker

Com Node, dependências instaladas, PostgreSQL iniciado e DATABASE_URL em `backend/.env`, executar na raiz:

```powershell
npm run db:deploy
npm run db:generate
npm run db:seed
```

As migrations devem estar aplicadas, incluindo a renomeação para Produto. Com Docker, o comando equivalente é `docker compose exec backend npm run db:seed -w backend`.

Para ver apenas o inventário, sem precisar de PostgreSQL:

```powershell
npm run db:seed:preview
```

## Inventário

| Modelo | Quantidade |
| --- | ---: |
| Categoria | 17 |
| Produto | 240 |
| ImagemProduto | 720 |
| Utilizador | 124 (120 clientes e 4 administradores) |
| Endereco | 240 |
| TokenRecuperacao | 36 |
| Carrinho | 80 (60 de clientes e 20 de convidados) |
| ItemCarrinho | 180 |
| Encomenda | 240 |
| ItemEncomenda | 840 |
| HistoricoEstadoEncomenda | 510 |
| FormaPagamento | 6 |
| Pagamento | 270 |
| ZonaEntrega | 10 |
| ModalidadeEntrega | 4 |
| TarifaFrete | 40 |
| Entrega | 240 |
| Promocao | 24 |
| PromocaoProduto | 72 |
| MovimentoStock | 1 244 |
| AvaliacaoProduto | 300 |
| AvaliacaoEncomenda | 90 |
| PedidoAssistencia | 48 |
| Devolucao | 60 |
| ItemDevolucao | 68 |
| Reembolso | 20 |
| ConfiguracaoLoja | 1 |
| PoliticaLoja | 5 |
| RegistoAuditoria | 300 |

O catálogo tem 12 subcategorias, marcas, cores, especificações JSON, preços variados em MZN, stock normal/baixo/zero e produtos desactivados. Cada produto tem três URLs de imagens Unsplash, sendo uma principal. As fotografias são ilustrativas e podem repetir-se entre variantes; não representam necessariamente o modelo/marca exactos. A disponibilidade das imagens depende do serviço externo.

## Contas de demonstração

- Administradores: `admin1@easyshop.test` até `admin4@easyshop.test`.
- Clientes: `cliente001@easyshop.test` até `cliente120@easyshop.test`.
- Palavra-passe comum de teste: `EasyShopTeste!2026`.
- Cada conta tem um hash scrypt próprio, no formato `scrypt$16384$8$1$sal_hex$hash_hex`. Não são guardadas palavras-passe em texto simples.
- Cada cliente tem dois endereços, apenas um predefinido. Sete clientes estão desactivados (números múltiplos de 17).
- Existem tokens válidos, expirados e usados, guardados apenas como SHA-256. Para reconstruir o token bruto de uma fixture: `easyshop-demo-token-N-C`, onde N vai de 1 a 12 e C de 1 a 3 (válido, expirado, usado).

O login administrativo usa estas contas depois de aplicar as migrations e executar o seed. A autenticação verifica o hash scrypt e cria uma sessão persistente; sem uma base de dados inicializada, as credenciais não estarão disponíveis.

## Cenários úteis

- `SEED-ES-0001`: produto activo sem stock; `SEED-ES-0002`: stock baixo; `SEED-ES-0020`: produto inactivo.
- `SEED-ENC-0001`: encomenda de convidado, registada, pagamento pendente.
- `SEED-ENC-0002`: registada com pagamento falhado.
- `SEED-ENC-0003`: em processamento, pagamento confirmado e entrega em transporte.
- `SEED-ENC-0004`: entrega não conseguida.
- `SEED-ENC-0005`: concluída e entregue, com avaliações.
- `SEED-ENC-0006`: tentativa de pagamento falhada seguida de confirmação.
- `SEED-ENC-0007`: cancelada com reposição de stock.
- `SEED-DEV-0001` a `SEED-DEV-0006`: solicitada, em análise, aprovada, rejeitada, produto recebido e reembolsada, respectivamente.
- Há devoluções parciais e de todos os itens; itens revendáveis e não revendáveis; reembolsos pendentes, falhados e concluídos. O reembolso dos itens não inclui o frete.
- Promoções activas, expiradas, futuras e desactivadas, por categoria ou produtos, com desconto fixo ou percentual.
- Métodos de pagamento activos/desactivados, frete grátis no levantamento e tarifas indisponíveis em algumas zonas.
- Todos os estados de encomenda, pagamento, entrega, devolução, reembolso e assistência estão representados.

Os totais das encomendas são calculados em centavos inteiros e gravados como strings decimais. Cada venda, cancelamento e reposição está ligada ao item original. O livro de stock reconcilia o saldo final de cada produto. As avaliações pertencem exclusivamente a encomendas entregues.

## Repetição e preservação

Uma transacção Prisma grava todos os modelos, em lotes de 250 linhas. Um bloqueio transaccional PostgreSQL impede dois seeds simultâneos. Usam-se IDs estáveis e `createMany({ skipDuplicates: true })`: repetir não duplica dados nem repõe o stock/preços/estados que já tenham sido alterados em testes.

- Produtos usam IDs `seed-easyshop-produto-NNN`, slugs `seed-*` e códigos `SEED-ES-*`.
- As fixtures de modelos Int/BigInt usam IDs negativos a partir de -10000. Assim, não alteram as sequências autoincrementais positivas usadas pela aplicação. São IDs válidos neste schema, sem restrição de positividade.
- A configuração da loja mantém o ID obrigatório 1. As relações por PK composta usam as mesmas chaves a cada execução.
- Não se apagam registos, não se reiniciam sequências e não se sobrescrevem dados existentes.
- Se um nome/email/código já existir com outro ID, o seed falha e reverte a transacção, em vez de associar silenciosamente os dados a outro registo.
- Depois de alterações manuais aos dados, as contagens e os cenários podem diferir do conjunto inicial. Os dois produtos do antigo seed, caso já tenham sido inseridos, são preservados.

As datas são relativas à meia-noite UTC do dia da primeira geração. Para reproduzir a mesma cronologia ou alterar a palavra-passe antes da primeira execução:

```powershell
$env:SEED_REFERENCE_DATE = '2026-10-11T00:00:00Z'
$env:SEED_PASSWORD = 'OutraSenhaTeste!2026'
npm run db:seed
```

Também é possível definir estas variáveis em `backend/.env`. Repetir o seed não actualiza as datas nem os hashes já gravados. A palavra-passe escolhida precisa de pelo menos 12 caracteres.

## Verificação

```powershell
npm run test:seed
npm run check:seed
```

Os sete testes verificam todos os modelos e enums, FKs, unicidade, totais, descontos, stock, devoluções, avaliações, hashes scrypt e repetição com cliente Prisma simulado. Não substituem a execução de integração sobre PostgreSQL real.

`dados.js` gera as fixtures; `gravar.js` controla a ordem de inserção e a transacção; `../seed.js` carrega o ambiente e disponibiliza a execução normal ou a pré-visualização.
