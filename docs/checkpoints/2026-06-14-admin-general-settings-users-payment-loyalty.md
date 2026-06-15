# Checkpoint Admin Geral / Settings / Users / Payment / Loyalty

Data: 2026-06-14

## Commit

4b2d13670201e05a63ffdf1cb733326f58e3397e
feat: stabilize admin settings users payments and loyalty

## Resumo

A sprint estabilizou a frente de administração geral, configurações da loja e do sistema, usuários administrativos (endereços e segurança), métodos de pagamento (com fallbacks e logos seguros), regras de fidelidade e reconciliação de saldo, além do wiring administrativo e automações internas.

## Escopo incluído

* Usuários administrativos e listagem.
* Aba de endereços e segurança do usuário.
* Configurações gerais da loja, dados da empresa, retirada e valores mínimos.
* Integrações de analytics, scripts de rastreamento e tags.
* Métodos de pagamento, status de ativação, ordenação e drawer.
* Logos e fallbacks de imagem de métodos de pagamento.
* Regras e resgates de fidelidade.
* Reconciliação manual de saldo de pontos fidelidade.
* Cupons administrativos e drawer de cupons.
* Regras de desconto comercial admin.
* Fiação central de rotas administrativas e automações.
* Specs de testes de logos, fidelidade, reconciliação e configurações modulares.

## Arquivos principais incluídos

* `client/src/pages/adminUsers/**`
* `client/src/pages/adminSettings/**`
* `client/src/pages/adminPaymentMethods/**`
* `client/src/pages/adminLoyalty/**`
* `client/src/pages/AdminCoupons.tsx`
* `client/src/pages/adminCoupons/**`
* `client/src/pages/adminDiscountRules/**`
* `server/routers/admin/payment-methods.ts`
* `server/routers/admin/loyalty.ts`
* `server/admin-loyalty.ts`
* `server/loyalty.ts`
* `server/routers/admin/adminStoreSettingsRouter.ts`
* `server/routers/admin/store-settings/**`
* `server/routers/admin/automation.routes.ts`
* `server/routers/admin/index.ts`
* `shared/utils/payment-logo.ts`
* `server/payment-logo.spec.ts`
* `server/loyalty.spec.ts`
* `server/loyalty-reconciliation.spec.ts`
* `server/loyalty-reconciliation.ts`

## Validações

* `pnpm check`
* `pnpm build`
* `pnpm test:run server/security/rbac.spec.ts server/guest-checkout.spec.ts server/orders/logic/commercial.spec.ts server/payment-logo.spec.ts server/loyalty.spec.ts server/loyalty-reconciliation.spec.ts server/routers/admin/store-settings/store-settings.spec.ts`
* `git diff --cached --check`

Resultado: typecheck passando, build passando, todas as specs de fidelidade, reconciliação, logos e RBAC passando sem warnings de whitespace.

## Segurança e integridade

* Roteadores administrativos protegidos por `adminProcedure` e roles estritas.
* Máscara `MASKED_SECRET` aplicada para proteger e ofuscar dados sensíveis de credenciais (GA, Google Login e Gemini) no cliente.
* Reconciliação de fidelidade executada em transação de banco com validação de saldo mínimo e auditoria idempotente.
* Logs sanitizados de PII e dados de credenciais.
* Exclusão e alteração de endereços e regras de segurança exigem confirmação.
* Validador de fallbacks de logos de pagamento impede injeções de URLs inválidas.
* Sem alteração física de schemas e sem novas migrations nesta sprint.

## Fora de escopo

* Checkout/Cart/Orders storefront.
* Admin Orders / Operação Interna.
* Catálogo / Produtos / Pacotes / Tamanhos.
* Home/UX/Layout/Tema geral.
* BI/Analytics/PDV.
* IA Admin.
* Nutri clínica/prescrição.
* OAuth/Auth Account Linking.
* Announcements/Marketing.
* Media library ampla.
* Label/Zebra.
* dist/
* scripts/debug/recovery.
