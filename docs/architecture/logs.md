# Arquitetura de Logs e Auditoria — Gourmet Saudável

Este documento resume a infraestrutura de observabilidade e logs da plataforma.

---

## 🎯 Objetivo
Registrar todas as modificações operacionais críticas e erros técnicos de forma persistente, mascarando dados pessoais (PII) e correlacionando requisições com IDs exclusivos para garantir a rastreabilidade em investigações.

---

## 📁 Arquivos Principais
* [AuditLogService.ts](file:///f:/Site_React/server/services/AuditLogService.ts) — Serviço unificado de persistência, higienização de PII e stack trace de erros.
* [logs.ts (Admin Router)](file:///f:/Site_React/server/routers/admin/logs.ts) — Endpoints tRPC de consulta com paginação, filtros e cache com TTL.
* [AdminLogsView.tsx](file:///f:/Site_React/client/src/pages/adminLogs/view/AdminLogsView.tsx) — Interface da central de logs com Inspector e Diff visual.
* [LogDiffViewer.tsx](file:///f:/Site_React/client/src/pages/adminLogs/components/LogDiffViewer.tsx) — Componente de visualização de modificações estruturadas before/after.

---

## 🟢 Estado Atual
* Gravação automática de diffs de status de pedidos, regras de cupom, configurações e métodos de pagamento.
* Captura e higienização de stack trace (máx. 10 linhas) de erros em tRPC, rotas Express e frontend (ErrorBoundary).
* Central de Auditoria operacional com cache de 5 minutos para otimização de CPU do banco de dados na agregação de módulos.

---

## 🚨 Riscos Conhecidos
* **Crescimento Exponencial do Banco**: A tabela `audit_logs` tende a crescer muito rápido. Sem um fluxo de retenção/limpeza periódica de logs legacy, o banco de dados pode sofrer picos de IO no futuro.
* **Filtros e Busca Lentificados**: Buscas textuais em campos como `oldValues` ou `newValues` realizam scans de texto cheios. O banco possui índices na coluna `module`, `severity`, `user_id` e `created_at` para mitigar isso.

---

## 🔮 Próximos Passos
* Implementar alertas automáticos em canais de comunicação para logs de severidade `critical` (ex: Emergency Mode ativado).
* Criar uma rotina (cron job) para expurgo ou arquivamento de logs com mais de 2 anos de idade.
