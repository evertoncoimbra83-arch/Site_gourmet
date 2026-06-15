# Checkpoint BI Hardening

Data: 2026-06-15

## Commit

ec7b1cd803b4e836ef389e2997ce8fbac729b8f7
chore: harden bi maintenance scripts

## Resumo

A sprint hardenizou os scripts de manutenção de BI:

* `server/scripts/rebuild_bi_facts.ts`
* `server/scripts/sync_pdv_comandas_bi.ts`

## Garantias

* `--dry-run` é o padrão.
* `--execute` exige confirmação textual específica.
* Nenhum `--execute` foi rodado durante a validação.
* Nenhum script escreveu no banco.
* Nenhuma migration foi executada.
* `dist/` e `pnpm-lock.yaml` ficaram fora.
* `AdminPdvDisabled.tsx` e `AdminWorkers.tsx` ficaram fora.

## Validações

* `pnpm check`
* `pnpm test:run server/routers/admin/bi_recovery.spec.ts server/routers/admin/pdv-bi-close.spec.ts server/p1b-production.spec.ts`

## Backlog restante

* `client/src/pages/AdminPdvDisabled.tsx`
* `client/src/pages/AdminWorkers.tsx`
