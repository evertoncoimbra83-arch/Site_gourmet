# Diário de Sprints (Sprint Log) — Gourmet Saudável

Este diário registra o histórico de sprints executadas com suas respectivas validações e commits de entrega no repositório.

---

## 🏁 Sprints Concluídas

### 1. Sprints de Logs P1 (P1-A, P1-B, P1-C) e Error Logs P1
- **Entregas**: Criação do `AuditLogService` com suporte a logs estruturados. Captura de diffs before/after para alterações administrativas.
- **Validação**: Testes unitários em `AuditLogService.spec.ts`, build e typecheck validados.

### 2. Sprint Logs P2 (P2-A, P2-B, P2-C)
- **Entregas**: Central de Auditoria (`/admin/logs`) com filtros e inspector visual de logs.
- **Validação**: Paginação server-side e cache com TTL.

### 3. Sprint Security P1
- **Entregas**: Proteção contra CSRF via double-submit cookie, ownership de pedidos, proteção de uploads e rate limits.
- **Validação**: Testes de regressão e fluxos de checkout validados.

### 4. Sprint RBAC P1
- **Entregas**: Modelagem de perfis `super_admin`, `admin`, `operator`, requireRoles no tRPC e ProtectedRoute no React.
- **Validação**: Testes unitários em `rbac.spec.ts` passando.

### 5. Sprint Hardening P1-A (Blindagem de Infraestrutura)
- **Entregas**: Coluna `deletedAt` no Drizzle, soft delete, anonimização de dados LGPD e backups streamados.
- **Validação**: Testes em `hardening.spec.ts` aprovados.

### 6. Sprint Hardening P1-B & P1-C (Governança Financeira e UX)
- **Entregas**: Limites de descontos máximos em cupons, fretes e ajustes, barreira de Confirmação Forte.
- **Validação**: Testes integrados e compilação válidos.

### 7. Sprint Auth P1 (Hardening do Login Atual)
- **Entregas**: Invalidação de sessões zumbis ao redefinir senhas, auditoria operacional detalhada via `AuditLogService`.
- **Validação**: Compilação e testes aprovados.

### 8. Sprint OAuth P1 — Google Login (Foundation Layer)
- **Entregas**: Tabela `user_oauth_accounts` no Drizzle, PKCE no backend, validação de ID Token e proteção contra Account Takeover.
- **Validação**: Cobertura de testes unitários integrados em `oauth.spec.ts`.

### 9. Sprint Auth P2 — Gerenciamento e Histórico de Sessões
- **Entregas**: Visualização de sessões ativas do cliente e funcionalidade de logout remoto.
- **Validação**: Testes integrados em `auth.spec.ts` passando.

### 10. Sprint OAuth P2 — Google Login Completo (Fluxo do Usuário)
- **Entregas**: Login, auto-registro, desvinculação de conta Google com bloqueio contra lockout e link temporário assinado via HMAC.
- **Validação**: Testes unitários em `oauth.spec.ts` passando.

### 11. Sprint OAuth Config P1 — Google OAuth no Admin
- **Entregas**: Configurações dinâmicas de OAuth vindas da tabela `app_configs`, restrições de escrita por role `super_admin` e teste de conectividade.
- **Validação**: Testes em `oauth.spec.ts` e build 100% íntegros.

### 12. Sprint OAuth Account Linking Safety
- **Commit Funcional**: `5334e17`
- **Commit Checkpoint**: `0ff995a`
- **Entregas**: Hardening de tokens do OAuth account linking e proteção de transição de estado.
- **Validação**: Testes unitários em `oauth.spec.ts` e typecheck aprovados.

### 13. Sprint Announcements / Marketing
- **Commit Funcional**: `54dd97a`
- **Commit Checkpoint**: `b06c187`
- **Entregas**: Módulo administrativo e storefront de anúncios, banners rotativos e regras de exibição.
- **Validação**: Suítes de testes unitários em `announcements.spec.ts` e compilação do bundle cliente.

