# Prova de conceito B2C no starter B2B (decisão D9)

**Data:** 2 de Outubro de 2026 · **Fase:** 2 · **Ambiente:** backend Medusa 2.21.2 com seed original do starter, PostgreSQL 16, Node 22.22.

## Pergunta
Um cliente sem empresa consegue comprar no starter B2B sem passar por fluxos empresariais?

## Método
Chamadas directas à API da loja (`/store/*`) com a chave publicável, sem usar o storefront, em dois cenários: (1) convidado, só com email; (2) cliente registado por email e palavra-passe, sem empresa.
Passos: criar carrinho → adicionar 2 unidades de um produto → morada e email → opções de entrega → método de entrega → colecção e sessão de pagamento (`pp_system_default`) → concluir carrinho → consultar histórico.

## Resultado
| Passo | Convidado | Cliente sem empresa |
|---|---|---|
| Criar carrinho | 200 | 200 |
| Adicionar item | 200 | 200 |
| Morada e email | 200 | 200 |
| Opções de entrega (2 encontradas) | 200 | 200 |
| Método de entrega | 200 | 200 |
| Sessão de pagamento | 200 | 200 |
| Concluir carrinho | encomenda criada | encomenda criada |
| Histórico de encomendas | n/a | 1 encomenda listada |

## Conclusão
Os hooks do starter (limites de gasto e aprovações) **não bloquearam** a compra de clientes sem empresa, nos dois cenários testados.

## Limites desta prova
- Só foi testada a API, não a interface do storefront.
- Não foram testadas variantes sem stock, promoções nem clientes com empresa.
- Sem empresa, o checkout do storefront pode ainda mostrar elementos B2B; a verificação visual fica para a Fase 8.
- Pagamento por `pp_system_default` (manual), não por fornecedor real.
