# Checkpoint IA de Conteúdo Admin

Data: 2026-06-14

## Commit

4869a7d6e367f76362fd2ae9155c5e3804b65226
feat: stabilize admin ai content module

## Resumo

A sprint estabilizou o módulo de IA de Conteúdo Admin, incluindo dashboard administrativo, lógica de confirmação visual, roteador de IA, builder de catálogo e rastreabilidade de requisições via `requestId`.

## Escopo incluído

* Ajustes em `AppInteligence.tsx`.
* Estabilização do dashboard `AiDashboardView`.
* Ajustes em `useAiDashboardLogic`.
* Substituição de confirmação nativa por `ConfirmDialog`.
* Ajustes no router de IA.
* Ajustes no `catalogBuilder`.
* Propagação de `requestId` para a fila `nutriQueue`.
* Preservação do escopo clínico fora do commit.

## Arquivos incluídos no commit

* `client/src/app/logic/AppInteligence.tsx`
* `client/src/pages/aiDashboard/logic/useAiDashboardLogic.ts`
* `client/src/pages/aiDashboard/view/AiDashboardView.tsx`
* `server/queues/nutriQueue.ts`
* `server/routers/storefront/ai/aiRouter.ts`
* `server/routers/storefront/ai/catalogBuilder.ts`

## Validações

* `pnpm check`
* `pnpm build`
* `pnpm test:run server/security/rbac.spec.ts server/guest-checkout.spec.ts server/nutri-portal-p1.spec.ts`

Resultado: regressões obrigatórias passando.

## Fora de escopo

* OAuth/Auth.
* Announcements/Marketing.
* BI/Analytics/PDV.
* Checkout/Cart/Orders.
* ProductDrawer/CheckoutSummary.
* Nutri clínica.
* `nutriWorker.ts`.
* `buildNutriAiCatalog.ts`.
* Workers globais.
* Integrações reais com provedor externo de IA.
* Execução de fila/Redis real.
* dist/build artifacts.

## Observações

* `server/queues/nutriQueue.ts` entrou apenas como dependência direta de compilação para aceitar `requestId`.
* `nutriWorker.ts` e `buildNutriAiCatalog.ts` permaneceram fora por pertencerem à frente Nutri/Prescrição.
* Não houve chamada real a provedor externo de IA.
* Teste manual em browser ainda é recomendado para o dashboard de IA.
