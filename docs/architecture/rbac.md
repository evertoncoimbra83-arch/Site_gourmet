# Arquitetura de Controle de Acesso (RBAC) — Gourmet Saudável

Este documento resume a infraestrutura de perfis e permissões da plataforma.

---

## 🎯 Objetivo
Garantir que usuários, nutricionistas, parceiros e administradores executem ações estritamente condizentes com seus papéis, protegendo o backend como a autoridade real de segurança.

---

## 📁 Arquivos Principais
* [rbac.ts (Shared)](file:///f:/Site_React/shared/security/rbac.ts) — Definição dos perfis (`super_admin`, `admin`, `operator`, `user`, `nutri`), permissões e utilitários de checagem.
* [trpc.ts (Core)](file:///f:/Site_React/server/_core/trpc.ts) — Middlewares `requireRoles` que impõem o controle de acesso nos endpoints tRPC.
* [ProtectedRoute.tsx](file:///f:/Site_React/client/src/components/ProtectedRoute.tsx) — Componente frontend que bloqueia a renderização de caminhos restritos.
* [AdminLayout.tsx](file:///f:/Site_React/client/src/components/AdminLayout.tsx) — Renderiza a barra lateral ocultando dinamicamente links proibidos via `hasAdminPermission`.

---

## 🟢 Estado Atual
* Três níveis de controle administrativo operando:
  * `super_admin`: Acesso total e privilégios destrutivos (backups, remoção de pedidos, estornos em massa).
  * `admin`: Gestão operacional (cupons, catálogo, regras de desconto).
  * `operator`: Visualização e operações comerciais diárias (PDV, fluxo de pedidos).
* O backend atua como autoridade real: se um operador forçar uma requisição tRPC para criar cupons, o middleware do tRPC o rejeitará.

---

## 🚨 Riscos Conhecidos
* **Administrador Criado Manualmente**: A tabela de usuários não impede a atribuição manual de roles no banco. A criação de admins deve ser rigidamente controlada e auditada pelo `AuditLogService`.

---

## 🔮 Próximos Passos
* Implementar reautenticação (exigir senha) no perfil para alterar permissões e gerenciar outros usuários administradores.
* Criar interface gráfica para o `super_admin` monitorar e gerenciar papéis de forma visual.