### 14. Sprint BI / Analytics / PDV
- **Commit Funcional**: `e24bbbe`
- **Commit Checkpoint**: `94bf4ff`
- **Entregas**: Estabilização do motor de fatos e dimensões do BI, fechamento de caixa do PDV e relatórios estatísticos seguros.
- **Validação**: Testes unitários locais em `bi.spec.ts` e verificação de não escrita em produção.

### 15. Sprint Hygiene Scripts / Debug / Recovery
- **Commit Funcional**: `1a1df9b`
- **Entregas**: Remoção de artefatos de debug órfãos e scripts legados de recuperação manual.
- **Validação**: Remoção física e verificação de imports seguros.

### 16. Sprint IA de Conteúdo Admin
- **Commit Funcional**: `4869a7d`
- **Commit Checkpoint**: `9335fb7`
- **Entregas**: Geração de descrições e títulos de pratos por IA integrada no painel administrativo.
- **Validação**: Testes integrados com mocks para a API do Gemini e validação de chaves.

### 17. Sprint Nutri / Prescrição
- **Commit Funcional**: `a4cee6e`
- **Commit Checkpoint**: `b307fba`
- **Entregas**: Módulo clínico e de prescrição nutricional, prontuários de pacientes e planos alimentares.
- **Validação**: Testes de validação clínica e typecheck passando.

### 18. Sprint Checkout / Cart / Orders
- **Commit Funcional**: `02624e6`
- **Commit Checkpoint**: `419fb3d`
- **Entregas**: Proteção e validação do fluxo de checkout do visitante (guest checkout) e carrinho no backend.
- **Validação**: Regressões em `guest-checkout.spec.ts` e `commercial.spec.ts`.

### 19. Sprint Admin Orders / Operação Interna
- **Commit Funcional**: `8e59401`
- **Commit Checkpoint**: `3d973d9`
- **Entregas**: Edição administrativa de pedidos, fluxo de reembolso e alteração de status operacional.
- **Validação**: Testes unitários de regras comerciais de pedidos passando.

### 20. Sprint Catálogo / Produtos / Pacotes / Tamanhos
- **Commit Funcional**: `7fa7385`
- **Commit Checkpoint**: `9c8aa2b`
- **Entregas**: Unificação do validador de slots de pacotes entre frontend e backend. Prevenção de slot sem prato.
- **Validação**: Testes de integridade em `package-config-validator.spec.ts`.

### 21. Sprint Admin Geral / Settings / Users / Payment / Loyalty
- **Commit Funcional**: `4b2d136`
- **Commit Checkpoint**: `b2e98c9`
- **Entregas**: Centralização de configurações da loja, controle de regras de desconto gerais e métodos de pagamento.
- **Validação**: Validação das mutations do admin e testes de regras do tRPC.

### 22. Sprint Home / UX / Layout / Tema / Navegação
- **Commit Funcional**: `df1f674`
- **Commit Checkpoint**: `90703d2`
- **Entregas**: Menu mobile de navegação inferior responsivo, temas customizáveis e ErrorBoundaries de UI e root.
- **Validação**: Verificação em múltiplos dispositivos e testes das barreiras de erro.

### 23. Sprint Media / Uploads / Assets / Image Picker
- **Commit Funcional**: `7304f77`
- **Commit Checkpoint**: `e9d55a3`
- **Entregas**: Centralização de galeria de mídia no MediaLibraryDrawer e ImagePicker genérico. Bloqueios de esquemas e path traversal em `resolveImageUrl`.
- **Validação**: Suíte `media-picker-refactor.spec.ts` e script seguro `server/audit_media.ts` executado.

### 24. Sprint Infra / Workers / Versionamento / Observabilidade
- **Commit Funcional**: `37c1a5f`
- **Commit Checkpoint**: `c05b649`
- **Entregas**: Middleware de request-id, versionamento no Express/tRPC com cache-bust, guards de SDK/GTM e isolamento de inicialização automática de workers.
- **Validação**: Testes unitários em `version-check.spec.ts`, `observability.spec.ts` e `health.spec.ts`.
