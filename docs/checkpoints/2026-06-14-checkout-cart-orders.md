# Checkpoint Checkout/Cart/Orders

Data: 2026-06-14

## Commit

02624e64b293a41e41301c6ce1622d7cabccaf7b
feat: stabilize checkout cart and order flows

## Resumo

A sprint estabilizou os fluxos críticos de carrinho, checkout e pedidos, incluindo validação de cliente, guest checkout, shadow users, CPF/e-mail, cupons, fidelidade, recálculo autoritativo no backend, rotas de cart/checkout/orders e specs de regressão comercial.

## Escopo incluído

* Página principal de checkout.
* Componentes de checkout.
* Carrinho frontend.
* Cart summary e itens do carrinho.
* Store/hook de checkout.
* Hooks de loyalty/cart/prescription cart.
* Validação de CPF.
* Checagem segura de identidade por e-mail/CPF.
* Utilitários de cupom/deep link.
* Regras compartilhadas de cart/pricing.
* Regras compartilhadas de checkout/customer.
* Backend cart router.
* Backend checkout router.
* Backend orders storefront.
* RecalculateOrder autoritativo.
* Regra de uso de cupom por cliente.
* Specs de guest checkout, coupon, loyalty, commercial e customer check.

## Arquivos principais incluídos

* `client/src/pages/Checkout.tsx`
* `client/src/pages/cart/**`
* `client/src/pages/checkout/**`
* `client/src/_core/store/useCheckoutStore.ts`
* `client/src/_core/hooks/useCartLoyalty.ts`
* `client/src/_core/hooks/usePrescriptionCart.ts`
* `client/src/_core/hooks/loyalty/useLoyaltyValidator.ts`
* `client/src/hooks/loyalty/useLoyaltyCalculator.ts`
* `server/routers/storefront/cart/**`
* `server/routers/storefront/checkout/**`
* `server/routers/storefront/orders.ts`
* `server/orders/logic/recalculateOrder.ts`
* `server/coupon.ts`
* `drizzle/schema/marketing.ts`
* `shared/domain/cart/**`
* `shared/domain/checkout/**`
* `shared/utils/coupon.ts`
* `server/guest-checkout.spec.ts`
* `server/cart-loyalty-client.spec.ts`
* `server/checkout-customer-check-user.spec.ts`
* `server/couponDeepLink.spec.ts`
* `server/orders/logic/commercial.spec.ts`
* `server/routers/admin/couponUsage.spec.ts`

## Validações

* `pnpm check`
* `pnpm build`
* `pnpm test:run server/guest-checkout.spec.ts server/cart-loyalty-client.spec.ts server/checkout-customer-check-user.spec.ts server/orders/logic/commercial.spec.ts server/couponDeepLink.spec.ts server/loyalty.spec.ts server/loyalty-reconciliation.spec.ts server/security/rbac.spec.ts server/nutri-client-prescription-price.spec.ts server/nutri-e2e-p0.spec.ts`
* `git diff --cached --check`

Resultado: 101/101 testes passando, typecheck passando e staged diff sem whitespace warnings.

## Segurança e integridade comercial

* Backend permanece autoridade de preço, frete, cupom e fidelidade.
* Totais vindos do cliente não são tratados como fonte transacional confiável.
* Regras de cupom/fidelidade/desconto progressivo foram centralizadas no recálculo autoritativo.
* Dados sensíveis de guest/shadow user continuam tratados com criptografia/indexação segura.
* `maxUsesPerCustomer` foi alinhado no schema e já possuía migration física existente.
* `server/coupon.ts` entrou por dependência direta do checkout/recálculo.
* AdminCoupons UI ficou fora do commit.
* `usePrescriptionCart.ts` entrou apenas como integração mínima de carrinho, sem reabrir Nutri clínica.

## Fora de escopo

* OAuth/Auth.
* Announcements/Marketing.
* BI/Analytics/PDV.
* IA Admin.
* Nutri/Prescrição clínica.
* Home/UX.
* Admin Orders amplo.
* ProductDrawer geral.
* dist/build artifacts.
* scripts/debug/recovery.
* migrations novas.
* execução contra banco online.

## Observações

* O commit foi grande, mas coerente com a criticidade e interdependência do fluxo comercial.
* `dist/` ficou sujo após build e foi limpo antes deste checkpoint.
* Teste manual em browser ainda é recomendado para:

  * carrinho;
  * checkout entrega/retirada;
  * cupom;
  * fidelidade;
  * guest checkout;
  * pedido autenticado;
  * pedido com prescrição no carrinho.
