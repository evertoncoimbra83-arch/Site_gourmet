# Checkpoint Migrations DDL — Obsolete Triage

Data: 2026-06-15

## Resumo

A sprint auditou as migrations DDL residuais não rastreadas:

* `server/scripts/run_migration_0009.ts`
* `server/scripts/run_migration_0010_add_icon_emoji.ts`

A conclusão foi que ambas estavam obsoletas e foram substituídas pela migration oficial já commitada:

* `server/scripts/run_migration_0012_announcements_targets_visibility.ts`

## Decisão

As migrations antigas foram descartadas localmente porque eram arquivos untracked, redundantes e órfãos.

Nenhuma migration foi executada.
Nenhum script de banco foi executado.
Nenhuma conexão online foi feita.
Nada foi staged antes da decisão.

## Evidências

* A migration `run_migration_0012_announcements_targets_visibility.ts` cobre a tabela `announcements`.
* A migration oficial cobre `icon_emoji`.
* O schema Drizzle ativo já mapeia `announcements` e `icon_emoji`.
* A documentação da sprint Announcements/Marketing já registra a migration oficial.
* Não há referências ativas a `run_migration_0009` ou `run_migration_0010`.

## Arquivos descartados localmente

* `server/scripts/run_migration_0009.ts`
* `server/scripts/run_migration_0010_add_icon_emoji.ts`

## Fora de escopo

* Executar migrations.
* Criar migration nova.
* Alterar schema.
* Alterar banco.
* BI hardening.
* Scripts destrutivos.
* Admin residual.

## Backlog futuro

Restam para sprints futuras:

* `server/scripts/rebuild_bi_facts.ts`
* `server/scripts/sync_pdv_comandas_bi.ts`
* `client/src/pages/AdminPdvDisabled.tsx`
* `client/src/pages/AdminWorkers.tsx`
