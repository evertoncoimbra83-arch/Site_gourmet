# Checkpoint Catálogo / Produtos / Pacotes / Tamanhos

Data: 2026-06-14

## Commit

7fa7385
feat: stabilize catalog products packages and sizes

## Resumo

A sprint estabilizou a frente de catálogo e administração de produtos, pacotes, tamanhos e acompanhamentos, incluindo pratos, categorias, ingredientes, imagens de pratos, cálculo nutricional de produtos/pacotes, configuração de pacotes, validação de integridade de pacotes, catálogo público de produtos e pacotes, além dos routers e services backend relacionados.

## Escopo incluído

* Administração de pratos/produtos.
* Categorias.
* Ingredientes.
* Drawer de criação/edição de pratos.
* Imagem/mídia associada ao prato.
* Aba nutricional do prato.
* Administração de tamanhos.
* Grupos e opções de acompanhamentos.
* Administração de pacotes.
* Editor de slots de pacotes.
* Preview de pacotes.
* Configurador público de pacotes.
* Cálculo nutricional de pacotes.
* ProductDrawer público.
* Grid/listagem pública de produtos.
* Validação frontend de acompanhamentos.
* Mappers públicos de produtos/tamanhos.
* Backend admin dishes.
* Backend admin sizes/options.
* Backend admin packages.
* Storefront dishes/packages.
* Helpers seguros de assets.
* Validador compartilhado de configuração de pacotes.
* Labels de preço de pacote.
* Specs de paginação, mídia e validação de pacotes.

## Arquivos principais incluídos

* `client/src/pages/AdminDishes.tsx`
* `client/src/pages/adminDishes/**`
* `client/src/pages/adminPackages/**`
* `client/src/pages/adminSizes/**`
* `client/src/pages/products/**`
* `client/src/pages/packages/**`
* `server/admin-dishes/**`
* `server/dishes.ts`
* `server/packages.ts`
* `server/admin-options.ts`
* `server/admin-sizes.ts`
* `server/routers/admin/dishes.ts`
* `server/routers/admin/packages.ts`
* `server/routers/admin/sizes.ts`
* `server/routers/admin/accompaniments/options.ts`
* `server/packages-integrity.ts`
* `server/package-config-validator.spec.ts`
* `server/admin-dishes-pagination.spec.ts`
* `server/media-picker-refactor.spec.ts`
* `shared/domain/packages/**`
* `shared/utils/assets.ts`

## Validações

* `pnpm check`
* `pnpm build`
* `pnpm test:run server/security/rbac.spec.ts server/guest-checkout.spec.ts server/orders/logic/commercial.spec.ts server/package-config-validator.spec.ts server/media-picker-refactor.spec.ts server/payment-logo.spec.ts server/admin-dishes-pagination.spec.ts`
* `git diff --cached --check`

Resultado: typecheck passando, build passando, specs de catálogo/pacotes/mídia/RBAC/regressões passando e staged diff sem warnings de whitespace.

## Segurança e integridade de catálogo

* Backend permanece autoridade para precificação, soft delete, categorias e integridade de pacotes.
* Mutations de pratos/pacotes/tamanhos validam schemas e regras antes de persistir.
* Validação de pacotes impede slots inválidos, pratos inativos e quantidades acima do permitido.
* Catálogo público não expõe dados administrativos.
* Helpers de assets foram revisados para reduzir risco com caminhos/URLs de mídia.
* Nenhum arquivo físico de schema/migration foi alterado nesta sprint.
* Aba nutricional ficou restrita ao contexto de prato/pacote e não reabriu prescrição clínica.

## Fora de escopo

* OAuth/Auth.
* Announcements/Marketing.
* BI/Analytics/PDV.
* IA Admin.
* Nutri/Prescrição clínica.
* Checkout/Cart/Orders.
* Admin Orders / Operação Interna.
* Home/UX.
* Settings gerais.
* Label/Zebra.
* Media library ampla fora do uso direto de pratos.
* dist/build artifacts.
* scripts/debug/recovery.
* migrations novas.
* execução contra banco online.

## Observações

* O commit foi grande, mas coerente por fechar a base de catálogo, produtos, pacotes e tamanhos como uma unidade funcional.
* `dist/` ficou sujo após build e foi limpo antes deste checkpoint.
* Teste manual em browser ainda é recomendado para:

  * listagem de pratos admin;
  * criação/edição de prato;
  * seleção de imagem de prato;
  * categorias e ingredientes;
  * tamanhos e acompanhamentos;
  * criação/edição de pacote;
  * configurador público de pacote;
  * ProductDrawer público;
  * cálculo nutricional de produto/pacote.
