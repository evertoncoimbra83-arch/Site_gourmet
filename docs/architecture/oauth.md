# Modelagem de Integração OAuth / Login Social — Gourmet Saudável

Este documento descreve a modelagem arquitetural e de segurança recomendada para suportar Google Login e outros provedores de autenticação social.

---

## 🎯 Objetivo
Permitir que usuários façam login e se cadastrem usando provedores externos sem abrir brechas para ataques de sequestro de conta (Account Takeover) e mantendo a integridade referencial de carrinhos e indicações.

---

## 🟢 Estado Atual
* **Pendente de Implementação**: O suporte a OAuth ainda não foi codificado, mas a arquitetura de dados e as regras de segurança estão completamente mapeadas e prontas no roadmap.

---

## 🗄️ Modelo de Dados Recomendado
Criação da tabela independente `user_oauth_accounts`:

```typescript
export const userOauthAccounts = mysqlTable("user_oauth_accounts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(), // ex: "google"
  providerUserId: varchar("provider_user_id", { length: 255 }).notNull(), // "sub" do Google
  providerEmail: varchar("provider_email", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  lastLoginAt: timestamp("last_login_at"),
}, (table) => ({
  providerIdx: index("provider_lookup_idx").on(table.provider, table.providerUserId),
  userLinkIdx: index("user_oauth_link_idx").on(table.userId),
}));
```

---

## 🚨 Regras de Segurança contra Takeover
1. **Confiança Zero em E-mail Não Verificado**:
   * O sistema deve inspecionar a propriedade `email_verified` retornada no JWT do Google. Se for `false`, o login automático ou vinculação por e-mail deve ser **bloqueado**, exigindo a reautenticação com senha local do usuário.
2. **Prevenção de Sequestro (Takeover)**:
   * Se um e-mail verificado coincidir com um usuário existente no banco local, a vinculação automática de OAuth só ocorrerá se o fluxo originar-se de um login social bem-sucedido e o usuário passar pela verificação local correspondente.
3. **Bloqueio de Contas Sociais Duplicadas**:
   * Uma conta de provedor (`provider` + `providerUserId`) não pode ser vinculada a múltiplos usuários locais, sob pena de violar a exclusividade de identidades.
4. **Proteção contra Lockout**:
   * A desvinculação de uma conta OAuth no painel logado do perfil só deve ser permitida se o usuário possuir **outro método de login configurado** (uma senha Argon2 local ou outro provedor conectado). Se for o último, o sistema bloqueia a desvinculação.

---

## 🔮 Próximos Passos (Sprints)
* **Sprint OAuth P1**: Criar tabela `user_oauth_accounts` e rotas de callback integrando a validação de state, nonce e PKCE code_verifier.
* **Sprint OAuth P2**: Integrar botão "Continuar com Google", auto-registro e promoção automática de carrinhos/indicações de convidados.
* **Sprint OAuth P3**: Disponibilizar painel de conexões no perfil logado.
