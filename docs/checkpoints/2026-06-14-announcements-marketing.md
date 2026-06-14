# Checkpoint Announcements/Marketing

Data: 2026-06-14

## Commit

54dd97a38ae6932e9e694988d5a2474e290a6e82
feat: add announcements marketing module

## Resumo

A sprint adicionou o módulo de anúncios/marketing, permitindo criar, gerenciar e exibir anúncios em áreas do storefront e do perfil do cliente.

## Escopo incluído

* Página administrativa de anúncios.
* Banner de anúncios na home.
* Aba de anúncios no perfil do cliente.
* Router admin de announcements.
* Router storefront de announcements.
* Registro dos routers nos índices admin/storefront.
* Schema `marketing.ts` para announcements.
* Migration DDL `0012` para announcements, visibility scope e targets.
* Testes automatizados de announcements.

## Migration

Arquivo:

`server/scripts/run_migration_0012_announcements_targets_visibility.ts`

A migration cobre:

* `announcements`.
* `icon_emoji`.
* `visibility_scope`.
* `announcement_targets`.
* índices por `announcement_id` e `user_id`.
* índice único por `announcement_id + user_id`.

## Validações

* `pnpm.cmd build`
* `pnpm.cmd test:run server/routers/admin/announcements.spec.ts`
* `pnpm.cmd test:run server/guest-checkout.spec.ts`
* `pnpm.cmd test:run server/security/rbac.spec.ts`

## Fora de escopo

* BI/Analytics.
* OAuth/Auth.
* Nutri/ProductDrawer/CheckoutSummary.
* IA de Conteúdo.
* dist/build artifacts.
* scripts temporários/debug.
* alterações residuais de cupons em `marketing.ts`.

## Observações

* `dist/` foi limpo após o build e não deve ser commitado.
* `server/scripts/run_migration_0009.ts` e `0010` permaneceram fora por serem scripts antigos/incompletos.
* Teste manual em browser ainda é recomendado para admin/home/perfil.
