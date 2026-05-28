# Arquitetura de Autenticação e Sessões — Gourmet Saudável

Este documento resume a infraestrutura de login, sessões e cookies da plataforma.

---

## 🎯 Objetivo
Prover controle de acesso robusto, suportar cookies de sessão que expirem ao fechar o navegador por padrão, e garantir conformidade de segurança na recuperação e redefinição de senhas.

---

## 📁 Arquivos Principais
* [auth.ts (Core)](file:///f:/Site_React/server/auth.ts) — Inicialização do Lucia Auth, adapter Drizzle e promoção de carrinho guest para cliente.
* [context.ts](file:///f:/Site_React/server/_core/context.ts) — Express Context que lê cookies de sessão, invalida cookies de usuários apagados, e ajusta a flag secure dinamicamente para localhost/Wi-Fi local.
* [auth.procedures.ts](file:///f:/Site_React/server/routers/storefront/auth/auth.procedures.ts) — Mutators de login, cadastro, logout e redefinição de senhas.
* [useAuth.ts](file:///f:/Site_React/client/src/_core/hooks/useAuth.ts) — Hook React frontend que consome dados da sessão.

---

## 🟢 Estado Atual
* **Lucia Auth**: Sessões persistidas em banco de dados na tabela `sessions`.
* **Argon2**: Criptografia de senhas altamente resiliente contra ataques de brute-force.
* **Ciclo de Vida do Cookie**: Cookies são configurados para expirar ao fechar o navegador por padrão se o checkbox "Lembrar de mim" não for selecionado.
* **Segurança de Reset**: O reset de senhas gera tokens de uso único com validade de 2 horas. A redefinição de senha invalida de imediato todas as outras sessões ativas do usuário para evitar sessões zumbis persistentes.

---

## 🚨 Riscos Conhecidos
* **Enumeração de E-mails**: A busca de usuários na criação de contas e no request de reset permite inferir se um e-mail já existe na base, abrindo margem para phishing.

---

## 🔮 Próximos Passos
* Implementar na Sprint Auth P2 a exibição das sessões conectadas e a opção de limpar sessões remotas.
* Configurar alertas visuais para acessos suspeitos a partir de novos navegadores.
