# AT43 — Verificação de requisitos de segurança

Responsável: Humberto Rodrigues · Auxiliar: Anibal · Data: 17/10/2026 · revisto 27/10/2026
Âmbito: backend Express (`backend/src`), frontend React, Docker Compose e repositório.

Legenda: ✅ cumprido e testado · ⚠️ parcial / com ressalva · ❌ em falta

## 1. Autenticação e sessões

| # | Requisito | Resultado | Evidência |
|---|---|---|---|
| 1.1 | Palavras-passe guardadas com hash forte | ✅ | scrypt (N=16384) no registo e no seed; bcrypt na reposição (`auth.controller.js`) |
| 1.2 | Sessão por token aleatório, guardado só como hash | ✅ | `sessao_autenticacao.hash_token` (SHA-256); `auth.middleware.js` |
| 1.3 | Sessões expiram e podem ser revogadas | ✅ | `expiraEm`, `revogadoEm`; logout revoga; mudar a palavra-passe revoga as outras sessões |
| 1.4 | Limite de tentativas de login (AT40) | ✅ | 5 falhas em 15 min por IP+e-mail → 429 com `Retry-After`; testado (6.º pedido = 429) |
| 1.5 | Limite na recuperação de palavra-passe | ✅ | 5 pedidos/hora por IP |
| 1.6 | Resposta de recuperação não revela se o e-mail existe | ✅ | Mensagem genérica em `/auth/esquecer-palavra-passe` |
| 1.7 | Token guardado no navegador | ⚠️ | `localStorage` (vulnerável a XSS). Mitigado pela CSP do helmet e por não haver HTML injectado. Melhoria futura: cookie `HttpOnly` |

## 2. Autorização (controlo de acesso no servidor)

| # | Requisito | Resultado | Evidência |
|---|---|---|---|
| 2.1 | Rotas de administração só para ADMINISTRADOR | ✅ | `verificarAdmin`; testado: sem sessão 401, cliente 403 |
| 2.2 | Carrinho só acessível ao dono | ✅ | `carrinho.middleware.js`; `utilizadorId` de outra pessoa → 401/403; item de outro carrinho → 404 |
| 2.3 | Checkout usa o carrinho da sessão | ✅ | `exigirDonoCarrinho` em `/checkout/*` |
| 2.4 | Área do cliente devolve só dados próprios | ✅ | `/api/conta/*` filtra sempre por `request.utilizador.id` |
| 2.8 | Consulta de encomenda/pagamento de convidado | ✅ | Exige código + e-mail da compra; erro igual para ambos os casos (não revela encomendas) |

## 3. Validação de entradas e integridade

| # | Requisito | Resultado | Evidência |
|---|---|---|---|
| 3.1 | Preços e totais calculados no servidor | ✅ | `/checkout/calcular-frete` e `confirmar`; o frontend nunca envia preços |
| 3.2 | Encomenda idempotente | ✅ | Cabeçalho `x-idempotency-key`; repetir devolve a mesma encomenda (200) |
| 3.3 | Pagamento: valor = total, confirmação única | ✅ | `pagamento.service.js` bloqueia a encomenda (`FOR UPDATE`); segunda tentativa → 409 |
| 3.5 | Restrições na base de dados | ✅ | CHECKs em stock, quantidades devolvidas, preços e valores de pagamento |
| 3.6 | Upload de imagens seguro (AT41) | ✅ | Só JPG/PNG/WebP validados pelos *magic bytes*, até 3 MB, nome aleatório, sem *path traversal*; ficheiro falso → 415 |
| 3.7 | URLs de imagens aceites | ✅ | Só `https://`, `/imagens/` ou `/api/uploads/` |
| 3.8 | Limite de tamanho dos pedidos | ✅ | JSON 100 kB; uploads 3 MB |
| 3.9 | Injecção SQL | ✅ | Prisma parametrizado; `$queryRaw` só com *template tags* (parâmetros ligados) |
| 3.10 | Mensagens de erro sem detalhes internos | ✅ | Testado: JSON inválido, rota inexistente, ids e paginação inválidos, campos em falta → mensagens em português; erros Prisma/SQL → 500 genérico, detalhe só no log |
| 3.11 | M-Pesa não pode ser confirmado por simulação | ✅ | Com chaves configuradas, `/pagamentos/simular` recusa o M-Pesa; só a API real confirma |

## 4. Cabeçalhos, transporte e rede

| # | Requisito | Resultado | Evidência |
|---|---|---|---|
| 4.1 | Cabeçalhos de segurança | ✅ | `helmet` (CSP, HSTS, X-Content-Type-Options, frame-ancestors, CORP) |
| 4.2 | `X-Powered-By` desactivado | ✅ | `app.disable('x-powered-by')` |
| 4.3 | CORS restrito à origem da loja | ✅ | `CORS_ORIGIN` |
| 4.4 | IP real atrás do proxy, sem permitir falsificação | ✅ | `trust proxy` só para redes privadas (Nginx no Docker) |
| 4.5 | Portas expostas só em localhost | ✅ | Compose publica em `127.0.0.1` |
| 4.6 | HTTPS (AT41) | ✅ | Publicado em https://shop.portaldomundo.com com Let's Encrypt (Nginx); helmet envia HSTS |
| 4.7 | Limite de pedidos de pagamento | ✅ | 20 pedidos / 10 min por IP em `/pagamentos/simular` e `/pagamentos/mpesa` (evita enviar notificações M-Pesa em massa) |

## 5. Segredos e dados pessoais

| # | Requisito | Resultado | Evidência |
|---|---|---|---|
| 5.1 | Sem credenciais versionadas (AT39) | ⚠️ | `.env.example` limpos (removido token Mailtrap de `frontend/.env.example` em 27/10). **Os tokens antigos continuam no histórico do git: o dono da conta deve revogá-los** |
| 5.2 | `.env` reais ignorados pelo git | ✅ | `.gitignore` |
| 5.3 | Chaves M-Pesa só no servidor | ✅ | `MPESA_API_KEY`/`MPESA_PUBLIC_KEY` em `backend/.env`; o frontend nunca as vê |
| 5.4 | Dados de cartão não guardados | ✅ | Pagamento com cartão é simulado; os campos do cartão não são enviados ao servidor |
| 5.5 | Exposição mínima de dados | ✅ | Stock exacto não exposto ao público; nomes de licitantes anonimizados ("Ana M.") |
| 5.6 | Registo de acções administrativas | ✅ | `registo_auditoria` em categorias, produtos, preços, stock, pagamentos, formas de pagamento, políticas |
| 5.7 | Aceitação de termos e privacidade registada | ✅ | `privacidadeAceiteEm` no registo; `termosAceitesEm` na encomenda |

## Resumo

- Cumpridos: 34 · Parciais: 2 (1.7 token em `localStorage`, 5.1 revogar credenciais antigas) · Em falta: 0.
- Acção pendente fora do código: **revogar as credenciais Mailtrap expostas no histórico**.
