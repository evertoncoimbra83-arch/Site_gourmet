# Checkpoint Base P0 — Gourmet Saudável

Data: 2026-06-13

## Resumo executivo

A base P0 foi estabilizada e separada em commits seletivos. O objetivo foi fechar riscos técnicos antes de iniciar novas features, evitando misturar escopos em uma worktree ampla.

## Commits incluídos

1. e3423c8ad388b61f4cbd090df21584a8842b04f0
   fix: canonicalize nutrition referral client link

2. eec4bb345c01fc925c1597b019bd0002a07b3361
   chore: harden observability health sentry and redaction

3. 42e1e594ce862d3e0e33666be6a11261034c9be9
   fix: stabilize product drawer and nutrition canonical flows

## Escopos concluídos

### 1. Nutri/Auth Referral Canonical

* auth.linkReferral implementado.
* nutriProfiles.referralCode definido como origem canônica do convite.
* professional_clients definido como vínculo canônico profissional-cliente.
* users.referralCode mantido apenas como compatibilidade legada.
* deletePrescription não desfaz vínculo.
* sizeName/resolvedGroupId preservados no fluxo Nutri/checkout.

### 2. Hardening Observability P0/P1

* Sentry mantido em produção sem consoleLoggingIntegration agressivo.
* QueryClient unificado.
* /health/live, /health/ready e /health/worker públicos sanitizados.
* Detalhes operacionais de worker movidos para rota admin.
* Redaction LGPD ampliado.
* error.message bruto removido de respostas sensíveis.

### 3. UX/Nutri Canonical Stabilization

* CartContext normaliza noAccompanimentsMessage como string | undefined.
* CheckoutSummary preserva disabled por readiness.
* ProductDrawer não pré-seleciona acompanhamento automaticamente.
* Troca de tamanho preserva apenas acompanhamentos válidos.
* SizeSelector ordena tamanhos por peso.
* Nutri Drawer usa grupos vinculados ao tamanho selecionado.
* Specs UX/Nutri canonical passaram.

## Validações executadas

* pnpm.cmd check
* pnpm.cmd build
* pnpm.cmd test:run server/guest-checkout.spec.ts
* pnpm.cmd test:run server/security/rbac.spec.ts
* pnpm.cmd test:run server/nutri-client-link-p0.spec.ts
* pnpm.cmd test:run server/nutri-e2e-p0.spec.ts
* pnpm.cmd test:run server/auth-link-referral.spec.ts
* pnpm.cmd test:run server/ux-p1.spec.ts server/nutri-portal-p1.spec.ts server/nutrition-canonical.spec.ts
* pnpm.cmd test:run server/_core/health.spec.ts server/services/AuditLogService.spec.ts

## Fora de escopo

* IA de conteúdo.
* Previsão de produção.
* Roteirização.
* Assinaturas.
* Gamificação.
* Offline-first PDV.
* CSP strict sem unsafe-inline/unsafe-eval.
* OAuth link/unlink/list.
* dist/build artifacts.
* project-report*.
* schemas/migrations não revisados.
* arquivos sujos pré-existentes na worktree.

## Riscos remanescentes

* Worktree ainda contém alterações não relacionadas e artefatos gerados.
* Teste manual em browser real ainda recomendado.
* CSP permissiva permanece pendente para sprint futura.
* Concorrência extrema no primeiro vínculo referral ainda depende de unique constraint do banco.
* OAuth link/unlink/list deve ser auditado separadamente antes de qualquer commit.
* Alterações de schema devem ser revisadas em sprint própria.

## Próximos sprints recomendados

1. IA de Conteúdo Admin.
2. Previsão de Produção v0.
3. Auditoria OAuth link/unlink/list.
4. CSP strict discovery.
5. Roteirização simples.
