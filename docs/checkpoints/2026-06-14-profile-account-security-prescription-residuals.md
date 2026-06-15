# Checkpoint Profile / Conta / Segurança / Prescrição Residual

Data: 2026-06-14

## Commit

00441faf7e65c48abe65b475c9eb9387d5aa0770
feat: stabilize profile account security and prescription residuals

## Resumo

A sprint estabilizou os resíduos relacionados a perfil do cliente, conta, segurança, prescrição visual, deep link/referral e rotas storefront de profile/public/loyalty. A frente foi tratada sem reabrir checkout transacional, catálogo, admin geral, OAuth interno, BI, mídia, infra ou Label/Zebra.

## Escopo incluído

* Profile UI.
* Profile Logic.
* SecurityTab.
* OrdersTabItem dentro do perfil.
* ProfileDashboardHome.
* MyPrescription como wrapper/proxy residual.
* Deep link de cupom/referral.
* Helpers de referral invite URL.
* Storefront profile router.
* Storefront loyalty router.
* Storefront public router.
* Storefront index wiring.
* ProtectedRoute e AdminLogin como guards/UX de segurança.
* Specs de profile, success page, referral e alerts.

## Arquivos principais incluídos

* `client/src/_core/hooks/useCouponDeepLink.ts`
* `client/src/components/ProtectedRoute.tsx`
* `client/src/lib/referral-invite-url.ts`
* `client/src/pages/MyPrescription.tsx`
* `client/src/pages/adminLogin/AdminLogin.tsx`
* `client/src/pages/profile/components/OrderTab/OrdersTabItem.tsx`
* `client/src/pages/profile/components/ProfileDashboardHome.tsx`
* `client/src/pages/profile/components/SecurityTab.tsx`
* `client/src/pages/profile/logic/ProfileLogic.ts`
* `server/alerts-p1-confirm-dialog.spec.ts`
* `server/alerts-p2.spec.ts`
* `server/auth-link-referral.spec.ts`
* `server/routers/storefront/index.ts`
* `server/routers/storefront/loyalty.ts`
* `server/routers/storefront/profile.spec.ts`
* `server/routers/storefront/profile.ts`
* `server/routers/storefront/public.ts`
* `server/success-page.spec.ts`

## Validações

* `pnpm check`
* `pnpm build`
* `pnpm test:run server/security/rbac.spec.ts`
* `pnpm test:run server/guest-checkout.spec.ts`
* `pnpm test:run server/orders/logic/commercial.spec.ts`
* `pnpm test:run server/routers/storefront/profile.spec.ts server/success-page.spec.ts server/auth-link-referral.spec.ts server/alerts-p1-confirm-dialog.spec.ts server/alerts-p2.spec.ts`
* `git diff --cached --check`
* Busca por padrões proibidos no staged diff
* Verificação de `dist/`

Resultado: typecheck passando, build passando, testes passando, staged diff sem warnings de whitespace e `dist/` limpo.

## Segurança e isolamento

* `MyPrescription.tsx` ficou como wrapper/proxy residual.
* Não houve reabertura de regra clínica pesada, admin nutri ou builder de prescrição.
* `SecurityTab` conecta botões visuais a fluxos já existentes, sem alterar o mecanismo interno de OAuth Account Linking.
* Deep link/referral foi tratado sem open redirect e com sanitização de parâmetros.
* Rotas storefront privadas seguem protegidas por autenticação.
* Rotas públicas não devem expor dados privados.
* Não houve reabertura de checkout, catálogo, admin geral ou BI.
* Não houve migration.
* Nenhuma credencial, segredo ou token real entrou no diff.

## Fora de escopo

* Checkout/Cart/Orders transacional.
* Admin Orders.
* Catálogo/Produtos/Pacotes/Tamanhos.
* Admin Geral/Settings/Users/Payment/Loyalty.
* BI/Analytics/PDV.
* IA Admin.
* Nutri clínica pesada/admin nutri builder.
* OAuth Account Linking interno.
* Announcements/Marketing.
* Home/UX/Layout/Tema.
* Media/Uploads/Image Picker.
* Infra/Workers/Versionamento.
* Label/Zebra.
* scripts de banco/Redis/BI.
* migrations.
* dist/build artifacts.

## Observações

* A sprint removeu complexidade residual de `MyPrescription.tsx`.
* Foram adicionadas specs para proteger profile, success page, referral e alertas.
* Teste manual recomendado:

  * perfil do cliente;
  * aba de segurança;
  * link/unlink visual de conta Google;
  * dashboard do perfil;
  * listagem de pedidos no perfil;
  * prescrição do cliente;
  * deep link de cupom/referral;
  * rotas protegidas.
