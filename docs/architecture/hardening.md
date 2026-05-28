# Arquitetura de Hardening e Resiliência Operacional — Gourmet Saudável

Este documento resume a infraestrutura de blindagem contra falhas catastróficas, vazamento de PII e colapsos de memória.

---

## 🎯 Objetivo
Prevenir a interrupção das vendas (Emergency Mode), impedir o estouro de memória no servidor (Backups compactados) e assegurar conformidade com a LGPD em exclusões (Soft Delete e Anonimização).

---

## 📁 Arquivos Principais
* [users.ts (Admin Router)](file:///f:/Site_React/server/routers/admin/users.ts) — Implementação segura do Soft Delete e anonimização de PII.
* [adminStoreSettingsRouter.ts](file:///f:/Site_React/server/routers/admin/adminStoreSettingsRouter.ts) — Lógica de Emergency Mode e geração de backups com compactação em gzip.
* [backups.ts](file:///f:/Site_React/server/routers/admin/backups.ts) — Utilitários de dumping de banco de dados por streams.
* [operational-hardening.ts](file:///f:/Site_React/server/routers/admin/operational-hardening.ts) — Declaração dos limites financeiros máximos e barreiras de confirmação forte.

---

## 🟢 Estado Atual
* **Soft Delete**: A exclusão lógica de usuários limpa perfil/endereços sensíveis, e anonimiza e-mail (`deleted-{id}@gourmetsaudavel.local`), CPF, nome e telefone, preservando chaves estrangeiras de orders e loyalty.
* **Emergency Mode (Panic Button)**: Permite travar/liberar o checkout globalmente através do banco, registrando log crítico de auditoria com diff *before/after*.
* **Backup Seguro**: Utiliza `mysqldump` canalizado para `gzip` streamando diretamente para o arquivo `/var/backups`, sem ler o conteúdo bruto na RAM do Node.
* **Limites Financeiros & Confirmação**: Bloqueia no backend qualquer transação que exceda limites (cupons $> 70\%$, descontos de pagamento $> 30\%$, frete $> R\$\ 500$). Transações críticas intermediárias exigem digitação do token literal `CONFIRMAR` e justificativas de no mínimo 8 caracteres.

---

## 🚨 Riscos Conhecidos
* **Shadowing de handleSave**: Identificado shadow de `handleSave` no view de métodos de pagamento do frontend que bypassa o prompt de confirmação local, causando rejeição do backend se o desconto exceder 10%.
* **Falta de Confirmação na Limpeza de Carrinhos**: A ação de limpeza de carrinhos antigos no frontend não chama `requestStrongConfirmation()`, fazendo com que a mutation falhe silenciosamente no backend por falta de token.
* **Prompts Síncronos**: `window.prompt` trava a thread de execução do navegador.

---

## 🔮 Próximos Passos
* Corrigir os bugs de UX no frontend e remover o shadowing da View de métodos de pagamento.
* Migrar os prompts de confirmação fortes síncronos para diálogos React personalizados (modais).
