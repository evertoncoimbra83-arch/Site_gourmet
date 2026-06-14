# Checkpoint BI/Analytics/PDV

Data: 2026-06-14

## Commit

e24bbbe42cd7285885c9e6e29ba42be6632f4cb7
feat: stabilize bi analytics and pdv reporting

## Resumo

A sprint estabilizou a frente de BI, Analytics administrativo e relatórios/sincronização do PDV, separando a lógica analítica em routers, worker, queue, schema, migration e abas visuais do painel administrativo.

## Escopo incluído

* Painel AdminAnalytics revisado.
* Abas de Analytics: Overview, Products, Finance, VIP, Campaigns e Birthdays.
* Hook unificado de período.
* Formatadores de métricas.
* Router admin de analytics.
* Routers admin de VIP, campanhas e aniversários.
* Serviço de sincronização PDV → BI.
* Worker e queue de BI.
* Integração do fechamento de comandas PDV com sincronização BI.
* Schema `analytics.ts`.
* Migration DDL `0013` para colunas/índices analíticos.
* Specs de analytics, BI worker, PDV sync, VIP, campaigns, birthdays, RBAC e guest checkout.

## Migration

Arquivo:

`server/scripts/run_migration_0013_bi_analytics_indexes.ts`

A migration cobre:

* `bi_sales_facts.is_customized`.
* `bi_sales_facts.is_from_kit`.
* `bi_sales_facts.macro_deviation_kcal`.
* índice em `bi_sales_facts.order_id`.
* índice em `bi_sales_facts.date_id`.
* índice em `bi_sales_facts.dish_id`.
* índice em `bi_financial_facts.order_id`.
* índice em `bi_financial_facts.date_id`.

A migration é idempotente e usa `information_schema` para evitar duplicação de colunas e índices.

## Validações

* `pnpm check`
* `pnpm build`
* `pnpm test:run server/routers/admin/analytics.spec.ts server/pdv-bi-sync.spec.ts server/security/rbac.spec.ts server/guest-checkout.spec.ts server/routers/admin/vip.spec.ts server/routers/admin/campaigns.spec.ts server/routers/admin/birthdays.spec.ts server/workers/biWorker.spec.ts server/routers/admin/bi_recovery.spec.ts server/routers/admin/pdv-bi-close.spec.ts`

Resultado: 10 arquivos de teste, 58 testes passando.

## Fora de escopo

* OAuth/Auth.
* Announcements/Marketing.
* Nutri/ProductDrawer/CheckoutSummary.
* IA de Conteúdo.
* dist/build artifacts.
* scripts temporários/debug/recovery.
* execução de migration contra banco físico.

## Observações

* `dist/` foi limpo após o build e não deve ser commitado.
* A migration `0013` ainda precisa ser aplicada em homologação/produção no momento correto.
* Redis/queue indisponível não deve bloquear fechamento de comanda; deve permanecer protegido por tratamento de erro.
* Teste manual em browser ainda é recomendado para AdminAnalytics e PDV.
