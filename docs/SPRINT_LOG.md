# Diário de Sprints (Sprint Log) — Gourmet Saudável

Este diário registra o histórico de sprints executadas com suas respectivas validações, assim como o backlog ativo das próximas sprints autorizadas no roadmap técnico.

---

## 🏁 Sprints Concluídas

### 1. Sprints de Logs P1 (P1-A, P1-B, P1-C) e Error Logs P1

- **Entregas**:
  - Criação do `AuditLogService` com suporte a logs estruturados.
  - Captura de diffs _before/after_ para alterações administrativas em orders, settings, fidelidade, cupons, logística e métodos de pagamento.
  - Captura persistente de erros técnicos no Express, tRPC e frontend (ErrorBoundary com rate limit de envio).
- **Validação**: Testes unitários em [AuditLogService.spec.ts](file:///f:/Site_React/server/services/AuditLogService.spec.ts), checagem de tipos estritos e build validados.

### 2. Sprint Logs P2 (P2-A, P2-B, P2-C)

- **Entregas**:
  - Tela da Central de Auditoria (`/admin/logs`) com filtros por módulo, severidade, período, ator, e texto.
  - Log Inspector lateral mostrando diff visual colapsável para strings grandes.
  - Cópia rápida e linkagem por `requestId`.
- **Validação**: Homologação com dados mockados e em memória, paginação server-side e cache com TTL de 5m.

### 3. Sprint Security P1

- **Entregas**:
  - Proteção contra CSRF via double-submit cookie (`gourmet_csrf_token` cookie + `x-csrf-token` header).
  - Ownership de pedidos (bloqueia o carregamento de detalhes se o pedido não pertencer ao usuário autenticado).
  - Proteção do módulo de uploads e mídias de administrador.
  - Rate limiting nas rotas do Express (auth, checkout e global).
- **Validação**: Testes de regressão e fluxo de checkout validados.

### 4. Sprint RBAC P1

- **Entregas**:
  - Modelagem de perfis `super_admin`, `admin`, `operator`.
  - Middleware de backend `requireRoles` nos procedimentos tRPC.
  - Proteção de rotas com `ProtectedRoute` no frontend e ocultação automática de menus com `hasAdminPermission`.
- **Validação**: Suíte unitária [rbac.spec.ts](file:///f:/Site_React/server/security/rbac.spec.ts) passando.

### 5. Sprint Hardening P1-A (Blindagem de Infraestrutura)

- **Entregas**:
  - Adição da coluna `deletedAt` no banco com higienização manual da migração `0004` (Option A).
  - Soft delete e anonimização de usuários (e-mail modificado, senhas e PII zerados).
  - Invalidação de sessões ativas e bloqueio de logins para contas apagadas.
  - Emergency Mode e Panic Button com logs de severidade `critical`.
  - Backup streamado e comprimido em gzip (`.sql.gz`) gravado diretamente para `/var/backups` sem alocar dumps na RAM.
- **Validação**: Suíte [hardening.spec.ts](file:///f:/Site_React/server/routers/admin/hardening.spec.ts) e compilação de produção validadas.

### 6. Sprint Hardening P1-B & P1-C (Governança Financeira e UX)

- **Entregas**:
  - Limites de descontos máximos em pagamentos (30%), cupons (70%), regras de oferta (70%), fretes (R$ 500) e ajustes administrativos (80% desconto, R$ 500 frete).
  - Barreiras de Confirmação Forte no backend (`assertStrongConfirmation` de token literal `CONFIRMAR` e `confirmationReason` com justificativas de no mínimo 8 caracteres).
  - Integração frontend enviando `confirmationToken` e `confirmationReason` para os fluxos (Cupons, Settings, Fretes, Loyalty, Pedidos e Panic).
- **Validação**: Testes integrados e compilação de produção bem-sucedidos.

### 7. Sprint Auth P1 (Hardening do Login Atual)

- **Entregas**:
  - Invalidação de sessões ativas do usuário ao redefinir a senha (evita persistência de sessões zumbis).
  - Auditoria operacional detalhada via `AuditLogService` com severidades e tipos de eventos corretos para tentativas de login e reset.
- **Validação**: Compilação TypeScript de produção e testes integrados 100% OK.

### 8. Sprint OAuth P1 — Google Login (Foundation Layer)

- **Entregas**:
  - Modelagem e criação da tabela `user_oauth_accounts` com chaves estrangeiras e restrições únicas no Drizzle schema, com migração higienizada com segurança.
  - Biblioteca de suporte a PKCE (geração de verifier/challenge), State e Nonce criptográficos no backend.
  - Cliente Google com troca de código de autorização e validação completa de ID Token (issuer, audience, expiração).
  - Endpoints tRPC (`oauthStart`, `oauthCallback`, `oauthLink`) com proteção contra Account Takeover (exigência de email verificado e confirmação explícita de vinculação no perfil logado).
  - Integração completa com o `AuditLogService` para auditoria dos eventos de OAuth.
- **Validação**: Cobertura de testes unitários integrada em `oauth.spec.ts`, validação de tipos via `pnpm check` e compilação de produção via `pnpm build`.

---

## 🎯 Próximas Sprints (Backlog Ativo)

1. **Sprint Auth P2 — Gerenciamento e Histórico de Sessões**:
   - Logout remoto de outros dispositivos (invalidação em massa de sessões do mesmo usuário).
   - Alertas visuais e e-mails de aviso para novos logins detectados por IP/User Agent.
2. **Sprint OAuth P2 — Login/Cadastro Google**:
   - Fluxo de auto-registro e account linking para e-mails sociais verificados.
   - Promoção automática de carrinhos e referral de convidados.
3. **Sprint OAuth P3 — Conexões no Painel Logado**:
   - Interface de vinculação e desvinculação com proteção contra lockout (bloqueia remover se for o único método de autenticação).
