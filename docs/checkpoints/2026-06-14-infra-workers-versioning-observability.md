# Checkpoint Infra / Workers / Versionamento / Observabilidade

Data: 2026-06-14

## Commit

37c1a5f
chore: stabilize infra workers versioning and observability

## Resumo

A sprint estabilizou a infraestrutura residual do projeto, incluindo checagem de versão do app, banner de atualização, geração de `build-info`, guards de SDK/browser, request ID, wiring central de core/tRPC/API, inicialização segura de workers e specs de observabilidade/versionamento.

## Escopo incluído

* Checagem de versão do app.
* Banner de atualização.
* Geração local de `build-info`.
* Guards de SDK/browser.
* Middleware/helper de request ID.
* Ajustes no core Express/tRPC.
* Wiring central de API.
* Router administrativo de workers.
* Entry point seguro de workers.
* Specs de versionamento.
* Specs de observabilidade.
* Configurações de build/test/runtime necessárias.

## Arquivos principais incluídos

* `client/src/_core/hooks/useAppVersionChecker.ts`
* `client/src/components/VersionCheckerBanner.tsx`
* `client/src/build-info.ts`
* `client/src/app/logic/sdkGuards.ts`
* `server/_core/request-id.ts`
* `server/_core/index.ts`
* `server/_core/trpc.ts`
* `server/api/root.ts`
* `server/routers/admin/worker.ts`
* `server/workers/index.ts`
* `server/workers/observability.spec.ts`
* `server/version-check.spec.ts`
* `scripts/generate-version.js`
* `ecosystem.config.cjs`
* `vite.config.ts`
* `vitest.config.ts`

## Validações

* `pnpm check`
* `pnpm build`
* `pnpm test:run server/security/rbac.spec.ts`
* `pnpm test:run server/guest-checkout.spec.ts`
* `pnpm test:run server/orders/logic/commercial.spec.ts`
* `pnpm test:run server/version-check.spec.ts`
* `pnpm test:run server/workers/observability.spec.ts`
* `pnpm test:run server/_core/health.spec.ts server/workers/biWorker.spec.ts`
* `git diff --cached --check`
* Busca por padrões proibidos no staged diff
* Verificação de `dist/`

Resultado: typecheck passando, build passando, 53 testes passando, staged diff sem warnings de whitespace e `dist/` limpo.

## Segurança e isolamento

* Request ID é usado apenas para correlação/log, não para autenticação.
* tRPC preserva contexto e autorização.
* Worker import não executa job destrutivo automaticamente.
* Bootstrap de workers fica condicionado a `WORKER_PROCESS === "true"`.
* `generate-version.js` é local, seguro e não destrutivo.
* `build-info.ts` contém apenas metadados não sensíveis.
* Configs não incluem credenciais reais.
* Configs não relaxam segurança de typecheck/testes.
* Não houve migration.
* Nenhuma credencial, segredo ou token real entrou no diff.

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
* Home/UX/Layout/Tema/Navegação.
* Media/Uploads/Assets/Image Picker.
* Label/Zebra.
* migrations novas.
* execução contra banco online.
* dist/build artifacts.

## Observações

* A sprint fechou a maior parte da infraestrutura residual.
* Teste manual recomendado:

  * verificar banner de atualização no navegador;
  * validar reload/cache-bust;
  * validar logs com request ID;
  * validar tela/admin de workers;
  * validar processo worker com `WORKER_PROCESS=true` em ambiente controlado;
  * validar build de produção.
