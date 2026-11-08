# Registo de alterações ao starter

Referência de comparação: tag Git `baseline-starter` (conteúdo original de `b2b-starter-main.zip`).
Ver diferenças: `git diff baseline-starter -- .`

## Fase 2: Configuração do template

### Acrescentado
| Ficheiro | Motivo |
|---|---|
| `.nvmrc` | Fixa Node 22; o `package.json` exige >= 22.15 |
| `.editorconfig` | Formatação uniforme entre editores |
| `docker-compose.yml` | PostgreSQL 15 para desenvolvimento local |
| `.env.example` | Visão global das variáveis, sem valores reais |
| `.github/workflows/ci.yml` | Tipos e lint do storefront; compilação do backend |
| `docs/prova-de-conceito-b2c.md` | Resultado da decisão D9 |

### Alterado
| Ficheiro | Alteração |
|---|---|
| `README.md` | Versões de Node e pnpm; caminho `apps/backend/.env` (o original dizia `apps/backend.env`); referência ao Docker |
| `apps/backend/.env.template` | CORS sem `docs.medusajs.com`; `REDIS_URL` comentado (opcional); `DB_NAME=medusa_loja` |
| `apps/storefront/.env.template` | `REVALIDATE_SECRET` vazio (era `supersecret`); região por defeito `de` até à Fase 3 |
| `apps/storefront/next.config.js` | Removido `typescript.ignoreBuildErrors: true` |
| `apps/storefront/src/app/layout.tsx` | `lang="pt"`; removido `<Analytics />` |
| `apps/storefront/src/lib/data/{cart,companies,customer,quotes,cart-event-bus}.ts` | Removidas chamadas `track()` do Vercel Analytics (sem outra alteração de comportamento) |
| `apps/storefront/src/modules/layout/templates/footer/index.tsx` | Removido o bloco “Powered by” |
| `apps/storefront/src/app/[countryCode]/(checkout)/layout.tsx` | Removido o bloco “Powered by” |
| `apps/storefront/src/modules/account/components/profile-card/index.tsx` | Valores nulos tratados com `?? ""` (erro de tipos que o `ignoreBuildErrors` escondia) |
| `apps/storefront/src/modules/cart/components/cart-drawer/index.tsx` | Tipo do temporizador `ReturnType<typeof setTimeout>` (erro de tipos) |
| `apps/storefront/package.json`, `pnpm-lock.yaml` | Dependência `@vercel/analytics` removida |
| `.prettierrc` | Movido de `apps/storefront/` para a raiz (mesmo conteúdo) |

### Removido
| Ficheiro | Motivo |
|---|---|
| `.github/workflows/update.yaml` | Acção de actualização do Medusa com chaves externas; desnecessária |
| `apps/storefront/src/modules/layout/components/medusa-cta/` | Publicidade do Medusa |

### Decisões não executadas
- **ESLint:** mantidas as duas configurações (`medusa lint` no backend; `next lint` no storefront). Cada uma pertence à ferramenta da respectiva aplicação; unificar exigiria migrar o storefront para a configuração “flat”, sem benefício para o âmbito. A mensagem de descontinuação do `next lint` fica como ponto para a Fase 17.
- **Redis:** não incluído no `docker-compose.yml`. Sem `REDIS_URL`, o Medusa usa uma instância simulada em desenvolvimento (observado no arranque). Rever na Fase 16.
- **SDKs de pagamento (Stripe, PayPal):** mantidos até à Fase 7.

### Verificações feitas
| Verificação | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | OK (antes das alterações ao lockfile) |
| `pnpm medusa db:migrate` + seed original | OK |
| Arranque do backend e `/health` | 200 |
| `tsc --noEmit` no storefront | 0 erros |
| `pnpm lint` no storefront | 0 erros, 2 avisos já existentes |
| `pnpm build` no backend | OK, 0 erros, 12 avisos de lint já existentes |
| `next build` no storefront | Compilação e verificação de tipos OK; a geração estática exige o backend em execução (ver nota) |
| Storefront em desenvolvimento: `/de`, `/de/store`, `/de/cart` | 200 |
| Prova de conceito B2C | Ver `docs/prova-de-conceito-b2c.md` |

**Nota sobre o build do storefront:** `generateStaticParams` consulta o backend; sem ele, `next build` falha em “Collecting page data”. Em CI, o passo de build do storefront só deve existir com backend e base de dados disponíveis (por isso o `ci.yml` actual não o inclui).

### Não verificado
- `/de/account` e uma categoria inexistente em desenvolvimento (tempo de compilação acima do limite do ambiente de teste).
- Instalação do zero noutra máquina; execução do CI no GitHub; `docker compose up`.
