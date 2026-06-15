# Checkpoint Home / UX / Layout / Tema / Navegação

Data: 2026-06-14

## Commit

df1f674
feat: stabilize home ux layout and navigation

## Resumo

A sprint estabilizou a frente visual e estrutural da aplicação, incluindo Home, layout principal, rotas, navegação, Header, navegação mobile, FloatingCartFooter visual, tema, providers, ErrorBoundaries, SuccessPage visual e helpers de UX.

## Escopo incluído

* Modularização da Home.
* Criação de componentes dedicados para Hero, categorias, FAQ, kits, vitrines, fidelidade e banner nutricionista.
* Hooks e utilitários da Home.
* Modularização da SuccessPage.
* Cards e componentes visuais de pós-pedido.
* Header e navegação.
* MobileBottomNav.
* FloatingCartFooter como componente visual/layout.
* App/Layout/Rotas.
* Tema e hooks de tema.
* ThemeProvider e ThemeContext.
* ErrorBoundaries.
* Sheet/UI base.
* Helpers de erro/confirmação.
* Remoção do toaster antigo.
* Criação de `shared/domain/ux/**`.

## Arquivos principais incluídos

* `client/src/App.tsx`
* `client/src/app/logic/routesConfig.tsx`
* `client/src/app/view/AppView.tsx`
* `client/src/pages/Home.tsx`
* `client/src/pages/home/**`
* `client/src/pages/SuccessPage.tsx`
* `client/src/pages/success/**`
* `client/src/components/Header.tsx`
* `client/src/components/AdminLayout.tsx`
* `client/src/components/ThemeProvider.tsx`
* `client/src/contexts/ThemeContext.tsx`
* `client/src/_core/hooks/useTheme.ts`
* `client/src/_core/hooks/useBrandTheme.ts`
* `client/src/_core/shared/MobileBottomNav.tsx`
* `client/src/_core/shared/FloatingCartFooter.tsx`
* `client/src/components/ErrorBoundary.tsx`
* `client/src/components/ui/ErrorBoundary.tsx`
* `client/src/components/ui/sheet.tsx`
* `client/src/components/ui/toaster.tsx` removido
* `client/src/components/ui/use-toast.ts` removido
* `client/src/lib/admin-mutation-error.ts`
* `client/src/lib/strong-confirmation.ts`
* `client/src/lib/utils.ts`
* `client/src/_core/type/utils.ts`
* `shared/domain/ux/**`

## Validações

* `pnpm check`
* `pnpm build`
* `pnpm test:run server/security/rbac.spec.ts server/guest-checkout.spec.ts server/orders/logic/commercial.spec.ts server/success-page.spec.ts server/alerts-p1-confirm-dialog.spec.ts server/alerts-p2.spec.ts server/version-check.spec.ts`
* `git diff --cached --check`

Resultado: typecheck passando, build passando, 47 specs passando e staged diff sem warnings de whitespace.

## Segurança e isolamento

* SuccessPage ficou restrita à camada visual/UX.
* FloatingCartFooter ficou restrito à camada visual/layout.
* Não houve reabertura de checkout, placeOrder, recalculateOrder ou regras transacionais.
* Rotas e lazy imports foram revisados.
* ErrorBoundaries foram blindadas para evitar stacktrace sensível em produção.
* Nenhuma credencial, segredo ou token real entrou no diff.
* `dist/` foi limpo após build e ficou fora do commit.

## Fora de escopo

* OAuth/Auth.
* Announcements/Marketing.
* BI/Analytics/PDV.
* IA Admin.
* Nutri/Prescrição clínica.
* Checkout/Cart/Orders.
* Admin Orders.
* Catálogo/Produtos/Pacotes/Tamanhos.
* Admin Geral/Settings/Users/Payment/Loyalty.
* Media Library ampla.
* Label/Zebra.
* Workers/Infra/versionamento amplo.
* migrations novas.
* execução contra banco online.
* dist/build artifacts.

## Observações

* O commit reduziu complexidade de Home e SuccessPage por modularização.
* O toaster antigo foi removido após migração para o padrão atual de feedback.
* Teste manual em browser ainda é recomendado para:

  * Home desktop/mobile;
  * Header e navegação;
  * MobileBottomNav;
  * FloatingCartFooter visual;
  * tema;
  * rotas públicas/admin;
  * SuccessPage;
  * ErrorBoundary em produção/dev.
