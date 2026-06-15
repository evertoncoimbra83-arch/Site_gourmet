# Checkpoint Label / Zebra / Print Transport

Data: 2026-06-15

## Commit

3762555a2d28a8ad67e8af8d07457030e7957c67
fix: harden label print transport guards

## Resumo

A sprint estabilizou a frente Label / Zebra / Print Transport com foco em segurança do transporte de impressão, prevenção de envios duplicados, guards defensivos para payload ZPL e substituição de confirmações nativas por fluxo controlado de confirmação.

A sprint não reabriu a arquitetura completa de etiquetas, não prometeu paridade entre preview HTML e ZPL e não alterou regra nutricional, checkout, admin orders, catálogo, profile, BI, mídia, infra ou Label/Zebra.

## Escopo incluído

* Estação do editor de etiquetas.
* Painel de produção de etiquetas.
* Transporte de impressão.
* Guards defensivos de payload ZPL.
* Prevenção de double click/envio duplicado.
* Tratamento de confirmação por componente de diálogo.
* Validações básicas antes do envio ao Browser Print/Zebra.

## Arquivos incluídos

* `client/src/pages/adminLabelEditor/components/LabelEditorStation.tsx`
* `client/src/pages/adminLabelEditor/components/LabelProductionPanel.tsx`
* `client/src/pages/adminLabelEditor/print-engine/transport.ts`
* `client/src/pages/adminLabelEditor/print-engine/transportGuards.ts`

## Validações

* `pnpm check`
* `pnpm build`
* `pnpm test:run server/security/rbac.spec.ts`
* `pnpm test:run server/guest-checkout.spec.ts`
* `pnpm test:run server/orders/logic/commercial.spec.ts`
* Busca por specs específicas de label/zebra/print/transport
* `git diff --cached --check`
* Busca por padrões proibidos no staged diff
* Verificação de `dist/`
* Verificação de `client/src/build-info.ts`

Resultado: typecheck passando, build passando, regressões passando, staged diff sem warnings e `dist/` limpo.

## Segurança e isolamento

* Não há envio automático de impressão ao renderizar.
* O fluxo exige ação explícita do usuário.
* Foi adicionado controle para evitar envio duplicado por double click.
* Payload ZPL vazio é bloqueado.
* Payload ZPL grande demais é bloqueado por limite defensivo.
* O transporte ganhou guards centralizados.
* Erros são tratados sem expor segredos.
* Não houve inclusão de credenciais, tokens ou secrets.
* Não houve migration.
* Não houve alteração em `pnpm-lock.yaml`.

## Fora de escopo

* Paridade completa HTML preview × ZPL.
* Reimplementação do gerador ZPL.
* Preview HTML.
* Tabela nutricional gráfica.
* QR/barcode avançado.
* Imagens em ZPL.
* Arquitetura completa do Browser Print.
* Nutrição clínica.
* Checkout/Cart/Orders.
* Admin Orders.
* Catálogo/Produtos/Pacotes.
* Profile/Conta/Segurança.
* BI/PDV.
* IA Admin.
* Home/UX.
* Media.
* Infra/Workers.
* scripts de banco/Redis/BI.
* migrations.

## Observações

Esta sprint melhora a segurança operacional do transporte de impressão, mas a paridade entre preview HTML e ZPL permanece como sprint futura separada.

Backlog futuro recomendado:

* Sprint dedicada para paridade preview HTML × ZPL.
* Revisão de suporte real a imagens no ZPL.
* Revisão de tabela nutricional gráfica no ZPL.
* Revisão de QR/barcode.
* Revisão de escaping/encoding.
* Revisão de transporte Browser Print em produção.
* Testes manuais com impressora Zebra real.
