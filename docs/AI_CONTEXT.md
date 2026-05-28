# Contexto de IA e Diretrizes de Engenharia — Gourmet Saudável

Este documento serve como a memória permanente de arquitetura e regras gerais para que agentes de IA (como Codex, Antigravity, Aider) e engenheiros novos compreendam rapidamente os limites e o estado técnico do projeto.

---

## 🏗️ Arquitetura Atual

O sistema é construído como uma aplicação TypeScript monorreferencial:
1. **Frontend**: Vite React SPA contido na pasta [client/](file:///f:/Site_React/client) que se comunica com o backend via tRPC Client. A interface utiliza componentes CSS modernos e reutilizáveis baseados no design system local.
2. **Backend**: Servidor Express com tRPC API contido na pasta [server/](file:///f:/Site_React/server). 
3. **Persistência & ORM**: Drizzle ORM sobre MySQL/MariaDB. O schema de dados está em [drizzle/schema/](file:///f:/Site_React/drizzle/schema).
4. **Segurança de PII**: Criptografia simétrica com chave `DB_ENCRYPTION_KEY` para dados pessoais (Nomes, CPFs, Telefones) na base. A busca é feita por chaves cegas (`piiHash`) e termos normalizados de busca gerados antes da escrita.
5. **Autenticação & Sessões**: Gerido por **Lucia Auth** com adapter Drizzle. O estado da sessão utiliza cookies seguros e tratamento dinâmico para ambientes de desenvolvimento local.
6. **Logs & Auditoria**: Centralizado no [AuditLogService.ts](file:///f:/Site_React/server/services/AuditLogService.ts) que grava logs operacionais (before/after) e captura de erros estruturados no banco.

---

## 🔑 Regras de Ouro (O que não fazer / O que fazer)

* **Banco de Dados**: 
  * **NÃO** execute `db:push` em produção nem rode alterações diretas no banco de dados. 
  * **Sempre** gere e revise migrações na pasta [drizzle-migrations/](file:///f:/Site_React/drizzle-migrations) usando Drizzle Kit.
* **Segurança e Variáveis**: 
  * **JAMAIS** salve chaves de API, segredos ou senhas nos arquivos de documentação, arquivos de código fonte ou commits. Utilize o `.env` ou `.env.local` que estão ignorados no git.
* **Integridade Operacional**:
  * **NÃO** realize deletes físicos para registros do sistema que possuam chaves estrangeiras vinculadas (como `users` vinculados a pedidos). Utilize sempre o padrão de **Soft Delete** (exclusão lógica por data) e anonimização LGPD.
  * **Sempre** integre as mutations críticas e financeiras (Loyalty, Cupons, Métodos de Pagamento, Alterações de Pedidos e Configurações) com a barreira de **Confirmação Forte** e logs estruturados.

---

## 🚨 Riscos Conhecidos

1. **Janela de Confirmação Síncrona**: O frontend atualmente utiliza `window.prompt` e `window.confirm` para coletar o token literal `CONFIRMAR` e a justificativa operacional. Isso bloqueia temporariamente a thread principal de renderização do navegador. prompts nativos devem virar modais React futuramente.
2. **Backups Streamados**: Embora o mysqldump e gzip streamem direto para o arquivo sem explodir o uso de RAM do backend, bases excessivamente massivas podem causar picos de I/O em discos locais lentos.
3. **Mapeamento de E-mails**: O endpoint `checkUserExists` permite descobrir se um e-mail já está cadastrado na base, possibilitando ataques de enumeração.
4. **Desalinhamento de Drizzle Migrations**: O Drizzle Kit tenta gerar alterações fora do escopo (como a coluna `orders.origin_scan_id` e recriação de índices de `audit_logs`). É necessária atenção na higienização manual das migrations locais.
5. **OAuth Pendente**: A infraestrutura de autenticação está preparada (arquitetura e account linking mapeados), mas o suporte a Google Login/OAuth ainda não foi implementado.

---

## 🛠️ Comandos Padrão de Validação

Sempre valide suas modificações localmente antes de submeter PRs:
* **Checagem de Tipos TypeScript**: `pnpm check` (roda `tsc --noEmit`).
* **Testes de Backend (Vitest)**: `pnpm test:run` (executa os testes de cobertura uma vez).
* **Compilação de Produção**: `pnpm build` (empacota o client via Vite e bundle de servidor).