# Checkpoint Media / Uploads / Assets / Image Picker

Data: 2026-06-14

## Commit

7304f77
feat: stabilize media uploads and image picker

## Resumo

A sprint estabilizou a frente de mídia, uploads, assets e seleção de imagens. O fluxo legado `MediaPickerModal` foi removido, os componentes de seleção de mídia foram consolidados no fluxo atual, o Admin Media foi estabilizado, foi criado um helper defensivo para URLs de imagem e um script local seguro para auditoria de mídia.

## Escopo incluído

* Biblioteca de mídia administrativa.
* ImagePicker genérico.
* MediaLibraryModal.
* MediaLibraryDrawer.
* Remoção do `MediaPickerModal.tsx` obsoleto.
* Helper defensivo `shared/utils/image-url.ts`.
* Script local e não destrutivo `server/audit_media.ts`.

## Arquivos principais incluídos

* `client/src/components/ImagePicker.tsx`
* `client/src/components/MediaLibraryModal.tsx`
* `client/src/components/MediaPickerModal.tsx` removido
* `client/src/pages/adminMedia/logic/useAdminMedia.ts`
* `client/src/pages/adminMedia/view/AdminMediaView.tsx`
* `client/src/pages/adminMedia/view/MediaLibraryDrawer.tsx`
* `server/audit_media.ts`
* `shared/utils/image-url.ts`

## Validações

* `pnpm check`
* `pnpm build`
* `pnpm test:run server/security/rbac.spec.ts server/guest-checkout.spec.ts server/orders/logic/commercial.spec.ts server/media-picker-refactor.spec.ts`
* `git diff --cached --check`
* Busca por imports pendentes de `MediaPickerModal`
* Busca por padrões proibidos no staged diff
* Verificação de `dist/`

Resultado: typecheck passando, build passando, 33 testes passando, staged diff sem warnings de whitespace e `dist/` limpo.

## Segurança e isolamento

* `server/audit_media.ts` é local, read-only e não destrutivo.
* O script não apaga mídia.
* O script não altera banco.
* O script não altera arquivos.
* O script não conecta automaticamente ao banco online.
* O helper `shared/utils/image-url.ts` bloqueia protocolos perigosos e paths suspeitos.
* `MediaPickerModal.tsx` foi removido sem imports pendentes.
* Nenhuma credencial, segredo ou token real entrou no diff.
* Não houve migration.

## Fora de escopo

* Home/UX/Layout/Tema/Navegação.
* Catálogo/Produtos/Pacotes/Tamanhos.
* Admin Geral/Settings/Users/Payment/Loyalty.
* Checkout/Cart/Orders.
* Admin Orders.
* BI/Analytics/PDV.
* IA Admin.
* Nutri/Prescrição clínica.
* OAuth/Auth.
* Announcements/Marketing.
* Label/Zebra.
* Workers/Infra/versionamento amplo.
* migrations novas.
* execução contra banco online.
* dist/build artifacts.

## Observações

* O commit reduziu complexidade ao remover o picker legado.
* O fluxo novo centraliza a seleção de mídia via MediaLibraryModal/MediaLibraryDrawer.
* Teste manual em browser ainda é recomendado para:

  * Admin Media;
  * abertura/fechamento do drawer;
  * seleção de imagem;
  * preview de imagem inválida;
  * uso do ImagePicker em formulários;
  * comportamento de fallback.
