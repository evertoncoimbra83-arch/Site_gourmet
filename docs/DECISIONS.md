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

### 9. Token de Vinculação Temporário Assinado (linkingToken)
* **Contexto**: No fluxo de vinculação de conta Google a um usuário já autenticado, o callback do Google redireciona o usuário para a aplicação. Como o authorization code do Google é de uso único, não é possível re-validá-lo no backend em duas etapas diferentes (callback e confirmação). Persistir dados temporários de vinculação pendente no banco de dados geraria complexidade de escrita e necessidade de limpeza de registros órfãos.
* **Decisão**: Criação de um token assinado criptograficamente no backend (`linkingToken` usando HMAC SHA256 com a chave de segredo do app). O token encapsula os dados da conta Google verificada (`userId`, `provider`, `providerUserId`, `email`, `expiresAt`) de forma inviolável.
* **Consequências**: Fluxo de vinculação em duas etapas extremamente leve e seguro. O frontend recebe o token no callback, exibe o modal de confirmação visual ao usuário e envia o token de volta na confirmação. O backend valida a assinatura do token e conclui o vínculo sem tocar no banco de dados para armazenar estados temporários.

---

## 🚀 Decisões de Governança de Código e Processos de Sanitização

### 10. Staging Seletivo Obrigatório
* **Contexto**: Risco de misturar código de diferentes frentes de trabalho ou incluir dados sensíveis/arquivos de build de forma não controlada no repositório.
* **Decisão**: Proibição terminante do uso de `git add .` e `git add -A`. Todo e qualquer arquivo deve ser adicionado explicitamente ao index do Git especificando seu caminho.
* **Consequências**: Isolamento completo dos escopos de cada sprint de estabilização.

### 11. Separação de Commits Funcionais e Documentações
* **Contexto**: Dificuldade de auditar o diff de alteração lógica do sistema caso documentações de auditoria e logs técnicos fossem misturados na mesma gravação.
* **Decisão**: Realizar commits funcionais puros de lógica e, em seguida, commits isolados contendo apenas os documentos de checkpoints e logs de sprint (`docs/checkpoints/**`).
* **Consequências**: Rastreabilidade limpa e clareza no histórico do Git.

### 12. Sanitização Permanente da Pasta `dist/`
* **Contexto**: O processo de build de produção gera arquivos minificados e empacotados que, se adicionados ao Git, causam ruído nos logs e conflitos na mesclagem de branches.
* **Decisão**: Manter o diretório `dist/` estritamente limpo e restaurado após cada execução de build de validação local.
* **Consequências**: Repositório livre de artefatos compilados poluentes.

---

## 🛒 Decisões de Negócio, Carrinho e UX

### 13. Cálculo Comercial Autoritativo no Backend
* **Contexto**: Risco de fraude ou inconsistências matemáticas caso o cálculo de descontos, fretes e preços totais do carrinho fosse executado apenas no cliente (client-side).
* **Decisão**: O frontend envia apenas a intenção de compra, cabendo unicamente ao backend no tRPC recalcular todas as somas de forma autoritativa consultando as tabelas reais do banco de dados.
* **Consequências**: Processo de checkout robusto, inviolável e consistente.

### 14. Isolamento Transacional na SuccessPage
* **Contexto**: A página de sucesso (`SuccessPage`) é um componente puramente visual de feedback pós-compra. Se ela executasse requisições ou mutations de persistência de pedido, poderia causar duplicidade transacional por recarregamento da página.
* **Decisão**: A SuccessPage apenas consome dados de leitura do pedido já fechado, sem realizar ações comerciais ou disparar novas mutations de banco.
* **Consequências**: UX livre de reentradas comerciais.

### 15. Separação Visual do FloatingCartFooter
* **Contexto**: Exibição da barra flutuante de carrinho nas páginas storefront.
* **Decisão**: O componente é implementado puramente como elemento de interface visual (layout), sem acoplamento a regras comerciais ou lógicas de cupons locais.
* **Consequências**: Alta responsividade visual sem interferência na segurança transacional do carrinho.

---

## 📁 Decisões de Mídia e Segurança de Assets

### 16. Substituição do Picker de Mídia Legado
* **Contexto**: Existência do antigo `MediaPickerModal.tsx` com lógica ineficiente e dispersa de seleção de imagens.
* **Decisão**: Remoção completa do arquivo obsoleto e substituição integral pelo novo fluxo centralizado `MediaLibraryDrawer` / `MediaLibraryModal` que se comunica diretamente com a API do Cloudinary.
* **Consequências**: Redução de complexidade e zero imports órfãos no frontend.

### 17. Helper de Resolução de Imagem Defensivo (`shared/utils/image-url.ts`)
* **Contexto**: Risco de injeção XSS por caminhos ou dados de imagens alterados via parâmetros do usuário.
* **Decisão**: Criação de validador estrito que barra esquemas inseguros (`javascript:`, `file:`), detecta path traversal (`..`, `\`, `%2e%2e`, etc.), valida `data:` URIs apenas para tipos de imagem e inspeciona SVGs de forma agressiva (bloqueando scripts, iframes e listeners de eventos).
* **Consequências**: Exibição de assets blindada e imune a ataques de segurança client-side.

---

## ⚙️ Decisões de Infraestrutura, Workers e Monitoramento

### 18. Inicialização Segura de Workers
* **Contexto**: Chamar arquivos de workers causava efeitos colaterais imediatos de inicialização de filas e listeners em qualquer importação, inviabilizando testes isolados.
* **Decisão**: Restringir o bootstrapping dos workers em `server/workers/index.ts` sob a checagem da variável de ambiente `process.env.WORKER_PROCESS === "true"`.
* **Consequências**: Importação limpa, livre de efeitos colaterais e isolamento nos testes.

### 19. Request ID Isolado para Rastreamento
* **Contexto**: Integração de um ID único de correlação para identificar fluxos assíncronos no Express/tRPC.
* **Decisão**: O `requestId` gerado pelo middleware serve exclusivamente para log e auditoria interna, sendo explicitamente vedado seu uso como token de sessão ou autenticação.
* **Consequências**: Rastreabilidade aprimorada sem riscos de escalada de privilégios.

### 20. Geração Local de Versão (`generate-version.js`)
* **Contexto**: Controle de Cache-Busting no frontend para forçar a atualização dos clientes em navegadores sem loops infinitos de recarregamento.
* **Decisão**: Um script puramente local lê o `package.json` e o hash curto do git, gravando um `version.json` estático e gerando o `build-info.ts` estritamente na compilação, sem tocar em banco de dados ou redes externas.
* **Consequências**: Gerenciamento de versão determinístico e seguro contra loop de reload no cliente.
