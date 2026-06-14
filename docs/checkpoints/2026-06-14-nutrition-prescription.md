# Checkpoint Nutri/Prescrição

Data: 2026-06-14

## Commit

a4cee6e996ad0ca1e52f110ca36ce471894bda12
feat: stabilize nutrition prescription flows

## Resumo

A sprint estabilizou os fluxos de Nutri/Prescrição, incluindo portal Nutri, PrescriptionDrawer, reidratação de prescrições, normalização nutricional, templates, rotas Nutri, worker/helper Nutri, tipos compartilhados e specs de validação.

## Escopo incluído

* Portal e dashboard Nutri.
* Catálogo Nutri.
* Componentes do PrescriptionDrawer.
* Helpers de construção de prescrição.
* Normalização nutricional.
* Lógica de cálculo nutricional.
* Fluxo `nutriprescription`.
* Hooks de prescrição.
* Routers Nutri admin/storefront.
* Procedures de clientes e templates Nutri.
* Worker/helper Nutri.
* Tipos compartilhados de prescrição.
* Regras compartilhadas de nutrição.
* Acompanhamentos padrão Nutri.
* Specs P0/e2e/format/rehydrate/template.

## Arquivos principais incluídos

* `client/src/pages/nutri/**`
* `client/src/pages/nutriprescription/**`
* `client/src/pages/prescription/hooks/usePrescriptionLogic.ts`
* `server/routers/admin/nutri/nutri.ts`
* `server/routers/storefront/nutri/**`
* `server/workers/helpers/buildNutriAiCatalog.ts`
* `server/workers/nutriWorker.ts`
* `shared/domain/nutrition/**`
* `shared/types/prescription.ts`
* `server/nutri-*.spec.ts`

## Validações

* `pnpm check`
* `pnpm build`
* `pnpm test:run server/nutri-client-link-p0.spec.ts server/nutri-client-prescription-price.spec.ts server/nutri-e2e-p0.spec.ts server/nutri-prescription-format.spec.ts server/nutri-prescription-rehydrate.spec.ts server/nutri-template-count.spec.ts server/nutri-portal-p1.spec.ts`
* `pnpm test:run server/security/rbac.spec.ts`
* `pnpm test:run server/guest-checkout.spec.ts`

Resultado: specs Nutri/Prescrição e regressões obrigatórias passando.

## Fora de escopo

* OAuth/Auth.
* Announcements/Marketing.
* BI/Analytics/PDV.
* IA Admin.
* Checkout/Cart/Orders geral.
* ProductDrawer geral.
* Home/UX.
* dist/build artifacts.
* scripts/debug/recovery.
* execução de worker real/fila/Redis real.
* conexão com banco online.

## Observações

* Arquivos de carrinho/preço geral foram preservados fora do commit.
* A sprint incluiu worker/helper Nutri por dependência direta do fluxo de prescrição.
* O fluxo lida com dados sensíveis de paciente; produção depende de `DB_ENCRYPTION_KEY` correta.
* Teste manual em browser ainda é recomendado para portal Nutri, PrescriptionDrawer e fluxo de prescrição do cliente.
