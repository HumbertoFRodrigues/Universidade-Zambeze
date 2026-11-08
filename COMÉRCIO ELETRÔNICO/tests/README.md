# Organização dos testes
Os testes do antigo template Medusa foram removidos conforme solicitado. A suite `backend/tests/unit/seed.test.js` verifica os dados e a repetição do novo seed: executar `npm run test:seed` na raiz. São sete testes, sem ligação ao banco, incluindo correspondência ao schema Prisma, FKs, unicidade, totais, stock, pós-venda, hashes e gravação idempotente com cliente simulado.

- backend/tests/unit: unidades do backend.
- backend/tests/integration: integração da API e banco.
- frontend/tests/unit: componentes e funções.
- frontend/tests/integration: integração de telas e API.
- tests/e2e: fluxos completos no navegador.

Os ficheiros .gitkeep preservam as pastas vazias no Git. A CI executa análise estática, validação Prisma, testes do seed e compilação. Não há ainda testes de integração com PostgreSQL real ou testes E2E.
