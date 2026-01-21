# 🛠️ Guia de Manutenção e Controle do Projeto

## 📋 Índice

1. [Checklist de Inicialização](#checklist-de-inicialização)
2. [Monitoramento Diário](#monitoramento-diário)
3. [Tarefas Semanais](#tarefas-semanais)
4. [Tarefas Mensais](#tarefas-mensais)
5. [Troubleshooting](#troubleshooting)
6. [Backup e Recuperação](#backup-e-recuperação)
7. [Escalabilidade](#escalabilidade)

---

## ✅ Checklist de Inicialização

### Antes de Iniciar o Servidor

- [ ] Variáveis de ambiente configuradas (.env)
- [ ] Banco de dados criado e acessível
- [ ] Migrations aplicadas (`npm run db:push`)
- [ ] Usuário admin criado
- [ ] Node.js v22+ instalado
- [ ] pnpm instalado (`npm install -g pnpm`)

### Ao Iniciar o Servidor

```bash
# 1. Instalar dependências
npm install

# 2. Aplicar migrations
npm run db:push

# 3. Criar usuário admin (se não existir)
# Via phpMyAdmin ou SQL direto

# 4. Iniciar servidor
npm run dev

# 5. Verificar logs
# Deve aparecer:
# 🚀 Server running on http://localhost:3000/
# 🔒 Security middleware ativado
# 🔐 Autenticação OAuth obrigatória
```

### Verificação Inicial

- [ ] Frontend carrega em http://localhost:3000/
- [ ] Header mostra botão "Entrar"
- [ ] Botão "Entrar" redireciona para OAuth
- [ ] Banco de dados está acessível
- [ ] Não há erros no console (F12)

---

## 📊 Monitoramento Diário

### Logs para Verificar

#### 1. **Erros de Autenticação**
```
[AUTH] Falha de autenticação | IP: ...
```
**O que fazer:** Verificar se OAuth está configurado corretamente

#### 2. **Erros de Banco de Dados**
```
[Database] Failed to connect: ...
```
**O que fazer:** Verificar DATABASE_URL e credenciais

#### 3. **Erros de Rate Limiting (Produção)**
```
[RATE_LIMIT] Limite excedido | IP: ...
```
**O que fazer:** Normal em produção, verificar se não é ataque

#### 4. **Erros de Segurança**
```
[SECURITY] ...
```
**O que fazer:** Revisar SECURITY.md

### Checklist Diário

- [ ] Servidor está rodando sem erros
- [ ] Banco de dados está acessível
- [ ] Login funciona
- [ ] Carrinho funciona
- [ ] Admin panel acessível
- [ ] Sem erros críticos nos logs

---

## 📅 Tarefas Semanais

### Segunda-feira
- [ ] Revisar logs da semana anterior
- [ ] Verificar performance do servidor
- [ ] Backup manual do banco de dados

### Quarta-feira
- [ ] Testar fluxo de compra completo
- [ ] Verificar integridade dos dados
- [ ] Revisar pedidos criados

### Sexta-feira
- [ ] Revisar estatísticas de uso
- [ ] Verificar espaço em disco
- [ ] Planejar melhorias

---

## 📆 Tarefas Mensais

### Primeira Semana
- [ ] Revisar e atualizar documentação
- [ ] Verificar dependências desatualizadas (`npm outdated`)
- [ ] Testar recuperação de backup

### Segunda Semana
- [ ] Análise de performance
- [ ] Otimizações identificadas
- [ ] Testes de segurança

### Terceira Semana
- [ ] Atualizar dependências menores
- [ ] Revisar código para refatoração
- [ ] Planejar novas features

### Quarta Semana
- [ ] Backup completo
- [ ] Documentação atualizada
- [ ] Relatório de status

---

## 🔧 Troubleshooting

### Problema: Servidor não inicia

**Sintoma:** `Error: listen EADDRINUSE :::3000`

**Causa:** Porta 3000 já está em uso

**Solução:**
```bash
# Encontrar processo na porta 3000
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou usar porta diferente
PORT=3001 npm run dev
```

---

### Problema: Banco de dados não conecta

**Sintoma:** `[Database] Failed to connect: ECONNREFUSED`

**Causa:** Banco de dados não está rodando ou credenciais incorretas

**Solução:**
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Testar conexão
mysql -h localhost -u user -p database_name

# Se não funcionar, verificar:
# 1. Host correto
# 2. Usuário correto
# 3. Senha correta
# 4. Banco existe
```

---

### Problema: Login não funciona

**Sintoma:** Botão "Entrar" não redireciona

**Causa:** OAuth não configurado

**Solução:**
```bash
# Verificar variáveis
echo $VITE_APP_ID
echo $VITE_OAUTH_PORTAL_URL
echo $OAUTH_SERVER_URL

# Se vazias, adicionar ao .env
VITE_APP_ID=seu_app_id
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OAUTH_SERVER_URL=https://api.manus.im

# Reiniciar servidor
npm run dev
```

---

### Problema: Erros 429 (Rate Limit)

**Sintoma:** Muitas requisições sendo bloqueadas

**Causa:** Rate limiting ativado (normal em produção)

**Solução:**
```bash
# Em desenvolvimento, desativar:
# Já está desativado no security-middleware.ts

# Em produção, aumentar limite se necessário:
# Editar server/_core/security-middleware.ts
// Linha 129: const maxRequests = 100; // aumentar se necessário
```

---

### Problema: Carrinho vazio após reload

**Sintoma:** Itens desaparecem ao recarregar página

**Causa:** localStorage não está sendo sincronizado

**Solução:**
```bash
# Verificar se localStorage está ativado
# DevTools → Application → Local Storage

# Se vazio, adicionar itens novamente
# O carrinho deve sincronizar automaticamente
```

---

### Problema: Imagens não carregam

**Sintoma:** Produtos sem imagem

**Causa:** S3 não configurado ou URL inválida

**Solução:**
```bash
# Verificar se S3 está configurado
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# Se vazio, configurar S3
# Ou usar imagens locais em /public
```

---

## 💾 Backup e Recuperação

### Backup Manual do Banco

```bash
# Fazer backup
mysqldump -h localhost -u user -p database_name > backup.sql

# Restaurar backup
mysql -h localhost -u user -p database_name < backup.sql
```

### Backup Automático (Recomendado)

```bash
# Criar script de backup
# backup.sh
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mysqldump -h localhost -u user -p database_name > backups/backup_$TIMESTAMP.sql

# Agendar para rodar diariamente
# crontab -e
# 0 2 * * * /path/to/backup.sh
```

### Recuperação de Backup

```bash
# 1. Parar servidor
npm stop

# 2. Restaurar banco
mysql -h localhost -u user -p database_name < backup.sql

# 3. Reiniciar servidor
npm run dev

# 4. Verificar integridade
# Testar login, carrinho, admin
```

---

## 📈 Escalabilidade

### Quando Escalar

Considere escalar quando:
- [ ] Mais de 1000 usuários simultâneos
- [ ] Mais de 10.000 pedidos por mês
- [ ] Tempo de resposta > 2 segundos
- [ ] Uso de CPU > 80%
- [ ] Uso de memória > 80%

### Estratégias de Escalabilidade

#### 1. **Horizontal Scaling (Múltiplos Servidores)**
```
Load Balancer
    ├── Server 1 (Node.js)
    ├── Server 2 (Node.js)
    └── Server 3 (Node.js)
         ↓
    Banco de Dados Compartilhado
```

#### 2. **Caching**
```bash
# Adicionar Redis para cache
npm install redis

# Cachear:
# - Listagem de produtos
# - Dados de usuário
# - Resultados de queries frequentes
```

#### 3. **CDN para Imagens**
```bash
# Usar CloudFlare ou AWS CloudFront
# Para servir imagens mais rápido
```

#### 4. **Database Optimization**
```sql
-- Adicionar índices
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_order_user ON orders(userId);
CREATE INDEX idx_dish_category ON dishes(category);
```

#### 5. **API Rate Limiting**
```bash
# Já implementado em security-middleware.ts
# 100 requisições por 15 minutos por IP
```

---

## 📊 Métricas Importantes

### Performance

| Métrica | Alvo | Crítico |
|---------|------|---------|
| Tempo de resposta | < 500ms | > 2000ms |
| Uptime | > 99.5% | < 95% |
| Taxa de erro | < 0.1% | > 1% |
| Uso de CPU | < 50% | > 80% |
| Uso de memória | < 60% | > 90% |

### Negócio

| Métrica | Acompanhar |
|---------|-----------|
| Usuários ativos | Diariamente |
| Pedidos por dia | Diariamente |
| Receita | Semanalmente |
| Taxa de conversão | Semanalmente |
| Satisfação do cliente | Mensalmente |

---

## 🔐 Checklist de Segurança

### Semanal
- [ ] Verificar logs de segurança
- [ ] Revisar acessos ao admin
- [ ] Verificar tentativas de login falhadas

### Mensal
- [ ] Atualizar dependências
- [ ] Revisar permissões de usuários
- [ ] Verificar backups funcionam
- [ ] Testar recuperação de senha

### Trimestral
- [ ] Auditoria de segurança
- [ ] Teste de penetração
- [ ] Revisão de políticas
- [ ] Atualização de documentação

---

## 📞 Contatos Importantes

| Serviço | Contato | Status |
|---------|---------|--------|
| Manus OAuth | api.manus.im | ✅ |
| Banco de Dados | localhost:3306 | ✅ |
| S3 Storage | AWS | ✅ |
| Email | SMTP | ⏳ |
| SMS | Twilio | ⏳ |

---

## 📝 Notas

- Sempre fazer backup antes de atualizar dependências
- Testar em desenvolvimento antes de produção
- Manter documentação atualizada
- Comunicar mudanças para a equipe

---

**Última atualização:** 2024-12-01  
**Versão:** 1.0  
**Status:** ✅ Pronto para uso
