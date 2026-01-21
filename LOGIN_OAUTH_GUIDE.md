# 🔐 Guia de Implementação - Login com OAuth Manus

## 📋 Resumo das Mudanças

Foram corrigidos os seguintes arquivos para implementar o login OAuth corretamente:

### ✅ Arquivos Modificados

1. **`client/src/pages/Login.tsx`** - Página de login com OAuth
2. **`client/src/components/ProtectedRoute.tsx`** - Componente para proteger rotas
3. **`client/src/components/Header.tsx`** - Header com botões de login/logout
4. **`server/_core/context.ts`** - Contexto seguro (sem chave mestra)
5. **`server/_core/oauth.ts`** - Rota de callback OAuth
6. **`server/_core/index.ts`** - Servidor com middlewares de segurança

---

## 🔄 Fluxo de Autenticação OAuth

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE LOGIN OAUTH                      │
└─────────────────────────────────────────────────────────────┘

1. Usuário clica em "Entrar" no Header
   ↓
2. Redireciona para getLoginUrl() que constrói:
   - URL: https://oauth.manus.im/app-auth
   - Params: appId, redirectUri, state
   ↓
3. Usuário faz login no Manus OAuth
   ↓
4. Manus redireciona para: /api/oauth/callback?code=...&state=...
   ↓
5. Backend troca code por token (exchangeCodeForToken)
   ↓
6. Backend obtém info do usuário (getUserInfo)
   ↓
7. Backend cria/atualiza usuário no banco (upsertUser)
   ↓
8. Backend cria session token (createSessionToken)
   ↓
9. Backend seta cookie de sessão (maxAge: 1 ano)
   ↓
10. Backend redireciona para / (home)
    ↓
11. Frontend detecta autenticação via useAuth()
    ↓
12. Se é admin, mostra botão "Painel Admin"
    ↓
13. Usuário clica em "Painel Admin" → /admin
    ↓
14. ProtectedRoute verifica permissões
    ↓
15. Se é admin, renderiza AdminLayout
```

---

## 🎯 Componentes Principais

### 1. **Login.tsx** - Página de Login

**Localização:** `client/src/pages/Login.tsx`

**Funcionalidade:**
- Mostra página de login com botão "Fazer Login com Manus"
- Redireciona para OAuth quando clicado
- Se já está autenticado, redireciona para /admin (admin) ou / (user)
- Mostra spinner enquanto carrega

**Fluxo:**
```
Usuário não autenticado
  ↓
Mostra página com botão "Fazer Login com Manus"
  ↓
Clica no botão
  ↓
Redireciona para getLoginUrl()
  ↓
Faz login no Manus
  ↓
Volta para /api/oauth/callback
  ↓
Cria sessão
  ↓
Redireciona para /
```

### 2. **ProtectedRoute.tsx** - Proteção de Rotas

**Localização:** `client/src/components/ProtectedRoute.tsx`

**Funcionalidade:**
- Protege rotas que requerem autenticação
- Verifica se usuário tem permissão (role)
- Redireciona para login se não autenticado
- Redireciona para home se não tem permissão

**Uso:**
```tsx
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

### 3. **Header.tsx** - Navegação Principal

**Localização:** `client/src/components/Header.tsx`

**Funcionalidade:**
- Mostra botão "Entrar" se não autenticado
- Mostra nome do usuário se autenticado
- Mostra botão "Painel Admin" se é admin
- Mostra botão "Sair" para fazer logout

**Estados:**
- Carregando: Mostra skeleton
- Não autenticado: Botão "Entrar"
- Autenticado (user): Nome + Botão "Sair"
- Autenticado (admin): Nome + "Painel Admin" + "Sair"

---

## 🔧 Configuração Necessária

### Variáveis de Ambiente

Certifique-se de que estas variáveis estão configuradas:

```bash
# OAuth
VITE_APP_ID=seu_app_id
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OAUTH_SERVER_URL=https://api.manus.im

# Banco de Dados
DATABASE_URL=mysql://app:app123@gourmet_db:3306/gourmet_saudavel

# Segurança
JWT_SECRET=sua_chave_secreta_de_32_caracteres_ou_mais
```

### Banco de Dados

Tabela `users` deve ter:

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  lastSignedIn TIMESTAMP DEFAULT NOW()
);
```

---

## 📝 Passo a Passo de Implementação

### Passo 1: Substituir Arquivos

Copie os seguintes arquivos do projeto para seu projeto:

```bash
# Frontend
cp client/src/pages/Login.tsx seu_projeto/client/src/pages/
cp client/src/components/ProtectedRoute.tsx seu_projeto/client/src/components/
cp client/src/components/Header.tsx seu_projeto/client/src/components/

