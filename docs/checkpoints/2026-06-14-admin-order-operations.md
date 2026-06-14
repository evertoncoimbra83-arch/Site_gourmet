# Checkpoint Admin Orders / Operação Interna

Data: 2026-06-14

## Commit

8e59401af4c46f184cacce060702e49fb902c075
feat: stabilize admin order operations

## Resumo

A sprint estabilizou a frente operacional interna de pedidos no painel administrativo, incluindo listagem de pedidos, drawer operacional, criação manual de pedidos, wizard interno, rascunhos, finalização admin, pagamento interno e impressão operacional HTML/ESC-POS.

## Escopo incluído

* Listagem administrativa de pedidos.
* Versão mobile da listagem admin.
* Drawer de detalhes do pedido.
* Itens do pedido no drawer.
* Wizard de criação manual.
* Estado local de venda manual.
* Cache/rascunho de pedido manual.
* Etapas de seleção de itens.
* Etapas de pagamento interno.
* Sidebar de fechamento do pedido.
* ProductDrawer interno do Admin Orders.
* SizeSelector interno do Admin Orders.
* Mappers internos do wizard.
* Template de impressão operacional.
* Geração ESC/POS.
* Router admin de orders.
* Services admin de draft/finalização/listagem.
* Helpers admin orders.

## Arquivos principais incluídos

* `client/src/pages/adminOrders/components/orderDrawer/AdminOrderItems.tsx`
* `client/src/pages/adminOrders/components/orderDrawer/OrderDetailsDrawer.tsx`
* `client/src/pages/adminOrders/components/orderDrawer/print/OrderPrintTemplate.tsx`
* `client/src/pages/adminOrders/components/orderDrawer/print/logic/EscPosGenerator.ts`
* `client/src/pages/adminOrders/logic/draftCache.ts`
* `client/src/pages/adminOrders/logic/manualSaleState.ts`
* `client/src/pages/adminOrders/logic/useAdminOrderWizard.ts`
* `client/src/pages/adminOrders/logic/useAdminOrders.ts`
* `client/src/pages/adminOrders/view/AdminOrderCreate.tsx`
* `client/src/pages/adminOrders/view/AdminOrdersMobileList.tsx`
* `client/src/pages/adminOrders/view/AdminOrdersView.tsx`
* `client/src/pages/adminOrders/view/steps/**`
* `server/routers/admin/orders/AdminOrderDraftService.ts`
* `server/routers/admin/orders/AdminOrderFinalizeService.ts`
* `server/routers/admin/orders/AdminOrderHelpers.ts`
* `server/routers/admin/orders/OrderManagerService.ts`
* `server/routers/admin/orders/ordersAdminRouter.ts`

## Validações

* `pnpm check`
* `pnpm build`
* `pnpm test:run server/security/rbac.spec.ts server/guest-checkout.spec.ts server/orders/logic/commercial.spec.ts server/payment-logo.spec.ts`
* `git diff --cached --check`

Resultado: typecheck passando, build passando, 34/34 testes passando e staged diff sem warnings de whitespace.

## Segurança e integridade operacional

* Rotas admin orders protegidas por autorização admin.
* Finalização manual de pedidos usa o motor autoritativo `recalculateOrder.ts`.
* Frontend não define subtotal, total, frete ou desconto como fonte confiável transacional.
* Impressão ESC/POS não imprime `publicAccessToken`.
* Dados clínicos/nutri não entram no recibo.
* Não houve impressão física real durante a validação.
* `dist/` foi limpo após build e permaneceu fora do commit.

## Fora de escopo

* Checkout storefront.
* Cart storefront.
* Orders storefront público.
* Home/UX.
* BI/Analytics/PDV.
* Announcements/Marketing.
* IA Admin.
* Nutri/Prescrição.
* OAuth/Auth.
* ProductDrawer público.
* Products públicos.
* Packages públicos.
* LabelEditor/Zebra amplo fora da impressão de pedido.
* dist/build artifacts.
* scripts/debug/recovery.
* migrations novas.
* execução contra banco online.
* impressão real.

## Observações

* A sprint ficou restrita ao fluxo operacional interno de pedidos.
* O commit é coerente com a separação entre operação admin e storefront.
* Teste manual em browser ainda é recomendado para:

  * listagem de pedidos;
  * filtros;
  * drawer de pedido;
  * alteração de status;
  * criação manual de pedido;
  * rascunho/cache;
  * pagamento interno;
  * impressão HTML;
  * geração ESC/POS sem envio real.
