# 🔐 Guia de Implementação - Correções de Segurança

## 📋 Resumo das Mudanças

### Arquivos Criados
1. **`server/_core/context-secure.ts`** - Contexto seguro sem chave mestra
2. **`server/_core/security-middleware.ts`** - Middlewares de segurança
3. **`SECURITY.md`** - Documentação de segurança
4. **`SECURITY_IMPLEMENTATION.md`** - Este arquivo

### Arquivos a Substituir
- **`server/_core/context.ts`** ← Remover chave mestra

---

## 🔧 Passo a Passo de Implementação

### Passo 1: Backup do Arquivo Atual
```bash
cp server/_core/context.ts server/_core/context.ts.backup
```

### Passo 2: Substituir o Contexto
```bash
# Copiar o contexto seguro
cp server/_core/context-secure.ts server/_core/context.ts
```

### Passo 3: Integrar Middlewares de Segurança

No arquivo `server/_core/index.ts`, adicione:

```typescript
import { setupAllSecurityMiddleware } from "./security-middleware";

// ... código existente ...

// Aplicar middlewares de segurança ANTES das rotas
setupAllSecurityMiddleware(app);

// Depois aplicar rotas
app.use("/api/trpc", trpcMiddleware);
```

### Passo 4: Testar Localmente

```bash
# Instalar dependências (se necessário)
npm install

# Iniciar servidor
npm run dev

# Em outro terminal, testar
curl http://localhost:3000/api/trpc/auth.me
# Deve retornar erro 401 (não autenticado)
```

### Passo 5: Verificar Logs

Procure por mensagens como:
```
[AUTH] Falha de autenticação | IP: 127.0.0.1 | User-Agent: curl/7.64.1
```

---

## ✅ Verificação de Segurança

### Teste 1: Sem Autenticação
```bash
curl -v http://localhost:3000/api/trpc/auth.me
# Esperado: Erro (usuário null)
```

### Teste 2: Headers de Segurança
```bash
curl -I http://localhost:3000/
# Verificar:
# - X-Frame-Options: SAMEORIGIN
# - X-Content-Type-Options: nosniff
# - X-XSS-Protection: 1; mode=block
# - Content-Security-Policy: ...
```

### Teste 3: Rate Limiting
```bash
# Fazer 101 requisições rapidamente
for i in {1..101}; do curl http://localhost:3000/api/trpc/auth.me; done
# Requisição 101+ deve retornar 429
```

### Teste 4: Logging
```bash
# Verificar console/logs
# Deve haver mensagens de [AUTH] e [RATE_LIMIT]
```

---

## 🚨 Problemas Comuns

### Problema: "Cannot find module 'security-middleware'"
**Solução:** Certifique-se de que o arquivo está em `server/_core/security-middleware.ts`

### Problema: "user is always null"
**Solução:** Isso é correto! Faça login via OAuth para obter um usuário autenticado.

### Problema: "Rate limit muito restritivo"
**Solução:** Ajuste em `security-middleware.ts`:
```typescript
const maxRequests = 100; // Aumentar este valor
```

### Problema: "CORS errors"
**Solução:** Verifique se o CORS está configurado corretamente em `server/_core/index.ts`

---

## 📊 Comparação: Antes vs Depois

### ANTES (Inseguro)
```typescript
// ❌ PROBLEMA: Chave mestra em desenvolvimento
if (process.env.NODE_ENV === 'development' && !user) {
  user = {
    id: 999999,
    role: "admin", // ← Acesso total sem login!
    ...
  };
}
```

### DEPOIS (Seguro)
```typescript
// ✅ CORRETO: Sem bypass de autenticação
try {
  user = await sdk.authenticateRequest(opts.req);
} catch (error) {
  user = null; // Permanece null sem autenticação válida
}
```

---

## 🔐 Recursos de Segurança Implementados

| Recurso | Descrição | Status |
|---------|-----------|--------|
| **Autenticação OAuth** | Validação em todas as requisições | ✅ Ativo |
| **Rate Limiting** | 100 req/15min por IP | ✅ Ativo |
| **Headers de Segurança** | X-Frame-Options, CSP, etc | ✅ Ativo |
| **Logging de Segurança** | Registra falhas e anomalias | ✅ Ativo |
| **CSRF Protection** | Tokens CSRF (opcional) | ⏳ Disponível |
| **Input Validation** | Zod schemas | ✅ Existente |
| **Error Handling** | Mensagens genéricas | ✅ Implementado |

---

## 📚 Próximos Passos

### Curto Prazo (Esta Semana)
- [ ] Revisar e testar as mudanças
- [ ] Verificar compatibilidade com rotas existentes
- [ ] Atualizar testes unitários
- [ ] Documentar mudanças para o time

### Médio Prazo (Este Mês)
- [ ] Implementar CSRF protection se necessário
- [ ] Adicionar autenticação 2FA
- [ ] Implementar audit logs
- [ ] Fazer teste de penetração

### Longo Prazo (Este Trimestre)
- [ ] Implementar WAF
- [ ] Certificação de segurança
- [ ] Programa de bug bounty
- [ ] Revisão anual de segurança

---

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs:** `npm run dev` mostra erros em tempo real
2. **Teste a autenticação:** Faça login via OAuth
3. **Revise o SECURITY.md:** Contém troubleshooting
4. **Abra uma issue:** Com detalhes do erro

---

## ✍️ Checklist Final

- [ ] Backup do arquivo original feito
- [ ] Novo contexto copiado
- [ ] Middlewares integrados
- [ ] Servidor iniciado sem erros
- [ ] Testes de segurança passando
- [ ] Logs de segurança funcionando
- [ ] Documentação revisada
- [ ] Time informado das mudanças

---

**Data de Implementação:** 2024-12-01  
**Versão:** 1.0  
**Crítico:** ⚠️ SIM - Vulnerabilidade de segurança corrigida
