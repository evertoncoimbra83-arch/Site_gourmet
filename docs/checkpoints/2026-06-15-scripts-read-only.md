# Checkpoint Scripts Read-only

Data: 2026-06-15

## Commit

7f5431bd68da1999a3296f9219dfdebbb5139aab
chore: add safe read-only maintenance scripts

## Resumo

A sprint adicionou scripts de manutenção e auditoria classificados como read-only ou relatório local, com hardening para reduzir risco de uso indevido contra ambientes online/produção e para evitar exposição desnecessária de dados sensíveis.

## Arquivos incluídos

* `scripts/audit_birthdays.ts`
* `scripts/check-prescriptions.ts`
* `scripts/openui-project-report.ts`

## Classificação

### `scripts/audit_birthdays.ts`

Classificação: Read-only com cautela.

Finalidade:

* Auditar informações agregadas relacionadas a aniversários e LTV.
* Uso local/controlado.

Hardening aplicado:

* Guard contra URLs remotas/produção.
* Redução de seleção de dados sensíveis.
* Saída voltada a contagens/resumos.
* Aviso explícito de uso local.

### `scripts/check-prescriptions.ts`

Classificação: Read-only com cautela.

Finalidade:

* Auditar prescrições e dados relacionados de forma diagnóstica.
* Uso local/controlado.

Hardening aplicado:

* Guard contra URLs remotas/produção.
* Aviso explícito de uso local.
* Sem escrita em banco.

### `scripts/openui-project-report.ts`

Classificação: Relatório local sem banco.

Finalidade:

* Gerar/organizar relatório local de estrutura do projeto.
* Não conecta em banco.
* Não executa migrations.

Hardening aplicado:

* Avisos de uso local.
* Escopo limitado a leitura/relatório.

## Validações

* `pnpm check`
* `git diff --cached --check`
* Busca por padrões proibidos no staged diff
* Busca por pontos sensíveis no staged diff

Resultado:

* Typecheck passando.
* Staged diff limpo.
* Sem credenciais hardcoded.
* Sem `DATABASE_URL_ONLINE`.
* Sem scripts destrutivos staged.
* Sem migrations staged.
* `dist/` limpo.
* `pnpm-lock.yaml` limpo.

## Segurança e isolamento

* Nenhuma migration foi executada.
* Nenhum script destrutivo foi executado.
* Nenhuma conexão online foi feita.
* Nenhum script BI destrutivo foi commitado.
* Nenhum script de sync BI foi commitado.
* Nenhum arquivo Admin residual foi commitado.
* Nenhum segredo, token ou senha real entrou no commit.

## Fora de escopo

* `server/scripts/rebuild_bi_facts.ts`
* `server/scripts/sync_pdv_comandas_bi.ts`
* `server/scripts/run_migration_0009.ts`
* `server/scripts/run_migration_0010_add_icon_emoji.ts`
* `client/src/pages/AdminPdvDisabled.tsx`
* `client/src/pages/AdminWorkers.tsx`

## Backlog futuro recomendado

1. Sprint Migrations DDL:

   * `server/scripts/run_migration_0009.ts`
   * `server/scripts/run_migration_0010_add_icon_emoji.ts`

2. Sprint BI Hardening:

   * `server/scripts/rebuild_bi_facts.ts`
   * `server/scripts/sync_pdv_comandas_bi.ts`

3. Sprint Admin residual:

   * `client/src/pages/AdminPdvDisabled.tsx`
   * `client/src/pages/AdminWorkers.tsx`
