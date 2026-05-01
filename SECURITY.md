# 🔒 Guia de Segurança - Gourmet Saudável

## ⚠️ VULNERABILIDADE CRÍTICA CORRIGIDA

### Problema Identificado
O arquivo `server/_core/context.ts` continha uma **"Chave Mestra" de desenvolvimento** que:
- ✗ Permitia acesso como ADMIN sem login em ambiente de desenvolvimento
- ✗ Criava usuário falso com permissões administrativas
- ✗ Bypassava toda a autenticação OAuth
- ✗ Poderia ser esquecida em produção

### Solução Implementada
1. **Removida a chave mestra** completamente
2. **Implementada autenticação segura** em `context-secure.ts`
3. **Adicionados middlewares de segurança** em `security-middleware.ts`
4. **Implementado rate limiting** para proteção contra ataques
5. **Adicionados headers de segurança** HTTP

---

## 🔐 Arquitetura de Segurança

### 1. Autenticação (OAuth)
```
Cliente → Login → Manus OAuth → Token → Cookie Seguro
                                           ↓
                                    Validação em cada requisição
```

**Características:**
- ✅ OAuth 2.0 com Manus
- ✅ Tokens JWT assinados
- ✅ Cookies HttpOnly (não acessíveis via JavaScript)
- ✅ Cookies Secure (apenas HTTPS em produção)
- ✅ SameSite=None para cross-origin

### 2. Autorização (Roles)
```
User (padrão) → Pode usar o sistema
Admin → Pode gerenciar tudo
```

**Verificação em procedures tRPC:**
```typescript
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
```

### 3. Proteção de Headers HTTP
| Header | Valor | Proteção |
|--------|-------|----------|
| X-Frame-Options | SAMEORIGIN | Clickjacking |
| X-Content-Type-Options | nosniff | MIME sniffing |
| X-XSS-Protection | 1; mode=block | XSS |
| Content-Security-Policy | Restritiva | Injeção de código |
| Referrer-Policy | strict-origin-when-cross-origin | Vazamento de dados |

### 4. Rate Limiting
- **Limite:** 100 requisições por 15 minutos por IP
- **Resposta:** HTTP 429 (Too Many Requests)
- **Headers informativos:** X-RateLimit-* 

### 5. Logging de Segurança
- ✅ Falhas de autenticação registradas
- ✅ Tentativas de rate limit registradas
- ✅ IP e User-Agent capturados
- ✅ Status HTTP >= 400 registrado

---

## 📋 Checklist de Segurança

### Antes de Produção
- [ ] Remover  de dados sensíveis
- [ ] Ativar HTTPS em produção
- [ ] Configurar CORS corretamente
- [ ] Usar variáveis de ambiente para secrets
- [ ] Ativar CSRF protection se necessário
- [ ] Configurar backup do banco de dados
- [ ] Implementar WAF (Web Application Firewall)
- [ ] Fazer teste de penetração
- [ ] Revisar permissões de banco de dados

### Em Produção
- [ ] NODE_ENV=production
- [ ] Monitorar logs de segurança
- [ ] Alertas para múltiplas falhas de auth
- [ ] Rotação de secrets regularmente
- [ ] Atualizações de segurança de dependências
- [ ] Testes de segurança periódicos

---

## 🚨 Incidentes de Segurança

### Como Reportar
1. **NÃO publique em issues públicas**
2. Envie email para: [seu-email-segurança]
3. Inclua: descrição, passos para reproduzir, impacto

### Resposta a Incidentes
1. Investigação imediata
2. Patch de segurança
3. Comunicação aos usuários afetados
4. Post-mortem e melhorias

---

## 🔧 Configuração de Ambiente

### Variáveis Obrigatórias
```bash
NODE_ENV=production              # Nunca use "development" em produção
DATABASE_URL=mysql://...         # Conexão segura ao banco
JWT_SECRET=<chave-forte>         # Mínimo 32 caracteres aleatórios
OAUTH_SERVER_URL=https://...     # URL do servidor OAuth
VITE_OAUTH_PORTAL_URL=https://...# URL do portal OAuth
```

### Variáveis Recomendadas
```bash
LOG_LEVEL=warn                   # Não use "debug" em produção
RATE_LIMIT_WINDOW=900000         # 15 minutos em ms
RATE_LIMIT_MAX_REQUESTS=100      # Máximo por janela
```

---

## 📚 Boas Práticas

### 1. Validação de Input
```typescript
// ✅ BOM - Validação com Zod
const userInput = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(150),
}).parse(input);

// ❌ RUIM - Sem validação
const email = req.body.email;
```

### 2. Sanitização de Output
```typescript
// ✅ BOM - HTML escapado
<div>{user.name}</div> // React faz isso automaticamente

// ❌ RUIM - HTML raw
<div dangerouslySetInnerHTML={{__html: user.name}} />
```

### 3. Senhas (se implementar)
```typescript
// ✅ BOM - Hash com salt
import bcrypt from "bcrypt";
const hash = await bcrypt.hash(password, 10);

// ❌ RUIM - Sem hash
const hash = password;
```

### 4. Dados Sensíveis
```typescript
// ✅ BOM - Nunca log de senhas/tokens


// ❌ RUIM - Expõe dados sensíveis

```

### 5. Erros
```typescript
// ✅ BOM - Erro genérico para usuário
throw new TRPCError({ 
  code: "UNAUTHORIZED",
  message: "Invalid credentials"
});

// ❌ RUIM - Expõe detalhes do sistema
throw new Error("User not found in database at row 42");
```

---

## 🔍 Testes de Segurança

### Testar Autenticação
```bash
# Sem token - deve falhar
curl http://localhost:3000/api/trpc/admin.dashboard

# Com token inválido - deve falhar
curl -H "Cookie: session=invalid" http://localhost:3000/api/trpc/admin.dashboard
```

### Testar Rate Limiting
```bash
# Fazer 101+ requisições em 15 minutos
for i in {1..110}; do
  curl http://localhost:3000/api/trpc/auth.me
done
# Requisição 101+ deve retornar 429
```

### Testar Headers de Segurança
```bash
curl -I http://localhost:3000/
# Verificar presença de:
# X-Frame-Options
# X-Content-Type-Options
# X-XSS-Protection
# Content-Security-Policy
```

---

## 📖 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OAuth 2.0 Security](https://tools.ietf.org/html/rfc6749)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## ✅ Status de Segurança

| Item | Status | Última Verificação |
|------|--------|-------------------|
| Autenticação OAuth | ✅ Implementado | 2024-12-01 |
| Rate Limiting | ✅ Implementado | 2024-12-01 |
| Headers de Segurança | ✅ Implementado | 2024-12-01 |
| Validação de Input | ✅ Implementado | 2024-12-01 |
| Logs de Segurança | ✅ Implementado | 2024-12-01 |
| CSRF Protection | ⏳ Opcional | - |
| WAF | ❌ Não implementado | - |
| Teste de Penetração | ❌ Não realizado | - |

---

**Última atualização:** 2024-12-01  
**Versão:** 1.0  
**Responsável:** Security Team
