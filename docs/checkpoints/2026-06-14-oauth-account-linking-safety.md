# Checkpoint OAuth Account Linking Safety

Data: 2026-06-14

## Commit

5334e177aec06e49c69adb83e68b02aeee70f557
fix: harden oauth account linking tokens

## Resumo

A sprint corrigiu o risco de segurança no fluxo de vinculação OAuth, removendo o fallback literal usado para assinatura de linking tokens.

## Causa raiz

O arquivo `server/auth/oauth/linkingToken.ts` usava um segredo padrão quando `DB_ENCRYPTION_KEY` estava ausente. Isso poderia permitir assinatura previsível de tokens em ambientes mal configurados.

## Correção

* Removido fallback literal `fallback-secret-for-linking`.
* `DB_ENCRYPTION_KEY` passa a ser obrigatório fora de ambiente de teste.
* Ambiente `test` usa segredo fixo explicitamente limitado a testes.
* Tokens são assinados com HMAC SHA-256.
* Verificação usa `crypto.timingSafeEqual`.
* Tokens expirados, malformados ou com assinatura inválida retornam `null`.

## Escopo incluído

* Google OAuth.
* OAuth callback page.
* Link de conta OAuth.
* Unlink de conta OAuth.
* Listagem de contas OAuth.
* Testes de segurança OAuth/Auth.

## Validações

* `pnpm.cmd check`
* `pnpm.cmd build`
* `pnpm.cmd test:run server/routers/storefront/auth/oauth.spec.ts server/routers/storefront/auth/auth.spec.ts`
* `pnpm.cmd test:run server/guest-checkout.spec.ts`
* `pnpm.cmd test:run server/security/rbac.spec.ts`

## Fora de escopo

* Schemas/migrations.
* Marketing/Announcements.
* BI/Analytics.
* Nutri/ProductDrawer/CheckoutSummary.
* Pricing/frete/cupom/fidelidade.
* dist/build artifacts.

## Observações

`dist/` foi limpo novamente após o build e não deve ser commitado junto com features.
