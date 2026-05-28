# Registro de Decisões de Arquitetura (ADR) — Gourmet Saudável

Este documento reúne as decisões arquiteturais fundamentais adotadas no desenvolvimento do Gourmet Saudável, explicando o contexto, a escolha e as consequências de cada decisão.

---

## 🔑 Decisões de Identidade, Autenticação e Sessão

### 1. Lucia Auth
* **Contexto**: Necessidade de um gerenciador de sessões e cookies seguro, modular e com suporte nativo a Drizzle ORM/MySQL sem acoplamento rígido a frameworks (como NextAuth).
* **Decisão**: Adoção do **Lucia Auth** v3+. O Lucia armazena sessões físicas no banco de dados na tabela `sessions`, gerenciando de forma transparente o ciclo de vida dos cookies.
* **Consequências**: Facilita o mapeamento de metadados na sessão (ex: `guestId`, `referralCode`) e possibilita a invalidação remota e rastreabilidade de acessos.

### 2. Argon2 para Hashing de Senhas
* **Contexto**: Adoção de um algoritmo de hash de senhas de última geração para blindar o banco contra brute-force de GPUs em caso de vazamento.
* **Decisão**: Uso da biblioteca `@node-rs/argon2` para hashing e verificação.
* **Consequências**: Proteção superior em comparação com bcrypt clássico, com controle de consumo de memória e threads no backend Node.

### 3. Tabela Separada para Contas OAuth (`user_oauth_accounts`)
* **Contexto**: Preparação para login social (Google) com o requisito de suportar múltiplos provedores por usuário no futuro e evitar o risco de Account Takeover por e-mails idênticos não verificados.
* **Decisão**: Criação da tabela independente `user_oauth_accounts` com chaves estrangeiras vinculadas à tabela `users`. O fluxo OAuth exige verificação de e-mail (`email_verified` no ID Token) antes de realizar a associação.
* **Consequências**: Arquitetura limpa que suporta múltiplos logins para um mesmo ID de usuário local, mantendo a autenticação de e-mail/senha local isolada e protegida.

---

## 📈 Decisões de Auditoria e Logs

### 4. AuditLogService
* **Contexto**: Necessidade de gravar trilhas de auditoria das ações administrativas para compliance de segurança e depuração de falhas de negócios.
* **Decisão**: Criação do serviço centralizado `AuditLogService` que persiste logs operacionais e logs de erros de forma higienizada (filtrando CPFs, e-mails originais, senhas e imagens).
* **Consequências**: Registro de diffs estruturados (before/after), permitindo o rastreio visual completo de quem alterou o quê no sistema, correlacionado por `requestId`.

### 5. RBAC em Três Níveis (`super_admin` / `admin` / `operator`)
* **Contexto**: Diferenciação de permissões de escrita entre operadores comerciais, gerentes administrativos e o perfil de infraestrutura/desenvolvimento.
* **Decisão**: Divisão em `super_admin` (acesso total e ações destrutivas/infraestrutura), `admin` (gestão de catálogo, cupons e marketing), e `operator` (gestão comercial diária de pedidos e PDV).
* **Consequências**: Blindagem real por RBAC no backend. Menus e botões são omitidos no frontend para melhorar a experiência do usuário, mas a segurança é imposta de maneira absoluta em nível de API tRPC.

---

## 🛡️ Decisões de Resiliência e Blindagem (Hardening)

### 6. CSRF via Double-Submit Cookie
* **Contexto**: Proteção contra ataques de falsificação de requisições em navegadores modernos que usam chamadas assíncronas do tRPC.
* **Decisão**: Implementação de token CSRF no cookie `gourmet_csrf_token` acessível pelo client, que deve reenviar o token no header `x-csrf-token` para validação em mutations HTTP.
* **Consequências**: Bloqueio ativo de requisições de origem cruzada sem exigir persistência de tokens no estado do servidor.

### 7. Soft Delete de Usuários
* **Contexto**: Contas de usuários que possuem histórico de pedidos e fidelidade não podem sofrer exclusão física no banco de dados, sob risco de quebrar restrições de chaves estrangeiras (FK) ou comprometer a consistência de relatórios financeiros de fechamento.
* **Decisão**: Uso de soft delete via campo `deletedAt`. Os dados de identificação pessoal (PII) do usuário excluído são anonimizados em conformidade com a LGPD (e-mail passa para `deleted-{id}@gourmetsaudavel.local`, senha e CPFs zerados), enquanto as tabelas dependentes de PII (`user_profiles` e `user_addresses`) são apagadas fisicamente.
* **Consequências**: Integridade referencial preservada e conformidade regulatória atingida.

### 8. Backup Streamado e Compactado em Gzip
* **Contexto**: A exportação do banco de dados gerando dumps JSON gigantes na RAM do servidor causava riscos de falta de memória (OOM Crashes) em instâncias de servidores pequenos.
* **Decisão**: Uso do comando `mysqldump` canalizado em pipeline de streaming direto para o utilitário `gzip` no disco `/var/backups`. O frontend baixa o arquivo de forma nativa e sob demanda via stream do Express.
* **Consequências**: Consumo de memória RAM reduzido para próximo de zero, independentemente do tamanho do banco de dados.