# Backend
cp server/_core/context.ts seu_projeto/server/_core/
cp server/_core/oauth.ts seu_projeto/server/_core/
cp server/_core/index.ts seu_projeto/server/_core/
```

### Passo 2: Verificar Variáveis de Ambiente

```bash
# Abra .env e verifique:
echo $VITE_APP_ID
echo $VITE_OAUTH_PORTAL_URL
echo $OAUTH_SERVER_URL
echo $DATABASE_URL
echo $JWT_SECRET
```

### Passo 3: Criar Usuário Admin

Via phpMyAdmin ou SQL:

```sql
INSERT INTO users (openId, name, email, role, loginMethod, createdAt, updated_at, lastSignedIn)
VALUES ('admin-001', 'Seu Nome', 'seu-email@example.com', 'admin', 'manual', NOW(), NOW(), NOW());
```

### Passo 4: Reiniciar Servidor

```bash
npm run dev
```

### Passo 5: Testar Login

1. Abra http://localhost:3000/
2. Clique em "Entrar" no Header
3. Você será redirecionado para Manus OAuth
4. Faça login com sua conta Manus
5. Você será redirecionado de volta
6. Você deve ver seu nome no Header
7. Se é admin, clique em "Painel Admin"

---

## 🧪 Testes de Verificação

### Teste 1: Login Funciona

```bash
# 1. Abra http://localhost:3000/
# 2. Clique em "Entrar"
# 3. Você deve ser redirecionado para Manus OAuth
# 4. Faça login
# 5. Você deve voltar para home
# 6. Seu nome deve aparecer no Header
```

### Teste 2: Proteção de Rotas

```bash
# 1. Sem login, tente acessar http://localhost:3000/admin
# 2. Você deve ser redirecionado para /login
# 3. Faça login
# 4. Você deve conseguir acessar /admin
```

### Teste 3: Permissões

```bash
# 1. Crie um usuário com role='user'
# 2. Faça login com esse usuário
# 3. Tente acessar /admin
# 4. Você deve ser redirecionado para /
```

### Teste 4: Logout

```bash
# 1. Faça login
# 2. Clique em "Sair" no Header
# 3. Você deve ser desconectado
# 4. O Header deve mostrar "Entrar" novamente
```

---

## 🚨 Troubleshooting

### Problema: "Erro ao fazer login"

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
```bash
# Verifique as variáveis
echo $VITE_APP_ID
echo $VITE_OAUTH_PORTAL_URL

# Se vazias, configure em .env
VITE_APP_ID=seu_app_id
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
```

### Problema: "Usuário não encontrado após login"

**Causa:** Banco de dados não tem a tabela `users`

**Solução:**
```bash
# Execute as migrations
pnpm db:push
```

### Problema: "Não consigo acessar /admin"

**Causa:** Usuário não tem role='admin'

**Solução:**
```sql
UPDATE users SET role = 'admin' WHERE email = 'seu-email@example.com';
```

### Problema: "Cookie não está sendo setado"

**Causa:** HTTPS não está ativado em produção

**Solução:**
- Em desenvolvimento, funciona com HTTP
- Em produção, deve ser HTTPS
- Verifique `server/_core/cookies.ts`

### Problema: "Logout não funciona"

**Causa:** Cookie não está sendo deletado

**Solução:**
```bash
# Verifique se o cookie está sendo limpo
# Em browser, abra DevTools → Application → Cookies
# O cookie deve desaparecer após logout
```

---

## 📊 Estrutura de Dados

### Tabela `users`

```
id (int) - ID único
openId (varchar) - ID do Manus (chave única)
name (text) - Nome do usuário
email (varchar) - Email
loginMethod (varchar) - Método de login (manus, google, etc)
role (enum) - user ou admin
createdAt (timestamp) - Quando foi criado
updated_at (timestamp) - Última atualização
lastSignedIn (timestamp) - Último login
```

### Fluxo de Dados

```
OAuth Callback
  ↓
exchangeCodeForToken(code, state)
  ↓
getUserInfo(accessToken)
  ↓
upsertUser({openId, name, email, ...})
  ↓
createSessionToken(openId, {...})
  ↓
setcookie(COOKIE_NAME, token, {...})
  ↓
redirect(/)
```

---

## ✅ Checklist Final

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado (`pnpm db:push`)
- [ ] Usuário admin criado
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Acesso a /admin protegido
- [ ] Permissões funcionando

---

## 📚 Referências

- [Manus OAuth Documentation](https://docs.manus.im/oauth)
- [tRPC Documentation](https://trpc.io/)
- [Express OAuth Pattern](https://expressjs.com/)

---

**Última atualização:** 2024-12-01  
**Versão:** 1.0  
**Status:** ✅ Pronto para produção
