# Checkpoint Scripts / Migrations / BI / Redis — Specs Seguras

Data: 2026-06-15

## Commit

4c10940d15512792ae3bff150262ee76b01731c6
test: add safe bi pdv and production specs

## Resumo

A sprint realizou triagem cautelosa dos arquivos residuais relacionados a scripts, migrations, BI, PDV e Redis. A decisão segura foi commitar somente specs in-memory/mockadas, remover localmente arquivos temporários/debug e deixar scripts read-only, migrations reais e scripts destrutivos de BI para sprints futuras separadas.

## Arquivos incluídos no commit

* `server/p1b-production.spec.ts`
* `server/routers/admin/bi_recovery.spec.ts`
* `server/routers/admin/formatters.spec.ts`
* `server/routers/admin/pdv-bi-close.spec.ts`

## Arquivos removidos localmente

* `server/db/schema/bi.ts`
* `server/scripts/test_bi_details.ts`
* `server/scripts/test_redis_connect.ts`
* `server/scripts/test_redis_env.ts`

Esses arquivos eram temporários/debug ou vazios e não entraram no repositório.

## Arquivos mantidos fora do commit para sprints futuras

Scripts read-only:

* `scripts/audit_birthdays.ts`
* `scripts/check-prescriptions.ts`
* `scripts/openui-project-report.ts`

Migrations reais:

* `server/scripts/run_migration_0009.ts`
* `server/scripts/run_migration_0010_add_icon_emoji.ts`

Scripts BI destrutivos ou de sync:

* `server/scripts/rebuild_bi_facts.ts`
* `server/scripts/sync_pdv_comandas_bi.ts`

Fora de escopo desta etapa:

* `client/src/pages/AdminPdvDisabled.tsx`
* `client/src/pages/AdminWorkers.tsx`

## Validações

* `pnpm check`
* `pnpm test:run server/routers/admin/formatters.spec.ts`
* `pnpm test:run server/routers/admin/bi_recovery.spec.ts`
* `pnpm test:run server/routers/admin/pdv-bi-close.spec.ts`
* `pnpm test:run server/p1b-production.spec.ts`
* `git diff --cached --check`
* Busca por padrões sensíveis e proibidos no staged diff

Resultado:

* Typecheck passando.
* 19/19 testes passando.
* Staged diff limpo.
* Nenhuma credencial real encontrada.
* Nenhum script destrutivo staged.
* Nenhuma migration staged.

## Segurança e isolamento

* Nenhuma migration foi executada.
* Nenhum script de banco foi executado.
* Nenhuma conexão online foi feita.
* Nenhum script Redis debug foi commitado.
* Nenhum script BI destrutivo foi commitado.
* Nenhum script read-only foi commitado nesta etapa.
* `pnpm-lock.yaml` não foi alterado.
* `dist/` permaneceu limpo.
* O commit contém apenas specs seguras.

## Fora de escopo

* Aplicação de migrations.
* Hardening de migrations DDL.
* Execução de rebuild BI.
* Execução de sync BI.
* Scripts Redis.
* Scripts read-only.
* AdminPdvDisabled.
* AdminWorkers.
* Alterações funcionais de BI/PDV.
* Alterações de banco real.
* Qualquer uso de banco online.

## Backlog futuro recomendado

1. Sprint Scripts Read-only:

   * Auditar e decidir sobre `audit_birthdays.ts`, `check-prescriptions.ts`, `openui-project-report.ts`.

2. Sprint Migrations DDL:

   * Revisar `run_migration_0009.ts`.
   * Revisar `run_migration_0010_add_icon_emoji.ts`.
   * Confirmar se já foram substituídas por migrations posteriores.
   * Definir política de aplicação segura.

3. Sprint BI Hardening:

   * Revisar `rebuild_bi_facts.ts`.
   * Revisar `sync_pdv_comandas_bi.ts`.
   * Adicionar dry-run obrigatório.
   * Adicionar proteção contra produção.
   * Adicionar confirmação explícita.
   * Adicionar logs seguros e rollback/backup strategy.

4. Sprint Admin residual:

   * `AdminPdvDisabled.tsx`
   * `AdminWorkers.tsx`
